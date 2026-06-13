'use client';

// TICKRA-PHASE-6: defer the "Add to home screen" prompt + show a small toast
// when the browser is eligible. Dismissable; remembered for 30 days.

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

type Locale = 'fr' | 'en';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const DISMISS_KEY = 'tickra-install-dismissed';
const DISMISS_DAYS = 30;

const copy = {
  fr: {
    title: 'Installer Tickra sur votre écran d’accueil',
    body: 'Accès rapide, ouverture en plein écran, leçons accessibles hors connexion.',
    install: 'Installer',
    later: 'Plus tard',
  },
  en: {
    title: 'Install Tickra on your home screen',
    body: 'Quick access, full-screen launch, lessons available offline.',
    install: 'Install',
    later: 'Not now',
  },
};

function isDismissed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = window.localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const at = Number(raw);
    if (!Number.isFinite(at)) return false;
    return Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export function InstallPrompt({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isDismissed()) return;
    const handler = (e: Event) => {
      e.preventDefault();
      setEvt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const dismiss = () => {
    try {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  const install = async () => {
    if (!evt) return dismiss();
    await evt.prompt();
    await evt.userChoice;
    dismiss();
  };

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-3 z-50 flex justify-center md:bottom-6">
      <div className="pointer-events-auto flex w-full max-w-md items-start gap-4 border border-black/15 bg-[#F4F1EA] p-5 text-[#0E0E0E] shadow-[0_18px_40px_-18px_rgba(14,14,14,0.35)]">
        <Download aria-hidden className="mt-1 h-4 w-4 flex-shrink-0 text-[#0E0E0E]/75" strokeWidth={1.5} />
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-black/55">
            Tickra · Installation
          </p>
          <p
            className="mt-2 font-display italic text-[#0E0E0E]"
            style={{ fontSize: '20px', lineHeight: 1.15, letterSpacing: '-0.01em' }}
          >
            {t.title}
          </p>
          <p className="mt-2 text-[13.5px] leading-relaxed text-black/70">{t.body}</p>
          <div className="mt-4 flex flex-wrap items-baseline gap-x-6 gap-y-2">
            <button
              type="button"
              onClick={install}
              className="font-mono text-[10.5px] uppercase tracking-[0.34em] text-[#0E0E0E] underline underline-offset-4 hover:text-black/70 transition-colors"
            >
              {t.install} →
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="font-mono text-[10.5px] uppercase tracking-[0.28em] text-black/55 hover:text-[#0E0E0E] transition-colors"
            >
              {t.later}
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label={t.later}
          className="text-black/55 hover:text-[#0E0E0E] transition-colors"
        >
          <X className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
