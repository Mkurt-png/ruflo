import { describe, it, expect } from 'vitest';
import { battleView, outsiderView, roleOf, HIDDEN_ANSWER } from './view';
import type { Battle } from '@/lib/db/battle-queries';

const q = (correct: number) => ({
  trackId: 't',
  lessonId: 'l',
  q: { fr: 'Q', en: 'Q' },
  options: { fr: ['a', 'b', 'c', 'd'], en: ['a', 'b', 'c', 'd'] },
  correct,
  rationale: { fr: 'parce que', en: 'because' },
});

function battle(over: Partial<Battle> = {}): Battle {
  return {
    id: 'b1',
    host_email: 'host@example.com',
    guest_email: 'guest@example.com',
    status: 'active',
    questions: [q(2), q(1), q(3)],
    current_index: 1,
    host_answers: [2, null, null],
    guest_answers: [0, 1, null],
    host_times: [4000, null, null],
    guest_times: [5000, 3000, null],
    created_at: '2026-09-26T00:00:00Z',
    started_at: '2026-09-26T00:00:01Z',
    finished_at: null,
    ...over,
  };
}

describe('no participant is ever sent an email address', () => {
  it.each(['host', 'guest'] as const)('%s view', (role) => {
    const json = JSON.stringify(battleView(battle(), role));
    expect(json).not.toContain('@example.com');
  });
  it('outsider view', () => {
    expect(JSON.stringify(outsiderView(battle()))).not.toContain('@');
  });
});

describe('a question is revealed only to someone who has answered it', () => {
  // Host has answered question 0 only; guest has answered 0 and 1 (current).
  const host = battleView(battle(), 'host');

  it('shows the key for a question the viewer answered', () => {
    expect(host.questions[0]).toHaveProperty('correct', 2);
    expect(host.questions[0]).toHaveProperty('rationale');
  });

  it('hides the key for the current question the viewer has not answered', () => {
    expect(host.questions[1]).not.toHaveProperty('correct');
    expect(host.questions[1]).not.toHaveProperty('rationale');
  });

  it("hides the opponent's pick on that question, but not that they answered", () => {
    // The UI shows "opponent answered"; it must not learn which option.
    expect(host.guestAnswers[1]).toBe(HIDDEN_ANSWER);
    expect(host.guestAnswers[1]).not.toBeNull();
    expect(host.guestTimes[1]).toBeNull();
  });

  it("keeps the opponent's pick on questions the viewer already answered", () => {
    expect(host.guestAnswers[0]).toBe(0);
  });

  it('does not let the score move on an unrevealed question', () => {
    // Guest got question 1 right. If the score counted it, the host would
    // learn that the guest's (hidden) answer was correct.
    expect(host.scores).toEqual({ host: 1, guest: 0 });
  });

  it("never masks the viewer's own answers", () => {
    const guest = battleView(battle(), 'guest');
    expect(guest.guestAnswers).toEqual([0, 1, null]);
    expect(guest.questions[1]).toHaveProperty('correct', 1);
  });
});

describe('a finished battle reveals everything', () => {
  it('to both sides', () => {
    const done = battle({
      status: 'finished',
      current_index: 2,
      host_answers: [2, null, 3],
      guest_answers: [0, 1, 3],
      host_times: [4000, null, 2000],
      guest_times: [5000, 3000, 2500],
    });
    for (const role of ['host', 'guest'] as const) {
      const v = battleView(done, role);
      expect(v.questions.every((x) => 'correct' in x)).toBe(true);
      expect(v.hostAnswers).toEqual([2, null, 3]);
      expect(v.guestAnswers).toEqual([0, 1, 3]);
    }
    // host: q0 ✓, q2 ✓ faster → 2.1 ; guest: q1 ✓, q2 ✓ → 2
    expect(battleView(done, 'host').scores).toEqual({ host: 2.1, guest: 2 });
  });
});

describe('roleOf', () => {
  it('names the side, or null for a stranger', () => {
    expect(roleOf(battle(), 'host@example.com')).toBe('host');
    expect(roleOf(battle(), 'guest@example.com')).toBe('guest');
    expect(roleOf(battle(), 'someone@else.com')).toBeNull();
  });
});
