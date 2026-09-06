import { notFound } from 'next/navigation';
import { ENTITY } from '@/lib/legal/entity';

// The Supabase project's region is a deployment fact, not something the code
// can read at build time — and stating the wrong one is exactly the mistake
// this page already made (it claimed Frankfurt while vercel.json deploys to
// cdg1/Paris). Set it once here from the Supabase dashboard.
const SUPABASE_REGION = '[À COMPLÉTER : région Supabase]';
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
          `Le site kNOWTrade (tickra.com) est exploité par ${ENTITY.legalName}, entreprise établie au ${ENTITY.province}, ${ENTITY.country}.`,
          `Siège : ${ENTITY.address}, ${ENTITY.province}, ${ENTITY.country}.`,
          `NEQ : ${ENTITY.neq} · Numéro d’entreprise (ARC) : ${ENTITY.businessNumber}.`,
          'Directeur de la publication : Hamza Kurt.',
          'Contact : hello@tickra.com',
        ],
      },
      {
        h: '2. Hébergement',
        body: [
          'Le site est hébergé par Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis.',
          'Les serveurs de rendu sont situés à Paris, France (région cdg1).',
          `Les bases de données utilisateurs sont hébergées par Supabase Inc. (région ${SUPABASE_REGION}).`,
          'Ces serveurs se trouvant hors du Québec, la communication de renseignements personnels hors du Québec est encadrée par notre Politique de confidentialité, conformément à la Loi 25.',
        ],
      },
      {
        h: '3. Propriété intellectuelle',
        body: [
          'L’ensemble des contenus présents sur le site kNOWTrade — textes, leçons, graphiques, logos, marques, code source, illustrations, vidéos — est protégé par la Loi sur le droit d’auteur du Canada et par les conventions internationales applicables.',
          `Toute reproduction, représentation, modification, publication, adaptation totale ou partielle des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite sans autorisation écrite préalable de ${ENTITY.legalName}.`,
        ],
      },
      {
        h: '4. Nature du service',
        body: [
          'kNOWTrade est une plateforme de formation en ligne au trading et à l’analyse des marchés financiers.',
          'kNOWTrade n’est inscrit ni comme courtier ni comme conseiller auprès de l’Autorité des marchés financiers (AMF) du Québec, n’est pas membre de l’Organisme canadien de réglementation des investissements (OCRI), et n’exerce aucune activité assujettie à la Loi sur les valeurs mobilières ou à la Loi sur les instruments dérivés.',
          'kNOWTrade ne fournit aucun conseil personnalisé en investissement, aucun signal d’achat ou de vente, et ne traite aucun ordre de bourse. Toute décision d’investissement reste sous la seule responsabilité de l’utilisateur.',
        ],
      },
      {
        h: '5. Protection du consommateur',
        body: [
          'Les abonnements kNOWTrade constituent des contrats à exécution successive au sens de la Loi sur la protection du consommateur du Québec, résiliables à tout moment depuis votre espace personnel.',
          'En cas de litige non résolu directement avec nous, vous pouvez vous adresser à l’Office de la protection du consommateur du Québec — opc.gouv.qc.ca.',
        ],
      },
      {
        h: '6. Données personnelles & cookies',
        body: [
          'Le traitement des données personnelles est décrit dans notre Politique de confidentialité.',
          'L’usage des cookies est détaillé dans notre Politique cookies.',
          'Personne responsable de la protection des renseignements personnels (Loi 25) : privacy@tickra.com.',
          'En cas de manquement, vous pouvez porter plainte auprès de la Commission d’accès à l’information du Québec — cai.gouv.qc.ca — ou du Commissariat à la protection de la vie privée du Canada — priv.gc.ca.',
        ],
      },
      {
        h: '7. Crédits',
        body: [
          `Design & développement : équipe kNOWTrade (${ENTITY.province}).`,
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
          `The kNOWTrade website (tickra.com) is operated by ${ENTITY.legalName}, a business established in ${ENTITY.province}, ${ENTITY.country}.`,
          `Head office: ${ENTITY.address}, ${ENTITY.province}, ${ENTITY.country}.`,
          `NEQ: ${ENTITY.neq} · Business number (CRA): ${ENTITY.businessNumber}.`,
          'Publication director: Hamza Kurt.',
          'Contact: hello@tickra.com',
        ],
      },
      {
        h: '2. Hosting',
        body: [
          'The site is hosted by Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA.',
          'Rendering servers are located in Paris, France (region cdg1).',
          `User databases are hosted by Supabase Inc. (region ${SUPABASE_REGION}).`,
          'As these servers are outside Québec, the disclosure of personal information outside Québec is governed by our Privacy Policy, in accordance with Law 25.',
        ],
      },
      {
        h: '3. Intellectual property',
        body: [
          'All content on the kNOWTrade website — text, lessons, graphics, logos, trademarks, source code, illustrations, videos — is protected by the Canadian Copyright Act and applicable international conventions.',
          `Any reproduction, representation, modification, publication, or partial or total adaptation of site elements, by any means, is prohibited without prior written authorisation from ${ENTITY.legalName}.`,
        ],
      },
      {
        h: '4. Service nature',
        body: [
          'kNOWTrade is an online education platform for trading and financial markets analysis.',
          'kNOWTrade is registered neither as a dealer nor as an adviser with the Autorité des marchés financiers (AMF) of Québec, is not a member of the Canadian Investment Regulatory Organization (CIRO), and carries on no activity governed by the Securities Act or the Derivatives Act.',
          'kNOWTrade provides no personalised investment advice, no buy or sell signals, and processes no stock orders. All investment decisions are the sole responsibility of the user.',
        ],
      },
      {
        h: '5. Consumer protection',
        body: [
          'kNOWTrade subscriptions are successive-performance contracts under Québec\u2019s Consumer Protection Act, cancellable at any time from your account.',
          'If a dispute cannot be resolved directly with us, you may contact the Office de la protection du consommateur du Québec — opc.gouv.qc.ca.',
        ],
      },
      {
        h: '6. Personal data & cookies',
        body: [
          'Personal data processing is described in our Privacy Policy.',
          'Cookie usage is detailed in our Cookie Policy.',
          'Privacy officer (Law 25): privacy@tickra.com.',
          'Complaints can be filed with the Commission d\u2019accès à l\u2019information du Québec — cai.gouv.qc.ca — or the Office of the Privacy Commissioner of Canada — priv.gc.ca.',
        ],
      },
      {
        h: '7. Credits',
        body: [
          `Design & development: kNOWTrade team (${ENTITY.province}).`,
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
