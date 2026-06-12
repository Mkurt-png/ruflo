'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Mail, AlertTriangle, RotateCcw } from 'lucide-react';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { GoogleButton } from './GoogleButton';
import PasskeySignIn from './PasskeySignIn';
import type { Dictionary } from '@/lib/i18n/dictionaries';
import type { Locale } from '@/lib/i18n/config';

// TICKRA-FIX: human-readable messages per backend error code.
const errorCopy: Record<string, { fr: string; en: string }> = {
  expired:        { fr: 'Le lien a expiré. Demandez-en un nouveau.',          en: 'The link expired. Request a new one.' },
  bad_signature:  { fr: 'Lien invalide ou modifié. Redemandez un lien.',      en: 'Invalid or tampered link. Request a new one.' },
  malformed_token:{ fr: 'Lien incomplet. Redemandez un lien.',                en: 'Incomplete link. Request a new one.' },
  bad_encoding:   { fr: 'Lien incomplet. Redemandez un lien.',                en: 'Incomplete link. Request a new one.' },
  bad_payload:    { fr: 'Lien incomplet. Redemandez un lien.',                en: 'Incomplete link. Request a new one.' },
  missing_token:  { fr: 'Lien manquant. Redemandez un lien depuis le formulaire.', en: 'Missing token. Request a new link from the form.' },
  not_configured: { fr: 'Connexion temporairement indisponible. Réessayez.', en: 'Sign-in temporarily unavailable. Try again.' },
  invalid:        { fr: 'Lien invalide. Redemandez un lien.',                 en: 'Invalid link. Request a new one.' },
  invalid_state:  { fr: 'Session OAuth invalide. Réessayez.',                 en: 'Invalid OAuth state. Try again.' },
  oauth_not_configured: { fr: 'Google sign-in non configuré.',                en: 'Google sign-in not configured.' },
};

function describe(err: string, locale: Locale): string {
  const entry = errorCopy[err];
  if (!entry) return err.replace(/_/g, ' ');
  return entry[locale];
}

export function SignInForm({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const t = dict.signin;
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);

  // Surface the ?error= param from a failed OAuth round-trip so the user
  // sees WHY signin didn't go through (was silently swallowed before).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get('error');
    if (err) setOauthError(err);
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || pending) return;
    setPending(true);
    try {
      await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, locale }),
      });
    } catch {
      /* swallow — we always show the same confirmation for security */
    }
    setPending(false);
    setSent(true);
  };

  return (
    <div className="rounded-sm border border-line bg-surface p-8 md:p-10">
      <Eyebrow>{t.title}</Eyebrow>
      <h1 className="mt-6 font-display text-3xl font-medium tracking-tight text-ink md:text-4xl">
        {t.title}
      </h1>
      <p className="mt-4 text-[15.5px] leading-relaxed text-muted">{t.subtitle}</p>

      {oauthError ? (
        <div className="mt-6 flex flex-col gap-3 rounded-sm border border-down/40 bg-down/10 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle aria-hidden className="mt-0.5 h-4 w-4 flex-shrink-0 text-down" strokeWidth={1.75} />
            <p className="text-[13.5px] leading-relaxed text-ink">
              {describe(oauthError, locale)}
            </p>
          </div>
          {/* TICKRA-FIX: most magic-link failures (expired/Gmail-prefetch) are
              fixed by sending a fresh link. Surface a one-tap retry button. */}
          {oauthError !== 'oauth_not_configured' ? (
            <button
              type="button"
              onClick={() => {
                setOauthError(null);
                document.getElementById('email')?.focus();
              }}
              className="inline-flex h-9 w-fit items-center gap-2 rounded-full bg-ink px-4 text-[12.5px] font-medium text-canvas hover:brightness-110"
            >
              <RotateCcw aria-hidden className="h-3 w-3" strokeWidth={2} />
              {locale === 'fr' ? 'Recevoir un nouveau lien' : 'Send a new link'}
            </button>
          ) : null}
        </div>
      ) : null}

      {sent ? (
        <div className="mt-10 flex items-start gap-3 rounded-sm border border-line bg-elevated p-5">
          <Mail aria-hidden className="mt-0.5 h-5 w-5 flex-shrink-0 text-ink" strokeWidth={1.5} />
          <p className="text-[14.5px] leading-relaxed text-ink">{t.sent}</p>
        </div>
      ) : (
        <>
          <div className="mt-10">
            <GoogleButton
              locale={locale}
              label={locale === 'fr' ? 'Continuer avec Google' : 'Continue with Google'}
            />
          </div>
          <div className="my-7 flex items-center gap-4">
            <span aria-hidden className="h-px flex-1 bg-line" />
            <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-subtle">
              {locale === 'fr' ? 'ou par e‑mail' : 'or by email'}
            </span>
            <span aria-hidden className="h-px flex-1 bg-line" />
          </div>
          <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block font-mono text-[11px] uppercase tracking-[0.22em] text-muted"
            >
              {t.emailLabel}
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              placeholder={t.emailPlaceholder}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-3 block h-12 w-full rounded-sm border border-line bg-canvas px-4 text-[15px] text-ink placeholder:text-subtle focus-visible:border-ink focus-visible:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink px-6 text-[15px] font-medium tracking-tight text-canvas transition-colors hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {t.submit}
            <ArrowRight aria-hidden className="h-4 w-4" strokeWidth={1.75} />
          </button>
          </form>
          {/* TICKRA-PHASE-2.7: Passkeys (Web Authn) — biometric sign-in. */}
          <div className="my-7 flex items-center gap-4">
            <span aria-hidden className="h-px flex-1 bg-line" />
            <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-subtle">
              {locale === 'fr' ? 'ou via passkey' : 'or via passkey'}
            </span>
            <span aria-hidden className="h-px flex-1 bg-line" />
          </div>
          <PasskeySignIn locale={locale} />
        </>
      )}

      <div className="mt-10 border-t border-line pt-6">
        <p className="text-[13.5px] text-muted">
          {t.noAccount}{' '}
          <Link
            href={`/${locale}/onboarding`}
            className="text-ink underline underline-offset-4 decoration-line transition-colors hover:decoration-ink"
          >
            {t.createAccount}
          </Link>
          .
        </p>
        <p className="mt-3 font-mono text-[10.5px] uppercase tracking-[0.2em] text-subtle">
          {t.legal}
        </p>
      </div>
    </div>
  );
}
