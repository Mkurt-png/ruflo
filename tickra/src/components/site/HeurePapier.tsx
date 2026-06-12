'use client';

// L'Heure du papier — when the reader's local clock crosses 22:00,
// the site dims its palette to a candle-warm register; it lifts again
// at 06:00. No setting, no toggle: the room simply darkens at night.
// Discourages late-night trading by physically going to sleep.
//
// The component does nothing but inject a class on the documentElement
// when the hour is right. The actual color shift lives in globals.css.

import { useEffect } from 'react';

const NIGHT_START = 22;
const NIGHT_END = 6;

function isNight(date = new Date()): boolean {
  const h = date.getHours();
  return h >= NIGHT_START || h < NIGHT_END;
}

export function HeurePapier() {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const apply = () => {
      const root = document.documentElement;
      if (isNight()) root.classList.add('tickra-night');
      else root.classList.remove('tickra-night');
    };
    apply();
    // Re-check every minute. Cheap: one classList toggle.
    const interval = window.setInterval(apply, 60_000);
    return () => window.clearInterval(interval);
  }, []);
  return null;
}

export default HeurePapier;
