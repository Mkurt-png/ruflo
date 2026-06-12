'use client';

// MagneticTilt — cursor-tracking 3D tilt wrapper for cards. Applies a
// gentle perspective transform that mirrors the cursor position; resets
// smoothly when the cursor leaves. Disabled under reduced-motion.

import { useEffect, useRef, type ReactNode } from 'react';

type Props = {
  children: ReactNode;
  className?: string;
  /** Max rotation in degrees on each axis. */
  max?: number;
  /** Scale factor on hover. */
  scale?: number;
};

export function MagneticTilt({ children, className = '', max = 6, scale = 1.015 }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    let raf = 0;
    let rx = 0;
    let ry = 0;

    const apply = () => {
      el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${scale})`;
      raf = 0;
    };

    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      ry = (px - 0.5) * 2 * max;
      rx = -(py - 0.5) * 2 * max;
      if (!raf) raf = requestAnimationFrame(apply);
    };

    const onLeave = () => {
      el.style.transition = 'transform 360ms cubic-bezier(0.16, 1, 0.3, 1)';
      el.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)';
      window.setTimeout(() => {
        if (el) el.style.transition = '';
      }, 360);
    };

    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [max, scale]);

  return (
    <div ref={ref} className={`will-change-transform ${className}`} style={{ transformStyle: 'preserve-3d' }}>
      {children}
    </div>
  );
}

export default MagneticTilt;
