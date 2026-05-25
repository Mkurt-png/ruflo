'use client';

import Link from 'next/link';
import { Printer } from 'lucide-react';
import { useProgress } from '@/lib/progress/hook';
import { totalLessons } from '@/lib/curriculum/data';

type Locale = 'fr' | 'en';

const copy = {
  fr: {
    eyebrow: 'Diplôme Tickra',
    decoree: 'Décerné à',
    anonymous: '— anonyme —',
    body: 'Pour avoir suivi le cursus Tickra, complété les exercices et les points de contrôle des onze pistes.',
    issued: 'Délivré le',
    notQualified: 'Le diplôme se débloque à la dernière leçon.',
    progressLabel: 'Progression',
    keepGoing: 'Continuer',
    print: 'Imprimer mon diplôme',
    signature: 'Marc Hauser · Curriculum',
    signature2: 'Inès Vidal · Produit',
    refTitle: 'Référence',
  },
  en: {
    eyebrow: 'Tickra diploma',
    decoree: 'Awarded to',
    anonymous: '— anonymous —',
    body: 'For completing the Tickra curriculum, all drills and checkpoints across eleven tracks.',
    issued: 'Issued',
    notQualified: 'The diploma unlocks at the last lesson.',
    progressLabel: 'Progress',
    keepGoing: 'Keep going',
    print: 'Print my diploma',
    signature: 'Marc Hauser · Curriculum',
    signature2: 'Inès Vidal · Product',
    refTitle: 'Reference',
  },
};

export function DiplomaCard({ locale, email }: { locale: Locale; email: string | null }) {
  const t = copy[locale];
  const { completedCount, ready } = useProgress();
  const total = totalLessons();
  const qualified = ready && completedCount >= total;
  const today = new Date().toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const refId = email
    ? `TKR-${hash(email).slice(0, 8).toUpperCase()}-${String(completedCount).padStart(3, '0')}`
    : `TKR-LOCAL-${String(completedCount).padStart(3, '0')}`;

  if (!qualified) {
    return (
      <div className="mx-auto max-w-2xl rounded-sm border border-line bg-surface p-10 text-center">
        <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
          {t.eyebrow}
        </div>
        <h1 className="mt-6 font-display text-4xl font-medium tracking-tight text-balance text-ink">
          {t.notQualified}
        </h1>
        <div className="mt-10 flex items-center justify-center gap-4">
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
            {t.progressLabel}
          </div>
          <div className="h-1 w-48 rounded-full bg-line">
            <div
              className="h-1 rounded-full bg-ink"
              style={{ width: `${Math.round((completedCount / total) * 100)}%` }}
            />
          </div>
          <div className="font-mono tabular-nums text-[12px] text-ink">
            {completedCount} / {total}
          </div>
        </div>
        <Link
          href={`/${locale}/learn`}
          className="mt-10 inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 text-[15px] font-medium tracking-tight text-canvas transition-colors hover:bg-ink/90"
        >
          {t.keepGoing}
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-3xl">
        <div className="rounded-sm border border-ink bg-surface p-10 md:p-16 print:border-black print:bg-white">
          <div className="flex items-center justify-between border-b border-line pb-6 print:border-black">
            <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-muted">
              {t.eyebrow}
            </div>
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
              {t.refTitle} · {refId}
            </div>
          </div>

          <div className="py-10 md:py-16">
            <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted">
              {t.decoree}
            </div>
            <div className="mt-6 font-display text-5xl font-medium tracking-tight text-ink md:text-6xl">
              {email ?? t.anonymous}
            </div>
            <p className="mt-10 max-w-xl text-[16px] leading-relaxed text-muted">{t.body}</p>
          </div>

          <div className="grid grid-cols-2 items-end gap-6 border-t border-line pt-6 print:border-black">
            <div>
              <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted">
                {t.issued}
              </div>
              <div className="mt-2 font-display text-lg font-medium tracking-tight text-ink">
                {today}
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
                {t.signature}
              </div>
              <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
                {t.signature2}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-10 flex max-w-3xl justify-end gap-3 print:hidden">
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex h-12 items-center gap-2 rounded-full border border-line px-6 text-[15px] font-medium tracking-tight text-ink transition-colors hover:border-ink"
        >
          <Printer aria-hidden className="h-4 w-4" strokeWidth={1.75} />
          {t.print}
        </button>
      </div>
    </>
  );
}

function hash(input: string): string {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h << 5) - h + input.charCodeAt(i);
  return Math.abs(h).toString(36);
}
