'use client';

// Term — wraps a word in a lesson, an editorial paragraph, or any
// piece of prose, and turns it into a clickable affordance.
// Clicking opens a small in-place popover with the glossary definition
// and a "see again" cross-reference to the glossary index. The
// underline is faint by default; the affordance reveals on hover.
//
// Le Lexique vivant: the reader builds their own dictionary by use.
// The component is loud only when summoned.

import { useEffect, useId, useRef, useState } from 'react';
import { findGlossaryTerm } from '@/lib/tickra/lexique';

type Locale = 'fr' | 'en';

export function Term({
  children,
  termKey,
  locale = 'fr',
}: {
  children: React.ReactNode;
  /** Optional explicit glossary term — defaults to the children text. */
  termKey?: string;
  locale?: Locale;
}) {
  const [open, setOpen] = useState(false);
  const popId = useId();
  const popRef = useRef<HTMLSpanElement | null>(null);

  const label = termKey ?? (typeof children === 'string' ? children : '');
  const entry = findGlossaryTerm(label, locale);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!popRef.current) return;
      if (!popRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // If we don't know the term, render plain text — never break the reading.
  if (!entry) return <>{children}</>;

  return (
    <span ref={popRef} className="relative inline-block">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={popId}
        onClick={() => setOpen((o) => !o)}
        className="inline border-b border-dotted border-black/30 hover:border-black/85 transition-colors focus:outline-none focus-visible:bg-black/[0.04]"
        style={{ padding: 0, background: 'transparent', color: 'inherit', font: 'inherit' }}
      >
        {children}
      </button>
      {open && (
        <span
          id={popId}
          role="dialog"
          aria-label={entry.term[locale]}
          className="absolute left-0 z-20 mt-2 w-[min(380px,80vw)] rounded-sm border border-black/15 bg-[#F4F1EA] p-4 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.25)]"
        >
          <span className="block font-mono text-[10px] uppercase tracking-[0.28em] text-black/45">
            {entry.term[locale]}
          </span>
          <span
            className="mt-2 block font-display text-[#0E0E0E]/85"
            style={{ fontSize: '15px', lineHeight: 1.4 }}
          >
            {entry.definition[locale]}
          </span>
          <span className="mt-3 block">
            <a
              href={`/${locale}/glossary#${encodeURIComponent(entry.term[locale])}`}
              className="font-mono text-[9.5px] uppercase tracking-[0.28em] text-black/55 hover:text-black/90"
            >
              {locale === 'fr' ? 'Voir dans le glossaire →' : 'See in glossary →'}
            </a>
          </span>
        </span>
      )}
    </span>
  );
}

export default Term;
