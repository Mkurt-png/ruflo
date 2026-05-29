'use client';

// TICKRA-SPRINT-C: XP + level pill. Listens to a custom event so it updates
// instantly when a quest is claimed elsewhere on the page.

import { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import { deriveLevel, readXp } from '@/lib/progress/xp';

type Locale = 'fr' | 'en';

const copy = {
  fr: { level: 'Niveau', xp: 'XP' },
  en: { level: 'Level', xp: 'XP' },
};

export function XpBadge({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const refresh = () => setTotal(readXp().total);
    refresh();
    const onChange = () => refresh();
    window.addEventListener('tickra-xp-changed', onChange);
    window.addEventListener('storage', onChange);
    const id = setInterval(refresh, 15_000);
    return () => {
      window.removeEventListener('tickra-xp-changed', onChange);
      window.removeEventListener('storage', onChange);
      clearInterval(id);
    };
  }, []);

  const lvl = deriveLevel(total);

  return (
    <article className="rounded-sm border border-line bg-surface p-5">
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
          <Trophy aria-hidden className="h-3.5 w-3.5 text-brand" strokeWidth={1.75} />
          {t.level} {lvl.level}
        </div>
        <div className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-subtle tabular-nums">
          {total} {t.xp}
        </div>
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-line">
        <div
          className="h-full bg-brand glow-brand transition-all duration-500"
          style={{ width: `${lvl.pct}%` }}
        />
      </div>
      <div className="mt-2 text-right font-mono text-[10px] uppercase tracking-[0.18em] text-subtle tabular-nums">
        {lvl.intoLevel} / {lvl.needed}
      </div>
    </article>
  );
}
