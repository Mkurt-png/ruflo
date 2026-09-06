-- 019_rls_hardening.sql
--
-- TICKRA-FIX(security): close the RLS gap on the six tables that were created
-- after 001_init without an `enable row level security` line.
--
-- Why it matters: the browser bundle can carry NEXT_PUBLIC_SUPABASE_ANON_KEY
-- (the Battle realtime client needs it). With RLS off, that key grants direct
-- read/write on these tables from any browser, bypassing the API entirely:
--
--   tickra_magic_nonces  -> read a live sign-in nonce = account takeover
--   tickra_user_plan     -> write yourself a 'lifetime' plan for free
--   tickra_ai_usage      -> reset your own counter, bypass the AI quota
--   tickra_referrals     -> forge referral conversions
--   tickra_notifications -> read other users' notifications
--   tickra_stripe_events -> tamper with billing idempotency guards
--
-- Posture is identical to the rest of Tickra: RLS ON with **no policies**.
-- Server code uses SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS, so nothing
-- server-side changes. Anonymous/authenticated clients get denied by default.

alter table tickra_magic_nonces  enable row level security;
alter table tickra_user_plan     enable row level security;
alter table tickra_ai_usage      enable row level security;
alter table tickra_referrals     enable row level security;
alter table tickra_notifications enable row level security;
alter table tickra_stripe_events enable row level security;

-- Rate-limit buckets (see 020) are created with RLS already on.
