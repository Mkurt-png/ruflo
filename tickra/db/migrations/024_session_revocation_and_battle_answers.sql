-- 024_session_revocation_and_battle_answers.sql
--
-- Two things that need the database to be the one deciding.
-- Idempotent — safe to re-run. The app works with or without it applied:
-- until it is, sessions are not revocable and battles keep the old path.
--
-- ─── A. Session revocation ────────────────────────────────────────────────
--
-- Sessions are a signed cookie, `base64(email.expiresAt).hmac`, valid 7 days.
-- Nothing on the server remembered them, so nothing could take one back:
-- signing out cleared the cookie in THAT browser, and a copy — from a shared
-- computer, a synced profile, malware — stayed valid for the rest of the
-- week. Deleting an account did not end its sessions either; the next
-- request from a still-valid cookie recreated the row.
--
-- Two lists, checked together in one call:
--   tickra_revoked_sessions      one cookie, by hash    ← sign-out
--   tickra_session_revocations   every cookie for an    ← account deletion
--                                address issued before
--                                a moment
--
-- The cookie format is unchanged. Every issuer uses the same 7-day lifetime,
-- so the moment a cookie was issued is exactly expiresAt − 7 days; existing
-- sessions keep working and nobody is signed out by this deploy.

create table if not exists tickra_revoked_sessions (
  token_hash  text        primary key,   -- sha256 of the cookie value, hex
  expires_at  timestamptz not null       -- after this the cookie is dead anyway
);
create index if not exists tickra_revoked_sessions_expiry_idx
  on tickra_revoked_sessions (expires_at);
alter table tickra_revoked_sessions enable row level security;

-- Keyed by address, not a foreign key to tickra_users: it must outlive the
-- user row, which account deletion removes.
create table if not exists tickra_session_revocations (
  email           text        primary key,
  revoked_before  timestamptz not null
);
alter table tickra_session_revocations enable row level security;

create or replace function tickra_session_valid(
  p_email      text,
  p_issued_at  timestamptz,
  p_token_hash text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (
           select 1 from tickra_revoked_sessions where token_hash = p_token_hash
         )
     and not exists (
           select 1 from tickra_session_revocations
           where email = p_email and p_issued_at < revoked_before
         );
$$;

create or replace function tickra_revoke_session(
  p_token_hash text,
  p_expires_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into tickra_revoked_sessions (token_hash, expires_at)
  values (p_token_hash, p_expires_at)
  on conflict (token_hash) do nothing;
  -- Housekeeping: an expired cookie needs no entry.
  delete from tickra_revoked_sessions where expires_at < now();
end;
$$;

create or replace function tickra_revoke_all_sessions(p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into tickra_session_revocations (email, revoked_before)
  values (p_email, now())
  on conflict (email) do update set revoked_before = now();
  -- A cut-off older than the session lifetime can no longer match anything.
  delete from tickra_session_revocations where revoked_before < now() - interval '8 days';
end;
$$;

-- ─── B. Battle answers, atomically and timed by the server ───────────────
--
-- submitAnswer read the row, decided in JavaScript, then wrote it back. When
-- both players answered the same question at the same moment — which the 20 s
-- timer makes likely, since both clients time out together — each read the
-- row before the other's write, each concluded the opponent had not answered,
-- and neither advanced `current_index`. The battle stayed on that question
-- for good.
--
-- The time used for the speed tie-breaker was whatever the browser sent,
-- clamped to 0–25 s. Sending 0 won every tie.
--
-- This function takes the row lock, so the two answers are applied one after
-- the other and the second sees the first; and it measures the time itself,
-- from when the question became current.

alter table tickra_battles
  add column if not exists question_started_at timestamptz;

create or replace function tickra_battle_answer(
  p_id     uuid,
  p_side   text,
  p_index  integer,
  p_answer integer
)
returns tickra_battles
language plpgsql
security definer
set search_path = public
as $$
declare
  b         tickra_battles%rowtype;
  v_answers jsonb;
  v_times   jsonb;
  v_other   jsonb;
  v_ms      integer;
  v_both    boolean;
begin
  if p_side not in ('host', 'guest') then
    raise exception 'invalid side %', p_side;
  end if;

  select * into b from tickra_battles where id = p_id for update;
  if not found then
    return null;
  end if;
  -- Not this question's turn, or over: return the row unchanged.
  if b.status <> 'active' or p_index <> b.current_index then
    return b;
  end if;

  v_answers := case when p_side = 'host' then b.host_answers else b.guest_answers end;
  v_times   := case when p_side = 'host' then b.host_times   else b.guest_times   end;
  v_other   := case when p_side = 'host' then b.guest_answers else b.host_answers end;

  while jsonb_array_length(v_answers) <= p_index loop
    v_answers := v_answers || 'null'::jsonb;
  end loop;
  while jsonb_array_length(v_times) <= p_index loop
    v_times := v_times || 'null'::jsonb;
  end loop;

  -- Answers are final: a second submit for the same question changes nothing.
  if jsonb_typeof(v_answers -> p_index) <> 'null' then
    return b;
  end if;

  -- Question 0 starts when the guest joins (started_at); later ones when the
  -- index advances. Battles begun before this migration have no
  -- question_started_at and fall back to started_at, which only ever clamps
  -- to the maximum — a tie on time, never an advantage.
  v_ms := least(
    25000,
    greatest(
      0,
      (extract(epoch from (now() - coalesce(b.question_started_at, b.started_at, now()))) * 1000)::integer
    )
  );

  v_answers := jsonb_set(v_answers, array[p_index::text], to_jsonb(p_answer));
  v_times   := jsonb_set(v_times,   array[p_index::text], to_jsonb(v_ms));

  v_both := jsonb_array_length(v_other) > p_index
        and jsonb_typeof(v_other -> p_index) <> 'null';

  if p_side = 'host' then
    b.host_answers := v_answers;
    b.host_times   := v_times;
  else
    b.guest_answers := v_answers;
    b.guest_times   := v_times;
  end if;

  if v_both then
    if p_index + 1 >= jsonb_array_length(b.questions) then
      b.status      := 'finished';
      b.finished_at := now();
    else
      b.current_index       := p_index + 1;
      b.question_started_at := now();
    end if;
  end if;

  update tickra_battles set
    host_answers        = b.host_answers,
    host_times          = b.host_times,
    guest_answers       = b.guest_answers,
    guest_times         = b.guest_times,
    current_index       = b.current_index,
    status              = b.status,
    finished_at         = b.finished_at,
    question_started_at = b.question_started_at
  where id = p_id
  returning * into b;

  return b;
end;
$$;

-- ─── Grants ──────────────────────────────────────────────────────────────
--
-- Service role only, like every tickra_* function (see 023). Revoking from
-- `public` alone is not enough on Supabase: anon and authenticated are granted
-- EXECUTE explicitly, and PostgREST publishes public-schema functions at
-- /rest/v1/rpc/ — tickra_revoke_all_sessions would otherwise be a public
-- "sign anyone out" button.
revoke all on function tickra_session_valid(text, timestamptz, text)       from public, anon, authenticated;
revoke all on function tickra_revoke_session(text, timestamptz)            from public, anon, authenticated;
revoke all on function tickra_revoke_all_sessions(text)                    from public, anon, authenticated;
revoke all on function tickra_battle_answer(uuid, text, integer, integer)  from public, anon, authenticated;

-- Verification (expect zero rows):
--   select p.oid::regprocedure, a.grantee::regrole
--   from pg_proc p
--   join pg_namespace n on n.oid = p.pronamespace
--   cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
--   where n.nspname = 'public' and p.proname like 'tickra%'
--     and a.grantee in (0::oid, 'anon'::regrole::oid, 'authenticated'::regrole::oid);
