import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const auth = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return Response.json({ok:false,error:'SUPABASE_ENV_MISSING'},{status:503});
  const supabase = createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const { data: sources, error } = await supabase.from('sources').select('id,url,enabled,seller_id').eq('enabled',true);
  if (error) return Response.json({ok:false,error:'SOURCE_LIST_FAILED',detail:error.message},{status:500});
  const results=[];
  for(const source of sources ?? []) {
    const started=Date.now();
    try {
      const response=await fetch(source.url,{redirect:'follow',headers:{'user-agent':'Cross-Border-Seller-Radar/0.3'},cache:'no-store'});
      if(!response.ok) throw new Error(`HTTP_${response.status}`);
      const finalUrl=response.url;
      if(!finalUrl.startsWith('https://')) throw new Error('NON_HTTPS_FINAL_URL');
      const text=await response.text();
      if(!text.trim()) throw new Error('EMPTY_SOURCE');
      const normalized=text.replace(/\r\n?/g,'\n').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().toLowerCase();
      const hashBuffer=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(normalized));
      const hash=Array.from(new Uint8Array(hashBuffer)).map(b=>b.toString(16).padStart(2,'0')).join('');
      const {data: previous}=await supabase.from('source_states').select('content_hash').eq('source_id',source.id).maybeSingle();
      const status=!previous?'BASELINE_CREATED':previous.content_hash===hash?'UNCHANGED':'UPDATED';
      if(status==='UPDATED') await supabase.from('review_events').insert({seller_id:source.seller_id,source_id:source.id,status:'UPDATED',evidence_url:finalUrl});
      if(status!=='UNCHANGED') {
        const {error: stateError}=await supabase.from('source_states').upsert({source_id:source.id,content_hash:hash,checked_at:new Date().toISOString(),final_url:finalUrl},{onConflict:'source_id'});
        if(stateError) throw new Error(`STATE_COMMIT_FAILED: ${stateError.message}`);
      }
      results.push({source_id:source.id,status,duration_ms:Date.now()-started});
    } catch(e) {
      results.push({source_id:source.id,status:'FETCH_ERROR',error:String(e),duration_ms:Date.now()-started});
    }
  }
  return Response.json({ok:true,checked_at:new Date().toISOString(),results});
}
