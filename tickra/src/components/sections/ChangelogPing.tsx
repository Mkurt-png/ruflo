// TICKRA-IMPROVEMENT: one-line "last product update" link before the FAQ.
// Date is hardcoded; bump it on each significant release. Later it can be wired
// to the actual changelog source or git metadata.

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import type { Locale } from '@/lib/i18n/config';

const LAST_UPDATE = {
  fr: '30 mai 2026',
  en: 'May 30, 2026',
};

const copy = {
  fr: { intro: 'Dernière mise à jour produit', cta: 'Voir le journal des versions' },
  en: { intro: 'Latest product update', cta: 'See the changelog' },
};

export function ChangelogPing({ locale }: { locale: Locale }) {
  const t = copy[locale];
  return (
    <section aria-label={t.cta} className="border-b border-line bg-canvas">
      <Container as="div" className="flex flex-wrap items-center justify-between gap-3 py-6 font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
        <span>
          {t.intro} · <span className="text-ink">{LAST_UPDATE[locale]}</span>
        </span>
        <Link
          href={`/${locale}/changelog`}
          className="inline-flex items-center gap-1.5 text-ink transition-colors hover:text-muted"
        >
          {t.cta}
          <ArrowRight aria-hidden className="h-3 w-3" strokeWidth={1.75} />
        </Link>
      </Container>
    </section>
  );
}
