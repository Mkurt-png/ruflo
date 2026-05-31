-- Tickra · Battle mode (synchronous 1v1 Pro quizzes).
-- Idempotent — safe to re-run.

create table if not exists tickra_battles (
  id              uuid primary key default gen_random_uuid(),
  host_email      text not null references tickra_users(email) on delete cascade,
  guest_email     text references tickra_users(email) on delete set null,
  status          text not null check (status in ('waiting', 'active', 'finished')) default 'waiting',
  questions       jsonb not null,
  current_index   integer not null default 0,
  host_answers    jsonb not null default '[]'::jsonb,
  guest_answers   jsonb not null default '[]'::jsonb,
  host_times      jsonb not null default '[]'::jsonb,
  guest_times     jsonb not null default '[]'::jsonb,
  created_at      timestamptz not null default now(),
  started_at      timestamptz,
  finished_at     timestamptz
);

create index if not exists tickra_battles_host_idx  on tickra_battles (host_email);
create index if not exists tickra_battles_guest_idx on tickra_battles (guest_email);
create index if not exists tickra_battles_status_idx on tickra_battles (status);

-- RLS: server-side service-role bypasses RLS, but enable it so client SDK
-- cannot read/write directly. All access funnels through API routes that
-- enforce host_email/guest_email via the session cookie.
alter table tickra_battles enable row level security;

-- No policies = no anon/auth client access. Service role still has full access.
