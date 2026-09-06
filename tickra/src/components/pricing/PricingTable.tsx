'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import { fadeUp } from '@/lib/motion';
import { useUser } from '@/lib/auth/useUser';
import { toast } from '@/components/site/ToastProvider';
import { formatPrice, PRICES, annualSavingsPercent, type Currency } from '@/lib/pricing/currency';
import type { Dictionary } from '@/lib/i18n/dictionaries';
import type { Locale } from '@/lib/i18n/config';

type Cycle = 'monthly' | 'annual';

export function PricingTable({
  dict,
  locale,
  currency,
}: {
  dict: Dictionary;
  locale: Locale;
  /** Decided server-side from the visitor's country — see lib/pricing/currency. */
  currency: Currency;
}) {
  const t = dict.pricing;
  const prices = PRICES[currency];

  // Prices come from the currency table, not the locale dictionary: the two
  // are independent (a French speaker in Montreal reads French and pays CAD).
  const priceFor = (planId: string, forCycle: Cycle): { price: string; cadence: string } | null => {
    if (planId === 'pro') {
      return forCycle === 'annual'
        ? {
            price: formatPrice(prices.proAnnualPerMonth, currency, locale),
            cadence: t.plans.find((pl) => pl.id === 'pro')?.cadenceAnnual ?? t.cycle.annual,
          }
        : {
            price: formatPrice(prices.proMonthly, currency, locale),
            cadence: t.plans.find((pl) => pl.id === 'pro')?.cadence ?? t.cycle.monthly,
          };
    }
    if (planId === 'lifetime') {
      return {
        price: formatPrice(prices.lifetime, currency, locale),
        cadence: t.plans.find((pl) => pl.id === 'lifetime')?.cadence ?? '',
      };
    }
    return null;
  };
  const [cycle, setCycle] = useState<Cycle>('monthly');
  const [pending, setPending] = useState<string | null>(null);
  const { user } = useUser();

  const startCheckout = async (planId: string) => {
    setPending(planId);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ plan: planId, cycle, locale, currency }),
      });
      const data = (await res.json()) as { url?: string; error?: string; hint?: string };
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      // No URL — surface the error to the user.
      toast({
        tone: 'error',
        title: locale === 'fr' ? 'Paiement indisponible' : 'Checkout unavailable',
        body: data.hint ?? data.error ?? (locale === 'fr' ? 'Réessayez plus tard.' : 'Try again later.'),
      });
    } catch {
      toast({
        tone: 'error',
        title: locale === 'fr' ? 'Erreur réseau' : 'Network error',
      });
    } finally {
      setPending(null);
    }
  };

  return (
    <div>
      <CycleSwitch
        cycle={cycle}
        onChange={setCycle}
        labelMonthly={t.cycle.monthly}
        labelAnnual={t.cycle.annual}
        badge={
          locale === 'fr'
            ? `Économisez ${annualSavingsPercent(prices)} %`
            : `Save ${annualSavingsPercent(prices)}%`
        }
      />

      <div className="mt-12 grid grid-cols-1 gap-3 lg:grid-cols-3">
        {t.plans.map((plan, i) => {
          const highlighted = 'highlighted' in plan && plan.highlighted;
          const showAnnual = cycle === 'annual' && 'priceAnnual' in plan && plan.priceAnnual;
          const localised = priceFor(plan.id, cycle);
          const price = localised?.price ?? (showAnnual ? plan.priceAnnual : plan.price);
          const cadence =
            localised?.cadence ??
            (showAnnual && 'cadenceAnnual' in plan && plan.cadenceAnnual
              ? plan.cadenceAnnual
              : plan.cadence);
          // The annual total is what actually leaves the customer's account —
          // showing only the per-month figure without it reads as a bait price.
          const annualTotal =
            plan.id === 'pro' && cycle === 'annual'
              ? locale === 'fr'
                ? `soit ${formatPrice(prices.proAnnualTotal, currency, locale)} par an`
                : `${formatPrice(prices.proAnnualTotal, currency, locale)} billed yearly`
              : null;
          const savings = annualTotal ?? ('savings' in plan && plan.savings ? plan.savings : null);
          const isFree = plan.id === 'free';
          const isPaid = !isFree;
          const isLoading = pending === plan.id;

          return (
            <motion.article
              key={plan.id}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              variants={fadeUp}
              custom={i}
              className={cn(
                'relative flex flex-col rounded-sm p-8 transition-transform duration-200 ease-out md:p-10',
                // TICKRA-DESIGN: Pro plan = ink card + brand halo glow + brand ring + scale.
                // shadow-glow-xl wraps the card in an 80px brand-coloured halo that
                // catches the eye without breaking the layout (no border tricks).
                highlighted
                  ? 'border border-ink bg-ink text-canvas shadow-glow-xl ring-2 ring-brand lg:scale-[1.04]'
                  : 'glass text-ink',
              )}
            >
              {highlighted ? (
                // TICKRA-DESIGN: "Most chosen" badge — filled brand pill centred at the top.
                <span className="absolute -top-3 left-1/2 z-10 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-brand px-4 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.22em] text-canvas shadow-md">
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
                {isFree ? (
                  // Free plan: keep the original onboarding link.
                  <Link
                    href={`/${locale}/onboarding?plan=${plan.id}`}
                    className={cn(
                      'inline-flex h-12 w-full items-center justify-center gap-2 rounded-full font-medium tracking-tight transition-colors duration-200 ease-out',
                      highlighted
                        ? 'border border-canvas/30 text-canvas hover:border-canvas hover:bg-canvas hover:text-ink'
                        : 'bg-ink text-canvas hover:bg-ink/90',
                    )}
                  >
                    {plan.cta}
                  </Link>
                ) : (
                  // Paid plans: route differs based on auth state.
                  // - Signed in  → POST /api/checkout → Stripe Checkout URL
                  // - Signed out → /signin?next=/pricing so the user comes back and we trigger checkout
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => {
                      if (!user) {
                        const next = encodeURIComponent(`/${locale}/pricing`);
                        window.location.href = `/${locale}/signin?next=${next}`;
                        return;
                      }
                      startCheckout(plan.id);
                    }}
                    className={cn(
                      'inline-flex h-12 w-full items-center justify-center gap-2 rounded-full font-medium tracking-tight transition-colors duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-60',
                      highlighted
                        ? 'border border-canvas/30 text-canvas hover:border-canvas hover:bg-canvas hover:text-ink'
                        : 'bg-ink text-canvas hover:bg-ink/90',
                    )}
                  >
                    {isLoading
                      ? locale === 'fr'
                        ? 'Ouverture du paiement…'
                        : 'Opening checkout…'
                      : isPaid && !user
                        ? locale === 'fr'
                          ? 'Connexion + ' + plan.cta.toLowerCase()
                          : 'Sign in + ' + plan.cta.toLowerCase()
                        : plan.cta}
                  </button>
                )}
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
