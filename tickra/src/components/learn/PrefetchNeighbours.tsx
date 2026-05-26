'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Triggers Next.js router prefetch for the previous + next lesson once the
// current lesson is interactive. Prefetching is best-effort — Next.js silently
// no-ops on bots/no-prefetch headers.

type Props = {
  hrefs: string[];
};

export function PrefetchNeighbours({ hrefs }: Props) {
  const router = useRouter();

  useEffect(() => {
    const filtered = hrefs.filter(Boolean);
    if (filtered.length === 0) return;
    // Give the page a beat to paint before warming the cache.
    const id = window.setTimeout(() => {
      for (const href of filtered) router.prefetch(href);
    }, 600);
    return () => window.clearTimeout(id);
  }, [hrefs, router]);

  return null;
}
