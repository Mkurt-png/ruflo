'use client';

import { useMemo, useState } from 'react';
import { Check, Copy, Share2 } from 'lucide-react';
import { useProgress } from '@/lib/progress/hook';
import { TRACKS } from '@/lib/curriculum/data';
import { encodeShare } from '@/lib/share/encode';
import { toast } from '@/components/site/ToastProvider';

type Locale = 'fr' | 'en';

const copy = {
  fr: {
    title: 'Partager mon profil',
    body: 'Génère un lien public avec votre nom d’affichage, vos leçons terminées et votre série. Aucun email, rien d’autre.',
    nameLabel: 'Nom d’affichage',
    namePlaceholder: 'Léa M.',
    generate: 'Générer le lien',
    copy: 'Copier',
    copied: 'Lien copié',
    open: 'Ouvrir',
  },
  en: {
    title: 'Share my profile',
    body: 'Generate a public link with your display name, completed lessons and streak. No email, nothing else.',
    nameLabel: 'Display name',
    namePlaceholder: 'Léa M.',
    generate: 'Generate link',
    copy: 'Copy',
    copied: 'Link copied',
    open: 'Open',
  },
};

function longestDailyStreak(stamps: number[]): number {
  if (stamps.length === 0) return 0;
  const days = new Set(stamps.map((ts) => new Date(ts).toDateString()));
  let best = 0;
  for (const k of days) {
    let run = 1;
    const start = new Date(k);
    for (;;) {
      const next = new Date(start);
      next.setDate(next.getDate() + run);
      if (!days.has(next.toDateString())) break;
      run += 1;
    }
    if (run > best) best = run;
  }
  return best;
}

export function ShareProfile({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const { state, ready } = useProgress();
  const [name, setName] = useState('');
  const [url, setUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const stats = useMemo(() => {
    if (!ready) return { lessons: 0, tracks: 0, streak: 0 };
    const lessons = Object.keys(state.completed).length;
    const tracks = TRACKS.filter((tr) => tr.lessons.every((l) => state.completed[l.id])).length;
    const streak = longestDailyStreak(Object.values(state.completed));
    return { lessons, tracks, streak };
  }, [state, ready]);

  const onGenerate = () => {
    const displayName = name.trim() || (locale === 'fr' ? 'Apprenant Tickra' : 'Tickra learner');
    const token = encodeShare({
      v: 1,
      n: displayName,
      l: stats.lessons,
      t: stats.tracks,
      s: stats.streak,
      d: new Date().toISOString(),
    });
    const link = `${window.location.origin}/${locale}/share/${token}`;
    setUrl(link);
  };

  const onCopy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({ tone: 'success', title: t.copied });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <article aria-labelledby="share-profile-title" className="rounded-sm border border-line bg-surface p-7 md:p-9">
      <div className="flex items-center gap-2.5">
        <Share2 aria-hidden className="h-4 w-4 text-ink" strokeWidth={1.6} />
        <h2 id="share-profile-title" className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">{t.title}</h2>
      </div>
      <p className="mt-3 max-w-md text-[14px] text-muted">{t.body}</p>

      <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-end">
        <div className="flex-1">
          <label
            htmlFor="share-name"
            className="block font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted"
          >
            {t.nameLabel}
          </label>
          <input
            id="share-name"
            type="text"
            maxLength={32}
            autoComplete="nickname"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.namePlaceholder}
            className="mt-2 h-11 w-full rounded-sm border border-line bg-canvas px-4 text-[15px] text-ink placeholder:text-subtle focus-visible:border-ink focus-visible:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={onGenerate}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-ink px-5 text-[14px] font-medium tracking-tight text-canvas transition-colors hover:bg-ink/90"
        >
          {t.generate}
        </button>
      </div>

      {url ? (
        <div className="mt-6 flex flex-col gap-2 rounded-sm border border-line bg-canvas p-4 md:flex-row md:items-center">
          <code className="flex-1 truncate font-mono text-[12px] text-muted">{url}</code>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCopy}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line px-3.5 font-mono text-[11px] uppercase tracking-[0.18em] text-muted transition-colors hover:border-ink hover:text-ink"
            >
              {copied ? <Check className="h-3.5 w-3.5" strokeWidth={2} /> : <Copy className="h-3.5 w-3.5" strokeWidth={1.6} />}
              {copied ? t.copied : t.copy}
            </button>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-ink px-3.5 font-mono text-[11px] uppercase tracking-[0.18em] text-canvas transition-colors hover:bg-ink/90"
            >
              {t.open}
            </a>
          </div>
        </div>
      ) : null}
    </article>
  );
}
