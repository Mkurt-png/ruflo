'use client';

// TICKRA-PHASE-6: contextual sticky CTA — auto-adjusts label + href based on
// where the user currently is. Default props are used as a fallback when no
// rule matches (preserves home-page behaviour).

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { easeOutExpo } from '@/lib/motion';
import { isEditorialPath } from '@/lib/editorial/routes';

type Props = {
  href: string;
  label: string;
};

type CtaResolved = { href: string; label: string };

function resolve(pathname: string, fallback: Props): CtaResolved {
  // pathname always starts with /{locale}
  const segs = pathname.split('/').filter(Boolean);
  const locale = (segs[0] === 'fr' || segs[0] === 'en') ? segs[0] : 'fr';

  if (pathname.includes('/learn/') && segs.length >= 4) {
    return {
      href: `/${locale}/me`,
      label: locale === 'fr' ? 'Mon espace' : 'My space',
    };
  }
  if (pathname.endsWith('/learn') || pathname.includes('/learn/')) {
    return {
      href: `/${locale}/me/simulator`,
      label: locale === 'fr' ? 'Ouvrir le simulateur' : 'Open simulator',
    };
  }
  if (pathname.endsWith('/pricing')) {
    return {
      href: `/${locale}/onboarding`,
      label: locale === 'fr' ? 'Commencer gratuitement' : 'Start free',
    };
  }
  if (pathname.includes('/me')) {
    return {
      href: `/${locale}/learn`,
      label: locale === 'fr' ? 'Reprendre une leçon' : 'Resume a lesson',
    };
  }
  if (pathname.includes('/editorial')) {
    return {
      href: `/${locale}/learn`,
      label: locale === 'fr' ? 'Démarrer le cursus' : 'Start the curriculum',
    };
  }
  return fallback;
}

export function MobileStickyCta({ href, label }: Props) {
  const pathname = usePathname() ?? '/';
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > window.innerHeight * 0.9);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Honour the editorial silence: no pill on Maison and her rooms.
  if (isEditorialPath(pathname)) return null;

  const cta = resolve(pathname, { href, label });

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
            href={cta.href}
            className="pointer-events-auto mx-auto flex h-12 max-w-md items-center justify-center gap-2 rounded-full bg-ink px-6 text-[15px] font-medium tracking-tight text-canvas shadow-[0_8px_24px_rgba(0,0,0,0.18)] transition-colors hover:bg-ink/90"
          >
            {cta.label}
            <ArrowRight aria-hidden className="h-4 w-4" strokeWidth={1.75} />
          </Link>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
