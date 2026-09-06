'use client';

// TICKRA-PHASE-4: Pro-gated community CTA on /me.
// Discord/Circle URL comes from NEXT_PUBLIC_COMMUNITY_URL so it can be set
// without redeploying code once the server is created.

import Link from 'next/link';
import { ArrowUpRight, Lock, Users } from 'lucide-react';
import { useUser } from '@/lib/auth/useUser';

type Locale = 'fr' | 'en';

const COMMUNITY_URL = process.env.NEXT_PUBLIC_COMMUNITY_URL ?? '';

const copy = {
  fr: {
    eyebrow: 'Communauté',
    title: 'Rejoignez la cohorte kNOWTrade.',
    body: 'Salons par piste, revue de trade hebdomadaire, charte stricte. Réservé aux abonnés Pro et Lifetime.',
    cta: 'Rejoindre maintenant',
    soon: 'Bientôt — la cohorte est en cours d’ouverture.',
    locked: 'Réservé à kNOWTrade Pro',
    upgrade: 'Passer à Pro',
    charter: 'Voir la charte',
  },
  en: {
    eyebrow: 'Community',
    title: 'Join the kNOWTrade cohort.',
    body: 'Per-track rooms, weekly trade review, strict charter. Pro and Lifetime only.',
    cta: 'Join now',
    soon: 'Soon — the cohort is being opened.',
    locked: 'Reserved for kNOWTrade Pro',
    upgrade: 'Upgrade to Pro',
    charter: 'Read the charter',
  },
};

export function CommunityPanel({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const { plan, ready } = useUser();
  if (!ready) return <div className="h-32 rounded-sm bg-line/40" aria-hidden />;
  const isPaid = plan === 'pro' || plan === 'lifetime';

  return (
    <article className="rounded-sm border border-line bg-surface p-7 md:p-9">
      <div className="flex items-baseline justify-between">
        <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
          <Users aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} />
          {t.eyebrow}
        </span>
        {!isPaid ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            <Lock className="h-3 w-3" strokeWidth={2} />
            {t.locked}
          </span>
        ) : null}
      </div>
      <h3 className="mt-4 font-display text-xl font-medium tracking-tight text-ink">{t.title}</h3>
      <p className="mt-2 max-w-md text-[14px] leading-relaxed text-muted">{t.body}</p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {isPaid && COMMUNITY_URL ? (
          <a
            href={COMMUNITY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-[14px] font-medium tracking-tight text-canvas transition-colors hover:bg-ink/90"
          >
            {t.cta}
            <ArrowUpRight aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} />
          </a>
        ) : isPaid ? (
          <span className="inline-flex h-11 items-center rounded-full border border-line px-5 text-[13.5px] text-muted">
            {t.soon}
          </span>
        ) : (
          <Link
            href={`/${locale}/pricing`}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-[14px] font-medium tracking-tight text-canvas hover:bg-ink/90"
          >
            {t.upgrade}
          </Link>
        )}
        <Link
          href={`/${locale}/community`}
          className="inline-flex h-11 items-center gap-2 rounded-full border border-line px-5 text-[13.5px] font-medium text-ink hover:border-ink"
        >
          {t.charter}
        </Link>
      </div>
    </article>
  );
}
