import Link from 'next/link';
import { CalendarClock, ArrowLeft, ArrowRight } from 'lucide-react';

type Locale = 'fr' | 'en';

const copy = {
  fr: {
    eyebrow: 'Bientôt disponible',
    title: 'Cette leçon arrive très bientôt.',
    body:
      "Tickra n'expose jamais une leçon qui n'a pas encore son contenu complet. Cette piste est en cours de rédaction par l'équipe pédagogique. Vous recevrez un mail dès qu'elle est publiée.",
    eta: 'ETA : courant juin 2026',
    previous: 'Leçon précédente',
    back: 'Retour à la piste',
  },
  en: {
    eyebrow: 'Coming soon',
    title: 'This lesson arrives shortly.',
    body:
      "Tickra never exposes a lesson that does not yet have its full content. This track is being written by the curriculum team. You'll get a mail as soon as it goes live.",
    eta: 'ETA: June 2026',
    previous: 'Previous lesson',
    back: 'Back to the track',
  },
};

// shown when the visited lesson has no hand-written content
// yet. We refuse to show varied-but-generic placeholder content — better to be
// honest about "coming soon" than to dilute the perceived quality.
export function ComingSoonCard({
  locale,
  trackHref,
  prevHref,
}: {
  locale: Locale;
  trackHref: string;
  prevHref: string | null;
}) {
  const t = copy[locale];
  return (
    <article aria-labelledby="coming-soon-card-title" className="relative overflow-hidden rounded-sm border border-line bg-surface p-8 md:p-12">
      <span aria-hidden className="aurora aurora--lt" />
      <div className="relative">
        <div className="inline-flex items-center gap-2 rounded-full border border-line bg-canvas px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted">
          <CalendarClock aria-hidden className="h-3 w-3" strokeWidth={2} />
          {t.eyebrow}
        </div>

        <h2 id="coming-soon-card-title" className="mt-6 max-w-2xl font-display text-display-md font-medium tracking-tight text-balance text-ink">
          {t.title}
        </h2>
        <p className="mt-5 max-w-xl text-pretty text-[16px] leading-relaxed text-muted md:text-[17px]">
          {t.body}
        </p>
        <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.22em] text-subtle">{t.eta}</p>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          {prevHref ? (
            <Link
              href={prevHref}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 font-medium tracking-tight text-canvas hover:bg-ink/90"
            >
              <ArrowLeft aria-hidden className="h-4 w-4" strokeWidth={1.75} />
              {t.previous}
            </Link>
          ) : null}
          <Link
            href={trackHref}
            className="inline-flex h-12 items-center gap-2 rounded-full border border-line px-6 font-medium tracking-tight text-ink hover:border-ink"
          >
            {t.back}
            <ArrowRight aria-hidden className="h-4 w-4" strokeWidth={1.75} />
          </Link>
        </div>
      </div>
    </article>
  );
}
