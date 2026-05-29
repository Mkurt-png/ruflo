import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { isLocale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { Navbar } from '@/components/nav/Navbar';
import { Footer } from '@/components/sections/Footer';
import { Container } from '@/components/ui/Container';

export const metadata = { title: 'Bienvenue · Tickra' };

const copy = {
  fr: {
    eyebrow: 'Paiement confirmé',
    title: 'Bienvenue dans Tickra Pro.',
    body: "Votre accès est actif. Vous trouverez votre reçu Stripe dans votre boîte mail, et un email de bienvenue arrive dans quelques minutes.",
    nextSteps: 'Et maintenant ?',
    steps: [
      { title: 'Compléter votre profil', body: 'Choisissez votre langue, votre thème, et un nom affiché.', cta: 'Ouvrir mes paramètres', href: '/me/settings' },
      { title: 'Démarrer la première piste', body: 'On commence par les bougies japonaises — 10 min par leçon.', cta: 'Aller au cursus', href: '/curriculum' },
      { title: 'Tester un outil', body: 'Lancez le calculateur de taille de position pour caler votre premier trade.', cta: 'Ouvrir les outils', href: '/tools' },
    ],
    primary: 'Aller à mon espace',
    primaryHref: '/me',
  },
  en: {
    eyebrow: 'Payment confirmed',
    title: 'Welcome to Tickra Pro.',
    body: "Your access is live. Your Stripe receipt is in your inbox, and a welcome email is on its way.",
    nextSteps: 'What now?',
    steps: [
      { title: 'Complete your profile', body: 'Pick your language, theme, and display name.', cta: 'Open my settings', href: '/me/settings' },
      { title: 'Start the first track', body: 'We begin with Japanese candles — 10 min per lesson.', cta: 'Go to curriculum', href: '/curriculum' },
      { title: 'Try a tool', body: 'Open the position-size calculator to set up your first trade.', cta: 'Open tools', href: '/tools' },
    ],
    primary: 'Go to my space',
    primaryHref: '/me',
  },
} as const;

export default async function WelcomePage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const dict = await getDictionary(params.locale);
  const t = copy[params.locale];

  return (
    <>
      <Navbar dict={dict} locale={params.locale} />
      <main id="main">
        <section className="border-b border-line">
          <Container as="div" className="py-20 md:py-28">
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">{t.eyebrow}</div>
            <h1 className="mt-4 max-w-3xl font-display text-display-lg font-medium tracking-tight text-balance text-ink">
              <CheckCircle2 aria-hidden className="mr-3 inline-block h-8 w-8 align-[-4px] text-accent" strokeWidth={1.5} />
              {t.title}
            </h1>
            <p className="mt-6 max-w-2xl text-pretty text-[17px] leading-relaxed text-muted md:text-lg">{t.body}</p>
            <div className="mt-10">
              <Link
                href={`/${params.locale}${t.primaryHref}`}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-ink px-7 font-medium tracking-tight text-canvas transition-colors hover:bg-ink/90"
              >
                {t.primary}
                <ArrowRight aria-hidden className="h-4 w-4" strokeWidth={1.75} />
              </Link>
            </div>
          </Container>
        </section>

        <section className="border-b border-line">
          <Container as="div" className="py-20 md:py-28">
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">{t.nextSteps}</div>
            <div className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-3">
              {t.steps.map((s) => (
                <Link
                  key={s.href}
                  href={`/${params.locale}${s.href}`}
                  className="group flex flex-col gap-4 rounded-sm border border-line bg-surface p-7 transition-colors hover:border-ink md:p-8"
                >
                  <h3 className="font-display text-xl font-medium tracking-tight text-ink">{s.title}</h3>
                  <p className="text-[14.5px] leading-relaxed text-muted">{s.body}</p>
                  <span className="mt-auto inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-ink">
                    {s.cta}
                    <ArrowRight aria-hidden className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={1.75} />
                  </span>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      </main>
      <Footer dict={dict} locale={params.locale} />
    </>
  );
}
