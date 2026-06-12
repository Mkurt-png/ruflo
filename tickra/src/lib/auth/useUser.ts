'use client';

import { useEffect, useState } from 'react';

export type CurrentUser = { email: string } | null;
export type Plan = 'free' | 'pro' | 'lifetime';

export function useUser() {
  const [user, setUser] = useState<CurrentUser>(null);
  const [plan, setPlan] = useState<Plan>('free');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/me', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data: { user: CurrentUser; plan?: Plan }) => {
        if (cancelled) return;
        setUser(data.user);
        setPlan(data.plan ?? 'free');
        setReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        setUser(null);
        setPlan('free');
        setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { user, plan, ready };
}
