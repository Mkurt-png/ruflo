// GET /api/sim/state
// Returns the full simulator state ({ balance, open, closed }) for the
// currently authenticated Pro/Lifetime user. Replaces the legacy localStorage
// blob so a user trading on desktop sees the same account on mobile.
//
// 401: not signed in.
// 403: signed in but on the free plan (Pro/Lifetime only).
// 503: Supabase not configured.

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getUser, isDbConfigured } from '@/lib/db/queries';
import { resolveEffectivePlan } from '@/lib/auth/plan-expiry';
import {
  getAccount,
  listOpenTrades,
  listClosedTrades,
  type SimTradeRow,
} from '@/lib/db/sim-queries';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Wire shape mirrors the existing client `Position` / `ClosedPosition` types
// so the client doesn't need any translation layer.
export type WirePosition = {
  id: string;
  symbol: string;
  side: 'long' | 'short';
  size: number;
  entry: number;
  current: number;
  stopPips: number;
  tpPips: number;
  openedAt: number;
};

export type WireClosedPosition = WirePosition & {
  closedAt: number;
  closeReason: 'tp' | 'sl' | 'manual';
  pnl: number;
};

export type WireState = {
  balance: number;
  open: WirePosition[];
  closed: WireClosedPosition[];
};

function toOpen(r: SimTradeRow): WirePosition {
  return {
    id: r.id,
    symbol: r.symbol,
    side: r.side,
    size: Number(r.size),
    entry: Number(r.entry),
    current: Number(r.current),
    stopPips: r.stop_pips,
    tpPips: r.tp_pips,
    openedAt: new Date(r.opened_at).getTime(),
  };
}

function toClosed(r: SimTradeRow): WireClosedPosition {
  return {
    ...toOpen(r),
    closedAt: r.closed_at ? new Date(r.closed_at).getTime() : Date.now(),
    closeReason: (r.close_reason ?? 'manual') as 'tp' | 'sl' | 'manual',
    pnl: r.pnl == null ? 0 : Number(r.pnl),
  };
}

export async function GET() {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });
  }
  if (!isDbConfigured()) {
    return NextResponse.json({ error: 'db_unavailable' }, { status: 503 });
  }
  const u = await getUser(session.email);
  const plan = resolveEffectivePlan(u);
  if (plan === 'free') {
    return NextResponse.json({ error: 'pro_required' }, { status: 403 });
  }

  const acct = await getAccount(session.email);
  if (!acct) {
    return NextResponse.json({ error: 'db_unavailable' }, { status: 503 });
  }
  const [openRows, closedRows] = await Promise.all([
    listOpenTrades(session.email),
    listClosedTrades(session.email, 50),
  ]);

  const out: WireState = {
    balance: Number(acct.balance),
    open: openRows.map(toOpen),
    closed: closedRows.map(toClosed),
  };
  return NextResponse.json(out);
}
