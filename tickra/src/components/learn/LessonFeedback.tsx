'use client';

import { useEffect, useState } from 'react';
import { Check, ThumbsDown, ThumbsUp } from 'lucide-react';
import { cn } from '@/lib/cn';

type Locale = 'fr' | 'en';
type Vote = 'up' | 'down';

const STORAGE_PREFIX = 'tickra-feedback:';

const copy = {
  fr: {
    title: 'Cette leçon vous a‑t‑elle aidé ?',
    up: 'Oui',
    down: 'Pas vraiment',
    notePrompt: 'Optionnel — qu’est-ce qui aurait été plus utile ?',
    submit: 'Envoyer',
    thanks: 'Merci. Reçu.',
  },
  en: {
    title: 'Did this lesson help?',
    up: 'Yes',
    down: 'Not really',
    notePrompt: 'Optional — what would have helped more?',
    submit: 'Send',
    thanks: 'Thanks. Got it.',
  },
};

function readStored(lessonId: string): Vote | null {
  try {
    const v = window.localStorage.getItem(STORAGE_PREFIX + lessonId);
    return v === 'up' || v === 'down' ? v : null;
  } catch {
    return null;
  }
}

function writeStored(lessonId: string, vote: Vote) {
  try {
    window.localStorage.setItem(STORAGE_PREFIX + lessonId, vote);
  } catch {
    /* ignore */
  }
}

export function LessonFeedback({ lessonId, locale }: { lessonId: string; locale: Locale }) {
  const t = copy[locale];
  const [vote, setVote] = useState<Vote | null>(null);
  const [note, setNote] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const stored = readStored(lessonId);
    if (stored) {
      setVote(stored);
      setSent(true);
    }
  }, [lessonId]);

  const pickVote = (v: Vote) => {
    setVote(v);
    writeStored(lessonId, v);
    // Fire-and-forget — keeps UX instant.
    fetch('/api/feedback', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ lessonId, vote: v }),
      keepalive: true,
    }).catch(() => {
      /* swallow */
    });
    // Mark sent immediately for thumbs-up; thumbs-down opens the note form.
    if (v === 'up') setSent(true);
  };

  const sendNote = () => {
    if (!vote) return;
    fetch('/api/feedback', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ lessonId, vote, note }),
      keepalive: true,
    }).catch(() => {
      /* swallow */
    });
    setSent(true);
  };

  return (
    <article className="rounded-sm border border-line bg-surface p-6 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
          {t.title}
        </div>
        {sent && vote === 'up' ? (
          <span className="inline-flex items-center gap-2 text-[13.5px] text-up">
            <Check aria-hidden className="h-3.5 w-3.5" strokeWidth={2} />
            {t.thanks}
          </span>
        ) : (
          <div className="flex gap-2">
            <VoteButton active={vote === 'up'} onClick={() => pickVote('up')}>
              <ThumbsUp aria-hidden className="h-3.5 w-3.5" strokeWidth={1.6} />
              {t.up}
            </VoteButton>
            <VoteButton active={vote === 'down'} onClick={() => pickVote('down')}>
              <ThumbsDown aria-hidden className="h-3.5 w-3.5" strokeWidth={1.6} />
              {t.down}
            </VoteButton>
          </div>
        )}
      </div>

      {vote === 'down' && !sent ? (
        <div className="mt-5 space-y-3">
          <label htmlFor={`note-${lessonId}`} className="block font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted">
            {t.notePrompt}
          </label>
          <textarea
            id={`note-${lessonId}`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="block w-full resize-y rounded-sm border border-line bg-canvas px-4 py-3 text-[14px] leading-relaxed text-ink placeholder:text-subtle focus-visible:border-ink focus-visible:outline-none"
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={sendNote}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-4 text-[13.5px] font-medium tracking-tight text-canvas transition-colors hover:bg-ink/90"
            >
              {t.submit}
            </button>
          </div>
        </div>
      ) : null}

      {sent && vote === 'down' ? (
        <p className="mt-5 inline-flex items-center gap-2 text-[13.5px] text-muted">
          <Check aria-hidden className="h-3.5 w-3.5" strokeWidth={2} />
          {t.thanks}
        </p>
      ) : null}
    </article>
  );
}

function VoteButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex h-9 items-center gap-2 rounded-full px-3.5 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors',
        active ? 'bg-ink text-canvas' : 'border border-line text-muted hover:border-ink hover:text-ink',
      )}
    >
      {children}
    </button>
  );
}
