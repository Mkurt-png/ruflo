// Epreuve — Index 05. The quiz, presented as an examination, not a card.
// A diagonal sentence-fragment composition with one quiet link at the
// bottom. Two columns of text whose lines deliberately don't align so
// the eye has to walk the layout.

import Link from 'next/link';
import type { Locale } from '@/lib/i18n/config';

type Props = { locale: Locale };

export function Epreuve({ locale }: Props) {
  const room = locale === 'fr' ? 'Salle 04 — L’épreuve' : 'Room 04 — The examination';

  return (
    <section
      aria-labelledby="epreuve"
      className="relative bg-[#F4F1EA] text-[#0E0E0E] border-t border-black/[0.08] overflow-hidden"
    >
      <div className="ed-section">
        <div className="px-6 md:px-16">
          <span className="ed-tag text-black/50">{room}</span>
        </div>

        <h2 id="epreuve" className="sr-only">
          {locale === 'fr' ? 'L’épreuve' : 'The examination'}
        </h2>

        {/* Asymmetric composition — first line top-left, second line offset right */}
        <div className="mt-20 md:mt-32 px-6 md:px-16">
          <p
            className="ed-display text-[#0E0E0E]"
            style={{ fontSize: 'clamp(48px, 9vw, 140px)' }}
          >
            <span className="block">{locale === 'fr' ? 'Cinq questions.' : 'Five questions.'}</span>
            <span
              className="block pl-[10%] md:pl-[18%] mt-2 md:mt-4"
              style={{ color: 'rgba(0,0,0,0.55)' }}
            >
              {locale === 'fr' ? 'Dix minutes.' : 'Ten minutes.'}
            </span>
            <span
              className="block pl-[22%] md:pl-[36%] mt-2 md:mt-4"
              style={{ color: 'rgba(0,0,0,0.45)' }}
            >
              {locale === 'fr' ? 'Aucune triche.' : 'No second guesses.'}
            </span>
          </p>
        </div>

        {/* Footnote-style detail */}
        <div className="mt-24 md:mt-40 px-6 md:px-16 grid grid-cols-12 gap-x-6 items-baseline">
          <p className="col-span-12 md:col-span-7 lg:col-span-6 text-black/55 text-[15px] leading-relaxed">
            {locale === 'fr'
              ? 'Une seule passe. Le résultat ne se note pas — il s’écrit dans le journal. La piste qui suit dépend de la phrase que tu te diras après la dernière question.'
              : 'One pass. The result is not stored — it is written in the journal. The next track depends on the sentence you tell yourself after the last question.'}
          </p>
          <Link
            href={`/${locale}/placement`}
            className="col-span-12 md:col-span-5 lg:col-span-6 md:text-right mt-8 md:mt-0 ed-tag text-black/80 hover:text-[#0E0E0E] transition-colors"
          >
            {locale === 'fr' ? 'Passer l’épreuve ↘' : 'Sit the exam ↘'}
          </Link>
        </div>
      </div>
    </section>
  );
}

export default Epreuve;
