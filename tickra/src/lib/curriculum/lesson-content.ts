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
  'candles-02': {
    chart: { symbol: 'FX:EURUSD', interval: '60' },
    intro: {
      fr: [
        'Une bougie se lit par son ratio corps/ombres. Pas par sa taille absolue, pas par sa couleur — par sa proportion.',
        'Corps long + ombres courtes = un côté a tenu la séance. Corps court + longues ombres = personne n’a vraiment gagné, le marché a hésité.',
        'Pour qu’un signal soit fiable, le corps doit représenter au moins 60 % de l’amplitude. En dessous, la lecture devient bruit.',
      ],
      en: [
        'A candle is read by its body/wick ratio. Not its absolute size, not its colour — its proportion.',
        'Long body + short wicks = one side held the session. Short body + long wicks = nobody really won, the market hesitated.',
        'For a signal to be reliable, the body should be at least 60% of the range. Below that, the read becomes noise.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Bougie : Open 100, High 110, Low 99, Close 109. Quel est le ratio corps/amplitude ?',
        en: 'Candle: Open 100, High 110, Low 99, Close 109. What is the body/range ratio?',
      },
      options: {
        fr: ['≈ 82 % (corps = 9, amplitude = 11)', '≈ 50 %', '≈ 95 %'],
        en: ['≈ 82% (body = 9, range = 11)', '≈ 50%', '≈ 95%'],
      },
      correct: 0,
      rationale: {
        fr: 'Corps = 109 − 100 = 9. Amplitude = 110 − 99 = 11. Ratio = 9/11 ≈ 82 %. Bougie forte mais pas extrême.',
        en: 'Body = 109 − 100 = 9. Range = 110 − 99 = 11. Ratio = 9/11 ≈ 82%. Strong but not extreme.',
      },
    },
    quiz: [
      {
        q: { fr: 'Une longue ombre haute signale :', en: 'A long upper wick signals:' },
        options: { fr: ['Une force haussière', 'Un rejet à la hausse', 'Aucune information'], en: ['Bullish strength', 'Rejection of higher prices', 'No information'] },
        correct: 1,
        rationale: { fr: 'Le prix y est monté puis a été refoulé. Surtout pertinent au sommet d’une tendance.', en: 'Price went up and was pushed back. Especially relevant at the top of a trend.' },
      },
      {
        q: { fr: 'Une bougie avec corps de 30 % et longues ombres :', en: 'A candle with 30% body and long wicks:' },
        options: { fr: ['Signal fort', 'Indécision — à ignorer seule', 'Confirme la tendance'], en: ['Strong signal', 'Indecision — ignore alone', 'Confirms the trend'] },
        correct: 1,
        rationale: { fr: '30 % de corps = aucun camp n’a dominé. Lisez le contexte.', en: '30% body = no side dominated. Read context.' },
      },
      {
        q: { fr: 'Pourquoi mesurer le ratio plutôt que la taille absolue ?', en: 'Why measure ratio instead of absolute size?' },
        options: { fr: ['Pour comparer entre actifs et timeframes', 'Pour faire joli', 'C’est inutile'], en: ['To compare across assets and timeframes', 'For looks', 'Pointless'] },
        correct: 0,
        rationale: { fr: 'Le ratio est invariant. Une grande bougie sur 1D et 1H n’ont rien à voir en absolu, mais leur ratio se compare.', en: 'Ratio is scale-invariant. A large 1D and 1H candle differ absolutely, but their ratios compare.' },
      },
    ],
  },
  'candles-03': {
    intro: {
      fr: [
        'Une bougie pleine (corps coloré, souvent rouge) signale une clôture sous l’ouverture. Une bougie creuse (ou verte) signale une clôture au‑dessus.',
        'Sur les plateformes modernes, on parle simplement de bougies vertes ou rouges. La terminologie « pleine/creuse » vient des bougies historiques imprimées en noir et blanc.',
        'Ce qui compte, ce n’est jamais la couleur. C’est où la bougie clôture par rapport à son ouverture, à son haut, et à son bas.',
      ],
      en: [
        'A filled candle (coloured body, often red) signals a close below the open. A hollow (or green) candle signals a close above.',
        'On modern platforms you simply say green or red. The "filled/hollow" terminology comes from historical candles printed in black and white.',
        'What matters is never the colour. It is where the candle closes relative to its open, its high, and its low.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Vous voyez une bougie verte avec une grande ombre haute. Que retenez‑vous d’abord ?',
        en: 'You see a green candle with a long upper wick. What do you keep first?',
      },
      options: {
        fr: ['Hausse confirmée — vert = positif', 'Hausse contestée — rejet en haut malgré la clôture positive', 'À ignorer'],
        en: ['Confirmed up — green = positive', 'Contested up — rejection on top despite positive close', 'Ignore'],
      },
      correct: 1,
      rationale: {
        fr: 'Le vert dit que la clôture est au‑dessus de l’ouverture. La longue ombre haute dit que le prix a été refusé plus haut. Les deux comptent.',
        en: 'Green says close > open. The long upper wick says price was refused higher. Both matter.',
      },
    },
    quiz: [
      {
        q: { fr: 'La couleur d’une bougie indique :', en: 'A candle’s colour tells you:' },
        options: { fr: ['La force du mouvement', 'Le sens de clôture par rapport à l’ouverture', 'Le volume'], en: ['Move strength', 'Direction of close vs open', 'Volume'] },
        correct: 1,
        rationale: { fr: 'Rien de plus. La force se lit ailleurs.', en: 'Nothing more. Strength is read elsewhere.' },
      },
      {
        q: { fr: 'Deux bougies vertes consécutives :', en: 'Two consecutive green candles:' },
        options: { fr: ['Confirment toujours une tendance', 'Sont du bruit isolé', 'Dépendent de leur structure et du contexte'], en: ['Always confirm a trend', 'Are isolated noise', 'Depend on their structure and context'] },
        correct: 2,
        rationale: { fr: 'Deux vertes minuscules au milieu d’une baisse ne disent rien. Deux vertes avec corps + structure = autre histoire.', en: 'Two tiny green candles inside a downtrend mean nothing. Two with bodies + structure = different story.' },
      },
      {
        q: { fr: 'Pourquoi ne pas se fier à la couleur seule ?', en: 'Why not trust colour alone?' },
        options: { fr: ['Elle ignore les ombres et le contexte', 'Elle est mal calibrée', 'C’est culturel'], en: ['It ignores wicks and context', 'It is miscalibrated', 'It is cultural'] },
        correct: 0,
        rationale: { fr: 'Sans les ombres et le contexte, vous lisez 25 % d’une bougie.', en: 'Without wicks and context, you read 25% of a candle.' },
      },
    ],
  },
  'candles-06': {
    intro: {
      fr: [
        'Le marteau a un petit corps en haut et une longue ombre basse — au moins deux fois plus longue que le corps. Forme de marteau, manche vers le bas.',
        'En bas d’une tendance baissière, c’est un rejet du bas : les vendeurs ont poussé, les acheteurs ont repris le contrôle avant clôture.',
        'Le pendu a la même forme — mais en haut d’une tendance haussière. Même bougie, message inverse. Sans le contexte, on confond les deux.',
      ],
      en: [
        'A hammer has a small body at the top and a long lower wick — at least twice the body. Hammer shape, handle down.',
        'At the bottom of a downtrend, it is a low rejection: sellers pushed, buyers regained control before close.',
        'The hanging man has the same shape — but at the top of an uptrend. Same candle, opposite message. Without context you confuse them.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Un marteau apparaît après 5 séances baissières, sur un support connu. Que faites‑vous ?',
        en: 'A hammer prints after 5 down sessions, on a known support. What do you do?',
      },
      options: {
        fr: ['J’achète sur la clôture du marteau', 'J’attends une confirmation haussière sur la bougie suivante', 'J’ignore'],
        en: ['Buy on the hammer close', 'Wait for a bullish confirmation on the next candle', 'Ignore'],
      },
      correct: 1,
      rationale: {
        fr: 'Marteau + support = setup. La confirmation est la clôture suivante au‑dessus du marteau. Sans elle, c’est un piège fréquent.',
        en: 'Hammer + support = setup. Confirmation is the next close above the hammer. Without it, frequent trap.',
      },
    },
    quiz: [
      {
        q: { fr: 'Marteau et pendu sont :', en: 'Hammer and hanging man are:' },
        options: { fr: ['Deux bougies différentes', 'La même forme, deux contextes', 'Sans rapport'], en: ['Two different candles', 'The same shape, two contexts', 'Unrelated'] },
        correct: 1,
        rationale: { fr: 'Identiques en forme. Le contexte (tendance amont) décide tout.', en: 'Identical shape. Context (prior trend) decides everything.' },
      },
      {
        q: { fr: 'Que vaut un marteau au milieu d’un range ?', en: 'What is a hammer worth inside a range?' },
        options: { fr: ['Rien — pas de tendance à inverser', 'Tout', 'À 50 %'], en: ['Nothing — no trend to reverse', 'Everything', 'Half value'] },
        correct: 0,
        rationale: { fr: 'Une bougie de retournement n’a de sens que si il y a une tendance à retourner.', en: 'A reversal candle only matters if there is a trend to reverse.' },
      },
      {
        q: { fr: 'Quelle proportion ombre/corps qualifie un marteau ?', en: 'What wick/body ratio qualifies a hammer?' },
        options: { fr: ['Ombre basse > 2× le corps', 'Ombre = corps', 'Ombre haute ≥ corps'], en: ['Lower wick > 2× body', 'Wick = body', 'Upper wick ≥ body'] },
        correct: 0,
        rationale: { fr: 'Sous 2×, c’est juste une bougie avec une ombre. Pas un marteau.', en: 'Below 2×, it is just a candle with a wick. Not a hammer.' },
      },
    ],
  },
  'candles-07': {
    intro: {
      fr: [
        'L’étoile du matin est une figure de retournement haussier en trois bougies : une baissière, une petite (l’étoile, souvent un doji) avec gap, puis une haussière qui reprend plus de la moitié de la première.',
        'L’étoile du soir est son inverse, baissière, en haut de tendance haussière.',
        'C’est une des figures les plus fiables — précisément parce qu’elle demande trois bougies de confirmation, pas une.',
      ],
      en: [
        'The morning star is a 3‑candle bullish reversal: a bearish candle, a small one (the star, often a doji) with a gap, then a bullish candle that recovers more than half of the first.',
        'The evening star is its inverse, bearish, at the top of an uptrend.',
        'It is among the most reliable patterns — precisely because it requires three candles of confirmation, not one.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Trois bougies : grande rouge, doji isolé, grande verte qui clôture au-dessus de 70 % de la rouge. Figure ?',
        en: 'Three candles: big red, isolated doji, big green that closes above 70% of the red. Pattern?',
      },
      options: {
        fr: ['Étoile du matin (haussier)', 'Étoile du soir (baissier)', 'Aucune'],
        en: ['Morning star (bullish)', 'Evening star (bearish)', 'None'],
      },
      correct: 0,
      rationale: {
        fr: 'C’est la séquence canonique de l’étoile du matin. Plus la troisième bougie reprend, plus le signal est fort.',
        en: 'The canonical morning star sequence. The more the third candle recovers, the stronger the signal.',
      },
    },
    quiz: [
      {
        q: { fr: 'Pourquoi l’étoile demande trois bougies ?', en: 'Why does the star pattern require three candles?' },
        options: { fr: ['Pour le folklore', 'Pour réduire les faux signaux', 'C’est arbitraire'], en: ['For folklore', 'To reduce false signals', 'Arbitrary'] },
        correct: 1,
        rationale: { fr: 'Trois confirmations consécutives = bruit fortement réduit.', en: 'Three consecutive confirmations = noise heavily reduced.' },
      },
      {
        q: { fr: 'Une étoile du soir doit apparaître :', en: 'An evening star must appear:' },
        options: { fr: ['En haut d’une tendance haussière', 'En bas d’une tendance baissière', 'N’importe où'], en: ['At the top of an uptrend', 'At the bottom of a downtrend', 'Anywhere'] },
        correct: 0,
        rationale: { fr: 'Retournement baissier = il faut une tendance haussière à retourner.', en: 'Bearish reversal = it needs an uptrend to reverse.' },
      },
      {
        q: { fr: 'Si la troisième bougie ne dépasse pas 50 % de la première :', en: 'If the third candle does not exceed 50% of the first:' },
        options: { fr: ['Le signal est faible', 'Le signal est plus fort', 'Cela ne change rien'], en: ['The signal is weak', 'The signal is stronger', 'Makes no difference'] },
        correct: 0,
        rationale: { fr: 'La règle des 50 % est le seuil canonique. En dessous, attendez davantage de confirmation.', en: 'The 50% rule is the canonical threshold. Below, wait for more confirmation.' },
      },
    ],
  },
  'candles-08': {
    intro: {
      fr: [
        'Une bougie englobante haussière : une bougie verte dont le corps englobe entièrement le corps de la bougie rouge précédente.',
        'Si elle apparaît en fin de tendance baissière, c’est un signal fort que les acheteurs viennent de reprendre le contrôle.',
        'Plus le corps englobant est grand par rapport à la moyenne récente, plus le signal est puissant. Petit englobant = faible message.',
      ],
      en: [
        'A bullish engulfing candle: a green candle whose body fully engulfs the body of the previous red candle.',
        'When it forms at the end of a downtrend, it is a strong signal that buyers just regained control.',
        'The larger the engulfing body relative to recent average, the more powerful the signal. Tiny engulfing = weak message.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Englobante haussière sur l’avant‑dernière séance d’un range, sans tendance baissière préalable. Setup ?',
        en: 'Bullish engulfing inside a range, no prior downtrend. Setup?',
      },
      options: {
        fr: ['Setup d’achat valide', 'Pas de setup — il manque la tendance amont', 'Setup de vente'],
        en: ['Valid buy setup', 'No setup — no prior downtrend', 'Sell setup'],
      },
      correct: 1,
      rationale: {
        fr: 'Sans baisse amont, l’englobante n’a rien à retourner. C’est juste deux bougies.',
        en: 'Without prior down move, the engulfing has nothing to reverse. Just two candles.',
      },
    },
    quiz: [
      {
        q: { fr: 'Englobante haussière, condition essentielle :', en: 'Bullish engulfing, essential condition:' },
        options: { fr: ['Corps vert > corps rouge précédent', 'Volume au plus haut historique', 'Trois confirmations'], en: ['Green body > previous red body', 'All-time high volume', 'Three confirmations'] },
        correct: 0,
        rationale: { fr: 'Le critère unique est l’englobante des corps. Volume est un bonus.', en: 'The single criterion is body engulfing. Volume is a bonus.' },
      },
      {
        q: { fr: 'L’englobante doit‑elle englober les ombres ?', en: 'Must the engulfing cover the wicks?' },
        options: { fr: ['Oui, c’est obligatoire', 'Non, seulement les corps', 'Indifférent'], en: ['Yes, mandatory', 'No, only the bodies', 'Indifferent'] },
        correct: 1,
        rationale: { fr: 'La règle classique cible les corps. Englober aussi les ombres renforce le signal.', en: 'The classic rule targets bodies. Engulfing wicks too reinforces the signal.' },
      },
      {
        q: { fr: 'En haut d’une tendance haussière, qu’attendre ?', en: 'At the top of an uptrend, what to expect?' },
        options: { fr: ['Englobante baissière comme retournement', 'Englobante haussière comme continuation', 'Rien'], en: ['Bearish engulfing as reversal', 'Bullish engulfing as continuation', 'Nothing'] },
        correct: 0,
        rationale: { fr: 'Au sommet, c’est l’englobante baissière qui signale le potentiel retournement.', en: 'At the top, the bearish engulfing signals potential reversal.' },
      },
    ],
  },
  'candles-09': {
    intro: {
      fr: [
        'L’englobante baissière est le miroir : une bougie rouge dont le corps englobe le corps de la bougie verte précédente.',
        'En haut d’une tendance haussière, c’est un signal de retournement : les vendeurs viennent de prendre le contrôle pour la première fois.',
        'Comme pour son équivalent haussier : plus le corps est grand, plus le signal est fort. Petit englobant en range = bruit.',
      ],
      en: [
        'The bearish engulfing is the mirror: a red candle whose body engulfs the previous green candle’s body.',
        'At the top of an uptrend, it is a reversal signal: sellers just took control for the first time.',
        'Same as its bullish twin: the larger the body, the stronger the signal. Tiny engulfing in a range = noise.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Englobante baissière en haut d’une tendance haussière de 6 semaines, sur résistance. Action ?',
        en: 'Bearish engulfing at the top of a 6‑week uptrend, on resistance. Action?',
      },
      options: {
        fr: ['Vente immédiate sur la clôture de l’englobante', 'Attente de la bougie de confirmation suivante', 'Achat sur faiblesse'],
        en: ['Sell immediately on engulfing close', 'Wait for the next confirmation candle', 'Buy on weakness'],
      },
      correct: 1,
      rationale: {
        fr: 'Setup propre, mais confirmation = clôture suivante sous le bas de l’englobante.',
        en: 'Clean setup, but confirmation = next close under the engulfing low.',
      },
    },
    quiz: [
      {
        q: { fr: 'Englobante baissière sans tendance haussière préalable :', en: 'Bearish engulfing without prior uptrend:' },
        options: { fr: ['Rien à retourner — bruit', 'Signal fort', 'Inverse-le mentalement'], en: ['Nothing to reverse — noise', 'Strong signal', 'Mentally flip it'] },
        correct: 0,
        rationale: { fr: 'Comme son miroir, l’englobante exige une tendance amont.', en: 'Like its mirror, the engulfing requires a prior trend.' },
      },
      {
        q: { fr: 'L’englobante est plus fiable que :', en: 'The engulfing is more reliable than:' },
        options: { fr: ['Une seule bougie marubozu', 'Une étoile du soir', 'Aucun signal'], en: ['A lone marubozu', 'An evening star', 'No signal'] },
        correct: 0,
        rationale: { fr: 'Deux bougies > une. L’étoile du soir (3 bougies) reste plus fiable encore.', en: 'Two candles > one. Evening star (3 candles) is more reliable still.' },
      },
      {
        q: { fr: 'Le volume sur l’englobante :', en: 'Volume on the engulfing:' },
        options: { fr: ['N’a aucun rôle', 'Renforce le signal s’il est élevé', 'Doit être en baisse'], en: ['Has no role', 'Reinforces the signal if high', 'Must be falling'] },
        correct: 1,
        rationale: { fr: 'Volume élevé sur l’englobante = conviction réelle des vendeurs.', en: 'High volume on the engulfing = real seller conviction.' },
      },
    ],
  },
  'candles-10': {
    intro: {
      fr: [
        'Les trois soldats blancs : trois bougies haussières consécutives, chacune avec un corps significatif et clôturant près de son plus haut.',
        'C’est un signal de retournement haussier en fin de baisse, ou de poursuite de tendance en cours.',
        'Les trois corbeaux noirs sont l’inverse. Trois bougies baissières alignées, clôtures près des plus bas. Retournement baissier en haut, ou continuation à la baisse.',
      ],
      en: [
        'Three white soldiers: three consecutive bullish candles, each with a meaningful body and closing near its high.',
        'It signals a bullish reversal at the bottom of a downtrend, or trend continuation when already up.',
        'Three black crows are the inverse. Three aligned bearish candles, closes near the lows. Bearish reversal on top, or downside continuation.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Trois bougies vertes alignées, chacune clôturant au‑dessus de la précédente, après 4 semaines de baisse. Lecture ?',
        en: 'Three aligned green candles, each closing above the previous, after a 4‑week downtrend. Read?',
      },
      options: {
        fr: ['Trois soldats blancs — possible retournement haussier', 'Bruit aléatoire', 'Évitez à tout prix'],
        en: ['Three white soldiers — possible bullish reversal', 'Random noise', 'Avoid at all costs'],
      },
      correct: 0,
      rationale: {
        fr: 'Trois bougies de continuation après baisse = soldats blancs canoniques. Confirmation par cassure de structure ensuite.',
        en: 'Three continuation candles after a downtrend = canonical white soldiers. Confirm via structure break afterwards.',
      },
    },
    quiz: [
      {
        q: { fr: 'Trois corbeaux noirs apparaissent toujours :', en: 'Three black crows always appear:' },
        options: { fr: ['En haut d’une hausse — retournement', 'N’importe où', 'En bas d’une baisse'], en: ['At the top of an up move — reversal', 'Anywhere', 'At the bottom of a down move'] },
        correct: 0,
        rationale: { fr: 'Comme toute figure de retournement, il faut une tendance à retourner.', en: 'Like any reversal pattern, you need a trend to reverse.' },
      },
      {
        q: { fr: 'Une faiblesse fréquente de la figure :', en: 'A frequent weakness of the pattern:' },
        options: { fr: ['Elle vient parfois trop tard, après la majorité du mouvement', 'Elle n’existe pas', 'Elle est arbitraire'], en: ['It sometimes arrives late, after most of the move', 'It does not exist', 'It is arbitrary'] },
        correct: 0,
        rationale: { fr: 'Trois bougies = du temps. Le mouvement a peut‑être déjà été parcouru.', en: 'Three candles = time. The move may already be done.' },
      },
      {
        q: { fr: 'Chaque bougie doit clôturer :', en: 'Each candle must close:' },
        options: { fr: ['Près de son extrême (haut ou bas)', 'Au milieu', 'N’importe où'], en: ['Near its extreme (high or low)', 'In the middle', 'Anywhere'] },
        correct: 0,
        rationale: { fr: 'Près de l’extrême = conviction du côté gagnant.', en: 'Near the extreme = conviction of the winning side.' },
      },
    ],
  },
  'candles-11': {
    intro: {
      fr: [
        'Une bougie n’existe jamais seule. Le contexte — tendance amont, niveau testé, volume, timeframe — décide à 80 % du signal.',
        'Une même marubozu peut être : un climax (fin de tendance), une cassure (rupture de niveau), ou un simple décrochage (au milieu d’un range). Trois lectures, une seule bougie.',
        'La règle de Tickra : avant de lire la bougie, repérez d’abord la tendance, les niveaux, et la volatilité. La bougie n’est que le déclic final.',
      ],
      en: [
        'A candle never stands alone. Context — prior trend, level tested, volume, timeframe — decides 80% of the signal.',
        'The same marubozu can be: a climax (end of trend), a breakout (level break), or just noise (mid-range). Three reads, one candle.',
        'Tickra’s rule: before reading the candle, locate the trend, the levels, and the volatility. The candle is just the final trigger.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Un doji apparaît. Première chose à vérifier ?',
        en: 'A doji appears. First thing to check?',
      },
      options: {
        fr: ['Le contexte (tendance + niveau)', 'La taille de la bougie', 'La couleur de fond'],
        en: ['Context (trend + level)', 'The candle’s size', 'Background colour'],
      },
      correct: 0,
      rationale: {
        fr: 'Sans contexte, un doji ne vaut rien. Avec contexte, il devient un signal fort.',
        en: 'No context = nothing. With context, a doji becomes a strong signal.',
      },
    },
    quiz: [
      {
        q: { fr: 'L’ordre correct de lecture :', en: 'Correct reading order:' },
        options: { fr: ['Tendance → niveau → bougie', 'Bougie → tendance → niveau', 'Couleur → forme → niveau'], en: ['Trend → level → candle', 'Candle → trend → level', 'Colour → shape → level'] },
        correct: 0,
        rationale: { fr: 'Le grand cadre avant le détail. Toujours.', en: 'Big picture before detail. Always.' },
      },
      {
        q: { fr: 'Sur une zone vierge sans niveau majeur :', en: 'On a blank zone with no major level:' },
        options: { fr: ['Toute bougie perd de la puissance', 'Toute bougie a plus de valeur', 'Aucune incidence'], en: ['Any candle loses power', 'Any candle gains power', 'No impact'] },
        correct: 0,
        rationale: { fr: 'Pas de niveau = pas de bataille = pas de signal fort.', en: 'No level = no battle = no strong signal.' },
      },
      {
        q: { fr: 'Que faire d’une figure sans volume ?', en: 'What about a pattern without volume?' },
        options: { fr: ['Confiance réduite', 'Confiance maximale', 'Sans incidence'], en: ['Reduced confidence', 'Maximum confidence', 'No impact'] },
        correct: 0,
        rationale: { fr: 'Volume confirme l’engagement des participants. Pas de volume = pas de conviction.', en: 'Volume confirms participant commitment. No volume = no conviction.' },
      },
    ],
  },
  'candles-12': {
    intro: {
      fr: [
        'Point de contrôle de la piste Bougies japonaises. Cinq questions, pas de marche arrière. Vous pouvez le repasser.',
        'Tickra n’utilise pas ces tests pour vous juger. Ils servent à fixer ce qui mérite révision avant de continuer.',
        'Si vous échouez à plus d’une question, retournez aux leçons concernées. Ce n’est ni un échec ni une sanction — c’est de l’économie d’erreurs futures.',
      ],
      en: [
        'Candles track checkpoint. Five questions, no going back. You can retake.',
        'Tickra does not use these tests to judge. They flag what deserves a review before continuing.',
        'If you miss more than one, revisit the relevant lessons. Not a failure or a punishment — it is future-error economics.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Vous trouvez une englobante haussière sur 1H, sans tendance baissière sur 4H. Que faire ?',
        en: 'You find a bullish engulfing on 1H, with no downtrend on 4H. What do you do?',
      },
      options: {
        fr: ['Tradez — l’englobante est claire', 'Ne tradez pas — il n’y a rien à retourner', 'Inversez en short'],
        en: ['Trade — the engulfing is clear', 'Do not trade — nothing to reverse', 'Flip to short'],
      },
      correct: 1,
      rationale: {
        fr: 'Le timeframe supérieur décide. Sans tendance amont, le signal perd 80 % de sa valeur.',
        en: 'The higher timeframe decides. Without prior trend, the signal loses 80% of its value.',
      },
    },
    quiz: [
      {
        q: { fr: 'Quelle figure demande trois bougies ?', en: 'Which pattern needs three candles?' },
        options: { fr: ['Étoile du matin', 'Englobante', 'Marubozu'], en: ['Morning star', 'Engulfing', 'Marubozu'] },
        correct: 0,
        rationale: { fr: 'Trois bougies = trois confirmations consécutives.', en: 'Three candles = three consecutive confirmations.' },
      },
      {
        q: { fr: 'Un marteau au sommet :', en: 'A hammer at the top:' },
        options: { fr: ['Devient un pendu', 'Reste un marteau', 'Perd sa forme'], en: ['Becomes a hanging man', 'Stays a hammer', 'Loses its shape'] },
        correct: 0,
        rationale: { fr: 'Même forme, contexte inverse, nom inverse.', en: 'Same shape, opposite context, opposite name.' },
      },
      {
        q: { fr: 'La couleur d’une bougie :', en: 'A candle’s colour:' },
        options: { fr: ['Décide tout', 'N’est qu’une dérivée', 'Est un indicateur retardé'], en: ['Decides everything', 'Is only a derivative', 'Is a lagging indicator'] },
        correct: 1,
        rationale: { fr: 'Open vs close. Rien de plus.', en: 'Open vs close. Nothing more.' },
      },
    ],
  },
  'structure-03': {
    chart: { symbol: 'AMEX:SPY', interval: 'D' },
    intro: {
      fr: [
        'Un range est une zone où le prix oscille entre un support et une résistance bien identifiés. Pas de séquence HH/HL/LL/LH claire — juste un aller‑retour.',
        'Tradez le range = acheter le bas, vendre le haut. Tradez la cassure = attendre que le prix sorte avec conviction.',
        'L’erreur la plus chère : trader le range comme une tendance, ou la tendance comme un range. Reconnaître lequel des deux on a sous les yeux est le travail.',
      ],
      en: [
        'A range is a zone where price oscillates between a defined support and resistance. No clear HH/HL/LL/LH sequence — just back and forth.',
        'Trade the range = buy the low, sell the high. Trade the break = wait for price to leave with conviction.',
        'The most expensive mistake: trade a range like a trend, or a trend like a range. Recognising which one you have in front of you is the job.',
      ],
    },
    drill: {
      prompt: {
        fr: 'EUR/USD oscille entre 1.07 et 1.09 depuis trois semaines. Tendance ou range ?',
        en: 'EUR/USD oscillates between 1.07 and 1.09 for three weeks. Trend or range?',
      },
      options: {
        fr: ['Range — aller-retour entre deux niveaux', 'Tendance haussière', 'Tendance baissière'],
        en: ['Range — back and forth between two levels', 'Uptrend', 'Downtrend'],
      },
      correct: 0,
      rationale: {
        fr: 'Trois semaines d’oscillation sans HH ni LL clairs = range. Stratégies différentes des tendances.',
        en: 'Three weeks of oscillation without clear HH or LL = range. Different strategies than trending markets.',
      },
    },
    quiz: [
      {
        q: { fr: 'Stratégie typique en range :', en: 'Typical range strategy:' },
        options: { fr: ['Acheter haut, vendre bas', 'Acheter bas, vendre haut', 'Hold and hope'], en: ['Buy high, sell low', 'Buy low, sell high', 'Hold and hope'] },
        correct: 1,
        rationale: { fr: 'Mean reversion. L’inverse exact d’une tendance.', en: 'Mean reversion. Exact opposite of a trend.' },
      },
      {
        q: { fr: 'Une fausse sortie de range :', en: 'A range fakeout:' },
        options: { fr: ['Est commune', 'N’existe pas', 'Est très rare'], en: ['Is common', 'Does not exist', 'Is very rare'] },
        correct: 0,
        rationale: { fr: 'Très commune. La cassure attend toujours une confirmation.', en: 'Very common. The breakout always needs confirmation.' },
      },
      {
        q: { fr: 'Combien de touches du niveau pour qualifier un range ?', en: 'How many touches to qualify a range?' },
        options: { fr: ['Minimum 2 sur chaque borne', '1 suffit', '5 minimum'], en: ['Minimum 2 on each side', '1 is enough', 'Min 5'] },
        correct: 0,
        rationale: { fr: 'Deux touches haut + deux bas = range défini.', en: 'Two highs + two lows = defined range.' },
      },
    ],
  },
  'structure-04': {
    intro: {
      fr: [
        'Une cassure de structure (Break of Structure, BoS) arrive quand le prix dépasse le dernier point clé de la séquence en cours. Un HH cassé à la hausse confirme la continuation, un HL cassé à la baisse signale un changement.',
        'C’est l’événement structurel le plus important. Beaucoup de stratégies de pros ne déclenchent que sur BoS — pas avant.',
        'Différencier la vraie cassure (clôture nette au‑delà) de la mèche (overshoot puis retour) sauve des dizaines de trades par mois.',
      ],
      en: [
        'A Break of Structure (BoS) happens when price exceeds the last key point of the ongoing sequence. A broken HH on the upside confirms continuation, a broken HL on the downside signals a change.',
        'It is the most important structural event. Many pro strategies only trigger on BoS — not before.',
        'Telling a real break (clean close beyond) from a wick (overshoot then back) saves dozens of trades a month.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Le prix dépasse la résistance précédente en mèche puis clôture en dessous. C’est une cassure ?',
        en: 'Price exceeds the prior resistance with a wick then closes below. Is it a break?',
      },
      options: {
        fr: ['Oui, le high est touché', 'Non, la clôture décide', 'Indifférent'],
        en: ['Yes, the high was touched', 'No, the close decides', 'Indifferent'],
      },
      correct: 1,
      rationale: {
        fr: 'Une mèche n’est pas une cassure. Il faut une clôture au‑delà pour valider.',
        en: 'A wick is not a break. You need a close beyond to validate.',
      },
    },
    quiz: [
      {
        q: { fr: 'Que valide une vraie BoS ?', en: 'What validates a real BoS?' },
        options: { fr: ['Une clôture nette au‑delà', 'Une mèche', 'Un volume bas'], en: ['A clean close beyond', 'A wick', 'Low volume'] },
        correct: 0,
        rationale: { fr: 'La clôture engage les participants. La mèche n’engage personne.', en: 'The close commits participants. The wick commits no one.' },
      },
      {
        q: { fr: 'Sur quel timeframe valider la cassure ?', en: 'On which timeframe to validate the break?' },
        options: { fr: ['Celui où le niveau a été dessiné', 'Sur 1m toujours', 'Sur D toujours'], en: ['The one where the level was drawn', 'Always 1m', 'Always D'] },
        correct: 0,
        rationale: { fr: 'Un niveau D se casse sur D. Un niveau 1H sur 1H.', en: 'A D level breaks on D. A 1H level on 1H.' },
      },
      {
        q: { fr: 'Action après une vraie BoS :', en: 'Action after a real BoS:' },
        options: { fr: ['Attendre un retest pour entrer', 'Vendre tout', 'Ne rien faire jamais'], en: ['Wait for a retest to enter', 'Sell everything', 'Never do anything'] },
        correct: 0,
        rationale: { fr: 'Le retest du niveau cassé est l’entrée la plus propre.', en: 'The retest of the broken level is the cleanest entry.' },
      },
    ],
  },
  'structure-05': {
    intro: {
      fr: [
        'Un pivot est un point d’inflexion : un haut où le prix retombe, ou un bas où le prix rebondit. Reliez deux pivots majeurs et vous avez un niveau.',
        'Plus un pivot est touché et respecté, plus il a de poids. Un niveau touché trois fois est plus fort qu’un niveau touché une seule fois.',
        'Mais attention : plus un niveau est touché, plus le marché finit par s’en lasser. À la quatrième ou cinquième touche, la cassure est statistiquement plus probable.',
      ],
      en: [
        'A pivot is an inflection point: a high where price falls back, or a low where price bounces. Connect two major pivots and you have a level.',
        'The more a pivot is touched and respected, the more weight it carries. A level touched three times is stronger than one touched once.',
        'But beware: the more a level is touched, the more the market tires of it. By the fourth or fifth touch, the break is statistically more likely.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Un support est touché et respecté trois fois en deux semaines. À la quatrième touche, quel scénario privilégier ?',
        en: 'A support is touched and respected three times in two weeks. On the fourth touch, which scenario?',
      },
      options: {
        fr: ['Rebond garanti', 'Cassure plus probable qu’avant', 'Pas d’information'],
        en: ['Guaranteed bounce', 'Break more likely than before', 'No information'],
      },
      correct: 1,
      rationale: {
        fr: 'Chaque touche use le niveau. Statistiquement, la cassure devient plus probable, pas moins.',
        en: 'Each touch wears the level. Statistically the break becomes more likely, not less.',
      },
    },
    quiz: [
      {
        q: { fr: 'Combien de pivots pour tracer un niveau ?', en: 'How many pivots to draw a level?' },
        options: { fr: ['Deux minimum', 'Un suffit', 'Sept'], en: ['Two minimum', 'One is enough', 'Seven'] },
        correct: 0,
        rationale: { fr: 'Un point isolé n’est pas un niveau. Deux pivots forment la première confirmation.', en: 'One point alone is not a level. Two pivots form the first confirmation.' },
      },
      {
        q: { fr: 'Pivot majeur vs mineur :', en: 'Major vs minor pivot:' },
        options: { fr: ['Le majeur a réagi sur plusieurs séances', 'Tous les pivots sont égaux', 'Le majeur est rouge'], en: ['The major reacted across several sessions', 'All pivots are equal', 'The major is red'] },
        correct: 0,
        rationale: { fr: 'La durée et l’ampleur de la réaction qualifient un pivot.', en: 'Duration and magnitude of reaction qualify a pivot.' },
      },
      {
        q: { fr: 'Que se passe-t-il quand un niveau majeur casse ?', en: 'What happens when a major level breaks?' },
        options: { fr: ['Il s’inverse souvent en support/résistance', 'Il disparaît', 'Il reste tel quel'], en: ['It often flips support/resistance', 'It vanishes', 'It stays the same'] },
        correct: 0,
        rationale: { fr: 'Un ancien support cassé devient souvent résistance. Et inversement.', en: 'A broken support often becomes resistance. And vice versa.' },
      },
    ],
  },
  'structure-06': {
    intro: {
      fr: [
        'Les niveaux psychologiques sont les chiffres ronds : 100, 1.10, 1.20, 10 000, etc. Ils ne reposent sur aucune logique technique — uniquement sur la psychologie collective.',
        'C’est précisément pour cela qu’ils fonctionnent. Tout le monde les voit, tout le monde y place des ordres, beaucoup s’y défendent.',
        'Ne les surestimez pas. Un niveau psychologique sans confluence (support technique, fibo, MA200…) n’est qu’une étiquette.',
      ],
      en: [
        'Psychological levels are round numbers: 100, 1.10, 1.20, 10,000, etc. They rely on no technical logic — only collective psychology.',
        'That is precisely why they work. Everyone sees them, everyone places orders there, many defend them.',
        'Do not overweight them. A psychological level without confluence (technical support, Fibo, 200MA…) is just a label.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Le S&P 500 approche 5000. Faut‑il s’attendre à une réaction ?',
        en: 'The S&P 500 approaches 5000. Should you expect a reaction?',
      },
      options: {
        fr: ['Oui, mais sans certitude — chiffre rond + média + ordres', 'Non, sans rapport', 'Oui, garanti'],
        en: ['Yes, but no certainty — round number + media + orders', 'No, unrelated', 'Yes, guaranteed'],
      },
      correct: 0,
      rationale: {
        fr: 'Forte probabilité d’hésitation. Garantie ? Jamais.',
        en: 'High probability of hesitation. Guaranteed? Never.',
      },
    },
    quiz: [
      {
        q: { fr: 'Niveau psychologique seul :', en: 'Lone psychological level:' },
        options: { fr: ['Suffit', 'Doit être confirmé par d’autres niveaux', 'Est inutile'], en: ['Is enough', 'Needs confirmation from other levels', 'Is useless'] },
        correct: 1,
        rationale: { fr: 'Confluence multiplie la fiabilité.', en: 'Confluence multiplies reliability.' },
      },
      {
        q: { fr: 'Pourquoi 1.10 sur EUR/USD est-il sensible ?', en: 'Why is 1.10 on EUR/USD sensitive?' },
        options: { fr: ['Tout le monde le voit, tout le monde y agit', 'Calcul mathématique', 'Couleur ronde'], en: ['Everyone sees it, everyone acts on it', 'Math calculation', 'Round colour'] },
        correct: 0,
        rationale: { fr: 'Auto‑réalisateur par concentration d’ordres et d’attention.', en: 'Self-fulfilling via concentration of orders and attention.' },
      },
      {
        q: { fr: 'Action sur niveau psychologique :', en: 'Action on a psychological level:' },
        options: { fr: ['Trader la réaction, pas le niveau lui‑même', 'Ouvrir aveuglément', 'Ignorer'], en: ['Trade the reaction, not the level itself', 'Open blindly', 'Ignore'] },
        correct: 0,
        rationale: { fr: 'Attendez la lecture du prix sur le niveau, pas le contact.', en: 'Wait for the price reaction at the level, not the touch.' },
      },
    ],
  },
  'structure-07': {
    intro: {
      fr: [
        'L’analyse multi‑timeframe : lire le grand cadre avant le détail. La règle simple : tendance définie sur TF supérieur, entrée affinée sur TF inférieur.',
        'Combinaisons classiques : D pour la tendance, 4H/1H pour le timing, 15m/5m pour l’exécution. Trois fenêtres, trois fonctions.',
        'L’erreur : zoomer sur le 5m et croire avoir compris la tendance. Vous ne voyez qu’une seconde de musique.',
      ],
      en: [
        'Multi‑timeframe analysis: read the big frame before the detail. Simple rule: trend defined on the higher TF, entry refined on the lower TF.',
        'Classic combos: D for trend, 4H/1H for timing, 15m/5m for execution. Three windows, three jobs.',
        'The mistake: zoom into 5m and think you understand the trend. You see one second of music.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Tendance haussière sur D. Sur 1H, baisse sur 4 séances. Que faire ?',
        en: 'Up trend on D. On 1H, 4 sessions down. What to do?',
      },
      options: {
        fr: ['Short — la baisse est claire', 'Acheter le pullback — pullback dans la tendance D', 'Ne rien faire jamais'],
        en: ['Short — the down is clear', 'Buy the pullback — pullback inside the D trend', 'Never do anything'],
      },
      correct: 1,
      rationale: {
        fr: 'Quatre séances 1H dans une tendance D haussière = pullback. Setup d’achat, pas de vente.',
        en: 'Four 1H sessions inside a D uptrend = pullback. Buy setup, not sell.',
      },
    },
    quiz: [
      {
        q: { fr: 'Tendance définie sur :', en: 'Trend defined on:' },
        options: { fr: ['TF supérieur', 'TF d’exécution', 'TF aléatoire'], en: ['Higher TF', 'Execution TF', 'Random TF'] },
        correct: 0,
        rationale: { fr: 'Toujours le TF d’au‑dessus.', en: 'Always the TF above.' },
      },
      {
        q: { fr: 'Combien de TF utiliser ?', en: 'How many TFs to use?' },
        options: { fr: ['Trois suffisent', 'Un seul', 'Sept ou plus'], en: ['Three are enough', 'Just one', 'Seven or more'] },
        correct: 0,
        rationale: { fr: 'Trois donnent tendance + timing + entrée. Plus = bruit.', en: 'Three give trend + timing + entry. More = noise.' },
      },
      {
        q: { fr: 'Si TF supérieur et TF inférieur se contredisent :', en: 'If higher TF and lower TF disagree:' },
        options: { fr: ['Le supérieur gagne', 'L’inférieur gagne', 'Le plus rapide gagne'], en: ['Higher wins', 'Lower wins', 'Fastest wins'] },
        correct: 0,
        rationale: { fr: 'Toujours. Sinon vous tradez le bruit.', en: 'Always. Otherwise you trade noise.' },
      },
    ],
  },
  'structure-08': {
    intro: {
      fr: [
        'Une tendance peut contenir une tendance opposée à plus petite échelle. Une hausse de 6 mois sur D peut contenir un pullback baissier de 2 semaines sur 4H.',
        'Cette emboîtement explique pourquoi le timing fonctionne : on attend que la tendance basse se retourne dans le sens de la tendance haute pour entrer.',
        'La règle du pull-back est ancienne et tient encore : entrer sur le retournement de la contre‑tendance, pas pendant.',
      ],
      en: [
        'A trend can contain an opposite trend at a smaller scale. A 6‑month D uptrend can contain a 2‑week bearish pullback on 4H.',
        'This nesting is why timing works: you wait for the lower trend to turn back into the higher trend before entering.',
        'The pullback rule is old and still holds: enter on the reversal of the counter‑trend, not during it.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Tendance D haussière. Sur 4H : LH puis HL. Action ?',
        en: 'D uptrend. On 4H: LH then HL. Action?',
      },
      options: {
        fr: ['Le HL sur 4H = fin du pullback. Setup d’achat', 'Tout vendre', 'Ignorer le 4H'],
        en: ['The HL on 4H = end of pullback. Buy setup', 'Sell everything', 'Ignore 4H'],
      },
      correct: 0,
      rationale: {
        fr: 'Le HL sur le timeframe inférieur signale la reprise de la tendance supérieure.',
        en: 'The HL on the lower TF signals the higher TF trend resumes.',
      },
    },
    quiz: [
      {
        q: { fr: 'Une contre‑tendance temporaire dans une tendance majeure s’appelle :', en: 'A temporary counter‑trend inside a major trend is called:' },
        options: { fr: ['Pullback / pullback', 'Cassure', 'Range'], en: ['Pullback', 'Break', 'Range'] },
        correct: 0,
        rationale: { fr: 'Terme universel pour la respiration d’une tendance.', en: 'Universal term for a trend’s breath.' },
      },
      {
        q: { fr: 'Quand entrer pendant le pullback ?', en: 'When to enter during a pullback?' },
        options: { fr: ['Jamais — attendre le retournement', 'Au milieu du pullback', 'Au plus profond'], en: ['Never — wait for the reversal', 'In the middle', 'At the deepest'] },
        correct: 0,
        rationale: { fr: 'Vous ignorez où s’arrête le pullback. Attendez le signe de reprise.', en: 'You don’t know where the pullback ends. Wait for the resumption.' },
      },
      {
        q: { fr: 'Profondeur typique d’un pullback sain :', en: 'Healthy pullback depth:' },
        options: { fr: ['33–61 % de la jambe précédente', '100 %', '5 %'], en: ['33–61% of the prior leg', '100%', '5%'] },
        correct: 0,
        rationale: { fr: 'Fibonacci 33–61 % est le rythme classique. Au‑delà = peut‑être un retournement.', en: 'Fibonacci 33–61% is the classic rhythm. Beyond = possibly a reversal.' },
      },
    ],
  },
  'structure-09': {
    intro: {
      fr: [
        'Une fausse cassure (fakeout) est une cassure qui rentre dans sa cage : le prix passe au‑delà du niveau, puis revient dedans.',
        'C’est l’un des pièges les plus chers pour les débutants. La règle de Tickra : attendre la clôture au‑delà ET, idéalement, le retest du niveau cassé.',
        'Les fakeouts ne sont pas un échec du système — c’est un mécanisme par lequel les market makers cherchent la liquidité au‑delà des stops évidents.',
      ],
      en: [
        'A fakeout is a break that goes back into its cage: price moves beyond the level, then returns inside.',
        'One of the most expensive traps for beginners. Tickra’s rule: wait for the close beyond AND, ideally, the retest of the broken level.',
        'Fakeouts are not a system failure — they are how market makers hunt liquidity beyond the obvious stops.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Le prix dépasse la résistance, mèche au‑delà, puis clôture en dessous. C’est une cassure ?',
        en: 'Price breaks the resistance, wicks above, then closes below. Is it a break?',
      },
      options: {
        fr: ['Non — fakeout typique', 'Oui — la mèche touche le niveau', 'Inconnu'],
        en: ['No — typical fakeout', 'Yes — the wick reached the level', 'Unknown'],
      },
      correct: 0,
      rationale: {
        fr: 'Aucune clôture au‑delà = pas de cassure. C’est une chasse à la liquidité au‑dessus du high.',
        en: 'No close beyond = no break. It is liquidity hunting above the high.',
      },
    },
    quiz: [
      {
        q: { fr: 'Comment éviter les fakeouts ?', en: 'How to avoid fakeouts?' },
        options: { fr: ['Attendre la clôture + le retest', 'Trader la mèche', 'Toujours utiliser un stop serré'], en: ['Wait for close + retest', 'Trade the wick', 'Always tight stop'] },
        correct: 0,
        rationale: { fr: 'Patience > précision. Clôture + retest = double filtre.', en: 'Patience > precision. Close + retest = double filter.' },
      },
      {
        q: { fr: 'Pourquoi les fakeouts existent‑ils ?', en: 'Why do fakeouts exist?' },
        options: { fr: ['Pour chasser les stops évidents', 'Pour énerver les traders', 'Par hasard'], en: ['To hunt obvious stops', 'To annoy traders', 'By chance'] },
        correct: 0,
        rationale: { fr: 'Au‑delà du high évident, tous les stops shorts attendent. Le marché vient les chercher.', en: 'Beyond the obvious high, all short stops wait. The market comes to take them.' },
      },
      {
        q: { fr: 'Le retest après cassure est‑il toujours obligatoire ?', en: 'Is the retest after a break always mandatory?' },
        options: { fr: ['Non, mais il améliore le R:R', 'Oui, sans exception', 'Non, c’est inutile'], en: ['No, but it improves R:R', 'Yes, no exception', 'No, useless'] },
        correct: 0,
        rationale: { fr: 'Sans retest vous loupez l’entrée parfois. Avec retest vous loupez le trade parfois. Choix de profil.', en: 'Without retest you may miss the entry. With retest you may miss the trade. Profile choice.' },
      },
    ],
  },
  'structure-10': {
    intro: {
      fr: [
        'Distinguer retournement et continuation est central. Le retournement change la tendance ; la continuation reprend la tendance après une pause.',
        'Signes de retournement : cassure de structure dans le sens opposé (premier LL après HH/HL, ou inverse), figures fortes (épaule‑tête‑épaule, double top), volume au sommet.',
        'Signes de continuation : pullback léger sans BoS, drapeaux, triangles, volume en baisse pendant la pause puis explosion à la reprise.',
      ],
      en: [
        'Telling reversal from continuation is central. Reversal changes the trend; continuation resumes the trend after a pause.',
        'Reversal cues: structure break in the opposite direction (first LL after HH/HL, or vice versa), strong patterns (head-and-shoulders, double top), volume at the top.',
        'Continuation cues: shallow pullback without BoS, flags, triangles, volume fading during the pause then bursting at resumption.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Tendance haussière, drapeau baissier de 3 séances, volume en baisse. Lecture ?',
        en: 'Up trend, 3‑session bear flag, volume falling. Read?',
      },
      options: {
        fr: ['Continuation probable', 'Retournement certain', 'Range définitif'],
        en: ['Likely continuation', 'Certain reversal', 'Definitive range'],
      },
      correct: 0,
      rationale: {
        fr: 'Drapeau + volume en baisse = pause, pas retournement. Continuation probable.',
        en: 'Flag + fading volume = pause, not reversal. Continuation likely.',
      },
    },
    quiz: [
      {
        q: { fr: 'Premier LL après une longue séquence HH/HL :', en: 'First LL after a long HH/HL sequence:' },
        options: { fr: ['Signal de retournement', 'Signal de continuation', 'Aucun signal'], en: ['Reversal signal', 'Continuation signal', 'No signal'] },
        correct: 0,
        rationale: { fr: 'BoS structurel dans le sens opposé = changement.', en: 'Structural BoS in the opposite direction = change.' },
      },
      {
        q: { fr: 'Le volume pendant un drapeau de continuation :', en: 'Volume during a continuation flag:' },
        options: { fr: ['Baisse, puis explose à la cassure', 'Explose pendant le drapeau', 'Reste constant'], en: ['Fades, then bursts on the break', 'Bursts during the flag', 'Stays flat'] },
        correct: 0,
        rationale: { fr: 'Schéma classique : respiration calme, reprise volumique.', en: 'Classic pattern: calm breath, volumic resumption.' },
      },
      {
        q: { fr: 'Un range entre deux jambes haussières est :', en: 'A range between two up legs is:' },
        options: { fr: ['Une consolidation de continuation', 'Un retournement', 'Une indécision finale'], en: ['A continuation consolidation', 'A reversal', 'Final indecision'] },
        correct: 0,
        rationale: { fr: 'Le marché digère avant la prochaine jambe.', en: 'The market digests before the next leg.' },
      },
    ],
  },
  'structure-11': {
    intro: {
      fr: [
        'Un graphique propre est un graphique lisible — pas un graphique vide. Trop d’indicateurs = bruit. Aucun marquage = aveugle.',
        'La règle de Tickra : 3 niveaux maximum (support majeur, résistance majeure, ligne de tendance ou MA200), pas plus. Tout autre tracé doit s’effacer.',
        'Un graphique propre vous force à voir le prix. Et tant qu’on ne voit pas le prix, on ne lit rien.',
      ],
      en: [
        'A clean chart is a readable chart — not an empty one. Too many indicators = noise. No markup = blind.',
        'Tickra’s rule: 3 levels max (major support, major resistance, trendline or 200MA), no more. Any other markup must go.',
        'A clean chart forces you to see price. Until you see price, you read nothing.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Vous avez 14 lignes, 5 indicateurs, 3 fibos sur votre graphique. Que faire ?',
        en: 'You have 14 lines, 5 indicators, 3 fibs on your chart. What to do?',
      },
      options: {
        fr: ['Effacer tout sauf 3 niveaux majeurs', 'Ajouter une MA50', 'Garder tel quel'],
        en: ['Erase everything except 3 major levels', 'Add a 50MA', 'Keep it as is'],
      },
      correct: 0,
      rationale: {
        fr: 'Reset visuel. Vous gagnez en lisibilité, vous perdez en bruit. Toujours gagnant.',
        en: 'Visual reset. You gain clarity, lose noise. Always a win.',
      },
    },
    quiz: [
      {
        q: { fr: 'Combien de niveaux maximum garder :', en: 'How many levels max to keep:' },
        options: { fr: ['3', '10', 'Aucun'], en: ['3', '10', 'None'] },
        correct: 0,
        rationale: { fr: 'Trois forcent à choisir l’essentiel.', en: 'Three forces you to choose the essential.' },
      },
      {
        q: { fr: 'Un graphique sans aucun marquage :', en: 'A chart with zero markup:' },
        options: { fr: ['Est aveugle', 'Est propre', 'Est puissant'], en: ['Is blind', 'Is clean', 'Is powerful'] },
        correct: 0,
        rationale: { fr: 'Propre ≠ vide. Propre = lisible.', en: 'Clean ≠ empty. Clean = readable.' },
      },
      {
        q: { fr: 'Les indicateurs sont :', en: 'Indicators are:' },
        options: { fr: ['Des dérivés du prix — utiles avec parcimonie', 'Le cœur de l’analyse', 'Inutiles toujours'], en: ['Derivatives of price — useful sparingly', 'The core of analysis', 'Always useless'] },
        correct: 0,
        rationale: { fr: 'Le prix d’abord, les dérivés ensuite.', en: 'Price first, derivatives second.' },
      },
    ],
  },
  'structure-12': {
    intro: {
      fr: [
        'Marquer un graphique = poser des annotations qui rendent la décision future plus rapide. Niveaux clés, zones d’intérêt, scenario en cours.',
        'Bonnes annotations : étiquettes courtes, dates de pivot, scenario alterné (« si > X alors hausse, si < Y alors range »). Mauvaises : prédictions, émotions, flèches partout.',
        'Vos annotations doivent être lisibles par un trader que vous ne connaissez pas. Si elles ne le sont pas, elles ne vous serviront pas demain.',
      ],
      en: [
        'Marking up a chart = annotations that make future decisions faster. Key levels, zones of interest, current scenario.',
        'Good annotations: short labels, pivot dates, branching scenarios ("if > X then up, if < Y then range"). Bad: predictions, emotions, arrows everywhere.',
        'Your annotations should be readable by a trader you do not know. If not, they will not help you tomorrow.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Quelle annotation est la plus utile sur un graphique D ?',
        en: 'Which annotation is most useful on a D chart?',
      },
      options: {
        fr: ['« Support 100, testé 3× »', '« Je le sens, ça va monter »', '« Achat ici sûr »'],
        en: ['"Support 100, tested 3×"', '"I feel it, going up"', '"Buy here for sure"'],
      },
      correct: 0,
      rationale: {
        fr: 'Objective, factuelle, ré‑utilisable. Les deux autres seront illisibles dans 3 mois.',
        en: 'Objective, factual, reusable. The other two will be unreadable in 3 months.',
      },
    },
    quiz: [
      {
        q: { fr: 'Une bonne annotation est :', en: 'A good annotation is:' },
        options: { fr: ['Objective et factuelle', 'Émotionnelle et longue', 'Couverte de prédictions'], en: ['Objective and factual', 'Emotional and long', 'Full of predictions'] },
        correct: 0,
        rationale: { fr: 'Le futur vous doit pouvoir relire sans contexte.', en: 'Future you must be able to re-read without context.' },
      },
      {
        q: { fr: 'Annoter sert à :', en: 'Annotating serves to:' },
        options: { fr: ['Accélérer les futures décisions', 'Décorer', 'Convaincre les autres'], en: ['Speed up future decisions', 'Decorate', 'Convince others'] },
        correct: 0,
        rationale: { fr: 'Le seul lecteur qui compte : vous, dans 3 jours.', en: 'The only reader that matters: you, three days later.' },
      },
      {
        q: { fr: 'Une flèche « ça monte » sur le graphique :', en: 'An arrow saying "going up" on the chart:' },
        options: { fr: ['N’apporte rien', 'Aide à voir', 'Est obligatoire'], en: ['Adds nothing', 'Helps to see', 'Is mandatory'] },
        correct: 0,
        rationale: { fr: 'Une prédiction n’est pas une annotation. C’est un biais figé.', en: 'A prediction is not an annotation. It is a frozen bias.' },
      },
    ],
  },
  'structure-13': {
    intro: {
      fr: [
        'Cinq graphiques par jour, choisis dans cinq actifs différents. Vous marquez tendance, niveaux, zones d’intérêt. Vous prédiez le scenario probable et son alternative.',
        'Pas de trade. Pas d’argent. Juste de la lecture, deux minutes par graphique, dix minutes par jour.',
        'C’est l’exercice qui forme l’œil plus vite que toutes les vidéos. Après un mois, vous lirez un graphique en cinq secondes.',
      ],
      en: [
        'Five charts a day, picked across five different assets. You mark trend, levels, zones of interest. You note the likely scenario and its alternative.',
        'No trades. No money. Just reading, two minutes per chart, ten minutes per day.',
        'It is the drill that trains the eye faster than any video. After a month, you will read a chart in five seconds.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Combien de minutes par graphique pour cet exercice ?',
        en: 'How many minutes per chart for this drill?',
      },
      options: {
        fr: ['Deux minutes', 'Trente minutes', 'Le temps qu’il faut'],
        en: ['Two minutes', 'Thirty minutes', 'As long as needed'],
      },
      correct: 0,
      rationale: {
        fr: 'Court oblige à voir l’essentiel. La rapidité forme l’œil.',
        en: 'Short forces you to see the essential. Speed trains the eye.',
      },
    },
    quiz: [
      {
        q: { fr: 'Combien d’actifs différents par jour ?', en: 'How many different assets a day?' },
        options: { fr: ['Cinq', 'Un', 'Trente'], en: ['Five', 'One', 'Thirty'] },
        correct: 0,
        rationale: { fr: 'La diversité vaccine contre les biais d’actif.', en: 'Diversity vaccinates against asset bias.' },
      },
      {
        q: { fr: 'Le but de l’exercice :', en: 'Goal of the drill:' },
        options: { fr: ['Former l’œil', 'Faire des trades', 'Devenir analyste'], en: ['Train the eye', 'Make trades', 'Become an analyst'] },
        correct: 0,
        rationale: { fr: 'Pas de trade. Que de la lecture.', en: 'No trades. Reading only.' },
      },
      {
        q: { fr: 'Au bout d’un mois on lit un graphique en :', en: 'After a month you read a chart in:' },
        options: { fr: ['~ 5 secondes', '1 heure', 'Toujours autant'], en: ['~ 5 seconds', '1 hour', 'Same as before'] },
        correct: 0,
        rationale: { fr: 'L’œil s’habitue. La compression est massive.', en: 'The eye adapts. Compression is massive.' },
      },
    ],
  },
  'structure-14': {
    intro: {
      fr: [
        'Point de contrôle Structure de marché. Cinq questions pour valider l’ensemble de la piste.',
        'Avant de cliquer, posez‑vous : sur quel timeframe ? quelle séquence ? quel niveau ? La grammaire structurelle doit être un réflexe.',
        'Échec : revisez 03, 04 et 07 (range, BoS, multi‑TF). Réussite : direction Risk Management, le module qui décide tout.',
      ],
      en: [
        'Market structure checkpoint. Five questions to validate the whole track.',
        'Before clicking, ask: which timeframe? which sequence? which level? Structural grammar must be reflex.',
        'Fail: revisit 03, 04, and 07 (range, BoS, multi‑TF). Pass: heading to Risk Management — the module that decides everything.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Sur D la tendance est claire haussière. Sur 1H, vous voyez un range serré. Action ?',
        en: 'On D the trend is clearly bullish. On 1H, a tight range. Action?',
      },
      options: {
        fr: ['Attendre la cassure haussière du range — confluence avec D', 'Short le range', 'Acheter au milieu du range'],
        en: ['Wait for the bullish range break — confluence with D', 'Short the range', 'Buy in the middle'],
      },
      correct: 0,
      rationale: {
        fr: 'Confluence TF supérieur + cassure = setup à haute probabilité.',
        en: 'Higher TF + break confluence = high-probability setup.',
      },
    },
    quiz: [
      {
        q: { fr: 'Que définit une tendance ?', en: 'What defines a trend?' },
        options: { fr: ['Séquence HH/HL ou LL/LH', 'Le sentiment', 'Une moyenne mobile'], en: ['HH/HL or LL/LH sequence', 'Sentiment', 'A moving average'] },
        correct: 0,
        rationale: { fr: 'Structure d’abord, indicateurs après.', en: 'Structure first, indicators second.' },
      },
      {
        q: { fr: 'Que valide une cassure :', en: 'What validates a break:' },
        options: { fr: ['Une clôture nette au‑delà', 'Une mèche', 'Un volume bas'], en: ['A clean close beyond', 'A wick', 'Low volume'] },
        correct: 0,
        rationale: { fr: 'Toujours la clôture, jamais la mèche seule.', en: 'Always the close, never the wick alone.' },
      },
      {
        q: { fr: 'Sur quel TF définir la tendance ?', en: 'On which TF to define the trend?' },
        options: { fr: ['Le TF au‑dessus de celui d’exécution', 'Le 1m toujours', 'Le H4 toujours'], en: ['The TF above execution', 'Always 1m', 'Always 4H'] },
        correct: 0,
        rationale: { fr: 'Un cran au‑dessus, toujours.', en: 'One step above, always.' },
      },
    ],
  },
  'risk-05': {
    intro: {
      fr: [
        'Le ratio risque/rendement (R:R) est le rapport entre ce que vous risquez et ce que vous pouvez gagner. C’est la promesse mathématique d’un trade.',
        'Sous 1:2 (vous risquez 1 pour gagner 2), Tickra ne recommande pas le trade. La marge d’erreur est trop fine pour compenser les frais et les ratés.',
        'Au‑dessus de 1:3, vous tolérez plus d’erreurs. Vous pouvez perdre 60 % de vos trades et rester rentable.',
      ],
      en: [
        'Risk/Reward (R:R) is the ratio between what you risk and what you can earn. The mathematical promise of a trade.',
        'Below 1:2 (risk 1 to gain 2), Tickra does not recommend the trade. Margin of error is too thin to absorb fees and misses.',
        'Above 1:3, you tolerate more errors. You can lose 60% of trades and stay profitable.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Entrée 100, stop 95, target 110. R:R ?',
        en: 'Entry 100, stop 95, target 110. R:R?',
      },
      options: {
        fr: ['1:2 (risque 5, gain 10)', '1:1', '1:3'],
        en: ['1:2 (risk 5, gain 10)', '1:1', '1:3'],
      },
      correct: 0,
      rationale: {
        fr: 'Risque = 100 − 95 = 5. Gain = 110 − 100 = 10. Ratio = 1:2. Plancher acceptable.',
        en: 'Risk = 100 − 95 = 5. Gain = 110 − 100 = 10. Ratio = 1:2. Acceptable floor.',
      },
    },
    quiz: [
      {
        q: { fr: 'En dessous de quel R:R Tickra refuse le trade ?', en: 'Below which R:R does Tickra refuse?' },
        options: { fr: ['1:2', '1:5', '1:1.1'], en: ['1:2', '1:5', '1:1.1'] },
        correct: 0,
        rationale: { fr: 'Sous 1:2 la marge d’erreur disparaît avec les frais.', en: 'Below 1:2 the error margin vanishes with fees.' },
      },
      {
        q: { fr: 'À 1:3, taux minimum pour être rentable :', en: 'At 1:3, minimum hit rate to be profitable:' },
        options: { fr: ['~ 25 %', '~ 50 %', '~ 80 %'], en: ['~ 25%', '~ 50%', '~ 80%'] },
        correct: 0,
        rationale: { fr: 'À 1:3, 25 % de réussite donne déjà une espérance positive.', en: 'At 1:3, 25% hit rate already yields positive expectancy.' },
      },
      {
        q: { fr: 'Le R:R se calcule :', en: 'R:R is computed:' },
        options: { fr: ['Avant l’entrée, pas après', 'Après le trade', 'Au feeling'], en: ['Before entry, not after', 'After the trade', 'By feeling'] },
        correct: 0,
        rationale: { fr: 'Décidé avant. Sinon vous ajustez les chiffres à l’émotion.', en: 'Decided before. Otherwise you fit numbers to emotion.' },
      },
    ],
  },
  'risk-06': {
    intro: {
      fr: [
        'Le risque de ruine est la probabilité de descendre à zéro. Il dépend du % par trade, du R:R, et du taux de réussite.',
        'À 1 % par trade et 45 % de réussite avec 1:2 : probabilité de ruine ≈ 0,01 % sur 1000 trades. Acceptable.',
        'À 5 % par trade, mêmes paramètres : probabilité ≈ 90 %. Inacceptable. Le % par trade est le levier qui décide tout.',
      ],
      en: [
        'Risk of ruin is the probability of going to zero. It depends on % per trade, R:R, and hit rate.',
        'At 1% per trade and 45% hit rate with 1:2: ruin probability ≈ 0.01% over 1000 trades. Acceptable.',
        'At 5% per trade, same params: ≈ 90%. Unacceptable. % per trade is the lever that decides everything.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Capital 10k €. Risque 5 %/trade. Vous perdez 10 fois d’affilée. Reste ?',
        en: 'Capital €10k. Risk 5%/trade. You lose 10 in a row. Remaining?',
      },
      options: {
        fr: ['≈ 5 990 € (10k × 0.95¹⁰)', '5 000 €', '8 000 €'],
        en: ['≈ €5,990 (10k × 0.95¹⁰)', '€5,000', '€8,000'],
      },
      correct: 0,
      rationale: {
        fr: '0.95¹⁰ ≈ 0.599. 10 000 × 0.599 ≈ 5 990. Pour récupérer, il faut +67 %.',
        en: '0.95¹⁰ ≈ 0.599. €10,000 × 0.599 ≈ €5,990. To recover, you need +67%.',
      },
    },
    quiz: [
      {
        q: { fr: 'Drawdown 50 %, quel gain pour récupérer ?', en: '50% drawdown, what gain to recover?' },
        options: { fr: ['100 %', '50 %', '25 %'], en: ['100%', '50%', '25%'] },
        correct: 0,
        rationale: { fr: 'Asymétrie mathématique brutale. Plus on perd, plus c’est dur.', en: 'Brutal math asymmetry. The more you lose, the harder to recover.' },
      },
      {
        q: { fr: 'Le % par trade idéal pour la plupart :', en: 'Ideal % per trade for most:' },
        options: { fr: ['0.5–1 %', '5 %', '10 %'], en: ['0.5–1%', '5%', '10%'] },
        correct: 0,
        rationale: { fr: 'Permet d’encaisser de longues séries perdantes.', en: 'Allows surviving long losing streaks.' },
      },
      {
        q: { fr: 'Risque de ruine dépend :', en: 'Risk of ruin depends on:' },
        options: { fr: ['% par trade + R:R + taux', 'Que du sentiment', 'Que du R:R'], en: ['% per trade + R:R + hit rate', 'Sentiment only', 'R:R only'] },
        correct: 0,
        rationale: { fr: 'Trois variables, trois leviers.', en: 'Three variables, three levers.' },
      },
    ],
  },
  'risk-07': {
    intro: {
      fr: [
        'Le drawdown psychologique est la souffrance ressentie pendant une perte, pas la perte elle‑même. Le second est mécanique, le premier dévore les traders.',
        'À 5 % de drawdown sur deux jours, beaucoup réduisent leur taille — mauvais. À 30 %, beaucoup doublent pour récupérer — pire.',
        'La règle : votre taille ne change pas pendant un drawdown. Si vous la modifiez, vous changez vos statistiques au pire moment.',
      ],
      en: [
        'Psychological drawdown is the pain felt during a loss, not the loss itself. The second is mechanical, the first eats traders.',
        'At 5% drawdown over two days, many cut size — bad. At 30%, many double up to recover — worse.',
        'The rule: your size does not change during a drawdown. If you change it, you change your statistics at the worst moment.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Drawdown 15 %, série de 7 pertes. Que faire ?',
        en: '15% drawdown, 7 losses in a row. What to do?',
      },
      options: {
        fr: ['Continuer avec la même taille — le système est testé', 'Doubler pour récupérer', 'Arrêter à vie'],
        en: ['Continue with the same size — the system is tested', 'Double up to recover', 'Quit forever'],
      },
      correct: 0,
      rationale: {
        fr: 'Tant que votre méthode tient, statistiquement le R revient. Doubler casse les statistiques.',
        en: 'As long as your method holds, statistics recover. Doubling breaks the statistics.',
      },
    },
    quiz: [
      {
        q: { fr: 'Pendant un drawdown, la taille :', en: 'During a drawdown, size:' },
        options: { fr: ['Ne change pas', 'Augmente pour récupérer', 'Disparaît'], en: ['Does not change', 'Increases to recover', 'Vanishes'] },
        correct: 0,
        rationale: { fr: 'Constance. Toujours.', en: 'Consistency. Always.' },
      },
      {
        q: { fr: 'Une « martingale » (doubler après perte) :', en: 'A "martingale" (double after loss):' },
        options: { fr: ['Mène mathématiquement à la ruine', 'Est statistiquement gagnante', 'Est neutre'], en: ['Mathematically leads to ruin', 'Statistically winning', 'Neutral'] },
        correct: 0,
        rationale: { fr: 'Une longue série suffit. Et elle arrivera.', en: 'A long streak is enough. And it will come.' },
      },
      {
        q: { fr: 'À quoi reconnaître un drawdown sain :', en: 'How to recognise a healthy drawdown:' },
        options: { fr: ['Il rentre dans la distribution attendue de votre système', 'Il dure plus de 6 mois', 'Il ne survient jamais'], en: ['It fits the expected distribution of your system', 'It lasts over 6 months', 'It never happens'] },
        correct: 0,
        rationale: { fr: 'Tout système rentable a des drawdowns prévus. Connaître la sienne = serein.', en: 'Every profitable system has expected drawdowns. Knowing yours = calm.' },
      },
    ],
  },
  'risk-08': {
    intro: {
      fr: [
        'Un trailing stop est un stop qui suit le prix dans le sens favorable, sans jamais reculer. Il sécurise les gains sans plafonner le potentiel.',
        'Variantes : trailing par ATR (volatilité), par swing low/high (structure), par % (mécanique). Chacune a son terrain.',
        'Pas de trailing trop serré sur du fort momentum — vous serez sorti sur du bruit. Pas trop large non plus — vous rendez vos gains.',
      ],
      en: [
        'A trailing stop follows price in the favourable direction without ever moving back. It locks in gains without capping upside.',
        'Variants: ATR trailing (volatility), swing low/high trailing (structure), % trailing (mechanical). Each has its terrain.',
        'No tight trailing on strong momentum — you exit on noise. No too-wide trailing — you give back gains.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Long EUR/USD, +50 pips, momentum fort. Trailing ?',
        en: 'Long EUR/USD, +50 pips, strong momentum. Trailing?',
      },
      options: {
        fr: ['ATR × 2 sous le prix — laisse respirer', 'Stop 10 pips sous le prix — serré', 'Pas de stop'],
        en: ['ATR × 2 under price — let it breathe', 'Stop 10 pips under price — tight', 'No stop'],
      },
      correct: 0,
      rationale: {
        fr: 'Sur momentum, donner de l’air est la condition pour rester dans le trade.',
        en: 'On momentum, giving air is required to stay in the trade.',
      },
    },
    quiz: [
      {
        q: { fr: 'Un trailing stop :', en: 'A trailing stop:' },
        options: { fr: ['Ne recule jamais', 'Recule si nécessaire', 'Disparaît'], en: ['Never moves back', 'Moves back if needed', 'Disappears'] },
        correct: 0,
        rationale: { fr: 'Définition. Sinon ce n’est plus un trailing.', en: 'By definition. Otherwise it’s not a trailing.' },
      },
      {
        q: { fr: 'Trailing par swing low/high suit :', en: 'Swing low/high trailing follows:' },
        options: { fr: ['La structure du marché', 'Une moyenne', 'L’horloge'], en: ['Market structure', 'A moving average', 'The clock'] },
        correct: 0,
        rationale: { fr: 'Structurelle, donc lisible et défendable.', en: 'Structural, so readable and defensible.' },
      },
      {
        q: { fr: 'Quand utiliser un trailing serré :', en: 'When to use a tight trailing:' },
        options: { fr: ['Fin de mouvement attendue, climax', 'Début de mouvement fort', 'Toujours'], en: ['Expected end of move, climax', 'Start of strong move', 'Always'] },
        correct: 0,
        rationale: { fr: 'Serrer en fin = sécuriser ce qui reste.', en: 'Tightening at the end = locking what remains.' },
      },
    ],
  },
  'risk-09': {
    intro: {
      fr: [
        'Pyramider : ajouter à une position gagnante, jamais à une perdante. Chaque ajout doit avoir son propre stop et respecter le 1 % global.',
        'Erreur classique : ajouter au même prix qu’à l’entrée initiale. Cela augmente votre base et la première petite baisse vous tue.',
        'Pyramider proprement : ajout sur cassure de structure suivante, taille décroissante (50 %, 25 %, etc.), stops remontés.',
      ],
      en: [
        'Pyramiding: add to a winning position, never a losing one. Each addition has its own stop and must respect the global 1%.',
        'Classic mistake: add at the same price as the initial entry. It raises your basis and the first small drop kills you.',
        'Clean pyramiding: add on the next structure break, decreasing size (50%, 25%, etc.), stops trailing up.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Long depuis 100, prix à 110 après BoS. Comment pyramider ?',
        en: 'Long from 100, price at 110 after BoS. How to pyramid?',
      },
      options: {
        fr: ['Ajouter 50 % de la taille initiale, stop sous le nouveau swing low', 'Doubler la taille à 110', 'Tout vendre'],
        en: ['Add 50% of initial size, stop under the new swing low', 'Double size at 110', 'Sell everything'],
      },
      correct: 0,
      rationale: {
        fr: 'Ajout proportionnel, stop structurel. Le 1 % global est respecté.',
        en: 'Proportional addition, structural stop. Global 1% respected.',
      },
    },
    quiz: [
      {
        q: { fr: 'On pyramide :', en: 'You pyramid:' },
        options: { fr: ['Sur les gagnants', 'Sur les perdants', 'Sur tout'], en: ['Winners only', 'Losers', 'Everything'] },
        correct: 0,
        rationale: { fr: 'Sur les perdants = catastrophe statistique.', en: 'On losers = statistical disaster.' },
      },
      {
        q: { fr: 'Taille des ajouts :', en: 'Add sizes:' },
        options: { fr: ['Décroissante', 'Croissante', 'Identique'], en: ['Decreasing', 'Increasing', 'Same'] },
        correct: 0,
        rationale: { fr: 'Décroissante protège le gain accumulé.', en: 'Decreasing protects accumulated gain.' },
      },
      {
        q: { fr: 'Risque global toujours :', en: 'Global risk always:' },
        options: { fr: ['≤ 1 % du capital', 'Variable', 'Sans limite'], en: ['≤ 1% of capital', 'Variable', 'Unlimited'] },
        correct: 0,
        rationale: { fr: 'Le 1 % reste la cage.', en: '1% remains the cage.' },
      },
    ],
  },
  'risk-10': {
    intro: {
      fr: [
        'Exercice : simulez 100 trades sur papier avec votre stratégie testée. Notez chaque entrée, stop, sortie, R obtenu. Pas d’argent réel.',
        'Calculez à la fin : taux de réussite, R:R moyen, espérance, drawdown maximum, longue série perdante.',
        'Si l’espérance est positive et le drawdown supportable, vous avez une méthode. Sinon, vous avez un projet de méthode — pas encore le droit de trader.',
      ],
      en: [
        'Drill: simulate 100 paper trades with your tested strategy. Log every entry, stop, exit, R earned. No real money.',
        'Compute at the end: hit rate, average R:R, expectancy, max drawdown, longest losing streak.',
        'If expectancy is positive and drawdown bearable, you have a method. Otherwise you have a project of a method — not yet a license to trade.',
      ],
    },
    drill: {
      prompt: {
        fr: '100 trades simulés, taux 40 %, R:R moyen 1:2.5. Espérance ?',
        en: '100 simulated trades, 40% hit rate, avg R:R 1:2.5. Expectancy?',
      },
      options: {
        fr: ['+0.4 R par trade (0.4×2.5 − 0.6×1)', '0 R', '−0.2 R'],
        en: ['+0.4 R per trade (0.4×2.5 − 0.6×1)', '0 R', '−0.2 R'],
      },
      correct: 0,
      rationale: {
        fr: '(0.4 × 2.5) − (0.6 × 1) = 1 − 0.6 = +0.4 R. Système rentable.',
        en: '(0.4 × 2.5) − (0.6 × 1) = 1 − 0.6 = +0.4 R. Profitable system.',
      },
    },
    quiz: [
      {
        q: { fr: 'Combien de trades pour une stat sérieuse ?', en: 'How many trades for serious stats?' },
        options: { fr: ['100 minimum', '10', '1 000 000'], en: ['100 minimum', '10', '1,000,000'] },
        correct: 0,
        rationale: { fr: 'En dessous de 100, le hasard décide encore.', en: 'Below 100, randomness still rules.' },
      },
      {
        q: { fr: 'On trade en réel quand :', en: 'You trade live when:' },
        options: { fr: ['Espérance positive + drawdown supportable', 'Sentiment positif', 'Quelqu’un nous le dit'], en: ['Positive expectancy + bearable drawdown', 'Positive feeling', 'Someone tells us'] },
        correct: 0,
        rationale: { fr: 'Preuve avant pratique.', en: 'Proof before practice.' },
      },
      {
        q: { fr: 'La simulation est :', en: 'Simulation is:' },
        options: { fr: ['Le pré‑requis incontournable', 'Optionnelle', 'Pour les peureux'], en: ['Mandatory prerequisite', 'Optional', 'For the timid'] },
        correct: 0,
        rationale: { fr: 'Tous les desks pros simulent avant de commiter.', en: 'All pro desks simulate before committing.' },
      },
    ],
  },
  'risk-11': {
    intro: {
      fr: [
        'Point de contrôle de la piste Risque. Cinq questions, pas de marche arrière. Vous pouvez le repasser.',
        'C’est la piste la plus importante du curriculum. Sans elle, le reste ne tient pas.',
        'Si vous échouez, ne passez pas à la suite. Revisitez 01 (1 %), 04 (espérance), 06 (ruine). Tout y est.',
      ],
      en: [
        'Risk track checkpoint. Five questions, no going back. You can retake.',
        'The most important track of the curriculum. Without it, the rest collapses.',
        'If you fail, do not move on. Revisit 01 (1%), 04 (expectancy), 06 (ruin). It is all there.',
      ],
    },
    drill: {
      prompt: {
        fr: 'Capital 25k, risque 1%, stop 50 pips sur EUR/USD. Lots ?',
        en: 'Capital 25k, risk 1%, stop 50 pips on EUR/USD. Lots?',
      },
      options: {
        fr: ['0.5 lot — (250 € / 50 pips × 10 € le pip)', '5 lots', '0.05 lot'],
        en: ['0.5 lot — (€250 / 50 pips × €10 per pip)', '5 lots', '0.05 lot'],
      },
      correct: 0,
      rationale: {
        fr: '25 000 × 1 % = 250 €. 50 × 10 = 500 € par lot. 250/500 = 0.5 lot.',
        en: '€25,000 × 1% = €250. 50 × €10 = €500 per lot. 250/500 = 0.5 lot.',
      },
    },
    quiz: [
      {
        q: { fr: 'La règle qui décide tout :', en: 'The rule that decides everything:' },
        options: { fr: ['1 % par trade', 'Acheter bas', 'Suivre le sentiment'], en: ['1% per trade', 'Buy low', 'Follow sentiment'] },
        correct: 0,
        rationale: { fr: 'Sans elle, rien ne tient.', en: 'Without it, nothing holds.' },
      },
      {
        q: { fr: 'Le stop se place :', en: 'The stop goes:' },
        options: { fr: ['Où le setup est invalide', 'À 10 pips toujours', 'Quand on a peur'], en: ['Where the setup is invalid', 'Always 10 pips', 'When afraid'] },
        correct: 0,
        rationale: { fr: 'Logique, pas mécanique.', en: 'Logical, not mechanical.' },
      },
      {
        q: { fr: 'Espérance positive nécessite :', en: 'Positive expectancy needs:' },
        options: { fr: ['Taux × R:R adéquats', 'Beaucoup de trades', 'De la chance'], en: ['Adequate hit rate × R:R', 'Many trades', 'Luck'] },
        correct: 0,
        rationale: { fr: 'L’équation est universelle.', en: 'The equation is universal.' },
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
