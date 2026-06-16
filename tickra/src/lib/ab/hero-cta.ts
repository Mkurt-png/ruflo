// lightweight client-side A/B test for the hero CTA copy.
// Three buckets, 50/25/25 split. Variant assignment is stable per visitor
// (localStorage), so a returning user always sees the same label. Plausible
// custom events fire on impression + click so we can compare conversion.

const STORAGE_KEY = 'tickra-ab-hero-cta';

export type HeroCtaVariant = 'control' | 'free' | 'sample';

export function getHeroCtaVariant(): HeroCtaVariant {
  if (typeof window === 'undefined') return 'control';
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === 'control' || raw === 'free' || raw === 'sample') return raw;
    // 50% control, 25% free, 25% sample.
    const r = Math.random();
    const v: HeroCtaVariant = r < 0.5 ? 'control' : r < 0.75 ? 'free' : 'sample';
    window.localStorage.setItem(STORAGE_KEY, v);
    return v;
  } catch {
    return 'control';
  }
}

const labels: Record<HeroCtaVariant, { fr: string; en: string }> = {
  control: { fr: 'Passer le test de niveau', en: 'Take the placement test' },
  free: { fr: 'Démarrer gratuitement', en: 'Start free' },
  sample: { fr: 'Voir une leçon en 60 s', en: 'See a 60s lesson' },
};

export function getHeroCtaLabel(variant: HeroCtaVariant, locale: 'fr' | 'en'): string {
  return labels[variant][locale];
}

// Track via Plausible if available. No-op if Plausible is not loaded.
export function trackHeroCta(event: 'view' | 'click', variant: HeroCtaVariant): void {
  if (typeof window === 'undefined') return;
  const plausible = (window as unknown as { plausible?: (e: string, opts?: { props: Record<string, string> }) => void }).plausible;
  if (typeof plausible !== 'function') return;
  plausible('hero_cta_' + event, { props: { variant } });
}
