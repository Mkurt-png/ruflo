'use client';

import { useEffect, useState } from 'react';
import { Bell, BellOff, Check } from 'lucide-react';
import { toast } from '@/components/site/ToastProvider';

type Locale = 'fr' | 'en';

const STORAGE_KEY = 'tickra-notif-optin-v1';

const copy = {
  fr: {
    title: 'Rappel quotidien',
    enabled: 'Activé. Vous recevrez un rappel demain à la même heure.',
    description:
      'kNOWTrade peut vous envoyer une notification douce une fois par jour, sans serveur — directement depuis votre navigateur, tant que cet onglet reste ouvert.',
    enable: 'Activer le rappel',
    disable: 'Désactiver',
    denied: 'Votre navigateur a refusé les notifications. Vous pouvez les réautoriser depuis ses paramètres.',
    unsupported: 'Notifications non supportées par ce navigateur.',
    toastTitle: 'Rappel activé',
    toastBody: 'Un rappel quotidien sera envoyé tant que cet onglet est ouvert.',
    fired: '10 minutes ?',
    firedBody: 'Lancez votre leçon kNOWTrade du jour.',
  },
  en: {
    title: 'Daily reminder',
    enabled: 'On. We will ping you tomorrow at the same time.',
    description:
      'kNOWTrade can send you a gentle notification once a day, with no server — straight from your browser, as long as this tab stays open.',
    enable: 'Enable reminder',
    disable: 'Disable',
    denied: 'Your browser denied notifications. Re-enable them in browser settings.',
    unsupported: 'Notifications not supported in this browser.',
    toastTitle: 'Reminder enabled',
    toastBody: 'A daily reminder will fire as long as this tab is open.',
    fired: '10 minutes?',
    firedBody: 'Run your kNOWTrade lesson for today.',
  },
};

type State = 'unsupported' | 'idle' | 'enabled' | 'denied';

function readEnabled(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function writeEnabled(value: boolean) {
  try {
    window.localStorage.setItem(STORAGE_KEY, value ? '1' : '0');
  } catch {
    /* ignore */
  }
}

export function NotificationOptin({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const [state, setState] = useState<State>('idle');
  const [timerId, setTimerId] = useState<number | null>(null);

  // Init: read browser permission + stored preference.
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setState('unsupported');
      return;
    }
    const stored = readEnabled();
    if (Notification.permission === 'denied') setState('denied');
    else if (Notification.permission === 'granted' && stored) setState('enabled');
    else setState('idle');
  }, []);

  // When enabled, schedule a daily reminder for as long as the tab lives.
  useEffect(() => {
    if (state !== 'enabled') return;
    const ONE_DAY = 24 * 60 * 60 * 1000;
    const id = window.setTimeout(() => {
      try {
        new Notification(t.fired, { body: t.firedBody, icon: '/favicon.svg' });
      } catch {
        /* ignore */
      }
    }, ONE_DAY);
    setTimerId(id);
    return () => window.clearTimeout(id);
  }, [state, t.fired, t.firedBody]);

  const enable = async () => {
    if (state === 'unsupported') return;
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      writeEnabled(true);
      setState('enabled');
      toast({ tone: 'success', title: t.toastTitle, body: t.toastBody });
    } else if (perm === 'denied') {
      setState('denied');
    }
  };

  const disable = () => {
    writeEnabled(false);
    if (timerId) window.clearTimeout(timerId);
    setState('idle');
  };

  return (
    <article className="rounded-sm border border-line bg-surface p-7 md:p-9">
      <div className="flex items-center gap-2.5">
        <Bell aria-hidden className="h-4 w-4 text-ink" strokeWidth={1.6} />
        <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">{t.title}</div>
      </div>
      <p className="mt-3 max-w-md text-[14px] text-muted">{t.description}</p>

      {state === 'unsupported' ? (
        <p className="mt-6 text-[13px] text-subtle">{t.unsupported}</p>
      ) : state === 'denied' ? (
        <p className="mt-6 text-[13px] text-down">{t.denied}</p>
      ) : state === 'enabled' ? (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 text-[13.5px] text-up">
            <Check aria-hidden className="h-3.5 w-3.5" strokeWidth={2} />
            {t.enabled}
          </span>
          <button
            type="button"
            onClick={disable}
            className="inline-flex h-9 items-center gap-2 rounded-full border border-line px-3.5 text-[13px] font-medium tracking-tight text-ink transition-colors hover:border-ink"
          >
            <BellOff aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} />
            {t.disable}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={enable}
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-[14px] font-medium tracking-tight text-canvas transition-colors hover:bg-ink/90"
        >
          <Bell aria-hidden className="h-4 w-4" strokeWidth={1.75} />
          {t.enable}
        </button>
      )}
    </article>
  );
}
