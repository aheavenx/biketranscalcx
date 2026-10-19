import { describe, expect, it } from 'vitest';
import { DEFAULT_INPUTS } from './defaults';
import {
  annualCrashHazard,
  baselineHazard,
  computeLifeExpectancy,
  heatRiskReduction,
  remainingLifeExpectancy,
} from './mortality';

describe('baseline mortality', () => {
  it('matches Eurostat 2024 life expectancy at birth', () => {
    expect(Math.abs(remainingLifeExpectancy(baselineHazard('male'), 0) - 78.9)).toBeLessThan(0.3);
    expect(Math.abs(remainingLifeExpectancy(baselineHazard('female'), 0) - 84.1)).toBeLessThan(0.3);
  });

  it('puts unspecified between male and female', () => {
    const unspecified = remainingLifeExpectancy(baselineHazard('unspecified'), 0);
    expect(unspecified).toBeGreaterThan(78.9);
    expect(unspecified).toBeLessThan(84.1);
  });

  it('gives the expected remaining years at 35', () => {
    expect(remainingLifeExpectancy(baselineHazard('unspecified'), 35)).toBeCloseTo(47.65, 2);
  });

  it('rises with age', () => {
    const hazard = baselineHazard('male');
    expect(hazard(60)).toBeGreaterThan(hazard(40));
  });
});

describe('heatRiskReduction', () => {
  it('is 10% per 100 minutes, capped at 45%', () => {
    expect(heatRiskReduction(0)).toBe(0);
    expect(heatRiskReduction(100)).toBeCloseTo(0.1, 10);
    expect(heatRiskReduction(300)).toBeCloseTo(0.3, 10);
    expect(heatRiskReduction(450)).toBeCloseTo(0.45, 10);
    expect(heatRiskReduction(1000)).toBe(0.45);
  });
});

describe('annualCrashHazard', () => {
  it('is km per year times the fatality rate', () => {
    expect(annualCrashHazard(DEFAULT_INPUTS)).toBeCloseTo(3680 * 15e-9, 15);
  });
});

describe('computeLifeExpectancy', () => {
  it('nets the activity benefit against crash risk for defaults', () => {
    const result = computeLifeExpectancy(DEFAULT_INPUTS);
    expect(result.riskReduction).toBeCloseTo(0.2359, 4);
    expect(result.activityGainYears).toBeCloseTo(0.0677, 4);
    expect(result.crashLossYears).toBeCloseTo(0.0125, 4);
    expect(result.netGainYears).toBeCloseTo(0.0552, 4);
    expect(result.netGainYears).toBeCloseTo(result.activityGainYears - result.crashLossYears, 10);
    expect(result.outsideHeatAgeRange).toBe(false);
  });

  it('grows with a longer horizon', () => {
    expect(computeLifeExpectancy({ ...DEFAULT_INPUTS, horizonYears: 30 }).netGainYears).toBeCloseTo(0.727, 2);
  });

  it('counts no activity benefit above 64 but still counts crash risk', () => {
    const result = computeLifeExpectancy({ ...DEFAULT_INPUTS, age: 70 });
    expect(result.activityGainYears).toBe(0);
    expect(result.crashLossYears).toBeGreaterThan(0);
    expect(result.outsideHeatAgeRange).toBe(true);
  });

  it('flags horizons that run past 64 but still counts the years before', () => {
    const result = computeLifeExpectancy({ ...DEFAULT_INPUTS, age: 60, horizonYears: 10 });
    expect(result.outsideHeatAgeRange).toBe(true);
    expect(result.activityGainYears).toBeGreaterThan(0);
  });

  it('has no crash loss with a zero fatality rate', () => {
    expect(computeLifeExpectancy({ ...DEFAULT_INPUTS, cyclistFatalityPerBillionKm: 0 }).crashLossYears).toBe(0);
  });

  it('changes nothing with zero trips', () => {
    expect(computeLifeExpectancy({ ...DEFAULT_INPUTS, tripsPerWeek: 0 }).netGainYears).toBe(0);
  });
});
