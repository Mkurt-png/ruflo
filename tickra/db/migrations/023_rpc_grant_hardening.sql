-- TICKRA-FIX(security): four SECURITY DEFINER functions were callable by anyone
-- holding the project's anon key.
--
-- Each of these runs as its owner and therefore bypasses row-level security by
-- design — that is the point of SECURITY DEFINER, and it is correct for the
-- service-role client that calls them. What was wrong is who else could call
-- them.
--
-- Three of the four already carried `revoke all ... from public`. That is not
-- enough on Supabase. Supabase grants EXECUTE to the `anon` and `authenticated`
-- roles explicitly, not through PUBLIC, so revoking PUBLIC leaves those grants
-- standing, and PostgREST publishes every function in the public schema at
-- /rest/v1/rpc/<name>. The anon key is designed to be shipped to browsers.
-- Migration 021 hit exactly this on the leaderboard view; these are the same
-- mistake on functions.
--
-- What an anon caller could do before this migration:
--
--   tickra_magic_nonces_cleanup()   — had no revoke at all. Deletes pending
--                                     sign-in nonces, so calling it in a loop
--                                     breaks sign-in for everyone mid-flow:
--                                     their link reports itself expired.
--   tickra_rate_limit_hit(k, w)     — increments any bucket by key. Burn the
--                                     magic-link bucket for a chosen address
--                                     and that person cannot request a link;
--                                     burn the IP buckets and the throttle
--                                     turns into the outage.
--   tickra_rate_limits_prune()      — clears the buckets, i.e. removes the
--                                     throttle before an abuse run.
--   tickra_ai_usage_increment(k, d) — inflates or resets AI quota counters,
--                                     which are what caps spend per user.
--
-- None of these are reachable from the app by any route: every call goes
-- through the service-role client, which is server-side only and unaffected by
-- grants. Revoking costs nothing and closes all four.
--
-- Idempotent — safe to re-run.

revoke all on function tickra_magic_nonces_cleanup()
  from public, anon, authenticated;

revoke all on function tickra_rate_limit_hit(text, integer)
  from public, anon, authenticated;

revoke all on function tickra_rate_limits_prune()
  from public, anon, authenticated;

revoke all on function tickra_ai_usage_increment(text, date)
  from public, anon, authenticated;

-- Catch-all: any other tickra_* routine in the public schema, including ones
-- added later that forget the revoke. Skips the four above harmlessly.
do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname like 'tickra%'
  loop
    execute format('revoke all on function %s from public, anon, authenticated', r.sig);
  end loop;
end $$;

-- Verification (run by hand after applying; both should return zero rows).
--
--   -- 1. No tickra_* function executable by anon or authenticated:
--   select p.proname, a.grantee
--   from pg_proc p
--   join pg_namespace n on n.oid = p.pronamespace
--   cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
--   where n.nspname = 'public'
--     and p.proname like 'tickra%'
--     and a.grantee::regrole::text in ('anon', 'authenticated')
--     and a.privilege_type = 'EXECUTE';
--
--   -- 2. Nothing granted to anon/authenticated on any tickra_* table either
--   --    (this is migration 021's check, repeated because it is the same class
--   --    of mistake and worth confirming together):
--   select table_name, grantee, privilege_type
--   from information_schema.role_table_grants
--   where table_schema = 'public'
--     and table_name like 'tickra%'
--     and grantee in ('anon', 'authenticated');
