import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Award, ArrowRight } from 'lucide-react';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { Navbar } from '@/components/nav/Navbar';
import { Footer } from '@/components/sections/Footer';
import { Container } from '@/components/ui/Container';
import { decodeShare } from '@/lib/share/encode';
import { totalLessons } from '@/lib/curriculum/data';

type Params = { locale: string; token: string };

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Params }) {
  const payload = decodeShare(params.token);
  if (!payload) return { robots: { index: false, follow: false } };
  return {
    title: `${payload.n} · Tickra`,
    description: `${payload.l} lessons, ${payload.t} tracks, ${payload.s}-day streak on Tickra.`,
    // Per-user share tokens: never indexable but social previews should
    // still render (the OG remains intact).
    robots: { index: false, follow: false },
  };
}

const copy = {
  fr: {
    eyebrow: 'Profil partagé',
    summary: 'progresse sur Tickra.',
    lessons: 'leçons',
    tracks: 'pistes',
    streak: 'jours de série',
    cta: 'Commencer mon parcours',
    learn: 'En savoir plus sur Tickra',
    generatedAt: 'Généré le',
    of: 'sur',
  },
  en: {
    eyebrow: 'Shared profile',
    summary: 'is progressing on Tickra.',
    lessons: 'lessons',
    tracks: 'tracks',
    streak: 'day streak',
    cta: 'Start my own',
    learn: 'Learn about Tickra',
    generatedAt: 'Generated',
    of: 'of',
  },
};

export default async function SharePage({ params }: { params: Params }) {
  if (!isLocale(params.locale)) notFound();
  const locale: Locale = params.locale;
  const payload = decodeShare(params.token);
  if (!payload) notFound();
  const dict = await getDictionary(locale);
  const t = copy[locale];

  const total = totalLessons();
  const ratio = total > 0 ? Math.min(1, payload.l / total) : 0;
  const date = new Date(payload.d).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <>
      <Navbar dict={dict} locale={locale} />
      <main id="main">
        <section className="border-b border-line">
          <Container as="div" className="py-20 md:py-28">
            <div className="mx-auto max-w-3xl rounded-sm border border-ink bg-surface p-10 md:p-14">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-canvas"
                >
                  <Award className="h-4 w-4" strokeWidth={1.6} />
                </span>
                <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
                  {t.eyebrow}
                </div>
              </div>

              <h1 className="mt-8 font-display text-display-md font-medium tracking-tight text-balance text-ink">
                {payload.n}
              </h1>
              <p className="mt-3 text-[17px] leading-relaxed text-muted md:text-lg">
                {t.summary}
              </p>

              <dl className="mt-10 grid grid-cols-3 gap-px overflow-hidden rounded-sm bg-line">
                <Stat label={`${t.lessons} / ${total}`} value={String(payload.l)} />
                <Stat label={t.tracks} value={String(payload.t)} />
                <Stat label={t.streak} value={String(payload.s)} />
              </dl>

              <div className="mt-6 h-1 w-full rounded-full bg-line">
                <div
                  className="h-1 rounded-full bg-ink"
                  style={{ width: `${Math.round(ratio * 100)}%` }}
                />
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-3">
                <Link
                  href={`/${locale}/onboarding`}
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 text-[15px] font-medium tracking-tight text-canvas transition-colors hover:bg-ink/90"
                >
                  {t.cta}
                  <ArrowRight aria-hidden className="h-4 w-4" strokeWidth={1.75} />
                </Link>
                <Link
                  href={`/${locale}`}
                  className="inline-flex h-12 items-center gap-2 rounded-full border border-line px-6 text-[15px] font-medium tracking-tight text-ink transition-colors hover:border-ink"
                >
                  {t.learn}
                </Link>
              </div>

              <p className="mt-10 font-mono text-[10.5px] uppercase tracking-[0.2em] text-subtle">
                {t.generatedAt} {date}
              </p>
            </div>
          </Container>
        </section>
      </main>
      <Footer dict={dict} locale={locale} />
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-2 bg-surface p-5">
      <span className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-muted">{label}</span>
      <span className="font-display text-3xl font-medium tracking-tight tabular-nums text-ink md:text-4xl">
        {value}
      </span>
    </div>
  );
}
