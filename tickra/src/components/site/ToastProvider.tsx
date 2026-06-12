'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { easeOutExpo } from '@/lib/motion';

export type Toast = {
  id: number;
  title: string;
  body?: string;
  tone?: 'default' | 'success' | 'error';
  duration?: number;
};

type Ctx = {
  toast: (t: Omit<Toast, 'id'>) => void;
};

const ToastContext = createContext<Ctx | null>(null);

let nextId = 1;
type Listener = (t: Omit<Toast, 'id'>) => void;
const listeners = new Set<Listener>();

// Module-level helper so any client component can fire a toast without props.
export function toast(t: Omit<Toast, 'id'>) {
  for (const l of listeners) l(t);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);

  useEffect(() => {
    const listener: Listener = (t) => {
      const id = nextId++;
      const next: Toast = { id, tone: 'default', duration: 3500, ...t };
      setItems((prev) => [...prev, next]);
      window.setTimeout(() => {
        setItems((prev) => prev.filter((p) => p.id !== id));
      }, next.duration);
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const fire = useCallback((t: Omit<Toast, 'id'>) => toast(t), []);

  return (
    <ToastContext.Provider value={{ toast: fire }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4 md:bottom-6"
      >
        <AnimatePresence>
          {items.map((t) => (
            <motion.div
              key={t.id}
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 8, opacity: 0 }}
              transition={{ duration: 0.35, ease: easeOutExpo }}
              role="status"
              className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-sm border border-line bg-surface p-4 shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
            >
              <Glyph tone={t.tone ?? 'default'} />
              <div className="min-w-0 flex-1">
                <div className="font-display text-[15px] font-medium tracking-tight text-ink">
                  {t.title}
                </div>
                {t.body ? (
                  <p className="mt-1 text-[13.5px] leading-relaxed text-muted">{t.body}</p>
                ) : null}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

function Glyph({ tone }: { tone: 'default' | 'success' | 'error' }) {
  if (tone === 'success') {
    return (
      <span
        aria-hidden
        className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-up text-canvas"
      >
        <Check className="h-3 w-3" strokeWidth={2.5} />
      </span>
    );
  }
  if (tone === 'error') {
    return (
      <span
        aria-hidden
        className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-down text-canvas"
      >
        <X className="h-3 w-3" strokeWidth={2.5} />
      </span>
    );
  }
  return <span aria-hidden className="mt-0.5 h-5 w-5 flex-shrink-0 rounded-full border border-line" />;
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) return { toast };
  return ctx;
}
