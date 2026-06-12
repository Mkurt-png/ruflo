-- Tickra · single-use nonces for magic-link tokens.
-- Closes the replay window: a leaked or pre-fetched magic link can no longer
-- be exchanged twice. See src/app/api/auth/magic-link/route.ts and
-- src/app/api/auth/callback/route.ts.

create table if not exists tickra_magic_nonces (
  nonce       text primary key,
  email       text not null,
  expires_at  timestamptz not null,
  used_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists tickra_magic_nonces_email_idx
  on tickra_magic_nonces(email);

-- We don't want stale rows growing forever — caller should run a cleanup job
-- (or just rely on Supabase's manual prune). Optional helper:
create or replace function tickra_magic_nonces_cleanup()
returns void
language sql
security definer
as $$
  delete from tickra_magic_nonces where created_at < now() - interval '7 days';
$$;
