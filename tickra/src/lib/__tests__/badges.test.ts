import { describe, it, expect } from 'vitest';
import { getTrackById, buildLinkedInShareUrl, TRACKS } from '../badges';

describe('getTrackById', () => {
  it('returns the matching track', () => {
    const first = TRACKS[0];
    expect(getTrackById(first.id)).toEqual(first);
  });

  it('returns null for an unknown id', () => {
    expect(getTrackById('does-not-exist')).toBeNull();
  });
});

describe('buildLinkedInShareUrl', () => {
  it('builds a LinkedIn "add to profile" URL with all params encoded', () => {
    const url = buildLinkedInShareUrl({
      trackName: 'Forex & Risk',
      issueYear: 2026,
      issueMonth: 6,
      certUrl: 'https://tickra.app/verify/abc?x=1',
    });
    const u = new URL(url);
    expect(u.origin + u.pathname).toBe('https://www.linkedin.com/profile/add');
    expect(u.searchParams.get('startTask')).toBe('CERTIFICATION_NAME');
    expect(u.searchParams.get('name')).toBe('Forex & Risk');
    expect(u.searchParams.get('organizationName')).toBe('Tickra');
    expect(u.searchParams.get('issueYear')).toBe('2026');
    expect(u.searchParams.get('issueMonth')).toBe('6');
    // Round-trips a URL with query params intact through encoding.
    expect(u.searchParams.get('certUrl')).toBe('https://tickra.app/verify/abc?x=1');
  });
});
