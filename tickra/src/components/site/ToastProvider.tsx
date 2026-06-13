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
              className="pointer-events-auto flex w-full max-w-sm items-start gap-3 border border-black/15 bg-[#F4F1EA] p-4 text-[#0E0E0E] shadow-[0_18px_40px_-18px_rgba(14,14,14,0.35)]"
            >
              <Glyph tone={t.tone ?? 'default'} />
              <div className="min-w-0 flex-1">
                <div
                  className="font-display italic text-[#0E0E0E]"
                  style={{ fontSize: '16px', lineHeight: 1.2, letterSpacing: '-0.01em' }}
                >
                  {t.title}
                </div>
                {t.body ? (
                  <p className="mt-1.5 text-[13px] leading-relaxed text-black/70">{t.body}</p>
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
  // Editorial glyphs: a small square mark in ink, not a colored pill.
  // Success and error read in the same paper register; tone is carried
  // by the symbol, not by red/green colour.
  if (tone === 'success') {
    return (
      <span aria-hidden className="mt-1 flex h-4 w-4 flex-shrink-0 items-center justify-center border border-[#0E0E0E] text-[#0E0E0E]">
        <Check className="h-2.5 w-2.5" strokeWidth={2} />
      </span>
    );
  }
  if (tone === 'error') {
    return (
      <span aria-hidden className="mt-1 flex h-4 w-4 flex-shrink-0 items-center justify-center border border-[#0E0E0E] text-[#0E0E0E]">
        <X className="h-2.5 w-2.5" strokeWidth={2} />
      </span>
    );
  }
  return <span aria-hidden className="mt-1 h-4 w-4 flex-shrink-0 border border-black/30" />;
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) return { toast };
  return ctx;
}
