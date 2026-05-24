import { ShieldCheck, CreditCard, Server } from 'lucide-react';
import type { Dictionary } from '@/lib/i18n/dictionaries';

export function TrustBar({ dict }: { dict: Dictionary }) {
  const t = dict.pricing.trust;
  const items = [
    { icon: ShieldCheck, label: t.stripe },
    { icon: CreditCard, label: t.cards },
    { icon: Server, label: t.eu },
  ];
  return (
    <ul className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {items.map(({ icon: Icon, label }) => (
        <li
          key={label}
          className="flex items-center gap-4 rounded-sm border border-line bg-surface p-5"
        >
          <Icon aria-hidden className="h-5 w-5 flex-shrink-0 text-ink" strokeWidth={1.5} />
          <span className="text-[14px] text-ink">{label}</span>
        </li>
      ))}
    </ul>
  );
}
