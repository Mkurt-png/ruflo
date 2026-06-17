'use client';

import { useEffect, useRef, useState } from 'react';
import { NotebookPen, Check } from 'lucide-react';
import { scopedKey } from '@/lib/progress/scope';

type Locale = 'fr' | 'en';

const STORAGE_PREFIX = 'tickra-note:';
const SAVE_DEBOUNCE_MS = 600;

const copy = {
  fr: {
    label: 'Vos notes pour cette leçon',
    placeholder: 'Notez votre raisonnement, les questions à creuser, ce qui clique…',
    saved: 'Enregistré',
    saving: 'Enregistrement…',
    legend: 'Stockage local. Visible uniquement sur cet appareil.',
  },
  en: {
    label: 'Your notes for this lesson',
    placeholder: 'Jot down your reasoning, open questions, what clicks…',
    saved: 'Saved',
    saving: 'Saving…',
    legend: 'Local storage. Visible only on this device.',
  },
};

export function LessonNotes({ lessonId, locale }: { lessonId: string; locale: Locale }) {
  const t = copy[locale];
  const key = scopedKey(STORAGE_PREFIX + lessonId);
  const [value, setValue] = useState('');
  const [saved, setSaved] = useState(true);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored !== null) setValue(stored);
    } catch {
      /* ignore */
    }
  }, [key]);

  const onChange = (next: string) => {
    setValue(next);
    setSaved(false);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      try {
        window.localStorage.setItem(key, next);
        setSaved(true);
      } catch {
        /* quota */
      }
    }, SAVE_DEBOUNCE_MS);
  };

  return (
    <article className="rounded-sm border border-line bg-surface p-6 md:p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <NotebookPen aria-hidden className="h-4 w-4 text-ink" strokeWidth={1.6} />
          <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
            {t.label}
          </div>
        </div>
        <span
          role="status"
          aria-live="polite"
          aria-busy={!saved}
          className="inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.2em] text-subtle"
        >
          {saved ? <Check aria-hidden className="h-3 w-3" strokeWidth={2.5} /> : null}
          {saved ? t.saved : t.saving}
        </span>
      </div>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t.placeholder}
        rows={5}
        className="mt-5 block w-full resize-y rounded-sm border border-line bg-canvas px-4 py-3 text-[15px] leading-relaxed text-ink placeholder:text-subtle focus-visible:border-ink focus-visible:outline-none"
      />

      <p className="mt-4 font-mono text-[10.5px] uppercase tracking-[0.2em] text-subtle">
        {t.legend}
      </p>
    </article>
  );
}
