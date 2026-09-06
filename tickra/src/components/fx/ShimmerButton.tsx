'use client';

// ShimmerButton — primary CTA wrapper that adds a diagonal light sweep
// across the button, a subtle hover lift, and a brand-coloured glow.
// Renders as a Link or a button depending on `href`. Keeps the existing
// onClick + analytics from the host call site working.

import Link from 'next/link';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';

type Common = {
  children: ReactNode;
  className?: string;
  tone?: 'brand' | 'ink';
};

type AnchorProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'children' | 'href'>;
type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'>;

type Props = Common & { href?: string } & AnchorProps & ButtonProps;

export function ShimmerButton(props: Props) {
  const { children, className = '', tone = 'brand', href, ...rest } = props;

  const base =
    'group relative inline-flex items-center justify-center overflow-hidden rounded-lg px-6 py-3 text-base font-semibold transition-all duration-200 will-change-transform hover:-translate-y-0.5';
  const toneClasses =
    tone === 'brand'
      ? 'bg-brand text-ink hover:brightness-110 shadow-[0_0_0_0_rgb(var(--brand)/0)] hover:shadow-[0_10px_40px_-8px_rgb(var(--brand)/0.55)]'
      : 'bg-ink text-canvas hover:bg-ink/95 shadow-[0_0_0_0_rgba(0,0,0,0)] hover:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)]';

  const Inner = (
    <>
      <span className="relative z-10 inline-flex items-center">{children}</span>
      {/* Diagonal shimmer sweep — runs across on every hover via group-hover. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -translate-x-full skew-x-[-12deg] bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[140%]"
      />
      {/* Persistent low-amp shimmer ribbon, very subtle. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 skew-x-[-12deg] bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer motion-reduce:animate-none"
      />
    </>
  );

  if (href) {
    return (
      <Link href={href} className={`${base} ${toneClasses} ${className}`} {...(rest as AnchorProps)}>
        {Inner}
      </Link>
    );
  }
  return (
    <button className={`${base} ${toneClasses} ${className}`} {...(rest as ButtonProps)}>
      {Inner}
    </button>
  );
}

export default ShimmerButton;
