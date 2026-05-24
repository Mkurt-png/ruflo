'use client';

import { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import type { Dictionary } from '@/lib/i18n/dictionaries';

export function FooterNewsletter({ dict, locale }: { dict: Dictionary; locale: string }) {
  const t = dict.footerNewsletter;
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || pending) return;
    setPending(true);
    try {
      await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, locale }),
      });
    } catch {
      /* swallow */
    }
    setPending(false);
    setSent(true);
  };

  return (
    <div>
      <h3 className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">{t.title}</h3>
      {sent ? (
        <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-line bg-elevated px-4 py-2 text-[13px] text-ink">
          <Check aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} />
          {t.sent}
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-5 flex max-w-sm items-stretch gap-2">
          <input
            type="email"
            required
            value={email}
            placeholder={t.placeholder}
            aria-label={t.placeholder}
            onChange={(e) => setEmail(e.target.value)}
            className="h-10 min-w-0 flex-1 rounded-full border border-line bg-surface px-4 text-[13.5px] text-ink placeholder:text-subtle focus-visible:border-ink focus-visible:outline-none"
          />
          <button
            type="submit"
            disabled={pending}
            aria-label={t.submit}
            className="inline-flex h-10 flex-shrink-0 items-center justify-center gap-2 rounded-full bg-ink px-4 text-[13.5px] font-medium tracking-tight text-canvas transition-colors hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ArrowRight aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} />
          </button>
        </form>
      )}
    </div>
  );
}
