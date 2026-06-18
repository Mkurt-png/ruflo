'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { easeOutExpo } from '@/lib/motion';

const STORAGE_KEY = 'tickra-cookie-consent';

type Props = {
  locale: string;
  title: string;
  body: string;
  accept: string;
  reject: string;
  learnMore: string;
};

export function CookieBanner({ locale, title, body, accept, reject, learnMore }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const v = window.localStorage.getItem(STORAGE_KEY);
      if (!v) setVisible(true);
    } catch {
      /* ignore */
    }
  }, []);

  const close = (value: 'all' | 'necessary') => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ value, at: new Date().toISOString() }),
      );
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          role="dialog"
          aria-label={title}
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ duration: 0.45, ease: easeOutExpo }}
          className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-3xl border border-black/15 bg-[#F4F1EA] p-5 text-[#0E0E0E] shadow-[0_18px_40px_-18px_rgba(14,14,14,0.35)] md:p-6"
        >
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:gap-8">
            <div className="flex-1">
              <div className="font-mono text-[10px] uppercase tracking-[0.34em] text-black/55">
                Tickra · {title}
              </div>
              <p className="mt-3 font-display leading-relaxed text-[#0E0E0E]/85" style={{ fontSize: '15px' }}>
                {body}{' '}
                <Link
                  href={`/${locale}/privacy`}
                  className="underline underline-offset-4 decoration-black/35 transition-colors hover:decoration-[#0E0E0E]"
                >
                  {learnMore}
                </Link>
                .
              </p>
            </div>
            <div className="flex flex-shrink-0 flex-wrap items-baseline gap-x-8 gap-y-2 md:flex-col md:items-end">
              <button
                type="button"
                onClick={() => close('all')}
                className="font-mono text-[10.5px] uppercase tracking-[0.34em] text-[#0E0E0E] underline underline-offset-4 hover:text-black/70 transition-colors"
              >
                {accept} →
              </button>
              <button
                type="button"
                onClick={() => close('necessary')}
                className="font-mono text-[10.5px] uppercase tracking-[0.28em] text-black/55 hover:text-[#0E0E0E] transition-colors"
              >
                {reject}
              </button>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
