'use client';

import Link from 'next/link';
import { Award, Printer } from 'lucide-react';
import { useProgress } from '@/lib/progress/hook';
import type { TrackMeta } from '@/lib/curriculum/data';

type Locale = 'fr' | 'en';

const copy = {
  fr: {
    eyebrow: 'Certificat de piste',
    decoree: 'Décerné à',
    anonymous: '— anonyme —',
    body: 'Pour avoir validé l’ensemble des leçons et le point de contrôle de la piste.',
    issued: 'Délivré le',
    notQualified: 'Le certificat se débloque à la dernière leçon de la piste.',
    progressLabel: 'Progression',
    keepGoing: 'Continuer la piste',
    print: 'Imprimer',
    signature: 'Marc Hauser · Curriculum',
    signature2: 'Inès Vidal · Produit',
    refTitle: 'Référence',
    levelLabel: { foundations: 'Fondations', intermediate: 'Intermédiaire', advanced: 'Avancé', mastery: 'Maîtrise' },
  },
  en: {
    eyebrow: 'Track certificate',
    decoree: 'Awarded to',
    anonymous: '— anonymous —',
    body: 'For completing all lessons and the checkpoint of the track.',
    issued: 'Issued',
    notQualified: 'The certificate unlocks at the last lesson of the track.',
    progressLabel: 'Progress',
    keepGoing: 'Keep going on the track',
    print: 'Print',
    signature: 'Marc Hauser · Curriculum',
    signature2: 'Inès Vidal · Product',
    refTitle: 'Reference',
    levelLabel: { foundations: 'Foundations', intermediate: 'Intermediate', advanced: 'Advanced', mastery: 'Mastery' },
  },
};

export function TrackCertificate({
  locale,
  track,
  email,
}: {
  locale: Locale;
  track: TrackMeta;
  email: string | null;
}) {
  const t = copy[locale];
  const { state, ready } = useProgress();

  const stamps = track.lessons
    .map((l) => state.completed[l.id])
    .filter((v): v is number => Boolean(v));
  const done = ready && stamps.length === track.lessons.length;
  const earnedAt = done && stamps.length > 0 ? Math.max(...stamps) : null;
  const completedDate = earnedAt
    ? new Date(earnedAt).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '—';
  const refId = `TKR-${track.slug.slice(0, 4).toUpperCase()}-${stamps.length.toString().padStart(2, '0')}-${hash(email ?? 'anon').slice(0, 6).toUpperCase()}`;

  if (!done) {
    return (
      <div className="mx-auto max-w-2xl rounded-sm border border-line bg-surface p-10 text-center">
        <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
          {t.eyebrow}
        </div>
        <h1 className="mt-6 font-display text-3xl font-medium tracking-tight text-balance text-ink md:text-4xl">
          {t.notQualified}
        </h1>
        <div className="mt-10 flex items-center justify-center gap-4">
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
            {t.progressLabel}
          </div>
          <div
            role="progressbar"
            aria-valuenow={stamps.length}
            aria-valuemin={0}
            aria-valuemax={track.lessons.length}
            aria-label={t.progressLabel}
            className="h-1 w-48 rounded-full bg-line"
          >
            <div
              className="h-1 rounded-full bg-ink"
              style={{ width: `${Math.round((stamps.length / track.lessons.length) * 100)}%` }}
            />
          </div>
          <div className="font-mono tabular-nums text-[12px] text-ink">
            {stamps.length} / {track.lessons.length}
          </div>
        </div>
        <Link
          href={`/${locale}/learn/${track.slug}`}
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
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className="flex h-9 w-9 items-center justify-center rounded-full border border-ink bg-ink text-canvas print:bg-black"
              >
                <Award className="h-4 w-4" strokeWidth={1.6} />
              </span>
              <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-muted">
                {t.eyebrow}
              </div>
            </div>
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
              {t.refTitle} · {refId}
            </div>
          </div>

          <div className="py-10 md:py-14">
            <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted">
              {t.decoree}
            </div>
            <div className="mt-5 font-display text-4xl font-medium tracking-tight text-ink md:text-5xl">
              {email ?? t.anonymous}
            </div>
            <div className="mt-10 font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
              {t.levelLabel[track.level]}
            </div>
            <h2 className="mt-3 font-display text-3xl font-medium tracking-tight text-ink md:text-4xl">
              {track.title[locale]}
            </h2>
            <p className="mt-8 max-w-xl text-[16px] leading-relaxed text-muted">{t.body}</p>
          </div>

          <div className="grid grid-cols-2 items-end gap-6 border-t border-line pt-6 print:border-black">
            <div>
              <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted">
                {t.issued}
              </div>
              <div className="mt-2 font-display text-lg font-medium tracking-tight text-ink">
                {completedDate}
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
