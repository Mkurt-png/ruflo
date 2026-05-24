import Link from 'next/link';
import { Container } from '@/components/ui/Container';

export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] items-center">
      <Container as="div" className="py-24">
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">404</span>
        <h1 className="mt-6 max-w-2xl font-display text-display-md font-medium tracking-tight text-balance text-ink">
          Cette page n’existe pas.
        </h1>
        <p className="mt-4 max-w-md text-[16px] leading-relaxed text-muted">
          Le lien que vous avez suivi est cassé, ou la page a été déplacée.
        </p>
        <Link
          href="/"
          className="mt-10 inline-flex h-12 w-fit items-center justify-center rounded-full bg-ink px-6 text-[15px] font-medium tracking-tight text-canvas transition-colors hover:bg-ink/90"
        >
          Retour à l’accueil
        </Link>
      </Container>
    </main>
  );
}
