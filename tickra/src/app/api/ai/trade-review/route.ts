import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getUser, isDbConfigured } from '@/lib/db/queries';
import { resolveEffectivePlan } from '@/lib/auth/plan-expiry';
import { completeChat } from '@/lib/ai/client';
import { consumeAiQuota } from '@/lib/ai/quota';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// TICKRA-PHASE-2.2: Trade Coach.
// POST body: {
//   symbol, side, sizeLots, entry, exit, stopPips, tpPips, pnl, closeReason,
//   locale?
// }
// Returns: { review: string, lessonsSuggested: string[] }

type Body = {
  symbol?: string;
  side?: 'long' | 'short';
  sizeLots?: number;
  entry?: number;
  exit?: number;
  stopPips?: number;
  tpPips?: number;
  pnl?: number;
  closeReason?: 'tp' | 'sl' | 'manual';
  locale?: 'fr' | 'en';
};

function systemPrompt(locale: 'fr' | 'en') {
  if (locale === 'fr') {
    return `Tu es Tickra Coach, un coach de trading pédagogique pour des traders qui s'entraînent en démo sur Tickra.
À partir des détails d'un trade démo (instrument, sens, taille, entrée, sortie, stop, TP, P&L, raison de sortie), tu produis :
1. Une analyse courte (3-4 phrases max) en français du trade : ce qui a été bien fait, ce qui pourrait être amélioré.
2. Si le trade a perdu, identifie le risque (taille mal calibrée ? stop trop serré ? TP trop éloigné ? R:R défavorable ?).
3. Si gagné, identifie la bonne pratique à répéter.
Ton style : sobre, sans jargon inutile, sans flatterie excessive.
Tu ne prédis JAMAIS le futur du marché. Tu n'utilises pas le mot "signal".`;
  }
  return `You are Tickra Coach, an educational trading coach for traders practising on Tickra demo.
Given a demo trade (instrument, side, size, entry, exit, stop, TP, P&L, close reason), you produce:
1. A short analysis (3-4 sentences max) in English of the trade: what was done well, what could be improved.
2. If the trade lost, identify the risk (badly calibrated size? stop too tight? TP too far? unfavourable R:R?).
3. If won, identify the good practice to repeat.
Style: sober, no useless jargon, no excessive praise.
NEVER predict the market's future. Do not use the word "signal".`;
}

function buildUserPrompt(b: Body, locale: 'fr' | 'en') {
  const lines: string[] = [];
  if (locale === 'fr') {
    lines.push('Voici les détails d’un trade démo Tickra :');
    lines.push(`- Instrument : ${b.symbol ?? '?'}`);
    lines.push(`- Sens : ${b.side === 'long' ? 'Long (achat)' : 'Short (vente)'}`);
    lines.push(`- Taille : ${b.sizeLots ?? '?'} lots`);
    lines.push(`- Entrée : ${b.entry?.toFixed(5) ?? '?'}`);
    lines.push(`- Sortie : ${b.exit?.toFixed(5) ?? '?'}`);
    lines.push(`- Stop (distance) : ${b.stopPips ?? '?'} pips`);
    lines.push(`- Take-profit (distance) : ${b.tpPips ?? '?'} pips`);
    lines.push(`- P&L : ${b.pnl?.toFixed(2) ?? '?'} $`);
    lines.push(`- Raison de fermeture : ${b.closeReason === 'tp' ? 'Take-profit atteint' : b.closeReason === 'sl' ? 'Stop-loss touché' : 'Fermeture manuelle'}`);
    lines.push('');
    lines.push('Donne ta revue pédagogique.');
  } else {
    lines.push('Here are the details of a Tickra demo trade:');
    lines.push(`- Instrument: ${b.symbol ?? '?'}`);
    lines.push(`- Side: ${b.side === 'long' ? 'Long (buy)' : 'Short (sell)'}`);
    lines.push(`- Size: ${b.sizeLots ?? '?'} lots`);
    lines.push(`- Entry: ${b.entry?.toFixed(5) ?? '?'}`);
    lines.push(`- Exit: ${b.exit?.toFixed(5) ?? '?'}`);
    lines.push(`- Stop (distance): ${b.stopPips ?? '?'} pips`);
    lines.push(`- Take-profit (distance): ${b.tpPips ?? '?'} pips`);
    lines.push(`- P&L: $${b.pnl?.toFixed(2) ?? '?'}`);
    lines.push(`- Close reason: ${b.closeReason === 'tp' ? 'Take-profit reached' : b.closeReason === 'sl' ? 'Stop-loss hit' : 'Manual close'}`);
    lines.push('');
    lines.push('Give your educational review.');
  }
  return lines.join('\n');
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body || !body.symbol || !body.side) {
    return NextResponse.json({ error: 'missing_trade_details' }, { status: 400 });
  }
  const locale = body.locale === 'en' ? 'en' : 'fr';

  const session = getSession();
  if (!session) return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });

  // Plan + quota — Pro-only for Trade Coach (better UX than rate-limiting).
  let plan: 'free' | 'pro' | 'lifetime' = 'free';
  if (isDbConfigured()) {
    const u = await getUser(session.email);
    plan = resolveEffectivePlan(u);
  }
  if (plan === 'free') {
    return NextResponse.json({ error: 'pro_required' }, { status: 403 });
  }
  const quota = await consumeAiQuota(session.email, plan);
  if (!quota.ok) {
    if (quota.reason === 'quota_exceeded') {
      return NextResponse.json({ error: 'quota_exceeded' }, { status: 429 });
    }
    return NextResponse.json({ error: 'db_unavailable' }, { status: 503 });
  }

  const result = await completeChat(systemPrompt(locale), [
    { role: 'user', content: buildUserPrompt(body, locale) },
  ], 600);
  if (!result.ok) {
    if (result.reason === 'not_configured') {
      return NextResponse.json({ error: 'ai_not_configured' }, { status: 501 });
    }
    return NextResponse.json({ error: 'api_error', detail: result.detail }, { status: 502 });
  }

  return NextResponse.json({ review: result.text });
}
