'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import type { Dictionary } from '@/lib/i18n/dictionaries';
import type { Locale } from '@/lib/i18n/config';

type Props = { dict: Dictionary; locale: Locale };

type Cycle = 'monthly' | 'annual';

// TICKRA-REDESIGN: Pricing with Monthly/Annual toggle.
// NOTE: toggle is visual-only — Stripe price IDs unchanged. TODO: wire annual to backend.
export function Pricing({ dict, locale }: Props) {
  const t = dict.pricing;
  const [cycle, setCycle] = useState<Cycle>('monthly');

  return (
    <section id="pricing" aria-labelledby="pricing-title" className="bg-white py-24">
      <div className="mx-auto w-full max-w-container px-6 md:px-10">
        <div id="pricing-title" className="text-center">
          <p className="text-navy-900 text-xs font-medium uppercase tracking-widest">{t.eyebrow}</p>
          <h2 className="text-navy-900 text-3xl md:text-4xl font-medium mt-2">{t.title}</h2>
          <p className="text-text-secondary text-base mt-4 max-w-2xl mx-auto">{t.body}</p>
        </div>

        {/* Cycle toggle */}
        <div className="mt-10 flex items-center justify-center gap-3">
          <div className="inline-flex items-center rounded-full bg-surface-muted p-1">
            <button
              type="button"
              onClick={() => setCycle('monthly')}
              className={
                cycle === 'monthly'
                  ? 'bg-white text-text-primary shadow-sm rounded-full px-4 py-2 text-sm font-medium'
                  : 'text-text-secondary px-4 py-2 text-sm'
              }
            >
              {t.cycle?.monthly ?? 'Monthly'}
            </button>
            <button
              type="button"
              onClick={() => setCycle('annual')}
              className={
                cycle === 'annual'
                  ? 'bg-white text-text-primary shadow-sm rounded-full px-4 py-2 text-sm font-medium'
                  : 'text-text-secondary px-4 py-2 text-sm'
              }
            >
              {t.cycle?.annual ?? 'Annual'}
            </button>
          </div>
          <span className="bg-success/10 text-success text-xs rounded-full px-2 py-0.5 font-medium">
            Save 33%
          </span>
        </div>

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {t.plans.map((plan) => {
            const highlighted = 'highlighted' in plan && (plan as { highlighted?: boolean }).highlighted;
            const isPro = plan.id === 'pro';
            const isLifetime = plan.id === 'lifetime';

            // Display price logic. Lifetime ignores cycle.
            let displayPrice: string = plan.price;
            let displayCadence: string = plan.cadence;
            let subline: string | null = null;
            if (isPro && cycle === 'annual') {
              const planAny = plan as { priceAnnual?: string; cadenceAnnual?: string };
              displayPrice = planAny.priceAnnual ?? 'CA$9.99';
              displayCadence = planAny.cadenceAnnual ?? '/ month, billed annually';
              subline = 'billed CA$119.88/yr · save CA$60';
            }

            const baseClasses =
              'relative flex flex-col bg-white rounded-2xl p-8 hover:shadow-md transition-all duration-200';
            const borderClasses = highlighted
              ? 'border-2 border-accent-blue'
              : 'border border-gray-200';

            return (
              <article key={plan.id} className={`${baseClasses} ${borderClasses}`}>
                {highlighted ? (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent-blue text-white text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap">
                    {t.mostChosen ?? 'Most popular'}
                  </span>
                ) : null}

                <header>
                  <h3 className="text-text-primary text-xl font-medium">{plan.name}</h3>
                  <p className="text-text-secondary text-sm mt-2">{plan.tagline}</p>
                </header>

                <div className="mt-6 flex items-baseline gap-2">
                  <span className="text-text-primary text-4xl md:text-5xl font-medium tracking-tight">
                    {displayPrice}
                  </span>
                  <span className="text-text-muted text-sm">{displayCadence}</span>
                </div>
                {subline ? (
                  <p className="text-xs text-success mt-1">{subline}</p>
                ) : null}

                <ul className="mt-8 space-y-3 border-t border-gray-100 pt-6 text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <Check
                        aria-hidden
                        className="mt-0.5 h-4 w-4 flex-shrink-0 text-success"
                        strokeWidth={2}
                      />
                      <span className="text-text-secondary">{f}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8 pt-2">
                  <Link
                    href={`/${locale}/onboarding?plan=${plan.id}`}
                    className={
                      isPro
                        ? 'inline-flex w-full items-center justify-center bg-accent-blue text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-accent-blue-hover transition-colors duration-200'
                        : isLifetime
                          ? 'inline-flex w-full items-center justify-center bg-navy-900 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-navy-800 transition-colors duration-200'
                          : 'inline-flex w-full items-center justify-center border border-navy-900 text-navy-900 px-6 py-3 rounded-lg text-sm font-medium hover:bg-navy-900 hover:text-white transition-colors duration-200'
                    }
                  >
                    {plan.cta}
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
