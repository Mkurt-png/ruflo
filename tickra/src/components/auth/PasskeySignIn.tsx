'use client';

// Sign-in widget for the auth page: email-then-passkey flow.
//
// 1. User types their email.
// 2. We fetch authentication options bound to that email's credentials.
// 3. navigator.credentials.get() runs the platform prompt.
// 4. We POST the assertion to /api/auth/webauthn/authenticate which sets the
//    same `tickra-session` cookie as the magic-link callback, then we redirect
//    to /me.

import { useEffect, useState } from 'react';

type Locale = 'fr' | 'en';

type Props = {
  locale?: Locale;
  // Where to land after a successful sign-in. Defaults to /<locale>/me.
  redirectTo?: string;
};

const COPY = {
  en: {
    title: 'Sign in with a passkey',
    placeholder: 'you@example.com',
    submit: 'Sign in with passkey',
    submitting: 'Waiting for your passkey…',
    unsupported: 'Your browser does not support passkeys.',
    badEmail: 'Enter a valid email address.',
    failed: 'Sign-in failed. Try a magic link instead.',
    noCredentials: 'No passkey is registered for this email.',
  },
  fr: {
    title: 'Connexion avec une clé d’accès',
    placeholder: 'vous@exemple.com',
    submit: 'Se connecter avec une clé d’accès',
    submitting: 'En attente de votre clé d’accès…',
    unsupported: 'Votre navigateur ne prend pas en charge les clés d’accès.',
    badEmail: 'Entrez une adresse e-mail valide.',
    failed: 'Échec de la connexion. Essayez le lien magique.',
    noCredentials: 'Aucune clé d’accès enregistrée pour cet e-mail.',
  },
};

function isEmail(v: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);
}

export default function PasskeySignIn({ locale = 'en', redirectTo }: Props) {
  const t = COPY[locale];
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    setSupported(
      typeof window !== 'undefined' &&
        typeof window.PublicKeyCredential !== 'undefined' &&
        Boolean(window.navigator?.credentials),
    );
  }, []);

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    setError(null);
    const trimmed = email.trim().toLowerCase();
    if (!isEmail(trimmed)) {
      setError(t.badEmail);
      return;
    }
    setBusy(true);
    try {
      const optsRes = await fetch('/api/auth/webauthn/authenticate-options', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      });
      if (!optsRes.ok) {
        setError(t.failed);
        return;
      }
      const { options } = (await optsRes.json()) as { options: { allowCredentials?: unknown[] } };
      // TICKRA-FIX(security): when there are no registered passkeys for
      // this email, fall through to the generic failure rather than telling
      // the attacker "no passkey for this email" (which leaks user existence).
      if (!options.allowCredentials || options.allowCredentials.length === 0) {
        setError(t.failed);
        return;
      }

      const { startAuthentication } = await import('@simplewebauthn/browser');
      // Support both v10 (raw options) and v11 (`{ optionsJSON }`) shapes.
      const assertion = await startAuthentication({
        optionsJSON: options,
        ...(options as Record<string, unknown>),
      } as unknown as Parameters<typeof startAuthentication>[0]);

      const authRes = await fetch('/api/auth/webauthn/authenticate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: trimmed, response: assertion }),
      });
      if (!authRes.ok) {
        setError(t.failed);
        return;
      }

      const target = redirectTo ?? `/${locale}/me`;
      window.location.assign(target);
    } catch {
      setError(t.failed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      {/* TICKRA-FIX(a11y): label bound to input via htmlFor/id. */}
      <label htmlFor="passkey-email" className="block text-sm font-medium text-ink">
        {t.title}
      </label>
      <input
        id="passkey-email"
        type="email"
        inputMode="email"
        autoComplete="username webauthn"
        placeholder={t.placeholder}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={busy || !supported}
        className="h-12 w-full rounded-full border border-line bg-surface px-4 text-[14.5px] text-ink placeholder:text-muted focus:border-ink focus:outline-none disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={busy || !supported}
        className="inline-flex h-12 w-full items-center justify-center rounded-full border border-line bg-surface px-5 text-[14.5px] font-medium tracking-tight text-ink transition-colors hover:border-ink disabled:opacity-60"
      >
        {busy ? t.submitting : t.submit}
      </button>
      {!supported ? <p className="text-xs text-muted">{t.unsupported}</p> : null}
      {error ? <p className="text-xs text-down">{error}</p> : null}
    </form>
  );
}
