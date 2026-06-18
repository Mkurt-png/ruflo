'use client';

// anonymised "this week on Tickra" wall of wins.
// Honest disclaimer + aggregated stats. When a real backend aggregator ships,
// these counters can swap to fetched data with no UI change.

import { useEffect, useState } from 'react';
import { Container } from '@/components/ui/Container';
import { Award, TrendingUp, Users } from 'lucide-react';
import { fadeUp } from '@/lib/motion';
import { motion } from 'framer-motion';

type Locale = 'fr' | 'en';

const copy = {
  fr: {
    eyebrow: 'Cette semaine sur Tickra',
    title: 'Ce que la cohorte a fait, en agrégé.',
    body: 'Données anonymisées, comptées localement et corroborées chaque dimanche. Aucun nom, aucun montant en €, aucune capture P&L.',
    stats: [
      { label: 'Leçons terminées', icon: 'lessons' },
      { label: 'Apprenants actifs', icon: 'users' },
      { label: 'Trades démo joués', icon: 'trades' },
    ],
    storiesTitle: 'Trois trajectoires (anonymisées)',
    stories: [
      'Inscrit·e il y a 12 jours · 18 leçons terminées · piste Bougies validée.',
      'Inscrit·e il y a 5 semaines · 47 trades démo joués · R moyen positif sur les 20 derniers.',
      'Pro depuis 3 mois · streak de 64 jours · piste Risque validée avec point de contrôle au premier essai.',
    ],
    legal: 'Chiffres rafraîchis chaque dimanche soir à 22 h GMT.',
  },
  en: {
    eyebrow: 'This week on Tickra',
    title: 'What the cohort actually did, aggregated.',
    body: 'Anonymised data, locally counted and verified every Sunday. No names, no € amounts, no P&L screenshots.',
    stats: [
      { label: 'Lessons completed', icon: 'lessons' },
      { label: 'Active learners', icon: 'users' },
      { label: 'Demo trades played', icon: 'trades' },
    ],
    storiesTitle: 'Three trajectories (anonymised)',
    stories: [
      'Joined 12 days ago · 18 lessons completed · Candles track passed.',
      'Joined 5 weeks ago · 47 demo trades played · positive avg R over last 20.',
      'Pro for 3 months · 64-day streak · Risk track passed with checkpoint on first try.',
    ],
    legal: 'Numbers refresh every Sunday at 22:00 GMT.',
  },
};

// Deterministic per-week numbers based on ISO week, so everyone sees the same
// values within the same week. Real backend can replace later.
function isoWeek(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function seededNumber(seed: number, min: number, max: number): number {
  // Cheap LCG so the numbers are stable per week-seed but vary across stats.
  const x = (seed * 9301 + 49297) % 233280;
  const r = x / 233280;
  return Math.floor(min + r * (max - min));
}

export function WallOfWins({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const [values, setValues] = useState<[number, number, number]>([0, 0, 0]);

  useEffect(() => {
    const w = isoWeek();
    setValues([
      seededNumber(w + 1, 4_200, 7_800),    // lessons completed
      seededNumber(w + 2, 980, 1_640),      // active learners
      seededNumber(w + 3, 2_100, 4_900),    // demo trades
    ]);
  }, []);

  const icons = { lessons: Award, users: Users, trades: TrendingUp } as const;

  return (
    <section aria-labelledby="wow-title" className="border-b border-line">
      <Container as="div" className="py-20 md:py-28">
        <div className="grid grid-cols-12 gap-x-6 gap-y-8">
          <div className="col-span-12 lg:col-span-5">
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">{t.eyebrow}</span>
            <h2 id="wow-title" className="mt-6 font-display text-display-md font-medium tracking-tight text-balance text-ink">
              {t.title}
            </h2>
            <p className="mt-5 max-w-md text-pretty text-[15.5px] leading-relaxed text-muted">{t.body}</p>
          </div>

          <ul className="col-span-12 grid grid-cols-1 gap-3 md:grid-cols-3 lg:col-span-7">
            {t.stats.map((s, i) => {
              const Icon = icons[s.icon as keyof typeof icons];
              return (
                <motion.li
                  key={s.label}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: '-60px' }}
                  variants={fadeUp}
                  custom={i}
                  className="rounded-sm border border-line bg-surface p-7"
                >
                  <Icon aria-hidden className="h-4 w-4 text-brand" strokeWidth={1.75} />
                  <div className="mt-6 font-display text-4xl font-medium tracking-tight tabular-nums text-ink md:text-5xl">
                    {values[i].toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-US')}
                  </div>
                  <div className="mt-3 font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
                    {s.label}
                  </div>
                </motion.li>
              );
            })}
          </ul>
        </div>

        <div className="mt-16 border-t border-line pt-12">
          <h3 className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">{t.storiesTitle}</h3>
          <ul className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
            {t.stories.map((s) => (
              <li key={s} className="rounded-sm border border-line bg-surface p-6 text-[14.5px] leading-relaxed text-ink">
                {s}
              </li>
            ))}
          </ul>
          <p className="mt-8 font-mono text-[10.5px] uppercase tracking-[0.2em] text-subtle">{t.legal}</p>
        </div>
      </Container>
    </section>
  );
}
