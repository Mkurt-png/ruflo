'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { fadeUp } from '@/lib/motion';
import { cn } from '@/lib/cn';
import type { Dictionary } from '@/lib/i18n/dictionaries';
import type { Locale } from '@/lib/i18n/config';

export function Pricing({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const t = dict.pricing;
  return (
    <section id="pricing" aria-labelledby="pricing-title" className="border-b border-line">
      <Container as="div" className="py-24 md:py-32">
        <div id="pricing-title">
          <SectionHeader eyebrow={t.eyebrow} title={t.title} body={t.body} align="between" />
        </div>

        <div className="mt-20 grid grid-cols-1 gap-3 lg:grid-cols-3">
          {t.plans.map((plan, i) => {
            const highlighted = 'highlighted' in plan && plan.highlighted;
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
                  highlighted
                    ? 'border-ink bg-ink text-canvas'
                    : 'border-line bg-surface text-ink',
                )}
              >
                {highlighted ? (
                  <span className="absolute -top-3 left-8 inline-flex items-center gap-2 rounded-full bg-canvas px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-ink ring-1 ring-ink">
                    Most chosen
                  </span>
                ) : null}

                <header>
                  <h3 className="font-display text-2xl font-medium tracking-tight">{plan.name}</h3>
                  <p
                    className={cn(
                      'mt-2 text-[14px]',
                      highlighted ? 'text-canvas/70' : 'text-muted',
                    )}
                  >
                    {plan.tagline}
                  </p>
                </header>

                <div className="mt-8 flex items-baseline gap-2">
                  <span className="font-display text-5xl font-medium tracking-tighter">
                    {plan.price}
                  </span>
                  <span
                    className={cn(
                      'font-mono text-[12px] uppercase tracking-[0.18em]',
                      highlighted ? 'text-canvas/60' : 'text-muted',
                    )}
                  >
                    {plan.cadence}
                  </span>
                </div>

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
                    href={`/${locale}/onboarding?plan=${plan.id}`}
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
      </Container>
    </section>
  );
}
