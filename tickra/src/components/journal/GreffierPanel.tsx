// GreffierPanel — the registrar's rereading, rendered as ledger minutes.
// Server component: the analysis is pure and computed from the trades
// the journal page already fetched. Numbered observations in mono +
// serif, no charts, no badges. When the register is too thin, the
// Greffier says so and waits.

import type { TradeRow } from '@/lib/db/journal-queries';
import { readJournal } from '@/lib/tickra/greffier';

type Locale = 'fr' | 'en';

const COPY = {
  fr: {
    eyebrow: 'Le Greffier — relecture',
    title: 'Ce que le registre montre.',
    empty: 'Le Greffier ouvre son registre après cinq trades clôturés. Continuez d’écrire.',
    clean: 'Rien à signaler dans ce registre. C’est rare. Continuez exactement ainsi.',
    footer: (n: number) =>
      `Relecture générée localement à partir de ${n} trades. Le Greffier ne lit que votre registre — rien ne quitte votre compte.`,
  },
  en: {
    eyebrow: 'The Registrar — rereading',
    title: 'What the register shows.',
    empty: 'The Registrar opens the ledger after five closed trades. Keep writing.',
    clean: 'Nothing to report in this register. That is rare. Keep going exactly like this.',
    footer: (n: number) =>
      `Rereading generated locally from ${n} trades. The Registrar reads only your register — nothing leaves your account.`,
  },
} as const;

export function GreffierPanel({ trades, locale }: { trades: TradeRow[]; locale: Locale }) {
  const t = COPY[locale];
  const reading = readJournal(trades);

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

      {!reading.ready ? (
        <p className="mt-8 max-w-xl font-display italic text-[18px] leading-relaxed text-muted">
          {t.empty}
        </p>
      ) : reading.insights.length === 0 ? (
        <p className="mt-8 max-w-xl font-display italic text-[18px] leading-relaxed text-muted">
          {t.clean}
        </p>
      ) : (
        <ol className="mt-10 space-y-8">
          {reading.insights.map((insight, i) => (
            <li key={insight.id} className="grid grid-cols-12 gap-x-4 items-baseline">
              <span className="col-span-2 sm:col-span-1 font-mono text-[11px] tracking-[0.22em] text-subtle tabular-nums">
                {String(i + 1).padStart(2, '0')}
              </span>
              <p
                className={`col-span-10 sm:col-span-11 font-display leading-snug text-balance ${
                  insight.tone === 'warn' ? 'text-ink' : 'text-muted'
                }`}
                style={{ fontSize: 'clamp(17px, 2vw, 22px)' }}
              >
                {insight.text[locale]}
              </p>
            </li>
          ))}
        </ol>
      )}

      <footer className="mt-10 border-t border-line pt-5">
        <p className="text-[11.5px] leading-relaxed text-subtle">
          {t.footer(reading.inspected)}
        </p>
      </footer>
    </section>
  );
}

export default GreffierPanel;
