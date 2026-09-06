import Link from 'next/link';
import type { Dictionary } from '@/lib/i18n/dictionaries';
import type { Locale } from '@/lib/i18n/config';

type Props = { dict: Dictionary; locale: Locale };

type Level = 'Foundations' | 'Intermediate' | 'Advanced' | 'Mastery';

const LEVEL_STYLES: Record<Level, string> = {
  Foundations: 'bg-[#EAF3DE] text-[#27500A]',
  Intermediate: 'bg-[#E6F1FB] text-[#0C447C]',
  Advanced: 'bg-[#EEEDFE] text-[#3C3489]',
  Mastery: 'bg-[#FAEEDA] text-[#633806]',
};

// TICKRA-REDESIGN: 15-card track grid with level color-coding.
export function CurriculumPreview({ dict, locale }: Props) {
  const t = dict.curriculumPreview;
  return (
    <section
      aria-labelledby="curriculum-preview-title"
      className="bg-surface py-24"
    >
      <div className="mx-auto w-full max-w-container px-6 md:px-10">
        <div id="curriculum-preview-title">
          <p className="text-ink text-xs font-medium uppercase tracking-widest">{t.eyebrow}</p>
          <h2 className="text-ink text-3xl md:text-4xl font-medium mt-2 max-w-3xl">
            {t.title}
          </h2>
          <p className="text-text-secondary text-base mt-4 max-w-2xl">{t.body}</p>
        </div>

        <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-12">
          {t.tracks.map((track, i) => {
            const level = (track.level as Level) ?? 'Foundations';
            const badge = LEVEL_STYLES[level] ?? LEVEL_STYLES.Foundations;
            const num = String(i + 1).padStart(2, '0');
            return (
              <li
                key={track.name}
                className="bg-surface border border-line rounded-xl p-5 hover:border-line transition-colors"
              >
                <div className="flex justify-between items-start">
                  <span aria-hidden className="text-subtle font-medium text-3xl leading-none">
                    {num}
                  </span>
                  <span
                    className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${badge}`}
                  >
                    {level}
                  </span>
                </div>
                <h3 className="text-base font-medium text-text-primary mt-2">{track.name}</h3>
                <p className="text-sm text-text-secondary mt-1">× {track.count} lessons</p>
                <div
                  aria-hidden
                  className="h-1 rounded-full bg-gray-100 mt-4"
                />
              </li>
            );
          })}
        </ol>

        <div className="mt-10">
          <Link
            href={`/${locale}/pricing`}
            className="inline-flex items-center gap-2 text-accent-blue text-sm font-medium hover:text-accent-blue-hover transition-colors"
          >
            {t.cta} <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
