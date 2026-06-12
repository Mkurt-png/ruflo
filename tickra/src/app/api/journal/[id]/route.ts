import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getUser, isDbConfigured } from '@/lib/db/queries';
import { deleteTrade, patchTrade, type TradePatch } from '@/lib/db/journal-queries';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function gate() {
  const session = getSession();
  if (!session) return { err: NextResponse.json({ error: 'unauthorized' }, { status: 401 }) };
  if (!isDbConfigured())
    return { err: NextResponse.json({ error: 'db_unavailable' }, { status: 503 }) };
  const user = await getUser(session.email);
  if (!user || (user.plan !== 'pro' && user.plan !== 'lifetime')) {
    return { err: NextResponse.json({ error: 'pro_required' }, { status: 403 }) };
  }
  return { email: session.email };
}

function num(v: unknown): number | null | undefined {
  if (v === undefined) return undefined;
  if (v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function str(v: unknown): string | null | undefined {
  if (v === undefined) return undefined;
  if (v === null) return null;
  return typeof v === 'string' && v.trim() ? v.trim() : null;
}

// PATCH /api/journal/[id] — partial update (close trade, edit notes, etc.)
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const g = await gate();
  if ('err' in g) return g.err;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: 'bad_request' }, { status: 400 });

  const patch: TradePatch = {};
  const exit_price = num(body.exit_price);
  if (exit_price !== undefined) patch.exit_price = exit_price;
  const size = num(body.size);
  if (size !== undefined && size !== null) patch.size = size;
  const stop_loss = num(body.stop_loss);
  if (stop_loss !== undefined) patch.stop_loss = stop_loss;
  const take_profit = num(body.take_profit);
  if (take_profit !== undefined) patch.take_profit = take_profit;
  const risk_r = num(body.risk_r);
  if (risk_r !== undefined) patch.risk_r = risk_r;
  const pnl = num(body.pnl);
  if (pnl !== undefined) patch.pnl = pnl;
  const notes = str(body.notes);
  if (notes !== undefined) patch.notes = notes;
  const screenshot_url = str(body.screenshot_url);
  if (screenshot_url !== undefined) patch.screenshot_url = screenshot_url;
  const closed_at = str(body.closed_at);
  if (closed_at !== undefined) patch.closed_at = closed_at;

  const trade = await patchTrade(g.email, params.id, patch);
  if (!trade) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json({ trade });
}

// DELETE /api/journal/[id]
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const g = await gate();
  if ('err' in g) return g.err;
  const ok = await deleteTrade(g.email, params.id);
  if (!ok) return NextResponse.json({ error: 'delete_failed' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
