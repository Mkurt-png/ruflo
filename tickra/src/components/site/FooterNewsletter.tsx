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
      <h3 className="font-mono text-[10px] uppercase tracking-[0.34em] text-black/55">{t.title}</h3>
      {sent ? (
        <div
          role="status"
          aria-live="polite"
          className="mt-5 inline-flex items-center gap-2 border border-black/15 px-4 py-2 text-[13px] text-[#0E0E0E]"
        >
          <Check aria-hidden className="h-3.5 w-3.5" strokeWidth={1.5} />
          {t.sent}
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-5 flex max-w-sm items-stretch gap-3 border-b border-black/25 pb-2">
          <input
            type="email"
            required
            value={email}
            placeholder={t.placeholder}
            aria-label={t.placeholder}
            onChange={(e) => setEmail(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-[14px] text-[#0E0E0E] placeholder:text-black/45 focus-visible:outline-none"
          />
          <button
            type="submit"
            disabled={pending}
            aria-label={t.submit}
            className="font-mono text-[10.5px] uppercase tracking-[0.34em] text-[#0E0E0E] hover:text-black/65 transition-colors disabled:cursor-not-allowed disabled:opacity-60 inline-flex items-center gap-1.5"
          >
            {t.submit}
            <ArrowRight aria-hidden className="h-3 w-3" strokeWidth={1.5} />
          </button>
        </form>
      )}
    </div>
  );
}
