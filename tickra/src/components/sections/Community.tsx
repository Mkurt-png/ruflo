'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Check, Users } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { fadeUp } from '@/lib/motion';
import type { Dictionary } from '@/lib/i18n/dictionaries';
import type { Locale } from '@/lib/i18n/config';

export function Community({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const t = dict.community;
  return (
    <section id="community" aria-labelledby="community-title" className="border-b border-line bg-elevated">
      <Container as="div" className="grid grid-cols-12 gap-x-6 gap-y-14 py-24 md:py-32">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={fadeUp}
          className="col-span-12 lg:col-span-6"
        >
          <Eyebrow>{t.eyebrow}</Eyebrow>
          <h2
            id="community-title"
            className="mt-6 font-display text-display-md font-medium tracking-tight text-balance text-ink"
          >
            {t.title}
          </h2>
          <p className="mt-6 max-w-md text-pretty text-[16.5px] leading-relaxed text-muted">{t.body}</p>

          <ul className="mt-10 space-y-3 border-t border-line pt-8">
            {t.bullets.map((b) => (
              <li key={b} className="flex items-start gap-3 text-[15px] leading-relaxed text-ink">
                <Check
                  aria-hidden
                  className="mt-1 h-4 w-4 flex-shrink-0 text-ink"
                  strokeWidth={1.75}
                />
                <span>{b}</span>
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Button href={`/${locale}/pricing`} size="lg">
              {t.primary}
              <ArrowRight aria-hidden className="h-4 w-4" strokeWidth={1.75} />
            </Button>
            <Button href={`/${locale}/editorial`} variant="ghost" size="lg">
              {t.secondary}
            </Button>
          </div>

          <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
            {t.badge}
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={fadeUp}
          custom={1}
          className="col-span-12 lg:col-span-5 lg:col-start-8"
        >
          <CohortPreview />
        </motion.div>
      </Container>
    </section>
  );
}

function CohortPreview() {
  const channels = [
    { name: '# bougies‑japonaises', online: 42 },
    { name: '# gestion‑du‑risque', online: 31 },
    { name: '# volumes‑order‑flow', online: 18 },
    { name: '# revue‑hebdo', online: 7 },
  ];
  return (
    <div className="rounded-sm border border-line bg-surface p-6 md:p-8">
      <div className="flex items-center justify-between border-b border-line pb-4">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="flex h-9 w-9 items-center justify-center rounded-sm border border-line bg-elevated"
          >
            <Users className="h-4 w-4 text-ink" strokeWidth={1.6} />
          </span>
          <div>
            <div className="font-display text-[15px] font-medium tracking-tight text-ink">
              Tickra · Cohorte
            </div>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-muted">
              98 en ligne · 1 247 membres
            </div>
          </div>
        </div>
        <span aria-hidden className="h-2 w-2 rounded-full bg-up" />
      </div>

      <ul className="mt-5 space-y-1.5">
        {channels.map((c) => (
          <li
            key={c.name}
            className="flex items-center justify-between rounded-sm px-2 py-2 text-[13.5px] text-muted hover:bg-elevated"
          >
            <span className="truncate font-mono text-[12.5px]">{c.name}</span>
            <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-subtle">
              {c.online}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-6 border-t border-line pt-5">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-subtle">
          Dernière revue · jeudi 19h
        </div>
        <p className="mt-2 text-[13.5px] leading-relaxed text-ink">
          “Pourquoi mon stop a sauté trois fois cette semaine sur l’ES” — Léa M.
        </p>
      </div>
    </div>
  );
}
