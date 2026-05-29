'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { LocaleSwitcher } from './LocaleSwitcher';
import { easeOutExpo } from '@/lib/motion';
import { cn } from '@/lib/cn';
import type { Dictionary } from '@/lib/i18n/dictionaries';
import type { Locale } from '@/lib/i18n/config';

type Props = {
  dict: Dictionary;
  locale: Locale;
  links: ReadonlyArray<{ href: string; label: string }>;
};

export function MobileMenu({ dict, locale, links }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'inline-flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors md:hidden',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
          'hover:bg-elevated',
        )}
      >
        {open ? (
          <X aria-hidden className="h-5 w-5" strokeWidth={1.75} />
        ) : (
          <Menu aria-hidden className="h-5 w-5" strokeWidth={1.75} />
        )}
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 top-16 z-40 bg-canvas/95 backdrop-blur-md md:hidden"
          >
            <motion.nav
              initial={{ y: -16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -8, opacity: 0 }}
              transition={{ duration: 0.35, ease: easeOutExpo }}
              aria-label="Mobile primary"
              className="flex h-full flex-col px-6 pb-12 pt-10"
            >
              <ul className="flex flex-col gap-2">
                {links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      onClick={() => setOpen(false)}
                      className="block py-3 font-display text-2xl font-medium tracking-tight text-ink transition-colors hover:text-muted"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
                {/* TICKRA-DESIGN: explore section in mobile menu — same surface as desktop dropdown. */}
                <li className="mt-4 border-t border-line pt-4">
                  <p className="pb-2 font-mono text-[10.5px] uppercase tracking-[0.22em] text-subtle">
                    {dict.nav.explore}
                  </p>
                  {[
                    { href: `/${locale}/editorial`, label: dict.nav.editorial },
                    { href: `/${locale}/glossary`, label: dict.nav.glossary },
                    { href: `/${locale}/about`, label: dict.nav.about },
                  ].map((it) => (
                    <Link
                      key={it.href}
                      href={it.href}
                      onClick={() => setOpen(false)}
                      className="block py-2 text-lg text-muted transition-colors hover:text-ink"
                    >
                      {it.label}
                    </Link>
                  ))}
                </li>
                <li className="mt-4">
                  <Link
                    href={`/${locale}/signin`}
                    onClick={() => setOpen(false)}
                    className="block py-3 font-display text-2xl font-medium tracking-tight text-muted transition-colors hover:text-ink"
                  >
                    {dict.nav.signIn}
                  </Link>
                </li>
              </ul>

              <div className="mt-auto flex flex-col gap-6 border-t border-line pt-8">
                <Link
                  href={`/${locale}/onboarding`}
                  onClick={() => setOpen(false)}
                  className="inline-flex h-12 w-full items-center justify-center rounded-full bg-ink px-6 text-[15px] font-medium tracking-tight text-canvas transition-colors hover:bg-ink/90"
                >
                  {dict.nav.getStarted}
                </Link>
                <div className="flex items-center justify-between">
                  <LocaleSwitcher current={locale} label={dict.locale.switch} />
                </div>
              </div>
            </motion.nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
