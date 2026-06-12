'use client';

// SharePanel — Pro+ widget to toggle the public profile at /u/<slug>.
// Mirrors the pattern from ReferralCard: client component that GETs /api/me/share
// on mount, renders a tease for free users, and exposes a toggle + copy button
// for Pro/Lifetime users.

import { useEffect, useState } from 'react';
import { Copy, Check, Globe, EyeOff } from 'lucide-react';

type Locale = 'fr' | 'en';

type ShareResponse = {
  slug: string | null;
  url: string | null;
  visible: boolean;
  plan: 'free' | 'pro' | 'lifetime';
};

const copy = {
  fr: {
    eyebrow: 'Profil public',
    title: 'Partagez votre progression',
    body: 'Activez votre profil public pour partager vos statistiques sur LinkedIn et Twitter. Aucune donnée privée — uniquement votre niveau, vos leçons et votre série.',
    proOnly: 'Réservé aux abonnés Pro et Lifetime.',
    toggleOn: 'Rendre mon profil public',
    visible: 'Profil public',
    hidden: 'Profil privé',
    yourUrl: 'Votre URL publique',
    copy: 'Copier',
    copied: 'Copié !',
    loading: 'Chargement…',
    error: 'Impossible de charger votre profil partagé.',
    privateNote: 'Activez l’interrupteur pour rendre votre profil accessible.',
  },
  en: {
    eyebrow: 'Public profile',
    title: 'Share your progress',
    body: 'Turn on your public profile to share your stats on LinkedIn and Twitter. No private data — just your level, lessons and streak.',
    proOnly: 'Available to Pro and Lifetime subscribers only.',
    toggleOn: 'Make my profile public',
    visible: 'Public profile',
    hidden: 'Private profile',
    yourUrl: 'Your public URL',
    copy: 'Copy',
    copied: 'Copied!',
    loading: 'Loading…',
    error: 'Couldn’t load your share profile.',
    privateNote: 'Flip the switch to make your profile reachable.',
  },
} as const;

export function SharePanel({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const [data, setData] = useState<ShareResponse | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'ready'>('loading');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/me/share', { cache: 'no-store' });
        if (!res.ok) {
          if (!cancelled) setStatus('error');
          return;
        }
        const json = (await res.json()) as ShareResponse;
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
      <article className="rounded-sm border border-line bg-surface p-6">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted">
          {t.eyebrow}
        </div>
        <p className="mt-3 text-sm text-muted">{t.loading}</p>
      </article>
    );
  }

  if (status === 'error' || !data) {
    return (
      <article className="rounded-sm border border-line bg-surface p-6">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted">
          {t.eyebrow}
        </div>
        <p className="mt-3 text-sm text-muted">{t.error}</p>
      </article>
    );
  }

  if (data.plan === 'free') {
    return (
      <article className="rounded-sm border border-line bg-surface p-6">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted">
          {t.eyebrow}
        </div>
        <p className="mt-3 text-sm text-muted">{t.proOnly}</p>
      </article>
    );
  }

  const onToggle = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch('/api/me/share', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ visible: !data.visible }),
      });
      if (res.ok) {
        const json = (await res.json()) as ShareResponse;
        setData(json);
      }
    } catch {
      /* swallow — keep current state */
    } finally {
      setSaving(false);
    }
  };

  const onCopy = async () => {
    if (!data.url) return;
    try {
      await navigator.clipboard.writeText(data.url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* swallow */
    }
  };

  return (
    <article className="rounded-sm border border-line bg-surface p-6">
      <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted">
        {t.eyebrow}
      </div>
      <h3 className="mt-3 font-display text-2xl font-medium tracking-tight text-ink">
        {t.title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{t.body}</p>

      <div className="mt-5 flex items-center justify-between rounded-sm border border-line bg-canvas px-4 py-3">
        <div className="inline-flex items-center gap-2 text-[13px] font-medium text-ink">
          {data.visible ? (
            <Globe className="h-4 w-4 text-brand" strokeWidth={1.75} />
          ) : (
            <EyeOff className="h-4 w-4 text-muted" strokeWidth={1.75} />
          )}
          {data.visible ? t.visible : t.hidden}
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={data.visible}
          onClick={onToggle}
          disabled={saving}
          className={`relative inline-flex h-6 w-11 items-center rounded-full border transition-colors ${
            data.visible ? 'border-brand bg-brand' : 'border-line bg-canvas'
          } ${saving ? 'opacity-60' : ''}`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-surface transition-transform ${
              data.visible ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {data.visible && data.url ? (
        <div className="mt-4">
          <label className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted">
            {t.yourUrl}
          </label>
          <div className="mt-2 flex gap-2">
            <input
              readOnly
              value={data.url}
              className="flex-1 truncate rounded-sm border border-line bg-canvas px-3 py-2 font-mono text-[12px] text-ink"
              onFocus={(e) => e.currentTarget.select()}
            />
            <button
              type="button"
              onClick={onCopy}
              className="inline-flex h-10 items-center gap-2 rounded-sm border border-line px-3 text-[13px] font-medium text-ink transition-colors hover:border-ink"
            >
              {copied ? (
                <Check className="h-4 w-4" strokeWidth={1.75} />
              ) : (
                <Copy className="h-4 w-4" strokeWidth={1.75} />
              )}
              {copied ? t.copied : t.copy}
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-[12.5px] text-subtle">{t.privateNote}</p>
      )}
    </article>
  );
}
