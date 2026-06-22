'use client';

// TICKRA-PHASE-3: live Forex market-session clock. Shows which of the four
// major sessions are open right now, highlights high-liquidity overlaps, and
// counts down to each next open/close. Schedule logic lives in the (unit-
// tested) lib/sim/market-sessions module; this only renders + ticks.

import { useEffect, useMemo, useState } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/cn';
import { SESSIONS, allSessionStates, isOverlap } from '@/lib/sim/market-sessions';

type Locale = 'fr' | 'en';

const copy = {
  fr: {
    title: 'Horloge des sessions',
    subtitle: 'Les quatre grandes sessions du forex, en direct. Les chevauchements = plus de liquidité.',
    open: 'Ouverte',
    closed: 'Fermée',
    closesIn: 'ferme dans',
    opensIn: 'ouvre dans',
    overlap: 'Chevauchement actif — liquidité élevée',
    noOverlap: 'Pas de chevauchement actuellement',
    utc: 'Heure UTC',
    note: 'Horaires standards (hiver). L’heure d’été décale Londres et New York d’une heure.',
  },
  en: {
    title: 'Market sessions clock',
    subtitle: 'The four major forex sessions, live. Overlaps mean more liquidity.',
    open: 'Open',
    closed: 'Closed',
    closesIn: 'closes in',
    opensIn: 'opens in',
    overlap: 'Active overlap — high liquidity',
    noOverlap: 'No overlap right now',
    utc: 'UTC time',
    note: 'Standard (winter) hours. DST shifts London and New York by one hour.',
  },
};

function fmtCountdown(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

export function MarketSessionsClock({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const states = useMemo(() => (now ? allSessionStates(now) : []), [now]);
  const overlap = now ? isOverlap(now) : false;
  const utcLabel = now
    ? `${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}`
    : '--:--';

  return (
    <article className="rounded-sm border border-line bg-surface p-7 md:p-9">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">{t.title}</div>
          <p className="mt-3 max-w-md text-[14px] text-muted">{t.subtitle}</p>
        </div>
        <div className="flex flex-col items-end">
          <div className="inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-subtle">
            <Clock className="h-3 w-3" strokeWidth={1.75} />
            {t.utc}
          </div>
          <div className="mt-1 font-display text-2xl font-medium tabular-nums text-ink">{utcLabel}</div>
        </div>
      </div>

      <ul className="mt-7 space-y-2">
        {SESSIONS.map((s) => {
          const st = states.find((x) => x.id === s.id);
          const open = st?.open ?? false;
          return (
            <li
              key={s.id}
              className={cn(
                'flex items-center justify-between rounded-sm border px-4 py-3',
                open ? 'border-up bg-up/10' : 'border-line bg-canvas',
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    'inline-block h-2 w-2 rounded-full',
                    open ? 'bg-up' : 'bg-subtle',
                  )}
                  aria-hidden
                />
                <span className="text-[15px] font-medium text-ink">{s.label[locale]}</span>
              </div>
              <div className="text-right">
                <div
                  className={cn(
                    'font-mono text-[10px] uppercase tracking-[0.18em]',
                    open ? 'text-up' : 'text-muted',
                  )}
                >
                  {open ? t.open : t.closed}
                </div>
                <div className="text-[12.5px] tabular-nums text-muted">
                  {st
                    ? `${open ? t.closesIn : t.opensIn} ${fmtCountdown(st.minutesToChange)}`
                    : '—'}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div
        className={cn(
          'mt-5 rounded-sm border px-4 py-3 text-[13px]',
          overlap ? 'border-up bg-up/10 text-ink' : 'border-line bg-elevated text-muted',
        )}
      >
        {overlap ? t.overlap : t.noOverlap}
      </div>

      <p className="mt-4 text-[12px] leading-relaxed text-muted">{t.note}</p>
    </article>
  );
}
