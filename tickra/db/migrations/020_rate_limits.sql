-- 020_rate_limits.sql
--
-- TICKRA-FIX(security): generic fixed-window rate-limit buckets.
--
-- Motivation: /api/auth/magic-link had no throttle, so anyone could loop it and
-- send unlimited mail to any address *through our Resend domain* — burning the
-- quota and getting the sending domain flagged as spam.
--
-- One row per (key, window). `key` is caller-defined, e.g.
--   'magic:email:foo@bar.com'  or  'magic:ip:203.0.113.7'.

create table if not exists tickra_rate_limits (
  key           text        not null,
  window_start  timestamptz not null,
  count         integer     not null default 0,
  primary key (key, window_start)
);

create index if not exists tickra_rate_limits_window_idx
  on tickra_rate_limits(window_start);

-- Same posture as the rest of Tickra: service-role only, no client access.
alter table tickra_rate_limits enable row level security;

-- Atomic bump. Returns the count *after* incrementing, so the caller compares
-- it against its own limit. Fixed window: the bucket is derived by flooring
-- now() to p_window_seconds, which keeps this a single round-trip with no race.
create or replace function tickra_rate_limit_hit(
  p_key             text,
  p_window_seconds  integer
)
returns integer
language plpgsql
security definer
as $$
declare
  v_window timestamptz;
  v_count  integer;
begin
  v_window := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );

  insert into tickra_rate_limits (key, window_start, count)
  values (p_key, v_window, 1)
  on conflict (key, window_start)
  do update set count = tickra_rate_limits.count + 1
  returning count into v_count;

  return v_count;
end;
$$;

revoke all on function tickra_rate_limit_hit(text, integer) from public;

-- Housekeeping: drop buckets older than a day so the table stays small.
create or replace function tickra_rate_limits_prune()
returns void
language sql
security definer
as $$
  delete from tickra_rate_limits where window_start < now() - interval '1 day';
$$;

revoke all on function tickra_rate_limits_prune() from public;
