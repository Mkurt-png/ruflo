'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/lib/theme/ThemeProvider';

type Props = { labelLight: string; labelDark: string };

export function ThemeToggle({ labelLight, labelDark }: Props) {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? labelLight : labelDark}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink transition-colors hover:bg-ink hover:text-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
    >
      {isDark ? (
        <Sun aria-hidden className="h-4 w-4" strokeWidth={1.75} />
      ) : (
        <Moon aria-hidden className="h-4 w-4" strokeWidth={1.75} />
      )}
    </button>
  );
}
