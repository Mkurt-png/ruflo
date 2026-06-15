import Link from 'next/link';
import { headers } from 'next/headers';
import type { Metadata } from 'next';

// Editorial 404 — matches the landing's ivory paper register. No mascot,
// no oversized brand, just a folio number, a quiet line, and one link
// back. Reads the locale via the x-pathname request header that
// middleware injects, so an EN reader on a missing /en/<x> sees
// English rather than always-French copy.

export const metadata: Metadata = {
  title: 'Page introuvable · Tickra',
  robots: { index: false, follow: false },
};

const COPY = {
  fr: {
    header: 'Tickra · Service du catalogue',
    status: '404 / Page introuvable',
    head1: 'La salle',
    head2: 'n’existe pas.',
    body: 'L’adresse demandée ne figure pas au catalogue, ou a été retirée des cimaises. Aucun mal — le fonds principal reste accessible.',
    folio: 'Folio 404',
    nav: 'Recovery',
    back: 'Retour au catalogue →',
    maison: 'La Maison →',
    recherche: 'La Recherche →',
    random: 'Une pièce au hasard →',
  },
  en: {
    header: 'Tickra · Catalogue desk',
    status: '404 / Page not found',
    head1: 'The room',
    head2: 'does not exist.',
    body: 'The address you asked for is not in the catalogue, or has been taken off the walls. No harm — the main collection stays open.',
    folio: 'Folio 404',
    nav: 'Recovery',
    back: 'Back to the catalogue →',
    maison: 'The House →',
    recherche: 'The Search →',
    random: 'A room at random →',
  },
} as const;

function readLocale(): 'fr' | 'en' {
  const pathname = headers().get('x-pathname') ?? '/fr';
  const segment = pathname.split('/')[1];
  return segment === 'en' ? 'en' : 'fr';
}

export default function NotFound() {
  const locale = readLocale();
  const t = COPY[locale];
  return (
    <main className="min-h-screen w-full bg-[#F4F1EA] text-[#0E0E0E] flex flex-col">
      <header className="px-6 md:px-16 pt-10 flex items-start justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.34em] text-black/55">
          {t.header}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.34em] text-black/45 tabular-nums">
          {t.status}
        </span>
      </header>

      <section className="flex-1 grid grid-cols-12 gap-x-6 items-center px-6 md:px-16">
        <div className="col-span-12 lg:col-span-9">
          <p
            className="font-display italic font-light text-[#0E0E0E]"
            style={{ fontSize: 'clamp(48px, 10vw, 144px)', lineHeight: 0.86, letterSpacing: '-0.035em' }}
          >
            {t.head1} <br className="hidden md:block" />
            {t.head2}
          </p>
          <p className="mt-10 max-w-md text-[15px] leading-relaxed text-black/65">
            {t.body}
          </p>
        </div>
      </section>

      <footer className="px-6 md:px-16 pb-10 flex flex-col items-stretch gap-6 md:flex-row md:items-end md:justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.34em] text-black/45 tabular-nums">
          {t.folio}
        </span>
        <nav aria-label={t.nav} className="flex flex-col items-end gap-4">
          <Link
            href={`/${locale}`}
            className="font-display italic text-[#0E0E0E] hover:text-black/80 transition-colors"
            style={{ fontSize: 'clamp(28px, 3.4vw, 48px)', lineHeight: 1, letterSpacing: '-0.02em' }}
          >
            {t.back}
          </Link>
          <div className="flex flex-wrap items-baseline justify-end gap-x-6 gap-y-2 font-mono text-[10.5px] uppercase tracking-[0.28em] text-black/55">
            <Link href={`/${locale}/maison`} className="hover:text-black/90 transition-colors">
              {t.maison}
            </Link>
            <Link href={`/${locale}/recherche`} className="hover:text-black/90 transition-colors">
              {t.recherche}
            </Link>
            <Link href={`/${locale}/random`} className="hover:text-black/90 transition-colors">
              {t.random}
            </Link>
          </div>
        </nav>
      </footer>
    </main>
  );
}
