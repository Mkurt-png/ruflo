import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { FooterNewsletter } from '@/components/site/FooterNewsletter';
import { QuoteOfTheDay } from '@/components/site/QuoteOfTheDay';
import { LogoMark, Wordmark } from '@/components/brand/Logo';
import { BRAND_NAME } from '@/lib/brand';
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
          <Link href={`/${locale}`} aria-label={BRAND_NAME} className="inline-flex items-center gap-2.5">
            <LogoMark />
            <Wordmark />
          </Link>
          <p className="mt-6 max-w-xs font-display text-xl font-medium leading-snug tracking-tight text-balance text-ink">
            {t.tagline}
          </p>
          <div className="mt-10">
            <FooterNewsletter dict={dict} locale={locale} />
          </div>
        </div>

        <div className="col-span-12 lg:col-span-7">
          <h3 className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
            {locale === 'fr' ? 'La Maison — pièces éditoriales' : 'La Maison — editorial rooms'}
          </h3>
          <ul className="mt-5 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
            {[
              { href: `/${locale}/criee`, label: locale === 'fr' ? 'La Criée' : 'La Criée' },
              { href: `/${locale}/lettre`, label: locale === 'fr' ? 'La Lettre' : 'The Letter' },
              { href: `/${locale}/veillee`, label: locale === 'fr' ? 'La Veillée' : 'The Vigil' },
              { href: `/${locale}/voix`, label: locale === 'fr' ? 'Les Voix' : 'The Voices' },
              { href: `/${locale}/refus`, label: locale === 'fr' ? 'Le Refus' : 'The Refusal' },
              { href: `/${locale}/erratum`, label: locale === 'fr' ? 'L’Erratum' : 'The Erratum' },
              { href: `/${locale}/almanach`, label: locale === 'fr' ? 'L’Almanach' : 'The Almanac' },
              { href: `/${locale}/annuaire`, label: locale === 'fr' ? 'L’Annuaire' : 'The Index' },
              { href: `/${locale}/survie`, label: locale === 'fr' ? 'Le Calculateur' : 'The Calculator' },
            ].map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="text-[14.5px] text-ink transition-colors hover:text-muted"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href={`/${locale}/maison`}
            className="mt-6 inline-block font-mono text-[10px] uppercase tracking-[0.28em] text-muted hover:text-ink"
          >
            {locale === 'fr' ? 'Plan complet · La Maison →' : 'Full plan · The House →'}
          </Link>
        </div>

        <nav
          aria-label="Footer"
          className="col-span-12 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3"
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

        <div className="col-span-12 mt-2">
          <QuoteOfTheDay locale={locale} />
        </div>

        <div className="col-span-12 mt-4 border-t border-line pt-8">
          <p className="max-w-3xl text-[12.5px] leading-relaxed text-muted">{t.risk}</p>
          <p className="mt-4 max-w-3xl text-[12px] leading-relaxed text-subtle">{t.legal}</p>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">
            <span>
              {t.copyright.replace('2026', String(year))}
            </span>
            <span>Made in Québec · YUL1</span>
          </div>
        </div>
      </Container>
    </footer>
  );
}

