import { notFound } from 'next/navigation';
import Link from 'next/link';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { pageMeta } from '@/lib/seo/page-meta';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { EditorialFrame } from '@/components/editorial/EditorialFrame';

// /[locale]/mecenat — Le Mécénat. Stub honnête : offrir un mois Pro
// anonyme à un lecteur, distribué par l'éditeur. Activation Stripe
// en attente.

export const revalidate = 86400;
export async function generateMetadata({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) return {};
  return pageMeta({
    slug: 'mecenat',
    locale: params.locale,
    title: params.locale === 'fr' ? 'Le Mécénat' : 'The Patronage',
    description:
      params.locale === 'fr'
        ? 'Offrir un mois Pro à un lecteur inconnu. Anonyme, distribué par l’éditeur, sans remerciement, sans contrepartie.'
        : 'Offer a Pro month to an unknown reader. Anonymous, distributed by the editor, no thanks, no quid pro quo.',
    noindex: true,
  });
}

const COPY = {
  fr: {
    eyebrow: 'Le Mécénat — un mois pour un autre',
    head1: 'Un mois.',
    head2: 'Pour un inconnu.',
    head3: 'Sans contrepartie.',
    intro:
      'Le Mécénat permet à un lecteur de payer un mois Pro pour quelqu’un d’autre — un trader qu’il ne connaît pas, choisi par l’éditeur. Anonyme dans les deux sens : ni le donateur, ni le bénéficiaire ne se rencontrent. Pas de message personnalisé, pas de carte de remerciement, pas de mécanique de fidélité. Juste un mois offert, dans le silence.',
    rules: 'Les règles',
    bullets: [
      'Un don = un mois Pro pour une personne. Pas de paniers, pas de réductions.',
      'L’éditeur distribue, en priorité à des lecteurs qui ont ouvert au moins une leçon et qui n’ont pas les moyens d’un abonnement.',
      'Anonyme dans les deux sens. Le donateur ne sait pas qui reçoit ; le bénéficiaire ne sait pas qui a payé.',
      'Aucune publicité, aucun badge donateur, aucune visibilité. Le silence est la contrepartie.',
      'Si la demande dépasse l’offre, l’éditeur tient une file d’attente ; aucune préférence pour les premiers arrivés.',
    ],
    candor:
      'Note d’honnêteté : le don nécessite l’activation Stripe et la mécanique d’attribution serveur. Tickra prépare la sienne. Cette page reste pour que l’intention soit publique avant le bouton.',
    cta: 'Voir les étages',
  },
  en: {
    eyebrow: 'The Patronage — one month for another',
    head1: 'One month.',
    head2: 'For a stranger.',
    head3: 'No reward.',
    intro:
      'The Patronage lets a reader pay one Pro month for someone else — a trader they do not know, chosen by the editor. Anonymous both ways: neither the giver nor the recipient meets. No personalized message, no thank-you card, no loyalty mechanic. Just one month offered, in silence.',
    rules: 'The rules',
    bullets: [
      'One gift = one Pro month for one person. No baskets, no discounts.',
      'The editor distributes, with priority to readers who have opened at least one lesson and cannot afford a subscription.',
      'Anonymous both ways. The giver does not know who receives; the recipient does not know who paid.',
      'No publicity, no donor badge, no visibility. Silence is the reward.',
      'If demand exceeds supply, the editor keeps a queue; no preference for first arrivals.',
    ],
    candor:
      'Honesty note: the gift requires Stripe activation and server-side allocation. Tickra is preparing both. This page stays so the intent is public before the button.',
    cta: 'See the floors',
  },
} as const;

export default async function MecenatPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale: Locale = params.locale;
  const dict = await getDictionary(locale);
  const t = COPY[locale];

  return (
    <>
      <EditorialFrame
        dict={dict}
        locale={locale}
        eyebrow={t.eyebrow}
        status={locale === 'fr' ? 'En préparation' : 'In preparation'}
        head={[t.head1, t.head2, t.head3]}
        intro={t.intro}
      >

        <section className="mx-auto max-w-[920px] px-6 md:px-16 pb-32">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-black/65 border-t border-black/15 pt-10">
            {t.rules}
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
            <p className="font-mono text-[10.5px] leading-relaxed text-black/65 max-w-[480px]">
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
      </EditorialFrame>
    </>
  );
}
