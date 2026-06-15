import { notFound, redirect } from 'next/navigation';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { getSession } from '@/lib/auth/session';
import { listDueReviews } from '@/lib/db/srs-queries';
import { TRACKS } from '@/lib/curriculum/data';
import { getLessonContent, isSeeded } from '@/lib/curriculum/lesson-content';
import { ReviewSession, type ReviewCard } from '@/components/review/ReviewSession';
import { Navbar } from '@/components/nav/Navbar';
import { getDictionary } from '@/lib/i18n/dictionaries';

export const dynamic = 'force-dynamic';

// Personal SRS review queue. Server-redirects to /signin for anonymous
// visitors; keep it out of Google's index but allow follow so the
// signin link still passes signal.
export const metadata = {
  title: 'Review · Tickra',
  robots: { index: false, follow: true },
};

export default async function ReviewPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale as Locale;
  const dict = await getDictionary(locale);

  const session = getSession();
  if (!session) redirect(`/${locale}/signin`);

  const due = await listDueReviews(session.email, 50);

  // Resolve each due card to a quiz question pulled from its lesson content.
  // Picks the first quiz item per lesson — same question every cycle keeps
  // the SM-2 signal meaningful (a "Good" means "I remembered THIS item").
  const cards: ReviewCard[] = [];
  for (const d of due) {
    const resolved = findLesson(d.lesson_id);
    if (!resolved) continue;
    if (!isSeeded(resolved.lesson.id)) continue;
    const content = getLessonContent(resolved.track, resolved.lesson);
    const quiz = content.quiz[0];
    if (!quiz) continue;
    cards.push({
      lessonId: d.lesson_id,
      trackTitle: resolved.track.title[locale],
      lessonTitle: resolved.lesson.title[locale],
      q: quiz.q[locale],
      options: quiz.options[locale],
      correct: quiz.correct,
      rationale: quiz.rationale[locale],
    });
  }

  const copy = COPY[locale];

  return (
    <>
      <Navbar dict={dict} locale={locale} />
      <main className="mx-auto w-full max-w-3xl px-6 py-12 md:py-16">
        <header className="mb-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-subtle">
            {copy.eyebrow}
          </p>
          <h1 className="mt-1 font-display text-3xl font-medium text-ink md:text-4xl">
            {copy.title}
          </h1>
          <p className="mt-2 text-sm text-muted">{copy.body}</p>
        </header>

        {cards.length === 0 ? (
          <div className="rounded-2xl border border-line bg-surface p-8 text-center">
            <p className="text-base text-ink">{copy.empty}</p>
            <p className="mt-1 text-sm text-muted">{copy.emptyHint}</p>
          </div>
        ) : (
          <ReviewSession cards={cards} locale={locale} />
        )}
      </main>
    </>
  );
}

const COPY = {
  fr: {
    eyebrow: 'Révision · Espacée',
    title: 'Vos cartes du jour',
    body: 'Les questions ratées reviennent au bon moment. Notez votre rappel honnêtement — l’algorithme calcule la prochaine date.',
    empty: 'Aucune carte à réviser pour l’instant.',
    emptyHint: 'Revenez après quelques leçons. Les erreurs sont reprogrammées automatiquement.',
  },
  en: {
    eyebrow: 'Review · Spaced',
    title: 'Your cards for today',
    body: 'Missed questions come back at the right moment. Rate your recall honestly — the algorithm picks the next date.',
    empty: 'Nothing to review right now.',
    emptyHint: 'Come back after a few lessons. Missed answers are auto-scheduled.',
  },
} as const;

function findLesson(lessonId: string) {
  for (const t of TRACKS) {
    const l = t.lessons.find((x) => x.id === lessonId);
    if (l) return { lesson: l, track: t };
  }
  return undefined;
}
