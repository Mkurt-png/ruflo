// POST /api/sim/trade
// Mutates simulator state. Action discriminator in the body:
//   - open:  create a new open trade.
//   - close: close an existing open trade (manual or by SL/TP) and credit P&L.
//   - tick:  persist the latest `current` price for open trades. Optionally
//            close trades that the client engine has detected as hitting TP/SL.
//   - reset: wipe all trades and reset balance to the starting amount.
//
// Plan gating: Pro/Lifetime only. Free users get 403.
//
// Anti-cheat caveat: the random-walk engine still lives client-side, so we
// currently trust the client-supplied `pnl` value for close/tick-close calls.
// A future hardening step would re-derive P&L from entry/current/side/size on
// the server. For now the simulator is a UX feature, not a leaderboard.

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getUser, isDbConfigured } from '@/lib/db/queries';
import {
  addToBalance,
  closeTrade,
  createTrade,
  listClosedTrades,
  listOpenTrades,
  resetAccount,
  updateOpenTrade,
  getAccount,
  type SimSide,
  type SimCloseReason,
  type SimTradeRow,
} from '@/lib/db/sim-queries';
import type { WireClosedPosition, WirePosition, WireState } from '../state/route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ─── Wire types ──────────────────────────────────────────────────────────

type OpenBody = {
  action: 'open';
  symbol: string;
  side: SimSide;
  size: number;
  entry: number;
  stopPips: number;
  tpPips: number;
};

type CloseBody = {
  action: 'close';
  id: string;
  closeReason: SimCloseReason;
  pnl: number;
  current: number;
  closedAt?: number;
};

type TickUpdate = { id: string; current: number };
type TickClose = {
  id: string;
  closeReason: SimCloseReason;
  pnl: number;
  current: number;
  closedAt?: number;
};

type TickBody = {
  action: 'tick';
  updates?: TickUpdate[];
  closedByTpSl?: TickClose[];
};

type ResetBody = { action: 'reset' };

type Body = OpenBody | CloseBody | TickBody | ResetBody;

// ─── Helpers ──────────────────────────────────────────────────────────────

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

async function buildState(email: string): Promise<WireState | null> {
  const acct = await getAccount(email);
  if (!acct) return null;
  const [openRows, closedRows] = await Promise.all([
    listOpenTrades(email),
    listClosedTrades(email, 50),
  ]);
  return {
    balance: Number(acct.balance),
    open: openRows.map(toOpen),
    closed: closedRows.map(toClosed),
  };
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

function inRange(v: number, lo: number, hi: number): boolean {
  return v >= lo && v <= hi;
}

// ─── Route ───────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });
  }
  if (!isDbConfigured()) {
    return NextResponse.json({ error: 'db_unavailable' }, { status: 503 });
  }
  const u = await getUser(session.email);
  const plan = u?.plan === 'pro' || u?.plan === 'lifetime' ? u.plan : 'free';
  if (plan === 'free') {
    return NextResponse.json({ error: 'pro_required' }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body || typeof body !== 'object' || !('action' in body)) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const email = session.email;

  // ─── open ────────────────────────────────────────────────────────────
  if (body.action === 'open') {
    const { symbol, side, size, entry, stopPips, tpPips } = body;
    if (typeof symbol !== 'string' || !symbol) {
      return NextResponse.json({ error: 'invalid_symbol' }, { status: 400 });
    }
    if (side !== 'long' && side !== 'short') {
      return NextResponse.json({ error: 'invalid_side' }, { status: 400 });
    }
    if (!isFiniteNumber(size) || !inRange(size, 0.01, 2)) {
      return NextResponse.json({ error: 'invalid_size' }, { status: 400 });
    }
    if (!isFiniteNumber(entry) || entry <= 0) {
      return NextResponse.json({ error: 'invalid_entry' }, { status: 400 });
    }
    if (!Number.isInteger(stopPips) || !inRange(stopPips, 1, 1000)) {
      return NextResponse.json({ error: 'invalid_stop' }, { status: 400 });
    }
    if (!Number.isInteger(tpPips) || !inRange(tpPips, 1, 1000)) {
      return NextResponse.json({ error: 'invalid_tp' }, { status: 400 });
    }

    const row = await createTrade(email, {
      symbol,
      side,
      size,
      entry,
      current: entry,
      stopPips,
      tpPips,
    });
    if (!row) {
      return NextResponse.json({ error: 'db_error' }, { status: 500 });
    }
    const state = await buildState(email);
    return NextResponse.json({ ok: true, trade: toOpen(row), state });
  }

  // ─── close ───────────────────────────────────────────────────────────
  if (body.action === 'close') {
    const { id, closeReason, pnl, current } = body;
    if (typeof id !== 'string' || !id) {
      return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
    }
    if (
      closeReason !== 'tp' &&
      closeReason !== 'sl' &&
      closeReason !== 'manual'
    ) {
      return NextResponse.json({ error: 'invalid_close_reason' }, { status: 400 });
    }
    if (!isFiniteNumber(pnl) || !isFiniteNumber(current)) {
      return NextResponse.json({ error: 'invalid_close_payload' }, { status: 400 });
    }
    const closedAt = isFiniteNumber(body.closedAt) ? body.closedAt : Date.now();
    const closed = await closeTrade(id, closeReason, pnl, closedAt, current);
    if (!closed) {
      // Already closed or not found — surface state so client can reconcile.
      const state = await buildState(email);
      return NextResponse.json({ ok: false, error: 'not_open', state }, { status: 409 });
    }
    const newBalance = await addToBalance(email, pnl);
    if (newBalance == null) {
      return NextResponse.json({ error: 'db_error' }, { status: 500 });
    }
    const state = await buildState(email);
    return NextResponse.json({ ok: true, state });
  }

  // ─── tick ────────────────────────────────────────────────────────────
  if (body.action === 'tick') {
    const updates = Array.isArray(body.updates) ? body.updates : [];
    const closedByTpSl = Array.isArray(body.closedByTpSl) ? body.closedByTpSl : [];

    // Price updates for still-open trades. Best-effort; we don't error out the
    // whole tick if one row was concurrently closed by another tab.
    await Promise.all(
      updates
        .filter(
          (u): u is TickUpdate =>
            typeof u?.id === 'string' && isFiniteNumber(u?.current),
        )
        .map((u) => updateOpenTrade(u.id, { current: u.current })),
    );

    // Close trades that the client engine detected as hitting TP/SL.
    // Balance is adjusted atomically (read-then-write) per close. Guarded by
    // the `status = 'open'` predicate inside closeTrade so a double-tick or
    // a concurrent manual close from another tab cannot credit P&L twice.
    let netDelta = 0;
    for (const c of closedByTpSl) {
      if (
        typeof c?.id !== 'string' ||
        (c.closeReason !== 'tp' && c.closeReason !== 'sl') ||
        !isFiniteNumber(c.pnl) ||
        !isFiniteNumber(c.current)
      ) {
        continue;
      }
      const closedAt = isFiniteNumber(c.closedAt) ? c.closedAt : Date.now();
      const row = await closeTrade(c.id, c.closeReason, c.pnl, closedAt, c.current);
      if (row) netDelta += c.pnl;
    }
    if (netDelta !== 0) {
      const ok = await addToBalance(email, netDelta);
      if (ok == null) {
        return NextResponse.json({ error: 'db_error' }, { status: 500 });
      }
    }

    const state = await buildState(email);
    return NextResponse.json({ ok: true, state });
  }

  // ─── reset ───────────────────────────────────────────────────────────
  if (body.action === 'reset') {
    const acct = await resetAccount(email);
    if (!acct) {
      return NextResponse.json({ error: 'db_error' }, { status: 500 });
    }
    const state = await buildState(email);
    return NextResponse.json({ ok: true, state });
  }

  return NextResponse.json({ error: 'unknown_action' }, { status: 400 });
}
