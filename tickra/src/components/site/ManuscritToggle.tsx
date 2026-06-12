'use client';

// Mode Manuscrit — a parallel reading register. Toggle, persist
// (per-account scoped), and apply a class on the documentElement.
// The CSS rules live in globals.css. Same content, different ritual.

import { useEffect, useState } from 'react';
import { scopedKey, SCOPE_EVENT } from '@/lib/progress/scope';

const STORE_BASE = 'tickra-manuscrit-v1';

function readPref(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(scopedKey(STORE_BASE)) === '1';
  } catch {
    return false;
  }
}

function applyPref(on: boolean) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (on) root.classList.add('tickra-manuscrit');
  else root.classList.remove('tickra-manuscrit');
}

export function ManuscritToggle({ locale }: { locale: 'fr' | 'en' }) {
  const [on, setOn] = useState(false);

  useEffect(() => {
    const sync = () => {
      const pref = readPref();
      setOn(pref);
      applyPref(pref);
    };
    sync();
    window.addEventListener(SCOPE_EVENT, sync);
    return () => window.removeEventListener(SCOPE_EVENT, sync);
  }, []);

  const toggle = () => {
    const next = !on;
    setOn(next);
    applyPref(next);
    try {
      window.localStorage.setItem(scopedKey(STORE_BASE), next ? '1' : '0');
    } catch {
      /* ignore */
    }
  };

  const label = locale === 'fr' ? 'Manuscrit' : 'Manuscript';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      title={locale === 'fr' ? 'Basculer en mode manuscrit' : 'Toggle manuscript mode'}
      className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/55 hover:text-white transition-colors px-2 py-1 rounded-sm"
    >
      {on ? `· ${label}` : label}
    </button>
  );
}

export default ManuscritToggle;
