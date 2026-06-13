// Pull — citation détachée façon éditorial. Grand serif italique en
// plein milieu de la prose, marges respirantes, sans guillemets
// décoratifs : juste la phrase, signée si besoin. Le geste typographique
// qui sépare les paragraphes lourds.

import type { ReactNode } from 'react';

export function Pull({
  children,
  attribution,
}: {
  children: ReactNode;
  /** Optionnel : nom de l'auteur ou de la voix. */
  attribution?: string;
}) {
  return (
    <figure className="my-16 mx-auto max-w-[820px] text-center">
      <blockquote>
        <p
          className="font-display italic font-light text-[#0E0E0E] leading-snug text-balance"
          style={{ fontSize: 'clamp(28px, 4vw, 48px)', letterSpacing: '-0.025em', lineHeight: 1.12 }}
        >
          {children}
        </p>
      </blockquote>
      {attribution && (
        <figcaption className="mt-6 font-mono text-[10.5px] uppercase tracking-[0.32em] text-black/55">
          — {attribution}
        </figcaption>
      )}
    </figure>
  );
}

export default Pull;
