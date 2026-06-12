-- Tickra · per-user daily quota for the AskTickra IA chat.
-- Run against your Supabase SQL Editor. Idempotent — safe to re-run.

create table if not exists tickra_ai_usage (
  email   text not null references tickra_users(email) on delete cascade,
  day     date not null,
  count   integer not null default 0,
  primary key (email, day)
);

create index if not exists tickra_ai_usage_day_idx on tickra_ai_usage(day);
