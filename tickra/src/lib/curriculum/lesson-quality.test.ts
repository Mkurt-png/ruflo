import { describe, it, expect } from 'vitest';
import { TRACKS } from './data';
import { getLessonContent, isSeeded } from './lesson-content';

// Structural checks on every written lesson. The runtime trusts this shape:
// a missing translation renders an empty paragraph, a `correct` index past
// the options makes a question unanswerable, and options that differ between
// French and English would shuffle to different answers in each language.

const written = TRACKS.flatMap((track) =>
  track.lessons
    .filter((lesson) => isSeeded(lesson.id))
    .map((lesson) => ({ id: lesson.id, c: getLessonContent(track, lesson) })),
);

type Item = { options: { fr: string[]; en: string[] }; correct: number; rationale: { fr: string; en: string } };

function checkItem(id: string, where: string, item: Item) {
  expect(item.options.fr.length, `${id} ${where}: fr/en option counts differ`).toBe(item.options.en.length);
  expect(item.options.fr.length, `${id} ${where}: needs at least 2 options`).toBeGreaterThanOrEqual(2);
  expect(Number.isInteger(item.correct), `${id} ${where}: correct not an integer`).toBe(true);
  expect(item.correct, `${id} ${where}: correct out of range`).toBeGreaterThanOrEqual(0);
  expect(item.correct, `${id} ${where}: correct out of range`).toBeLessThan(item.options.fr.length);
  for (const s of [...item.options.fr, ...item.options.en, item.rationale.fr, item.rationale.en]) {
    expect(s.trim().length, `${id} ${where}: empty string`).toBeGreaterThan(0);
  }
  expect(new Set(item.options.fr).size, `${id} ${where}: duplicate fr options`).toBe(item.options.fr.length);
}

describe('every written lesson is complete in both languages', () => {
  it('there are written lessons to check', () => {
    expect(written.length).toBeGreaterThan(100);
  });

  for (const { id, c } of written) {
    it(id, () => {
      expect(c.intro.fr.length, `${id}: fr/en intro paragraph counts differ`).toBe(c.intro.en.length);
      expect(c.intro.fr.length, `${id}: intro too short`).toBeGreaterThanOrEqual(2);
      for (const p of [...c.intro.fr, ...c.intro.en]) expect(p.trim().length, `${id}: empty paragraph`).toBeGreaterThan(0);
      expect(c.drill.prompt.fr.trim() && c.drill.prompt.en.trim(), `${id}: drill prompt missing`).toBeTruthy();
      checkItem(id, 'drill', c.drill);
      expect(c.quiz.length, `${id}: quiz must have 3 questions`).toBe(3);
      c.quiz.forEach((q, i) => {
        expect(q.q.fr.trim() && q.q.en.trim(), `${id} quiz ${i}: question missing`).toBeTruthy();
        checkItem(id, `quiz ${i}`, q);
      });
    });
  }
});
