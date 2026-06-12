import { notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { Navbar } from '@/components/nav/Navbar';
import { Footer } from '@/components/sections/Footer';
import { REFUSALS } from '@/lib/tickra/refus';

// /[locale]/refus — Le Refus. Ten things Tickra will never build.
// A manifesto by negation, in the editorial register. Static content,
// no logic, no progress — defines the brand by what it refuses.

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Le Refus · Tickra',
  description:
    'Dix choses que Tickra ne construira jamais. Un manifeste par la négation, écrit pour lever toute ambiguïté.',
};

const COPY = {
  fr: {
    eyebrow: 'Le Refus — manifeste par négation',
    head1: 'Ce qu’on ne fera',
    head2: 'jamais.',
    head3: 'Dix choses, signées.',
    intro:
      'Un site de trading se définit autant par ce qu’il refuse que par ce qu’il publie. Voici les dix lignes que Tickra ne franchira pas. Si une seule d’entre elles vous manque, vous êtes au mauvais endroit — et nous préférons que vous le sachiez maintenant.',
    footer:
      'Ce manifeste est public et permanent. Si nous y revenons un jour, ce sera ici, daté, en haut — sans communication, sans excuse, sans soldes.',
  },
  en: {
    eyebrow: 'The Refusal — manifesto by negation',
    head1: 'What we will',
    head2: 'never build.',
    head3: 'Ten lines, signed.',
    intro:
      'A trading site is defined as much by what it refuses as by what it publishes. Here are the ten lines Tickra will not cross. If even one of them is something you need, you are in the wrong place — and we would rather you know now.',
    footer:
      'This manifesto is public and permanent. If we ever revisit it, it will be here, dated at the top — no announcement, no excuse, no sale.',
  },
} as const;

export default async function RefusPage({ params }: { params: { locale: string } }) {
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
              {locale === 'fr' ? 'Permanent' : 'Permanent'}
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
          <ol className="space-y-16">
            {REFUSALS.map((r, i) => (
              <li
                key={r.id}
                className="grid grid-cols-[3ch_1fr] gap-x-8 items-baseline border-t border-black/15 pt-10 first:border-0 first:pt-0"
              >
                <span className="font-mono text-[11px] tracking-[0.22em] text-black/35 tabular-nums">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <h2
                    className="font-display italic text-[#0E0E0E]"
                    style={{ fontSize: 'clamp(26px, 3.4vw, 40px)', letterSpacing: '-0.02em', lineHeight: 1.05 }}
                  >
                    {r.title[locale]}
                  </h2>
                  <p
                    className="mt-5 font-display leading-relaxed text-[#0E0E0E]/80 max-w-[640px]"
                    style={{ fontSize: 'clamp(16px, 1.6vw, 19px)' }}
                  >
                    {r.why[locale]}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <footer className="mt-24 border-t border-black/15 pt-6">
            <p className="font-mono text-[10.5px] leading-relaxed text-black/45 max-w-[640px]">
              {t.footer}
            </p>
          </footer>
        </section>
      </main>
      <Footer dict={dict} locale={locale} />
    </>
  );
}
