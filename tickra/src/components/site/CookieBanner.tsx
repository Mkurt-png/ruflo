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
          className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-3xl rounded-sm border border-line bg-surface p-5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] md:p-6"
        >
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:gap-8">
            <div className="flex-1">
              <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
                {title}
              </div>
              <p className="mt-2 text-[14px] leading-relaxed text-ink">
                {body}{' '}
                <Link
                  href={`/${locale}/privacy`}
                  className="underline underline-offset-4 decoration-line transition-colors hover:decoration-ink"
                >
                  {learnMore}
                </Link>
                .
              </p>
            </div>
            <div className="flex flex-shrink-0 flex-col gap-2 md:flex-row">
              <button
                type="button"
                onClick={() => close('necessary')}
                className="inline-flex h-10 items-center justify-center rounded-full border border-line px-4 text-[13.5px] font-medium tracking-tight text-ink transition-colors hover:border-ink"
              >
                {reject}
              </button>
              <button
                type="button"
                onClick={() => close('all')}
                className="inline-flex h-10 items-center justify-center rounded-full bg-ink px-4 text-[13.5px] font-medium tracking-tight text-canvas transition-colors hover:bg-ink/90"
              >
                {accept}
              </button>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
