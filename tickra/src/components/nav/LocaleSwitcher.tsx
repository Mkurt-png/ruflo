'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useTransition } from 'react';
import { locales, type Locale } from '@/lib/i18n/config';
import { cn } from '@/lib/cn';

type Props = { current: Locale; label: string };

export function LocaleSwitcher({ current, label }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const switchTo = (next: Locale) => {
    if (next === current) return;
    void fetch('/api/locale', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ locale: next }),
    });
    const segments = pathname.split('/');
    segments[1] = next;
    startTransition(() => router.replace(segments.join('/') || `/${next}`));
  };

  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        'inline-flex h-9 items-center rounded-full border border-line p-0.5 font-mono text-[11px] uppercase tracking-[0.15em]',
        isPending && 'opacity-60',
      )}
    >
      {locales.map((loc) => {
        const active = loc === current;
        return (
          <button
            key={loc}
            type="button"
            onClick={() => switchTo(loc)}
            aria-pressed={active}
            className={cn(
              'h-full rounded-full px-2.5 transition-colors',
              active ? 'bg-ink text-canvas' : 'text-muted hover:text-ink',
            )}
          >
            {loc}
          </button>
        );
      })}
    </div>
  );
}
