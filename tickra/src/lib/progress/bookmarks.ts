'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'tickra-bookmarks-v1';
const SYNCED_KEY = 'tickra-bookmarks-server-synced-v1';

export type BookmarksState = {
  bookmarks: Record<string, number>; // lessonId → bookmarked timestamp
};

const empty: BookmarksState = { bookmarks: {} };

function read(): BookmarksState {
  if (typeof window === 'undefined') return empty;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as BookmarksState;
    if (!parsed?.bookmarks) return empty;
    return parsed;
  } catch {
    return empty;
  }
}

function write(state: BookmarksState) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function merge(local: BookmarksState, server: Record<string, number>): BookmarksState {
  const out: Record<string, number> = { ...local.bookmarks };
  for (const [k, v] of Object.entries(server)) {
    if (!out[k] || v < out[k]) out[k] = v;
  }
  return { bookmarks: out };
}

export function useBookmarks() {
  const [state, setState] = useState<BookmarksState>(empty);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setState(read());
    setReady(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setState(read());
    };
    window.addEventListener('storage', onStorage);

    let cancelled = false;
    (async () => {
      const already = (() => {
        try {
          return window.sessionStorage.getItem(SYNCED_KEY) === '1';
        } catch {
          return false;
        }
      })();
      if (already) return;
      try {
        const res = await fetch('/api/bookmarks', { cache: 'no-store' });
        if (!res.ok) return;
        const data = (await res.json()) as { bookmarks?: Record<string, number>; configured?: boolean };
        if (cancelled || !data?.configured) return;
        const merged = merge(read(), data.bookmarks ?? {});
        write(merged);
        setState(merged);
        try {
          window.sessionStorage.setItem(SYNCED_KEY, '1');
        } catch {
          /* ignore */
        }
      } catch {
        /* offline / 401 — keep local state */
      }
    })();

    return () => {
      window.removeEventListener('storage', onStorage);
      cancelled = true;
    };
  }, []);

  const toggle = useCallback((lessonId: string) => {
    setState((prev) => {
      const next = { ...prev.bookmarks };
      const on = !next[lessonId];
      if (on) next[lessonId] = Date.now();
      else delete next[lessonId];
      const out = { bookmarks: next };
      write(out);
      if (typeof window !== 'undefined') {
        fetch('/api/bookmarks', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ lessonId, on }),
          keepalive: true,
        }).catch(() => {
          /* swallow */
        });
      }
      return out;
    });
  }, []);

  const isBookmarked = useCallback(
    (lessonId: string) => Boolean(state.bookmarks[lessonId]),
    [state.bookmarks],
  );

  return { state, ready, toggle, isBookmarked };
}
