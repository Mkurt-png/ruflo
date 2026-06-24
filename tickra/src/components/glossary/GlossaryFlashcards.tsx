'use client';

// TICKRA-PHASE-3: spaced-repetition flashcards over the glossary. Front shows
// the term, tap to flip and reveal the definition, then self-grade (Again /
// Hard / Good / Easy). Scheduling uses the SM-2 store (lib/learning/
// glossary-srs); progress persists in localStorage and grading awards XP.

import { useEffect, useMemo, useState } from 'react';
import { RotateCcw, Sparkles } from 'lucide-react';
import { cn } from '@/lib/cn';
import { GLOSSARY } from '@/lib/curriculum/glossary';
import { addXp } from '@/lib/progress/xp';
import {
  loadCards,
  saveCards,
  gradeCard,
  dueCount,
  selectStudyOrder,
  type CardMap,
} from '@/lib/learning/glossary-srs';
import type { Grade } from '@/lib/learning/sm2';

type Locale = 'fr' | 'en';

const XP_PER_CARD = 2;

const copy = {
  fr: {
    eyebrow: 'Mémorisation',
    title: 'Cartes mémoire',
    desc: 'Révise le vocabulaire en répétition espacée. Tes progrès restent sur cet appareil.',
    start: 'Démarrer la révision',
    due: 'à réviser',
    flip: 'Voir la définition',
    again: 'À revoir',
    hard: 'Difficile',
    good: 'Correct',
    easy: 'Facile',
    doneTitle: 'Session terminée',
    doneBody: 'Tu as révisé toutes les cartes dues. Reviens demain pour les suivantes.',
    restart: 'Recommencer',
    progress: 'Carte',
  },
  en: {
    eyebrow: 'Memorisation',
    title: 'Flashcards',
    desc: 'Drill the vocabulary with spaced repetition. Your progress stays on this device.',
    start: 'Start a review',
    due: 'due',
    flip: 'Reveal the definition',
    again: 'Again',
    hard: 'Hard',
    good: 'Good',
    easy: 'Easy',
    doneTitle: 'Session complete',
    doneBody: 'You reviewed every due card. Come back tomorrow for the next batch.',
    restart: 'Restart',
    progress: 'Card',
  },
};

const GRADES: { grade: Grade; key: keyof (typeof copy)['fr']; tone: string }[] = [
  { grade: 'again', key: 'again', tone: 'border-down text-down hover:bg-down hover:text-canvas' },
  { grade: 'hard', key: 'hard', tone: 'border-line text-ink hover:border-ink' },
  { grade: 'good', key: 'good', tone: 'border-line text-ink hover:border-ink' },
  { grade: 'easy', key: 'easy', tone: 'border-up text-up hover:bg-up hover:text-canvas' },
];

export function GlossaryFlashcards({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const keys = useMemo(() => GLOSSARY.map((g) => g.term.en), []);
  const byKey = useMemo(() => {
    const m = new Map<string, (typeof GLOSSARY)[number]>();
    for (const g of GLOSSARY) m.set(g.term.en, g);
    return m;
  }, []);

  const [cards, setCards] = useState<CardMap>({});
  const [hydrated, setHydrated] = useState(false);
  const [started, setStarted] = useState(false);
  const [queue, setQueue] = useState<string[]>([]);
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    setCards(loadCards());
    setHydrated(true);
  }, []);

  const due = hydrated ? dueCount(keys, cards, Date.now()) : 0;

  const begin = () => {
    const order = selectStudyOrder(keys, cards, Date.now()).filter((k) => {
      const s = cards[k];
      return !s || s.nextReviewAt <= Date.now();
    });
    // Fall back to the full ordered set if nothing is strictly due yet.
    const q = order.length > 0 ? order : selectStudyOrder(keys, cards, Date.now());
    setQueue(q);
    setPos(0);
    setFlipped(false);
    setStarted(true);
  };

  const grade = (g: Grade) => {
    const key = queue[pos];
    if (!key) return;
    const next: CardMap = { ...cards, [key]: gradeCard(cards[key], g, new Date()) };
    setCards(next);
    saveCards(next);
    addXp(XP_PER_CARD);
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('tickra-xp-changed'));
    setFlipped(false);
    setPos((p) => p + 1);
  };

  if (!hydrated) return null;

  const term = started && queue[pos] ? byKey.get(queue[pos]) : null;
  const finished = started && pos >= queue.length;

  return (
    <section className="rounded-sm border border-line bg-surface p-6 md:p-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.22em] text-brand">
            <Sparkles className="h-3 w-3" strokeWidth={2} />
            {t.eyebrow}
          </div>
          <h2 className="mt-2 font-display text-2xl font-medium tracking-tight text-ink">{t.title}</h2>
          <p className="mt-1 max-w-md text-[13.5px] leading-relaxed text-muted">{t.desc}</p>
        </div>
        <div className="text-right">
          <div className="font-display text-2xl font-medium tabular-nums text-ink">{due}</div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-subtle">{t.due}</div>
        </div>
      </div>

      {!started ? (
        <button
          type="button"
          onClick={begin}
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-[13.5px] font-medium text-canvas transition-all hover:-translate-y-0.5 hover:brightness-110"
        >
          {t.start}
        </button>
      ) : finished ? (
        <div className="mt-6">
          <p className="font-display text-xl font-medium text-ink">{t.doneTitle}</p>
          <p className="mt-1 text-[13.5px] text-muted">{t.doneBody}</p>
          <button
            type="button"
            onClick={begin}
            className="mt-4 inline-flex h-11 items-center gap-2 rounded-full border border-ink px-5 text-[13.5px] font-medium text-ink transition-colors hover:bg-ink hover:text-canvas"
          >
            <RotateCcw className="h-4 w-4" strokeWidth={1.75} />
            {t.restart}
          </button>
        </div>
      ) : term ? (
        <div className="mt-6">
          <div className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.18em] text-subtle">
            {t.progress} {pos + 1} / {queue.length}
          </div>
          <button
            type="button"
            onClick={() => setFlipped((f) => !f)}
            className="flex min-h-[160px] w-full flex-col items-center justify-center rounded-sm border border-line bg-canvas p-6 text-center transition-colors hover:border-ink"
          >
            <span className="font-display text-2xl font-medium tracking-tight text-ink">{term.term[locale]}</span>
            {flipped ? (
              <span className="mt-4 text-[14px] leading-relaxed text-muted">{term.definition[locale]}</span>
            ) : (
              <span className="mt-4 font-mono text-[10.5px] uppercase tracking-[0.18em] text-subtle">{t.flip}</span>
            )}
          </button>

          {flipped ? (
            <div className="mt-4 grid grid-cols-4 gap-2">
              {GRADES.map((g) => (
                <button
                  key={g.grade}
                  type="button"
                  onClick={() => grade(g.grade)}
                  className={cn(
                    'inline-flex h-11 items-center justify-center rounded-sm border text-[12.5px] font-medium transition-colors',
                    g.tone,
                  )}
                >
                  {t[g.key]}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
