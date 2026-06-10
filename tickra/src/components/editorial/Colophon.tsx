// Colophon — closing page of the redesigned landing.
// A single editorial sentence with one quiet entry link, set against a
// near-black field. The fine print sits on a mono baseline at the very
// bottom. This is the only place the user sees a true "enter" gesture.

import Link from 'next/link';
import type { Locale } from '@/lib/i18n/config';

type Props = { locale: Locale };

export function Colophon({ locale }: Props) {
  const closing =
    locale === 'fr'
      ? 'Il n’y a pas de bouton magique. Il y a une bougie, puis une autre.'
      : 'There is no magic button. There is a candle, then another.';

  return (
    <section
      aria-labelledby="colophon"
      className="relative bg-[#F4F1EA] text-[#0E0E0E] border-t border-black/[0.08]"
    >
      <div className="ed-section px-8 md:px-16">
        <span className="ed-tag text-black/50">
          {locale === 'fr' ? 'Salle 07 — Colophon' : 'Room 07 — Colophon'}
        </span>

        <h2 id="colophon" className="sr-only">
          {locale === 'fr' ? 'Entrer' : 'Enter'}
        </h2>

        <p
          className="mt-20 md:mt-32 ed-display text-[#0E0E0E] max-w-[1280px] text-balance"
          style={{ fontSize: 'clamp(40px, 6.4vw, 96px)', lineHeight: 1 }}
        >
          {closing}
        </p>

        <div className="mt-28 md:mt-40 grid grid-cols-12 gap-x-6 items-end">
          <div className="col-span-12 md:col-span-6">
            <span className="ed-tag text-black/45">
              {locale === 'fr' ? 'Tickra · Paris · 2026' : 'Tickra · Paris · 2026'}
            </span>
          </div>
          <div className="col-span-12 md:col-span-6 md:text-right mt-10 md:mt-0">
            <Link
              href={`/${locale}/onboarding`}
              className="ed-display text-[#0E0E0E] hover:text-black/80 transition-colors"
              style={{ fontSize: 'clamp(36px, 4vw, 64px)', lineHeight: 1, letterSpacing: '-0.02em' }}
            >
              {locale === 'fr' ? 'Entrer →' : 'Enter →'}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Colophon;
