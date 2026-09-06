import { describe, it, expect } from 'vitest';
import { buildLinkedInShareUrl, getTrackById, TRACKS, LEVEL_COLORS } from './badges';

describe('buildLinkedInShareUrl', () => {
  const url = buildLinkedInShareUrl({
    trackName: 'Japanese Candles',
    issueYear: 2026,
    issueMonth: 6,
    certUrl: 'https://tickra.app/verify/u/track',
  });
  const parsed = new URL(url);

  it('targets the LinkedIn add-to-profile endpoint', () => {
    expect(parsed.origin + parsed.pathname).toBe('https://www.linkedin.com/profile/add');
  });

  it('carries the certification metadata as query params', () => {
    expect(parsed.searchParams.get('startTask')).toBe('CERTIFICATION_NAME');
    expect(parsed.searchParams.get('name')).toBe('Japanese Candles');
    expect(parsed.searchParams.get('organizationName')).toBe('kNOWTrade');
    expect(parsed.searchParams.get('issueYear')).toBe('2026');
    expect(parsed.searchParams.get('issueMonth')).toBe('6');
    expect(parsed.searchParams.get('certUrl')).toBe('https://tickra.app/verify/u/track');
  });

  it('URL-encodes special characters in the track name', () => {
    const u = buildLinkedInShareUrl({
      trackName: 'Risk & Money',
      issueYear: 2026,
      issueMonth: 1,
      certUrl: 'https://x.test/c',
    });
    expect(u).toContain('Risk+%26+Money');
  });
});

describe('getTrackById', () => {
  it('returns a known track', () => {
    const first = TRACKS[0];
    expect(getTrackById(first.id)?.id).toBe(first.id);
  });

  it('returns null for an unknown id', () => {
    expect(getTrackById('not-a-track')).toBeNull();
  });

  it('gives every track a colour for its level', () => {
    for (const t of TRACKS) {
      expect(LEVEL_COLORS[t.level]).toBeDefined();
    }
  });
});
