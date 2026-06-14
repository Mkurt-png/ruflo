// EditorialFrame — the shared shell for editorial pages.
//
// Every editorial room repeats the same outer pattern: ivory main,
// header with eyebrow + status badge, h1 triptych, intro paragraph.
// EditorialFrame extracts that pattern so a new editorial page is a
// 30-line file instead of 150, and any future tweak to the editorial
// register propagates everywhere at once.
//
// The page body (lists, grids, panels) remains the page's own; the
// Frame stops at the intro paragraph.

import type { ReactNode } from 'react';
import { Navbar } from '@/components/nav/Navbar';
import { Footer } from '@/components/sections/Footer';
import type { Dictionary } from '@/lib/i18n/dictionaries';
import type { Locale } from '@/lib/i18n/config';

export function EditorialFrame({
  dict,
  locale,
  eyebrow,
  status,
  head,
  intro,
  children,
}: {
  dict: Dictionary;
  locale: Locale;
  eyebrow: string;
  /** Right-aligned status caption, e.g. "Permanent", "En préparation". */
  status?: string;
  /** Three lines of the editorial triptych headline. */
  head: [string, string, string];
  /** Optional intro paragraph (max-width 640, italic-leaning serif). */
  intro?: string;
  children: ReactNode;
}) {
  return (
    <>
      <Navbar dict={dict} locale={locale} />
      <main id="main" className="bg-[#F4F1EA] min-h-screen">
        <article>
          <section
            aria-label={eyebrow}
            className="relative px-6 md:px-16"
            style={{ paddingTop: 'clamp(120px, 16vh, 200px)', paddingBottom: 'clamp(48px, 8vh, 96px)' }}
          >
          <header className="flex items-baseline justify-between gap-6 border-b border-black/15 pb-4">
            <span className="font-mono text-[10px] uppercase tracking-[0.34em] text-black/55">
              {eyebrow}
            </span>
            {status && (
              <span className="font-mono text-[10px] uppercase tracking-[0.34em] text-black/65">
                {status}
              </span>
            )}
          </header>

          <div className="mt-16 md:mt-24 max-w-[1100px]">
            <h1
              className="font-display italic font-light text-[#0E0E0E]"
              style={{ fontSize: 'clamp(40px, 6vw, 92px)', lineHeight: 0.96, letterSpacing: '-0.035em' }}
            >
              {head[0]}
              <br />
              <span className="text-black/55">{head[1]}</span>
              <br />
              <span className="text-black/35">{head[2]}</span>
            </h1>
          </div>

          {intro && (
            <p
              className="mt-16 max-w-[640px] font-display text-[#0E0E0E]/75 leading-relaxed"
              style={{ fontSize: 'clamp(17px, 1.7vw, 20px)' }}
            >
              {intro}
            </p>
          )}
          </section>

          {children}
        </article>
      </main>
      <Footer dict={dict} locale={locale} />
    </>
  );
}
