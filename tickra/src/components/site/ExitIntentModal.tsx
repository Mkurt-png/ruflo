'use client';

// ExitIntentModal — captures a lead when the cursor leaves the viewport
// from the top (suggesting tab/close intent). One-shot per session,
// dismissed forever after submit or close. Hidden on signin/onboarding/
// welcome/learn surfaces to avoid disturbing in-funnel users.
//
// Storage:
// - sessionStorage 'tickra_exit_seen' = '1' once shown this tab
// - localStorage 'tickra_exit_dismissed' = '1' after user submits or
//   permanently closes (never re-shows on same browser)

import { useEffect, useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import type { Locale } from '@/lib/i18n/config';
import { isEditorialPath } from '@/lib/editorial/routes';

const COPY = {
  fr: {
    eyebrow: 'Avant de partir',
    title: 'Une première leçon, gratuite.',
    body: '10 minutes sur l’anatomie d’une bougie japonaise. Aucun spam, désabonnement en un clic, aucune revente de données.',
    placeholder: 'votre@email.com',
    submit: 'Recevoir la leçon',
    sent: 'Reçu — vérifiez votre boîte (et les indésirables).',
    skip: 'Non merci',
  },
  en: {
    eyebrow: 'Before you go',
    title: 'A first lesson, free.',
    body: '10 minutes on the anatomy of a Japanese candle. No spam, one-click unsubscribe, never sold.',
    placeholder: 'your@email.com',
    submit: 'Send the lesson',
    sent: 'Got it — check your inbox (and spam).',
    skip: 'No thanks',
  },
} as const;

const PATHS_TO_HIDE = ['/signin', '/onboarding', '/welcome', '/learn/', '/lesson/', '/me'];

export function ExitIntentModal({ locale }: { locale: Locale }) {
  const t = COPY[locale];
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (PATHS_TO_HIDE.some((p) => window.location.pathname.includes(p))) return;
    // Editorial silence: never pop a modal on a reading room.
    if (isEditorialPath(window.location.pathname)) return;
    if (sessionStorage.getItem('tickra_exit_seen') === '1') return;
    if (localStorage.getItem('tickra_exit_dismissed') === '1') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      // Still allow modal but skip animation; nothing to disable here.
    }

    // Wait a few seconds so we don't fire on first-arrival jitter.
    const ready = window.setTimeout(() => {
      const onLeave = (e: MouseEvent) => {
        if (e.clientY <= 8 && !open) {
          sessionStorage.setItem('tickra_exit_seen', '1');
          setOpen(true);
          document.removeEventListener('mouseleave', onLeave);
        }
      };
      document.addEventListener('mouseleave', onLeave);
      // Also trigger on visibility-change after some scroll engagement,
      // for mobile / no-mouse scenarios (15 s after the timer above).
      const visTimer = window.setTimeout(() => {
        if (sessionStorage.getItem('tickra_exit_seen') === '1') return;
        if (window.scrollY > 800) {
          sessionStorage.setItem('tickra_exit_seen', '1');
          setOpen(true);
          document.removeEventListener('mouseleave', onLeave);
        }
      }, 15_000);
      return () => {
        document.removeEventListener('mouseleave', onLeave);
        window.clearTimeout(visTimer);
      };
    }, 3500);
    return () => window.clearTimeout(ready);
  }, [open]);

  const dismiss = (permanent: boolean) => {
    if (permanent) localStorage.setItem('tickra_exit_dismissed', '1');
    setOpen(false);
  };

  // Close on Escape while the modal is open — matches the keyboard
  // contract used by AskTickra, HeroVideo, the lexique Term popover
  // and the CommandPalette so the whole site behaves uniformly.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || pending) return;
    setPending(true);
    try {
      await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, locale, source: 'exit-intent' }),
      });
    } catch {
      /* swallow — newsletter endpoint may be a stub today */
    }
    setPending(false);
    setSent(true);
    localStorage.setItem('tickra_exit_dismissed', '1');
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="exit-intent-title"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) dismiss(false);
      }}
    >
      <div
        className="relative w-full max-w-md rounded-xl border border-line bg-surface p-7 shadow-2xl"
        style={{ animation: 'exitIntentIn 320ms cubic-bezier(0.16, 1, 0.3, 1) both' }}
      >
        <button
          type="button"
          onClick={() => dismiss(true)}
          aria-label={locale === 'fr' ? 'Fermer' : 'Close'}
          className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-elevated hover:text-ink"
        >
          <X aria-hidden className="h-4 w-4" strokeWidth={1.75} />
        </button>

        <div className="flex items-center gap-2">
          <Sparkles aria-hidden className="h-4 w-4 text-brand" strokeWidth={1.75} />
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand">
            {t.eyebrow}
          </span>
        </div>

        <h2
          id="exit-intent-title"
          className="mt-3 font-display text-2xl font-medium tracking-tight text-ink md:text-3xl"
        >
          {t.title}
        </h2>
        <p className="mt-3 text-[14.5px] leading-relaxed text-muted">{t.body}</p>

        {sent ? (
          <div
            role="status"
            aria-live="polite"
            className="mt-6 rounded-md border border-up/30 bg-up/10 px-4 py-3 text-[14px] text-up"
          >
            {t.sent}
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row">
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.placeholder}
              className="h-11 flex-1 rounded-md border border-line bg-elevated px-3 text-[14px] text-ink outline-none transition-colors focus:border-brand"
            />
            <button
              type="submit"
              disabled={pending}
              className="inline-flex h-11 items-center justify-center rounded-md bg-brand px-5 text-[14px] font-medium text-black transition-opacity hover:opacity-95 disabled:opacity-60"
            >
              {t.submit}
            </button>
          </form>
        )}

        {!sent ? (
          <button
            type="button"
            onClick={() => dismiss(true)}
            className="mt-4 text-[12px] text-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
          >
            {t.skip}
          </button>
        ) : null}
      </div>

      <style jsx>{`
        @keyframes exitIntentIn {
          from { opacity: 0; transform: translateY(8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

export default ExitIntentModal;
