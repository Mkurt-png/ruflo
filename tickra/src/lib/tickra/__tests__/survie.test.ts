import { describe, it, expect } from 'vitest';
import { computeSurvie, type SurvieInput } from '../survie';

function input(over: Partial<SurvieInput> = {}): SurvieInput {
  return { account: 10_000, riskPct: 1, entry: 100, stop: 95, ...over };
}

describe('computeSurvie', () => {
  it('rejects non-positive / non-finite inputs', () => {
    expect(computeSurvie(input({ account: 0 }))).toBeNull();
    expect(computeSurvie(input({ riskPct: 0 }))).toBeNull();
    expect(computeSurvie(input({ entry: 0 }))).toBeNull();
    expect(computeSurvie(input({ stop: -1 }))).toBeNull();
    expect(computeSurvie(input({ account: NaN }))).toBeNull();
  });

  it('sizes the position from risk amount and stop distance', () => {
    const r = computeSurvie(input({ account: 10_000, riskPct: 1, entry: 100, stop: 95 }))!;
    expect(r.riskAmount).toBe(100); // 1% of 10k
    expect(r.stopDistance).toBe(5); // |100 - 95|
    expect(r.positionSize).toBe(20); // 100 / 5
  });

  it('computes planned R and break-even win rate', () => {
    const r = computeSurvie(input({ entry: 100, stop: 95, takeProfit: 110 }))!;
    expect(r.plannedR).toBeCloseTo(2); // |110-100| / 5
    expect(r.breakEvenWinRate).toBeCloseTo((1 / 3) * 100); // 1/(1+2)
  });

  it('leaves R null when no take-profit is given', () => {
    const r = computeSurvie(input({ takeProfit: undefined }))!;
    expect(r.plannedR).toBeNull();
    expect(r.breakEvenWinRate).toBeNull();
  });

  it('counts consecutive losses to halve / tenth the account', () => {
    const r = computeSurvie(input({ riskPct: 2 }))!;
    // 0.98^n <= 0.5  => n = 35 ; 0.98^n <= 0.1 => n = 114
    expect(r.lossesToHalve).toBe(35);
    expect(r.lossesToTenth).toBe(114);
  });

  it('returns 1 loss (not Infinity) when the whole account is risked', () => {
    const r = computeSurvie(input({ riskPct: 100 }))!;
    expect(r.lossesToHalve).toBe(1);
    expect(r.lossesToTenth).toBe(1);
    expect(Number.isFinite(r.lossesToHalve)).toBe(true);
  });

  it('handles an over-100% risk without producing Infinity', () => {
    const r = computeSurvie(input({ riskPct: 150 }))!;
    expect(r.lossesToHalve).toBe(1);
    expect(r.lossesToTenth).toBe(1);
  });

  it('flags high risk, inverted targets, and overly tight stops', () => {
    expect(computeSurvie(input({ riskPct: 3 }))!.warnings).toContain('risk-high');
    // Long (entry above stop) but TP below entry => inverted.
    expect(
      computeSurvie(input({ entry: 100, stop: 95, takeProfit: 90 }))!.warnings,
    ).toContain('inverted');
    // Stop 0.05% away from entry => too tight.
    expect(computeSurvie(input({ entry: 100, stop: 99.95 }))!.warnings).toContain('too-tight');
  });
});
