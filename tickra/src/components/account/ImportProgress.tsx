'use client';

import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { toast } from '@/components/site/ToastProvider';
import { scopedKey } from '@/lib/progress/scope';

type Locale = 'fr' | 'en';

const PROGRESS_KEY = 'tickra-progress-v1';
const BOOKMARKS_KEY = 'tickra-bookmarks-v1';
const NOTE_PREFIX = 'tickra-note:';

const copy = {
  fr: {
    title: 'Importer une progression',
    body: 'Restaurez un export JSON kNOWTrade. La progression existante est fusionnée — rien n’est supprimé.',
    cta: 'Choisir un fichier',
    invalid: 'Fichier invalide. Vérifiez que c’est bien un export kNOWTrade.',
    imported: 'Import terminé.',
    badPayload: 'Payload non reconnu.',
  },
  en: {
    title: 'Import progress',
    body: 'Restore a kNOWTrade JSON export. Existing progress is merged — nothing is dropped.',
    cta: 'Choose a file',
    invalid: 'Invalid file. Check it is a kNOWTrade export.',
    imported: 'Import complete.',
    badPayload: 'Unrecognised payload.',
  },
};

type Payload = {
  app?: string;
  version?: number;
  completed?: Record<string, number>;
  mistakes?: Record<string, { lessonId: string; loggedAt: number; reviewedAt?: number }>;
  bookmarks?: Record<string, number>;
  notes?: Record<string, string>;
};

function mergeRecords<T>(a: Record<string, T> | undefined, b: Record<string, T> | undefined): Record<string, T> {
  return { ...(a ?? {}), ...(b ?? {}) };
}

export function ImportProgress({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [pending, setPending] = useState(false);

  const onPick = () => fileRef.current?.click();

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-importing the same file
    if (!file) return;
    setPending(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text) as Payload;
      if (data.app !== 'tickra') {
        toast({ tone: 'error', title: t.badPayload });
        return;
      }
      // Merge progress
      const existingProgressRaw = window.localStorage.getItem(scopedKey(PROGRESS_KEY));
      const existingProgress = existingProgressRaw ? JSON.parse(existingProgressRaw) : {};
      const mergedProgress = {
        completed: mergeRecords(existingProgress.completed, data.completed),
        mistakes: mergeRecords(existingProgress.mistakes, data.mistakes),
      };
      window.localStorage.setItem(scopedKey(PROGRESS_KEY), JSON.stringify(mergedProgress));

      // Merge bookmarks
      const existingBookmarksRaw = window.localStorage.getItem(scopedKey(BOOKMARKS_KEY));
      const existingBookmarks = existingBookmarksRaw ? JSON.parse(existingBookmarksRaw) : { bookmarks: {} };
      const mergedBookmarks = {
        bookmarks: mergeRecords(existingBookmarks.bookmarks, data.bookmarks),
      };
      window.localStorage.setItem(scopedKey(BOOKMARKS_KEY), JSON.stringify(mergedBookmarks));

      // Merge notes (key by lessonId, store as raw string)
      if (data.notes) {
        for (const [lessonId, body] of Object.entries(data.notes)) {
          if (typeof body === 'string') {
            window.localStorage.setItem(scopedKey(NOTE_PREFIX + lessonId), body);
          }
        }
      }

      toast({ tone: 'success', title: t.imported });
      // Force a reload so all components re-read fresh state.
      setTimeout(() => window.location.reload(), 600);
    } catch {
      toast({ tone: 'error', title: t.invalid });
    } finally {
      setPending(false);
    }
  };

  return (
    <article className="rounded-sm border border-line bg-surface p-7 md:p-9">
      <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">{t.title}</div>
      <p className="mt-3 max-w-md text-[14px] text-muted">{t.body}</p>
      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        onChange={onChange}
        className="sr-only"
        aria-hidden
      />
      <button
        type="button"
        onClick={onPick}
        disabled={pending}
        className="mt-6 inline-flex h-11 items-center gap-2 rounded-full border border-line bg-canvas px-5 text-[14px] font-medium tracking-tight text-ink transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Upload aria-hidden className="h-4 w-4" strokeWidth={1.75} />
        {t.cta}
      </button>
    </article>
  );
}
