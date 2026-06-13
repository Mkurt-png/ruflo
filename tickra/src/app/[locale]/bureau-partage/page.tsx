import { notFound } from 'next/navigation';
import Link from 'next/link';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { pageMeta } from '@/lib/seo/page-meta';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { EditorialFrame } from '@/components/editorial/EditorialFrame';

// /[locale]/bureau-partage — Le Bureau partagé. Stub honnête : la
// fonction de publication d'une journée de journal en lecture seule
// existe ici comme protocole, sans le service de hosting public.
// La candor note dit pourquoi, et où l'on en est.

export const revalidate = 86400;
export async function generateMetadata({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) return {};
  return pageMeta({
    slug: 'bureau-partage',
    locale: params.locale,
    title: params.locale === 'fr' ? 'Le Bureau partagé' : 'The Shared Desk',
    description:
      params.locale === 'fr'
        ? 'Publier une journée de votre journal en lecture seule, annotée d’une ligne. Pas de DM, pas de likes — une page typographique.'
        : 'Publish a single journal day read-only, annotated in one line. No DMs, no likes — a typographic page.',
    noindex: true,
  });
}

const COPY = {
  fr: {
    eyebrow: 'Le Bureau partagé — protocole',
    head1: 'Une journée.',
    head2: 'Une URL.',
    head3: 'Pas de likes.',
    intro:
      'Le Bureau partagé permet à un lecteur de publier une seule journée de son journal — entrées, notes, P&L — en lecture seule, à une URL stable. Reposter exige une ligne d’annotation. Personne ne commente, personne ne suit. Une page typographique, comme un zine.',
    protocol: 'Le protocole',
    bullets: [
      'Vous choisissez une journée passée dans le journal.',
      'Vous écrivez une ligne d’annotation — pourquoi cette journée.',
      'La page reçoit une URL stable, sans nom, sans date d’expiration.',
      'Aucun bouton « j’aime », aucun fil de commentaires, aucune métrique de visite affichée.',
      'Vous pouvez retirer la page à tout moment ; les caches s’effaceront d’eux-mêmes.',
    ],
    candor:
      'Note d’honnêteté : la publication exige un service serveur qui n’existe pas encore. Le protocole est figé ; la mise en ligne attend la migration. Cette mention restera ici jusque-là.',
    cta: 'Tenir votre journal en attendant',
  },
  en: {
    eyebrow: 'The Shared Desk — protocol',
    head1: 'One day.',
    head2: 'One URL.',
    head3: 'No likes.',
    intro:
      'The Shared Desk lets a reader publish a single day of their journal — entries, notes, P&L — read-only, at a stable URL. Reposting requires a one-line annotation. No one comments, no one follows. A typographic page, like a zine.',
    protocol: 'The protocol',
    bullets: [
      'You pick a past day in the journal.',
      'You write one annotation line — why this day.',
      'The page gets a stable URL, no name, no expiry.',
      'No like button, no thread of comments, no visit counter on display.',
      'You can withdraw the page at any time; caches will clear themselves.',
    ],
    candor:
      'Honesty note: publishing requires a server service that does not exist yet. The protocol is settled; going live waits on the migration. This note will stay here until then.',
    cta: 'Keep your journal while you wait',
  },
} as const;

export default async function BureauPartagePage({ params }: { params: { locale: string } }) {
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
            {t.protocol}
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
              href={`/${locale}/journal`}
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
