'use client';

// CursorGlow — mouse-tracking radial glow that follows the cursor across
// a dark section. Updates two CSS custom properties (--gx, --gy) on the
// host element instead of doing React state per move; cost is one rAF
// per frame. Bails out under prefers-reduced-motion.

import { useEffect, useRef } from 'react';

type Props = {
  className?: string;
  /** Whole-page tracking instead of bounding to the host's rect. */
  global?: boolean;
};

export function CursorGlow({ className = '', global = false }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    let raf = 0;
    let nextX = 50;
    let nextY = 50;

    const apply = () => {
      el.style.setProperty('--gx', `${nextX}%`);
      el.style.setProperty('--gy', `${nextY}%`);
      raf = 0;
    };

    const onMove = (e: MouseEvent) => {
      const target = global ? document.documentElement : el.parentElement ?? el;
      const r = target.getBoundingClientRect();
      nextX = ((e.clientX - r.left) / r.width) * 100;
      nextY = ((e.clientY - r.top) / r.height) * 100;
      if (!raf) raf = requestAnimationFrame(apply);
    };

    const host: HTMLElement | Document = global ? document : el.parentElement ?? document;
    host.addEventListener('mousemove', onMove as EventListener);
    return () => {
      host.removeEventListener('mousemove', onMove as EventListener);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [global]);

  return (
    <div
      ref={ref}
      aria-hidden
      className={`pointer-events-none absolute inset-0 cursor-glow ${className}`}
    />
  );
}

export default CursorGlow;
