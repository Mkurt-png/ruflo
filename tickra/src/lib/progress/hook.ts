'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'tickra-progress-v1';

export type ProgressState = {
  completed: Record<string, number>; // lessonId → completion timestamp
};

const empty: ProgressState = { completed: {} };

function read(): ProgressState {
  if (typeof window === 'undefined') return empty;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as ProgressState;
    if (!parsed || typeof parsed !== 'object' || !parsed.completed) return empty;
    return parsed;
  } catch {
    return empty;
  }
}

function write(state: ProgressState) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* quota or private mode — silently degrade */
  }
}

export function useProgress() {
  const [state, setState] = useState<ProgressState>(empty);
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

  const markComplete = useCallback((lessonId: string) => {
    setState((prev) => {
      const next: ProgressState = {
        completed: { ...prev.completed, [lessonId]: Date.now() },
      };
      write(next);
      return next;
    });
    // Fire-and-forget server sync. Server returns 401 when no session, or
    // {persisted:false} when the DB isn't configured — both fine, localStorage
    // remains the source of truth.
    if (typeof window !== 'undefined') {
      fetch('/api/progress', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ lessonId }),
        keepalive: true,
      }).catch(() => {
        /* swallow */
      });
    }
  }, []);

  const isComplete = useCallback(
    (lessonId: string) => Boolean(state.completed[lessonId]),
    [state.completed],
  );

  const completedCount = Object.keys(state.completed).length;

  const reset = useCallback(() => {
    setState(empty);
    write(empty);
  }, []);

  return { state, ready, markComplete, isComplete, completedCount, reset };
}
