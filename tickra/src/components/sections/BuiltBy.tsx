'use client';

import { motion } from 'framer-motion';
import { Linkedin } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { fadeUp } from '@/lib/motion';
import type { Dictionary } from '@/lib/i18n/dictionaries';

export function BuiltBy({ dict }: { dict: Dictionary }) {
  const t = dict.builtBy;
  return (
    <section id="builtby" aria-labelledby="builtby-title" className="border-b border-line bg-elevated">
      <Container as="div" className="py-24 md:py-32">
        <div id="builtby-title">
          <SectionHeader eyebrow={t.eyebrow} title={t.title} body={t.body} align="between" />
        </div>

        <ul className="mt-20 grid grid-cols-1 gap-px overflow-hidden rounded-sm border border-line bg-line md:grid-cols-3">
          {t.people.map((p, i) => (
            <motion.li
              key={p.name}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              variants={fadeUp}
              custom={i}
              className="flex flex-col gap-6 bg-canvas p-8 md:p-10"
            >
              <PersonGlyph name={p.name} />
              <div>
                <div className="font-display text-xl font-medium tracking-tight text-ink">{p.name}</div>
                <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.2em] text-muted">{p.role}</div>
              </div>
              <p className="text-[14.5px] leading-relaxed text-muted">{p.bio}</p>
              {/* TICKRA-IMPROVEMENT: clickable LinkedIn icon (renders only when a URL is set in dict). */}
              {p.linkedin ? (
                <a
                  href={p.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${t.linkedinLabel} — ${p.name}`}
                  className="mt-auto inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-ink hover:text-ink"
                >
                  <Linkedin aria-hidden className="h-4 w-4" strokeWidth={1.75} />
                </a>
              ) : null}
            </motion.li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

function PersonGlyph({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('');
  return (
    <span
      aria-hidden
      className="flex h-16 w-16 items-center justify-center rounded-sm border border-line bg-surface font-display text-2xl font-medium tracking-tight text-ink"
    >
      {initials}
    </span>
  );
}
