'use client';

import { motion } from 'framer-motion';
import { Container } from '@/components/ui/Container';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { fadeUp } from '@/lib/motion';
import type { Dictionary } from '@/lib/i18n/dictionaries';

export function Method({ dict }: { dict: Dictionary }) {
  const t = dict.method;
  return (
    <section id="method" aria-labelledby="method-title" className="border-b border-line">
      <Container as="div" className="py-24 md:py-32">
        <div id="method-title">
          <SectionHeader eyebrow={t.eyebrow} title={t.title} body={t.body} align="between" />
        </div>

        <ol className="mt-20 grid grid-cols-1 gap-px overflow-hidden rounded-sm border border-line bg-line md:grid-cols-3">
          {t.steps.map((step, i) => (
            <motion.li
              key={step.index}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              variants={fadeUp}
              custom={i}
              className="relative flex flex-col bg-canvas p-8 md:p-10"
            >
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
                  Step {step.index}
                </span>
                <span aria-hidden className="font-display text-5xl font-medium tracking-tighter text-line">
                  {step.index}
                </span>
              </div>
              <h3 className="mt-12 font-display text-2xl font-medium tracking-tight text-ink md:text-[26px]">
                {step.title}
              </h3>
              <p className="mt-4 text-[15px] leading-relaxed text-muted">{step.body}</p>
            </motion.li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
