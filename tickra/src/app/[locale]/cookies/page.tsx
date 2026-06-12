import { notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { Navbar } from '@/components/nav/Navbar';
import { Footer } from '@/components/sections/Footer';
import { Container } from '@/components/ui/Container';
import { PageHero } from '@/components/ui/PageHero';
import { Prose } from '@/components/ui/Prose';

export const metadata = { title: 'Politique cookies · Tickra' };

const COPY = {
  fr: {
    title: 'Politique cookies',
    updated: 'Dernière mise à jour : juin 2026',
    sections: [
      {
        h: '1. Qu’est-ce qu’un cookie ?',
        body: [
          'Un cookie est un petit fichier texte déposé sur votre appareil (ordinateur, tablette, mobile) lors de la visite d’un site web. Il permet au site de mémoriser vos actions et préférences (langue, thème, session) pendant une durée déterminée.',
        ],
      },
      {
        h: '2. Cookies que nous déposons',
        body: [
          'Tickra dépose uniquement des cookies strictement nécessaires au fonctionnement du service, et — uniquement si vous y consentez — des cookies de mesure d’audience.',
          '— Session (tickra_session) : authentification, durée 30 jours, strictement nécessaire.',
          '— Préférence de thème (tickra_theme) : clair / sombre / auto, durée 1 an, strictement nécessaire.',
          '— Préférence de langue (tickra_locale) : fr / en, durée 1 an, strictement nécessaire.',
          '— Consentement cookies (tickra_consent) : mémorise votre choix sur le bandeau, durée 6 mois, strictement nécessaire.',
          '— Mesure d’audience (Plausible, anonyme et sans identifiant individuel) : durée session uniquement, déposé seulement avec votre consentement.',
        ],
      },
      {
        h: '3. Cookies que nous ne déposons pas',
        body: [
          'Tickra ne dépose ni cookie publicitaire, ni cookie de profilage, ni cookie de réseau social, ni cookie de revente de données.',
          'Nous n’utilisons aucun outil de tracking cross-site (Meta Pixel, TikTok Pixel, Google Ads Conversion, etc.).',
        ],
      },
      {
        h: '4. Gérer votre consentement',
        body: [
          'Vous pouvez à tout moment retirer ou modifier votre consentement via le bandeau cookies, accessible en bas de chaque page.',
          'Vous pouvez aussi paramétrer votre navigateur pour refuser tous les cookies. Note : refuser les cookies strictement nécessaires empêchera le bon fonctionnement de Tickra (impossibilité de rester connecté, perte des préférences à chaque visite).',
          'Liens utiles selon votre navigateur : Chrome (support.google.com/chrome), Firefox (support.mozilla.org), Safari (support.apple.com), Edge (support.microsoft.com).',
        ],
      },
      {
        h: '5. Durée de conservation',
        body: [
          'Les cookies strictement nécessaires sont conservés pour la durée indiquée ci-dessus.',
          'Les cookies d’analytics sont supprimés à la fin de chaque session.',
          'Aucun cookie n’est conservé plus de 13 mois conformément aux recommandations de la CNIL.',
        ],
      },
      {
        h: '6. Vos droits',
        body: [
          'Vous disposez d’un droit d’accès, de rectification, d’opposition et de suppression sur les données collectées via cookies. Contact : privacy@tickra.com.',
          'En cas de manquement, vous pouvez introduire une réclamation auprès de la CNIL — cnil.fr.',
        ],
      },
    ],
  },
  en: {
    title: 'Cookie policy',
    updated: 'Last updated: June 2026',
    sections: [
      {
        h: '1. What is a cookie?',
        body: [
          'A cookie is a small text file stored on your device (computer, tablet, mobile) when you visit a website. It lets the site remember your actions and preferences (language, theme, session) for a set duration.',
        ],
      },
      {
        h: '2. Cookies we set',
        body: [
          'Tickra only sets cookies strictly necessary to operate the service, and — only with your consent — anonymous audience measurement cookies.',
          '— Session (tickra_session): authentication, 30-day duration, strictly necessary.',
          '— Theme preference (tickra_theme): light / dark / auto, 1-year duration, strictly necessary.',
          '— Language preference (tickra_locale): fr / en, 1-year duration, strictly necessary.',
          '— Cookie consent (tickra_consent): remembers your banner choice, 6-month duration, strictly necessary.',
          '— Audience measurement (Plausible, anonymous, no individual identifier): session only, set only with your consent.',
        ],
      },
      {
        h: '3. Cookies we do NOT set',
        body: [
          'Tickra sets no advertising cookies, no profiling cookies, no social-network cookies, and no data-resale cookies.',
          'We use no cross-site tracking tools (Meta Pixel, TikTok Pixel, Google Ads Conversion, etc.).',
        ],
      },
      {
        h: '4. Managing consent',
        body: [
          'You can withdraw or change consent at any time via the cookie banner, accessible at the bottom of every page.',
          'You can also configure your browser to refuse all cookies. Note: refusing strictly-necessary cookies will break Tickra (no persistent login, preferences lost every visit).',
          'Browser help: Chrome (support.google.com/chrome), Firefox (support.mozilla.org), Safari (support.apple.com), Edge (support.microsoft.com).',
        ],
      },
      {
        h: '5. Retention',
        body: [
          'Strictly-necessary cookies are kept for the durations listed above.',
          'Analytics cookies are deleted at end of session.',
          'No cookie is retained beyond 13 months, in line with CNIL recommendations.',
        ],
      },
      {
        h: '6. Your rights',
        body: [
          'You have rights to access, rectification, objection and deletion on data collected via cookies. Contact: privacy@tickra.com.',
          'Complaints can be filed with the French CNIL — cnil.fr.',
        ],
      },
    ],
  },
} as const;

export default async function CookiesPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale: Locale = params.locale;
  const dict = await getDictionary(locale);
  const t = COPY[locale];

  return (
    <>
      <Navbar dict={dict} locale={locale} />
      <main id="main">
        <PageHero title={t.title} meta={t.updated} eyebrow="Legal" />
        <section>
          <Container as="div" className="py-20 md:py-28">
            <div className="mx-auto max-w-3xl">
              <Prose>
                {t.sections.map((s) => (
                  <section key={s.h}>
                    <h2>{s.h}</h2>
                    {s.body.map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </section>
                ))}
              </Prose>
            </div>
          </Container>
        </section>
      </main>
      <Footer dict={dict} locale={locale} />
    </>
  );
}
