'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';

const copy = {
  fr: {
    title: 'Cette page n’existe pas.',
    body: 'Le lien que vous avez suivi est cassé, ou la page a été déplacée.',
    home: 'Retour à l’accueil',
  },
  en: {
    title: 'This page does not exist.',
    body: 'The link you followed is broken, or the page has moved.',
    home: 'Back to home',
  },
};

export default function NotFound() {
  const pathname = usePathname() ?? '';
  const locale: 'fr' | 'en' = pathname.startsWith('/fr') ? 'fr' : 'en';
  const t = copy[locale];

  return (
    <main className="flex min-h-[60vh] items-center">
      <Container as="div" className="py-24">
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">404</span>
        <h1 className="mt-6 max-w-2xl font-display text-display-md font-medium tracking-tight text-balance text-ink">
          {t.title}
        </h1>
        <p className="mt-4 max-w-md text-[16px] leading-relaxed text-muted">{t.body}</p>
        <Link
          href={`/${locale}`}
          className="mt-10 inline-flex h-12 w-fit items-center justify-center rounded-full bg-ink px-6 text-[15px] font-medium tracking-tight text-canvas transition-colors hover:bg-ink/90"
        >
          {t.home}
        </Link>
      </Container>
    </main>
  );
}
