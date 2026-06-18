'use client';

import { useMemo } from 'react';

type Locale = 'fr' | 'en';

// Short, calm, pedagogical lines. No bro-quotes, no Lambo. Tickra-coded.
const QUOTES: Array<{ fr: string; en: string; author: string }> = [
  { fr: 'Le marché ne vous doit rien. Votre méthode, si.', en: 'The market owes you nothing. Your method does.', author: 'Tickra' },
  { fr: 'Perdre lentement est tout le métier.', en: 'Losing slowly is the whole craft.', author: 'Tickra' },
  { fr: 'Vous ne tradez pas un graphique, vous tradez un risque.', en: 'You do not trade a chart, you trade a risk.', author: 'Tickra' },
  { fr: 'Le R:R décide. Le sentiment n’a pas voix au chapitre.', en: 'R:R decides. Sentiment gets no vote.', author: 'Tickra' },
  { fr: 'Le meilleur trade est celui que vous pouvez expliquer demain.', en: 'The best trade is the one you can explain tomorrow.', author: 'Tickra' },
  { fr: 'Pas de stop, pas de plan.', en: 'No stop, no plan.', author: 'Tickra' },
  { fr: 'La régularité bat la performance moyenne.', en: 'Consistency beats average performance.', author: 'Tickra' },
  { fr: 'Un graphique propre force un esprit clair.', en: 'A clean chart forces a clean mind.', author: 'Tickra' },
  { fr: 'Tradez la structure, pas la couleur de la bougie.', en: 'Trade the structure, not the candle colour.', author: 'Tickra' },
  { fr: 'Le risque d’abord. Le reste, ensuite.', en: 'Risk first. Everything else, after.', author: 'Tickra' },
];

function dayIndex(): number {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), 0, 0));
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function QuoteOfTheDay({ locale }: { locale: Locale }) {
  const q = useMemo(() => QUOTES[dayIndex() % QUOTES.length], []);
  return (
    <div className="border-t border-black/15 pt-6">
      <blockquote className="max-w-2xl font-display italic text-[15.5px] leading-snug tracking-tight text-balance text-[#0E0E0E]/85">
        {q[locale]}
      </blockquote>
      <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.34em] text-black/55">
        — {q.author}
      </div>
    </div>
  );
}
