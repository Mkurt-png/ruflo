'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PlayCircle, X } from 'lucide-react';
import { easeOutExpo } from '@/lib/motion';

type Props = {
  label: string;
  closeLabel: string;
};

// Reads NEXT_PUBLIC_HERO_VIDEO_URL at build time. When unset, the trigger
// stays hidden — no broken UI shipped to production before a real demo exists.

const VIDEO_URL = process.env.NEXT_PUBLIC_HERO_VIDEO_URL;

export function HeroVideoTrigger({ label, closeLabel }: Props) {
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

  if (!VIDEO_URL) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-12 items-center gap-2 rounded-full border border-line bg-surface px-5 text-[15px] font-medium tracking-tight text-ink transition-colors hover:border-ink"
      >
        <PlayCircle aria-hidden className="h-4 w-4" strokeWidth={1.5} />
        {label}
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={label}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 backdrop-blur-sm p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              transition={{ duration: 0.3, ease: easeOutExpo }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-4xl overflow-hidden rounded-sm border border-line bg-canvas shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
            >
              <button
                type="button"
                aria-label={closeLabel}
                onClick={() => setOpen(false)}
                className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-canvas/90 text-ink shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-colors hover:bg-canvas"
              >
                <X aria-hidden className="h-4 w-4" strokeWidth={1.75} />
              </button>
              <div className="aspect-video w-full bg-ink">
                <iframe
                  src={VIDEO_URL}
                  title={label}
                  className="h-full w-full"
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
