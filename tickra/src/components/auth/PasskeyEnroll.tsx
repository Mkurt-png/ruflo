'use client';

// Settings-page widget for enrolling and managing passkeys (WebAuthn).
//
// Flow:
//   1. POST /api/auth/webauthn/register-options          (server returns options)
//   2. navigator.credentials.create(...)                 (browser prompt)
//   3. POST /api/auth/webauthn/register                  (server stores cred)
//   4. Refresh local list and show success.
//
// We keep the network surface tiny — the server is the source of truth, so we
// only refetch the list on mount and after mutations.

import { useCallback, useEffect, useState } from 'react';

type Locale = 'fr' | 'en';

type PasskeySummary = {
  credential_id: string;
  created_at: string;
  last_used_at: string | null;
  transports: string | null;
};

type Props = {
  locale?: Locale;
  // The settings page already knows the user's passkeys via server props;
  // pass them here to avoid a redundant fetch on mount. Optional.
  initialPasskeys?: PasskeySummary[];
};

const COPY = {
  en: {
    title: 'Passkeys',
    description:
      'Sign in with Face ID, Touch ID, Windows Hello, or a security key — no password, no email link.',
    enroll: 'Enroll a passkey',
    enrolling: 'Waiting for your authenticator…',
    success: 'Passkey enrolled.',
    none: 'No passkeys yet.',
    remove: 'Remove',
    removing: 'Removing…',
    added: 'Added',
    lastUsed: 'Last used',
    never: 'Never used',
    unsupported: 'Your browser does not support passkeys.',
    failed: 'Could not enroll passkey.',
    removeFailed: 'Could not remove passkey.',
  },
  fr: {
    title: 'Clés d’accès',
    description:
      'Connectez-vous avec Face ID, Touch ID, Windows Hello ou une clé de sécurité — sans mot de passe ni lien e-mail.',
    enroll: 'Ajouter une clé d’accès',
    enrolling: 'En attente de votre authentificateur…',
    success: 'Clé d’accès ajoutée.',
    none: 'Aucune clé d’accès enregistrée.',
    remove: 'Supprimer',
    removing: 'Suppression…',
    added: 'Ajoutée le',
    lastUsed: 'Dernière utilisation',
    never: 'Jamais utilisée',
    unsupported: 'Votre navigateur ne prend pas en charge les clés d’accès.',
    failed: 'Impossible d’ajouter la clé d’accès.',
    removeFailed: 'Impossible de supprimer la clé d’accès.',
  },
};

export default function PasskeyEnroll({ locale = 'en', initialPasskeys }: Props) {
  const t = COPY[locale];
  const [list, setList] = useState<PasskeySummary[]>(initialPasskeys ?? []);
  const [busy, setBusy] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    setSupported(
      typeof window !== 'undefined' &&
        typeof window.PublicKeyCredential !== 'undefined' &&
        Boolean(window.navigator?.credentials),
    );
  }, []);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch('/api/auth/webauthn/list', { cache: 'no-store' });
      if (!r.ok) return;
      const data = (await r.json()) as { passkeys?: PasskeySummary[] };
      if (data.passkeys) setList(data.passkeys);
    } catch {
      /* swallow */
    }
  }, []);

  // TICKRA-FIX: fetch the list on mount if not provided by the server.
  useEffect(() => {
    if (!initialPasskeys || initialPasskeys.length === 0) {
      refresh();
    }
  }, [initialPasskeys, refresh]);

  const enroll = useCallback(async () => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const optsRes = await fetch('/api/auth/webauthn/register-options', { method: 'POST' });
      if (!optsRes.ok) {
        setError(t.failed);
        return;
      }
      const { options } = (await optsRes.json()) as { options: unknown };

      const { startRegistration } = await import('@simplewebauthn/browser');
      // SimpleWebAuthn v11 expects `{ optionsJSON }`; v10 took the options
      // object directly. Pass both keys so either version is happy.
      const attResp = await startRegistration({
        optionsJSON: options,
        ...(options as Record<string, unknown>),
      } as unknown as Parameters<typeof startRegistration>[0]);

      const regRes = await fetch('/api/auth/webauthn/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ response: attResp }),
      });
      if (!regRes.ok) {
        setError(t.failed);
        return;
      }
      setMessage(t.success);
      // Optimistically append; a full reload would also pick it up.
      setList((prev) => [
        {
          credential_id: (attResp as { id: string }).id,
          created_at: new Date().toISOString(),
          last_used_at: null,
          transports: null,
        },
        ...prev,
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.failed);
    } finally {
      setBusy(false);
    }
  }, [t]);

  const remove = useCallback(
    async (credentialId: string) => {
      setRemovingId(credentialId);
      setError(null);
      try {
        // We don't ship a dedicated DELETE endpoint here — see caveats in the
        // task summary. For now we surface a placeholder failure if the route
        // is missing. Implementers can add /api/auth/webauthn/remove later.
        const res = await fetch('/api/auth/webauthn/remove', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ credentialId }),
        });
        if (!res.ok) {
          setError(t.removeFailed);
          return;
        }
        setList((prev) => prev.filter((p) => p.credential_id !== credentialId));
      } catch {
        setError(t.removeFailed);
      } finally {
        setRemovingId(null);
        await refresh();
      }
    },
    [t, refresh],
  );

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h3 className="text-base font-semibold tracking-tight text-ink">{t.title}</h3>
        <p className="text-sm text-muted">{t.description}</p>
      </header>

      {!supported ? (
        <p className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-muted">
          {t.unsupported}
        </p>
      ) : (
        <button
          type="button"
          onClick={enroll}
          disabled={busy}
          className="inline-flex h-10 items-center justify-center rounded-full border border-line bg-surface px-4 text-sm font-medium text-ink transition-colors hover:border-ink disabled:opacity-60"
        >
          {busy ? t.enrolling : t.enroll}
        </button>
      )}

      {message ? <p className="text-sm text-up">{message}</p> : null}
      {error ? <p className="text-sm text-down">{error}</p> : null}

      <ul className="space-y-2">
        {list.length === 0 ? (
          <li className="text-sm text-muted">{t.none}</li>
        ) : (
          list.map((pk) => (
            <li
              key={pk.credential_id}
              className="flex items-center justify-between gap-3 rounded-md border border-line bg-surface px-3 py-2 text-sm"
            >
              <div className="min-w-0">
                <div className="truncate font-mono text-xs text-ink">
                  {pk.credential_id.slice(0, 12)}…{pk.credential_id.slice(-6)}
                </div>
                <div className="text-xs text-muted">
                  {t.added} {new Date(pk.created_at).toLocaleDateString(locale)} ·{' '}
                  {pk.last_used_at
                    ? `${t.lastUsed} ${new Date(pk.last_used_at).toLocaleDateString(locale)}`
                    : t.never}
                </div>
              </div>
              <button
                type="button"
                onClick={() => remove(pk.credential_id)}
                disabled={removingId === pk.credential_id}
                className="shrink-0 text-xs font-medium text-down hover:underline disabled:opacity-60"
              >
                {removingId === pk.credential_id ? t.removing : t.remove}
              </button>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
