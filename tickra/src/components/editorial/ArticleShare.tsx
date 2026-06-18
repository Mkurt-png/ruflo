'use client';

import { useState } from 'react';
import { Check, Copy, Linkedin, Twitter } from 'lucide-react';

type Props = {
  title: string;
  url: string;
  copyLabel: string;
  copiedLabel: string;
  /** Optional aria-label for the X/Twitter share link. Defaults to
   * English when omitted to preserve existing callers. */
  shareXLabel?: string;
  /** Optional aria-label for the LinkedIn share link. */
  shareLinkedInLabel?: string;
};

export function ArticleShare({
  title,
  url,
  copyLabel,
  copiedLabel,
  shareXLabel = 'Share on X',
  shareLinkedInLabel = 'Share on LinkedIn',
}: Props) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard not available */
    }
  };

  const xUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
  const liUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;

  return (
    <div className="flex items-center gap-2">
      <ShareLink href={xUrl} label={shareXLabel}>
        <Twitter aria-hidden className="h-4 w-4" strokeWidth={1.6} />
      </ShareLink>
      <ShareLink href={liUrl} label={shareLinkedInLabel}>
        <Linkedin aria-hidden className="h-4 w-4" strokeWidth={1.6} />
      </ShareLink>
      <button
        type="button"
        onClick={onCopy}
        aria-label={copied ? copiedLabel : copyLabel}
        className="inline-flex h-9 items-center gap-2 rounded-full border border-line px-3.5 font-mono text-[11px] uppercase tracking-[0.18em] text-muted transition-colors hover:border-ink hover:text-ink"
      >
        {copied ? (
          <Check aria-hidden className="h-3.5 w-3.5" strokeWidth={2} />
        ) : (
          <Copy aria-hidden className="h-3.5 w-3.5" strokeWidth={1.6} />
        )}
        {copied ? copiedLabel : copyLabel}
      </button>
    </div>
  );
}

function ShareLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-ink hover:text-ink"
    >
      {children}
    </a>
  );
}
