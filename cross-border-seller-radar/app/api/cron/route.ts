import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

function normalize(input: string) {
  return input
    .replace(/\r\n?/g, '\n')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function assertSafeFinalUrl(value: string) {
  const parsed = new URL(value);
  if (parsed.protocol !== 'https:') throw new Error('NON_HTTPS_FINAL_URL');
  const hostname = parsed.hostname.toLowerCase();
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    /^10\./.test(hostname) ||
    /^192\.168\./.test(hostname) ||
    /^169\.254\./.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)
  ) {
    throw new Error('PRIVATE_OR_LOCAL_FINAL_URL');
  }
}

async function sha256(input: string) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function GET(request: Request) {
  const auth = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return Response.json({ ok: false, error: 'SUPABASE_ENV_MISSING' }, { status: 503 });
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: sources, error } = await supabase
    .from('sources')
    .select('id,url,enabled,seller_id')
    .eq('enabled', true);

  if (error) {
    return Response.json(
      { ok: false, error: 'SOURCE_LIST_FAILED', detail: error.message },
      { status: 500 },
    );
  }

  const results: Array<Record<string, unknown>> = [];

  for (const source of sources ?? []) {
    const started = Date.now();

    try {
      const requestedUrl = new URL(source.url);
      if (requestedUrl.protocol !== 'https:') throw new Error('NON_HTTPS_SOURCE_URL');

      const response = await fetch(requestedUrl, {
        redirect: 'follow',
        headers: { 'user-agent': 'Cross-Border-Seller-Radar/0.3' },
        cache: 'no-store',
      });

      if (!response.ok) throw new Error(`HTTP_${response.status}`);

      const finalUrl = response.url;
      assertSafeFinalUrl(finalUrl);

      const text = await response.text();
      if (!text.trim()) throw new Error('EMPTY_SOURCE');
      if (text.length > 10_000_000) throw new Error('SOURCE_TOO_LARGE');

      const normalized = normalize(text);
      if (!normalized) throw new Error('EMPTY_NORMALIZED_SOURCE');
      const hash = await sha256(normalized);

      const [{ data: previous, error: previousError }, { data: skus, error: skuError }] =
        await Promise.all([
          supabase.from('source_states').select('content_hash').eq('source_id', source.id).maybeSingle(),
          supabase
            .from('skus')
            .select('id,sku,product_name,matching_terms')
            .eq('seller_id', source.seller_id),
        ]);

      if (previousError) throw new Error(`STATE_READ_FAILED: ${previousError.message}`);
      if (skuError) throw new Error(`SKU_READ_FAILED: ${skuError.message}`);

      const status = !previous
        ? 'BASELINE_CREATED'
        : previous.content_hash === hash
          ? 'UNCHANGED'
          : 'UPDATED';

      if (status === 'UPDATED') {
        const matches = (skus ?? [])
          .map((sku) => ({
            sku,
            terms: (sku.matching_terms ?? []).filter((term: string) =>
              normalized.includes(term.toLowerCase()),
            ),
          }))
          .filter(({ terms }) => terms.length > 0);

        if (matches.length > 0) {
          const { error: reviewError } = await supabase.from('review_events').insert(
            matches.map(({ sku, terms }) => ({
              seller_id: source.seller_id,
              source_id: source.id,
              sku_id: sku.id,
              status: 'REVIEW_REQUIRED',
              evidence_url: finalUrl,
              matched_terms: terms,
            })),
          );
          if (reviewError) throw new Error(`REVIEW_EVENT_FAILED: ${reviewError.message}`);
        } else {
          const { error: updateError } = await supabase.from('review_events').insert({
            seller_id: source.seller_id,
            source_id: source.id,
            status: 'UPDATED',
            evidence_url: finalUrl,
          });
          if (updateError) throw new Error(`UPDATE_EVENT_FAILED: ${updateError.message}`);
        }
      }

      // Commit the new source state only after downstream processing succeeded.
      if (status !== 'UNCHANGED') {
        const { error: stateError } = await supabase.from('source_states').upsert(
          {
            source_id: source.id,
            content_hash: hash,
            checked_at: new Date().toISOString(),
            final_url: finalUrl,
          },
          { onConflict: 'source_id' },
        );
        if (stateError) throw new Error(`STATE_COMMIT_FAILED: ${stateError.message}`);
      }

      results.push({
        source_id: source.id,
        status,
        duration_ms: Date.now() - started,
      });
    } catch (error) {
      results.push({
        source_id: source.id,
        status: 'FETCH_ERROR',
        error: String(error),
        duration_ms: Date.now() - started,
      });
    }
  }

  return Response.json({
    ok: true,
    checked_at: new Date().toISOString(),
    results,
  });
}
