// Manifeste — Index 02. A museum text panel.
// Four numbered statements stacked in the left two-thirds, a single
// vertical rail of metadata on the right edge. No icons, no cards.
// The page reads like the introduction to an exhibition catalogue.

import type { Locale } from '@/lib/i18n/config';

type Props = { locale: Locale };

const FR = [
  'Le marché est un texte. Apprendre à le lire prend des années. On commence par dix minutes par jour.',
  'Une figure n’est pas un signal. C’est un argument que la suivante valide ou défait. Le piège est de confondre les deux.',
  'Le risque s’écrit avant l’ordre. Si la phrase « je perds » n’est pas écrite quelque part, l’ordre n’est pas prêt à partir.',
  'Le journal corrige plus de défauts que l’écran. Ce qu’on ne relit pas, on le répète.',
];

const EN = [
  'The market is a text. Reading it well takes years. You start with ten minutes a day.',
  'A pattern is not a signal. It is an argument the next one confirms or defeats. The trap is mistaking one for the other.',
  'Risk is written before the order. If the sentence “I lose” isn’t somewhere on paper, the order isn’t ready to ship.',
  'The journal fixes more flaws than the screen. What you don’t reread, you repeat.',
];

export function Manifeste({ locale }: Props) {
  const items = locale === 'fr' ? FR : EN;
  const room = locale === 'fr' ? 'Salle 01 — Manifeste' : 'Room 01 — Manifesto';

  return (
    <section
      aria-labelledby="manifeste"
      className="relative bg-black text-white overflow-hidden border-t border-white/[0.06]"
    >
      <div className="ed-section relative">
        {/* Room caption */}
        <div className="px-8 md:px-16">
          <span className="ed-tag text-white/40">{room}</span>
        </div>

        {/* Heading line — tiny next to the text, a colophon. */}
        <h2 id="manifeste" className="sr-only">
          {locale === 'fr' ? 'Manifeste' : 'Manifesto'}
        </h2>

        <div className="mt-16 md:mt-24 grid grid-cols-12 gap-x-6 px-8 md:px-16">
          {items.map((line, i) => (
            <article key={i} className="col-span-12 lg:col-span-9 grid grid-cols-12 gap-x-6 mb-16 md:mb-24 last:mb-0">
              <span className="col-span-2 md:col-span-1 ed-tag text-white/30 tabular-nums pt-3">
                {String(i + 1).padStart(2, '0')}
              </span>
              <p
                className="col-span-10 md:col-span-11 font-display text-white/85 text-balance"
                style={{ fontSize: 'clamp(22px, 3.2vw, 44px)', lineHeight: 1.18, letterSpacing: '-0.012em' }}
              >
                {line}
              </p>
            </article>
          ))}
        </div>

        {/* Right vertical rail */}
        <div className="hidden lg:flex absolute top-0 bottom-0 right-8 items-center">
          <span className="ed-vrail text-white/30">
            {locale === 'fr' ? 'Quatre énoncés · Lecture libre' : 'Four statements · Free reading'}
          </span>
        </div>
      </div>
    </section>
  );
}

export default Manifeste;
