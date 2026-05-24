'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { fadeUp } from '@/lib/motion';
import type { Dictionary } from '@/lib/i18n/dictionaries';
import type { Locale } from '@/lib/i18n/config';

type Cycle = 'monthly' | 'annual';

export function PricingTable({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const t = dict.pricing;
  const [cycle, setCycle] = useState<Cycle>('monthly');

  return (
    <div>
      <CycleSwitch
        cycle={cycle}
        onChange={setCycle}
        labelMonthly={t.cycle.monthly}
        labelAnnual={t.cycle.annual}
        badge={t.annualBadge}
      />

      <div className="mt-12 grid grid-cols-1 gap-3 lg:grid-cols-3">
        {t.plans.map((plan, i) => {
          const highlighted = 'highlighted' in plan && plan.highlighted;
          const showAnnual = cycle === 'annual' && 'priceAnnual' in plan && plan.priceAnnual;
          const price = showAnnual ? plan.priceAnnual : plan.price;
          const cadence =
            showAnnual && 'cadenceAnnual' in plan && plan.cadenceAnnual ? plan.cadenceAnnual : plan.cadence;
          const savings = 'savings' in plan && plan.savings ? plan.savings : null;

          return (
            <motion.article
              key={plan.id}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              variants={fadeUp}
              custom={i}
              className={cn(
                'relative flex flex-col rounded-sm border p-8 md:p-10',
                highlighted ? 'border-ink bg-ink text-canvas' : 'border-line bg-surface text-ink',
              )}
            >
              {highlighted ? (
                <span className="absolute -top-3 left-8 inline-flex items-center gap-2 rounded-full bg-canvas px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-ink ring-1 ring-ink">
                  {t.mostChosen}
                </span>
              ) : null}

              <header>
                <h3 className="font-display text-2xl font-medium tracking-tight">{plan.name}</h3>
                <p className={cn('mt-2 text-[14px]', highlighted ? 'text-canvas/70' : 'text-muted')}>
                  {plan.tagline}
                </p>
              </header>

              <div className="mt-8 flex items-baseline gap-2">
                <span className="font-display text-5xl font-medium tracking-tighter">{price}</span>
                <span
                  className={cn(
                    'font-mono text-[12px] uppercase tracking-[0.18em]',
                    highlighted ? 'text-canvas/60' : 'text-muted',
                  )}
                >
                  {cadence}
                </span>
              </div>

              {savings ? (
                <p
                  className={cn(
                    'mt-3 font-mono text-[11px] uppercase tracking-[0.18em]',
                    highlighted ? 'text-canvas/70' : 'text-muted',
                  )}
                >
                  {savings}
                </p>
              ) : null}

              <ul
                className={cn(
                  'mt-10 space-y-3.5 border-t pt-8 text-[14.5px]',
                  highlighted ? 'border-canvas/20' : 'border-line',
                )}
              >
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <Check
                      aria-hidden
                      className={cn(
                        'mt-0.5 h-4 w-4 flex-shrink-0',
                        highlighted ? 'text-canvas' : 'text-ink',
                      )}
                      strokeWidth={1.75}
                    />
                    <span className={highlighted ? 'text-canvas/90' : 'text-muted'}>{f}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-10 pt-2">
                <Button
                  href={`/${locale}/onboarding?plan=${plan.id}&cycle=${cycle}`}
                  variant={highlighted ? 'ghost' : 'primary'}
                  className={cn(
                    'w-full',
                    highlighted &&
                      'border-canvas/30 text-canvas hover:border-canvas hover:bg-canvas hover:text-ink',
                  )}
                >
                  {plan.cta}
                </Button>
              </div>
            </motion.article>
          );
        })}
      </div>
    </div>
  );
}

function CycleSwitch({
  cycle,
  onChange,
  labelMonthly,
  labelAnnual,
  badge,
}: {
  cycle: Cycle;
  onChange: (c: Cycle) => void;
  labelMonthly: string;
  labelAnnual: string;
  badge: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <div
        role="tablist"
        aria-label="Billing cycle"
        className="inline-flex rounded-full border border-line bg-surface p-1"
      >
        <CycleButton active={cycle === 'monthly'} onClick={() => onChange('monthly')}>
          {labelMonthly}
        </CycleButton>
        <CycleButton active={cycle === 'annual'} onClick={() => onChange('annual')}>
          {labelAnnual}
        </CycleButton>
      </div>
      <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">{badge}</span>
    </div>
  );
}

function CycleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'h-9 rounded-full px-4 text-[13px] font-medium tracking-tight transition-colors',
        active ? 'bg-ink text-canvas' : 'text-muted hover:text-ink',
      )}
    >
      {children}
    </button>
  );
}
