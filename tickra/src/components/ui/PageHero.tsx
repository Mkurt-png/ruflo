import type { ReactNode } from 'react';
import { Container } from './Container';
import { Eyebrow } from './Eyebrow';

type Props = {
  eyebrow?: string;
  title: string;
  body?: string;
  meta?: string;
  children?: ReactNode;
};

export function PageHero({ eyebrow, title, body, meta, children }: Props) {
  return (
    <section className="border-b border-line">
      <Container as="div" className="pb-20 pt-16 md:pb-28 md:pt-24">
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <h1 className="mt-6 max-w-3xl font-display text-display-lg font-medium tracking-tight text-balance text-ink">
          {title}
        </h1>
        {body ? (
          <p className="mt-6 max-w-2xl text-pretty text-[17px] leading-relaxed text-muted md:text-lg">
            {body}
          </p>
        ) : null}
        {meta ? (
          <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.2em] text-subtle">{meta}</p>
        ) : null}
        {children ? <div className="mt-10">{children}</div> : null}
      </Container>
    </section>
  );
}
