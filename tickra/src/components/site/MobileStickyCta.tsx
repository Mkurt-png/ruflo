'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { easeOutExpo } from '@/lib/motion';

type Props = {
  href: string;
  label: string;
};

export function MobileStickyCta({ href, label }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      // Show after we've scrolled past the hero (~ first viewport).
      setVisible(window.scrollY > window.innerHeight * 0.9);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.35, ease: easeOutExpo }}
          className="pointer-events-none fixed inset-x-0 bottom-4 z-30 px-4 md:hidden"
        >
          <Link
            href={href}
            className="pointer-events-auto mx-auto flex h-12 max-w-md items-center justify-center gap-2 rounded-full bg-ink px-6 text-[15px] font-medium tracking-tight text-canvas shadow-[0_8px_24px_rgba(0,0,0,0.18)] transition-colors hover:bg-ink/90"
          >
            {label}
            <ArrowRight aria-hidden className="h-4 w-4" strokeWidth={1.75} />
          </Link>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
