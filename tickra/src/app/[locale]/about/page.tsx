import { notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { Navbar } from '@/components/nav/Navbar';
import { Footer } from '@/components/sections/Footer';
import { BuiltBy } from '@/components/sections/BuiltBy';
import { Container } from '@/components/ui/Container';
import { PageHero } from '@/components/ui/PageHero';
import { RiskDisclosure } from '@/components/ui/RiskDisclosure';
import { TrustBar } from '@/components/ui/TrustBar';
import { ShimmerButton } from '@/components/fx/ShimmerButton';

export const metadata = { title: 'À propos · Tickra' };

// Founder copy is kept here (per-locale) rather than in the i18n bundle
// so the team can swap names, location, proof points without touching
// translations every time. Placeholders are neutral and rewritable.
const FOUNDER = {
  fr: {
    eyebrow: 'Fondateur',
    name: 'Hamza Kurt',
    role: 'Trader & fondateur',
    location: 'Paris · FR',
    bio: [
      'J’ai commencé à trader à 18 ans avec un livre et un compte démo. J’ai brûlé deux comptes réels avant de comprendre que le problème n’était pas le marché — c’était la méthode.',
      'Pendant cinq ans, j’ai démonté ce qui sépare un trader qui survit d’un trader qui explose : un cadre de risque écrit, des figures que l’on reconnaît dans son sommeil, et un journal honnête.',
      'Tickra, c’est le parcours que j’aurais voulu avoir à 18 ans. Pas un cours magistral — un atelier : 10 minutes par jour, des figures réelles, un risque mesuré, un journal qui te confronte.',
    ],
    proofs: [
      { label: 'Années sur les marchés', value: '7+' },
      { label: 'Setups documentés',     value: '40+' },
      { label: 'Comptes pris en main',  value: '120+' },
      { label: 'Heures de courbe',      value: '10 000+' },
    ],
  },
  en: {
    eyebrow: 'Founder',
    name: 'Hamza Kurt',
    role: 'Trader & founder',
    location: 'Paris · FR',
    bio: [
      'I started trading at 18 with a book and a demo account. I blew up two real accounts before realising the problem wasn’t the market — it was the method.',
      'Over the next five years I broke down what separates a trader who survives from one who detonates: a written risk framework, patterns you recognise in your sleep, and an honest journal.',
      'Tickra is the curriculum I wish I had at 18. Not a lecture — a workshop: 10 minutes a day, real charts, measured risk, a journal that confronts you.',
    ],
    proofs: [
      { label: 'Years on the markets', value: '7+' },
      { label: 'Documented setups',    value: '40+' },
      { label: 'Accounts coached',     value: '120+' },
      { label: 'Hours on chart',       value: '10,000+' },
    ],
  },
} as const;

const REFUSE = {
  fr: {
    title: 'Ce que nous refusons',
    items: [
      'Signaux d’achat ou de vente',
      'Captures de comptes en démo présentées comme des résultats réels',
      'Promesses de revenus, "trader pour vivre dans 3 mois"',
      'Upsells masqués, formations à 2 000€ derrière la formation à 200€',
      'Discord à 500 personnes qui s’auto-rassurent',
    ],
  },
  en: {
    title: 'What we refuse',
    items: [
      'Buy or sell signals',
      'Demo-account screenshots framed as real-money results',
      'Income promises, "quit your job in 3 months"',
      'Hidden upsells, a €2 000 course behind the €200 course',
      'A 500-person Discord echo chamber',
    ],
  },
} as const;

export default async function AboutPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale: Locale = params.locale;
  const dict = await getDictionary(locale);
  const t = dict.about;
  const f = FOUNDER[locale];
  const r = REFUSE[locale];

  return (
    <>
      <Navbar dict={dict} locale={locale} />
      <main id="main">
        <PageHero title={t.title} body={t.intro} eyebrow={dict.builtBy.eyebrow} />

        {/* FOUNDER — personal accountability layer. Portrait placeholder
            can be swapped for a real photo at /public/founder.jpg later. */}
        <section className="border-b border-line">
          <Container as="div" className="py-20 md:py-28">
            <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-12">
              <div className="md:col-span-5">
                <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand">{f.eyebrow}</span>
                <h2 className="mt-3 font-display text-3xl font-medium tracking-tight text-ink md:text-4xl">
                  {f.name}
                </h2>
                <div className="mt-1 font-mono text-[12px] uppercase tracking-[0.18em] text-muted">
                  {f.role} · {f.location}
                </div>
                <div
                  aria-hidden
                  className="mt-6 aspect-square w-full max-w-[280px] rounded-sm border border-line bg-elevated"
                  style={{
                    backgroundImage:
                      'radial-gradient(circle at 35% 35%, rgb(var(--brand) / 0.18), transparent 60%), radial-gradient(circle at 70% 70%, rgb(var(--accent) / 0.25), transparent 60%)',
                  }}
                />
              </div>

              <div className="md:col-span-7">
                <div className="space-y-5 text-[15.5px] leading-relaxed text-muted">
                  {f.bio.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
                <ul className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {f.proofs.map((p) => (
                    <li key={p.label} className="rounded-md border border-line bg-surface px-4 py-3">
                      <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">{p.label}</div>
                      <div className="mt-1 font-display text-2xl font-medium tracking-tight text-ink tabular-nums">
                        {p.value}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Container>
        </section>

        {/* Existing dict-driven sections preserved — pari / refus / promesse. */}
        <section className="border-b border-line">
          <Container as="div" className="grid grid-cols-12 gap-x-6 gap-y-16 py-24 md:py-32">
            {t.sections.map((s, i) => (
              <article key={s.title} className="col-span-12 md:col-span-6">
                <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h2 className="mt-4 font-display text-2xl font-medium tracking-tight text-ink md:text-[26px]">
                  {s.title}
                </h2>
                <p className="mt-4 max-w-md text-[15.5px] leading-relaxed text-muted">{s.body}</p>
              </article>
            ))}
          </Container>
        </section>

        {/* REFUSE — explicit anti-promise list (no signals, no demo flex). */}
        <section className="border-b border-line bg-elevated/40">
          <Container as="div" className="py-16 md:py-24">
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand">
              {locale === 'fr' ? 'Engagement' : 'Promise'}
            </span>
            <h2 className="mt-3 font-display text-3xl font-medium tracking-tight text-ink md:text-4xl">
              {r.title}
            </h2>
            <ul className="mt-8 grid grid-cols-1 gap-2 md:grid-cols-2">
              {r.items.map((it) => (
                <li
                  key={it}
                  className="flex items-start gap-3 rounded-md border border-line bg-surface px-4 py-3 text-[14px] text-ink"
                >
                  <span aria-hidden className="mt-[2px] font-mono text-[12px] text-down">✕</span>
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          </Container>
        </section>

        <BuiltBy dict={dict} />

        {/* TRUST BAR + CTA + RISK */}
        <section className="border-b border-line bg-elevated/40">
          <Container as="div" className="py-16 md:py-24">
            <TrustBar locale={locale} />
            <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-display text-2xl font-medium tracking-tight text-ink">
                  {locale === 'fr' ? 'Voir l’offre ?' : 'See the offer?'}
                </h3>
                <p className="mt-1 text-[14px] text-muted">
                  {locale === 'fr'
                    ? 'Pro mensuel, annuel, ou À vie. Annulable à tout moment.'
                    : 'Pro monthly, yearly, or Lifetime. Cancel anytime.'}
                </p>
              </div>
              <ShimmerButton href={`/${locale}/pricing`}>
                {locale === 'fr' ? 'Voir les tarifs' : 'See pricing'}
                <span aria-hidden className="ml-1">→</span>
              </ShimmerButton>
            </div>
            <RiskDisclosure locale={locale} className="mt-10" />
          </Container>
        </section>
      </main>
      <Footer dict={dict} locale={locale} />
    </>
  );
}
