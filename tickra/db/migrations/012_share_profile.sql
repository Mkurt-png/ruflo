-- Public share profile fields (LinkedIn-style flex page at /u/<slug>).
-- All columns idempotent; safe to re-run.

alter table tickra_users
  add column if not exists share_slug    text unique,
  add column if not exists share_public  boolean not null default false,
  add column if not exists share_stats   jsonb;

create index if not exists tickra_users_share_slug_idx
  on tickra_users(share_slug)
  where share_public = true;
