// TICKRA-REDESIGN: Badge helpers — pure, framework-agnostic.

export type BadgeLevel = 'Foundations' | 'Intermediate' | 'Advanced' | 'Mastery';

export const TRACKS: { id: string; name: string; level: BadgeLevel }[] = [
  { id: '01', name: 'Markets & forex — basics', level: 'Foundations' },
  { id: '02', name: 'Brokers & platforms', level: 'Foundations' },
  { id: '03', name: 'Japanese candles', level: 'Foundations' },
  { id: '04', name: 'Market structure', level: 'Foundations' },
  { id: '05', name: 'Risk management', level: 'Foundations' },
  { id: '06', name: 'Support & resistance', level: 'Intermediate' },
  { id: '07', name: 'Volume & order flow', level: 'Intermediate' },
  { id: '08', name: 'Chart patterns', level: 'Intermediate' },
  { id: '09', name: 'Fundamental analysis', level: 'Intermediate' },
  { id: '10', name: 'Sessions & instruments', level: 'Intermediate' },
  { id: '11', name: 'Trend strategies', level: 'Advanced' },
  { id: '12', name: 'Range strategies', level: 'Advanced' },
  { id: '13', name: 'Volatility regimes', level: 'Advanced' },
  { id: '14', name: 'Psychology & journal', level: 'Mastery' },
  { id: '15', name: 'Live markets', level: 'Mastery' },
];

export const LEVEL_COLORS: Record<BadgeLevel, { bg: string; fg: string }> = {
  Foundations: { bg: '#EAF3DE', fg: '#27500A' },
  Intermediate: { bg: '#E6F1FB', fg: '#0C447C' },
  Advanced: { bg: '#EEEDFE', fg: '#3C3489' },
  Mastery: { bg: '#FAEEDA', fg: '#633806' },
};

export function getTrackById(trackId: string): { id: string; name: string; level: BadgeLevel } | null {
  return TRACKS.find((t) => t.id === trackId) ?? null;
}

export type LinkedInShareParams = {
  trackName: string;
  issueYear: number;
  issueMonth: number;
  certUrl: string;
};

// Returns a "Add to LinkedIn profile" share URL.
// Ref: https://www.linkedin.com/help/linkedin/answer/a541636/
export function buildLinkedInShareUrl(p: LinkedInShareParams): string {
  const u = new URL('https://www.linkedin.com/profile/add');
  u.searchParams.set('startTask', 'CERTIFICATION_NAME');
  u.searchParams.set('name', p.trackName);
  u.searchParams.set('organizationName', 'kNOWTrade');
  u.searchParams.set('issueYear', String(p.issueYear));
  u.searchParams.set('issueMonth', String(p.issueMonth));
  u.searchParams.set('certUrl', p.certUrl);
  return u.toString();
}
