'use client';

// CarnetClient — reads local progress + mistakes, computes the absence
// carnet, and renders it as five editorial sections. No network.

import { useMemo } from 'react';
import Link from 'next/link';
import { useProgress } from '@/lib/progress/hook';
import { readCarnet, type Carnet } from '@/lib/tickra/carnet';
import type { Locale } from '@/lib/i18n/config';

const COPY = {
  fr: {
    loading: 'Ouverture du carnet…',
    nothingAway: 'Vous n’êtes pas parti — le carnet d’absence reste vide. Lisez ce que vous voulez.',
    daysAway: (n: number) => `${n} jour${n > 1 ? 's' : ''} d’absence`,
    lastActive: (d: string) => `Dernier passage : ${d}`,
    sections: {
      criees: 'Ce que la Criée a demandé',
      lettres: 'Les Lettres que vous n’avez pas lues',
      revisions: 'Les erreurs qui vous attendent',
      next: 'Là où l’on reprend',
    },
    noCriees: 'Aucune Criée ratée — vous êtes revenu à temps.',
    noLettres: 'Aucune Lettre manquée. Le dimanche reste à venir.',
    noRevisions: 'Aucune erreur en attente. Le registre est propre.',
    noNext: 'Vous avez tout lu. Écrivez la suite.',
    lettresN: (n: number) =>
      `${n} Lettre${n > 1 ? 's' : ''} non lue${n > 1 ? 's' : ''}. Elles sont conservées dans /lettre — chaque dimanche en garde une.`,
    revisionsN: (n: number) =>
      `${n} erreur${n > 1 ? 's' : ''} attend${n > 1 ? 'ent' : ''} d’être relue${n > 1 ? 's' : ''}. La révision est le travail le moins glorieux et le plus utile.`,
    openCriee: 'Lire la leçon source',
    openLettre: 'Ouvrir La Lettre',
    openReview: 'Ouvrir les erreurs',
    openNext: 'Reprendre ici',
    footer:
      'Tout ce carnet a été calculé chez vous — votre progression, vos erreurs, votre rythme. Rien n’a été envoyé.',
  },
  en: {
    loading: 'Opening the register…',
    nothingAway: 'You have not left — the absence register stays empty. Read what you want.',
    daysAway: (n: number) => `${n} day${n > 1 ? 's' : ''} away`,
    lastActive: (d: string) => `Last visit: ${d}`,
    sections: {
      criees: 'What La Criée asked',
      lettres: 'The Letters you did not read',
      revisions: 'The mistakes that wait',
      next: 'Where you resume',
    },
    noCriees: 'No missed Criée — you came back in time.',
    noLettres: 'No missed Letter. Sunday is yet to come.',
    noRevisions: 'No mistake pending. The register is clean.',
    noNext: 'You have read it all. Write the next.',
    lettresN: (n: number) =>
      `${n} unread Letter${n > 1 ? 's' : ''}. They are kept at /lettre — every Sunday holds one.`,
    revisionsN: (n: number) =>
      `${n} mistake${n > 1 ? 's' : ''} await${n > 1 ? '' : 's'} review. The work least glorious and most useful.`,
    openCriee: 'Open the source lesson',
    openLettre: 'Open The Letter',
    openReview: 'Open mistakes',
    openNext: 'Resume here',
    footer:
      'Every line in this register was computed in your browser — your progress, your mistakes, your pace. Nothing was sent.',
  },
} as const;

export function CarnetClient({ locale }: { locale: Locale }) {
  const { state, ready } = useProgress();
  const t = COPY[locale];

  const carnet: Carnet | null = useMemo(() => {
    if (!ready) return null;
    return readCarnet({
      completed: state.completed ?? {},
      mistakes: state.mistakes ?? {},
    });
  }, [ready, state]);

  if (!ready || !carnet) {
    return (
      <section className="mx-auto max-w-[920px] px-6 md:px-16 pb-32">
        <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-black/65">
          {t.loading}
        </p>
      </section>
    );
  }

  if (carnet.daysAway <= 0) {
    return (
      <section className="mx-auto max-w-[920px] px-6 md:px-16 pb-32">
        <p
          className="font-display italic text-[#0E0E0E]/75 max-w-[640px]"
          style={{ fontSize: 'clamp(20px, 2.4vw, 28px)', lineHeight: 1.25 }}
        >
          {t.nothingAway}
        </p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-[920px] px-6 md:px-16 pb-32">
      {/* Banner: days away + last visit */}
      <header className="border-b border-black/15 pb-6 mt-4 flex flex-wrap items-baseline justify-between gap-4">
        <span
          className="font-display italic text-[#0E0E0E] tabular-nums"
          style={{ fontSize: 'clamp(40px, 5vw, 64px)', letterSpacing: '-0.03em', lineHeight: 0.95 }}
        >
          {t.daysAway(carnet.daysAway)}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-black/55 tabular-nums">
          {t.lastActive(carnet.lastActiveDate)}
        </span>
      </header>

      {/* Section 1 — Criées */}
      <Section title={t.sections.criees} count={carnet.missedCriees.length}>
        {carnet.missedCriees.length === 0 ? (
          <Mute text={t.noCriees} />
        ) : (
          <ol className="space-y-6">
            {carnet.missedCriees.map((c) => (
              <li key={c.date} className="grid grid-cols-[8ch_1fr] gap-x-6 items-baseline">
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-black/55 tabular-nums">
                  {c.date.slice(5)}
                </span>
                <div>
                  <p
                    className="font-display italic text-[#0E0E0E]/85 text-balance"
                    style={{ fontSize: 'clamp(16px, 1.6vw, 19px)', lineHeight: 1.35 }}
                  >
                    « {c.question[locale]} »
                  </p>
                  <Link
                    href={c.href[locale]}
                    className="mt-2 inline-block font-mono text-[9.5px] uppercase tracking-[0.28em] text-black/55 hover:text-black/90"
                  >
                    {t.openCriee} →
                  </Link>
                </div>
              </li>
            ))}
          </ol>
        )}
      </Section>

      {/* Section 2 — Lettres */}
      <Section title={t.sections.lettres} count={carnet.missedLettres}>
        {carnet.missedLettres === 0 ? (
          <Mute text={t.noLettres} />
        ) : (
          <>
            <p
              className="font-display text-[#0E0E0E]/80 max-w-[640px]"
              style={{ fontSize: 'clamp(16px, 1.6vw, 19px)', lineHeight: 1.45 }}
            >
              {t.lettresN(carnet.missedLettres)}
            </p>
            <Link
              href={`/${locale}/lettre`}
              className="mt-4 inline-block font-mono text-[10px] uppercase tracking-[0.28em] text-black/55 hover:text-black/90"
            >
              {t.openLettre} →
            </Link>
          </>
        )}
      </Section>

      {/* Section 3 — Révisions */}
      <Section title={t.sections.revisions} count={carnet.dueMistakes}>
        {carnet.dueMistakes === 0 ? (
          <Mute text={t.noRevisions} />
        ) : (
          <>
            <p
              className="font-display text-[#0E0E0E]/80 max-w-[640px]"
              style={{ fontSize: 'clamp(16px, 1.6vw, 19px)', lineHeight: 1.45 }}
            >
              {t.revisionsN(carnet.dueMistakes)}
            </p>
            <Link
              href={`/${locale}/learn`}
              className="mt-4 inline-block font-mono text-[10px] uppercase tracking-[0.28em] text-black/55 hover:text-black/90"
            >
              {t.openReview} →
            </Link>
          </>
        )}
      </Section>

      {/* Section 4 — Reprendre */}
      <Section title={t.sections.next}>
        {!carnet.next ? (
          <Mute text={t.noNext} />
        ) : (
          <>
            <p
              className="font-display italic text-[#0E0E0E]"
              style={{ fontSize: 'clamp(20px, 2.4vw, 30px)', letterSpacing: '-0.02em', lineHeight: 1.2 }}
            >
              « {carnet.next.title[locale]} »
            </p>
            <Link
              href={`/${locale}/learn/${carnet.next.trackSlug}/${carnet.next.lessonSlug}`}
              className="mt-6 inline-flex h-10 items-center rounded-full border border-black/70 px-5 font-mono text-[11px] uppercase tracking-[0.22em] text-[#0E0E0E] hover:bg-[#0E0E0E] hover:text-[#F4F1EA] transition-colors"
            >
              {t.openNext} →
            </Link>
          </>
        )}
      </Section>

      <footer className="mt-24 border-t border-black/15 pt-6">
        <p className="font-mono text-[10.5px] leading-relaxed text-black/65 max-w-[640px]">
          {t.footer}
        </p>
      </footer>
    </section>
  );
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-16 border-t border-black/15 pt-8 first:border-0 first:mt-12 first:pt-0">
      <header className="flex items-baseline justify-between gap-4">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.32em] text-black/65">
          {title}
        </h2>
        {typeof count === 'number' && (
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-black/45 tabular-nums">
            {count}
          </span>
        )}
      </header>
      <div className="mt-8">{children}</div>
    </section>
  );
}

function Mute({ text }: { text: string }) {
  return (
    <p
      className="font-display italic text-[#0E0E0E]/55 max-w-[640px]"
      style={{ fontSize: 'clamp(16px, 1.6vw, 19px)', lineHeight: 1.45 }}
    >
      {text}
    </p>
  );
}

export default CarnetClient;
