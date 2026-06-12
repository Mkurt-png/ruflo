import { notFound } from 'next/navigation';
import Link from 'next/link';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { Navbar } from '@/components/nav/Navbar';
import { Footer } from '@/components/sections/Footer';

// /[locale]/edition-lifetime — L'Édition Lifetime. Une brochure
// éditoriale du livret annuel imprimé. Le programme postal sera
// activé quand la migration commerciale sera prête ; la candor note
// le dit.

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'L’Édition Lifetime · Tickra',
  description:
    'Une fois par an, les membres Lifetime reçoivent un livret imprimé de leur année — Cote, trades, Criées choisies, Lettre du Nouvel An.',
};

const COPY = {
  fr: {
    eyebrow: 'L’Édition Lifetime — livret postal',
    head1: 'Une fois par an.',
    head2: 'Sur papier.',
    head3: 'Par la poste.',
    intro:
      'L’Édition Lifetime est un livret typographique d’une cinquantaine de pages envoyé chaque mois de janvier aux membres Lifetime. Il contient leur année — Cote mois par mois, meilleurs et pires trades, Criées choisies, leur Lettre du Nouvel An, et un long essai inédit. Édition limitée, numérotée, jamais en vente.',
    contents: 'Sommaire indicatif',
    bullets: [
      'Couverture en gaufrage, papier ivoire 120 g.',
      'Votre Cote mois par mois, en planche dépliante.',
      'Vingt trades commentés — vous choisissez la sélection.',
      'Trois Criées de l’année avec leur leçon source intégrale.',
      'Une Lettre du Nouvel An signée par l’éditeur, à votre nom.',
      'Un essai inédit, jamais publié sur Tickra.',
    ],
    candor:
      'Note d’honnêteté : le programme postal sera activé quand la migration commerciale et l’imprimerie partenaire seront prêtes. Les membres Lifetime actuels reçoivent dès maintenant le PDF mensuel ; le papier suivra.',
    cta: 'Voir les étages',
  },
  en: {
    eyebrow: 'The Lifetime Edition — mailed booklet',
    head1: 'Once a year.',
    head2: 'On paper.',
    head3: 'By post.',
    intro:
      'The Lifetime Edition is a fifty-page typographic booklet mailed every January to Lifetime members. It carries their year — Score month by month, best and worst trades, chosen Criées, their New Year Letter, and one unpublished long essay. Limited, numbered, never for sale.',
    contents: 'Tentative contents',
    bullets: [
      'Embossed cover, ivory 120 gsm paper.',
      'Your Score month by month, on a fold-out plate.',
      'Twenty annotated trades — you choose the selection.',
      'Three of the year’s Criées with their full source lesson.',
      'A New Year Letter signed by the editor, addressed to you.',
      'One unpublished essay, never seen on Tickra.',
    ],
    candor:
      'Honesty note: the postal program will go live when the commercial migration and partner printer are ready. Current Lifetime members already receive the monthly PDF; paper will follow.',
    cta: 'See the floors',
  },
} as const;

export default async function EditionPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale: Locale = params.locale;
  const dict = await getDictionary(locale);
  const t = COPY[locale];

  return (
    <>
      <Navbar dict={dict} locale={locale} />
      <main id="main" className="bg-[#F4F1EA] min-h-screen">
        <section
          className="relative px-6 md:px-16"
          style={{ paddingTop: 'clamp(120px, 16vh, 200px)', paddingBottom: 'clamp(48px, 8vh, 96px)' }}
        >
          <header className="flex items-baseline justify-between gap-6 border-b border-black/15 pb-4">
            <span className="font-mono text-[10px] uppercase tracking-[0.34em] text-black/55">
              {t.eyebrow}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.34em] text-black/45">
              {locale === 'fr' ? 'En préparation' : 'In preparation'}
            </span>
          </header>

          <div className="mt-16 md:mt-24 max-w-[1100px]">
            <p
              className="font-display italic font-light text-[#0E0E0E]"
              style={{ fontSize: 'clamp(40px, 6vw, 92px)', lineHeight: 0.96, letterSpacing: '-0.035em' }}
            >
              {t.head1}
              <br />
              <span className="text-black/55">{t.head2}</span>
              <br />
              <span className="text-black/35">{t.head3}</span>
            </p>
          </div>

          <p
            className="mt-16 max-w-[640px] font-display text-[#0E0E0E]/75 leading-relaxed"
            style={{ fontSize: 'clamp(17px, 1.7vw, 20px)' }}
          >
            {t.intro}
          </p>
        </section>

        <section className="mx-auto max-w-[920px] px-6 md:px-16 pb-32">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-black/45 border-t border-black/15 pt-10">
            {t.contents}
          </p>
          <ol className="mt-6 space-y-5">
            {t.bullets.map((line, i) => (
              <li key={i} className="grid grid-cols-[2ch_1fr] gap-x-5 items-baseline">
                <span className="font-mono text-[10px] tracking-[0.22em] text-black/35 tabular-nums">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <p
                  className="font-display text-[#0E0E0E]/85"
                  style={{ fontSize: 'clamp(16px, 1.65vw, 19px)' }}
                >
                  {line}
                </p>
              </li>
            ))}
          </ol>

          <div className="mt-16 border-t border-black/15 pt-6 flex flex-wrap items-baseline justify-between gap-4">
            <p className="font-mono text-[10.5px] leading-relaxed text-black/45 max-w-[480px]">
              {t.candor}
            </p>
            <Link
              href={`/${locale}/etages`}
              className="font-mono text-[10px] uppercase tracking-[0.28em] text-black/55 hover:text-black/90"
            >
              {t.cta} →
            </Link>
          </div>
        </section>
      </main>
      <Footer dict={dict} locale={locale} />
    </>
  );
}
