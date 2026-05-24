'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { fadeUp } from '@/lib/motion';
import { cn } from '@/lib/cn';
import type { Dictionary } from '@/lib/i18n/dictionaries';
import type { Locale } from '@/lib/i18n/config';

export function CurriculumPreview({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const t = dict.curriculumPreview;
  return (
    <section aria-labelledby="curriculum-preview-title" className="border-b border-line">
      <Container as="div" className="py-24 md:py-32">
        <div id="curriculum-preview-title">
          <SectionHeader eyebrow={t.eyebrow} title={t.title} body={t.body} align="between" />
        </div>

        <motion.ol
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={fadeUp}
          className="mt-20 divide-y divide-line border-y border-line"
        >
          {t.tracks.map((track, i) => (
            <li
              key={track.name}
              className="grid grid-cols-12 items-baseline gap-x-6 gap-y-3 py-5 md:py-6"
            >
              <span className="col-span-2 font-mono text-[12px] tabular-nums uppercase tracking-[0.18em] text-subtle md:col-span-1">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="col-span-10 font-display text-lg font-medium tracking-tight text-ink md:col-span-6 md:text-xl">
                {track.name}
              </span>
              <span
                className={cn(
                  'col-span-6 text-[13px] text-muted md:col-span-3',
                  i === 0 && 'md:col-start-8',
                )}
              >
                {track.level}
              </span>
              <span className="col-span-6 text-right font-mono text-[12px] tabular-nums uppercase tracking-[0.18em] text-muted md:col-span-2">
                × {track.count}
              </span>
            </li>
          ))}
        </motion.ol>

        <div className="mt-10">
          <Link
            href={`/${locale}/pricing`}
            className="inline-flex items-center gap-2 text-[14.5px] text-ink transition-colors hover:text-muted"
          >
            {t.cta}
            <ArrowRight aria-hidden className="h-4 w-4" strokeWidth={1.75} />
          </Link>
        </div>
      </Container>
    </section>
  );
}
