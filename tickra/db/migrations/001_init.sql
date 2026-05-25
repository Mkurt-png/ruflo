-- Tickra · initial schema
-- Run against your Supabase project once. Idempotent — safe to re-apply.

create table if not exists tickra_users (
  email           text primary key,
  created_at      timestamptz not null default now(),
  stripe_customer text,                                  -- cus_…
  plan            text check (plan in ('free','pro','lifetime')) default 'free',
  cycle           text check (cycle in ('monthly','annual','once')),
  current_period_end timestamptz
);

create table if not exists tickra_progress (
  email      text not null references tickra_users(email) on delete cascade,
  lesson_id  text not null,
  completed_at timestamptz not null default now(),
  primary key (email, lesson_id)
);

create index if not exists tickra_progress_email_idx on tickra_progress(email);

-- RLS posture: rows are read/written only by the service role (server). The
-- client never touches Supabase directly in Tickra.
alter table tickra_users enable row level security;
alter table tickra_progress enable row level security;
