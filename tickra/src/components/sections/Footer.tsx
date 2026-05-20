import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import type { Dictionary } from '@/lib/i18n/dictionaries';
import type { Locale } from '@/lib/i18n/config';

export function Footer({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const t = dict.footer;
  const year = new Date().getFullYear();

  const resolve = (href: string) => (href.startsWith('#') ? `/${locale}${href}` : `/${locale}${href}`);

  return (
    <footer className="bg-canvas">
      <Container as="div" className="grid grid-cols-12 gap-x-6 gap-y-12 pb-12 pt-24 md:pb-16 md:pt-32">
        <div className="col-span-12 lg:col-span-5">
          <Link href={`/${locale}`} aria-label="Tickra" className="inline-flex items-center gap-2.5">
            <Logo />
            <span className="text-[15px] font-semibold tracking-tight">Tickra</span>
          </Link>
          <p className="mt-6 max-w-xs font-display text-xl font-medium leading-snug tracking-tight text-balance text-ink">
            {t.tagline}
          </p>
        </div>

        <nav
          aria-label="Footer"
          className="col-span-12 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:col-span-7"
        >
          {t.columns.map((col) => (
            <div key={col.title}>
              <h3 className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
                {col.title}
              </h3>
              <ul className="mt-5 space-y-3">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={resolve(l.href)}
                      className="text-[14.5px] text-ink transition-colors hover:text-muted"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="col-span-12 mt-4 border-t border-line pt-8">
          <p className="max-w-3xl text-[12.5px] leading-relaxed text-muted">{t.risk}</p>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">
            <span>
              {t.copyright.replace('2026', String(year))}
            </span>
            <span>Made in Paris · CDG1</span>
          </div>
        </div>
      </Container>
    </footer>
  );
}

function Logo() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <rect x="4" y="9" width="3" height="10" rx="0.5" />
      <line x1="5.5" y1="5" x2="5.5" y2="9" />
      <line x1="5.5" y1="19" x2="5.5" y2="22" />
      <rect x="10.5" y="5" width="3" height="13" rx="0.5" fill="currentColor" />
      <line x1="12" y1="2" x2="12" y2="5" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <rect x="17" y="11" width="3" height="7" rx="0.5" />
      <line x1="18.5" y1="7" x2="18.5" y2="11" />
      <line x1="18.5" y1="18" x2="18.5" y2="21" />
    </svg>
  );
}
