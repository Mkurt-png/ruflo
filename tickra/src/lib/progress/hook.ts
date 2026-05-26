'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'tickra-progress-v1';
const SERVER_SYNCED_KEY = 'tickra-progress-server-synced-v1';

export type Mistake = {
  lessonId: string;
  loggedAt: number;
  reviewedAt?: number;
};

export type ProgressState = {
  completed: Record<string, number>;
  mistakes?: Record<string, Mistake>;
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

function mergeServer(local: ProgressState, server: ProgressState): ProgressState {
  const completed: Record<string, number> = { ...local.completed };
  for (const [k, v] of Object.entries(server.completed)) {
    // Keep the earliest known completion timestamp.
    if (!completed[k] || v < completed[k]) completed[k] = v;
  }
  const mistakes: Record<string, Mistake> = { ...(local.mistakes ?? {}) };
  for (const [k, v] of Object.entries(server.mistakes ?? {})) {
    const existing = mistakes[k];
    if (!existing) mistakes[k] = v;
    else {
      mistakes[k] = {
        lessonId: v.lessonId,
        loggedAt: Math.min(existing.loggedAt, v.loggedAt),
        reviewedAt:
          existing.reviewedAt && v.reviewedAt
            ? Math.max(existing.reviewedAt, v.reviewedAt)
            : existing.reviewedAt ?? v.reviewedAt,
      };
    }
  }
  return { completed, mistakes };
}

export function useProgress() {
  const [state, setState] = useState<ProgressState>(empty);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setState(read());
    setReady(true);

    // Cross-tab sync.
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setState(read());
    };
    window.addEventListener('storage', onStorage);

    // Server sync — only the first time per session so we don't fight
    // optimistic local writes.
    let cancelled = false;
    (async () => {
      const alreadySynced = (() => {
        try {
          return window.sessionStorage.getItem(SERVER_SYNCED_KEY) === '1';
        } catch {
          return false;
        }
      })();
      if (alreadySynced) return;
      try {
        const res = await fetch('/api/progress', { cache: 'no-store' });
        if (!res.ok) return;
        const data = (await res.json()) as { completed?: Record<string, number>; mistakes?: Record<string, Mistake>; configured?: boolean };
        if (cancelled || !data?.configured) return;
        const merged = mergeServer(read(), {
          completed: data.completed ?? {},
          mistakes: data.mistakes ?? {},
        });
        write(merged);
        setState(merged);
        try {
          window.sessionStorage.setItem(SERVER_SYNCED_KEY, '1');
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
          [lessonId]: { lessonId, loggedAt: existing?.loggedAt ?? Date.now() },
        },
      };
      write(next);
      return next;
    });
    if (typeof window !== 'undefined') {
      fetch('/api/progress/mistake', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ lessonId }),
        keepalive: true,
      }).catch(() => {
        /* swallow */
      });
    }
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
    if (typeof window !== 'undefined') {
      fetch('/api/progress/reviewed', {
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

  return { state, ready, markComplete, isComplete, completedCount, reset, logMistake, markReviewed };
}
