import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { FooterNewsletter } from '@/components/site/FooterNewsletter';
import { QuoteOfTheDay } from '@/components/site/QuoteOfTheDay';
import type { Dictionary } from '@/lib/i18n/dictionaries';
import type { Locale } from '@/lib/i18n/config';

export function Footer({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const t = dict.footer;
  const year = new Date().getFullYear();

  const resolve = (href: string) => (href.startsWith('#') ? `/${locale}${href}` : `/${locale}${href}`);

  return (
    <footer className="bg-[#F4F1EA] text-[#0E0E0E]">
      <Container as="div" className="grid grid-cols-12 gap-x-6 gap-y-12 pb-12 pt-24 md:pb-16 md:pt-32">
        <div className="col-span-12 lg:col-span-5">
          <Link href={`/${locale}`} aria-label="Tickra" className="inline-flex items-center gap-2.5">
            <Logo />
            <span className="text-[15px] font-semibold tracking-tight">Tickra</span>
          </Link>
          <p
            className="mt-6 max-w-xs font-display italic leading-snug tracking-tight text-balance text-[#0E0E0E]"
            style={{ fontSize: 'clamp(18px, 1.8vw, 22px)', letterSpacing: '-0.01em' }}
          >
            {t.tagline}
          </p>
          <div className="mt-10">
            <FooterNewsletter dict={dict} locale={locale} />
          </div>
        </div>

        <div className="col-span-12 lg:col-span-7">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.34em] text-black/55">
            {locale === 'fr' ? 'La Maison — pièces éditoriales' : 'La Maison — editorial rooms'}
          </h3>
          <ul className="mt-5 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
            {[
              { href: `/${locale}/criee`, label: 'La Criée' },
              { href: `/${locale}/lettre`, label: locale === 'fr' ? 'La Lettre' : 'The Letter' },
              { href: `/${locale}/veillee`, label: locale === 'fr' ? 'La Veillée' : 'The Vigil' },
              { href: `/${locale}/voix`, label: locale === 'fr' ? 'Les Voix' : 'The Voices' },
              { href: `/${locale}/refus`, label: locale === 'fr' ? 'Le Refus' : 'The Refusal' },
              { href: `/${locale}/erratum`, label: locale === 'fr' ? 'L’Erratum' : 'The Erratum' },
              { href: `/${locale}/almanach`, label: locale === 'fr' ? 'L’Almanach' : 'The Almanac' },
              { href: `/${locale}/annuaire`, label: locale === 'fr' ? 'L’Annuaire' : 'The Index' },
              { href: `/${locale}/survie`, label: locale === 'fr' ? 'Le Calculateur' : 'The Calculator' },
              { href: `/${locale}/lexique`, label: locale === 'fr' ? 'Le Lexique' : 'The Lexicon' },
              { href: `/${locale}/rentree`, label: locale === 'fr' ? 'Le Carnet d’absence' : 'The Register' },
              { href: `/${locale}/silence`, label: locale === 'fr' ? 'Le Silence' : 'The Silence' },
            ].map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="text-[14.5px] text-[#0E0E0E] transition-colors hover:text-black/60"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href={`/${locale}/maison`}
            className="mt-6 inline-block font-mono text-[10px] uppercase tracking-[0.34em] text-black/55 hover:text-[#0E0E0E] transition-colors"
          >
            {locale === 'fr' ? 'Plan complet · La Maison →' : 'Full plan · The House →'}
          </Link>
        </div>

        <nav
          aria-label={locale === 'fr' ? 'Pied de page' : 'Footer'}
          className="col-span-12 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3"
        >
          {t.columns.map((col) => (
            <div key={col.title}>
              <h3 className="font-mono text-[10px] uppercase tracking-[0.34em] text-black/55">
                {col.title}
              </h3>
              <ul className="mt-5 space-y-3">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={resolve(l.href)}
                      className="text-[14.5px] text-[#0E0E0E] transition-colors hover:text-black/60"
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

        <div className="col-span-12 mt-4 border-t border-black/15 pt-8">
          <p className="max-w-3xl text-[12.5px] leading-relaxed text-black/65">{t.risk}</p>
          <p className="mt-4 max-w-3xl text-[12px] leading-relaxed text-black/50">{t.legal}</p>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 font-mono text-[10px] uppercase tracking-[0.34em] text-black/50">
            <span>
              {t.copyright.replace('2026', String(year))}
            </span>
            <span>{locale === 'fr' ? 'Composé à Paris' : 'Set in Paris'}</span>
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
