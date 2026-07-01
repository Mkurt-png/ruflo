'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import type { Dictionary } from '@/lib/i18n/dictionaries';

type Props = { dict: Dictionary };

type Plan = 'Pro' | 'Lifetime';

type Card = {
  name: string;
  role: string;
  quote: string;
  plan: Plan;
  joined: string;
};

// Hardcoded as per spec; falls back if dict mismatched.
const CARDS: Card[] = [
  {
    name: 'Léa M.',
    role: 'Junior analyst, Paris',
    plan: 'Pro',
    joined: 'Jan 2026',
    quote:
      'I spent two years on YouTube before realising I was learning nothing. Six weeks on Tickra and I finally have a method.',
  },
  {
    name: 'Karim B.',
    role: 'Engineer, Lyon',
    plan: 'Lifetime',
    joined: 'Feb 2026',
    quote: 'The Risk Management track alone is worth the lifetime price.',
  },
  {
    name: 'Sofia D.',
    role: 'Independent trader, Brussels',
    plan: 'Pro',
    joined: 'Dec 2025',
    quote:
      'The decision journal showed me I always exit winning trades too early.',
  },
  {
    name: 'Antoine R.',
    role: 'Consultant, Bordeaux',
    plan: 'Pro',
    joined: 'Nov 2025',
    quote:
      'Ten minutes a day, no guilt. First time I hold a 60+ day streak.',
  },
];

// TICKRA-REDESIGN: Auto-scrolling testimonials carousel.
export function Testimonials({ dict }: Props) {
  const t = dict.testimonials;
  const [index, setIndex] = useState(0);
  const [cardsVisible, setCardsVisible] = useState(1);

  useEffect(() => {
    const update = () => {
      setCardsVisible(window.matchMedia('(min-width: 768px)').matches ? 4 : 1);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % CARDS.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const prev = () => setIndex((i) => (i - 1 + CARDS.length) % CARDS.length);
  const next = () => setIndex((i) => (i + 1) % CARDS.length);

  // Each card is (100% / cardsVisible) wide, gap of 1.25rem (gap-5).
  const translatePct = (100 / cardsVisible) * index;

  // Mobile shows 1 (100% width), desktop shows 4 (each 25%)
  // We translate by `index * (100% / cardsVisible)` per card on mobile,
  // but on desktop spec says 4 visible so translate by index * 25% to rotate.
  // Use a single layout: on mobile each card is w-full; on desktop each card is w-1/4.
  // Translate by `index * (100/4)%` on desktop, `index * 100%` on mobile.

  return (
    <section
      id="testimonials"
      aria-labelledby="testimonials-title"
      className="bg-surface-warm py-24"
    >
      <div className="mx-auto w-full max-w-container px-6 md:px-10">
        <h2
          id="testimonials-title"
          className="text-ink text-3xl md:text-4xl font-medium text-center"
        >
          {t.title}
        </h2>

        <div className="relative mt-12">
          <button
            type="button"
            aria-label="Previous testimonial"
            onClick={prev}
            className="absolute -left-2 md:-left-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-surface border border-line flex items-center justify-center text-ink hover:bg-elevated hover:text-ink transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Next testimonial"
            onClick={next}
            className="absolute -right-2 md:-right-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-surface border border-line flex items-center justify-center text-ink hover:bg-elevated hover:text-ink transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <div className="overflow-hidden">
            <div
              className="flex gap-5 transition-transform duration-500 ease-in-out"
              style={{
                transform: `translateX(calc(-${translatePct}% - ${index} * 1.25rem / ${cardsVisible}))`,
              }}
            >
              {CARDS.map((c) => (
                <article
                  key={c.name}
                  className="bg-surface rounded-xl p-6 border border-line flex flex-col shrink-0 w-full md:w-[calc((100%-3.75rem)/4)]"
                >
                  <header className="flex items-start gap-3">
                    <Avatar name={c.name} />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-text-primary truncate">{c.name}</div>
                      <div className="text-xs text-text-secondary truncate">{c.role}</div>
                    </div>
                  </header>

                  <div className="mt-3 flex items-center gap-2">
                    <PlanBadge plan={c.plan} />
                    <span className="text-xs text-text-muted">{c.joined}</span>
                  </div>

                  <blockquote className="relative mt-4 text-sm text-text-secondary leading-relaxed flex-1">
                    <span
                      aria-hidden
                      className="absolute -top-3 -left-1 font-serif text-4xl text-subtle leading-none select-none"
                    >
                      &ldquo;
                    </span>
                    <span className="relative">{c.quote}</span>
                  </blockquote>

                  <footer className="mt-4 flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 bg-success/10 text-success text-xs px-2 py-0.5 rounded-full">
                      <CheckCircle aria-hidden className="h-3 w-3" />
                      {t.verifiedLabel ?? 'Verified'}
                    </span>
                  </footer>
                </article>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-10 text-center text-xs text-text-muted">{t.disclaimer}</p>
      </div>
    </section>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('');
  return (
    <span
      aria-hidden
      className="w-10 h-10 rounded-full bg-elevated text-ink flex items-center justify-center text-sm font-medium shrink-0"
    >
      {initials}
    </span>
  );
}

function PlanBadge({ plan }: { plan: Plan }) {
  const cls =
    plan === 'Pro'
      ? 'bg-accent-blue/10 text-accent-blue'
      : 'bg-gold/20 text-amber-800';
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>{plan}</span>
  );
}
