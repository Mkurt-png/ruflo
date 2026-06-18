import { headers } from 'next/headers';

// Editorial loading — quiet ivory placeholder that matches the
// EditorialFrame shell. No spinners, no skeleton blocks: just the
// folio caption and a faint italic line. The page will fade in over
// it as soon as Next finishes streaming.
//
// Reads the active locale via the x-pathname request header that
// middleware injects, so the streaming placeholder ships in the
// reader's language rather than always-French copy.

const COPY = {
  fr: {
    header: 'Tickra · Composition en cours',
    folio: 'Folio · ——',
    headline: 'On tourne la page…',
    sr: 'Chargement en cours',
  },
  en: {
    header: 'Tickra · Composing the page',
    folio: 'Folio · ——',
    headline: 'Turning the page…',
    sr: 'Loading',
  },
} as const;

function readLocale(): 'fr' | 'en' {
  const pathname = headers().get('x-pathname') ?? '/fr';
  const segment = pathname.split('/')[1];
  return segment === 'en' ? 'en' : 'fr';
}

export default function Loading() {
  const t = COPY[readLocale()];
  return (
    <main className="min-h-[60vh] w-full bg-[#F4F1EA] text-[#0E0E0E]">
      <header className="px-6 md:px-16 pt-10 flex items-start justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.34em] text-black/55">
          {t.header}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.34em] text-black/40 tabular-nums">
          {t.folio}
        </span>
      </header>
      <section className="px-6 md:px-16 pt-24 md:pt-32">
        <p
          className="font-display italic font-light text-black/30 select-none"
          style={{ fontSize: 'clamp(48px, 9vw, 128px)', lineHeight: 0.9, letterSpacing: '-0.03em' }}
          aria-hidden
        >
          {t.headline}
        </p>
      </section>
      <span className="sr-only">{t.sr}</span>
    </main>
  );
}
