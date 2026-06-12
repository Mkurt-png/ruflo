import { notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { Navbar } from '@/components/nav/Navbar';
import { Footer } from '@/components/sections/Footer';
import { VOIX } from '@/lib/tickra/voix';

// /[locale]/voix — Les Voix. Monthly interview series with anonymous
// working traders. Editorial register. Static data file; the editor
// publishes the audio URL whenever the recording is up.

import { editorialMeta } from '@/lib/seo/editorial-meta';
import { EditorialJsonLd } from '@/components/seo/EditorialJsonLd';

export const revalidate = 3600;
export const metadata = editorialMeta({
  slug: 'voix',
  title: 'Les Voix',
  description:
    'Une voix par mois. Des traders en activité, sous pseudonyme, qui racontent leur métier sans grand récit.',
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
      <Navbar dict={dict} locale={locale} />
      <EditorialJsonLd
        slug="voix"
        title={locale === 'fr' ? 'Les Voix' : 'The Voices'}
        description={locale === 'fr'
          ? 'Une voix par mois. Entretiens anonymes avec des traders en activité.'
          : 'One voice per month. Anonymous interviews with working traders.'}
        locale={locale}
      />
      <main id="main" className="bg-[#F4F1EA] min-h-screen">
        <section
          className="relative px-6 md:px-16"
          style={{ paddingTop: 'clamp(120px, 16vh, 200px)', paddingBottom: 'clamp(48px, 8vh, 96px)' }}
        >
          <header className="flex items-baseline justify-between gap-6 border-b border-black/15 pb-4">
            <span className="font-mono text-[10px] uppercase tracking-[0.34em] text-black/55">
              {t.eyebrow}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.34em] text-black/65 tabular-nums">
              {VOIX.length} {locale === 'fr' ? 'voix' : 'voices'}
            </span>
          </header>

          <div className="mt-16 md:mt-24 max-w-[1100px]">
            <h1
              className="font-display italic font-light text-[#0E0E0E]"
              style={{ fontSize: 'clamp(40px, 6vw, 92px)', lineHeight: 0.96, letterSpacing: '-0.035em' }}
            >
              {t.head1}
              <br />
              <span className="text-black/55">{t.head2}</span>
              <br />
              <span className="text-black/35">{t.head3}</span>
            </h1>
          </div>

          <p
            className="mt-16 max-w-[640px] font-display text-[#0E0E0E]/75 leading-relaxed"
            style={{ fontSize: 'clamp(17px, 1.7vw, 20px)' }}
          >
            {t.intro}
          </p>
        </section>

        <section className="mx-auto max-w-[920px] px-6 md:px-16 pb-32">
          {VOIX.map((v, i) => (
            <article
              key={v.id}
              className="border-t border-black/15 pt-12 mt-16 first:mt-0 first:border-0 first:pt-0"
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
      </main>
      <Footer dict={dict} locale={locale} />
    </>
  );
}
