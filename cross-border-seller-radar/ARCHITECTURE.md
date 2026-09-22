# Cross-Border Seller Radar — cloud bootstrap

This directory is intentionally isolated from the existing hourei-proxy application. It records the cloud integration boundary for the Cross-Border Seller Radar pilot.

## Hard gate

Do not add billing, LLM classification, marketplace connectors, or broad compliance automation before real-seller validation.

Current commercial gate:
- 10 real sellers run a pilot
- 5 run it twice
- 3 keep monitoring enabled
- 1 pays a recurring pilot fee
- 1 alert causes a documented real action

## Cloud boundary

```text
Vercel / Next.js
  ├─ seller-facing review inbox
  └─ protected daily cron
          │
          ▼
      Supabase
  ├─ sellers
  ├─ sources
  ├─ skus
  ├─ source_states
  ├─ review_events
  └─ pilot_measurements
```

The cron route must use `CRON_SECRET` and the Supabase service-role key only on the server. No service-role credential belongs in browser code.

## Safety boundary

The system may say:

`REVIEW_REQUIRED — official source changed and seller-owned term matched.`

It must not automatically say:

`COMPLIANT`, `NON_COMPLIANT`, `LEGAL`, or any equivalent legal conclusion.

`FETCH_ERROR` must remain distinct from `UNCHANGED`.

## Source-state transaction rule

A new source hash must not be committed until downstream catalog processing succeeds. A failed run therefore remains retryable instead of consuming a real change.

## Vercel

The intended production schedule is one daily protected cron while the pilot is small. The schedule can be tightened only after real value is demonstrated.
