'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Flame, BookOpen, ShieldHalf, NotebookPen, LineChart, type LucideIcon } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { fadeUp } from '@/lib/motion';
import { cn } from '@/lib/cn';
import type { Dictionary } from '@/lib/i18n/dictionaries';

type BentoKey = 'charts' | 'streak' | 'library' | 'risk' | 'journal' | 'tv';
type ItemMeta = { key: BentoKey; icon: LucideIcon; span: string; visual: 'chart' | 'streak' | 'icon' };

const layout: ItemMeta[] = [
  { key: 'charts', icon: TrendingUp, span: 'lg:col-span-7 lg:row-span-2', visual: 'chart' },
  { key: 'streak', icon: Flame, span: 'lg:col-span-5 lg:row-span-3', visual: 'streak' },
  { key: 'library', icon: BookOpen, span: 'lg:col-span-3 lg:row-span-1', visual: 'icon' },
  { key: 'risk', icon: ShieldHalf, span: 'lg:col-span-4 lg:row-span-1', visual: 'icon' },
  { key: 'journal', icon: NotebookPen, span: 'lg:col-span-7 lg:row-span-1', visual: 'icon' },
  { key: 'tv', icon: LineChart, span: 'lg:col-span-5 lg:row-span-1', visual: 'icon' },
];

export function BentoFeatures({ dict }: { dict: Dictionary }) {
  const t = dict.bento;
  return (
    <section id="curriculum" aria-labelledby="bento-title" className="border-b border-line bg-elevated">
      <Container as="div" className="py-24 md:py-32">
        <div id="bento-title">
          <SectionHeader eyebrow={t.eyebrow} title={t.title} body={t.body} align="between" />
        </div>

        <div className="mt-20 grid auto-rows-[minmax(180px,auto)] grid-cols-1 gap-3 lg:grid-cols-12 lg:grid-rows-3">
          {layout.map((meta, i) => {
            const item = t.items[meta.key];
            const Icon = meta.icon;
            return (
              <motion.article
                key={meta.key}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-60px' }}
                variants={fadeUp}
                custom={i}
                className={cn(
                  'group relative flex flex-col justify-between overflow-hidden rounded-sm border border-line bg-surface p-6 md:p-8',
                  meta.span,
                )}
              >
                <Icon
                  aria-hidden
                  className="h-5 w-5 text-muted transition-colors group-hover:text-ink"
                  strokeWidth={1.6}
                />

                <div className="mt-10">
                  <h3 className="font-display text-xl font-medium tracking-tight text-balance text-ink md:text-2xl">
                    {item.title}
                  </h3>
                  <p className="mt-3 max-w-md text-[14.5px] leading-relaxed text-muted">{item.body}</p>
                </div>

                {meta.visual === 'chart' ? <BentoChart /> : null}
                {meta.visual === 'streak' ? <BentoStreak /> : null}
              </motion.article>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

function BentoChart() {
  const points = [40, 36, 38, 32, 30, 34, 28, 26, 30, 24, 22, 26, 20, 18, 22, 16, 14, 18, 12];
  const maxX = points.length - 1;
  const d = points
    .map((y, i) => `${i === 0 ? 'M' : 'L'}${(i / maxX) * 100} ${y}`)
    .join(' ');
  return (
    <div className="pointer-events-none mt-8 select-none">
      <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="h-24 w-full">
        <motion.path
          d={d}
          fill="none"
          stroke="rgb(var(--ink))"
          strokeWidth={0.6}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
        />
        <motion.path
          d={`${d} L100 50 L0 50 Z`}
          fill="rgb(var(--ink))"
          fillOpacity={0.04}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 1.2, duration: 0.6 }}
        />
      </svg>
    </div>
  );
}

function BentoStreak() {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const status = [true, true, true, true, true, false, true];
  return (
    <div className="mt-10">
      <div className="flex items-baseline justify-between border-b border-line pb-3">
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">streak</span>
        <span className="font-display text-3xl font-medium tracking-tight text-ink">37</span>
      </div>
      <ul className="mt-6 grid grid-cols-7 gap-2">
        {days.map((d, i) => (
          <li key={i} className="flex flex-col items-center gap-2">
            <span
              aria-hidden
              className={cn(
                'block h-9 w-full rounded-sm border',
                status[i]
                  ? 'border-ink bg-ink'
                  : 'border-line bg-canvas',
              )}
            />
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-subtle">{d}</span>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-[13px] text-muted">
        <span className="text-ink">Freeze used Saturday.</span> Streak preserved.
      </p>
    </div>
  );
}
