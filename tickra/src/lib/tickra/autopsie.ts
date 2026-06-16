// L'Autopsie — per-trade post-mortem read locally from the journal row.
//
// Pure rule-based reading: takes one closed TradeRow and returns a few
// short bilingual paragraphs in the editorial register. No AI. No
// network. The Autopsie does not predict; it reads what was written.
//
// The reading focuses on three movements:
//   verdict    — what the trade was (R, side, hold time, P&L)
//   conduit    — what the discipline looked like (stop, notes, size)
//   leçon      — the editorial closing line drawn from the strongest signal
//
// Used by AutopsiePanel on /journal to surface the last N closed trades.

import type { TradeRow } from '@/lib/db/journal-queries';

export type AutopsieLine = {
  id: 'verdict' | 'conduit' | 'lecon';
  text: { fr: string; en: string };
};

export type Autopsie = {
  tradeId: string;
  pair: string;
  side: 'long' | 'short';
  closedAt: string;
  pnl: number;
  rMultiple: number | null;
  /** Hold duration in minutes (rounded). */
  holdMinutes: number | null;
  lines: AutopsieLine[];
};

const HOUR = 60;

function holdMinutes(opened: string, closed: string): number | null {
  const o = new Date(opened).getTime();
  const c = new Date(closed).getTime();
  if (!Number.isFinite(o) || !Number.isFinite(c) || c < o) return null;
  return Math.round((c - o) / 60_000);
}

function formatHold(mins: number): string {
  if (mins < HOUR) return `${mins} min`;
  const h = Math.floor(mins / HOUR);
  const m = mins % HOUR;
  if (m === 0) return `${h} h`;
  return `${h} h ${m}`;
}

export function readTrade(trade: TradeRow): Autopsie | null {
  if (typeof trade.pnl !== 'number' || !trade.closed_at) return null;

  const pnl = trade.pnl;
  const won = pnl > 0;
  const lost = pnl < 0;
  const flat = pnl === 0;

  const hold = holdMinutes(trade.opened_at, trade.closed_at);
  const r = trade.risk_r ?? null;

  const lines: AutopsieLine[] = [];

  // 01 · Verdict — the bare facts.
  const side = trade.side === 'long' ? 'long' : 'short';
  const holdStr = hold !== null ? formatHold(hold) : '—';
  const pnlStr = `${pnl >= 0 ? '+' : ''}${pnl.toFixed(0)}`;
  const rStr = r !== null && r !== 0 ? ` · R ${r >= 0 ? '+' : ''}${r.toFixed(1)}` : '';
  lines.push({
    id: 'verdict',
    text: {
      fr: `${trade.pair} ${side} · ${holdStr} en position · ${pnlStr}${rStr}.`,
      en: `${trade.pair} ${side} · held ${holdStr} · ${pnlStr}${rStr}.`,
    },
  });

  // 02 · Conduit — stop, notes, size. What the discipline shows.
  const hasStop = trade.stop_loss !== null;
  const hasNotes = (trade.notes ?? '').trim().length > 0;
  const conduit: { fr: string; en: string } = (() => {
    if (!hasStop && !hasNotes) {
      return {
        fr: `Aucun stop écrit, aucune note. Le registre est muet — la prochaine fois, qu'il parle avant l'ordre.`,
        en: `No written stop, no notes. The register is silent — next time, let it speak before the order.`,
      };
    }
    if (!hasStop) {
      return {
        fr: `Pas de stop écrit. Le résultat ne lave pas l'oubli : la phrase « je perds » est ce qui rend l'ordre prêt.`,
        en: `No written stop. The outcome doesn't excuse the gap: the sentence "I lose" is what makes the order ready.`,
      };
    }
    if (!hasNotes && won) {
      return {
        fr: `Gain non commenté. Un gain qu'on ne relit pas est un hasard qu'on ne comprend pas.`,
        en: `Win without notes. An unexamined win is luck you haven't understood.`,
      };
    }
    if (!hasNotes && lost) {
      return {
        fr: `Perte non commentée. C'est la note la moins glorieuse — c'est la plus utile.`,
        en: `Loss without notes. The least glorious sentence — and the most useful.`,
      };
    }
    return {
      fr: `Stop écrit, note posée. La conduite tient même quand le résultat hésite.`,
      en: `Stop written, note set. The conduct holds even when the result hesitates.`,
    };
  })();
  lines.push({ id: 'conduit', text: conduit });

  // 03 · Leçon — the closing editorial line, drawn from the strongest signal.
  const lecon: { fr: string; en: string } = (() => {
    if (flat) {
      return {
        fr: `Le marché vous a rendu la mise. Ni gloire ni dette — un trade lu, classé, refermé.`,
        en: `The market returned your stake. No glory, no debt — a trade read, filed, closed.`,
      };
    }
    if (r !== null && r >= 2 && won) {
      return {
        fr: `R ≥ 2 sur une thèse tenue jusqu'au bout. C'est le métier — répétez-le sans cérémonie.`,
        en: `R ≥ 2 on a thesis held to the end. That's the craft — repeat it without ceremony.`,
      };
    }
    if (r !== null && r <= -1 && lost) {
      return {
        fr: `Perte de plus d'un R. Le stop a fait son travail ; reste à comprendre pourquoi la thèse n'a pas tenu.`,
        en: `More than one R lost. The stop did its job; the work is to understand why the thesis didn't hold.`,
      };
    }
    if (won && hold !== null && hold < 10) {
      return {
        fr: `Gain pris en moins de dix minutes. Vérifiez que ce n'était pas la moitié d'un mouvement.`,
        en: `Win taken in under ten minutes. Make sure it wasn't half a move.`,
      };
    }
    if (lost && hold !== null && hold > 4 * HOUR) {
      return {
        fr: `Perte tenue plus de quatre heures. Une mauvaise idée gardée trop longtemps coûte deux fois.`,
        en: `A loss held more than four hours. A bad idea kept too long costs twice.`,
      };
    }
    if (won) {
      return {
        fr: `Trade gagnant, conduite tenue. Le registre vous remercie en silence.`,
        en: `Winning trade, conduct held. The register thanks you in silence.`,
      };
    }
    return {
      fr: `Perte écrite. Elle ne disparaît pas — elle entre dans la prochaine relecture.`,
      en: `Loss written. It doesn't vanish — it joins the next reread.`,
    };
  })();
  lines.push({ id: 'lecon', text: lecon });

  return {
    tradeId: trade.id,
    pair: trade.pair,
    side: trade.side,
    closedAt: trade.closed_at,
    pnl,
    rMultiple: r,
    holdMinutes: hold,
    lines,
  };
}

export function readClosedTrades(trades: TradeRow[], limit = 3): Autopsie[] {
  const closed = trades.filter((t) => typeof t.pnl === 'number' && t.closed_at);
  closed.sort(
    (a, b) =>
      new Date(b.closed_at as string).getTime() - new Date(a.closed_at as string).getTime(),
  );
  return closed
    .slice(0, limit)
    .map(readTrade)
    .filter((a): a is Autopsie => a !== null);
}
