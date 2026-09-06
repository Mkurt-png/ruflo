-- TICKRA-FIX(security): the weekly leaderboard view leaked every user's email.
--
-- Two problems, both invisible from the app because the app only ever talks to
-- Postgres with the service-role key:
--
--   1. A Postgres view runs with its OWNER's privileges by default, so it reads
--      straight through the row-level security on tickra_progress and
--      tickra_users. Migration 019 turned RLS on for every table; the view was
--      a hole around it.
--
--   2. Supabase grants the `anon` and `authenticated` roles SELECT on objects in
--      the public schema, and PostgREST publishes them at /rest/v1/. So anyone
--      holding the project's anon key — a value designed to be public — could
--      read `tickra_leaderboard_weekly` directly and get the email of every
--      user who has ever completed a lesson, alongside their streak.
--
-- The view's own header comment claimed "The view never exposes email — callers
-- filter or hash separately". The callers do hash it (lib/db/leaderboard-queries
-- anonymises before returning), but the view itself selects email as its first
-- column. The comment described the API, not the view.
--
-- Idempotent — safe to re-run.

-- 1. Run the view as the caller, so RLS on the underlying tables applies.
--    Postgres 15+; Supabase is well past that.
alter view tickra_leaderboard_weekly set (security_invoker = true);

-- 2. Belt and braces: take the grants away entirely. Nothing but the
--    service-role client is supposed to read this, and that role bypasses both
--    grants and RLS.
revoke all on tickra_leaderboard_weekly from anon, authenticated;

-- Same treatment for every base table, in case a future migration or a manual
-- fix in the dashboard ever re-grants them. RLS already blocks these roles;
-- removing the grant means a mistake in one layer is not enough on its own.
do $$
declare t record;
begin
  for t in
    select tablename from pg_tables
    where schemaname = 'public' and tablename like 'tickra%'
  loop
    execute format('revoke all on public.%I from anon, authenticated', t.tablename);
  end loop;
end $$;
