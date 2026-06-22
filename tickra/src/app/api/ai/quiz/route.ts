import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getUser, isDbConfigured } from '@/lib/db/queries';
import { completeChat } from '@/lib/ai/client';
import { consumeAiQuota } from '@/lib/ai/quota';
import { getLesson } from '@/lib/curriculum/data';
import { getLessonContent, isSeeded } from '@/lib/curriculum/lesson-content';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// TICKRA-PHASE-3: adaptive AI quiz generator.
// POST body: { trackSlug, lessonSlug, locale, count? }
// Returns { questions: GeneratedQuestion[] } grounded on the lesson intro.
// Falls back gracefully (501 / 502) so the client can show the static quiz.

export type GeneratedQuestion = {
  q: string;
  options: string[];
  correct: number;
  rationale: string;
};

const SYSTEM_FR = `Tu es Tickra Examinateur, un pédagogue exigeant qui rédige des questions de compréhension sur le trading.
Tu génères un quiz à partir du contenu d'une leçon. Règles :
- Questions à choix unique, 3 options chacune, exactement une bonne réponse.
- Reste STRICTEMENT dans le périmètre pédagogique de la leçon fournie. Aucun signal, aucune prédiction de prix, aucun conseil d'investissement.
- Varie la difficulté : compréhension, application, piège classique du débutant.
- Chaque question a une "rationale" courte qui explique pourquoi la bonne réponse est correcte.
- Réponds UNIQUEMENT avec du JSON valide, sans texte autour, sans bloc markdown.
Format exact : {"questions":[{"q":"...","options":["...","...","..."],"correct":0,"rationale":"..."}]}`;

const SYSTEM_EN = `You are Tickra Examiner, a demanding educator who writes trading comprehension questions.
You generate a quiz from a lesson's content. Rules:
- Single-choice questions, 3 options each, exactly one correct answer.
- Stay STRICTLY within the educational scope of the provided lesson. No signals, no price predictions, no investment advice.
- Vary difficulty: comprehension, application, classic beginner trap.
- Each question has a short "rationale" explaining why the correct answer is right.
- Reply ONLY with valid JSON, no surrounding text, no markdown fence.
Exact format: {"questions":[{"q":"...","options":["...","...","..."],"correct":0,"rationale":"..."}]}`;

function parseQuestions(raw: string): GeneratedQuestion[] | null {
  // Strip code fences and any leading/trailing prose the model may add.
  let s = raw.trim();
  if (s.startsWith('```')) {
    s = s.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  }
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start === -1 || end === -1) return null;
  s = s.slice(start, end + 1);
  let json: unknown;
  try {
    json = JSON.parse(s);
  } catch {
    return null;
  }
  const arr = (json as { questions?: unknown }).questions;
  if (!Array.isArray(arr)) return null;
  const out: GeneratedQuestion[] = [];
  for (const item of arr) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    const q = typeof o.q === 'string' ? o.q.trim() : '';
    const options = Array.isArray(o.options)
      ? o.options.filter((x): x is string => typeof x === 'string').map((x) => x.trim())
      : [];
    const correct = typeof o.correct === 'number' ? o.correct : -1;
    const rationale = typeof o.rationale === 'string' ? o.rationale.trim() : '';
    if (!q || options.length < 2 || correct < 0 || correct >= options.length) continue;
    out.push({ q, options, correct, rationale });
  }
  return out.length > 0 ? out : null;
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    trackSlug?: string;
    lessonSlug?: string;
    locale?: 'fr' | 'en';
    count?: number;
  } | null;

  if (!body?.trackSlug || !body?.lessonSlug) {
    return NextResponse.json({ error: 'missing_params' }, { status: 400 });
  }

  const locale = body.locale === 'en' ? 'en' : 'fr';
  const count = Math.min(Math.max(body.count ?? 3, 1), 5);

  const found = getLesson(body.trackSlug, body.lessonSlug);
  if (!found) {
    return NextResponse.json({ error: 'lesson_not_found' }, { status: 404 });
  }
  if (!isSeeded(found.lesson.id)) {
    return NextResponse.json({ error: 'lesson_not_ready' }, { status: 409 });
  }

  // Auth + quota — same policy as the chat endpoint.
  const session = getSession();
  const email = session?.email ?? null;
  if (!email) {
    return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });
  }
  let plan: 'free' | 'pro' | 'lifetime' = 'free';
  if (isDbConfigured()) {
    const u = await getUser(email);
    if (u?.plan === 'pro' || u?.plan === 'lifetime') plan = u.plan;
  }
  const quota = await consumeAiQuota(email, plan);
  if (!quota.ok) {
    if (quota.reason === 'quota_exceeded') {
      return NextResponse.json({ error: 'quota_exceeded' }, { status: 429 });
    }
    return NextResponse.json({ error: 'db_unavailable' }, { status: 503 });
  }

  const content = getLessonContent(found.track, found.lesson);
  const intro = content.intro[locale].join('\n');
  const title = found.lesson.title[locale];
  const trackTitle = found.track.title[locale];

  const userPrompt =
    locale === 'fr'
      ? `Leçon : "${title}" (piste : ${trackTitle}).\n\nContenu de la leçon :\n${intro}\n\nGénère ${count} questions de quiz au format JSON demandé. Langue des questions : français.`
      : `Lesson: "${title}" (track: ${trackTitle}).\n\nLesson content:\n${intro}\n\nGenerate ${count} quiz questions in the requested JSON format. Question language: English.`;

  const result = await completeChat(
    locale === 'fr' ? SYSTEM_FR : SYSTEM_EN,
    [{ role: 'user', content: userPrompt }],
    900,
  );

  if (!result.ok) {
    if (result.reason === 'not_configured') {
      return NextResponse.json({ error: 'ai_not_configured' }, { status: 501 });
    }
    return NextResponse.json({ error: 'api_error', detail: result.detail }, { status: 502 });
  }

  const questions = parseQuestions(result.text);
  if (!questions) {
    return NextResponse.json({ error: 'parse_failed' }, { status: 502 });
  }

  return NextResponse.json(
    { questions: questions.slice(0, count) },
    { headers: { 'x-tickra-quota-remaining': String(quota.remaining) } },
  );
}
