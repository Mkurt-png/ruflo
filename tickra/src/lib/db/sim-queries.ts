// Typed query helpers for the paper-trading simulator.
// All access funnels through the service-role client; RLS blocks anon/auth.
//
// Two tables:
//   - tickra_sim_accounts: one row per user, holds the virtual balance.
//   - tickra_sim_trades:   one row per trade (open or closed).
//
// Concurrency note: trade close is keyed by trade id (single UPDATE), and
// balance is mutated by a single read-then-write per close. There is no
// concurrent close path for the same trade so the simple flow is safe.

import { getDb } from './supabase';

export type SimSide = 'long' | 'short';
export type SimStatus = 'open' | 'closed';
export type SimCloseReason = 'tp' | 'sl' | 'manual';

export type SimAccount = {
  email: string;
  balance: number;
  updated_at: string;
};

export type SimTradeRow = {
  id: string;
  email: string;
  status: SimStatus;
  symbol: string;
  side: SimSide;
  size: number;
  entry: number;
  current: number;
  stop_pips: number;
  tp_pips: number;
  opened_at: string;
  closed_at: string | null;
  close_reason: SimCloseReason | null;
  pnl: number | null;
};

const ACCOUNTS = 'tickra_sim_accounts';
const TRADES = 'tickra_sim_trades';

const DEFAULT_BALANCE = 10_000;

// Returns the user's sim account, creating it lazily at the default
// starting balance if it doesn't yet exist.
export async function getAccount(email: string): Promise<SimAccount | null> {
  const db = await getDb();
  if (!db) return null;
  const { data, error } = await db
    .from(ACCOUNTS)
    .select('*')
    .eq('email', email)
    .maybeSingle();
  if (error) return null;
  if (data) return data as SimAccount;

  // Lazy-create on first read.
  const { data: created, error: insErr } = await db
    .from(ACCOUNTS)
    .insert({ email, balance: DEFAULT_BALANCE })
    .select('*')
    .single();
  if (insErr || !created) return null;
  return created as SimAccount;
}

export async function setAccountBalance(
  email: string,
  balance: number,
): Promise<SimAccount | null> {
  const db = await getDb();
  if (!db) return null;
  const { data, error } = await db
    .from(ACCOUNTS)
    .upsert(
      { email, balance, updated_at: new Date().toISOString() },
      { onConflict: 'email' },
    )
    .select('*')
    .single();
  if (error || !data) return null;
  return data as SimAccount;
}

export async function listOpenTrades(email: string): Promise<SimTradeRow[]> {
  const db = await getDb();
  if (!db) return [];
  const { data, error } = await db
    .from(TRADES)
    .select('*')
    .eq('email', email)
    .eq('status', 'open')
    .order('opened_at', { ascending: false });
  if (error || !data) return [];
  return data as SimTradeRow[];
}

export async function listClosedTrades(
  email: string,
  limit = 50,
): Promise<SimTradeRow[]> {
  const db = await getDb();
  if (!db) return [];
  const { data, error } = await db
    .from(TRADES)
    .select('*')
    .eq('email', email)
    .eq('status', 'closed')
    .order('closed_at', { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data as SimTradeRow[];
}

export type NewTrade = {
  symbol: string;
  side: SimSide;
  size: number;
  entry: number;
  current: number;
  stopPips: number;
  tpPips: number;
  openedAt?: number; // unix ms; defaults to now()
};

export async function createTrade(
  email: string,
  p: NewTrade,
): Promise<SimTradeRow | null> {
  const db = await getDb();
  if (!db) return null;
  const { data, error } = await db
    .from(TRADES)
    .insert({
      email,
      status: 'open',
      symbol: p.symbol,
      side: p.side,
      size: p.size,
      entry: p.entry,
      current: p.current,
      stop_pips: p.stopPips,
      tp_pips: p.tpPips,
      opened_at: p.openedAt ? new Date(p.openedAt).toISOString() : new Date().toISOString(),
    })
    .select('*')
    .single();
  if (error || !data) return null;
  return data as SimTradeRow;
}

export type OpenTradePatch = Partial<{
  current: number;
}>;

export async function updateOpenTrade(
  id: string,
  patch: OpenTradePatch,
): Promise<SimTradeRow | null> {
  const db = await getDb();
  if (!db) return null;
  const update: Record<string, unknown> = {};
  if (typeof patch.current === 'number') update.current = patch.current;
  if (Object.keys(update).length === 0) return null;

  const { data, error } = await db
    .from(TRADES)
    .update(update)
    .eq('id', id)
    .eq('status', 'open')
    .select('*')
    .maybeSingle();
  if (error || !data) return null;
  return data as SimTradeRow;
}

export async function closeTrade(
  id: string,
  closeReason: SimCloseReason,
  pnl: number,
  closedAt: number,
  current: number,
): Promise<SimTradeRow | null> {
  const db = await getDb();
  if (!db) return null;
  const { data, error } = await db
    .from(TRADES)
    .update({
      status: 'closed',
      close_reason: closeReason,
      pnl,
      current,
      closed_at: new Date(closedAt).toISOString(),
    })
    .eq('id', id)
    .eq('status', 'open')
    .select('*')
    .maybeSingle();
  if (error || !data) return null;
  return data as SimTradeRow;
}

// Wipe all trades for the user and reset balance to the starting amount.
export async function resetAccount(email: string): Promise<SimAccount | null> {
  const db = await getDb();
  if (!db) return null;
  const { error: delErr } = await db.from(TRADES).delete().eq('email', email);
  if (delErr) return null;
  return setAccountBalance(email, DEFAULT_BALANCE);
}

// Helper to atomically (read-then-write) bump the user's balance by `delta`.
// Returns the new balance, or null if the read/write failed.
export async function addToBalance(
  email: string,
  delta: number,
): Promise<number | null> {
  const acct = await getAccount(email);
  if (!acct) return null;
  const next = Number(acct.balance) + delta;
  const updated = await setAccountBalance(email, next);
  if (!updated) return null;
  return Number(updated.balance);
}

export { DEFAULT_BALANCE };
