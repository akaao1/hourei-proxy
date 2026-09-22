create extension if not exists pgcrypto;

create table if not exists public.sellers (
  id uuid primary key default gen_random_uuid(),
  alias text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.sources (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.sellers(id) on delete cascade,
  url text not null,
  label text,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  unique(seller_id,url)
);

create table if not exists public.skus (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.sellers(id) on delete cascade,
  sku text not null,
  product_name text not null,
  destination text,
  hs_code text,
  category text,
  matching_terms text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique(seller_id,sku)
);

create table if not exists public.source_states (
  source_id uuid primary key references public.sources(id) on delete cascade,
  content_hash text not null,
  checked_at timestamptz not null,
  final_url text not null
);

create table if not exists public.review_events (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.sellers(id) on delete cascade,
  source_id uuid references public.sources(id) on delete set null,
  status text not null check(status in ('REVIEW_REQUIRED','FETCH_ERROR','UNCHANGED','BASELINE_CREATED','UPDATED')),
  sku_id uuid references public.skus(id) on delete set null,
  evidence_url text,
  matched_terms text[] not null default '{}',
  error_text text,
  occurred_at timestamptz not null default now()
);

create table if not exists public.pilot_measurements (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.sellers(id) on delete cascade,
  run_count integer not null default 0,
  alerts_seen integer not null default 0,
  alerts_opened integer not null default 0,
  action_taken boolean,
  action_description text,
  minutes_saved numeric,
  money_risk_or_value_jpy numeric,
  would_repeat boolean,
  would_pay boolean,
  monthly_price_tested_jpy numeric,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.sellers enable row level security;
alter table public.sources enable row level security;
alter table public.skus enable row level security;
alter table public.source_states enable row level security;
alter table public.review_events enable row level security;
alter table public.pilot_measurements enable row level security;
