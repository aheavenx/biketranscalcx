import { describe, expect, it } from 'vitest';
import { weeklyCyclingMinutes } from './commute';
import { DEFAULT_INPUTS } from './defaults';
import { bmi, computeFitness, fitnessAge, jacksonVo2max } from './fitness';

describe('jacksonVo2max', () => {
  it('matches a hand-computed example', () => {
    // 56.363 + 1.921·5 − 0.381·40 − 0.754·25 + 10.987
    expect(jacksonVo2max(40, 'male', 25, 5)).toBeCloseTo(42.865, 3);
    expect(jacksonVo2max(40, 'female', 25, 5)).toBeCloseTo(31.878, 3);
  });
});

describe('bmi', () => {
  it('is weight over height squared', () => {
    expect(bmi(75, 175)).toBeCloseTo(24.49, 2);
  });
});

describe('fitnessAge', () => {
  it('inverts the Jackson equation for an average person', () => {
    expect(fitnessAge(jacksonVo2max(50, 'female', 24, 3), 'female')).toBeCloseTo(50, 6);
  });

  it('clamps to 18–90', () => {
    expect(fitnessAge(80, 'male')).toBe(18);
    expect(fitnessAge(0, 'male')).toBe(90);
  });
});

describe('computeFitness', () => {
  const result = computeFitness(DEFAULT_INPUTS);

  it('starts both modes at the baseline estimate', () => {
    expect(result.baselineVo2max).toBeCloseTo(35.819, 3);
    expect(result.points).toHaveLength(6);
    expect(result.points[0]).toEqual({ year: 0, transit: result.baselineVo2max, bike: result.baselineVo2max });
    expect(result.currentFitnessAge).toBeCloseTo(35.97, 2);
  });

  it('declines without cycling and improves then declines slower with cycling', () => {
    expect(result.points[5].transit).toBeCloseTo(34.0637, 3);
    expect(result.points[5].bike).toBeCloseTo(36.8636, 3);
    expect(result.fitnessAgeAtEnd.bike).toBeLessThan(result.fitnessAgeAtEnd.transit);
  });

  it('gives athletes no first-year gain', () => {
    const athlete = computeFitness({ ...DEFAULT_INPUTS, fitness: 'athlete' });
    expect(athlete.points[1].bike).toBeCloseTo(athlete.baselineVo2max, 10);
  });

  it('scales the gain with dose below 150 minutes', () => {
    const inputs = { ...DEFAULT_INPUTS, tripsPerWeek: 2 };
    const low = computeFitness(inputs);
    const expectedGain = 0.05 * (weeklyCyclingMinutes(inputs) / 150);
    expect(low.points[1].bike).toBeCloseTo(low.baselineVo2max * (1 + expectedGain), 10);
  });

  it('treats zero trips as no cycling', () => {
    const none = computeFitness({ ...DEFAULT_INPUTS, tripsPerWeek: 0 });
    for (const point of none.points) expect(point.bike).toBe(point.transit);
  });
});
