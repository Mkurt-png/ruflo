'use client';

import { useEffect, useState } from 'react';
import { Copy, Check, Users, Gift } from 'lucide-react';
import { SITE_URL } from '@/lib/site-url';

type Locale = 'fr' | 'en';

type ReferralsResponse = {
  slug: string | null;
  plan: 'free' | 'pro' | 'lifetime';
  counts: { total: number; converted: number; pending: number };
  rewardDaysPending: number;
  welcomeBonusPending: number;
};

const copy = {
  fr: {
    eyebrow: 'Parrainage',
    title: 'Invitez vos amis, gagnez du temps Pro',
    proOnly: 'Réservé aux abonnés Pro et Lifetime.',
    yourLink: 'Votre lien d’invitation',
    copy: 'Copier',
    copied: 'Copié !',
    invited: 'Invités',
    converted: 'Conversions',
    reward: 'Crédit Pro à appliquer',
    daysUnit: 'jours',
    howItWorks: 'Comment ça marche',
    step1: 'Partagez votre lien personnel avec un ami.',
    step2: 'Votre ami crée un compte et passe à Pro.',
    step3: 'Vous gagnez +30 jours, votre ami obtient +14 jours offerts.',
    loading: 'Chargement…',
    error: 'Impossible de charger votre lien de parrainage.',
  },
  en: {
    eyebrow: 'Referrals',
    title: 'Invite friends, earn Pro time',
    proOnly: 'Available to Pro and Lifetime subscribers only.',
    yourLink: 'Your invite link',
    copy: 'Copy',
    copied: 'Copied!',
    invited: 'Invited',
    converted: 'Conversions',
    reward: 'Pro credit pending',
    daysUnit: 'days',
    howItWorks: 'How it works',
    step1: 'Share your personal link with a friend.',
    step2: 'They create an account and upgrade to Pro.',
    step3: 'You earn +30 days, they get +14 days free.',
    loading: 'Loading…',
    error: 'Couldn’t load your referral link.',
  },
} as const;

export function ReferralCard({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const [data, setData] = useState<ReferralsResponse | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'ready'>('loading');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/me/referrals', { cache: 'no-store' });
        if (!res.ok) {
          if (!cancelled) setStatus('error');
          return;
        }
        const json = (await res.json()) as ReferralsResponse;
        if (cancelled) return;
        setData(json);
        setStatus('ready');
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === 'loading') {
    return (
      <article aria-labelledby="referral-card-title" className="rounded-sm border border-line bg-surface p-6">
        <h2 id="referral-card-title" className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted">
          {t.eyebrow}
        </h2>
        <p role="status" aria-live="polite" aria-busy="true" className="mt-3 text-sm text-muted">
          {t.loading}
        </p>
      </article>
    );
  }

  if (status === 'error' || !data) {
    return (
      <article aria-labelledby="referral-card-title" className="rounded-sm border border-line bg-surface p-6">
        <h2 id="referral-card-title" className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted">
          {t.eyebrow}
        </h2>
        <p role="alert" className="mt-3 text-sm text-muted">
          {t.error}
        </p>
      </article>
    );
  }

  // Free plan: hide the card body, keep a single tease line so we don't
  // accidentally surface invite links from non-paying users.
  if (data.plan === 'free') {
    return (
      <article aria-labelledby="referral-card-title" className="rounded-sm border border-line bg-surface p-6">
        <h2 id="referral-card-title" className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted">
          {t.eyebrow}
        </h2>
        <p className="mt-3 text-sm text-muted">{t.proOnly}</p>
      </article>
    );
  }

  const link = data.slug
    ? `${SITE_URL}/${locale}/r/${data.slug}`
    : '';

  const onCopy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* swallow — the user can still select-and-copy the input */
    }
  };

  return (
    <article aria-labelledby="referral-card-title" className="rounded-sm border border-line bg-surface p-6">
      <h2 id="referral-card-title" className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted">
        {t.eyebrow}
      </h2>
      <h3 className="mt-3 font-display text-2xl font-medium tracking-tight text-ink">
        {t.title}
      </h3>

      <div className="mt-5">
        <label htmlFor="referral-link" className="block font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted">
          {t.yourLink}
        </label>
        <div className="mt-2 flex gap-2">
          <input
            id="referral-link"
            readOnly
            value={link}
            className="flex-1 truncate rounded-sm border border-line bg-canvas px-3 py-2 font-mono text-[12px] text-ink"
            onFocus={(e) => e.currentTarget.select()}
          />
          <button
            type="button"
            onClick={onCopy}
            aria-live="polite"
            className="inline-flex h-10 items-center gap-2 rounded-sm border border-line px-3 text-[13px] font-medium text-ink transition-colors hover:border-ink"
          >
            {copied ? <Check aria-hidden className="h-4 w-4" strokeWidth={1.75} /> : <Copy aria-hidden className="h-4 w-4" strokeWidth={1.75} />}
            {copied ? t.copied : t.copy}
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <Stat icon={<Users className="h-4 w-4" strokeWidth={1.75} />} label={t.invited} value={data.counts.total} />
        <Stat icon={<Check className="h-4 w-4" strokeWidth={1.75} />} label={t.converted} value={data.counts.converted} />
        <Stat
          icon={<Gift className="h-4 w-4" strokeWidth={1.75} />}
          label={t.reward}
          value={`${data.rewardDaysPending} ${t.daysUnit}`}
        />
      </div>

      <div className="mt-6 border-t border-line pt-5">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted">
          {t.howItWorks}
        </div>
        <ol className="mt-3 space-y-2 text-[13.5px] leading-relaxed text-ink">
          <li className="flex gap-3">
            <span className="font-mono text-[11px] text-muted">01</span>
            <span>{t.step1}</span>
          </li>
          <li className="flex gap-3">
            <span className="font-mono text-[11px] text-muted">02</span>
            <span>{t.step2}</span>
          </li>
          <li className="flex gap-3">
            <span className="font-mono text-[11px] text-muted">03</span>
            <span>{t.step3}</span>
          </li>
        </ol>
      </div>
    </article>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-sm border border-line bg-canvas p-3">
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <div className="mt-1 font-display text-xl font-medium tracking-tight text-ink">
        {value}
      </div>
    </div>
  );
}
