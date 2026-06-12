'use client';

// TICKRA-PHASE-6: register the service worker on first paint.
// Bail in dev so HMR isn't intercepted.

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    if (window.location.hostname === 'localhost') return;
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* silent — feature is progressive */
    });
  }, []);
  return null;
}
