'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, BookOpen } from 'lucide-react';
import { TRACKS } from '@/lib/curriculum/data';
import { getLessonContent } from '@/lib/curriculum/lesson-content';
import { easeOutExpo } from '@/lib/motion';

type Locale = 'fr' | 'en';

const copy = {
  fr: { open: 'Ouvrir la leçon', preview: 'Aperçu' },
  en: { open: 'Open the lesson', preview: 'Preview' },
};

// Tiny popover that floats next to its trigger and shows the lesson intro's
// first paragraph + a quick CTA. Triggered on hover / focus. Uses native
// `popover` style with manual positioning so we don't need a portal lib.

export function LessonPreviewPopover({
  trackSlug,
  lessonSlug,
  locale,
  children,
}: {
  trackSlug: string;
  lessonSlug: string;
  locale: Locale;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement | null>(null);

  const t = copy[locale];
  const track = TRACKS.find((tr) => tr.slug === trackSlug);
  const lesson = track?.lessons.find((l) => l.slug === lessonSlug);
  const content = track && lesson ? getLessonContent(track, lesson) : null;
  const firstParagraph = content?.intro[locale][0] ?? '';

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  if (!track || !lesson) return <>{children}</>;

  return (
    <span
      ref={wrapRef}
      className="relative inline-block"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 2 }}
            transition={{ duration: 0.18, ease: easeOutExpo }}
            role="dialog"
            aria-label={t.preview}
            className="pointer-events-auto absolute left-0 top-full z-30 mt-2 hidden w-80 rounded-sm border border-line bg-surface p-5 shadow-[0_12px_40px_rgba(0,0,0,0.12)] md:block"
          >
            <div className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted">
              <BookOpen aria-hidden className="h-3.5 w-3.5" strokeWidth={1.6} />
              {t.preview}
            </div>
            <div className="mt-3 font-display text-[16px] font-medium tracking-tight text-ink">
              {String(lesson.index).padStart(2, '0')} · {lesson.title[locale]}
            </div>
            <p className="mt-3 text-[13.5px] leading-relaxed text-muted line-clamp-4">
              {firstParagraph}
            </p>
            <div className="mt-5">
              <Link
                href={`/${locale}/learn/${track.slug}/${lesson.slug}`}
                className="inline-flex h-9 items-center gap-2 rounded-full bg-ink px-4 text-[13px] font-medium tracking-tight text-canvas transition-colors hover:bg-ink/90"
              >
                {t.open}
                <ArrowRight aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} />
              </Link>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </span>
  );
}
