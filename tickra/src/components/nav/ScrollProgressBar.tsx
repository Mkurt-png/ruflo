'use client';

import { useEffect, useState } from 'react';

// TICKRA-REDESIGN: small client island for the navbar scroll progress.
// Keeps the rest of the Navbar a server component.
export function ScrollProgressBar() {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    function onScroll() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max <= 0) {
        setPct(0);
        return;
      }
      const p = (window.scrollY / max) * 100;
      setPct(Math.max(0, Math.min(100, p)));
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <span
      aria-hidden
      className="absolute bottom-0 left-0 h-[2px] bg-accent-blue transition-[width] duration-100 ease-out"
      style={{ width: `${pct}%` }}
    />
  );
}
