-- Tickra · 005_passkeys.sql
-- Adds WebAuthn / Passkey credentials. Each row is one registered authenticator
-- (a YubiKey, a Touch ID enrolment, a Windows Hello credential, etc.) attached
-- to a Tickra user. One user may register many.
--
-- credential_id is the WebAuthn credential ID returned by the authenticator,
-- stored as base64url text (also how SimpleWebAuthn deals with it natively in
-- v11+). public_key is the COSE-encoded public key, base64url-encoded.
--
-- counter is the WebAuthn signature counter; the server bumps it on every
-- successful authentication to detect cloned authenticators.

create table if not exists tickra_passkeys (
  email          text not null references tickra_users(email) on delete cascade,
  credential_id  text primary key,
  public_key     text not null,
  counter        bigint not null default 0,
  transports     text,                                  -- comma-joined: 'usb,nfc,internal,…'
  created_at     timestamptz not null default now(),
  last_used_at   timestamptz
);

create index if not exists tickra_passkeys_email_idx
  on tickra_passkeys(email);

-- Same RLS posture as the rest of Tickra: server-side service-role only.
alter table tickra_passkeys enable row level security;
