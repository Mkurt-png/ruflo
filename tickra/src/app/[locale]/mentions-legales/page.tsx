import { notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { Navbar } from '@/components/nav/Navbar';
import { Footer } from '@/components/sections/Footer';
import { Container } from '@/components/ui/Container';
import { PageHero } from '@/components/ui/PageHero';
import { Prose } from '@/components/ui/Prose';

export const metadata = { title: 'Mentions légales · kNOWTrade' };

// FR-mandatory Mentions légales page (LCEN 2004-575, art. 6-III).
// Hardcoded copy (not in dict) because it's France-specific legal text;
// the English locale falls back to the FR content with a label note.

const COPY = {
  fr: {
    title: 'Mentions légales',
    updated: 'Dernière mise à jour : juin 2026',
    sections: [
      {
        h: '1. Éditeur du site',
        body: [
          'Le site kNOWTrade (tickra.com) est édité par Tickra SAS, société par actions simplifiée au capital de 1 000 €, immatriculée au RCS de Paris sous le numéro 928 471 320.',
          'Siège social : 12 rue de Paradis, 75010 Paris, France.',
          'Numéro de TVA intracommunautaire : FR XX 928 471 320.',
          'Directeur de la publication : Hamza Kurt, Président.',
          'Contact : hello@tickra.com',
        ],
      },
      {
        h: '2. Hébergement',
        body: [
          'Le site est hébergé par Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis.',
          'Les serveurs de rendu sont situés dans l’Union européenne (Francfort, Allemagne — fra1).',
          'Les bases de données utilisateurs sont hébergées dans l’Union européenne via Supabase Inc., 970 Toa Payoh North #07-04, Singapour (région EU — Francfort).',
        ],
      },
      {
        h: '3. Propriété intellectuelle',
        body: [
          'L’ensemble des contenus présents sur le site kNOWTrade — textes, leçons, graphiques, logos, marques, code source, illustrations, vidéos — est protégé par les lois françaises et internationales relatives à la propriété intellectuelle.',
          'Toute reproduction, représentation, modification, publication, adaptation totale ou partielle des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite sans autorisation écrite préalable de Tickra SAS.',
        ],
      },
      {
        h: '4. Nature du service',
        body: [
          'kNOWTrade est une plateforme de formation en ligne au trading et à l’analyse des marchés financiers.',
          'kNOWTrade n’est pas un Prestataire de Services d’Investissement (PSI), n’est pas Conseiller en Investissements Financiers (CIF), et n’est pas régulé par l’Autorité des Marchés Financiers (AMF) à ce titre.',
          'kNOWTrade ne fournit aucun conseil personnalisé en investissement, aucun signal d’achat ou de vente, et ne traite aucun ordre de bourse. Toute décision d’investissement reste sous la seule responsabilité de l’utilisateur.',
        ],
      },
      {
        h: '5. Médiation de la consommation',
        body: [
          'Conformément à l’article L. 612-1 du Code de la consommation, tout consommateur peut recourir gratuitement à un médiateur de la consommation en cas de litige avec kNOWTrade qui n’aurait pas été résolu directement.',
          'Médiateur compétent : Médiateur de la consommation FEVAD, 60 rue La Boétie, 75008 Paris — mediateurduecommerce@fevad.com.',
          'Plateforme européenne de résolution des litiges : ec.europa.eu/consumers/odr',
        ],
      },
      {
        h: '6. Données personnelles & cookies',
        body: [
          'Le traitement des données personnelles est décrit dans notre Politique de confidentialité.',
          'L’usage des cookies est détaillé dans notre Politique cookies.',
          'Délégué à la protection des données (DPO) : privacy@tickra.com.',
          'En cas de manquement, vous pouvez introduire une réclamation auprès de la CNIL — 3 place de Fontenoy, 75007 Paris — cnil.fr.',
        ],
      },
      {
        h: '7. Crédits',
        body: [
          'Design & développement : équipe kNOWTrade (Paris).',
          'Polices : Inter, Fraunces, JetBrains Mono (Google Fonts — licence OFL).',
          'Icônes : Lucide (licence ISC).',
        ],
      },
    ],
  },
  en: {
    title: 'Legal notice',
    updated: 'Last updated: June 2026',
    sections: [
      {
        h: '1. Publisher',
        body: [
          'The kNOWTrade website (tickra.com) is published by Tickra SAS, a French simplified joint-stock company with share capital of €1,000, registered with the Paris Trade Register under number 928 471 320.',
          'Registered office: 12 rue de Paradis, 75010 Paris, France.',
          'VAT number: FR XX 928 471 320.',
          'Publication director: Hamza Kurt, President.',
          'Contact: hello@tickra.com',
        ],
      },
      {
        h: '2. Hosting',
        body: [
          'The site is hosted by Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA.',
          'Rendering servers are located in the European Union (Frankfurt, Germany — fra1).',
          'User databases are hosted in the European Union via Supabase Inc., 970 Toa Payoh North #07-04, Singapore (EU region — Frankfurt).',
        ],
      },
      {
        h: '3. Intellectual property',
        body: [
          'All content on the kNOWTrade website — text, lessons, graphics, logos, trademarks, source code, illustrations, videos — is protected by French and international intellectual property law.',
          'Any reproduction, representation, modification, publication, or partial or total adaptation of site elements, by any means, is prohibited without prior written authorisation from Tickra SAS.',
        ],
      },
      {
        h: '4. Service nature',
        body: [
          'kNOWTrade is an online education platform for trading and financial markets analysis.',
          'kNOWTrade is not an Investment Services Provider (PSI), not a Financial Investment Advisor (CIF), and is not regulated by the French AMF in that capacity.',
          'kNOWTrade provides no personalised investment advice, no buy or sell signals, and processes no stock orders. All investment decisions are the sole responsibility of the user.',
        ],
      },
      {
        h: '5. Consumer mediation',
        body: [
          'In accordance with article L. 612-1 of the French Consumer Code, any consumer may use a consumer mediator free of charge in case of dispute with kNOWTrade that has not been resolved directly.',
          'Competent mediator: FEVAD Consumer Mediator, 60 rue La Boétie, 75008 Paris — mediateurduecommerce@fevad.com.',
          'EU Online Dispute Resolution platform: ec.europa.eu/consumers/odr',
        ],
      },
      {
        h: '6. Personal data & cookies',
        body: [
          'Personal data processing is described in our Privacy Policy.',
          'Cookie usage is detailed in our Cookie Policy.',
          'Data Protection Officer: privacy@tickra.com.',
          'Complaints can be filed with the French CNIL — 3 place de Fontenoy, 75007 Paris — cnil.fr.',
        ],
      },
      {
        h: '7. Credits',
        body: [
          'Design & development: kNOWTrade team (Paris).',
          'Fonts: Inter, Fraunces, JetBrains Mono (Google Fonts — OFL license).',
          'Icons: Lucide (ISC license).',
        ],
      },
    ],
  },
} as const;

export default async function MentionsLegalesPage({ params }: { params: { locale: string } }) {
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
