import { notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { Navbar } from '@/components/nav/Navbar';
import { Footer } from '@/components/sections/Footer';
import { ReadNext } from '@/components/editorial/ReadNext';
import { readVeillee, readingLine } from '@/lib/tickra/veillee';

// /[locale]/veillee — La Veillée. Sunday 21:00 UTC, 30 minutes,
// one sentence per minute. The page is rendered server-side at each
// request: the phase and the current line come from the server clock.
// No streaming, no chat, no participant list. The only synchrony is
// the synchrony of reading.

import { editorialMeta } from '@/lib/seo/editorial-meta';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = editorialMeta({
  slug: 'veillee',
  title: 'La Veillée',
  description:
    'Dimanche, 21 h UTC. Une page, une phrase par minute, lue par tout le monde au même moment. Pas de vidéo, pas de chat.',
});

const COPY = {
  fr: {
    eyebrow: 'La Veillée — dimanche 21 h UTC',
    head1: 'Une page.',
    head2: 'Une phrase par minute.',
    head3: 'Tous en même temps.',
    before: 'Prochaine Veillée',
    openingLabel: 'Ouverture',
    closingLabel: 'Clôture',
    inSession: 'En séance',
    afterLabel: 'La séance vient de s’achever.',
    afterBody:
      'Si vous arrivez maintenant, rendez-vous dimanche prochain à la même heure. La Veillée ne se rattrape pas — elle se vit.',
    countdown: (h: number, m: number, d: number) =>
      `${d}j ${h.toString().padStart(2, '0')} h ${m.toString().padStart(2, '0')}`,
    openingPara:
      'On ouvre. Restez. La première phrase de la lecture apparaît dans un instant.',
    closingPara:
      'La séance se referme. Refermez l’onglet quand vous voulez. La page sait l’heure qu’il est.',
    note: 'Page mise à jour à chaque chargement. Pour suivre la lecture, rafraîchissez à la minute.',
    refresh: 'Recharger',
  },
  en: {
    eyebrow: 'The Vigil — Sunday 21:00 UTC',
    head1: 'One page.',
    head2: 'One sentence per minute.',
    head3: 'Everyone at once.',
    before: 'Next Vigil',
    openingLabel: 'Opening',
    closingLabel: 'Closing',
    inSession: 'In session',
    afterLabel: 'The session has just ended.',
    afterBody:
      'If you arrive now, see you next Sunday at the same hour. La Veillée is not caught up — it is lived.',
    countdown: (h: number, m: number, d: number) =>
      `${d}d ${h.toString().padStart(2, '0')} h ${m.toString().padStart(2, '0')}`,
    openingPara:
      'We open. Stay. The first line of the reading appears in a moment.',
    closingPara:
      'The session closes. Close the tab when you like. The page knows the hour.',
    note: 'Page is refreshed on each load. To follow the reading, reload at every minute.',
    refresh: 'Reload',
  },
} as const;

function breakdown(seconds: number): { d: number; h: number; m: number } {
  const d = Math.floor(seconds / 86_400);
  const h = Math.floor((seconds - d * 86_400) / 3600);
  const m = Math.floor((seconds - d * 86_400 - h * 3600) / 60);
  return { d, h, m };
}

export default async function VeilleePage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale: Locale = params.locale;
  const dict = await getDictionary(locale);
  const t = COPY[locale];
  const state = readVeillee();

  const nextSession = new Date(state.nextSession);
  const formattedNext = nextSession.toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  });

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
            <span className="font-mono text-[10px] uppercase tracking-[0.34em] text-black/65 tabular-nums">
              {state.phase === 'reading' && `${t.inSession} · ${state.lineIndex + 1}/${state.totalLines}`}
              {state.phase === 'opening' && t.openingLabel}
              {state.phase === 'closing' && t.closingLabel}
              {state.phase === 'before' && `${t.before} · ${formattedNext} UTC`}
              {state.phase === 'after' && t.afterLabel}
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
        </section>

        <section className="mx-auto max-w-[920px] px-6 md:px-16 pb-32">
          {state.phase === 'before' && (
            <div className="border-t border-black/15 pt-12">
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-black/65">
                {t.before}
              </p>
              <p
                className="mt-4 font-display italic text-[#0E0E0E] tabular-nums"
                style={{ fontSize: 'clamp(56px, 8vw, 104px)', letterSpacing: '-0.035em', lineHeight: 0.95 }}
              >
                {(() => {
                  const b = breakdown(state.secondsToNext);
                  return t.countdown(b.h, b.m, b.d);
                })()}
              </p>
              <p className="mt-6 font-mono text-[10.5px] uppercase tracking-[0.28em] text-black/55">
                {formattedNext} UTC
              </p>
            </div>
          )}

          {state.phase === 'opening' && (
            <div className="border-t border-black/15 pt-12">
              <p
                className="font-display italic text-[#0E0E0E]/85 max-w-[640px]"
                style={{ fontSize: 'clamp(22px, 2.6vw, 30px)', lineHeight: 1.25 }}
              >
                {t.openingPara}
              </p>
            </div>
          )}

          {state.phase === 'reading' && (
            <div className="border-t border-black/15 pt-12" aria-live="polite" aria-atomic="true">
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-black/65 tabular-nums">
                {String(state.lineIndex + 1).padStart(2, '0')} / {String(state.totalLines).padStart(2, '0')}
              </p>
              <p
                className="mt-6 font-display italic text-[#0E0E0E] max-w-[820px]"
                style={{ fontSize: 'clamp(32px, 5vw, 60px)', lineHeight: 1.1, letterSpacing: '-0.025em' }}
              >
                « {readingLine(state.lineIndex)?.[locale] ?? ''} »
              </p>
            </div>
          )}

          {state.phase === 'closing' && (
            <div className="border-t border-black/15 pt-12">
              <p
                className="font-display italic text-[#0E0E0E]/85 max-w-[640px]"
                style={{ fontSize: 'clamp(22px, 2.6vw, 30px)', lineHeight: 1.25 }}
              >
                {t.closingPara}
              </p>
            </div>
          )}

          {state.phase === 'after' && (
            <div className="border-t border-black/15 pt-12">
              <p
                className="font-display italic text-[#0E0E0E]/85 max-w-[640px]"
                style={{ fontSize: 'clamp(22px, 2.6vw, 30px)', lineHeight: 1.25 }}
              >
                {t.afterBody}
              </p>
              <p className="mt-8 font-mono text-[10.5px] uppercase tracking-[0.28em] text-black/55">
                {t.before} · {formattedNext} UTC
              </p>
            </div>
          )}

          <footer className="mt-24 border-t border-black/15 pt-6 flex items-baseline justify-between gap-4">
            <p className="font-mono text-[10.5px] leading-relaxed text-black/65 max-w-[480px]">
              {t.note}
            </p>
            <a
              href={`/${locale}/veillee`}
              aria-label={t.refresh}
              className="font-mono text-[10px] uppercase tracking-[0.28em] text-black/55 hover:text-black/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black/80"
            >
              {t.refresh} →
            </a>
          </footer>
        </section>
        <ReadNext
          locale={locale}
          rooms={[
            {
              slug: 'lettre',
              title: { fr: 'La Lettre du dimanche', en: 'The Sunday Letter' },
              caption: {
                fr: 'Ce que la semaine vous a écrit, en trois colonnes.',
                en: 'What the week wrote to you, in three columns.',
              },
            },
            {
              slug: 'cercle',
              title: { fr: 'Le Cercle de relecture', en: 'The Reading Circle' },
              caption: {
                fr: 'La Lettre d’un autre lecteur, en silence.',
                en: 'Another reader’s Letter, in silence.',
              },
            },
            {
              slug: 'almanach',
              title: { fr: 'L’Almanach', en: 'The Almanac' },
              caption: {
                fr: 'Les Criées que la Veillée n’a pas lues.',
                en: 'The Criées the Vigil did not read.',
              },
            },
          ]}
        />
      </main>
      <Footer dict={dict} locale={locale} />
    </>
  );
}
