import { NextResponse } from 'next/server';
import { completeChat } from '@/lib/ai/client';
import { isDebugAuthorised } from '@/lib/debug/gate';

// Per-request: env vars change between deploys.
export const dynamic = 'force-dynamic';

// GET /api/debug/ai
// Real probe: sends a tiny 1-token request to Anthropic and returns the
// exact result so we can diagnose configuration issues. Leaks no key.
// TICKRA-FIX(security): gated — production callers must present
// `x-debug-token: $DEBUG_TOKEN` (otherwise anyone could burn the budget).
export async function GET(req: Request) {
  const gate = isDebugAuthorised(req);
  if (!gate.ok) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const present = typeof process.env.ANTHROPIC_API_KEY === 'string';
  const model = process.env.ANTHROPIC_MODEL ?? 'claude-3-5-haiku-20241022';
  const keyPrefix = present
    ? `${(process.env.ANTHROPIC_API_KEY ?? '').slice(0, 8)}…`
    : null;

  if (!present) {
    return NextResponse.json({
      ok: false,
      reason: 'not_configured',
      hint: 'Set ANTHROPIC_API_KEY in Vercel env vars.',
    });
  }

  const result = await completeChat(
    'You answer with exactly one word.',
    [{ role: 'user', content: 'Say OK.' }],
    20,
  );

  if (result.ok) {
    return NextResponse.json({
      ok: true,
      keyPrefix,
      model,
      sample: result.text,
    });
  }

  return NextResponse.json({
    ok: false,
    keyPrefix,
    model,
    reason: result.reason,
    detail: result.detail,
  });
}
