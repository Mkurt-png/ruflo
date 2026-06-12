import { SectionHeader } from '@/components/ui/SectionHeader';
import type { Dictionary } from '@/lib/i18n/dictionaries';

export function PricingCompare({ dict }: { dict: Dictionary }) {
  const t = dict.pricing;
  return (
    <div>
      <SectionHeader eyebrow={t.eyebrow} title={t.compare.title} />

      <div className="mt-16 overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <thead>
            <tr className="border-b border-line">
              <th className="py-5 pr-6 font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
                &nbsp;
              </th>
              {t.plans.map((p) => (
                <th
                  key={p.id}
                  className="py-5 pr-6 font-display text-lg font-medium tracking-tight text-ink"
                >
                  {p.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {t.compare.rows.map((row) => (
              <tr key={row.label} className="border-b border-line">
                <th
                  scope="row"
                  className="py-5 pr-6 align-top text-[14.5px] font-normal text-ink"
                >
                  {row.label}
                </th>
                <td className="py-5 pr-6 align-top text-[14.5px] text-muted">{row.free}</td>
                <td className="py-5 pr-6 align-top text-[14.5px] text-ink">{row.pro}</td>
                <td className="py-5 pr-6 align-top text-[14.5px] text-muted">{row.lifetime}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
