'use client';

// SurvieCalculator — the form. Editorial register, ivory paper, no
// glow, no cards. Inputs at the left rail, reading at the right.
// Nothing is stored; the math runs live in the browser.

import { useMemo, useState } from 'react';
import { computeSurvie, type SurvieInput } from '@/lib/tickra/survie';

type Locale = 'fr' | 'en';

const COPY = {
  fr: {
    eyebrow: 'Le Calculateur — entrée du carnet',
    accountLabel: 'Compte (USD)',
    riskLabel: 'Risque par trade (%)',
    entryLabel: 'Prix d’entrée',
    stopLabel: 'Stop-loss',
    tpLabel: 'Take-profit (optionnel)',
    riskAmount: 'Montant risqué',
    positionSize: 'Taille de position',
    plannedR: 'R planifié',
    breakEven: 'Win-rate d’équilibre',
    lossesHalve: 'Pertes consécutives → compte divisé par 2',
    lossesTenth: 'Pertes consécutives → compte divisé par 10',
    warnHigh: 'Risque ≥ 2 %. La leçon dit que la survie passe avant le rendement.',
    warnNoStop: 'Le stop est collé à l’entrée. Sans distance, il n’y a pas de trade — il y a un pari.',
    warnTight: 'Stop très serré (<0,1 %). Vérifiez que ce n’est pas le bruit qui vous sortira.',
    warnInverted: 'Le take-profit est du mauvais côté de l’entrée. Relisez le sens du trade.',
    blank: 'Renseignez compte, risque, entrée et stop. Le carnet calcule en silence.',
    footer:
      'Aucune donnée n’est envoyée. Les chiffres restent dans votre navigateur — fermez l’onglet, ils disparaissent.',
  },
  en: {
    eyebrow: 'The Calculator — ledger entry',
    accountLabel: 'Account (USD)',
    riskLabel: 'Risk per trade (%)',
    entryLabel: 'Entry price',
    stopLabel: 'Stop-loss',
    tpLabel: 'Take-profit (optional)',
    riskAmount: 'Amount risked',
    positionSize: 'Position size',
    plannedR: 'Planned R',
    breakEven: 'Break-even win-rate',
    lossesHalve: 'Consecutive losses → account halved',
    lossesTenth: 'Consecutive losses → account down to a tenth',
    warnHigh: 'Risk ≥ 2%. The lesson says survival comes before return.',
    warnNoStop: 'The stop sits on the entry. Without distance there is no trade — only a bet.',
    warnTight: 'Stop very tight (<0.1%). Make sure noise won’t take you out.',
    warnInverted: 'The take-profit is on the wrong side of the entry. Reread the trade direction.',
    blank: 'Fill account, risk, entry and stop. The ledger computes in silence.',
    footer:
      'No data is sent. Numbers stay in your browser — close the tab and they disappear.',
  },
} as const;

type FieldKey = 'account' | 'riskPct' | 'entry' | 'stop' | 'takeProfit';
type FormState = Record<FieldKey, string>;

const INITIAL: FormState = {
  account: '10000',
  riskPct: '1',
  entry: '',
  stop: '',
  takeProfit: '',
};

function parseInput(form: FormState): SurvieInput | null {
  const account = parseFloat(form.account);
  const riskPct = parseFloat(form.riskPct);
  const entry = parseFloat(form.entry);
  const stop = parseFloat(form.stop);
  if (
    !Number.isFinite(account) ||
    !Number.isFinite(riskPct) ||
    !Number.isFinite(entry) ||
    !Number.isFinite(stop)
  )
    return null;
  const tp = parseFloat(form.takeProfit);
  return {
    account,
    riskPct,
    entry,
    stop,
    takeProfit: Number.isFinite(tp) ? tp : undefined,
  };
}

function formatNumber(n: number, locale: Locale, decimals = 2): string {
  if (!Number.isFinite(n)) return '∞';
  return n.toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function SurvieCalculator({ locale }: { locale: Locale }) {
  const [form, setForm] = useState<FormState>(INITIAL);
  const t = COPY[locale];

  const reading = useMemo(() => {
    const input = parseInput(form);
    if (!input) return null;
    return computeSurvie(input);
  }, [form]);

  const set = (key: FieldKey) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <section className="mx-auto max-w-[1100px] px-6 md:px-16 pb-32">
      <header className="flex items-baseline justify-between gap-6 border-b border-black/15 pb-4">
        <span className="font-mono text-[10px] uppercase tracking-[0.34em] text-black/55">
          {t.eyebrow}
        </span>
      </header>

      <div className="mt-12 grid gap-x-16 gap-y-10 md:grid-cols-[minmax(0,360px)_1fr]">
        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          <Field label={t.accountLabel} value={form.account} onChange={set('account')} suffix="$" />
          <Field label={t.riskLabel} value={form.riskPct} onChange={set('riskPct')} suffix="%" />
          <Field label={t.entryLabel} value={form.entry} onChange={set('entry')} />
          <Field label={t.stopLabel} value={form.stop} onChange={set('stop')} />
          <Field label={t.tpLabel} value={form.takeProfit} onChange={set('takeProfit')} />
        </form>

        <div>
          {!reading ? (
            <p
              className="font-display italic font-light text-[#0E0E0E]/55 max-w-[480px]"
              style={{ fontSize: 'clamp(20px, 2.4vw, 28px)', lineHeight: 1.25 }}
            >
              {t.blank}
            </p>
          ) : (
            <ol className="space-y-8">
              <Reading idx={1} label={t.riskAmount} value={`${formatNumber(reading.riskAmount, locale)} $`} />
              <Reading
                idx={2}
                label={t.positionSize}
                value={formatNumber(reading.positionSize, locale, 4)}
              />
              {reading.plannedR !== null && (
                <Reading idx={3} label={t.plannedR} value={`R ${formatNumber(reading.plannedR, locale, 2)}`} />
              )}
              {reading.breakEvenWinRate !== null && (
                <Reading
                  idx={4}
                  label={t.breakEven}
                  value={`${formatNumber(reading.breakEvenWinRate, locale, 1)} %`}
                />
              )}
              <Reading
                idx={5}
                label={t.lossesHalve}
                value={`${reading.lossesToHalve === Infinity ? '∞' : reading.lossesToHalve}`}
              />
              <Reading
                idx={6}
                label={t.lossesTenth}
                value={`${reading.lossesToTenth === Infinity ? '∞' : reading.lossesToTenth}`}
              />
              {reading.warnings.length > 0 && (
                <li className="border-t border-black/15 pt-6">
                  <ul className="space-y-3">
                    {reading.warnings.includes('risk-high') && (
                      <Warn text={t.warnHigh} />
                    )}
                    {reading.warnings.includes('no-stop') && (
                      <Warn text={t.warnNoStop} />
                    )}
                    {reading.warnings.includes('too-tight') && (
                      <Warn text={t.warnTight} />
                    )}
                    {reading.warnings.includes('inverted') && (
                      <Warn text={t.warnInverted} />
                    )}
                  </ul>
                </li>
              )}
            </ol>
          )}
        </div>
      </div>

      <footer className="mt-24 border-t border-black/15 pt-6">
        <p className="font-mono text-[10.5px] leading-relaxed text-black/45">{t.footer}</p>
      </footer>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  suffix,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  suffix?: string;
}) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-black/55">
        {label}
      </span>
      <div className="mt-2 flex items-baseline gap-2 border-b border-black/25 focus-within:border-black/70">
        <input
          inputMode="decimal"
          value={value}
          onChange={onChange}
          className="w-full bg-transparent py-2 font-display text-[22px] text-[#0E0E0E] outline-none placeholder:text-black/30 tabular-nums"
          placeholder="0"
        />
        {suffix && (
          <span className="font-mono text-[11px] text-black/45 tabular-nums">{suffix}</span>
        )}
      </div>
    </label>
  );
}

function Reading({ idx, label, value }: { idx: number; label: string; value: string }) {
  return (
    <li className="grid grid-cols-[2ch_1fr_auto] items-baseline gap-x-6">
      <span className="font-mono text-[10px] tracking-[0.22em] text-black/35 tabular-nums">
        {String(idx).padStart(2, '0')}
      </span>
      <span
        className="font-display italic text-[#0E0E0E]/80"
        style={{ fontSize: 'clamp(17px, 1.8vw, 22px)' }}
      >
        {label}
      </span>
      <span
        className="font-display text-[#0E0E0E] tabular-nums"
        style={{ fontSize: 'clamp(20px, 2.4vw, 30px)', letterSpacing: '-0.02em' }}
      >
        {value}
      </span>
    </li>
  );
}

function Warn({ text }: { text: string }) {
  return (
    <li className="font-display italic text-[#0E0E0E]/80" style={{ fontSize: 'clamp(15px, 1.5vw, 18px)' }}>
      {text}
    </li>
  );
}

export default SurvieCalculator;
