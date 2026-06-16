'use client';

import { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import type { Dictionary } from '@/lib/i18n/dictionaries';

export function ContactForm({ dict }: { dict: Dictionary }) {
  const t = dict.contact.form;
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    const form = e.currentTarget;
    const data = new FormData(form);
    const payload = {
      name: String(data.get('name') ?? ''),
      email: String(data.get('email') ?? ''),
      subject: String(data.get('subject') ?? ''),
      message: String(data.get('message') ?? ''),
    };
    try {
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch {
      /* swallow — we still acknowledge so users aren't blocked */
    }
    setPending(false);
    setSent(true);
  };

  if (sent) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex items-start gap-3 rounded-sm border border-line bg-elevated p-6"
      >
        <Check aria-hidden className="mt-0.5 h-5 w-5 flex-shrink-0 text-ink" strokeWidth={1.75} />
        <p className="text-[15px] leading-relaxed text-ink">{t.sent}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-sm border border-line bg-surface p-6 md:p-8">
      <Field id="name" label={t.nameLabel} autoComplete="name" required />
      <Field id="email" label={t.emailLabel} type="email" autoComplete="email" required />
      <Field id="subject" label={t.subjectLabel} required />
      <div>
        <label htmlFor="message" className="block font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
          {t.messageLabel}
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={6}
          className="mt-3 block w-full rounded-sm border border-line bg-canvas px-4 py-3 text-[15px] text-ink placeholder:text-subtle focus-visible:border-ink focus-visible:outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-ink px-6 text-[15px] font-medium tracking-tight text-canvas transition-colors hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {t.submit}
        <ArrowRight aria-hidden className="h-4 w-4" strokeWidth={1.75} />
      </button>
    </form>
  );
}

function Field({
  id,
  label,
  type = 'text',
  autoComplete,
  required,
}: {
  id: string;
  label: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block font-mono text-[11px] uppercase tracking-[0.22em] text-muted"
      >
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        required={required}
        className="mt-3 block h-12 w-full rounded-sm border border-line bg-canvas px-4 text-[15px] text-ink placeholder:text-subtle focus-visible:border-ink focus-visible:outline-none"
      />
    </div>
  );
}
