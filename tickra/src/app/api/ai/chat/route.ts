import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getUser, isDbConfigured } from '@/lib/db/queries';
import { streamChat, type AiMessage } from '@/lib/ai/client';
import { consumeAiQuota } from '@/lib/ai/quota';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// AskTickra chat endpoint.
// POST body: { messages: AiMessage[], context?: { trackTitle?, lessonTitle?, locale? } }
// Streams plain text deltas back to the client.

const SYSTEM_PROMPT_FR = `Tu es Tickra Assist, l'assistant pédagogique de la plateforme Tickra.
Tu réponds aux questions sur le trading, les marchés financiers, l'analyse technique, la gestion du risque, la psychologie du trader, et le contenu des leçons Tickra.

Règles strictes :
- Tu n'es PAS un conseiller financier. Tu ne donnes JAMAIS de signaux d'achat/vente, JAMAIS de prédictions de prix, JAMAIS de recommandations d'investissement personnalisées.
- Tu refuses poliment toute demande de "signaux", "à acheter maintenant", "que penses-tu d'XYZ comme placement".
- Tu privilégies des réponses courtes (3-6 phrases max), concrètes, et tu cites la leçon Tickra pertinente quand c'est utile.
- Tu réponds en français.
- Si tu ne sais pas, tu le dis. Pas d'invention.`;

const SYSTEM_PROMPT_EN = `You are Tickra Assist, the educational assistant of the Tickra platform.
You answer questions about trading, financial markets, technical analysis, risk management, trader psychology, and Tickra lesson content.

Strict rules:
- You are NOT a financial advisor. You NEVER give buy/sell signals, NEVER predict prices, NEVER provide personalised investment recommendations.
- Politely refuse any "signal", "buy now", "what do you think about XYZ as an investment" request.
- Prefer short answers (3-6 sentences max), concrete, and cite the relevant Tickra lesson when useful.
- Reply in English.
- If you don't know, say so. No fabrication.`;

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    messages?: AiMessage[];
    context?: { trackTitle?: string; lessonTitle?: string; locale?: 'fr' | 'en' };
  } | null;

  if (!body?.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json({ error: 'missing_messages' }, { status: 400 });
  }

  const locale = body.context?.locale === 'en' ? 'en' : 'fr';
  const session = getSession();
  const email = session?.email ?? null;

  // Plan + quota
  let plan: 'free' | 'pro' | 'lifetime' = 'free';
  if (email && isDbConfigured()) {
    const u = await getUser(email);
    if (u?.plan === 'pro' || u?.plan === 'lifetime') plan = u.plan;
  }
  // Anonymous users get 0 quota — must sign in.
  if (!email) {
    return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });
  }
  const quota = await consumeAiQuota(email, plan);
  if (!quota.ok) {
    if (quota.reason === 'quota_exceeded') {
      return NextResponse.json({ error: 'quota_exceeded' }, { status: 429 });
    }
    // db_unavailable → fail closed instead of granting unlimited calls.
    return NextResponse.json({ error: 'db_unavailable' }, { status: 503 });
  }

  // Build the system prompt with optional context.
  let system = locale === 'fr' ? SYSTEM_PROMPT_FR : SYSTEM_PROMPT_EN;
  if (body.context?.lessonTitle) {
    system +=
      locale === 'fr'
        ? `\n\nL'utilisateur est actuellement dans la leçon : "${body.context.lessonTitle}" (piste : ${body.context.trackTitle ?? 'inconnue'}).`
        : `\n\nThe user is currently in lesson: "${body.context.lessonTitle}" (track: ${body.context.trackTitle ?? 'unknown'}).`;
  }

  const result = await streamChat(system, body.messages, 800);
  if (!result.ok) {
    if (result.reason === 'not_configured') {
      return NextResponse.json(
        { error: 'ai_not_configured', hint: 'Set GROQ_API_KEY (preferred) or ANTHROPIC_API_KEY in the env to enable chat.' },
        { status: 501 },
      );
    }
    return NextResponse.json({ error: 'api_error', detail: result.detail }, { status: 502 });
  }

  return new Response(result.stream, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-store',
      'x-tickra-quota-remaining': String(quota.remaining),
    },
  });
}
