import { describe, it, expect } from 'vitest';
import {
  SESSIONS,
  utcMinutes,
  isSessionOpen,
  sessionState,
  openSessions,
  isOverlap,
} from './market-sessions';

const at = (h: number, m = 0) => new Date(Date.UTC(2026, 0, 5, h, m, 0)); // a Monday
const session = (id: string) => SESSIONS.find((s) => s.id === id)!;

describe('utcMinutes', () => {
  it('converts a UTC time to minutes since midnight', () => {
    expect(utcMinutes(at(0, 0))).toBe(0);
    expect(utcMinutes(at(8, 30))).toBe(8 * 60 + 30);
    expect(utcMinutes(at(23, 59))).toBe(23 * 60 + 59);
  });
});

describe('isSessionOpen', () => {
  it('handles a normal (non-wrapping) window — London 08:00→17:00', () => {
    const london = session('london');
    expect(isSessionOpen(london, at(7, 59))).toBe(false);
    expect(isSessionOpen(london, at(8, 0))).toBe(true);
    expect(isSessionOpen(london, at(16, 59))).toBe(true);
    expect(isSessionOpen(london, at(17, 0))).toBe(false);
  });

  it('handles a wrapping window — Sydney 22:00→07:00', () => {
    const sydney = session('sydney');
    expect(isSessionOpen(sydney, at(22, 0))).toBe(true);
    expect(isSessionOpen(sydney, at(2, 0))).toBe(true);
    expect(isSessionOpen(sydney, at(6, 59))).toBe(true);
    expect(isSessionOpen(sydney, at(7, 0))).toBe(false);
    expect(isSessionOpen(sydney, at(12, 0))).toBe(false);
  });
});

describe('openSessions / isOverlap', () => {
  it('finds the London–New York overlap (13:00–17:00)', () => {
    const open = openSessions(at(14, 0));
    expect(open).toContain('london');
    expect(open).toContain('newyork');
    expect(isOverlap(at(14, 0))).toBe(true);
  });

  it('finds the Sydney–Tokyo overlap in the early UTC hours', () => {
    // 02:00 UTC: Sydney (22→07) and Tokyo (00→09) both open.
    const open = openSessions(at(2, 0));
    expect(open).toContain('sydney');
    expect(open).toContain('tokyo');
  });

  it('reports a single open session as no overlap', () => {
    // 10:30 UTC: London open, Tokyo closed (09:00), NY not yet (13:00).
    expect(openSessions(at(10, 30))).toEqual(['london']);
    expect(isOverlap(at(10, 30))).toBe(false);
  });
});

describe('sessionState', () => {
  it('counts down to close while open', () => {
    const london = session('london');
    const s = sessionState(london, at(16, 0)); // closes 17:00
    expect(s.open).toBe(true);
    expect(s.minutesToChange).toBe(60);
  });

  it('counts down to open while closed, wrapping midnight', () => {
    const tokyo = session('tokyo'); // opens 00:00
    const s = sessionState(tokyo, at(23, 30));
    expect(s.open).toBe(false);
    expect(s.minutesToChange).toBe(30);
  });

  it('never reports a zero countdown', () => {
    for (const s of SESSIONS) {
      const st = sessionState(s, at(0, 0));
      expect(st.minutesToChange).toBeGreaterThan(0);
    }
  });
});
