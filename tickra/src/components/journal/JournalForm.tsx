'use client';

import { useState, type FormEvent } from 'react';
import type { Locale } from '@/lib/i18n/config';
import type { TradeRow } from '@/lib/db/journal-queries';

type Props = {
  locale: Locale;
  initial: TradeRow | null;
  onSubmit: (payload: Record<string, unknown>) => Promise<boolean>;
};

const COPY = {
  fr: {
    pair: 'Paire',
    side: 'Sens',
    long: 'Long',
    short: 'Short',
    entry: 'Prix d’entrée',
    exit: 'Prix de sortie (optionnel)',
    size: 'Taille',
    sl: 'Stop loss (optionnel)',
    tp: 'Take profit (optionnel)',
    risk_r: 'R multiple (optionnel)',
    pnl: 'P&L (optionnel)',
    notes: 'Notes',
    screenshot: 'URL de capture (optionnel)',
    save: 'Enregistrer',
    saving: 'Enregistrement…',
    error: 'Échec de l’enregistrement.',
  },
  en: {
    pair: 'Pair',
    side: 'Side',
    long: 'Long',
    short: 'Short',
    entry: 'Entry price',
    exit: 'Exit price (optional)',
    size: 'Size',
    sl: 'Stop loss (optional)',
    tp: 'Take profit (optional)',
    risk_r: 'R multiple (optional)',
    pnl: 'P&L (optional)',
    notes: 'Notes',
    screenshot: 'Screenshot URL (optional)',
    save: 'Save',
    saving: 'Saving…',
    error: 'Save failed.',
  },
} as const;

export function JournalForm({ locale, initial, onSubmit }: Props) {
  const t = COPY[locale];
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const i = initial;

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const data = new FormData(e.currentTarget);
    const payload: Record<string, unknown> = {
      pair: data.get('pair'),
      side: data.get('side'),
      entry_price: data.get('entry_price'),
      size: data.get('size') || 1,
      exit_price: data.get('exit_price') || null,
      stop_loss: data.get('stop_loss') || null,
      take_profit: data.get('take_profit') || null,
      risk_r: data.get('risk_r') || null,
      pnl: data.get('pnl') || null,
      notes: data.get('notes') || null,
      screenshot_url: data.get('screenshot_url') || null,
    };
    if (payload.exit_price && !payload.closed_at) {
      payload.closed_at = new Date().toISOString();
    }
    const ok = await onSubmit(payload);
    if (!ok) setErr(t.error);
    setBusy(false);
  }

  return (
    <form
      onSubmit={submit}
      className="grid grid-cols-1 gap-4 rounded-2xl border border-line bg-surface p-6 md:grid-cols-2"
    >
      <Field label={t.pair}>
        <input
          name="pair"
          required
          defaultValue={i?.pair ?? ''}
          placeholder="EUR/USD"
          className="w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm text-ink"
        />
      </Field>
      <Field label={t.side}>
        <select
          name="side"
          defaultValue={i?.side ?? 'long'}
          className="w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm text-ink"
        >
          <option value="long">{t.long}</option>
          <option value="short">{t.short}</option>
        </select>
      </Field>
      <Field label={t.entry}>
        <input
          name="entry_price"
          required
          type="number"
          step="any"
          defaultValue={i?.entry_price ?? ''}
          className="w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm text-ink"
        />
      </Field>
      <Field label={t.exit}>
        <input
          name="exit_price"
          type="number"
          step="any"
          defaultValue={i?.exit_price ?? ''}
          className="w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm text-ink"
        />
      </Field>
      <Field label={t.size}>
        <input
          name="size"
          type="number"
          step="any"
          defaultValue={i?.size ?? 1}
          className="w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm text-ink"
        />
      </Field>
      <Field label={t.risk_r}>
        <input
          name="risk_r"
          type="number"
          step="any"
          defaultValue={i?.risk_r ?? ''}
          className="w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm text-ink"
        />
      </Field>
      <Field label={t.sl}>
        <input
          name="stop_loss"
          type="number"
          step="any"
          defaultValue={i?.stop_loss ?? ''}
          className="w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm text-ink"
        />
      </Field>
      <Field label={t.tp}>
        <input
          name="take_profit"
          type="number"
          step="any"
          defaultValue={i?.take_profit ?? ''}
          className="w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm text-ink"
        />
      </Field>
      <Field label={t.pnl}>
        <input
          name="pnl"
          type="number"
          step="any"
          defaultValue={i?.pnl ?? ''}
          className="w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm text-ink"
        />
      </Field>
      <Field label={t.screenshot}>
        <input
          name="screenshot_url"
          type="url"
          defaultValue={i?.screenshot_url ?? ''}
          placeholder="https://…"
          className="w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm text-ink"
        />
      </Field>
      <Field label={t.notes} full>
        <textarea
          name="notes"
          rows={3}
          defaultValue={i?.notes ?? ''}
          className="w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm text-ink"
        />
      </Field>

      <div className="md:col-span-2 flex items-center justify-between">
        {err ? (
          <p role="alert" aria-live="assertive" className="text-xs text-down">{err}</p>
        ) : <span />}
        <button
          type="submit"
          disabled={busy}
          className="inline-flex h-10 items-center rounded-full bg-ink px-5 text-sm font-medium text-canvas hover:opacity-90 disabled:opacity-40"
        >
          {busy ? t.saving : t.save}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
  full = false,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <label className={full ? 'md:col-span-2' : undefined}>
      <span className="mb-1 block font-mono text-[11px] uppercase tracking-[0.2em] text-subtle">
        {label}
      </span>
      {children}
    </label>
  );
}
