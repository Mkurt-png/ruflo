'use client';

import { motion } from 'framer-motion';
import { Container } from '@/components/ui/Container';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { fadeUp } from '@/lib/motion';
import { cn } from '@/lib/cn';
import type { Dictionary } from '@/lib/i18n/dictionaries';

const statusStyles: Record<string, string> = {
  Building: 'border-ink bg-ink text-canvas',
  'En construction': 'border-ink bg-ink text-canvas',
  Planned: 'border-line bg-surface text-ink',
  Planifié: 'border-line bg-surface text-ink',
  Research: 'border-line bg-elevated text-muted',
  Recherche: 'border-line bg-elevated text-muted',
};

export function Roadmap({ dict }: { dict: Dictionary }) {
  const t = dict.roadmap;
  return (
    <section id="roadmap" aria-labelledby="roadmap-title" className="border-b border-line">
      <Container as="div" className="py-24 md:py-32">
        <div id="roadmap-title">
          <SectionHeader eyebrow={t.eyebrow} title={t.title} body={t.body} align="between" />
        </div>

        <ol className="mt-20 divide-y divide-line border-y border-line">
          {t.items.map((item, i) => (
            <motion.li
              key={item.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              variants={fadeUp}
              custom={i}
              className="grid grid-cols-12 items-start gap-x-6 gap-y-4 py-8 md:py-10"
            >
              <div className="col-span-12 md:col-span-3">
                <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
                  {item.quarter}
                </div>
                <span
                  className={cn(
                    'mt-3 inline-flex items-center rounded-full border px-3 py-1 font-mono text-[10.5px] uppercase tracking-[0.2em]',
                    statusStyles[item.status] ?? 'border-line bg-surface text-muted',
                  )}
                >
                  {item.status}
                </span>
              </div>
              <div className="col-span-12 md:col-span-8 md:col-start-5">
                <h3 className="font-display text-xl font-medium tracking-tight text-ink md:text-2xl">
                  {item.title}
                </h3>
                <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted">{item.body}</p>
              </div>
            </motion.li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
