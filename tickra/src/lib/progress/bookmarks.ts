'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'tickra-bookmarks-v1';

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
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const toggle = useCallback((lessonId: string) => {
    setState((prev) => {
      const next = { ...prev.bookmarks };
      if (next[lessonId]) delete next[lessonId];
      else next[lessonId] = Date.now();
      const out = { bookmarks: next };
      write(out);
      return out;
    });
  }, []);

  const isBookmarked = useCallback(
    (lessonId: string) => Boolean(state.bookmarks[lessonId]),
    [state.bookmarks],
  );

  return { state, ready, toggle, isBookmarked };
}
