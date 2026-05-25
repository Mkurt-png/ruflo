'use client';

import { useEffect, useState } from 'react';

export type CurrentUser = { email: string } | null;

export function useUser() {
  const [user, setUser] = useState<CurrentUser>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/me', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data: { user: CurrentUser }) => {
        if (cancelled) return;
        setUser(data.user);
        setReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        setUser(null);
        setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { user, ready };
}
