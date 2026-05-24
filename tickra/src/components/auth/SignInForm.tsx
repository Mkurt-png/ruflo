'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Mail } from 'lucide-react';
import { Eyebrow } from '@/components/ui/Eyebrow';
import type { Dictionary } from '@/lib/i18n/dictionaries';
import type { Locale } from '@/lib/i18n/config';

export function SignInForm({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const t = dict.signin;
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || pending) return;
    setPending(true);
    // Placeholder — wire to /api/auth/magic-link when backend is ready.
    await new Promise((r) => setTimeout(r, 500));
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

      {sent ? (
        <div className="mt-10 flex items-start gap-3 rounded-sm border border-line bg-elevated p-5">
          <Mail aria-hidden className="mt-0.5 h-5 w-5 flex-shrink-0 text-ink" strokeWidth={1.5} />
          <p className="text-[14.5px] leading-relaxed text-ink">{t.sent}</p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-10 space-y-5">
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
