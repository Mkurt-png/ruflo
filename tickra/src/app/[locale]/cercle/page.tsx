import { notFound } from 'next/navigation';
import Link from 'next/link';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { EditorialFrame } from '@/components/editorial/EditorialFrame';
import { ReadNext } from '@/components/editorial/ReadNext';
import { getSession } from '@/lib/auth/session';
import { pairFor } from '@/lib/tickra/cercle';
import { editorialMeta } from '@/lib/seo/editorial-meta';
import { EditorialJsonLd } from '@/components/seo/EditorialJsonLd';

// /[locale]/cercle — Le Cercle de relecture. Each ISO week, the
// reader is paired with another voice. Until the server matching
// service is built, the partner is drawn deterministically from a
// seed list of hand-written letters. The page says so plainly.

export const dynamic = 'force-dynamic';
export const metadata = editorialMeta({
  slug: 'cercle',
  title: 'Le Cercle de relecture',
  description:
    'Chaque dimanche, un autre lecteur, lu en silence. Deux Lettres échangées, sans messagerie, sans visage.',
});

const COPY = {
  fr: {
    eyebrow: 'Le Cercle de relecture',
    status: 'Anonyme · sans réponse',
    head: ['Un lecteur.', 'Une Lettre.', 'Aucun visage.'] as [string, string, string],
    intro:
      'Le Cercle apparie chaque dimanche deux lecteurs aux Cotes voisines. Ils s’échangent leur Lettre de la semaine — sans messagerie, sans réponse, sans photo. Lire la semaine d’un autre trader est l’acte social.',
    meLabel: 'Vous, cette semaine',
    partnerLabel: 'La voix qu’on vous apparie',
    yourLetterCta: 'Écrire votre Lettre',
    archive: 'Voir aussi la Lettre du dimanche',
    candor:
      'Note d’honnêteté : tant que le service de pairing serveur n’existe pas, la voix qui vous est apparue est tirée d’un fond de Lettres seedées, écrites pour cette page. Le pairing tournera dès que d’autres lecteurs auront publié leur Lettre. Cette mention restera ici jusque-là.',
    signedOut: 'Connectez-vous pour entrer dans le Cercle.',
    signIn: 'Se connecter',
  },
  en: {
    eyebrow: 'The Reading Circle',
    status: 'Anonymous · no reply',
    head: ['One reader.', 'One Letter.', 'No face.'] as [string, string, string],
    intro:
      'Each Sunday, the Circle pairs two readers with neighboring Scores. They exchange their Letter of the week — no messaging, no reply, no photo. Reading another trader’s week is the social act.',
    meLabel: 'You, this week',
    partnerLabel: 'The voice you are paired with',
    yourLetterCta: 'Write your Letter',
    archive: 'Also see the Sunday Letter',
    candor:
      'Honesty note: until the server pairing service exists, the voice you are matched with is drawn from a seed of letters written for this page. Real pairing will rotate as soon as enough readers have published their Letter. This note will stay until then.',
    signedOut: 'Sign in to enter the Circle.',
    signIn: 'Sign in',
  },
} as const;

export default async function CerclePage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale: Locale = params.locale;
  const dict = await getDictionary(locale);
  const t = COPY[locale];

  const session = getSession();
  const pair = pairFor(session?.email ?? null);
  const partnerLines = pair.letter[locale];

  return (
    <>
      <EditorialJsonLd
        slug="cercle"
        title={locale === 'fr' ? 'Le Cercle de relecture' : 'The Reading Circle'}
        description={locale === 'fr'
          ? 'Chaque semaine, une lettre d’un autre lecteur, en silence.'
          : 'Each week, a letter from another reader, in silence.'}
        locale={locale}
      />
      <EditorialFrame
      dict={dict}
      locale={locale}
      eyebrow={`${t.eyebrow} · ${pair.week}`}
      status={t.status}
      head={t.head}
      intro={t.intro}
    >
      <section className="mx-auto max-w-[1000px] px-6 md:px-16 pb-16">
        {!session ? (
          <div className="border-t border-black/15 pt-12 max-w-[640px]">
            <p
              className="font-display italic text-[#0E0E0E]/75"
              style={{ fontSize: 'clamp(22px, 2.4vw, 28px)', lineHeight: 1.25 }}
            >
              {t.signedOut}
            </p>
            <Link
              href={`/${locale}/signin`}
              className="mt-8 inline-flex h-10 items-center rounded-full border border-black/70 px-5 font-mono text-[11px] uppercase tracking-[0.22em] text-[#0E0E0E] hover:bg-[#0E0E0E] hover:text-[#F4F1EA] transition-colors"
            >
              {t.signIn} →
            </Link>
          </div>
        ) : (
          <div className="grid gap-x-16 gap-y-16 md:grid-cols-[260px_1fr]">
            <aside className="border-t border-black/15 pt-8">
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-black/65">
                {t.meLabel}
              </p>
              <p
                className="mt-3 font-display italic text-[#0E0E0E]"
                style={{ fontSize: 'clamp(26px, 3vw, 32px)', letterSpacing: '-0.02em' }}
              >
                {pair.me.name}
              </p>
              <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-black/55 mt-1">
                {pair.me.city}
              </p>
              <Link
                href={`/${locale}/lettre`}
                className="mt-8 inline-flex h-10 items-center rounded-full border border-black/70 px-5 font-mono text-[11px] uppercase tracking-[0.22em] text-[#0E0E0E] hover:bg-[#0E0E0E] hover:text-[#F4F1EA] transition-colors"
              >
                {t.yourLetterCta} →
              </Link>
            </aside>

            <article className="border-t border-black/15 pt-8">
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-black/65">
                {t.partnerLabel}
              </p>
              <p
                className="mt-3 font-display italic text-[#0E0E0E]"
                style={{ fontSize: 'clamp(30px, 3.6vw, 40px)', letterSpacing: '-0.02em' }}
              >
                {pair.partner.name}
              </p>
              <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-black/55 mt-1">
                {pair.partner.city}
              </p>

              <ol className="mt-10 space-y-6 max-w-[640px]">
                {partnerLines.map((line, i) => (
                  <li
                    key={i}
                    className="grid grid-cols-[2ch_1fr] gap-x-5 items-baseline"
                  >
                    <span className="font-mono text-[10px] tracking-[0.22em] text-black/35 tabular-nums">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <p
                      className="font-display italic leading-relaxed text-[#0E0E0E]/85"
                      style={{ fontSize: 'clamp(16px, 1.7vw, 20px)' }}
                    >
                      « {line} »
                    </p>
                  </li>
                ))}
              </ol>
            </article>
          </div>
        )}
      </section>

      <section className="mx-auto max-w-[1000px] px-6 md:px-16 pb-32">
        <div className="border-t border-black/15 pt-6 flex flex-wrap items-baseline justify-between gap-4">
          <p className="font-mono text-[10.5px] leading-relaxed text-black/65 max-w-[560px]">
            {t.candor}
          </p>
          <Link
            href={`/${locale}/lettre`}
            className="font-mono text-[10px] uppercase tracking-[0.28em] text-black/55 hover:text-black/90"
          >
            {t.archive} →
          </Link>
        </div>
      </section>

      <ReadNext
        locale={locale}
        rooms={[
          {
            slug: 'lettre',
            title: { fr: 'La Lettre du dimanche', en: 'The Sunday Letter' },
            caption: {
              fr: 'Écrire la vôtre — c’est ce que votre partenaire lit.',
              en: 'Write yours — it is what your partner reads.',
            },
          },
          {
            slug: 'voix',
            title: { fr: 'Les Voix', en: 'The Voices' },
            caption: {
              fr: 'D’autres lectures publiques, sous pseudonyme.',
              en: 'Other public readings, under pseudonym.',
            },
          },
          {
            slug: 'veillee',
            title: { fr: 'La Veillée', en: 'The Vigil' },
            caption: {
              fr: 'La même heure pour tous, le dimanche soir.',
              en: 'The same hour for all, on Sunday evening.',
            },
          },
        ]}
      />
    </EditorialFrame>
    </>
  );
}
