'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';

type Locale = 'fr' | 'en';

const copy = { fr: 'Dans cet article', en: 'In this article' };

// Read the section list from the article DOM at mount and observe scroll
// position to highlight the current section. Keeps the article body itself
// untouched — no need to re-render server components.

export function ArticleToc({ locale }: { locale: Locale }) {
  const [items, setItems] = useState<{ id: string; label: string }[]>([]);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const root = document.querySelector('article');
    if (!root) return;
    const headings = Array.from(root.querySelectorAll<HTMLHeadingElement>('h2'));
    const next = headings
      .map((h) => {
        if (!h.id) {
          // Auto-id from text content for slug-style anchors.
          h.id = slugify(h.textContent ?? '');
        }
        return { id: h.id, label: h.textContent?.trim() ?? '' };
      })
      .filter((x) => x.id && x.label);
    setItems(next);
    if (next.length > 0) setActive(next[0].id);

    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setActive((e.target as HTMLElement).id);
          }
        }
      },
      { rootMargin: '-30% 0px -60% 0px', threshold: [0, 1] },
    );
    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, []);

  if (items.length < 2) return null;

  return (
    <nav aria-label="Article sections" className="sticky top-24 hidden lg:block">
      <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted">
        {copy[locale]}
      </div>
      <ol className="mt-5 space-y-2 border-l border-line pl-5">
        {items.map((it) => (
          <li key={it.id}>
            <a
              href={`#${it.id}`}
              className={cn(
                '-ml-[24px] inline-flex items-start gap-3 transition-colors',
                active === it.id ? 'text-ink' : 'text-muted hover:text-ink',
              )}
            >
              <span
                aria-hidden
                className={cn(
                  'mt-2 inline-flex h-1.5 w-1.5 flex-shrink-0 rounded-full',
                  active === it.id ? 'bg-ink ring-4 ring-ink/15' : 'bg-line',
                )}
              />
              <span className="text-[13.5px] leading-snug">{it.label}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}
