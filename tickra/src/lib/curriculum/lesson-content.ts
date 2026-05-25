// Lesson runtime content.
// For each lesson the runtime expects: intro paragraphs, a drill prompt, and
// a quiz (3 single-choice questions with rationales). Seeded lessons have hand-
// written copy; everything else is filled with a structured, locale-aware
// placeholder so the lesson runtime never breaks.

import type { LessonMeta, TrackMeta } from './data';

export type LessonContent = {
  intro: { fr: string[]; en: string[] };
  chart?: { symbol: string; interval?: string };
  drill: {
    prompt: { fr: string; en: string };
    correct: number;
    options: { fr: string[]; en: string[] };
    rationale: { fr: string; en: string };
  };
  quiz: ReadonlyArray<{
    q: { fr: string; en: string };
    options: { fr: string[]; en: string[] };
    correct: number;
    rationale: { fr: string; en: string };
  }>;
};

type Seed = Record<string, LessonContent>;

// ─── Seeded content (Bougies japonaises, first lessons) ────────────────────

const seeded: Seed = {
  'candles-01': {
    chart: { symbol: 'FX:EURUSD', interval: '60' },
    intro: {
      fr: [
        'Une bougie japonaise condense quatre informations sur une période donnée : l’ouverture, le plus haut, le plus bas, la clôture.',
        'Le corps est le rectangle entre l’ouverture et la clôture. Les ombres sont les fines lignes qui dépassent — elles vont du corps jusqu’aux extrêmes.',
        'La couleur n’est qu’une dérivée : verte si la clôture est au‑dessus de l’ouverture, rouge sinon. Ce qui compte, c’est la position relative des quatre points.',
      ],
      en: [
        'A Japanese candle condenses four data points over a given period: open, high, low, close.',
        'The body is the rectangle between open and close. The wicks are the thin lines that stick out — they run from the body to the extremes.',
        'Colour is just a derivative: green if close is above open, red otherwise. What matters is the relative position of the four points.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Une bougie ouvre à 1.0820, monte à 1.0855, descend à 1.0810, clôture à 1.0848. Quel est son corps ?',
        en: 'A candle opens at 1.0820, hits 1.0855, drops to 1.0810, closes at 1.0848. What is its body?',
      },
      options: {
        fr: ['1.0820 → 1.0848 (haussier)', '1.0855 → 1.0810 (baissier)', '1.0810 → 1.0855 (haussier)'],
        en: ['1.0820 → 1.0848 (bullish)', '1.0855 → 1.0810 (bearish)', '1.0810 → 1.0855 (bullish)'],
      },
      correct: 0,
      rationale: {
        fr: 'Le corps va toujours de l’ouverture à la clôture. Ici 1.0820 → 1.0848. Les 1.0855 et 1.0810 forment les ombres.',
        en: 'The body always runs from open to close. Here 1.0820 → 1.0848. The 1.0855 and 1.0810 are the wicks.',
      },
    },
    quiz: [
      {
        q: { fr: 'Que représente la couleur d’une bougie ?', en: 'What does the colour of a candle represent?' },
        options: {
          fr: ['Le volume échangé', 'Le sens de clôture par rapport à l’ouverture', 'La taille du mouvement'],
          en: ['Volume traded', 'Direction of close vs open', 'Move size'],
        },
        correct: 1,
        rationale: {
          fr: 'Vert = clôture au‑dessus de l’ouverture. Rouge = inverse. La couleur ne dit rien de la force.',
          en: 'Green = close above open. Red = the other way around. Colour says nothing about strength.',
        },
      },
      {
        q: { fr: 'Que sont les ombres d’une bougie ?', en: 'What are the wicks of a candle?' },
        options: {
          fr: ['Les niveaux où le prix a été rejeté', 'L’épaisseur du carnet d’ordres', 'Le delta du jour'],
          en: ['The levels where price was rejected', 'Order book thickness', 'The day’s delta'],
        },
        correct: 0,
        rationale: {
          fr: 'Une longue ombre signale un rejet : le prix y est allé, puis a été repoussé avant la clôture.',
          en: 'A long wick signals rejection: price went there, then was pushed back before close.',
        },
      },
      {
        q: { fr: 'Pourquoi le timeframe d’une bougie est‑il crucial ?', en: 'Why does the timeframe of a candle matter?' },
        options: {
          fr: ['Une 1H et une 1J racontent deux histoires différentes', 'Le timeframe ne change rien', 'Plus c’est long, plus c’est précis'],
          en: ['A 1H and a 1D tell two different stories', 'Timeframe changes nothing', 'Longer = more precise'],
        },
        correct: 0,
        rationale: {
          fr: 'Une marubozu sur 1H peut être un simple bruit sur 1J. Lisez toujours la bougie dans son cadre.',
          en: 'A marubozu on 1H may be just noise on 1D. Always read the candle in its frame.',
        },
      },
    ],
  },
  'candles-04': {
    chart: { symbol: 'FX:EURUSD', interval: '60' },
    intro: {
      fr: [
        'Une marubozu est une bougie quasiment sans ombres. Le corps remplit (presque) toute l’amplitude haut‑bas de la séance.',
        'C’est un signal de contrôle complet d’un côté du marché. Pas un signal d’entrée — un signal d’information.',
        'Le contexte décide : marubozu au sommet d’une tendance mature ≠ marubozu au bas d’une consolidation après baisse.',
      ],
      en: [
        'A marubozu is a candle with virtually no wicks. The body fills (almost) the full high‑low range of the session.',
        'It signals total control by one side. Not an entry signal — an information signal.',
        'Context decides: marubozu at the top of a mature trend ≠ marubozu at the bottom of a post‑downtrend consolidation.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Une bougie sur EUR/USD H1 : Open 1.0700, Haut 1.0758, Bas 1.0698, Close 1.0755. Est‑ce une marubozu ?',
        en: 'A candle on EUR/USD H1: Open 1.0700, High 1.0758, Low 1.0698, Close 1.0755. Is this a marubozu?',
      },
      options: {
        fr: ['Oui — corps quasi égal à l’amplitude', 'Non — les ombres sont trop longues', 'Peut‑être — il manque le volume'],
        en: ['Yes — body nearly equals the range', 'No — the wicks are too long', 'Maybe — volume is missing'],
      },
      correct: 0,
      rationale: {
        fr: 'Corps = 55 pips. Amplitude = 60 pips. Ratio > 90 %. C’est une marubozu haussière nette.',
        en: 'Body = 55 pips. Range = 60 pips. Ratio > 90%. It’s a clean bullish marubozu.',
      },
    },
    quiz: [
      {
        q: { fr: 'Une marubozu seule est‑elle un signal d’entrée ?', en: 'Is a lone marubozu an entry signal?' },
        options: {
          fr: ['Oui, immédiate', 'Non, c’est une information de momentum', 'Oui si volume confirmé'],
          en: ['Yes, immediately', 'No, it is a momentum cue', 'Yes if volume confirms'],
        },
        correct: 1,
        rationale: { fr: 'C’est une information, pas un signal. Tickra n’entraîne jamais d’entrée sur une seule bougie.', en: 'It is information, not a signal. Tickra never drills entries off a single candle.' },
      },
      {
        q: { fr: 'Marubozu en haut d’une tendance haussière mature, ça veut dire :', en: 'Marubozu at the top of a mature uptrend means:' },
        options: {
          fr: ['Continuation garantie', 'Climax possible — épuisement à surveiller', 'Aucune information'],
          en: ['Guaranteed continuation', 'Possible climax — watch for exhaustion', 'No information'],
        },
        correct: 1,
        rationale: { fr: 'Une longue tendance + une marubozu peut signaler un climax buying. À recouper avec le volume.', en: 'A long trend + a marubozu can signal climax buying. Cross‑check with volume.' },
      },
      {
        q: { fr: 'Quel ratio corps/amplitude définit une marubozu chez Tickra ?', en: 'What body/range ratio defines a marubozu at Tickra?' },
        options: { fr: ['> 50 %', '> 80 %', '100 % exact'], en: ['> 50%', '> 80%', 'Exactly 100%'] },
        correct: 1,
        rationale: { fr: 'En dessous de 80 % vous avez juste une grande bougie, pas une marubozu.', en: 'Below 80% you have a large candle, not a marubozu.' },
      },
    ],
  },
  'risk-04': {
    chart: { symbol: 'AMEX:SPY', interval: 'D' },
    intro: {
      fr: [
        'Espérance = (taux gagnant × gain moyen) − (taux perdant × perte moyenne). Un trader rentable peut perdre la majorité de ses trades.',
        'Ce qui compte n’est pas le taux de réussite, c’est l’asymétrie entre ce que vous gagnez quand vous avez raison et ce que vous perdez quand vous avez tort.',
        'Cette équation déplace tout le travail : on ne cherche pas à avoir raison, on cherche des setups dont la promesse mathématique est positive.',
      ],
      en: [
        'Expectancy = (win rate × avg win) − (loss rate × avg loss). A profitable trader can lose the majority of their trades.',
        'What matters is not hit rate, it is the asymmetry between what you win when right and what you lose when wrong.',
        'This equation shifts the whole job: you are not chasing being right, you are chasing setups whose mathematical promise is positive.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Vous gagnez 45 % de vos trades. Quand vous gagnez, vous faites +2 R. Quand vous perdez, vous perdez −1 R. Êtes‑vous rentable ?',
        en: 'You win 45% of trades. When you win, you make +2 R. When you lose, you lose −1 R. Are you profitable?',
      },
      options: {
        fr: ['Oui — espérance +0.35 R / trade', 'Non — votre taux est sous 50 %', 'Indéterminé sans le volume'],
        en: ['Yes — expectancy +0.35 R / trade', 'No — your hit rate is below 50%', 'Undetermined without volume'],
      },
      correct: 0,
      rationale: {
        fr: '(0.45 × 2) − (0.55 × 1) = 0.90 − 0.55 = +0.35 R par trade. Hit rate < 50 % et pourtant rentable.',
        en: '(0.45 × 2) − (0.55 × 1) = 0.90 − 0.55 = +0.35 R per trade. Hit rate < 50% and still profitable.',
      },
    },
    quiz: [
      {
        q: { fr: 'Le taux de réussite seul suffit‑il à dire si un trader est rentable ?', en: 'Is hit rate alone enough to tell if a trader is profitable?' },
        options: { fr: ['Oui', 'Non, sans le R:R c’est trompeur', 'Oui au‑dessus de 60 %'], en: ['Yes', 'No, without R:R it is misleading', 'Yes above 60%'] },
        correct: 1,
        rationale: { fr: 'Sans la taille des gains et des pertes, le taux ne dit rien.', en: 'Without the size of wins and losses, hit rate says nothing.' },
      },
      {
        q: { fr: 'Quel est le seuil minimum d’espérance pour considérer un système ?', en: 'What is the minimum expectancy to consider a system?' },
        options: { fr: ['> 0 strictement', '> +0.2 R par trade', '> +1 R par trade'], en: ['> 0 strictly', '> +0.2 R per trade', '> +1 R per trade'] },
        correct: 1,
        rationale: { fr: 'Sous +0.2 R, les coûts (spread, slippage, taxes) mangent l’avantage. Au‑delà on commence à travailler.', en: 'Below +0.2 R, costs (spread, slippage, taxes) eat the edge. Above, you start to work.' },
      },
      {
        q: { fr: 'Avant d’entrer en trade, la question utile est :', en: 'Before entering a trade, the useful question is:' },
        options: { fr: ['« Ai‑je raison ? »', '« Combien je risque vs combien je peux gagner ? »', '« Le marché est‑il haussier ? »'], en: ['"Am I right?"', '"How much do I risk vs how much can I make?"', '"Is the market bullish?"'] },
        correct: 1,
        rationale: { fr: 'La seule question qui survit dans le temps : l’asymétrie du trade.', en: 'The only question that survives over time: trade asymmetry.' },
      },
    ],
  },
  'candles-05': {
    chart: { symbol: 'FX:EURUSD', interval: '60' },
    intro: {
      fr: [
        'Le doji est une bougie dont l’ouverture et la clôture sont quasiment identiques. Le corps est minuscule, parfois inexistant — une simple barre horizontale.',
        'C’est le signal d’indécision le plus pur : ni acheteurs ni vendeurs n’ont pris l’avantage sur la séance.',
        'Mais un doji n’a de sens que dans son contexte. Au milieu d’un range, c’est du bruit. Au sommet d’une longue tendance, c’est un avertissement.',
      ],
      en: [
        'A doji is a candle where open and close are nearly identical. The body is tiny — sometimes just a horizontal bar.',
        'It is the purest signal of indecision: neither buyers nor sellers prevailed during the session.',
        'But a doji only means something in context. In the middle of a range, it is noise. At the top of a long trend, it is a warning.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Un doji apparaît au sommet d’une tendance haussière de 3 semaines, sur volume élevé. Que faites‑vous ?',
        en: 'A doji forms at the top of a 3‑week uptrend, on heavy volume. What do you do?',
      },
      options: {
        fr: ['Je vends à découvert immédiatement', 'J’attends la bougie suivante pour confirmer', 'J’ignore — c’est juste une bougie'],
        en: ['Short immediately', 'Wait for the next candle to confirm', 'Ignore — it is just a candle'],
      },
      correct: 1,
      rationale: {
        fr: 'Le doji est un signal d’indécision, pas d’entrée. La bougie suivante (clôture sous le doji = baissière) donne la confirmation.',
        en: 'A doji signals indecision, not entry. The next candle (close under the doji = bearish) gives confirmation.',
      },
    },
    quiz: [
      {
        q: { fr: 'Un doji isolé sur un range est :', en: 'A lone doji inside a range is:' },
        options: { fr: ['Un signal d’achat fort', 'Du bruit', 'Un signal de vente fort'], en: ['A strong buy signal', 'Noise', 'A strong sell signal'] },
        correct: 1,
        rationale: { fr: 'Dans un range, l’indécision est l’état normal du marché.', en: 'Inside a range, indecision is the market’s default state.' },
      },
      {
        q: { fr: 'Quel doji est le plus inquiétant en fin de tendance ?', en: 'Which doji is the most worrying at the end of a trend?' },
        options: { fr: ['Doji libellule', 'Doji pierre tombale', 'Doji long jambe'], en: ['Dragonfly doji', 'Gravestone doji', 'Long‑legged doji'] },
        correct: 2,
        rationale: { fr: 'Le doji long jambe (longues ombres haut et bas) montre une volatilité extrême — souvent un climax.', en: 'The long‑legged doji (long upper AND lower wicks) shows extreme volatility — often a climax.' },
      },
      {
        q: { fr: 'Que faut‑il ajouter pour qualifier un doji ?', en: 'What should you add to qualify a doji?' },
        options: { fr: ['Le volume et le contexte', 'L’horoscope du jour', 'Rien — la forme suffit'], en: ['Volume and context', 'Today’s horoscope', 'Nothing — shape is enough'] },
        correct: 0,
        rationale: { fr: 'Volume + position dans la tendance changent radicalement la lecture.', en: 'Volume + position in the trend completely change the read.' },
      },
    ],
  },
  'structure-01': {
    chart: { symbol: 'AMEX:SPY', interval: 'D' },
    intro: {
      fr: [
        'Une tendance se définit par la séquence des hauts et des bas. Pas par votre opinion, pas par les news, pas par une moyenne mobile.',
        'Tendance haussière : succession de plus hauts plus hauts (HH) et plus bas plus hauts (HL).',
        'Tendance baissière : plus bas plus bas (LL) et plus hauts plus bas (LH). Tant que cette séquence tient, la tendance tient.',
      ],
      en: [
        'A trend is defined by the sequence of highs and lows. Not by your opinion, not by the news, not by a moving average.',
        'Uptrend: a sequence of higher highs (HH) and higher lows (HL).',
        'Downtrend: lower lows (LL) and lower highs (LH). As long as that sequence holds, the trend holds.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Une action fait : 100 → 110 → 105 → 115 → 108. Tendance ?',
        en: 'A stock prints: 100 → 110 → 105 → 115 → 108. Trend?',
      },
      options: {
        fr: ['Haussière confirmée (HH + HL)', 'Baissière — derniers bougies en baisse', 'Range'],
        en: ['Confirmed uptrend (HH + HL)', 'Bearish — last candles dropping', 'Range'],
      },
      correct: 0,
      rationale: {
        fr: '115 > 110 (HH) et 108 > 105 (HL). La séquence est haussière, même si la dernière barre baisse.',
        en: '115 > 110 (HH) and 108 > 105 (HL). The sequence is bullish, even if the last bar is down.',
      },
    },
    quiz: [
      {
        q: { fr: 'Quand une tendance haussière est‑elle cassée ?', en: 'When is an uptrend broken?' },
        options: { fr: ['Au premier LL', 'Au premier LH', 'Quand la moyenne mobile baisse'], en: ['On the first LL', 'On the first LH', 'When the moving average drops'] },
        correct: 1,
        rationale: { fr: 'Le premier LH casse la séquence. Pas besoin d’attendre le LL pour réagir.', en: 'The first LH breaks the sequence. No need to wait for the LL to react.' },
      },
      {
        q: { fr: 'Sur quel timeframe doit‑on définir la tendance ?', en: 'On which timeframe should you define the trend?' },
        options: { fr: ['Celui sur lequel on trade', 'Celui au‑dessus de celui sur lequel on trade', 'Le H4 toujours'], en: ['The one you trade on', 'The one above the one you trade on', 'Always the 4H'] },
        correct: 1,
        rationale: { fr: 'Le timeframe supérieur donne le cadre. Le timeframe d’entrée donne le timing.', en: 'The higher timeframe gives the frame. The entry timeframe gives the timing.' },
      },
      {
        q: { fr: 'Une moyenne mobile suffit‑elle à définir une tendance ?', en: 'Is a moving average enough to define a trend?' },
        options: { fr: ['Oui, 200 jours surtout', 'Non, c’est un indicateur retardé', 'Oui si combinée'], en: ['Yes, especially 200‑day', 'No, it is a lagging indicator', 'Yes if combined'] },
        correct: 1,
        rationale: { fr: 'La structure (HH/HL/LH/LL) précède l’indicateur. L’inverse n’est pas vrai.', en: 'Structure (HH/HL/LH/LL) leads the indicator. Not the other way around.' },
      },
    ],
  },
  'risk-01': {
    intro: {
      fr: [
        'La règle des 1 % : ne jamais risquer plus de 1 % de votre capital sur un seul trade. Pas le notional engagé — le risque réel jusqu’au stop.',
        'Sur 10 000 €, 1 % = 100 € maximum de perte par trade. Vous pouvez prendre une position de 50 000 € si votre stop ne représente que 100 € de perte.',
        'Cette règle n’est pas négociable. Elle est ce qui transforme une mauvaise séquence (qui arrive à tout le monde) en simple drawdown plutôt qu’en ruine.',
      ],
      en: [
        'The 1% rule: never risk more than 1% of your capital on a single trade. Not notional — actual risk down to the stop.',
        'On €10,000, 1% = €100 maximum loss per trade. You can take a €50,000 position if your stop only risks €100.',
        'This rule is non‑negotiable. It is what turns a bad sequence (which happens to everyone) into a drawdown rather than ruin.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Capital 20 000 €. Vous voulez trader EUR/USD. Stop à 30 pips. Combien de lots ?',
        en: 'Capital €20,000. You want to trade EUR/USD. Stop at 30 pips. How many lots?',
      },
      options: {
        fr: ['6 lots — vous êtes confiant', '0,6 lot — 200 € de risque max / 30 pips × 10 €', '2 lots — c’est raisonnable'],
        en: ['6 lots — you are confident', '0.6 lot — €200 risk max / 30 pips × €10', '2 lots — that is reasonable'],
      },
      correct: 1,
      rationale: {
        fr: '20 000 × 1 % = 200 €. 30 pips à 10 € le pip (1 lot std) = 300 € de risque. Donc 200/300 ≈ 0,66 lot. La confiance n’a pas de prix… sauf 1 %.',
        en: '20,000 × 1% = €200. 30 pips × €10 per pip (1 std lot) = €300 risk. So 200/300 ≈ 0.66 lot. Confidence has no price… except 1%.',
      },
    },
    quiz: [
      {
        q: { fr: 'Que protège la règle des 1 % ?', en: 'What does the 1% rule protect?' },
        options: { fr: ['Votre ego', 'Votre capital sur une mauvaise série', 'Vos émotions'], en: ['Your ego', 'Your capital on a bad streak', 'Your emotions'] },
        correct: 1,
        rationale: { fr: 'Avec 1 % par trade, 20 pertes consécutives = ~18 % de drawdown. Récupérable. À 5 %, c’est 64 %.', en: 'At 1% per trade, 20 consecutive losses = ~18% drawdown. Recoverable. At 5%, it’s 64%.' },
      },
      {
        q: { fr: 'La règle est :', en: 'The rule is:' },
        options: { fr: ['Risque maximum, pas obligatoire', 'Risque obligatoire de 1 %', 'Variable selon humeur'], en: ['Maximum risk, not mandatory', 'Mandatory 1% risk', 'Variable by mood'] },
        correct: 0,
        rationale: { fr: 'C’est un plafond. Vous pouvez très bien risquer 0,3 %.', en: 'It is a ceiling. You can easily risk 0.3%.' },
      },
      {
        q: { fr: 'Quand augmenter au‑delà de 1 % ?', en: 'When to go above 1%?' },
        options: { fr: ['Jamais sans 2 ans de track record', 'Quand on est sûr du trade', 'Quand on a perdu plusieurs trades'], en: ['Never without 2 years of track record', 'When sure about the trade', 'After several losses'] },
        correct: 0,
        rationale: { fr: 'L’augmentation se fait sur les statistiques, pas sur le sentiment. Et seulement avec preuve.', en: 'Sizing scales on statistics, not feelings. And only with proof.' },
      },
    ],
  },
  'risk-02': {
    intro: {
      fr: [
        'La taille de position dépend de trois variables : votre capital, votre risque par trade (en %), et la distance jusqu’au stop (en unités de prix).',
        'Formule : Taille = (Capital × Risque%) ÷ Distance au stop. Tout le reste — levier, marge, notional — découle de là.',
        'Une grande erreur de débutant : raisonner en « combien je peux acheter » au lieu de « combien je peux perdre ».',
      ],
      en: [
        'Position size depends on three variables: your capital, your per‑trade risk (in %), and the distance to the stop (in price units).',
        'Formula: Size = (Capital × Risk%) ÷ Stop distance. Everything else — leverage, margin, notional — derives from there.',
        'A classic beginner mistake: thinking "how much can I buy" rather than "how much can I lose".',
      ],
    },
    drill: {
      prompt: {
        fr: 'Capital 5 000 €, risque 1 %, achat AAPL à 180, stop à 175. Combien d’actions ?',
        en: 'Capital €5,000, 1% risk, buy AAPL at 180, stop at 175. How many shares?',
      },
      options: {
        fr: ['10 actions (50 € / 5 € de stop)', '27 actions (5 000 / 180 — combien je peux acheter)', '5 actions — c’est sûr'],
        en: ['10 shares (€50 / €5 stop)', '27 shares (5,000 / 180 — what I can afford)', '5 shares — that’s safe'],
      },
      correct: 0,
      rationale: {
        fr: 'Risque = 5 000 × 1 % = 50 €. Distance stop = 180 − 175 = 5 €. Taille = 50/5 = 10 actions. La question n’est jamais « combien je peux acheter ».',
        en: 'Risk = 5,000 × 1% = €50. Stop distance = 180 − 175 = €5. Size = 50/5 = 10 shares. The question is never "what can I afford".',
      },
    },
    quiz: [
      {
        q: { fr: 'Si vous éloignez le stop, la taille :', en: 'If you widen the stop, size:' },
        options: { fr: ['Augmente', 'Diminue', 'Ne change pas'], en: ['Increases', 'Decreases', 'Stays the same'] },
        correct: 1,
        rationale: { fr: 'Stop plus large = mêmes 1 % de risque sur plus de distance = moins d’unités.', en: 'Wider stop = same 1% risk over more distance = fewer units.' },
      },
      {
        q: { fr: 'Le levier change‑t‑il la taille calculée ?', en: 'Does leverage change the calculated size?' },
        options: { fr: ['Oui, multiplie la taille', 'Non, le risque est en valeur monétaire', 'Oui, divise le risque'], en: ['Yes, multiplies the size', 'No, risk is in money', 'Yes, divides the risk'] },
        correct: 1,
        rationale: { fr: 'Le levier ne change que la marge nécessaire. Le risque en euros reste identique.', en: 'Leverage only changes the margin required. Money risk stays the same.' },
      },
      {
        q: { fr: 'Première variable à fixer dans un plan de trade :', en: 'First variable to fix in a trade plan:' },
        options: { fr: ['L’objectif de gain', 'L’invalidation (le stop)', 'Le levier'], en: ['Profit target', 'Invalidation (the stop)', 'Leverage'] },
        correct: 1,
        rationale: { fr: 'Le stop décide de la taille. Tout le reste suit.', en: 'The stop decides the size. Everything else follows.' },
      },
    ],
  },
  'risk-03': {
    intro: {
      fr: [
        'Le placement du stop ne se choisit pas par confort. Il se place là où, si le prix l’atteint, votre raison d’être dans le trade n’existe plus.',
        'Si vous achetez sur un support, votre stop est sous le support. Si vous shortez une résistance, votre stop est au‑dessus. Toute autre logique est arbitraire.',
        'Évitez les stops « ronds » (10 pips, 50 pips, niveau psychologique). Le marché y va presque toujours — c’est là que la liquidité s’accumule.',
      ],
      en: [
        'Stop placement is not chosen by comfort. It goes where, if price hits it, your reason to be in the trade is gone.',
        'If you bought a support, your stop is below the support. If you shorted a resistance, your stop is above. Any other logic is arbitrary.',
        'Avoid "round" stops (10 pips, 50 pips, psychological levels). The market almost always goes there — that is where liquidity stacks.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Vous achetez à 1.0850 sur un retest de support à 1.0840. Où placer le stop ?',
        en: 'You buy at 1.0850 on a retest of support at 1.0840. Where do you place the stop?',
      },
      options: {
        fr: ['1.0800 (50 pips rond)', '1.0820 (sous le support + un peu de marge)', '1.0848 (tout proche, pour limiter le risque)'],
        en: ['1.0800 (round 50 pips)', '1.0820 (below support + a bit of margin)', '1.0848 (very tight to cap risk)'],
      },
      correct: 1,
      rationale: {
        fr: 'Si le prix casse 1.0840 et tient sous, votre setup est invalide. Marge sous = protection contre les mèches.',
        en: 'If price breaks 1.0840 and stays below, your setup is invalid. Margin under = protection against wicks.',
      },
    },
    quiz: [
      {
        q: { fr: 'Un stop trop serré :', en: 'A too‑tight stop:' },
        options: { fr: ['Vous protège mieux', 'Vous fait sortir sur du bruit', 'Donne un meilleur R:R'], en: ['Protects you better', 'Stops you out on noise', 'Gives better R:R'] },
        correct: 1,
        rationale: { fr: 'Le R:R s’améliore visuellement mais le taux de réussite chute encore plus.', en: 'R:R looks better but hit rate drops harder.' },
      },
      {
        q: { fr: 'Un stop est :', en: 'A stop is:' },
        options: { fr: ['Une suggestion', 'Un ordre ferme à l’avance', 'Mental, à exécuter quand on veut'], en: ['A suggestion', 'A firm pre‑set order', 'Mental, to execute when wanted'] },
        correct: 1,
        rationale: { fr: 'Mental = vous le repoussez. Toujours pré‑positionné.', en: 'Mental = you move it. Always pre‑placed.' },
      },
      {
        q: { fr: 'Stops « ronds » : pourquoi les éviter ?', en: '"Round" stops: why avoid?' },
        options: { fr: ['Trop visibles, liquidité aspirée', 'Trop chers à exécuter', 'Aucun problème'], en: ['Too visible, liquidity gets swept', 'Too expensive to execute', 'No problem'] },
        correct: 0,
        rationale: { fr: 'Les market makers connaissent ces niveaux. La mèche y passe puis revient.', en: 'Market makers know these levels. The wick goes there then comes back.' },
      },
    ],
  },
  'structure-02': {
    chart: { symbol: 'AMEX:SPY', interval: 'D' },
    intro: {
      fr: [
        'Un « plus haut plus haut » (HH) suivi d’un « plus bas plus haut » (HL) confirme qu’une tendance haussière est en place. C’est la grammaire minimale.',
        'Tant que chaque nouvelle correction reste au‑dessus de la précédente, le marché vous dit qu’il monte. Quand un bas casse le précédent (LL), il vous dit autre chose.',
        'Cette lecture est plus simple que les figures et plus fiable que les indicateurs. Elle ne nécessite aucun outil — juste deux yeux et un crayon.',
      ],
      en: [
        'A "higher high" (HH) followed by a "higher low" (HL) confirms an uptrend is in place. That is the minimum grammar.',
        'As long as every new pullback stays above the previous low, the market tells you it is rising. When a low breaks the previous one (LL), it tells you something else.',
        'This read is simpler than patterns and more reliable than indicators. It needs no tool — two eyes and a pencil.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Prix : 50 → 60 → 55 → 70 → 62. Le 62 est‑il un HL ?',
        en: 'Price: 50 → 60 → 55 → 70 → 62. Is 62 a HL?',
      },
      options: {
        fr: ['Oui — 62 > 55, la séquence haussière tient', 'Non — c’est en dessous du dernier haut', 'Impossible à dire'],
        en: ['Yes — 62 > 55, the uptrend sequence holds', 'No — it is below the last high', 'Cannot tell'],
      },
      correct: 0,
      rationale: {
        fr: '62 > 55 (précédent bas). Tant que c’est le cas, la tendance haussière survit, peu importe que 62 < 70.',
        en: '62 > 55 (previous low). As long as that holds, the uptrend survives — regardless of 62 < 70.',
      },
    },
    quiz: [
      {
        q: { fr: 'Quel événement casse une tendance haussière ?', en: 'What event breaks an uptrend?' },
        options: { fr: ['Une bougie rouge', 'Un nouveau LL', 'Un croisement de moyennes'], en: ['A red candle', 'A new LL', 'A moving average cross'] },
        correct: 1,
        rationale: { fr: 'Le LL est l’événement structurel. La bougie rouge isolée ne dit rien.', en: 'The LL is the structural event. A lone red candle says nothing.' },
      },
      {
        q: { fr: 'Combien de hauts et de bas faut‑il pour parler de tendance ?', en: 'How many highs and lows to call it a trend?' },
        options: { fr: ['Au moins deux séquences HH/HL', 'Une seule', 'Cinq minimum'], en: ['At least two HH/HL sequences', 'Just one', 'Five minimum'] },
        correct: 0,
        rationale: { fr: 'Deux hauts et deux bas. En dessous, c’est encore du bruit.', en: 'Two highs and two lows. Below that, it is still noise.' },
      },
      {
        q: { fr: 'À quoi sert de marquer ses hauts et bas ?', en: 'What does marking your highs and lows do?' },
        options: { fr: ['À montrer son talent', 'À rendre objective la lecture de tendance', 'À perdre du temps'], en: ['To show off', 'To make trend reading objective', 'To waste time'] },
        correct: 1,
        rationale: { fr: 'Marquer rend la décision binaire — donc ré‑exécutable demain.', en: 'Marking makes the decision binary — so re‑executable tomorrow.' },
      },
    ],
  },
};

// ─── Placeholder generator ─────────────────────────────────────────────────

function placeholder(track: TrackMeta, lesson: LessonMeta): LessonContent {
  const title = lesson.title;
  return {
    intro: {
      fr: [
        `Cette leçon couvre : ${title.fr}.`,
        `Elle s’inscrit dans la piste « ${track.title.fr} » et s’appuie sur les leçons précédentes.`,
        'Le contenu complet sera dévoilé séance après séance : Tickra ne déverse pas tout d’un coup, vous progressez bloc par bloc.',
      ],
      en: [
        `This lesson covers: ${title.en}.`,
        `It belongs to the "${track.title.en}" track and builds on the previous lessons.`,
        'Full content is unlocked session after session: Tickra does not dump everything at once, you progress block by block.',
      ],
    },
    drill: {
      prompt: {
        fr: `Sur l’aperçu de la leçon « ${title.fr} », quelle affirmation est la plus prudente ?`,
        en: `On the preview for "${title.en}", which statement is the most prudent?`,
      },
      options: {
        fr: [
          'Je vais lire l’exposé puis pratiquer sur trois cas avant de juger.',
          'J’applique immédiatement sur un compte réel.',
          'Je passe la leçon, je connais déjà le sujet.',
        ],
        en: [
          'I will read the brief then practise three cases before judging.',
          'I will apply it immediately on a live account.',
          'I will skip — I already know this topic.',
        ],
      },
      correct: 0,
      rationale: {
        fr: 'La méthode Tickra : exposé → exercice → revue. Sauter une étape ne fait pas gagner du temps.',
        en: 'The Tickra method: brief → drill → review. Skipping a step does not save time.',
      },
    },
    quiz: [
      {
        q: { fr: 'Tickra enseigne d’abord :', en: 'Tickra teaches first:' },
        options: { fr: ['La méthode', 'Les signaux', 'Les indicateurs secrets'], en: ['The method', 'Signals', 'Secret indicators'] },
        correct: 0,
        rationale: { fr: 'La méthode, toujours. Le reste se transmet ensuite.', en: 'The method, always. The rest follows.' },
      },
      {
        q: { fr: 'Une leçon Tickra dure :', en: 'A Tickra lesson runs:' },
        options: { fr: ['Environ 10 minutes', 'Une heure minimum', 'Aucune durée fixe'], en: ['About 10 minutes', 'At least one hour', 'No fixed length'] },
        correct: 0,
        rationale: { fr: 'Dix minutes. Court, dense, refaisable.', en: 'Ten minutes. Short, dense, repeatable.' },
      },
      {
        q: { fr: 'Le point de contrôle d’une piste sert à :', en: 'A track checkpoint exists to:' },
        options: { fr: ['Valider l’ensemble de la piste', 'Punir les retards', 'Comparer avec d’autres apprenants'], en: ['Validate the whole track', 'Punish lateness', 'Compare with other learners'] },
        correct: 0,
        rationale: { fr: 'Un point de contrôle peut être manqué — et repassé. C’est un test, pas une sanction.', en: 'A checkpoint can be failed — and retaken. It is a test, not a punishment.' },
      },
    ],
  };
}

export function getLessonContent(track: TrackMeta, lesson: LessonMeta): LessonContent {
  return seeded[lesson.id] ?? placeholder(track, lesson);
}

export function isSeeded(lessonId: string): boolean {
  return Object.prototype.hasOwnProperty.call(seeded, lessonId);
}
