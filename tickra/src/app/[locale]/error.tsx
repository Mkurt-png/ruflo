'use client';

import { useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { RefreshCw, ArrowRight } from 'lucide-react';
import { Container } from '@/components/ui/Container';

const copy = {
  fr: {
    title: 'Quelque chose s’est cassé.',
    body:
      'Une erreur inattendue est survenue. L’équipe Tickra a été notifiée. Vous pouvez réessayer ou revenir à l’accueil.',
    retry: 'Réessayer',
    home: 'Retour à l’accueil',
  },
  en: {
    title: 'Something broke.',
    body:
      'An unexpected error occurred. The Tickra team has been notified. You can retry or go back home.',
    retry: 'Retry',
    home: 'Back to home',
  },
};

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const pathname = usePathname() ?? '';
  const locale: 'fr' | 'en' = pathname.startsWith('/fr') ? 'fr' : 'en';
  const t = useMemo(() => copy[locale], [locale]);

  useEffect(() => {
    // Wire to your error reporter (Sentry, etc.) when configured.
    console.error('[tickra] route error', error);
  }, [error]);

  return (
    <main className="flex min-h-[60vh] items-center">
      <Container as="div" className="py-24">
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">500</span>
        <h1 className="mt-6 max-w-2xl font-display text-display-md font-medium tracking-tight text-balance text-ink">
          {t.title}
        </h1>
        <p className="mt-4 max-w-md text-[16px] leading-relaxed text-muted">{t.body}</p>
        {error.digest ? (
          <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">
            ref: {error.digest}
          </p>
        ) : null}
        <div className="mt-10 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 text-[15px] font-medium tracking-tight text-canvas transition-colors hover:bg-ink/90"
          >
            <RefreshCw aria-hidden className="h-4 w-4" strokeWidth={1.75} />
            {t.retry}
          </button>
          <Link
            href={`/${locale}`}
            className="inline-flex h-12 items-center gap-2 rounded-full border border-line px-6 text-[15px] font-medium tracking-tight text-ink transition-colors hover:border-ink"
          >
            {t.home}
            <ArrowRight aria-hidden className="h-4 w-4" strokeWidth={1.75} />
          </Link>
        </div>
      </Container>
    </main>
  );
}
