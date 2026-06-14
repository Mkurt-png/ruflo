import { NextResponse } from 'next/server';
import { completeChat } from '@/lib/ai/client';
import { isDebugAuthorised } from '@/lib/debug/gate';

// Per-request: env vars change between deploys.
export const dynamic = 'force-dynamic';

// GET /api/debug/ai
// Real probe: sends a tiny request to the active AI provider (Groq if
// GROQ_API_KEY is set, else Anthropic) and returns the result so we can
// diagnose config issues. Never leaks the key — only its prefix.
// gated — production callers must present
// `x-debug-token: $DEBUG_TOKEN` (otherwise anyone could burn the budget).
export async function GET(req: Request) {
  const gate = isDebugAuthorised(req);
  if (!gate.ok) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const hasGroq = typeof process.env.GROQ_API_KEY === 'string';
  const hasAnthropic = typeof process.env.ANTHROPIC_API_KEY === 'string';
  const provider = hasGroq ? 'groq' : hasAnthropic ? 'anthropic' : null;
  const model =
    provider === 'groq'
      ? (process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile')
      : (process.env.ANTHROPIC_MODEL ?? 'claude-3-5-haiku-20241022');
  const rawKey =
    provider === 'groq' ? process.env.GROQ_API_KEY : process.env.ANTHROPIC_API_KEY;
  const keyPrefix = rawKey ? `${rawKey.slice(0, 8)}…` : null;

  if (!provider) {
    return NextResponse.json({
      ok: false,
      reason: 'not_configured',
      hint: 'Set GROQ_API_KEY (preferred) or ANTHROPIC_API_KEY in Vercel env vars.',
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
      provider,
      keyPrefix,
      model,
      sample: result.text,
    });
  }

  return NextResponse.json({
    ok: false,
    provider,
    keyPrefix,
    model,
    reason: result.reason,
    detail: result.detail,
  });
}
