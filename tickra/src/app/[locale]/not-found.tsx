import Link from 'next/link';
import type { Metadata } from 'next';

// Editorial 404 — matches the landing's ivory paper register. No mascot,
// no oversized brand, just a folio number, a quiet line, and one link
// back. The page is intentionally locale-agnostic because it can be
// reached from anywhere in the app.

export const metadata: Metadata = {
  title: 'Page introuvable · Tickra',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="min-h-screen w-full bg-[#F4F1EA] text-[#0E0E0E] flex flex-col">
      <header className="px-6 md:px-16 pt-10 flex items-start justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.34em] text-black/55">
          Tickra · Service du catalogue
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.34em] text-black/45 tabular-nums">
          404 / Page introuvable
        </span>
      </header>

      <section className="flex-1 grid grid-cols-12 gap-x-6 items-center px-6 md:px-16">
        <div className="col-span-12 lg:col-span-9">
          <p
            className="font-display italic font-light text-[#0E0E0E]"
            style={{ fontSize: 'clamp(48px, 10vw, 144px)', lineHeight: 0.86, letterSpacing: '-0.035em' }}
          >
            La salle <br className="hidden md:block" />
            n’existe pas.
          </p>
          <p className="mt-10 max-w-md text-[15px] leading-relaxed text-black/65">
            L’adresse demandée ne figure pas au catalogue, ou a été retirée des cimaises.
            Aucun mal — le fonds principal reste accessible.
          </p>
        </div>
      </section>

      <footer className="px-6 md:px-16 pb-10 flex flex-col items-stretch gap-6 md:flex-row md:items-end md:justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.34em] text-black/45 tabular-nums">
          Folio 404
        </span>
        <nav aria-label="Recovery" className="flex flex-col items-end gap-4">
          <Link
            href="/fr"
            className="font-display italic text-[#0E0E0E] hover:text-black/80 transition-colors"
            style={{ fontSize: 'clamp(28px, 3.4vw, 48px)', lineHeight: 1, letterSpacing: '-0.02em' }}
          >
            Retour au catalogue →
          </Link>
          <div className="flex flex-wrap items-baseline justify-end gap-x-6 gap-y-2 font-mono text-[10.5px] uppercase tracking-[0.28em] text-black/55">
            <Link href="/fr/maison" className="hover:text-black/90 transition-colors">
              La Maison →
            </Link>
            <Link href="/fr/recherche" className="hover:text-black/90 transition-colors">
              La Recherche →
            </Link>
            <Link href="/fr/random" className="hover:text-black/90 transition-colors">
              Une pièce au hasard →
            </Link>
          </div>
        </nav>
      </footer>
    </main>
  );
}
