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
      <div className="pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-sm border border-line bg-surface p-4 shadow-[0_18px_40px_-18px_rgba(27,29,51,0.35)]">
        <Download aria-hidden className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand" strokeWidth={1.75} />
        <div className="min-w-0 flex-1">
          <p className="font-display text-[14.5px] font-medium tracking-tight text-ink">{t.title}</p>
          <p className="mt-1 text-[13px] leading-relaxed text-muted">{t.body}</p>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={install}
              className="inline-flex h-9 items-center rounded-full bg-ink px-4 text-[12.5px] font-medium tracking-tight text-canvas hover:brightness-110"
            >
              {t.install}
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="inline-flex h-9 items-center rounded-full border border-line px-3 text-[12.5px] text-muted hover:border-ink hover:text-ink"
            >
              {t.later}
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label={t.later}
          className="text-muted hover:text-ink"
        >
          <X className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}
