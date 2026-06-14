import { notFound } from 'next/navigation';
import Link from 'next/link';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { pageMeta } from '@/lib/seo/page-meta';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { EditorialFrame } from '@/components/editorial/EditorialFrame';
import { RoomBreadcrumb } from '@/components/seo/RoomBreadcrumb';

// /[locale]/institutionnel — Le tier institutionnel. Stub honnête.
// Brochure d'un futur abonnement pour prop-firms / desks.

export const revalidate = 86400;
export async function generateMetadata({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) return {};
  return pageMeta({
    slug: 'institutionnel',
    locale: params.locale,
    title: params.locale === 'fr' ? 'L’Abonnement institutionnel' : 'The Institutional Subscription',
    description:
      params.locale === 'fr'
        ? 'Tickra pour les desks et prop-firms : Greffier collectif, Mur du silence à l’échelle de l’équipe, audit hebdomadaire des registres.'
        : 'Tickra for desks and prop firms: collective Registrar, team-wide Silence Wall, weekly register audit.',
    ogEyebrow: params.locale === 'fr' ? 'Tickra · Institutionnel' : 'Tickra · Institutional',
  });
}

const COPY = {
  fr: {
    eyebrow: 'L’Institutionnel — pour les desks et prop-firms',
    head1: 'Une équipe.',
    head2: 'Un Greffier.',
    head3: 'Un audit.',
    intro:
      'Quand Tickra entre dans une salle de marché ou une prop-firm, il ne perd pas son éditorial — il l’adapte. Le Greffier devient collectif : il lit le carnet de toute l’équipe et rend des observations hebdomadaires. Le Mur du silence s’applique aux drawdowns d’équipe. La Cote devient une note de salle, signée par l’éditeur.',
    bullets: [
      'Greffier collectif : observations sur le carnet agrégé de l’équipe.',
      'Mur du silence à l’échelle : déclenché par drawdown de salle, pas individuel.',
      'Cote de salle : moyenne pondérée, signée par l’éditeur, livrée chaque vendredi.',
      'Audit trimestriel : un essai éditorial de l’éditeur sur ce que le registre montre.',
      'Tarification au siège, dégressive ; pas d’engagement annuel.',
    ],
    candor:
      'Note d’honnêteté : ce tier n’est pas encore disponible. Si vous représentez une équipe et que la conversation vous intéresse, écrivez-nous — nous priorisons en fonction des demandes reçues. Aucun engagement, aucune liste d’attente publique.',
    cta: 'Écrire à l’éditeur',
  },
  en: {
    eyebrow: 'The Institutional — for desks and prop firms',
    head1: 'One team.',
    head2: 'One Registrar.',
    head3: 'One audit.',
    intro:
      'When Tickra enters a trading desk or a prop firm, it does not lose its editorial — it adapts it. The Registrar becomes collective: it reads the whole team’s ledger and returns weekly observations. The Wall of Silence applies to team drawdowns. The Score becomes a room note, signed by the editor.',
    bullets: [
      'Collective Registrar: observations on the team’s aggregated ledger.',
      'Wall of Silence at scale: triggered by desk drawdown, not individual.',
      'Room Score: weighted average, signed by the editor, delivered every Friday.',
      'Quarterly audit: an editor’s essay on what the register shows.',
      'Per-seat pricing, with volume discounts; no annual lock-in.',
    ],
    candor:
      'Honesty note: this tier is not yet available. If you represent a team and want to talk, write to us — we prioritize based on incoming requests. No commitment, no public waiting list.',
    cta: 'Write to the editor',
  },
} as const;

export default async function InstitutionnelPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale: Locale = params.locale;
  const dict = await getDictionary(locale);
  const t = COPY[locale];

  return (
    <>
      <RoomBreadcrumb
        locale={locale}
        slug="institutionnel"
        title={{ fr: 'L’Institutionnel', en: 'The Institutional' }}
      />
      <EditorialFrame
        dict={dict}
        locale={locale}
        eyebrow={t.eyebrow}
        status={locale === 'fr' ? 'Sur conversation' : 'On conversation'}
        head={[t.head1, t.head2, t.head3]}
        intro={t.intro}
      >

        <section className="mx-auto max-w-[920px] px-6 md:px-16 pb-32">
          <ol className="mt-6 space-y-5 border-t border-black/15 pt-10">
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
            <p className="font-mono text-[10.5px] leading-relaxed text-black/65 max-w-[480px]">
              {t.candor}
            </p>
            <Link
              href={`/${locale}/about`}
              className="font-mono text-[10px] uppercase tracking-[0.28em] text-black/55 hover:text-black/90"
            >
              {t.cta} →
            </Link>
          </div>
        </section>
      </EditorialFrame>
    </>
  );
}
