-- Tickra · atomic increment for the AskTickra daily quota.
-- Closes the read-then-upsert race condition (see TICKRA-FIX in
-- src/lib/ai/quota.ts).

create or replace function tickra_ai_usage_increment(
  p_email text,
  p_day   date
)
returns integer
language plpgsql
security definer
as $$
declare
  v_count integer;
begin
  insert into tickra_ai_usage (email, day, count)
  values (p_email, p_day, 1)
  on conflict (email, day)
  do update set count = tickra_ai_usage.count + 1
  returning count into v_count;
  return v_count;
end;
$$;

revoke all on function tickra_ai_usage_increment(text, date) from public;
-- service_role bypasses RLS and can call this; that's the only caller we want.
