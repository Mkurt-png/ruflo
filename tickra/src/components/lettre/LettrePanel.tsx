'use client';

// LettrePanel — La Lettre du dimanche. Reads local progress + Cote,
// finds the next plausible lesson candidate, then renders the three
// editorial sections in the ledger register (numbered, mono caption,
// serif body) on ivory paper.

import { useMemo } from 'react';
import { useProgress } from '@/lib/progress/hook';
import { useCote } from '@/lib/tickra/useCote';
import { TRACKS } from '@/lib/curriculum/data';
import { composeLetter, type LetterContext } from '@/lib/tickra/lettre';

type Locale = 'fr' | 'en';

const DAY = 86_400_000;

function pickUpNext(completed: Record<string, number>): LetterContext['upNext'] {
  for (const track of TRACKS) {
    for (const lesson of track.lessons) {
      if (!completed[lesson.id]) {
        return { trackSlug: track.slug, lessonSlug: lesson.slug, title: lesson.title };
      }
    }
  }
  return undefined;
}

function computeStreak(completed: Record<string, number>): number {
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

export function LettrePanel({ locale }: { locale: Locale }) {
  const { state, ready } = useProgress();
  const { cote } = useCote();

  const letter = useMemo(() => {
    if (!ready) return null;
    const ctx: LetterContext = {
      completed: state.completed ?? {},
      mistakes: state.mistakes ?? {},
      streakDays: computeStreak(state.completed ?? {}),
      cote: cote.score,
      coteDelta: cote.delta,
      upNext: pickUpNext(state.completed ?? {}),
    };
    return composeLetter(ctx);
  }, [ready, state, cote]);

  const formattedDate = letter
    ? new Date(letter.date).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

  const t = COPY[locale];

  if (!ready || !letter) {
    return (
      <section className="mx-auto max-w-[920px] px-6 md:px-16 py-24">
        <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-black/45">
          {t.loading}
        </p>
      </section>
    );
  }

  return (
    <article className="mx-auto max-w-[920px] px-6 md:px-16 pb-32">
      <header className="flex items-baseline justify-between gap-6 border-b border-black/15 pb-4">
        <span className="font-mono text-[10px] uppercase tracking-[0.34em] text-black/55">
          {t.eyebrow}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.34em] text-black/45 tabular-nums">
          {formattedDate}
        </span>
      </header>

      {letter.empty ? (
        <p
          className="mt-16 font-display italic font-light text-[#0E0E0E]/70 max-w-[640px]"
          style={{ fontSize: 'clamp(22px, 2.6vw, 30px)', lineHeight: 1.25 }}
        >
          {t.empty}
        </p>
      ) : (
        <div className="mt-16 space-y-20">
          {letter.sections.map((section, sIdx) => (
            <section key={section.id} aria-labelledby={`s-${section.id}`}>
              <div className="flex items-baseline gap-6">
                <span className="font-mono text-[11px] tracking-[0.22em] text-black/45 tabular-nums">
                  {String(sIdx + 1).padStart(2, '0')}
                </span>
                <h2
                  id={`s-${section.id}`}
                  className="font-display italic font-light text-[#0E0E0E]"
                  style={{ fontSize: 'clamp(28px, 4vw, 44px)', letterSpacing: '-0.02em' }}
                >
                  {section.title[locale]}
                </h2>
              </div>
              <ol className="mt-8 space-y-6 pl-[calc(2ch+1.5rem)]">
                {section.lines.map((line, i) => (
                  <li
                    key={i}
                    className="grid grid-cols-[2ch_1fr] gap-x-6 items-baseline"
                  >
                    <span className="font-mono text-[10px] tracking-[0.22em] text-black/35 tabular-nums">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <p
                      className="font-display leading-snug text-[#0E0E0E]/85 text-balance"
                      style={{ fontSize: 'clamp(17px, 1.8vw, 21px)' }}
                    >
                      {line[locale]}
                    </p>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}

      <footer className="mt-24 border-t border-black/15 pt-6">
        <p className="font-mono text-[10.5px] leading-relaxed text-black/45">
          {t.footer}
        </p>
      </footer>
    </article>
  );
}

const COPY = {
  fr: {
    eyebrow: 'La Lettre — dimanche',
    loading: 'Ouverture du registre…',
    empty:
      'La lettre attend que la semaine commence. Ouvrez une leçon, écrivez un trade, marquez une erreur. Le registre se remplit, la lettre suivra.',
    footer:
      'Rédigée localement à partir de votre progression. Rien n’est envoyé : votre semaine reste dans votre navigateur.',
  },
  en: {
    eyebrow: 'The Letter — Sunday',
    loading: 'Opening the register…',
    empty:
      'The letter waits for the week to begin. Open a lesson, log a trade, mark a mistake. The register fills, the letter follows.',
    footer:
      'Composed locally from your progress. Nothing is sent: your week stays in your browser.',
  },
} as const;

export default LettrePanel;
