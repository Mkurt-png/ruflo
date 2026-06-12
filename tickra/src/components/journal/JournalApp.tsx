'use client';

import { useMemo, useState } from 'react';
import type { Locale } from '@/lib/i18n/config';
import type { TradeRow, Side } from '@/lib/db/journal-queries';
import { buildEquityCurve, computeStats } from '@/lib/journal/stats';
import { JournalStats } from './JournalStats';
import { JournalForm } from './JournalForm';
import { JournalTable } from './JournalTable';

type Props = { initialTrades: TradeRow[]; locale: Locale };

const COPY = {
  fr: { newTrade: 'Nouveau trade', cancel: 'Annuler' },
  en: { newTrade: 'New trade', cancel: 'Cancel' },
} as const;

export function JournalApp({ initialTrades, locale }: Props) {
  const t = COPY[locale];
  const [trades, setTrades] = useState<TradeRow[]>(initialTrades);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TradeRow | null>(null);

  const stats = useMemo(() => computeStats(trades), [trades]);
  const curve = useMemo(() => buildEquityCurve(trades), [trades]);

  async function refresh() {
    const r = await fetch('/api/journal', { cache: 'no-store' });
    if (!r.ok) return;
    const { trades: next } = (await r.json()) as { trades: TradeRow[] };
    setTrades(next);
  }

  async function onSubmit(payload: Record<string, unknown>, id?: string) {
    const url = id ? `/api/journal/${id}` : '/api/journal';
    const method = id ? 'PATCH' : 'POST';
    const r = await fetch(url, {
      method,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!r.ok) return false;
    await refresh();
    setFormOpen(false);
    setEditing(null);
    return true;
  }

  async function onDelete(id: string) {
    const r = await fetch(`/api/journal/${id}`, { method: 'DELETE' });
    if (!r.ok) return;
    setTrades((cur) => cur.filter((t) => t.id !== id));
  }

  return (
    <div className="space-y-8">
      <JournalStats stats={stats} curve={curve} locale={locale} />

      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-xl font-medium text-ink">
          {locale === 'fr' ? 'Tous les trades' : 'All trades'}
        </h2>
        {!formOpen ? (
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            className="inline-flex h-10 items-center rounded-full bg-ink px-5 text-sm font-medium text-canvas hover:opacity-90"
          >
            + {t.newTrade}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setFormOpen(false);
              setEditing(null);
            }}
            className="inline-flex h-10 items-center rounded-full border border-line bg-canvas px-5 text-sm font-medium text-ink hover:bg-surface"
          >
            {t.cancel}
          </button>
        )}
      </div>

      {formOpen ? (
        <JournalForm
          locale={locale}
          initial={editing ?? null}
          onSubmit={(payload) => onSubmit(payload, editing?.id)}
        />
      ) : null}

      <JournalTable
        trades={trades}
        locale={locale}
        onEdit={(t) => {
          setEditing(t);
          setFormOpen(true);
        }}
        onDelete={onDelete}
      />
    </div>
  );
}

export type { Side };
