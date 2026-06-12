// Query helpers for tickra_passkeys.
//
// Kept in a dedicated file (rather than queries.ts) so the WebAuthn work
// doesn't conflict with other parallel changes touching the main queries
// module. Same shape and degradation rules as queries.ts: reads return [] /
// null when the DB is not configured, writes return a boolean.

import { getDb } from './supabase';

export type PasskeyRow = {
  email: string;
  credential_id: string;
  public_key: string;
  counter: number;
  transports: string | null;
  created_at: string;
  last_used_at: string | null;
};

export type NewPasskey = {
  credential_id: string;
  public_key: string;
  counter: number;
  transports?: string[] | null;
};

export async function listPasskeys(email: string): Promise<PasskeyRow[]> {
  const db = await getDb();
  if (!db) return [];
  const { data, error } = await db
    .from('tickra_passkeys')
    .select('email, credential_id, public_key, counter, transports, created_at, last_used_at')
    .eq('email', email)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data as PasskeyRow[];
}

export async function addPasskey(email: string, cred: NewPasskey): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const { error } = await db.from('tickra_passkeys').insert({
    email,
    credential_id: cred.credential_id,
    public_key: cred.public_key,
    counter: cred.counter,
    transports: cred.transports && cred.transports.length > 0 ? cred.transports.join(',') : null,
  });
  return !error;
}

export async function getPasskey(credentialId: string): Promise<PasskeyRow | null> {
  const db = await getDb();
  if (!db) return null;
  const { data, error } = await db
    .from('tickra_passkeys')
    .select('email, credential_id, public_key, counter, transports, created_at, last_used_at')
    .eq('credential_id', credentialId)
    .maybeSingle();
  if (error) return null;
  return (data as PasskeyRow | null) ?? null;
}

export async function updatePasskeyCounter(credentialId: string, counter: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const { error } = await db
    .from('tickra_passkeys')
    .update({ counter, last_used_at: new Date().toISOString() })
    .eq('credential_id', credentialId);
  return !error;
}

export async function deletePasskey(email: string, credentialId: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const { error } = await db
    .from('tickra_passkeys')
    .delete()
    .eq('email', email)
    .eq('credential_id', credentialId);
  return !error;
}
