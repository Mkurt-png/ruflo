'use client';

import { cn } from '@/lib/cn';

type Locale = 'fr' | 'en';
type Phase = 'brief' | 'drill' | 'quiz' | 'done';

const copy = {
  fr: { brief: 'Exposé', drill: 'Exercice', quiz: 'Quiz', done: 'Validée' },
  en: { brief: 'Brief', drill: 'Drill', quiz: 'Quiz', done: 'Done' },
};

const order: Phase[] = ['brief', 'drill', 'quiz', 'done'];

export function LessonToc({ phase, locale }: { phase: Phase; locale: Locale }) {
  const t = copy[locale];
  const labels: Record<Phase, string> = { brief: t.brief, drill: t.drill, quiz: t.quiz, done: t.done };
  const i = order.indexOf(phase);

  return (
    <nav aria-label={locale === 'fr' ? 'Progression de la leçon' : 'Lesson progress'} className="sticky top-24 hidden lg:block">
      <ol className="space-y-2 border-l border-line pl-5">
        {order.map((p, idx) => {
          const state =
            idx < i ? 'past' : idx === i ? 'current' : 'future';
          return (
            <li key={p} className="flex items-center gap-3">
              <span
                aria-hidden
                className={cn(
                  '-ml-[26px] inline-flex h-2 w-2 rounded-full',
                  state === 'past' && 'bg-ink',
                  state === 'current' && 'bg-ink ring-4 ring-ink/15',
                  state === 'future' && 'bg-line',
                )}
              />
              <span
                className={cn(
                  'font-mono text-[11px] uppercase tracking-[0.22em]',
                  state === 'past' && 'text-muted',
                  state === 'current' && 'text-ink',
                  state === 'future' && 'text-subtle',
                )}
              >
                {String(idx + 1).padStart(2, '0')} · {labels[p]}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
