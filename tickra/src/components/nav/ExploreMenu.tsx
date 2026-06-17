'use client';

// TICKRA-DESIGN: "Explore" dropdown — surfaces glossary, editorial, about
// links so they stop hiding in the footer only. Click-to-toggle, click-outside
// to close. No external dep.

import { useEffect, useRef, useState } from 'react';
import { NavLink } from './NavLink';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

type Item = { href: string; label: string };

export function ExploreMenu({ label, items }: { label: string; items: Item[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('mousedown', onDoc);
    window.addEventListener('keydown', onEsc);
    return () => {
      window.removeEventListener('mousedown', onDoc);
      window.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-ink"
      >
        {label}
        <ChevronDown
          aria-hidden
          className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')}
          strokeWidth={1.75}
        />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute left-0 top-full mt-3 min-w-[180px] rounded-sm border border-line bg-surface p-1 shadow-[0_18px_40px_-18px_rgba(27,29,51,0.25)]"
        >
          {items.map((it) => (
            <NavLink
              key={it.href}
              href={it.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block rounded-sm px-3 py-2 text-sm text-ink transition-colors hover:bg-elevated aria-[current=page]:font-medium"
            >
              {it.label}
            </NavLink>
          ))}
        </div>
      ) : null}
    </div>
  );
}
