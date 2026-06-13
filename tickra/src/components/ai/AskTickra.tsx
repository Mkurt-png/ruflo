'use client';

// TICKRA-PHASE-2.1: floating AskTickra chat button + slide-in panel.
// Bottom-right on desktop, full-screen sheet on mobile. Lesson context is
// auto-detected from the current URL when relevant.

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ArrowUp, Loader2, MessageSquareText, Sparkles, X } from 'lucide-react';
import { useUser } from '@/lib/auth/useUser';
import { TRACKS } from '@/lib/curriculum/data';
import { cn } from '@/lib/cn';
import { isEditorialPath } from '@/lib/editorial/routes';

type Locale = 'fr' | 'en';

type Message = { role: 'user' | 'assistant'; content: string };

const copy = {
  fr: {
    open: 'Posez une question',
    title: 'AskTickra',
    subtitle: 'Posez une question sur le trading ou une leçon. Réponses pédagogiques uniquement, jamais de signaux.',
    placeholder: 'Ex : explique-moi un harami',
    send: 'Envoyer',
    close: 'Fermer',
    poweredBy: 'IA pédagogique · Pas de conseil en investissement',
    quotaExceeded: 'Limite quotidienne atteinte. Passez Pro pour 200 questions/jour.',
    notConfigured: "L'assistant n'est pas encore activé sur cette instance.",
    notAuth: 'Connectez-vous pour utiliser AskTickra.',
    genericError: 'Erreur de communication avec l’IA. Réessayez.',
    examples: ['Qu’est-ce qu’un pip ?', 'Comment fonctionne le R:R ?', 'Pourquoi mon stop est-il chassé ?'],
  },
  en: {
    open: 'Ask a question',
    title: 'AskTickra',
    subtitle: 'Ask any trading or lesson question. Educational answers only, never signals.',
    placeholder: 'e.g. explain a harami',
    send: 'Send',
    close: 'Close',
    poweredBy: 'Educational AI · Not investment advice',
    quotaExceeded: 'Daily limit reached. Upgrade to Pro for 200 questions/day.',
    notConfigured: 'AI assistant not yet enabled on this instance.',
    notAuth: 'Sign in to use AskTickra.',
    genericError: 'Error talking to the AI. Try again.',
    examples: ['What is a pip?', 'How does R:R work?', 'Why is my stop hunted?'],
  },
};

function detectLessonContext(pathname: string): { trackTitle?: string; lessonTitle?: string } {
  // /<locale>/learn/<track>/<lesson>
  const segs = pathname.split('/').filter(Boolean);
  if (segs[1] !== 'learn' || segs.length < 4) return {};
  const trackSlug = segs[2];
  const lessonSlug = segs[3];
  const track = TRACKS.find((t) => t.slug === trackSlug);
  if (!track) return {};
  const lesson = track.lessons.find((l) => l.slug === lessonSlug);
  if (!lesson) return {};
  // Both locales just to be safe — server will use the locale param.
  return { trackTitle: track.title.fr, lessonTitle: lesson.title.fr };
}

export function AskTickra({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const { user, ready } = useUser();
  const pathname = usePathname() ?? '/';
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const context = useMemo(() => detectLessonContext(pathname), [pathname]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, pending]);

  // TICKRA-FIX(UX): close on Escape while the panel is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // Hide on signin/onboarding/welcome to avoid covering critical CTAs.
  // Also stay silent on the editorial cluster: the Maison is a reading
  // surface, not a Q&A surface — a floating chat bubble there reads
  // like the popups /silence bans.
  const hidden =
    pathname.includes('/signin') ||
    pathname.includes('/onboarding') ||
    pathname.includes('/welcome') ||
    isEditorialPath(pathname);
  if (hidden) return null;
  if (!ready) return null;

  const send = async (text: string) => {
    if (!text.trim() || pending) return;
    setError(null);
    const next = [...messages, { role: 'user' as const, content: text }];
    setMessages([...next, { role: 'assistant' as const, content: '' }]);
    setInput('');
    setPending(true);
    try {
      const r = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: next, context: { ...context, locale } }),
      });
      if (r.status === 401) {
        setError(t.notAuth);
        setMessages(next);
        return;
      }
      if (r.status === 429) {
        setError(t.quotaExceeded);
        setMessages(next);
        return;
      }
      if (r.status === 501) {
        setError(t.notConfigured);
        setMessages(next);
        return;
      }
      if (!r.ok || !r.body) {
        setError(t.genericError);
        setMessages(next);
        return;
      }
      const reader = r.body.getReader();
      const dec = new TextDecoder();
      let acc = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setMessages([...next, { role: 'assistant', content: acc }]);
      }
    } catch {
      setError(t.genericError);
      setMessages(next);
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      {/* Floating launcher button */}
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t.open}
          className="fixed bottom-5 right-5 z-40 inline-flex h-12 items-center gap-2 rounded-full bg-ink px-5 text-[14px] font-medium text-canvas shadow-[0_18px_40px_-12px_rgba(124,92,217,0.55)] transition-all hover:-translate-y-0.5 hover:brightness-110 md:bottom-6 md:right-6"
        >
          <Sparkles className="h-4 w-4 text-accent" strokeWidth={2} />
          {t.open}
        </button>
      ) : null}

      {/* Panel */}
      {open ? (
        // TICKRA-FIX(UX): backdrop click closes; Escape closes via effect below.
        <div
          className="fixed inset-0 z-50 flex items-end justify-end bg-ink/40 backdrop-blur-sm md:items-end md:p-6"
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <div
            className="flex h-full w-full flex-col rounded-t-sm border border-line bg-surface text-ink shadow-2xl md:h-[640px] md:max-h-[80vh] md:w-[440px] md:rounded-sm"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={t.title}
          >
            <header className="flex items-center justify-between border-b border-line px-5 py-4">
              <div>
                <div className="inline-flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted">
                  <Sparkles className="h-3 w-3 text-brand" strokeWidth={2} />
                  {t.title}
                </div>
                <p className="mt-1 text-[12px] leading-relaxed text-muted">{t.subtitle}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t.close}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-ink hover:text-ink"
              >
                <X className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </header>

            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.length === 0 && !error ? (
                <div className="space-y-2">
                  {t.examples.map((ex) => (
                    <button
                      key={ex}
                      type="button"
                      onClick={() => send(ex)}
                      className="block w-full rounded-sm border border-line bg-canvas px-3 py-2 text-left text-[13.5px] text-ink transition-colors hover:border-ink"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              ) : null}

              {messages.map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    'rounded-sm border p-3 text-[13.5px] leading-relaxed',
                    m.role === 'user'
                      ? 'ml-8 border-ink bg-ink text-canvas'
                      : 'mr-8 border-line bg-canvas text-ink',
                  )}
                >
                  {m.content || (pending && i === messages.length - 1 ? (
                    <Loader2 aria-hidden className="h-4 w-4 animate-spin text-muted" strokeWidth={1.75} />
                  ) : null)}
                </div>
              ))}

              {error ? (
                <p className="rounded-sm border border-down/40 bg-down/10 p-3 text-[12.5px] text-ink">
                  {error}
                </p>
              ) : null}
            </div>

            <footer className="border-t border-line p-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!user) {
                    setError(t.notAuth);
                    return;
                  }
                  send(input);
                }}
                className="flex items-end gap-2"
              >
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  rows={1}
                  placeholder={t.placeholder}
                  className="min-h-[44px] flex-1 resize-none rounded-sm border border-line bg-canvas px-3 py-2 text-[14px] text-ink placeholder:text-subtle focus-visible:border-ink focus-visible:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (!user) {
                        setError(t.notAuth);
                        return;
                      }
                      send(input);
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={pending || !input.trim()}
                  className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-ink text-canvas hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label={t.send}
                >
                  {pending ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} /> : <ArrowUp className="h-4 w-4" strokeWidth={2} />}
                </button>
              </form>
              <p className="mt-2 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.18em] text-subtle">
                <MessageSquareText className="h-3 w-3" strokeWidth={1.75} />
                {t.poweredBy}
              </p>
            </footer>
          </div>
        </div>
      ) : null}
    </>
  );
}
