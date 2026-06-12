-- Tickra · Paper-trading simulator state (multi-device persistence).
-- Replaces the localStorage `tickra-simulator-v1` blob with a server-of-record.
-- Idempotent — safe to re-run.

create table if not exists tickra_sim_accounts (
  email       text primary key references tickra_users(email) on delete cascade,
  balance     numeric not null default 10000,
  updated_at  timestamptz not null default now()
);

alter table tickra_sim_accounts enable row level security;
-- No policies = no anon/auth client access. Service-role bypasses RLS.

create table if not exists tickra_sim_trades (
  id            uuid primary key default gen_random_uuid(),
  email         text not null references tickra_users(email) on delete cascade,
  status        text not null check (status in ('open', 'closed')),
  symbol        text not null,
  side          text not null check (side in ('long', 'short')),
  size          numeric not null,
  entry         numeric not null,
  current       numeric not null,
  stop_pips     integer not null,
  tp_pips       integer not null,
  opened_at     timestamptz not null default now(),
  closed_at     timestamptz,
  close_reason  text check (close_reason in ('tp', 'sl', 'manual')),
  pnl           numeric
);

create index if not exists tickra_sim_trades_email_status_idx
  on tickra_sim_trades (email, status);

alter table tickra_sim_trades enable row level security;
-- No policies = service-role only.
