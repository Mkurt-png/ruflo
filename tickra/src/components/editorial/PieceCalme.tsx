// PieceCalme — Index 04. The quiet room.
// One paragraph, set in italic serif, very wide-set, slightly off-centre.
// No icon, no bullet, no border. Black field, generous breathing.
// This is where psychology lives; the design makes the user slow down.

import type { Locale } from '@/lib/i18n/config';

type Props = { locale: Locale };

const FR = `Le piège n’est presque jamais technique. C’est de regarder l’écran après avoir clôturé, de chercher une raison de rentrer parce que la position d’avant était bonne, et d’écrire le scénario à la place du marché. Un trader qui survit n’a pas une meilleure analyse. Il a un meilleur silence.`;

const EN = `The trap is almost never technical. It is staring at the screen after closing a trade, hunting for a reason to enter again because the last one paid, and writing the script instead of letting the market speak. A surviving trader has no better analysis. They have a better silence.`;

export function PieceCalme({ locale }: Props) {
  return (
    <section
      aria-labelledby="piece-calme"
      className="relative bg-black text-white border-t border-white/[0.06]"
    >
      <div className="relative" style={{ paddingTop: 'clamp(160px, 24vh, 280px)', paddingBottom: 'clamp(160px, 24vh, 280px)' }}>
        <div className="px-8 md:px-16">
          <span className="ed-tag text-white/35">
            {locale === 'fr' ? 'Salle 03 — La pièce calme' : 'Room 03 — The quiet room'}
          </span>
        </div>

        <h2 id="piece-calme" className="sr-only">
          {locale === 'fr' ? 'Psychologie' : 'Psychology'}
        </h2>

        <div className="mt-24 md:mt-40 mx-auto max-w-[1080px] px-8 md:px-16">
          <p
            className="ed-display text-white/85"
            style={{ fontSize: 'clamp(26px, 3.4vw, 46px)', lineHeight: 1.34, letterSpacing: '-0.012em' }}
          >
            {locale === 'fr' ? FR : EN}
          </p>
          <div className="mt-16 flex items-center gap-6">
            <span className="ed-tag text-white/35">
              {locale === 'fr' ? '— Note pour la pratique' : '— Note to practice'}
            </span>
            <span aria-hidden className="h-px w-24 bg-white/15" />
          </div>
        </div>
      </div>
    </section>
  );
}

export default PieceCalme;
