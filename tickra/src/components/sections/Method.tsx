import { Crosshair, Flame, CandlestickChart } from 'lucide-react';
import type { Dictionary } from '@/lib/i18n/dictionaries';

type Props = { dict: Dictionary };

// TICKRA-REDESIGN: Three steps timeline on surface-warm.
export function Method({ dict }: Props) {
  const t = dict.method;

  const icons = [Crosshair, Flame, CandlestickChart];

  return (
    <section id="method" aria-labelledby="method-title" className="bg-surface-warm py-24">
      <div className="mx-auto w-full max-w-container px-6 md:px-10">
        <div id="method-title">
          <p className="text-navy-900 text-xs font-medium uppercase tracking-widest">{t.eyebrow}</p>
          <h2 className="text-navy-900 text-4xl font-medium mt-2 mb-16">{t.title}</h2>
        </div>

        <ol className="relative grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          {/* Horizontal connector — desktop only */}
          <span
            aria-hidden
            className="hidden md:block absolute top-7 left-[16.66%] right-[16.66%] h-px bg-navy-900/20"
          />

          {t.steps.map((step, i) => {
            const Icon = icons[i] ?? Crosshair;
            return (
              <li key={step.index} className="relative flex flex-col items-center text-center">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full bg-navy-900 text-white flex items-center justify-center text-lg font-medium mx-auto relative z-10">
                    <Icon aria-hidden className="h-6 w-6" strokeWidth={1.75} />
                  </div>
                  <span
                    aria-hidden
                    className="absolute -top-1 -right-3 text-[11px] font-mono text-navy-900/60"
                  >
                    {step.index}
                  </span>
                </div>
                <h3 className="text-lg font-medium text-text-primary mt-4 text-center">
                  {step.title}
                </h3>
                <p className="text-sm text-text-secondary mt-2 text-center leading-relaxed max-w-xs mx-auto">
                  {step.body}
                </p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
