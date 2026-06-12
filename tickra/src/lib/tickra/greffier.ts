// Le Greffier — the journal that answers back.
//
// Pure rule-based rereading of the trade journal. No AI, no network:
// the registrar only reads what the trader wrote and states what the
// register shows. Each rule has a minimum-evidence threshold so the
// Greffier never speculates on thin data.
//
// Input: TradeRow[] (the same rows the journal page already fetches).
// Output: ordered observations, bilingual, ready for the ledger panel.

import type { TradeRow } from '@/lib/db/journal-queries';

export type GreffierInsight = {
  id: string;
  tone: 'warn' | 'note';
  text: { fr: string; en: string };
};

export type GreffierReading = {
  /** Total trades inspected (closed ones drive most rules). */
  inspected: number;
  /** Minimum closed trades before the register opens. */
  ready: boolean;
  insights: GreffierInsight[];
};

const MIN_CLOSED = 5;
const NIGHT_START = 21; // 21:00 UTC onwards counts as a late session
const NIGHT_END = 6;

const STOPWORDS = new Set([
  // fr
  'avec', 'pour', 'dans', 'mais', 'donc', 'être', 'avoir', 'fait', 'plus',
  'tout', 'bien', 'trade', 'trades', 'cette', 'comme', 'était', 'très',
  'aussi', 'alors', 'puis', 'sans', 'sur', 'une', 'des', 'les', 'est',
  // en
  'with', 'this', 'that', 'have', 'been', 'were', 'when', 'then', 'just',
  'like', 'very', 'into', 'from', 'over', 'after', 'before', 'because',
]);

function utcHour(iso: string): number {
  return new Date(iso).getUTCHours();
}

function isLate(hour: number): boolean {
  return hour >= NIGHT_START || hour < NIGHT_END;
}

export function readJournal(trades: TradeRow[]): GreffierReading {
  const closed = trades.filter((t) => typeof t.pnl === 'number');
  const reading: GreffierReading = {
    inspected: trades.length,
    ready: closed.length >= MIN_CLOSED,
    insights: [],
  };
  if (!reading.ready) return reading;

  const losses = closed.filter((t) => (t.pnl ?? 0) < 0);
  const wins = closed.filter((t) => (t.pnl ?? 0) > 0);

  // 01 · Late losses — losing trades opened in the late session.
  if (losses.length >= 3) {
    const late = losses.filter((t) => isLate(utcHour(t.opened_at)));
    if (late.length / losses.length >= 0.5) {
      reading.insights.push({
        id: 'late-losses',
        tone: 'warn',
        text: {
          fr: `${late.length} de tes ${losses.length} pertes ont été ouvertes après ${NIGHT_START} h. Le registre suggère que la fatigue trade à ta place.`,
          en: `${late.length} of your ${losses.length} losses were opened after ${NIGHT_START}:00. The register suggests fatigue is trading in your place.`,
        },
      });
    }
  }

  // 02 · Orders without a written stop.
  const noStop = trades.filter((t) => t.stop_loss === null);
  if (noStop.length >= 2) {
    reading.insights.push({
      id: 'no-stop',
      tone: 'warn',
      text: {
        fr: `${noStop.length} ordres sans stop écrit. La leçon dit : si la phrase « je perds » n'est pas écrite, l'ordre n'est pas prêt.`,
        en: `${noStop.length} orders without a written stop. The lesson says: if the sentence "I lose" isn't written, the order isn't ready.`,
      },
    });
  }

  // 03 · Asymmetry — cutting winners, letting losers run.
  if (wins.length >= 3 && losses.length >= 3) {
    const avgWin = wins.reduce((a, t) => a + (t.pnl ?? 0), 0) / wins.length;
    const avgLoss = Math.abs(losses.reduce((a, t) => a + (t.pnl ?? 0), 0) / losses.length);
    if (avgLoss > avgWin * 1.4 && avgWin > 0) {
      reading.insights.push({
        id: 'asymmetry',
        tone: 'warn',
        text: {
          fr: `Ta perte moyenne (${avgLoss.toFixed(0)}) dépasse ton gain moyen (${avgWin.toFixed(0)}). Tu coupes tes gains et tu laisses courir tes pertes — l'inverse du métier.`,
          en: `Your average loss (${avgLoss.toFixed(0)}) outweighs your average win (${avgWin.toFixed(0)}). You cut winners and let losers run — the craft inverted.`,
        },
      });
    }
  }

  // 04 · Revenge entries — opened shortly after a losing close.
  const byOpen = [...trades].sort(
    (a, b) => new Date(a.opened_at).getTime() - new Date(b.opened_at).getTime(),
  );
  let revenge = 0;
  for (let i = 1; i < byOpen.length; i++) {
    const prev = byOpen[i - 1];
    if ((prev.pnl ?? 0) >= 0 || !prev.closed_at) continue;
    const gap = new Date(byOpen[i].opened_at).getTime() - new Date(prev.closed_at).getTime();
    if (gap >= 0 && gap <= 45 * 60_000) revenge += 1;
  }
  if (revenge >= 2) {
    reading.insights.push({
      id: 'revenge',
      tone: 'warn',
      text: {
        fr: `${revenge} entrées dans les 45 minutes suivant une perte. Le registre appelle cela vouloir « le récupérer ». La leçon psy-03 aussi.`,
        en: `${revenge} entries within 45 minutes of a loss. The register calls this "winning it back". So does lesson psy-03.`,
      },
    });
  }

  // 05 · Notes bias — writing only on one side of the P&L.
  if (wins.length >= 3 && losses.length >= 3) {
    const winNoted = wins.filter((t) => (t.notes ?? '').trim().length > 0).length / wins.length;
    const lossNoted = losses.filter((t) => (t.notes ?? '').trim().length > 0).length / losses.length;
    if (lossNoted >= 0.6 && winNoted < 0.3) {
      reading.insights.push({
        id: 'notes-bias',
        tone: 'note',
        text: {
          fr: `Tu écris quand tu perds, presque jamais quand tu gagnes. Un gain non relu est un hasard non compris.`,
          en: `You write when you lose, almost never when you win. An unexamined win is luck you haven't understood.`,
        },
      });
    } else if (winNoted >= 0.6 && lossNoted < 0.3) {
      reading.insights.push({
        id: 'notes-bias',
        tone: 'note',
        text: {
          fr: `Tu écris quand tu gagnes, rarement quand tu perds. Le registre rappelle : ce qu'on ne relit pas, on le répète.`,
          en: `You write when you win, rarely when you lose. The register reminds you: what you don't reread, you repeat.`,
        },
      });
    }
  }

  // 06 · Pair concentration with poor results.
  if (closed.length >= 6) {
    const byPair = new Map<string, { n: number; wins: number }>();
    for (const t of closed) {
      const e = byPair.get(t.pair) ?? { n: 0, wins: 0 };
      e.n += 1;
      if ((t.pnl ?? 0) > 0) e.wins += 1;
      byPair.set(t.pair, e);
    }
    const overall = wins.length / closed.length;
    const [topPair, top] = [...byPair.entries()].sort((a, b) => b[1].n - a[1].n)[0];
    const share = top.n / closed.length;
    const pairRate = top.wins / top.n;
    if (share >= 0.5 && pairRate < overall - 0.1) {
      reading.insights.push({
        id: 'pair-concentration',
        tone: 'note',
        text: {
          fr: `${topPair} représente ${Math.round(share * 100)} % de tes trades pour ${Math.round(pairRate * 100)} % de réussite — sous ta moyenne. La familiarité n'est pas un avantage statistique.`,
          en: `${topPair} is ${Math.round(share * 100)}% of your trades at a ${Math.round(pairRate * 100)}% win rate — below your average. Familiarity is not a statistical edge.`,
        },
      });
    }
  }

  // 07 · The most frequent word in the notes.
  const noteTexts = trades.map((t) => t.notes ?? '').filter((n) => n.trim().length > 0);
  if (noteTexts.length >= 5) {
    const counts = new Map<string, number>();
    for (const n of noteTexts) {
      for (const raw of n.toLowerCase().split(/[^\p{L}]+/u)) {
        if (raw.length < 4 || STOPWORDS.has(raw)) continue;
        counts.set(raw, (counts.get(raw) ?? 0) + 1);
      }
    }
    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    if (sorted.length > 0 && sorted[0][1] >= 3) {
      const [word, n] = sorted[0];
      reading.insights.push({
        id: 'top-word',
        tone: 'note',
        text: {
          fr: `Le mot qui revient le plus dans tes notes : « ${word} » (${n} fois). Les registres ont leurs aveux.`,
          en: `The word that returns most in your notes: "${word}" (${n} times). Registers make their own confessions.`,
        },
      });
    }
  }

  // 08 · Side bias.
  if (closed.length >= 6) {
    const longs = closed.filter((t) => t.side === 'long').length;
    const share = longs / closed.length;
    if (share >= 0.75 || share <= 0.25) {
      const dominant = share >= 0.75 ? 'long' : 'short';
      reading.insights.push({
        id: 'side-bias',
        tone: 'note',
        text: {
          fr: `${Math.round(Math.max(share, 1 - share) * 100)} % de tes trades sont ${dominant}. Le marché monte et descend ; ton registre ne fait que l'un des deux.`,
          en: `${Math.round(Math.max(share, 1 - share) * 100)}% of your trades are ${dominant}. The market goes both ways; your register only does one of them.`,
        },
      });
    }
  }

  return reading;
}
