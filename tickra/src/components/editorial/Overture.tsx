// Overture — the opening room of the redesigned landing.
// Near-empty black field. One mono caption far top-left, the date stamp
// far top-right, a colossal italic serif statement bottom-left, a hairline
// signature mark bottom-right. No CTA, no image. The room exists to make
// the user pause.

import type { Locale } from '@/lib/i18n/config';

type Props = { locale: Locale };

export function Overture({ locale }: Props) {
  const issue = locale === 'fr' ? 'No. 01 · Juin 2026 · Paris' : 'No. 01 · June 2026 · Paris';
  const overline = locale === 'fr' ? 'kNOWTrade — école de marché' : 'kNOWTrade — school of markets';
  const phraseA = locale === 'fr' ? 'Le marché' : 'The market';
  const phraseB = locale === 'fr' ? 'est un texte.' : 'is a text.';
  const signature = locale === 'fr' ? 'On apprend à le lire.' : 'We learn to read it.';

  return (
    <section
      aria-labelledby="overture"
      className="relative min-h-screen w-full bg-[#F4F1EA] text-[#0E0E0E] overflow-hidden"
    >
      {/* Faint vertical hairline running the whole height, a 1px presence */}
      <div aria-hidden className="pointer-events-none absolute top-0 bottom-0 left-[8.33%] w-px bg-black/[0.08]" />
      <div aria-hidden className="pointer-events-none absolute top-0 bottom-0 right-[8.33%] w-px bg-black/[0.08]" />

      {/* Top row — mono captions at the extremities */}
      <header className="absolute top-10 left-0 right-0 px-6 md:px-16 flex items-start justify-between">
        <span className="ed-tag text-black/55">{overline}</span>
        <span className="ed-tag text-black/50 tabular-nums">{issue}</span>
      </header>

      {/* Big phrase, bottom-left aligned. Anchored deliberately low. */}
      <h1
        id="overture"
        className="absolute bottom-[16vh] left-8 md:left-16 right-8 md:right-32 ed-display text-[#0E0E0E]"
        style={{ fontSize: 'clamp(64px, 14vw, 220px)' }}
      >
        <span className="block">{phraseA}</span>
        <span className="block">{phraseB}</span>
      </h1>

      {/* Sub-signature far bottom-right. */}
      <footer className="absolute bottom-10 right-8 md:right-16">
        <span className="ed-tag text-black/55">— {signature}</span>
      </footer>

      {/* Folio number, vertical, far left bottom */}
      <span
        aria-hidden
        className="absolute bottom-10 left-8 md:left-16 ed-tag text-black/40 tabular-nums"
      >
        01 / 07
      </span>
    </section>
  );
}

export default Overture;
