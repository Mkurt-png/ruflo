'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

// Editorial 500 — when something crashes server-side or on a route
// boundary. Same paper register as 404. Logs the error once (placeholder
// for a Sentry hook when the team wires one) and gives the user a single
// dignified way out.

const COPY = {
  fr: {
    header: 'Tickra · Service technique',
    status: '500 / Erreur serveur',
    head1: 'La salle',
    head2: 'est fermée.',
    body: 'Quelque chose s’est interrompu côté serveur. L’incident a été noté. On peut tenter d’ouvrir à nouveau, ou revenir au catalogue.',
    reference: 'Référence',
    retry: 'Tenter à nouveau',
    back: 'Retour au catalogue',
    folio: 'Folio 500',
  },
  en: {
    header: 'Tickra · Technical desk',
    status: '500 / Server error',
    head1: 'The room',
    head2: 'is closed.',
    body: 'Something broke server-side. The incident has been logged. You can try to open again, or return to the catalogue.',
    reference: 'Reference',
    retry: 'Try again',
    back: 'Back to the catalogue',
    folio: 'Folio 500',
  },
} as const;

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // The error boundary doesn't receive route params, but the pathname
  // still includes the /[locale]/ prefix. Read it to keep the 500 page
  // in the reader's language instead of always shipping French.
  const pathname = usePathname() ?? '/fr';
  const segment = pathname.split('/')[1];
  const locale: 'fr' | 'en' = segment === 'en' ? 'en' : 'fr';
  const t = COPY[locale];

  useEffect(() => {
    // Sentry / monitoring hook would go here. For now, dev console only.
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error('[tickra] route error', error);
    }
  }, [error]);

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
          {error?.digest ? (
            <p className="mt-6 font-mono text-[11px] text-black/40 tabular-nums">
              {t.reference} · {error.digest}
            </p>
          ) : null}
          <div className="mt-12 flex flex-wrap gap-8">
            <button
              type="button"
              onClick={reset}
              className="font-mono text-[11px] uppercase tracking-[0.34em] text-[#0E0E0E] underline underline-offset-4 hover:text-black/80 transition-colors"
            >
              {t.retry}
            </button>
            <Link
              href={`/${locale}`}
              className="font-mono text-[11px] uppercase tracking-[0.34em] text-black/65 hover:text-[#0E0E0E] transition-colors"
            >
              {t.back}
            </Link>
          </div>
        </div>
      </section>

      <footer className="px-6 md:px-16 pb-10">
        <span className="font-mono text-[10px] uppercase tracking-[0.34em] text-black/45 tabular-nums">
          {t.folio}
        </span>
      </footer>
    </main>
  );
}
