import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getUser, isDbConfigured } from '@/lib/db/queries';
import { TRACKS } from '@/lib/curriculum/data';
import { getLessonContent, isSeeded } from '@/lib/curriculum/lesson-content';
import { createBattle, type BattleQuestion } from '@/lib/db/battle-queries';

export const dynamic = 'force-dynamic';

const QUESTION_COUNT = 5;

function pickRandomQuestions(count: number): BattleQuestion[] {
  // Flatten all seeded (track, lesson, quizItem) tuples.
  const pool: BattleQuestion[] = [];
  for (const track of TRACKS) {
    for (const lesson of track.lessons) {
      if (!isSeeded(lesson.id)) continue;
      const content = getLessonContent(track, lesson);
      for (const item of content.quiz) {
        pool.push({
          trackId: track.id,
          lessonId: lesson.id,
          q: item.q,
          options: item.options,
          correct: item.correct,
          rationale: item.rationale,
        });
      }
    }
  }
  if (pool.length === 0) return [];

  // Fisher–Yates shuffle, take first `count`.
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export async function POST() {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (!isDbConfigured()) {
    return NextResponse.json({ error: 'db_unavailable' }, { status: 503 });
  }
  const user = await getUser(session.email);
  if (!user || (user.plan !== 'pro' && user.plan !== 'lifetime')) {
    return NextResponse.json({ error: 'pro_required' }, { status: 403 });
  }

  const questions = pickRandomQuestions(QUESTION_COUNT);
  if (questions.length === 0) {
    return NextResponse.json({ error: 'no_content' }, { status: 500 });
  }

  const battle = await createBattle(session.email, questions);
  if (!battle) {
    return NextResponse.json(
      {
        error: 'create_failed',
        hint: 'Migration 006_battles.sql may not be applied yet. See server logs.',
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ id: battle.id, joinUrl: `/battle/${battle.id}` });
}
