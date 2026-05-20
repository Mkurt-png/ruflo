'use client';

import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { fadeUp } from '@/lib/motion';
import type { Dictionary } from '@/lib/i18n/dictionaries';
import type { Locale } from '@/lib/i18n/config';

export function CtaFinal({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const t = dict.cta;
  return (
    <section aria-labelledby="cta-title" className="border-b border-line bg-elevated">
      <Container as="div" className="grid grid-cols-12 gap-x-6 gap-y-10 py-28 md:py-40">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={fadeUp}
          custom={0}
          className="col-span-12 lg:col-span-7"
        >
          <Eyebrow>{t.eyebrow}</Eyebrow>
          <h2
            id="cta-title"
            className="mt-6 font-display text-display-xl font-medium tracking-tight text-balance text-ink"
          >
            {t.title}
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={fadeUp}
          custom={1}
          className="col-span-12 flex flex-col justify-end gap-8 lg:col-span-4 lg:col-start-9"
        >
          <p className="text-pretty text-[16px] leading-relaxed text-muted">{t.body}</p>
          <div className="flex flex-wrap gap-3">
            <Button href={`/${locale}/onboarding`} size="lg">
              {t.primary}
              <ArrowUpRight aria-hidden className="h-4 w-4" strokeWidth={1.75} />
            </Button>
            <Button href={`/${locale}/pricing`} variant="ghost" size="lg">
              {t.secondary}
            </Button>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
