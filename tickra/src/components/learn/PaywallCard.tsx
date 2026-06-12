import Link from 'next/link';
import { Lock, ArrowRight, Check } from 'lucide-react';
import { FREE_LESSON_LIMIT } from '@/lib/curriculum/entitlement';

type Locale = 'fr' | 'en';

const copy = {
  fr: {
    eyebrow: 'Leçon réservée à Tickra Pro',
    title: 'Pour aller plus loin, passez à Pro.',
    body: `Les ${FREE_LESSON_LIMIT} premières leçons sont gratuites pour vous donner la méthode. La suite — le détail, les exercices, le suivi de progression — fait partie de Tickra Pro.`,
    bullets: [
      'Accès à toutes les leçons et pistes',
      'Suivi de progression, streaks et révisions',
      'Exercices sur vrais graphiques + corrections',
      'Annulable à tout moment',
    ],
    primary: 'Voir les tarifs',
    secondary: 'Revoir une leçon gratuite',
  },
  en: {
    eyebrow: 'Lesson reserved for Tickra Pro',
    title: 'To go further, upgrade to Pro.',
    body: `The first ${FREE_LESSON_LIMIT} lessons are free so you see the method. The rest — the depth, the drills, the progression tracking — is part of Tickra Pro.`,
    bullets: [
      'Access to every lesson and track',
      'Progress tracking, streaks and reviews',
      'Drills on real charts + corrections',
      'Cancel any time',
    ],
    primary: 'See the plans',
    secondary: 'Replay a free lesson',
  },
};

export function PaywallCard({
  locale,
  signedIn,
  freeLessonHref,
}: {
  locale: Locale;
  signedIn: boolean;
  freeLessonHref: string;
}) {
  const t = copy[locale];
  return (
    <article className="relative overflow-hidden rounded-sm border border-line bg-surface p-8 md:p-12">
      <span aria-hidden className="aurora" />
      <span aria-hidden className="aurora aurora--lt" />

      <div className="relative">
        <div className="inline-flex items-center gap-2 rounded-full border border-line bg-canvas px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted">
          <Lock aria-hidden className="h-3 w-3" strokeWidth={2} />
          {t.eyebrow}
        </div>

        <h2 className="mt-6 max-w-2xl font-display text-display-md font-medium tracking-tight text-balance text-ink">
          {t.title}
        </h2>
        <p className="mt-5 max-w-xl text-pretty text-[16px] leading-relaxed text-muted md:text-[17px]">
          {t.body}
        </p>

        <ul className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {t.bullets.map((b) => (
            <li key={b} className="flex items-start gap-3 text-[14.5px] text-ink">
              <Check aria-hidden className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent" strokeWidth={2} />
              <span>{b}</span>
            </li>
          ))}
        </ul>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Link
            href={`/${locale}/pricing`}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-ink px-6 font-medium tracking-tight text-canvas transition-colors hover:bg-ink/90"
          >
            {t.primary}
            <ArrowRight aria-hidden className="h-4 w-4" strokeWidth={1.75} />
          </Link>
          <Link
            href={freeLessonHref}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-line px-6 font-medium tracking-tight text-ink transition-colors hover:border-ink"
          >
            {t.secondary}
          </Link>
          {!signedIn ? (
            <Link
              href={`/${locale}/signin?next=/${locale}/pricing`}
              className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted underline-offset-4 hover:underline"
            >
              {locale === 'fr' ? 'Déjà Pro ? Se connecter' : 'Already Pro? Sign in'}
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}
