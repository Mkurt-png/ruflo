import { notFound, redirect } from 'next/navigation';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { getSession } from '@/lib/auth/session';
import { getUser, isDbConfigured } from '@/lib/db/queries';
import { hasPaidAccess } from '@/lib/auth/plan-expiry';
import { listTrades } from '@/lib/db/journal-queries';
import { Navbar } from '@/components/nav/Navbar';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { JournalApp } from '@/components/journal/JournalApp';
import { GreffierPanel } from '@/components/journal/GreffierPanel';
import { AutopsiePanel } from '@/components/journal/AutopsiePanel';
import { MurSilence } from '@/components/journal/MurSilence';
import { readSilence } from '@/lib/tickra/silence';
import { KpiStrip, LivePulse } from '@/components/ui/KpiStrip';

export const dynamic = 'force-dynamic';

export default async function JournalPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale as Locale;
  const dict = await getDictionary(locale);

  const session = getSession();
  if (!session) redirect(`/${locale}/signin`);
  if (!isDbConfigured()) redirect(`/${locale}/me`);
  const user = await getUser(session.email);
  const isPro = hasPaidAccess(user);

  const copy = COPY[locale];

  return (
    <>
      <Navbar dict={dict} locale={locale} />
      <main id="main" className="mx-auto w-full max-w-5xl px-6 py-12 md:py-16">
        <header className="mb-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-subtle">
            {copy.eyebrow}
          </p>
          <h1 className="mt-1 font-display text-3xl font-medium text-ink md:text-4xl">
            {copy.title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">{copy.body}</p>
        </header>

        {!isPro ? (
          <div className="rounded-2xl border border-line bg-surface p-8 text-center">
            <p className="text-base text-ink">{copy.proOnly}</p>
            <p className="mt-1 text-sm text-muted">{copy.proHint}</p>
            <a
              href={`/${locale}/pricing`}
              className="mt-5 inline-flex h-10 items-center rounded-full bg-ink px-5 text-sm font-medium text-canvas hover:opacity-90"
            >
              {copy.pricing}
            </a>
          </div>
        ) : (
          <ProJournal email={session.email} locale={locale} />
        )}
      </main>
    </>
  );
}

async function ProJournal({ email, locale }: { email: string; locale: Locale }) {
  const trades = await listTrades(email);
  const closed = trades.filter((t) => typeof t.pnl === 'number');
  const wins = closed.filter((t) => (t.pnl ?? 0) > 0).length;
  const winRate = closed.length ? Math.round((wins / closed.length) * 100) : 0;
  const net = closed.reduce((acc, t) => acc + (t.pnl ?? 0), 0);
  const silence = readSilence(trades);
  return (
    <MurSilence silence={silence} locale={locale}>
      <KpiStrip
        className="mb-6"
        items={[
          { label: locale === 'fr' ? 'Trades' : 'Trades', value: String(trades.length), tone: 'brand' },
          { label: locale === 'fr' ? 'Clôturés' : 'Closed', value: String(closed.length) },
          { label: locale === 'fr' ? 'Win rate' : 'Win rate', value: `${winRate}%`, tone: winRate >= 50 ? 'up' : winRate > 0 ? 'down' : 'neutral' },
          { label: 'P&L', value: `${net >= 0 ? '+' : ''}${net.toFixed(0)}`, tone: net >= 0 ? 'up' : 'down', hint: 'USD' },
        ]}
        trailing={<LivePulse label={locale === 'fr' ? 'journal' : 'journal'} />}
      />
      <JournalApp initialTrades={trades} locale={locale} />
      <GreffierPanel trades={trades} locale={locale} />
      <AutopsiePanel trades={trades} locale={locale} />
    </MurSilence>
  );
}

const COPY = {
  fr: {
    eyebrow: 'Journal · Trades réels',
    title: 'Votre journal de trading',
    body: 'Notez chaque trade — paire, entrée, sortie, taille, R multiple, notes. Le journal calcule win-rate, espérance et courbe d’equity. Le but n’est pas de gagner, c’est d’être discipliné.',
    proOnly: 'Le journal est réservé aux abonnés Pro et Lifetime.',
    proHint: 'Passez Pro pour activer le journal et la courbe d’equity.',
    pricing: 'Voir les tarifs',
  },
  en: {
    eyebrow: 'Journal · Real trades',
    title: 'Your trading journal',
    body: 'Log every trade — pair, entry, exit, size, R-multiple, notes. The journal computes win-rate, expectancy and equity curve. The point isn’t to win, it’s to stay disciplined.',
    proOnly: 'The journal is a Pro / Lifetime feature.',
    proHint: 'Upgrade to Pro to unlock the journal and equity curve.',
    pricing: 'See pricing',
  },
} as const;
