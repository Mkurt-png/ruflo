'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Sparkles, X } from 'lucide-react';
import { easeOutExpo } from '@/lib/motion';

type Locale = 'fr' | 'en';

// Bump the VERSION_KEY each time you want to re-show the banner after a ship.
const VERSION = 'v0.18';
const STORAGE_KEY = `tickra-whatsnew-${VERSION}`;

const copy = {
  fr: {
    eyebrow: 'Nouveautés',
    title: 'Daily challenge, export JSON, popovers de leçon.',
    cta: 'Voir le changelog',
    close: 'Fermer',
  },
  en: {
    eyebrow: 'What’s new',
    title: 'Daily challenge, JSON export, lesson popovers.',
    cta: 'See the changelog',
    close: 'Close',
  },
};

export function WhatsNewBanner({ locale }: { locale: Locale }) {
  const [visible, setVisible] = useState(false);
  const t = copy[locale];

  useEffect(() => {
    try {
      if (!window.localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      /* ignore */
    }
  }, []);

  const close = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3, ease: easeOutExpo }}
          role="status"
          className="mb-3 flex items-start gap-4 rounded-sm border border-line bg-elevated p-5"
        >
          <span
            aria-hidden
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-ink bg-ink text-canvas"
          >
            <Sparkles className="h-4 w-4" strokeWidth={1.6} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted">
              {t.eyebrow} · {VERSION}
            </div>
            <div className="mt-1 font-display text-[15px] font-medium tracking-tight text-ink">
              {t.title}
            </div>
            <Link
              href={`/${locale}/changelog`}
              className="mt-3 inline-flex items-center gap-1.5 text-[13px] text-ink transition-colors hover:text-muted"
            >
              {t.cta}
              <ArrowRight aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} />
            </Link>
          </div>
          <button
            type="button"
            aria-label={t.close}
            onClick={close}
            className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-canvas hover:text-ink"
          >
            <X aria-hidden className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
