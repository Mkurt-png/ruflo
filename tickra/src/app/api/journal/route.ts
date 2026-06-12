import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getUser, isDbConfigured } from '@/lib/db/queries';
import { createTrade, listTrades } from '@/lib/db/journal-queries';

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

// GET /api/journal — list current user's trades (most recent first)
export async function GET() {
  const g = await gate();
  if ('err' in g) return g.err;
  const trades = await listTrades(g.email);
  return NextResponse.json({ trades });
}

// POST /api/journal — create a new trade
type CreateBody = {
  pair?: unknown;
  side?: unknown;
  entry_price?: unknown;
  exit_price?: unknown;
  size?: unknown;
  stop_loss?: unknown;
  take_profit?: unknown;
  risk_r?: unknown;
  pnl?: unknown;
  notes?: unknown;
  screenshot_url?: unknown;
  opened_at?: unknown;
  closed_at?: unknown;
};

function num(v: unknown): number | null {
  if (typeof v !== 'number' && typeof v !== 'string') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function str(v: unknown): string | null {
  return typeof v === 'string' && v.trim() ? v.trim() : null;
}

export async function POST(req: Request) {
  const g = await gate();
  if ('err' in g) return g.err;
  const body = (await req.json().catch(() => null)) as CreateBody | null;
  if (!body) return NextResponse.json({ error: 'bad_request' }, { status: 400 });

  const pair = str(body.pair);
  const side = body.side === 'long' || body.side === 'short' ? body.side : null;
  const entry_price = num(body.entry_price);
  if (!pair || !side || entry_price === null) {
    return NextResponse.json(
      { error: 'pair, side and entry_price are required' },
      { status: 400 },
    );
  }
  const size = num(body.size) ?? 1;
  const trade = await createTrade(g.email, {
    pair,
    side,
    entry_price,
    exit_price: num(body.exit_price),
    size,
    stop_loss: num(body.stop_loss),
    take_profit: num(body.take_profit),
    risk_r: num(body.risk_r),
    pnl: num(body.pnl),
    notes: str(body.notes),
    screenshot_url: str(body.screenshot_url),
    opened_at: str(body.opened_at) ?? new Date().toISOString(),
    closed_at: str(body.closed_at),
  });
  if (!trade) return NextResponse.json({ error: 'create_failed' }, { status: 500 });
  return NextResponse.json({ trade });
}
