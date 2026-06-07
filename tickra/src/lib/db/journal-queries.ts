// Trade Journal queries. Pro/Lifetime feature — callers gate at the route
// boundary. The service-role client bypasses RLS; that's intentional, RLS
// stays enabled so nothing leaks if a client connection ever sneaks in.

import { getDb } from './supabase';
import { ensureUser } from './queries';

export type Side = 'long' | 'short';

export type TradeRow = {
  id: string;
  email: string;
  pair: string;
  side: Side;
  entry_price: number;
  exit_price: number | null;
  size: number;
  stop_loss: number | null;
  take_profit: number | null;
  risk_r: number | null;
  pnl: number | null;
  notes: string | null;
  screenshot_url: string | null;
  opened_at: string;
  closed_at: string | null;
  created_at: string;
};

export type NewTrade = Omit<TradeRow, 'id' | 'email' | 'created_at'> &
  Partial<Pick<TradeRow, 'opened_at'>>;

export type TradePatch = Partial<
  Pick<
    TradeRow,
    | 'exit_price'
    | 'size'
    | 'stop_loss'
    | 'take_profit'
    | 'risk_r'
    | 'pnl'
    | 'notes'
    | 'screenshot_url'
    | 'closed_at'
  >
>;

const TABLE = 'tickra_trade_journal';

export async function listTrades(email: string, limit = 200): Promise<TradeRow[]> {
  const db = await getDb();
  if (!db) return [];
  const { data, error } = await db
    .from(TABLE)
    .select('*')
    .eq('email', email)
    .order('opened_at', { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data as TradeRow[];
}

export async function createTrade(email: string, t: NewTrade): Promise<TradeRow | null> {
  const db = await getDb();
  if (!db) return null;
  await ensureUser(email);
  const { data, error } = await db
    .from(TABLE)
    .insert({
      email,
      pair: t.pair,
      side: t.side,
      entry_price: t.entry_price,
      exit_price: t.exit_price ?? null,
      size: t.size,
      stop_loss: t.stop_loss ?? null,
      take_profit: t.take_profit ?? null,
      risk_r: t.risk_r ?? null,
      pnl: t.pnl ?? null,
      notes: t.notes ?? null,
      screenshot_url: t.screenshot_url ?? null,
      opened_at: t.opened_at ?? new Date().toISOString(),
      closed_at: t.closed_at ?? null,
    })
    .select('*')
    .single();
  if (error || !data) return null;
  return data as TradeRow;
}

export async function patchTrade(
  email: string,
  id: string,
  patch: TradePatch,
): Promise<TradeRow | null> {
  const db = await getDb();
  if (!db) return null;
  const { data, error } = await db
    .from(TABLE)
    .update(patch)
    .eq('email', email)
    .eq('id', id)
    .select('*')
    .single();
  if (error || !data) return null;
  return data as TradeRow;
}

export async function deleteTrade(email: string, id: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const { error } = await db.from(TABLE).delete().eq('email', email).eq('id', id);
  return !error;
}
