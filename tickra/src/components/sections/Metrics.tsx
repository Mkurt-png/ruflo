'use client';

import { motion } from 'framer-motion';
import { Container } from '@/components/ui/Container';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { fadeUp } from '@/lib/motion';
import type { Dictionary } from '@/lib/i18n/dictionaries';

export function Metrics({ dict }: { dict: Dictionary }) {
  const t = dict.metrics;
  return (
    <section aria-labelledby="metrics-title" className="border-b border-line bg-ink text-canvas">
      <Container as="div" className="py-24 md:py-32">
        <div id="metrics-title" className="grid grid-cols-12 gap-x-6 gap-y-6">
          <div className="col-span-12 lg:col-span-5">
            <span className="inline-flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-canvas/60">
              <span aria-hidden className="inline-block h-px w-8 bg-canvas/80" />
              {t.eyebrow}
            </span>
            <h2 className="mt-6 font-display text-display-lg font-medium tracking-tight text-balance">
              {t.title}
            </h2>
          </div>
          <p className="col-span-12 max-w-xl text-pretty text-[17px] leading-relaxed text-canvas/70 lg:col-span-6 lg:col-start-7 lg:mt-12">
            {t.body}
          </p>
        </div>

        <dl className="mt-20 grid grid-cols-2 gap-px overflow-hidden border-t border-canvas/15 bg-canvas/15 sm:grid-cols-4">
          {t.items.map((m, i) => (
            <motion.div
              key={m.label}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              variants={fadeUp}
              custom={i}
              className="flex flex-col bg-ink p-8 md:p-10"
            >
              <dt className="font-mono text-[11px] uppercase tracking-[0.22em] text-canvas/60">
                {m.label}
              </dt>
              <dd className="mt-6 font-display text-5xl font-medium tracking-tight md:text-6xl">
                {m.value}
              </dd>
            </motion.div>
          ))}
        </dl>

        <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.22em] text-canvas/45">
          {t.footnote}
        </p>
      </Container>
    </section>
  );
}
