'use client';

import { useState } from 'react';

// Account-panel sub-component. Toggles the user's weekly_digest_opt_in
// flag via /api/me/digest. Optimistic UI with a rollback on failure.

type Props = {
  initialOptIn: boolean;
  locale: 'fr' | 'en';
};

const COPY = {
  fr: {
    label: 'Digest hebdomadaire',
    body: 'Recevoir un e-mail récap chaque dimanche (XP, leçons, série, prochaine leçon).',
    on: 'Activé',
    off: 'Désactivé',
    error: 'Impossible de mettre à jour pour le moment.',
  },
  en: {
    label: 'Weekly digest',
    body: 'Receive a Sunday recap email (XP, lessons, streak, next lesson).',
    on: 'On',
    off: 'Off',
    error: 'Could not update right now.',
  },
} as const;

export function DigestToggle({ initialOptIn, locale }: Props) {
  const t = COPY[locale];
  const [optIn, setOptIn] = useState(initialOptIn);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function toggle() {
    if (busy) return;
    const next = !optIn;
    setOptIn(next);
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch('/api/me/digest', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ optIn: next }),
      });
      if (!r.ok) throw new Error('failed');
    } catch {
      setOptIn(!next);
      setErr(t.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink">{t.label}</p>
        <p className="mt-1 text-xs text-muted">{t.body}</p>
        {err && <p className="mt-1 text-xs text-down">{err}</p>}
      </div>
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        aria-pressed={optIn}
        className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
          optIn
            ? 'bg-brand text-canvas'
            : 'border border-line text-muted hover:text-ink'
        }`}
      >
        {optIn ? t.on : t.off}
      </button>
    </div>
  );
}
