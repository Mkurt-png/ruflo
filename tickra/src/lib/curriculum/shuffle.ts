// Deterministic option shuffling for lesson quizzes.
//
// The lesson content was authored with a strong bias toward the first
// option being correct, which makes the experience predictable. To fix
// that without rewriting every lesson, we shuffle the options at render
// time using a seed derived from the lesson + question identity. The
// seed is stable, so the shuffle is identical across renders of the
// same question — but different across questions, so the correct answer
// lands on A/B/C/D evenly over a track.

function hashSeed(input: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let s = seed || 1;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type ShuffledChoice<T> = {
  options: T[];
  correct: number;
};

/**
 * Fisher–Yates shuffle of `options` driven by a seeded PRNG, with the
 * `correctIdx` tracked through the swaps so the returned index points
 * at the same option that was correct before.
 */
export function shuffleWithCorrect<T>(options: T[], correctIdx: number, seed: string): ShuffledChoice<T> {
  const arr = options.slice();
  const rand = mulberry32(hashSeed(seed));
  let correct = correctIdx;
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    if (i !== j) {
      const tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
      if (correct === i) correct = j;
      else if (correct === j) correct = i;
    }
  }
  return { options: arr, correct };
}
