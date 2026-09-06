'use client';

// MurSilence — the wall that closes the bureau after a bad day.
// When silence.active is true, the journal page swaps its body for
// this editorial register. The reader may override (one click, per
// 24 h, per account) but the default conduct is to come back
// tomorrow. The override is scoped per account.

import { useEffect, useState } from 'react';
import { scopedKey, SCOPE_EVENT } from '@/lib/progress/scope';
import type { SilenceState } from '@/lib/tickra/silence';

type Locale = 'fr' | 'en';

const OVERRIDE_BASE = 'tickra-silence-override-v1';

const COPY = {
  fr: {
    eyebrow: 'Le Mur du silence',
    head1: 'Le bureau',
    head2: 'ferme.',
    head3: 'Ouvrez-le demain.',
    body: (losses: number, window: number, until: string) =>
      `Sur les ${window} dernières clôtures, ${losses} étaient des pertes et le cumul est négatif. La règle de kNOWTrade est claire : le journal se referme jusqu’à ${until}. Ce n’est pas une punition, c’est une protection — celle qu’on n’arrive pas toujours à s’imposer seul.`,
    until: 'Lever à',
    override: 'Forcer l’ouverture',
    confirm: 'En forçant, vous reconnaissez que la décision est vôtre. Le mur revient demain.',
    footer:
      'Lecture publique de cette règle : /refus dit ce que nous refusons. Cette règle dit ce que nous protégeons.',
  },
  en: {
    eyebrow: 'The Wall of Silence',
    head1: 'The bureau',
    head2: 'is closed.',
    head3: 'Open it tomorrow.',
    body: (losses: number, window: number, until: string) =>
      `Of your last ${window} closes, ${losses} were losses and the cumulative is negative. kNOWTrade’s rule is plain: the journal stays shut until ${until}. Not a punishment — a protection you cannot always impose on yourself.`,
    until: 'Lifts at',
    override: 'Force open',
    confirm: 'By forcing, you acknowledge the decision is yours. The wall returns tomorrow.',
    footer:
      'Public reading of this rule: /refus lists what we refuse. This rule names what we protect.',
  },
} as const;

function formatTime(iso: number, locale: Locale): string {
  return new Date(iso).toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function MurSilence({
  silence,
  locale,
  children,
}: {
  silence: SilenceState;
  locale: Locale;
  children: React.ReactNode;
}) {
  const [overrideUntil, setOverrideUntil] = useState<number | null>(null);
  const t = COPY[locale];

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const read = () => {
      try {
        const raw = window.localStorage.getItem(scopedKey(OVERRIDE_BASE));
        if (!raw) return setOverrideUntil(null);
        const n = parseInt(raw, 10);
        // Cap at 24h ahead so a tampered far-future timestamp cannot
        // silently disable the wall forever.
        const max = Date.now() + 24 * 60 * 60_000;
        if (!Number.isFinite(n) || n <= Date.now() || n > max) {
          setOverrideUntil(null);
        } else {
          setOverrideUntil(n);
        }
      } catch {
        setOverrideUntil(null);
      }
    };
    read();
    window.addEventListener(SCOPE_EVENT, read);
    return () => window.removeEventListener(SCOPE_EVENT, read);
  }, []);

  const overridden = overrideUntil !== null && overrideUntil > Date.now();

  if (!silence.active || overridden) {
    return <>{children}</>;
  }

  const force = () => {
    const until = Date.now() + 24 * 60 * 60_000;
    try {
      window.localStorage.setItem(scopedKey(OVERRIDE_BASE), String(until));
    } catch {
      /* ignore */
    }
    setOverrideUntil(until);
  };

  return (
    <section
      aria-label={t.eyebrow}
      className="mt-10 rounded-sm border border-line bg-[#F4F1EA] p-8 md:p-12"
    >
      <header className="flex items-baseline justify-between gap-4 border-b border-black/15 pb-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.34em] text-black/55">
          {t.eyebrow}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.34em] text-black/45 tabular-nums">
          {t.until} {silence.liftsAt ? formatTime(silence.liftsAt, locale) : '—'}
        </span>
      </header>

      <div className="mt-12 max-w-[1000px]">
        <p
          className="font-display italic font-light text-[#0E0E0E]"
          style={{ fontSize: 'clamp(38px, 5.6vw, 84px)', lineHeight: 0.98, letterSpacing: '-0.035em' }}
        >
          {t.head1}
          <br />
          <span className="text-black/55">{t.head2}</span>
          <br />
          <span className="text-black/35">{t.head3}</span>
        </p>
      </div>

      <p
        className="mt-10 max-w-[640px] font-display text-[#0E0E0E]/80 leading-relaxed"
        style={{ fontSize: 'clamp(16px, 1.7vw, 19px)' }}
      >
        {t.body(silence.losses, silence.window, silence.liftsAt ? formatTime(silence.liftsAt, locale) : '—')}
      </p>

      <div className="mt-12 flex flex-col items-start gap-3">
        <button
          onClick={force}
          className="inline-flex h-10 items-center rounded-full border border-black/70 px-5 font-mono text-[11px] uppercase tracking-[0.22em] text-[#0E0E0E] hover:bg-[#0E0E0E] hover:text-[#F4F1EA] transition-colors"
        >
          {t.override}
        </button>
        <p className="font-mono text-[10.5px] leading-relaxed text-black/45 max-w-[480px]">
          {t.confirm}
        </p>
      </div>

      <footer className="mt-16 border-t border-black/15 pt-5">
        <p className="font-mono text-[10.5px] leading-relaxed text-black/45 max-w-[640px]">
          {t.footer}
        </p>
      </footer>
    </section>
  );
}

export default MurSilence;
