// TrustBar — small horizontal strip of 3-4 trust signals to display above
// the fold on pricing / signup / paid pages. Each signal is a single line:
// icon + bold value + small caption. No promises, just facts we can defend.

import { ShieldCheck, RefreshCcw, Lock, BadgeCheck } from 'lucide-react';
import type { Locale } from '@/lib/i18n/config';

type Item = {
  icon: 'shield' | 'refresh' | 'lock' | 'badge';
  value: string;
  caption: string;
};

const ICONS = {
  shield: ShieldCheck,
  refresh: RefreshCcw,
  lock: Lock,
  badge: BadgeCheck,
} as const;

const COPY = {
  fr: [
    { icon: 'refresh',  value: '14 jours', caption: 'satisfait ou remboursé · sans question' },
    { icon: 'shield',   value: 'Éducation', caption: 'pas de signal · pas de conseil · non inscrit AMF' },
    { icon: 'badge',    value: 'Annulable',  caption: 'en deux clics · zéro friction' },
    { icon: 'lock',     value: 'Données',    caption: 'chiffrées · jamais revendues' },
  ] as Item[],
  en: [
    { icon: 'refresh',  value: '14-day',     caption: 'money-back · no questions asked' },
    { icon: 'shield',   value: 'Education', caption: 'no signals · no advice · not AMF-registered' },
    { icon: 'badge',    value: 'Cancel',     caption: 'in two clicks · zero friction' },
    { icon: 'lock',     value: 'Encrypted',  caption: 'never sold · never shared' },
  ] as Item[],
} as const;

export function TrustBar({ locale, className = '' }: { locale: Locale; className?: string }) {
  const items = COPY[locale];
  return (
    <ul
      className={`grid grid-cols-2 gap-3 sm:grid-cols-4 ${className}`}
      aria-label={locale === 'fr' ? 'Signaux de confiance' : 'Trust signals'}
    >
      {items.map((item) => {
        const Icon = ICONS[item.icon];
        return (
          <li
            key={item.value}
            className="flex items-center gap-3 rounded-md border border-line bg-surface px-3.5 py-3"
          >
            <Icon aria-hidden className="h-4 w-4 shrink-0 text-brand" strokeWidth={1.75} />
            <div className="min-w-0">
              <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink">{item.value}</div>
              <div className="truncate text-[11.5px] text-muted">{item.caption}</div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default TrustBar;
