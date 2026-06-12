-- Tickra · profile fields for the settings space
-- Run against your Supabase SQL Editor. Idempotent — safe to re-run.

alter table tickra_users
  add column if not exists display_name text,
  add column if not exists avatar_url   text,
  add column if not exists locale       text check (locale in ('fr','en')),
  add column if not exists theme        text check (theme in ('light','dark'));
