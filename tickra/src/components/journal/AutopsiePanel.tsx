// AutopsiePanel — surfaces the last three closed trades as editorial
// post-mortems. Server component: the reading is pure, computed from
// the same trade rows the journal page already fetched.

import type { TradeRow } from '@/lib/db/journal-queries';
import { readClosedTrades } from '@/lib/tickra/autopsie';

type Locale = 'fr' | 'en';

const COPY = {
  fr: {
    eyebrow: 'L’Autopsie — trois dernières clôtures',
    title: 'Trois trades, relus.',
    empty:
      'L’Autopsie attend la première clôture. Ouvrez un trade, fermez-le, écrivez ce qui s’est passé — la relecture suivra.',
    footer: (n: number) =>
      `Relecture générée localement à partir de ${n} clôture${n > 1 ? 's' : ''}. Rien ne quitte votre registre.`,
  },
  en: {
    eyebrow: 'The Autopsy — last three closes',
    title: 'Three trades, reread.',
    empty:
      'The Autopsy waits for the first close. Open a trade, close it, write what happened — the reading follows.',
    footer: (n: number) =>
      `Reading generated locally from ${n} close${n > 1 ? 's' : ''}. Nothing leaves your register.`,
  },
} as const;

function formatPnl(pnl: number): string {
  return `${pnl >= 0 ? '+' : ''}${pnl.toFixed(0)}`;
}

function formatDate(iso: string, locale: Locale): string {
  return new Date(iso).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AutopsiePanel({ trades, locale }: { trades: TradeRow[]; locale: Locale }) {
  const t = COPY[locale];
  const autopsies = readClosedTrades(trades, 3);
  const total = trades.filter((t) => typeof t.pnl === 'number').length;

  return (
    <section
      aria-label={t.eyebrow}
      className="mt-10 rounded-sm border border-line bg-surface p-6 md:p-10"
    >
      <header>
        <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-muted">
          {t.eyebrow}
        </span>
        <h2 className="mt-4 font-display text-2xl md:text-3xl font-medium tracking-tight text-ink">
          {t.title}
        </h2>
      </header>

      {autopsies.length === 0 ? (
        <p className="mt-8 max-w-xl font-display italic text-[18px] leading-relaxed text-muted">
          {t.empty}
        </p>
      ) : (
        <ol className="mt-10 space-y-12">
          {autopsies.map((a, i) => (
            <li key={a.tradeId} className="border-t border-line pt-8 first:border-0 first:pt-0">
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-mono text-[11px] tracking-[0.22em] text-subtle tabular-nums">
                  {String(i + 1).padStart(2, '0')} · {formatDate(a.closedAt, locale)}
                </span>
                <span
                  className={`font-mono text-[12px] tabular-nums ${
                    a.pnl > 0 ? 'text-emerald-700' : a.pnl < 0 ? 'text-red-700' : 'text-muted'
                  }`}
                >
                  {formatPnl(a.pnl)}
                </span>
              </div>
              <ol className="mt-4 space-y-3">
                {a.lines.map((line) => (
                  <li
                    key={line.id}
                    className="font-display leading-snug text-balance text-ink/85"
                    style={{ fontSize: 'clamp(16px, 1.6vw, 19px)' }}
                  >
                    {line.text[locale]}
                  </li>
                ))}
              </ol>
            </li>
          ))}
        </ol>
      )}

      <footer className="mt-10 border-t border-line pt-5">
        <p className="text-[11.5px] leading-relaxed text-subtle">{t.footer(total)}</p>
      </footer>
    </section>
  );
}

export default AutopsiePanel;
