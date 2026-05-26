'use client';

import { Download } from 'lucide-react';
import { useProgress } from '@/lib/progress/hook';
import { useBookmarks } from '@/lib/progress/bookmarks';
import { toast } from '@/components/site/ToastProvider';

type Locale = 'fr' | 'en';

const copy = {
  fr: {
    title: 'Exporter ma progression',
    body: 'Téléchargez vos leçons terminées, vos erreurs, vos favoris et vos notes au format JSON. Vous restez propriétaire de vos données.',
    cta: 'Télécharger (.json)',
    toast: 'Export prêt — vérifiez vos téléchargements.',
  },
  en: {
    title: 'Export my progress',
    body: 'Download your completed lessons, mistakes, bookmarks and notes as JSON. You own your data.',
    cta: 'Download (.json)',
    toast: 'Export ready — check your downloads.',
  },
};

const NOTE_PREFIX = 'tickra-note:';

function collectNotes(): Record<string, string> {
  const out: Record<string, string> = {};
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (!k || !k.startsWith(NOTE_PREFIX)) continue;
      const v = window.localStorage.getItem(k);
      if (v) out[k.slice(NOTE_PREFIX.length)] = v;
    }
  } catch {
    /* ignore */
  }
  return out;
}

export function ExportProgress({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const { state: progress, ready: progressReady } = useProgress();
  const { state: bookmarks, ready: bookmarksReady } = useBookmarks();

  const onExport = () => {
    const payload = {
      app: 'tickra',
      version: 1,
      exportedAt: new Date().toISOString(),
      completed: progress.completed,
      mistakes: progress.mistakes ?? {},
      bookmarks: bookmarks.bookmarks,
      notes: collectNotes(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tickra-progress-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ tone: 'success', title: t.toast });
  };

  const ready = progressReady && bookmarksReady;

  return (
    <article className="rounded-sm border border-line bg-surface p-7 md:p-9">
      <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">{t.title}</div>
      <p className="mt-3 max-w-md text-[14px] text-muted">{t.body}</p>
      <button
        type="button"
        onClick={onExport}
        disabled={!ready}
        className="mt-6 inline-flex h-11 items-center gap-2 rounded-full border border-line bg-canvas px-5 text-[14px] font-medium tracking-tight text-ink transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Download aria-hidden className="h-4 w-4" strokeWidth={1.75} />
        {t.cta}
      </button>
    </article>
  );
}
