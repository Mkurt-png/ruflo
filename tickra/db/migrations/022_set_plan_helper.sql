-- Operational helper: grant, extend or revoke a paid plan, safely.
--
-- Why this exists. There is no admin UI, and there does not need to be one —
-- Stripe and the Supabase table editor cover almost everything. But there is
-- one case they cover badly, and it is a launch-day case:
--
--   a payment succeeds and the webhook does not land.
--
-- The customer has paid and has nothing. The only recourse today is hand-editing
-- a row in the table editor, live, with an unhappy customer waiting — which is
-- exactly when the wrong column gets edited. Three fields have to move together
-- and stay consistent (`plan`, `cycle`, `current_period_end`), and
-- `current_period_end` is the one that matters most: `resolveEffectivePlan`
-- reads it to decide when access lapses, and a null there means "keep Pro
-- forever".
--
-- So: one call, one line, and the invariants enforced in the database rather
-- than remembered by whoever is typing at the time.
--
--   select tickra_set_plan('someone@example.com', 'pro', 1);   -- 1 month
--   select tickra_set_plan('someone@example.com', 'pro', 12);  -- 1 year
--   select tickra_set_plan('someone@example.com', 'lifetime'); -- never expires
--   select tickra_set_plan('someone@example.com', 'free');     -- revoke
--
-- Returns the row as it now stands, so the result is the confirmation.
--
-- Deliberately NOT exposed to the web app: it is owned by postgres and only
-- reachable from the SQL editor or a service-role connection. There is no HTTP
-- route that can reach it, so it adds no attack surface to the site.

create or replace function tickra_set_plan(
  p_email  text,
  p_plan   text,
  p_months integer default null
)
returns table (email text, plan text, cycle text, current_period_end timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_period_end timestamptz;
  v_cycle      text;
begin
  if p_plan not in ('free', 'pro', 'lifetime') then
    raise exception 'plan must be free, pro or lifetime (got %)', p_plan;
  end if;

  -- Fail loudly on an unknown address. A silent no-op here is the failure mode
  -- that costs the most: you believe the customer is fixed and they are not.
  if not exists (select 1 from tickra_users u where u.email = p_email) then
    raise exception 'no user with email % — check for a typo', p_email;
  end if;

  if p_plan = 'pro' then
    if p_months is null or p_months < 1 then
      raise exception 'pro requires p_months >= 1, so access has an end date';
    end if;
    v_period_end := now() + (p_months || ' months')::interval;
    -- Mirrors the shape the Stripe webhook writes, so the two paths agree.
    v_cycle := case when p_months >= 12 then 'annual' else 'monthly' end;
  elsif p_plan = 'lifetime' then
    -- Nothing to renew; the entitlement code never expires a lifetime plan.
    v_period_end := null;
    v_cycle := 'once';
  else
    v_period_end := null;
    v_cycle := null;
  end if;

  update tickra_users u
     set plan               = p_plan,
         cycle              = v_cycle,
         current_period_end = v_period_end
   where u.email = p_email;

  return query
    select u.email, u.plan, u.cycle, u.current_period_end
      from tickra_users u
     where u.email = p_email;
end;
$$;

-- Service-role and the SQL editor only. `anon` and `authenticated` must never
-- be able to grant themselves Pro.
revoke all on function tickra_set_plan(text, text, integer) from public, anon, authenticated;
