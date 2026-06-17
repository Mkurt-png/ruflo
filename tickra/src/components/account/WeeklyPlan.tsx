'use client';

// 14-day personal plan, built from the user's placement
// test. Shows today's lesson prominently + the next 6 days as a compact
// vertical list. Generated once on the backend, regenerated on demand.

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CalendarDays, RotateCcw } from 'lucide-react';
import { TRACKS } from '@/lib/curriculum/data';
import { useProgress } from '@/lib/progress/hook';
import { cn } from '@/lib/cn';

type Locale = 'fr' | 'en';

type PlanEntry = { day_index: number; lesson_id: string };

const copy = {
  fr: {
    title: 'Votre planning',
    subtitle: '14 jours adaptés à votre niveau. Une leçon par jour, dix minutes.',
    today: 'Aujourd’hui',
    upcoming: 'À venir',
    open: 'Ouvrir la leçon',
    regenerate: 'Régénérer',
    empty: 'Aucun plan pour l’instant. Passez le test de niveau pour générer le vôtre.',
    notConfigured: 'Connexion à la base requise pour générer un plan.',
    done: 'Terminée',
  },
  en: {
    title: 'Your planning',
    subtitle: '14 days tailored to your level. One lesson a day, ten minutes.',
    today: 'Today',
    upcoming: 'Upcoming',
    open: 'Open lesson',
    regenerate: 'Regenerate',
    empty: 'No plan yet. Take the placement test to generate yours.',
    notConfigured: 'Database connection required to generate a plan.',
    done: 'Done',
  },
};

function lessonMeta(lessonId: string) {
  for (const t of TRACKS) {
    const l = t.lessons.find((x) => x.id === lessonId);
    if (l) return { track: t, lesson: l };
  }
  return null;
}

export function WeeklyPlan({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const { state, ready } = useProgress();
  const [plan, setPlan] = useState<PlanEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch('/api/me/plan', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data: { plan?: PlanEntry[] }) => {
        setPlan(data.plan ?? []);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const regenerate = async () => {
    setBusy(true);
    try {
      const r = await fetch('/api/me/plan', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ regenerate: true }),
      });
      const data = (await r.json()) as { plan?: PlanEntry[] };
      if (data.plan) setPlan(data.plan);
    } finally {
      setBusy(false);
    }
  };

  // "Today" = first entry whose lesson is not yet completed.
  const todayEntry = useMemo(() => {
    if (!ready) return null;
    return plan.find((e) => !state.completed[e.lesson_id]) ?? null;
  }, [plan, state.completed, ready]);

  const upcoming = useMemo(() => {
    if (!todayEntry) return plan.slice(0, 6);
    const idx = plan.findIndex((e) => e.day_index === todayEntry.day_index);
    return plan.slice(idx + 1, idx + 7);
  }, [plan, todayEntry]);

  if (!loaded) return <div className="h-44 rounded-sm bg-line/40" aria-hidden />;

  if (plan.length === 0) {
    return (
      <article aria-labelledby="weekly-plan-empty-title" className="rounded-sm border border-line bg-surface p-7 md:p-9">
        <h2 id="weekly-plan-empty-title" className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
          <CalendarDays className="h-3.5 w-3.5" strokeWidth={1.75} />
          {t.title}
        </h2>
        <p className="mt-4 text-[14px] text-muted">{t.empty}</p>
        <Link
          href={`/${locale}/onboarding`}
          className="mt-5 inline-flex h-10 items-center gap-2 rounded-full bg-ink px-4 text-[13px] font-medium text-canvas hover:brightness-110"
        >
          {locale === 'fr' ? 'Passer le test' : 'Take the test'}
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
        </Link>
      </article>
    );
  }

  return (
    <article aria-labelledby="weekly-plan-title" className="rounded-sm border border-line bg-surface p-7 md:p-9">
      <div className="flex items-baseline justify-between">
        <h2 id="weekly-plan-title" className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
          <CalendarDays className="h-3.5 w-3.5" strokeWidth={1.75} />
          {t.title}
        </h2>
        <button
          type="button"
          onClick={regenerate}
          disabled={busy}
          className="inline-flex h-8 items-center gap-1 rounded-full border border-line px-3 text-[11px] uppercase tracking-[0.18em] text-muted hover:border-ink hover:text-ink disabled:opacity-50"
        >
          <RotateCcw className="h-3 w-3" strokeWidth={2} />
          {t.regenerate}
        </button>
      </div>
      <p className="mt-3 max-w-md text-[14px] text-muted">{t.subtitle}</p>

      {todayEntry ? (
        <TodayCard locale={locale} entry={todayEntry} label={t.today} cta={t.open} />
      ) : null}

      {upcoming.length > 0 ? (
        <div className="mt-6">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-subtle">{t.upcoming}</div>
          <ul className="mt-3 divide-y divide-line border-y border-line">
            {upcoming.map((e) => {
              const meta = lessonMeta(e.lesson_id);
              if (!meta) return null;
              const done = Boolean(state.completed[e.lesson_id]);
              return (
                <li key={e.day_index} className="flex flex-wrap items-center gap-3 py-3 text-[13.5px]">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-elevated font-mono text-[10.5px] text-muted">
                    J{e.day_index}
                  </span>
                  <Link
                    href={`/${locale}/learn/${meta.track.slug}/${meta.lesson.slug}`}
                    className={cn(
                      'flex-1 font-display tracking-tight transition-colors hover:text-muted',
                      done ? 'text-subtle line-through' : 'text-ink',
                    )}
                  >
                    {meta.lesson.title[locale]}
                  </Link>
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-subtle">
                    {meta.track.title[locale]}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </article>
  );
}

function TodayCard({
  locale,
  entry,
  label,
  cta,
}: {
  locale: Locale;
  entry: PlanEntry;
  label: string;
  cta: string;
}) {
  const meta = lessonMeta(entry.lesson_id);
  if (!meta) return null;
  return (
    <div className="mt-6 rounded-sm border border-ink bg-ink p-6 text-canvas shadow-[0_20px_60px_-25px_rgba(124,92,217,0.5)]">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-canvas/65">
          {label} · J{entry.day_index}
        </span>
        <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-canvas/55">
          {meta.track.title[locale]}
        </span>
      </div>
      <h3 className="mt-3 font-display text-2xl font-medium tracking-tight">
        {meta.lesson.title[locale]}
      </h3>
      <Link
        href={`/${locale}/learn/${meta.track.slug}/${meta.lesson.slug}`}
        className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-canvas px-5 text-[14px] font-medium text-ink hover:brightness-110"
      >
        {cta}
        <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
      </Link>
    </div>
  );
}
