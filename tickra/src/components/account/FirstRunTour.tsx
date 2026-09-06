'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, X } from 'lucide-react';
import { easeOutExpo } from '@/lib/motion';

type Locale = 'fr' | 'en';

const STORAGE_KEY = 'tickra-tour-me-v1';

const copy = {
  fr: [
    {
      title: 'Bienvenue sur votre compte.',
      body: 'Cette page rassemble votre progression, vos favoris, vos certificats et les outils kNOWTrade. Trois choses à savoir.',
      next: 'Suivant',
    },
    {
      title: 'Tout est sauvegardé localement.',
      body: 'Tant que vous n’avez pas d’abonnement actif, votre progression vit dans votre navigateur. Aucune perte, aucun compte requis.',
      next: 'Suivant',
    },
    {
      title: 'Ouvrez ⌘K à tout moment.',
      body: 'La palette de commandes ouvre toutes les leçons, pages, et termes du glossaire en deux frappes. C’est le raccourci à retenir.',
      next: 'Terminé',
    },
  ],
  en: [
    {
      title: 'Welcome to your account.',
      body: 'This page collects your progress, bookmarks, certificates and kNOWTrade tools. Three things to know.',
      next: 'Next',
    },
    {
      title: 'Everything is saved locally.',
      body: 'Until you have an active subscription, your progress lives in your browser. No loss, no account required.',
      next: 'Next',
    },
    {
      title: 'Open ⌘K any time.',
      body: 'The command palette opens any lesson, page, or glossary term in two keystrokes. The shortcut to remember.',
      next: 'Done',
    },
  ],
};

export function FirstRunTour({ locale }: { locale: Locale }) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const t = copy[locale];

  useEffect(() => {
    try {
      const seen = window.localStorage.getItem(STORAGE_KEY);
      if (!seen) setVisible(true);
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

  const advance = () => {
    if (step >= t.length - 1) close();
    else setStep((s) => s + 1);
  };

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={t[step].title}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 backdrop-blur-sm p-4 md:items-center"
          onClick={close}
        >
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 8, opacity: 0 }}
            transition={{ duration: 0.35, ease: easeOutExpo }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-sm border border-line bg-surface p-7 shadow-[0_24px_80px_rgba(0,0,0,0.18)]"
          >
            <button
              type="button"
              aria-label="Close"
              onClick={close}
              className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-elevated hover:text-ink"
            >
              <X aria-hidden className="h-4 w-4" strokeWidth={1.75} />
            </button>

            <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted">
              {step + 1} / {t.length}
            </div>
            <h2 className="mt-5 font-display text-2xl font-medium tracking-tight text-balance text-ink md:text-3xl">
              {t[step].title}
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-muted">{t[step].body}</p>

            <div className="mt-8 flex items-center justify-between gap-4">
              <div aria-hidden className="flex items-center gap-1.5">
                {t.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 w-6 rounded-full transition-colors ${
                      i === step ? 'bg-ink' : i < step ? 'bg-muted' : 'bg-line'
                    }`}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={advance}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-[14px] font-medium tracking-tight text-canvas transition-colors hover:bg-ink/90"
              >
                {t[step].next}
                <ArrowRight aria-hidden className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
