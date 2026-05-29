'use client';

import { motion } from 'framer-motion';
import { Quote, BadgeCheck } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { fadeUp } from '@/lib/motion';
import type { Dictionary } from '@/lib/i18n/dictionaries';

export function Testimonials({ dict }: { dict: Dictionary }) {
  const t = dict.testimonials;
  return (
    <section id="testimonials" aria-labelledby="testimonials-title" className="border-b border-line">
      <Container as="div" className="py-24 md:py-32">
        <div id="testimonials-title">
          <SectionHeader eyebrow={t.eyebrow} title={t.title} body={t.body} align="between" />
        </div>

        <ul className="mt-20 grid grid-cols-1 gap-3 md:grid-cols-2">
          {t.items.map((item, i) => (
            <motion.li
              key={item.name}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              variants={fadeUp}
              custom={i}
              className="relative flex flex-col rounded-sm border border-line bg-surface p-8 md:p-10"
            >
              <Quote
                aria-hidden
                className="h-5 w-5 text-subtle"
                strokeWidth={1.5}
              />
              <blockquote className="mt-8 font-display text-[19px] font-medium leading-snug tracking-tight text-balance text-ink md:text-[21px]">
                “{item.quote}”
              </blockquote>
              <figcaption className="mt-8 flex items-center gap-4 border-t border-line pt-6">
                <Avatar name={item.name} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-[14.5px] font-medium tracking-tight text-ink">
                    {item.name}
                    {/* TICKRA-IMPROVEMENT: verified-profile badge under each testimonial. */}
                    <span className="inline-flex items-center gap-1 rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                      <BadgeCheck aria-hidden className="h-3 w-3 text-up" strokeWidth={2} />
                      {t.verifiedLabel}
                    </span>
                  </div>
                  <div className="text-[13px] text-muted">{item.role}</div>
                  <div className="mt-1 font-mono text-[10.5px] uppercase tracking-[0.18em] text-subtle">
                    {item.meta}
                  </div>
                </div>
              </figcaption>
            </motion.li>
          ))}
        </ul>

        <p className="mt-12 font-mono text-[11px] uppercase tracking-[0.2em] text-subtle">
          {t.disclaimer}
        </p>
      </Container>
    </section>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('');
  return (
    <span
      aria-hidden
      className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border border-line bg-elevated font-display text-[15px] font-medium tracking-tight text-ink"
    >
      {initials}
    </span>
  );
}
