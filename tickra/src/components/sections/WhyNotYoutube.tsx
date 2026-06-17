import { Check, Minus } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { cn } from '@/lib/cn';
import type { Dictionary } from '@/lib/i18n/dictionaries';

export function WhyNotYoutube({ dict }: { dict: Dictionary }) {
  const t = dict.whyNot;
  const tickraIdx = t.columns.length - 1;

  return (
    <section aria-labelledby="whynot-title" className="border-b border-line">
      <Container as="div" className="py-24 md:py-32">
        <div id="whynot-title">
          <SectionHeader eyebrow={t.eyebrow} title={t.title} body={t.body} align="between" />
        </div>

        <div className="mt-20 overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <caption className="sr-only">{t.title}</caption>
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className="py-5 pr-6 font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
                  &nbsp;
                </th>
                {t.columns.map((c, i) => (
                  <th
                    key={c}
                    scope="col"
                    className={cn(
                      'py-5 pr-6 font-display text-lg font-medium tracking-tight',
                      i === tickraIdx ? 'text-ink' : 'text-muted',
                    )}
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {t.rows.map((row) => (
                <tr key={row.label} className="border-b border-line">
                  <th
                    scope="row"
                    className="py-5 pr-6 align-top text-[14.5px] font-normal text-ink"
                  >
                    {row.label}
                  </th>
                  {row.values.map((v, i) => (
                    <td
                      key={i}
                      className={cn(
                        'py-5 pr-6 align-top text-[14.5px]',
                        i === tickraIdx
                          ? 'font-medium text-ink'
                          : v === '—'
                            ? 'text-subtle'
                            : 'text-muted',
                      )}
                    >
                      <span className="inline-flex items-center gap-2">
                        {i === tickraIdx ? (
                          <Check aria-hidden className="h-3.5 w-3.5 text-ink" strokeWidth={2} />
                        ) : v === '—' ? (
                          <Minus aria-hidden className="h-3.5 w-3.5 text-subtle" strokeWidth={1.5} />
                        ) : null}
                        {v}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-10 max-w-2xl text-[14px] leading-relaxed text-muted">{t.footnote}</p>
      </Container>
    </section>
  );
}
