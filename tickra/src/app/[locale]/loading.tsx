// Editorial loading — quiet ivory placeholder that matches the
// EditorialFrame shell. No spinners, no skeleton blocks: just the
// folio caption and a faint italic line. The page will fade in over
// it as soon as Next finishes streaming.

export default function Loading() {
  return (
    <main className="min-h-[60vh] w-full bg-[#F4F1EA] text-[#0E0E0E]">
      <header className="px-6 md:px-16 pt-10 flex items-start justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.34em] text-black/55">
          Tickra · Composition en cours
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.34em] text-black/40 tabular-nums">
          Folio · ——
        </span>
      </header>
      <section className="px-6 md:px-16 pt-24 md:pt-32">
        <p
          className="font-display italic font-light text-black/30 select-none"
          style={{ fontSize: 'clamp(48px, 9vw, 128px)', lineHeight: 0.9, letterSpacing: '-0.03em' }}
          aria-hidden
        >
          On tourne la page…
        </p>
      </section>
      <span className="sr-only">Chargement en cours</span>
    </main>
  );
}
