'use client';

// ScopeSync — binds client-side stores (progress, XP, bookmarks, notes)
// to the signed-in account. Fetches /api/me once per page load and tells
// the scope module who is here; stores listening on SCOPE_EVENT re-read
// their now-account-specific keys. Renders nothing.

import { useEffect } from 'react';
import { setScopeFromEmail } from '@/lib/progress/scope';

export function ScopeSync() {
  useEffect(() => {
    let cancelled = false;
    fetch('/api/me', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data: { user: { email: string } | null }) => {
        if (!cancelled) setScopeFromEmail(data.user?.email ?? null);
      })
      .catch(() => {
        /* offline — keep current scope */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}

export default ScopeSync;
