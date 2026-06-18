'use client';

import type { Locale } from '@/lib/i18n/config';
import type { TradeRow } from '@/lib/db/journal-queries';

type Props = {
  trades: TradeRow[];
  locale: Locale;
  onEdit: (t: TradeRow) => void;
  onDelete: (id: string) => void;
};

const COPY = {
  fr: {
    pair: 'Paire',
    side: 'Sens',
    entry: 'Entrée',
    exit: 'Sortie',
    pnl: 'P&L',
    r: 'R',
    opened: 'Ouvert',
    status: 'État',
    open: 'Ouvert',
    closed: 'Clôturé',
    actions: 'Actions',
    edit: 'Modifier',
    del: 'Supprimer',
    confirm: 'Supprimer ce trade ?',
    empty: 'Aucun trade pour l’instant. Ajoutez votre premier ci-dessus.',
    caption: 'Journal des trades',
  },
  en: {
    pair: 'Pair',
    side: 'Side',
    entry: 'Entry',
    exit: 'Exit',
    pnl: 'P&L',
    r: 'R',
    opened: 'Opened',
    status: 'Status',
    open: 'Open',
    closed: 'Closed',
    actions: 'Actions',
    edit: 'Edit',
    del: 'Delete',
    confirm: 'Delete this trade?',
    empty: 'No trade yet. Add your first one above.',
    caption: 'Trade journal',
  },
} as const;

export function JournalTable({ trades, locale, onEdit, onDelete }: Props) {
  const t = COPY[locale];
  if (trades.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-8 text-center text-sm text-muted">
        {t.empty}
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
      <table className="w-full text-sm">
        <caption className="sr-only">{t.caption}</caption>
        <thead className="bg-elevated text-xs uppercase tracking-wider text-subtle">
          <tr>
            <th scope="col" className="px-4 py-3 text-left">{t.pair}</th>
            <th scope="col" className="px-4 py-3 text-left">{t.side}</th>
            <th scope="col" className="px-4 py-3 text-right">{t.entry}</th>
            <th scope="col" className="px-4 py-3 text-right">{t.exit}</th>
            <th scope="col" className="px-4 py-3 text-right">{t.pnl}</th>
            <th scope="col" className="px-4 py-3 text-right">{t.r}</th>
            <th scope="col" className="px-4 py-3 text-left">{t.opened}</th>
            <th scope="col" className="px-4 py-3 text-left">{t.status}</th>
            <th scope="col" className="px-4 py-3 text-right">{t.actions}</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((row) => {
            const pnl = row.pnl !== null ? Number(row.pnl) : null;
            const pnlClass = pnl === null ? 'text-muted' : pnl > 0 ? 'text-up' : pnl < 0 ? 'text-down' : 'text-ink';
            return (
              <tr key={row.id} className="border-t border-line hover:bg-canvas">
                <td className="px-4 py-3 font-mono text-ink">{row.pair}</td>
                <td className="px-4 py-3 capitalize">{row.side}</td>
                <td className="px-4 py-3 text-right font-mono">{row.entry_price}</td>
                <td className="px-4 py-3 text-right font-mono">{row.exit_price ?? '—'}</td>
                <td className={`px-4 py-3 text-right font-mono ${pnlClass}`}>
                  {pnl === null ? '—' : pnl.toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-US', { maximumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3 text-right font-mono text-muted">
                  {row.risk_r === null ? '—' : `${row.risk_r}R`}
                </td>
                <td className="px-4 py-3 text-xs text-muted">
                  {new Date(row.opened_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US')}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      row.closed_at
                        ? 'bg-elevated text-muted'
                        : 'bg-brand/10 text-brand'
                    }`}
                  >
                    {row.closed_at ? t.closed : t.open}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => onEdit(row)}
                    className="mr-2 text-xs text-ink hover:underline"
                  >
                    {t.edit}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(t.confirm)) onDelete(row.id);
                    }}
                    className="text-xs text-down hover:underline"
                  >
                    {t.del}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
