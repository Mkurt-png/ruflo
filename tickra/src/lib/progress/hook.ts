'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'tickra-progress-v1';

export type Mistake = {
  lessonId: string;
  loggedAt: number;             // when the user missed
  reviewedAt?: number;          // last time the user reviewed it
};

export type ProgressState = {
  completed: Record<string, number>;       // lessonId → completion timestamp
  mistakes?: Record<string, Mistake>;      // lessonId → mistake meta
};

const empty: ProgressState = { completed: {}, mistakes: {} };

function read(): ProgressState {
  if (typeof window === 'undefined') return empty;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as ProgressState;
    if (!parsed || typeof parsed !== 'object' || !parsed.completed) return empty;
    return { completed: parsed.completed, mistakes: parsed.mistakes ?? {} };
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
        ...prev,
        completed: { ...prev.completed, [lessonId]: Date.now() },
      };
      write(next);
      return next;
    });
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

  const logMistake = useCallback((lessonId: string) => {
    setState((prev) => {
      const existing = prev.mistakes?.[lessonId];
      const next: ProgressState = {
        ...prev,
        mistakes: {
          ...(prev.mistakes ?? {}),
          [lessonId]: {
            lessonId,
            // Don't reset the original loggedAt if the user keeps missing.
            loggedAt: existing?.loggedAt ?? Date.now(),
          },
        },
      };
      write(next);
      return next;
    });
  }, []);

  const markReviewed = useCallback((lessonId: string) => {
    setState((prev) => {
      const existing = prev.mistakes?.[lessonId];
      if (!existing) return prev;
      const next: ProgressState = {
        ...prev,
        mistakes: {
          ...prev.mistakes,
          [lessonId]: { ...existing, reviewedAt: Date.now() },
        },
      };
      write(next);
      return next;
    });
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

  return { state, ready, markComplete, isComplete, completedCount, reset, logMistake, markReviewed };
}
