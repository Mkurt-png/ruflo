import { notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { EditorialFrame } from '@/components/editorial/EditorialFrame';
import { ReadNext } from '@/components/editorial/ReadNext';
import { Pull } from '@/components/editorial/Pull';
import { VOIX } from '@/lib/tickra/voix';

// /[locale]/voix — Les Voix. Monthly interview series with anonymous
// working traders. Editorial register. Static data file; the editor
// publishes the audio URL whenever the recording is up.

import { editorialPageMeta } from '@/lib/seo/editorial-meta';
import { EditorialJsonLd } from '@/components/seo/EditorialJsonLd';
import { RoomBreadcrumb } from '@/components/seo/RoomBreadcrumb';
import { VoixItemListJsonLd } from '@/components/seo/VoixItemListJsonLd';

export const revalidate = 3600;
export const generateMetadata = editorialPageMeta({
  slug: 'voix',
  title: { fr: 'Les Voix', en: 'The Voices' },
  description: {
    fr: 'Une voix par mois. Des traders en activité, sous pseudonyme, qui racontent leur métier sans grand récit.',
    en: 'One voice per month. Working traders, under pseudonym, telling their craft without grand story.',
  },
});

const COPY = {
  fr: {
    eyebrow: 'Les Voix — entretiens mensuels',
    head1: 'Une voix.',
    head2: 'Par mois.',
    head3: 'Sans grand récit.',
    intro:
      'Une fois par mois, l’éditeur enregistre un entretien avec un trader en activité, sous pseudonyme. Pas de chiffres, pas de promesses : ce qui change leur séance, ce qu’ils ont noté un matin, ce qu’ils ont arrêté de faire.',
    cityLabel: 'Lieu',
    craftLabel: 'Métier',
    audioMissing: 'Enregistrement en attente — extraits publiés ci-dessous.',
    footer:
      'Les voix restent anonymes : nous ne publierons aucun nom réel sans demande écrite. Si vous voulez témoigner, écrivez-nous — la conversation reste à votre rythme.',
  },
  en: {
    eyebrow: 'The Voices — monthly interviews',
    head1: 'One voice.',
    head2: 'Per month.',
    head3: 'No grand story.',
    intro:
      'Once a month, the editor records an interview with a working trader, under a pseudonym. No numbers, no promises: what changes their session, what they noted one morning, what they stopped doing.',
    cityLabel: 'City',
    craftLabel: 'Craft',
    audioMissing: 'Recording pending — excerpts published below.',
    footer:
      'Voices stay anonymous: we will publish no real name without written request. If you want to be interviewed, write to us — the conversation goes at your pace.',
  },
} as const;

function formatDate(iso: string, locale: Locale): string {
  return new Date(iso + 'T00:00:00Z').toLocaleDateString(
    locale === 'fr' ? 'fr-FR' : 'en-GB',
    { day: 'numeric', month: 'long', year: 'numeric' },
  );
}

export default async function VoixPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale: Locale = params.locale;
  const dict = await getDictionary(locale);
  const t = COPY[locale];

  return (
    <>
      <EditorialJsonLd
        slug="voix"
        title={locale === 'fr' ? 'Les Voix' : 'The Voices'}
        description={locale === 'fr'
          ? 'Une voix par mois. Entretiens anonymes avec des traders en activité.'
          : 'One voice per month. Anonymous interviews with working traders.'}
        locale={locale}
      />
      <RoomBreadcrumb
        locale={locale}
        slug="voix"
        title={{ fr: 'Les Voix', en: 'The Voices' }}
      />
      <VoixItemListJsonLd locale={locale} />
      <EditorialFrame
        dict={dict}
        locale={locale}
        eyebrow={t.eyebrow}
        status={`${VOIX.length} ${locale === 'fr' ? 'voix' : 'voices'}`}
        head={[t.head1, t.head2, t.head3]}
        intro={t.intro}
      >
        <section className="mx-auto max-w-[920px] px-6 md:px-16">
          <Pull>
            {locale === 'fr'
              ? 'Une voix, un mois. Sous pseudonyme, sans grand récit.'
              : 'One voice, one month. Under pseudonym, without grand story.'}
          </Pull>
        </section>
        <section className="mx-auto max-w-[920px] px-6 md:px-16 pb-32">
          {VOIX.map((v, i) => (
            <article
              key={v.id}
              id={v.id}
              className="border-t border-black/15 pt-12 mt-16 first:mt-0 first:border-0 first:pt-0 scroll-mt-24"
            >
              <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                <div>
                  <span
                    className="font-display italic text-[#0E0E0E]"
                    style={{ fontSize: 'clamp(30px, 4vw, 46px)', letterSpacing: '-0.02em' }}
                  >
                    {v.pseudonym}
                  </span>
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.28em] text-black/65 tabular-nums">
                    {formatDate(v.date, locale)} · {v.city[locale]} · {v.craft[locale]}
                  </p>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-black/55 tabular-nums">
                  {String(VOIX.length - i).padStart(2, '0')}
                </span>
              </header>

              {!v.audioUrl && (
                <p className="mt-6 font-mono text-[10.5px] uppercase tracking-[0.28em] text-black/65">
                  {t.audioMissing}
                </p>
              )}

              <ol className="mt-8 space-y-6">
                {v.excerpts.map((ex, idx) => (
                  <li key={idx} className="grid grid-cols-[3ch_1fr] gap-x-6 items-baseline">
                    <span className="font-mono text-[10px] tracking-[0.22em] text-black/35 tabular-nums">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <p
                      className="font-display italic leading-relaxed text-[#0E0E0E]/85 max-w-[640px]"
                      style={{ fontSize: 'clamp(16px, 1.7vw, 20px)' }}
                    >
                      « {ex[locale]} »
                    </p>
                  </li>
                ))}
              </ol>

              <p
                className="mt-8 font-display text-[#0E0E0E]/55 max-w-[640px]"
                style={{ fontSize: 'clamp(13px, 1.3vw, 16px)' }}
              >
                — {v.signature[locale]}
              </p>
            </article>
          ))}

          <footer className="mt-24 border-t border-black/15 pt-6">
            <p className="font-mono text-[10.5px] leading-relaxed text-black/65 max-w-[640px]">
              {t.footer}
            </p>
          </footer>
        </section>
        <ReadNext
          locale={locale}
          rooms={[
            {
              slug: 'lettre',
              title: { fr: 'La Lettre du dimanche', en: 'The Sunday Letter' },
              caption: {
                fr: 'Une voix à soi-même, chaque semaine.',
                en: 'A voice to oneself, each week.',
              },
            },
            {
              slug: 'cercle',
              title: { fr: 'Le Cercle de relecture', en: 'The Reading Circle' },
              caption: {
                fr: 'Une voix à un inconnu, en silence.',
                en: 'A voice to a stranger, in silence.',
              },
            },
            {
              slug: 'erratum',
              title: { fr: 'L’Erratum', en: 'The Erratum' },
              caption: {
                fr: 'Quand les voix se trompent, l’éditeur le note.',
                en: 'When voices err, the editor notes it.',
              },
            },
          ]}
        />
      </EditorialFrame>
    </>
  );
}
