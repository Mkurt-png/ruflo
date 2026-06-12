-- Weekly digest opt-in + last-sent tracking. Idempotent.
alter table tickra_users
  add column if not exists weekly_digest_opt_in boolean not null default true,
  add column if not exists last_digest_at       timestamptz;

create index if not exists tickra_users_digest_optin_idx
  on tickra_users(weekly_digest_opt_in)
  where weekly_digest_opt_in = true;
