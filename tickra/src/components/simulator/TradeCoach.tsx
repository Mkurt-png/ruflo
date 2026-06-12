'use client';

// TICKRA-PHASE-2.2: AI Trade Coach. After each closed trade, the user can
// hit "Coach review" → the trade context is sent to Claude → a short
// pedagogical analysis comes back. Pro/Lifetime only (Trade Coach is a
// premium-perceived feature).

import { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';

type Locale = 'fr' | 'en';

type TradeInput = {
  symbol: string;
  side: 'long' | 'short';
  sizeLots: number;
  entry: number;
  exit: number;
  stopPips: number;
  tpPips: number;
  pnl: number;
  closeReason: 'tp' | 'sl' | 'manual';
};

const copy = {
  fr: {
    cta: 'Demander une revue IA',
    loading: 'Analyse en cours…',
    proRequired: 'Trade Coach est réservé aux abonnés Pro/Lifetime.',
    quotaExceeded: 'Limite quotidienne atteinte. Réessayez demain.',
    error: 'Erreur de communication avec le Coach. Réessayez.',
    notConfigured: 'Le Coach n’est pas encore activé sur cette instance.',
    eyebrow: 'Coach IA · Revue pédagogique',
  },
  en: {
    cta: 'Ask AI for a review',
    loading: 'Analysing…',
    proRequired: 'Trade Coach is reserved for Pro/Lifetime subscribers.',
    quotaExceeded: 'Daily limit reached. Try again tomorrow.',
    error: 'Error talking to the Coach. Try again.',
    notConfigured: 'The Coach is not yet enabled on this instance.',
    eyebrow: 'AI Coach · Educational review',
  },
};

export function TradeCoach({ locale, trade }: { locale: Locale; trade: TradeInput }) {
  const t = copy[locale];
  const [review, setReview] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ask = async () => {
    setError(null);
    setPending(true);
    setReview(null);
    try {
      const r = await fetch('/api/ai/trade-review', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...trade, locale }),
      });
      if (r.status === 403) {
        setError(t.proRequired);
        return;
      }
      if (r.status === 429) {
        setError(t.quotaExceeded);
        return;
      }
      if (r.status === 501) {
        setError(t.notConfigured);
        return;
      }
      if (!r.ok) {
        setError(t.error);
        return;
      }
      const data = (await r.json()) as { review?: string };
      if (data.review) setReview(data.review);
    } catch {
      setError(t.error);
    } finally {
      setPending(false);
    }
  };

  if (review) {
    return (
      <div className="mt-3 rounded-sm border border-brand/40 bg-brand/5 p-4">
        <div className="inline-flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.22em] text-brand">
          <Sparkles className="h-3 w-3" strokeWidth={2} />
          {t.eyebrow}
        </div>
        <p className="mt-3 whitespace-pre-wrap text-[13.5px] leading-relaxed text-ink">{review}</p>
      </div>
    );
  }

  if (error) {
    return <p className="mt-2 text-[12px] text-down">{error}</p>;
  }

  return (
    <button
      type="button"
      onClick={ask}
      disabled={pending}
      className="mt-2 inline-flex h-8 items-center gap-1.5 rounded-full border border-line px-3 text-[11px] uppercase tracking-[0.18em] text-muted hover:border-brand hover:text-brand disabled:opacity-60"
    >
      {pending ? <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2} /> : <Sparkles className="h-3 w-3" strokeWidth={2} />}
      {pending ? t.loading : t.cta}
    </button>
  );
}
