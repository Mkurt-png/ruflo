import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { recordReview } from '@/lib/db/srs-queries';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const GRADES = ['again', 'hard', 'good', 'easy'] as const;

// POST /api/review/grade  body: { lessonId: string, grade: 'again'|'hard'|'good'|'easy' }
//
// Records the user's recall grade for a card, runs SM-2, schedules the next
// review. Returns the new nextReviewAt so the client can update the queue.
export async function POST(req: Request) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = (await req.json().catch(() => null)) as
    | { lessonId?: string; grade?: string }
    | null;
  const lessonId = body?.lessonId?.trim();
  const grade = body?.grade as (typeof GRADES)[number] | undefined;
  if (!lessonId || !grade || !GRADES.includes(grade)) {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }

  const result = await recordReview(session.email, lessonId, grade);
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 500 });
  }
  return NextResponse.json({ ok: true, nextReviewAt: result.nextReviewAt });
}
