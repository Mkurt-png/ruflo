'use client';

// Le Bureau — the signed-in home. When the reader arrives, the page
// stops being a landing brochure and becomes their desk: today's
// date, the Cote, what the Criée asks today, where the journal left
// off, what waits in the register. Editorial ivory paper, mono
// captions, serif headings. Pure client read of progress + Cote.

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useProgress } from '@/lib/progress/hook';
import { useCote } from '@/lib/tickra/useCote';
import { TRACKS } from '@/lib/curriculum/data';

type Locale = 'fr' | 'en';

const DAY = 86_400_000;

function pickNextLesson(completed: Record<string, number>) {
  for (const track of TRACKS) {
    for (const lesson of track.lessons) {
      if (!completed[lesson.id]) {
        return { trackSlug: track.slug, lessonSlug: lesson.slug, title: lesson.title };
      }
    }
  }
  return null;
}

function dueReviewCount(mistakes: Record<string, { loggedAt: number; reviewedAt?: number }>): number {
  const now = Date.now();
  return Object.values(mistakes).filter(
    (m) => !m.reviewedAt && now - m.loggedAt > 7 * DAY,
  ).length;
}

function streakDays(completed: Record<string, number>): number {
  if (typeof window === 'undefined') return 0;
  const days = new Set<string>();
  for (const ts of Object.values(completed)) {
    days.add(new Date(ts).toISOString().slice(0, 10));
  }
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  for (;;) {
    if (days.has(cursor.toISOString().slice(0, 10))) {
      streak += 1;
      cursor.setTime(cursor.getTime() - DAY);
    } else break;
  }
  return streak;
}

export function Bureau({ locale, email }: { locale: Locale; email: string }) {
  const { state, ready } = useProgress();
  const { cote } = useCote();
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
  }, []);

  const t = COPY[locale];
  const next = useMemo(() => pickNextLesson(state.completed ?? {}), [state]);
  const due = useMemo(() => dueReviewCount(state.mistakes ?? {}), [state]);
  const streak = useMemo(() => streakDays(state.completed ?? {}), [state]);

  const formattedDate = now
    ? now.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';
  const isSunday = now ? now.getDay() === 0 : false;
  const handle = email.split('@')[0];

  return (
    <main id="main" className="bg-[#F4F1EA] min-h-[80vh]">
      <section
        className="relative px-6 md:px-16"
        style={{ paddingTop: 'clamp(96px, 12vh, 160px)', paddingBottom: 'clamp(48px, 8vh, 96px)' }}
      >
        <header className="flex items-baseline justify-between gap-6 border-b border-black/15 pb-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.34em] text-black/55">
            {t.eyebrow}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.34em] text-black/45 tabular-nums">
            {formattedDate}
          </span>
        </header>

        <div className="mt-16 md:mt-20 max-w-[1100px]">
          <p
            className="font-display italic font-light text-[#0E0E0E]"
            style={{ fontSize: 'clamp(40px, 6vw, 88px)', lineHeight: 0.98, letterSpacing: '-0.035em' }}
          >
            {t.openingFor} <span className="not-italic text-[#0E0E0E]">{handle}</span>.
            <br />
            <span className="text-black/55">{t.subOne}</span>
            <br />
            <span className="text-black/35">{t.subTwo}</span>
          </p>
        </div>

        {/* Five ledger entries */}
        <ol className="mt-24 grid gap-x-12 gap-y-10 md:grid-cols-2 max-w-[1100px]">
          <Entry
            n={1}
            label={t.cote}
            value={ready ? cote.score.toFixed(1) : '—'}
            sub={
              ready
                ? `${cote.delta >= 0 ? '+' : ''}${cote.delta.toFixed(1)} ${t.lastDay}`
                : ''
            }
            href={`/${locale}/me`}
            cta={t.openCote}
          />
          <Entry
            n={2}
            label={t.criee}
            value={t.crieeValue}
            sub={t.crieeSub}
            href={`/${locale}/criee`}
            cta={t.openCriee}
          />
          <Entry
            n={3}
            label={t.streak}
            value={ready ? String(streak) : '—'}
            sub={streak > 0 ? t.streakHolds : t.streakZero}
            href={`/${locale}/learn`}
            cta={t.openLearn}
          />
          <Entry
            n={4}
            label={t.due}
            value={ready ? String(due) : '—'}
            sub={due > 0 ? t.dueHint : t.dueClean}
            href={`/${locale}/learn`}
            cta={t.openReview}
            mute={due === 0}
          />
          {next && (
            <Entry
              n={5}
              label={t.next}
              value={next.title[locale]}
              sub={t.nextHint}
              href={`/${locale}/learn/${next.trackSlug}/${next.lessonSlug}`}
              cta={t.openNext}
              wide
            />
          )}
          {isSunday && (
            <Entry
              n={6}
              label={t.lettre}
              value={t.lettreValue}
              sub={t.lettreHint}
              href={`/${locale}/lettre`}
              cta={t.openLettre}
              wide
            />
          )}
        </ol>

        <footer className="mt-24 border-t border-black/15 pt-6 max-w-[1100px] flex items-baseline justify-between gap-4">
          <p className="font-mono text-[10.5px] leading-relaxed text-black/45">{t.footer}</p>
          <Link
            href={`/${locale}/about`}
            className="font-mono text-[10px] uppercase tracking-[0.28em] text-black/55 hover:text-black/85 transition-colors"
          >
            {t.aboutLink}
          </Link>
        </footer>
      </section>
    </main>
  );
}

function Entry({
  n,
  label,
  value,
  sub,
  href,
  cta,
  wide,
  mute,
}: {
  n: number;
  label: string;
  value: string;
  sub: string;
  href: string;
  cta: string;
  wide?: boolean;
  mute?: boolean;
}) {
  return (
    <li className={wide ? 'md:col-span-2' : ''}>
      <Link href={href} className="group block border-t border-black/15 pt-6 hover:bg-black/[0.015] -mx-3 px-3 -my-2 py-2 transition-colors">
        <div className="flex items-baseline gap-4">
          <span className="font-mono text-[10px] tracking-[0.22em] text-black/35 tabular-nums">
            {String(n).padStart(2, '0')}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-black/55">
            {label}
          </span>
        </div>
        <p
          className={`mt-3 font-display ${mute ? 'text-[#0E0E0E]/45' : 'text-[#0E0E0E]'}`}
          style={{ fontSize: 'clamp(28px, 3.4vw, 44px)', lineHeight: 1.05, letterSpacing: '-0.02em' }}
        >
          {value}
        </p>
        {sub && (
          <p className="mt-2 font-display italic text-[15px] text-black/55">{sub}</p>
        )}
        <span className="mt-4 inline-block font-mono text-[10px] uppercase tracking-[0.28em] text-black/55 group-hover:text-black/85 transition-colors">
          {cta} →
        </span>
      </Link>
    </li>
  );
}

const COPY = {
  fr: {
    eyebrow: 'Le Bureau — édition du jour',
    openingFor: 'Bureau ouvert pour',
    subOne: 'Le café est tiré.',
    subTwo: 'Le carnet attend.',
    cote: 'Votre Cote',
    lastDay: 'sur 24 h',
    openCote: 'Voir le détail',
    criee: 'La Criée',
    crieeValue: 'Une question vous attend.',
    crieeSub: 'La même pour tout le monde aujourd’hui.',
    openCriee: 'Ouvrir la Criée',
    streak: 'Le streak',
    streakHolds: 'Le calendrier garde la trace.',
    streakZero: 'Un streak se redémarre — aujourd’hui suffit.',
    openLearn: 'Continuer une leçon',
    due: 'Erreurs à relire',
    dueHint: 'La révision est moins glorieuse que le neuf, et elle paie plus.',
    dueClean: 'Rien à reprendre pour l’instant.',
    openReview: 'Ouvrir les erreurs',
    next: 'Prochaine leçon',
    nextHint: 'Dix minutes suffisent.',
    openNext: 'Ouvrir cette leçon',
    lettre: 'La Lettre du dimanche',
    lettreValue: 'L’édition de la semaine est prête.',
    lettreHint: 'Lecture calme, dix minutes.',
    openLettre: 'Lire la Lettre',
    footer:
      'Lecture locale. Ce que vous voyez ici est calculé dans votre navigateur — rien n’a été envoyé pour composer cette page.',
    aboutLink: 'À propos →',
  },
  en: {
    eyebrow: 'The Desk — today’s edition',
    openingFor: 'Desk opened for',
    subOne: 'The coffee is poured.',
    subTwo: 'The register waits.',
    cote: 'Your Score',
    lastDay: 'over 24 h',
    openCote: 'See the detail',
    criee: 'The Criée',
    crieeValue: 'A question awaits you.',
    crieeSub: 'Same for everyone today.',
    openCriee: 'Open the Criée',
    streak: 'The streak',
    streakHolds: 'The calendar keeps the record.',
    streakZero: 'A streak restarts — today is enough.',
    openLearn: 'Continue a lesson',
    due: 'Mistakes to review',
    dueHint: 'Review is less glorious than novelty, and it pays more.',
    dueClean: 'Nothing to revisit yet.',
    openReview: 'Open mistakes',
    next: 'Next lesson',
    nextHint: 'Ten minutes is enough.',
    openNext: 'Open this lesson',
    lettre: 'The Sunday Letter',
    lettreValue: 'This week’s edition is ready.',
    lettreHint: 'Calm read, ten minutes.',
    openLettre: 'Read the Letter',
    footer:
      'Local read. What you see here is computed in your browser — nothing was sent to compose this page.',
    aboutLink: 'About →',
  },
} as const;

export default Bureau;
