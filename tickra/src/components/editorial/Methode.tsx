// Methode — Index 06. The method as a five-sentence editorial.
// Asymmetric: a slim vertical caption to the left, a generous text
// column to the right with deliberate scale shifts. No icons, no
// "step 1 / step 2 / step 3" pattern.

import type { Locale } from '@/lib/i18n/config';

type Props = { locale: Locale };

type Beat = { lead: string; tail: string; em?: boolean };

const FR: Beat[] = [
  { lead: 'On regarde',  tail: ' la bougie avant le graphe.', em: true },
  { lead: 'On écrit',    tail: ' le risque avant l’ordre.' },
  { lead: 'On joue',     tail: ' la figure, pas l’opinion.', em: true },
  { lead: 'On relit',    tail: ' le journal avant le compte.' },
  { lead: 'On accepte',  tail: ' que l’ennui est le métier.', em: true },
];

const EN: Beat[] = [
  { lead: 'We watch',  tail: ' the candle before the chart.', em: true },
  { lead: 'We write',  tail: ' the risk before the order.' },
  { lead: 'We play',   tail: ' the pattern, not the opinion.', em: true },
  { lead: 'We reread', tail: ' the journal before the account.' },
  { lead: 'We accept', tail: ' that boredom is the work.', em: true },
];

export function Methode({ locale }: Props) {
  const beats = locale === 'fr' ? FR : EN;

  return (
    <section
      aria-labelledby="methode"
      className="relative bg-[#F4F1EA] text-[#0E0E0E] border-t border-black/[0.08]"
    >
      <div className="ed-section grid grid-cols-12 gap-x-6 px-6 md:px-16">
        <aside className="col-span-12 lg:col-span-3 mb-12 lg:mb-0">
          <span className="ed-tag text-black/50">
            {locale === 'fr' ? 'Salle 05 — La méthode' : 'Room 05 — The method'}
          </span>
          <h2
            id="methode"
            className="mt-8 ed-display text-[#0E0E0E]"
            style={{ fontSize: 'clamp(40px, 5.4vw, 84px)' }}
          >
            {locale === 'fr' ? 'En cinq.' : 'In five.'}
          </h2>
          <p className="mt-10 text-black/55 text-[13.5px] leading-relaxed max-w-[280px]">
            {locale === 'fr'
              ? 'Cinq phrases que l’on dit à voix haute avant chaque séance. Quatre suffisent ; cinq protègent.'
              : 'Five lines we say out loud before each session. Four suffice; five protect.'}
          </p>
        </aside>

        <ol className="col-span-12 lg:col-span-9 space-y-6 md:space-y-10">
          {beats.map((b, i) => (
            <li key={i} className="grid grid-cols-12 gap-x-4 items-baseline">
              <span className="col-span-2 md:col-span-1 ed-tag text-black/40 tabular-nums pt-3">
                {String(i + 1).padStart(2, '0')}
              </span>
              <p
                className="col-span-10 md:col-span-11 ed-head"
                style={{
                  fontSize: 'clamp(28px, 4.6vw, 64px)',
                  color: b.em ? 'rgb(14,14,14)' : 'rgba(0,0,0,0.62)',
                  fontStyle: b.em ? 'italic' : 'normal',
                }}
              >
                <span className="text-[#0E0E0E]">{b.lead}</span>
                <span className="text-black/60">{b.tail}</span>
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

