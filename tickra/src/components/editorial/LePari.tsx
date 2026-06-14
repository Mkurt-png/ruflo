// LePari — Index 06. Pricing transformed into an editorial commitment.
// Not a tier table. A single sentence runs across the layout, with the
// three options written out as prose. The actual price is the climax of
// the sentence — no pill, no button-styled CTA, just a discreet link.

import Link from 'next/link';
import type { Locale } from '@/lib/i18n/config';

type Props = { locale: Locale };

export function LePari({ locale }: Props) {
  const room = locale === 'fr' ? 'Salle 06 — Le pari' : 'Room 06 — The wager';

  return (
    <section
      aria-labelledby="le-pari"
      className="relative bg-[#F4F1EA] text-[#0E0E0E] border-t border-black/[0.08]"
    >
      <div className="ed-section px-6 md:px-16">
        <span className="ed-tag text-black/50">{room}</span>
        <h2 id="le-pari" className="sr-only">
          {locale === 'fr' ? 'Tarifs' : 'Pricing'}
        </h2>

        {/* The sentence */}
        <div className="mt-16 md:mt-24 grid grid-cols-12 gap-x-6">
          <p
            className="col-span-12 lg:col-span-10 ed-display text-[#0E0E0E] text-balance"
            style={{ fontSize: 'clamp(40px, 6.4vw, 96px)', lineHeight: 0.98 }}
          >
            {locale === 'fr' ? (
              <>
                Gratuit pour s’asseoir au fond.{' '}
                <span className="text-black/55">Quatorze euros par mois</span> pour entrer en classe.{' '}
                <span className="text-black/45">Cent quarante-neuf,</span>{' '}
                <span className="text-black/55">une fois,</span> pour ne plus en sortir.
              </>
            ) : (
              <>
                Free for the back row.{' '}
                <span className="text-black/55">Fourteen euros a month</span> to take the class.{' '}
                <span className="text-black/45">One hundred forty-nine,</span>{' '}
                <span className="text-black/55">once,</span> to stay for life.
              </>
            )}
          </p>
        </div>

        {/* The discreet trio of detail lines + one quiet link */}
        <div className="mt-20 md:mt-28 grid grid-cols-12 gap-x-6 gap-y-10 border-t border-black/[0.08] pt-12">
          <Foot index="01" label={locale === 'fr' ? 'Annulable' : 'Cancel'} value={locale === 'fr' ? 'en deux clics' : 'in two clicks'} />
          <Foot index="02" label={locale === 'fr' ? 'Remboursé' : 'Refunded'} value={locale === 'fr' ? 'quatorze jours, sans question' : 'fourteen days, no questions'} />
          <Foot index="03" label={locale === 'fr' ? 'Sans publicité' : 'No advertising'} value={locale === 'fr' ? 'jamais, par contrat' : 'never, by contract'} />
          <Foot index="04" label={locale === 'fr' ? 'Données' : 'Data'} value={locale === 'fr' ? 'chiffrées, jamais revendues' : 'encrypted, never sold'} />

          <div className="col-span-12 flex justify-between items-baseline mt-12">
            <span className="ed-tag text-black/45">
              {locale === 'fr' ? 'AMF · Éducation, pas de signal, pas de conseil' : 'AMF · Education only, no signals, no advice'}
            </span>
            <Link
              href={`/${locale}/pricing`}
              className="ed-tag text-black/80 hover:text-[#0E0E0E] transition-colors"
            >
              {locale === 'fr' ? 'Voir les conditions ↘' : 'See the terms ↘'}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Foot({ index, label, value }: { index: string; label: string; value: string }) {
  return (
    <div className="col-span-6 md:col-span-3">
      <div className="ed-tag text-black/40 tabular-nums">{index}</div>
      <div className="mt-3 text-[#0E0E0E] text-[15px]">{label}</div>
      <div className="mt-1 text-black/55 text-[13.5px]">{value}</div>
    </div>
  );
}

