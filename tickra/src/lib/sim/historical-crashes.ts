// TICKRA-PHASE-2.4: hand-curated historical "crash" sequences used by the
// FlashCrashMode component. Each entry is a sequence of OHLC candles for
// pedagogical replay — values are approximated from real events to keep the
// shape recognisable without needing a market-data subscription.

export type CrashCandle = { o: number; h: number; l: number; c: number };

export type CrashEvent = {
  id: 'black-monday-1987' | 'covid-march-2020' | 'gbp-flash-2016' | 'swiss-franc-2015';
  label: { fr: string; en: string };
  body: { fr: string; en: string };
  symbol: string;
  unit: string;
  candles: CrashCandle[];
  // Index at which the user is allowed to start trading (anchor to the
  // pre-event period so they "feel" the move arriving).
  startIndex: number;
};

// 1987 — Dow Jones crash. ~22 % in one session. Daily candles, fictitious
// scaled values around 2000 to keep numbers readable.
const blackMonday: CrashCandle[] = [
  { o: 2640, h: 2670, l: 2620, c: 2655 },
  { o: 2655, h: 2680, l: 2640, c: 2660 },
  { o: 2660, h: 2670, l: 2625, c: 2630 },
  { o: 2630, h: 2640, l: 2575, c: 2585 },
  { o: 2585, h: 2600, l: 2480, c: 2500 }, // Friday Oct 16 — pre-crash drop
  { o: 2500, h: 2510, l: 1730, c: 1740 }, // Monday Oct 19 — Black Monday
  { o: 1740, h: 1840, l: 1700, c: 1750 },
  { o: 1750, h: 1900, l: 1730, c: 1840 },
  { o: 1840, h: 1900, l: 1800, c: 1850 },
];

// 2020 — S&P 500 covid crash. ~34 % drop in 33 days.
const covidCrash: CrashCandle[] = [
  { o: 3380, h: 3393, l: 3340, c: 3370 },
  { o: 3370, h: 3380, l: 3290, c: 3300 },
  { o: 3300, h: 3320, l: 3210, c: 3225 },
  { o: 3225, h: 3260, l: 3150, c: 3170 },
  { o: 3170, h: 3220, l: 3080, c: 3090 },
  { o: 3090, h: 3130, l: 2970, c: 2980 },
  { o: 2980, h: 3010, l: 2820, c: 2840 },
  { o: 2840, h: 2880, l: 2720, c: 2740 },
  { o: 2740, h: 2780, l: 2580, c: 2600 },
  { o: 2600, h: 2630, l: 2440, c: 2460 },
  { o: 2460, h: 2510, l: 2270, c: 2305 }, // Mar 23 bottom
  { o: 2305, h: 2450, l: 2295, c: 2440 },
];

// GBP/USD flash crash 2016 — Oct 7, intraday move.
const gbpFlash: CrashCandle[] = [
  { o: 1.2615, h: 1.2625, l: 1.2605, c: 1.2615 },
  { o: 1.2615, h: 1.2620, l: 1.2590, c: 1.2595 },
  { o: 1.2595, h: 1.2600, l: 1.2575, c: 1.2580 },
  { o: 1.2580, h: 1.2585, l: 1.2540, c: 1.2545 },
  { o: 1.2545, h: 1.2550, l: 1.1490, c: 1.1880 }, // The flash
  { o: 1.1880, h: 1.2300, l: 1.1850, c: 1.2290 },
  { o: 1.2290, h: 1.2400, l: 1.2280, c: 1.2400 },
  { o: 1.2400, h: 1.2440, l: 1.2380, c: 1.2410 },
];

// Swiss franc shock 2015 — SNB removes EUR/CHF floor.
const chfShock: CrashCandle[] = [
  { o: 1.2010, h: 1.2015, l: 1.2005, c: 1.2010 },
  { o: 1.2010, h: 1.2015, l: 1.2005, c: 1.2010 },
  { o: 1.2010, h: 1.2015, l: 1.2005, c: 1.2010 }, // The 3-year SNB floor
  { o: 1.2010, h: 1.2015, l: 0.8550, c: 0.9750 }, // The shock
  { o: 0.9750, h: 1.0050, l: 0.9680, c: 0.9920 },
  { o: 0.9920, h: 1.0260, l: 0.9890, c: 1.0210 },
  { o: 1.0210, h: 1.0500, l: 1.0180, c: 1.0480 },
];

export const CRASH_EVENTS: CrashEvent[] = [
  {
    id: 'black-monday-1987',
    label: { fr: 'Black Monday — 19 oct. 1987', en: 'Black Monday — Oct 19, 1987' },
    body: {
      fr: 'Le Dow Jones perd 22,6 % en une seule séance. Le plus grand crash boursier en pourcentage de l’histoire. Causes : program trading, valorisations tendues, panique en chaîne.',
      en: 'The Dow Jones loses 22.6 % in a single session. The largest stock-market crash in percentage terms ever. Causes: program trading, stretched valuations, cascading panic.',
    },
    symbol: 'DJI',
    unit: 'points',
    candles: blackMonday,
    startIndex: 3,
  },
  {
    id: 'covid-march-2020',
    label: { fr: 'Crash COVID — mars 2020', en: 'COVID crash — March 2020' },
    body: {
      fr: 'Le S&P 500 chute de 34 % en 33 jours. Le marché digère la pandémie + le confinement mondial. La récupération sera tout aussi violente, en V.',
      en: 'The S&P 500 drops 34 % in 33 days. The market digests the pandemic + the global lockdown. The V-shaped recovery is just as violent.',
    },
    symbol: 'SPX',
    unit: 'points',
    candles: covidCrash,
    startIndex: 2,
  },
  {
    id: 'gbp-flash-2016',
    label: { fr: 'Flash crash GBP — 7 oct. 2016', en: 'GBP flash crash — Oct 7, 2016' },
    body: {
      fr: 'GBP/USD chute de 6 % en 2 minutes pendant la session asiatique. Liquidité minimale, algos en cascade. Aucun trader humain n’a vraiment "tradé" ce mouvement.',
      en: 'GBP/USD plunges 6 % in 2 minutes during the Asian session. Minimal liquidity, cascading algos. No human trader actually "traded" this move.',
    },
    symbol: 'GBP/USD',
    unit: 'pips',
    candles: gbpFlash,
    startIndex: 2,
  },
  {
    id: 'swiss-franc-2015',
    label: { fr: 'Shock franc suisse — 15 janv. 2015', en: 'Swiss franc shock — Jan 15, 2015' },
    body: {
      fr: 'La BNS retire son plancher à 1,20 sans préavis. EUR/CHF perd ~30 % en quelques minutes. Des dizaines de brokers retail font faillite ce jour-là.',
      en: 'The SNB removes its 1.20 floor without notice. EUR/CHF crashes ~30 % in minutes. Dozens of retail brokers go bust that day.',
    },
    symbol: 'EUR/CHF',
    unit: 'pips',
    candles: chfShock,
    startIndex: 2,
  },
];
