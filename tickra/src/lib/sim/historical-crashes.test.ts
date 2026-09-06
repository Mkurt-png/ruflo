import { describe, it, expect } from 'vitest';
import { CRASH_EVENTS } from './historical-crashes';

describe('CRASH_EVENTS data integrity', () => {
  it('exposes the four documented events with unique ids', () => {
    expect(CRASH_EVENTS.length).toBeGreaterThanOrEqual(4);
    const ids = CRASH_EVENTS.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('keeps every candle OHLC-consistent', () => {
    for (const e of CRASH_EVENTS) {
      expect(e.candles.length).toBeGreaterThan(0);
      for (const c of e.candles) {
        expect(c.h).toBeGreaterThanOrEqual(Math.max(c.o, c.c));
        expect(c.l).toBeLessThanOrEqual(Math.min(c.o, c.c));
        expect(c.h).toBeGreaterThanOrEqual(c.l);
      }
    }
  });

  it('has an in-range startIndex for every event', () => {
    for (const e of CRASH_EVENTS) {
      expect(e.startIndex).toBeGreaterThanOrEqual(0);
      expect(e.startIndex).toBeLessThan(e.candles.length);
    }
  });

  it('provides bilingual label and body for every event', () => {
    for (const e of CRASH_EVENTS) {
      expect(e.label.fr.length).toBeGreaterThan(0);
      expect(e.label.en.length).toBeGreaterThan(0);
      expect(e.body.fr.length).toBeGreaterThan(0);
      expect(e.body.en.length).toBeGreaterThan(0);
      expect(e.symbol.length).toBeGreaterThan(0);
    }
  });
});
