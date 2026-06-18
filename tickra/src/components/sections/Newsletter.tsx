'use client';

import { useState } from 'react';
import { ArrowRight, Check, FileText } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Eyebrow } from '@/components/ui/Eyebrow';
import type { Dictionary } from '@/lib/i18n/dictionaries';

export function Newsletter({ dict, locale }: { dict: Dictionary; locale?: string }) {
  const t = dict.newsletter;
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
      /* swallow — still acknowledge */
    }
    setPending(false);
    setSent(true);
  };

  return (
    <section aria-labelledby="newsletter-title" className="border-b border-line bg-elevated">
      <Container as="div" className="grid grid-cols-12 gap-x-6 gap-y-12 py-24 md:py-32">
        <div className="col-span-12 lg:col-span-6">
          <Eyebrow>{t.eyebrow}</Eyebrow>
          <h2
            id="newsletter-title"
            className="mt-6 font-display text-display-md font-medium tracking-tight text-balance text-ink"
          >
            {t.title}
          </h2>
          <p className="mt-6 max-w-md text-pretty text-[16px] leading-relaxed text-muted">{t.body}</p>
        </div>

        <div className="col-span-12 lg:col-span-5 lg:col-start-8">
          <div className="rounded-sm border border-line bg-surface p-6 md:p-8">
            <PdfPreview filename={t.pdfFilename} meta={t.pdfMeta} />

            {sent ? (
              <div
                role="status"
                aria-live="polite"
                className="mt-6 flex items-start gap-3 rounded-sm border border-line bg-elevated p-5"
              >
                <Check
                  aria-hidden
                  className="mt-0.5 h-5 w-5 flex-shrink-0 text-ink"
                  strokeWidth={1.75}
                />
                <p className="text-[14.5px] leading-relaxed text-ink">{t.sent}</p>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="newsletter-email"
                    className="block font-mono text-[11px] uppercase tracking-[0.22em] text-muted"
                  >
                    {t.emailLabel}
                  </label>
                  <input
                    id="newsletter-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    placeholder={t.emailPlaceholder}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-3 block h-12 w-full rounded-sm border border-line bg-canvas px-4 text-[15px] text-ink placeholder:text-subtle focus-visible:border-ink focus-visible:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={pending}
                  aria-busy={pending}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink px-6 text-[15px] font-medium tracking-tight text-canvas transition-colors hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {t.submit}
                  <ArrowRight aria-hidden className="h-4 w-4" strokeWidth={1.75} />
                </button>
              </form>
            )}

            <p className="mt-5 font-mono text-[10.5px] uppercase tracking-[0.2em] text-subtle">
              {t.legal}
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}

function PdfPreview({ filename, meta }: { filename: string; meta: string }) {
  return (
    <div className="flex items-center gap-4 rounded-sm border border-line bg-canvas p-4">
      <span
        aria-hidden
        className="flex h-12 w-10 flex-shrink-0 items-center justify-center rounded-sm border border-line bg-surface"
      >
        <FileText className="h-5 w-5 text-ink" strokeWidth={1.5} />
      </span>
      <div className="min-w-0">
        <div className="truncate font-display text-[15px] font-medium tracking-tight text-ink">
          {filename}
        </div>
        <div className="mt-1 font-mono text-[10.5px] uppercase tracking-[0.2em] text-muted">
          {meta}
        </div>
      </div>
    </div>
  );
}
