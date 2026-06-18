'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Locale } from '@/lib/i18n/config';

type CreateMode = { mode: 'create'; battleId?: never };
type JoinMode = { mode: 'join'; battleId: string };
type Props = { locale: Locale } & (CreateMode | JoinMode);

const copy = {
  fr: {
    createTitle: 'Lancer une battle',
    createBody:
      '5 questions tirées au sort parmi les leçons publiées. Partagez le lien pour inviter un autre membre Pro.',
    createButton: 'Créer une battle',
    creating: 'Création…',
    joinTitle: 'Rejoindre la battle',
    joinBody:
      'Vous avez été invité à une battle. Cliquez pour rejoindre — vous serez le challenger.',
    joinButton: 'Rejoindre la battle',
    joining: 'Connexion…',
    inviteLabel: 'Lien d’invitation',
    copy: 'Copier',
    copied: 'Copié',
    error: 'Quelque chose s’est mal passé. Réessayez.',
  },
  en: {
    createTitle: 'Start a battle',
    createBody:
      '5 questions drawn at random from published lessons. Share the link to invite another Pro member.',
    createButton: 'Create a battle',
    creating: 'Creating…',
    joinTitle: 'Join battle',
    joinBody:
      'You have been invited to a battle. Tap to join — you will be the challenger.',
    joinButton: 'Join battle',
    joining: 'Joining…',
    inviteLabel: 'Invite link',
    copy: 'Copy',
    copied: 'Copied',
    error: 'Something went wrong. Try again.',
  },
} as const;

export function BattleJoin(props: Props) {
  const t = copy[props.locale];
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const inviteUrl = useMemo(() => {
    if (props.mode !== 'join') return '';
    if (typeof window === 'undefined') return `/battle/${props.battleId}`;
    return `${window.location.origin}/${props.locale}/battle/${props.battleId}`;
  }, [props.mode, props.locale, (props as JoinMode).battleId]);

  const onCreate = useCallback(async () => {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch('/api/battle/create', { method: 'POST' });
      const data = (await res.json().catch(() => null)) as { id?: string; error?: string } | null;
      if (!res.ok) {
        // surface the real backend reason so we can diagnose.
        const reason = data?.error ?? 'unknown';
        const human =
          reason === 'pro_required'
            ? props.locale === 'fr'
              ? 'Réservé aux abonnés Pro/Lifetime.'
              : 'Pro/Lifetime only.'
            : reason === 'unauthorized'
            ? props.locale === 'fr'
              ? 'Connectez-vous.'
              : 'Sign in first.'
            : reason === 'db_unavailable'
            ? props.locale === 'fr'
              ? 'Base indisponible. Réessayez plus tard.'
              : 'DB unavailable. Try later.'
            : reason === 'no_content'
            ? props.locale === 'fr'
              ? 'Pas de questions disponibles.'
              : 'No questions available.'
            : `${t.error} (${reason})`;
        setErr(human);
        return;
      }
      if (!data?.id) {
        setErr(t.error);
        return;
      }
      router.push(`/${props.locale}/battle/${data.id}`);
    } catch {
      setErr(t.error);
    } finally {
      setBusy(false);
    }
  }, [router, props.locale, t.error]);

  const onJoin = useCallback(async () => {
    if (props.mode !== 'join') return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/battle/${props.battleId}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'join' }),
      });
      if (!res.ok) {
        setErr(t.error);
        return;
      }
      router.refresh();
    } catch {
      setErr(t.error);
    } finally {
      setBusy(false);
    }
  }, [props, t.error, router]);

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  }, [inviteUrl]);

  if (props.mode === 'create') {
    return (
      <div className="max-w-2xl rounded-2xl border border-line bg-surface p-8">
        <h2 className="font-display text-2xl font-medium text-ink">{t.createTitle}</h2>
        <p className="mt-3 text-muted">{t.createBody}</p>
        <button
          type="button"
          onClick={onCreate}
          disabled={busy}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-canvas transition hover:opacity-90 disabled:opacity-50"
        >
          {busy ? t.creating : t.createButton}
        </button>
        {err ? <p className="mt-4 text-sm text-down">{err}</p> : null}
      </div>
    );
  }

  return (
    <div className="max-w-2xl rounded-2xl border border-line bg-surface p-8">
      <h2 className="font-display text-2xl font-medium text-ink">{t.joinTitle}</h2>
      <p className="mt-3 text-muted">{t.joinBody}</p>
      <button
        type="button"
        onClick={onJoin}
        disabled={busy}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-canvas transition hover:opacity-90 disabled:opacity-50"
      >
        {busy ? t.joining : t.joinButton}
      </button>
      <div className="mt-8">
        <label className="block font-mono text-[11px] uppercase tracking-[0.2em] text-subtle">
          {t.inviteLabel}
        </label>
        <div className="mt-2 flex items-center gap-2">
          <input
            readOnly
            value={inviteUrl}
            className="w-full flex-1 truncate rounded-md border border-line bg-canvas px-3 py-2 font-mono text-xs text-ink"
            onFocus={(e) => e.currentTarget.select()}
          />
          <button
            type="button"
            onClick={onCopy}
            className="rounded-md border border-line bg-canvas px-3 py-2 text-xs font-medium text-ink transition hover:bg-surface"
          >
            {copied ? t.copied : t.copy}
          </button>
        </div>
      </div>
      {err ? <p className="mt-4 text-sm text-down">{err}</p> : null}
    </div>
  );
}
