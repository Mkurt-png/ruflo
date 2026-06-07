-- Phase 5B · Trade Journal (Pro/Lifetime feature).
-- One row per logged trade. Open trades have exit_price/closed_at NULL.
-- Risk multiple (R) is recorded manually on close so users can grade
-- discipline regardless of how they sized the position.
-- RLS enabled; access through the service-role client only.

create table if not exists tickra_trade_journal (
  id           uuid primary key default gen_random_uuid(),
  email        text not null references tickra_users(email) on delete cascade,
  pair         text not null,
  side         text not null check (side in ('long','short')),
  entry_price  numeric not null,
  exit_price   numeric,
  size         numeric not null default 1,
  stop_loss    numeric,
  take_profit  numeric,
  risk_r       numeric,
  pnl          numeric,
  notes        text,
  screenshot_url text,
  opened_at    timestamptz not null default now(),
  closed_at    timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists tickra_trade_journal_email_idx
  on tickra_trade_journal(email, opened_at desc);

create index if not exists tickra_trade_journal_open_idx
  on tickra_trade_journal(email)
  where closed_at is null;

alter table tickra_trade_journal enable row level security;
