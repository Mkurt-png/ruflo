'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { easeOutExpo } from '@/lib/motion';
import { cn } from '@/lib/cn';
import type { Dictionary } from '@/lib/i18n/dictionaries';

export function Faq({ dict }: { dict: Dictionary }) {
  const t = dict.faq;
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" aria-labelledby="faq-title" className="border-b border-line">
      <Container as="div" className="grid grid-cols-12 gap-x-6 gap-y-12 py-24 md:py-32">
        <header className="col-span-12 lg:col-span-4">
          <Eyebrow>{t.eyebrow}</Eyebrow>
          <h2
            id="faq-title"
            className="mt-6 font-display text-display-md font-medium tracking-tight text-balance text-ink"
          >
            {t.title}
          </h2>
        </header>

        <ul className="col-span-12 divide-y divide-line border-y border-line lg:col-span-7 lg:col-start-6">
          {t.items.map((item, i) => {
            const open = openIndex === i;
            return (
              <li key={item.q}>
                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls={`faq-panel-${i}`}
                  onClick={() => setOpenIndex(open ? null : i)}
                  className="group flex w-full items-start justify-between gap-6 py-6 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
                >
                  <span className="font-display text-lg font-medium tracking-tight text-ink md:text-xl">
                    {item.q}
                  </span>
                  <Plus
                    aria-hidden
                    className={cn(
                      'mt-1.5 h-5 w-5 flex-shrink-0 text-muted transition-transform duration-300 ease-out group-hover:text-ink',
                      open && 'rotate-45 text-ink',
                    )}
                    strokeWidth={1.5}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {open ? (
                    <motion.div
                      id={`faq-panel-${i}`}
                      key="panel"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: easeOutExpo }}
                      className="overflow-hidden"
                    >
                      <p className="max-w-2xl pb-7 pr-8 text-[15.5px] leading-relaxed text-muted">
                        {item.a}
                      </p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
