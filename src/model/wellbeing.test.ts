import { describe, expect, it } from 'vitest';
import { DEFAULT_INPUTS } from './defaults';
import { computeWellbeing } from './wellbeing';

describe('computeWellbeing', () => {
  it('compares weekly minutes with the WHO 150-minute minimum', () => {
    const result = computeWellbeing(DEFAULT_INPUTS);
    expect(result.weeklyActiveMinutes).toBeCloseTo(235.897, 3);
    expect(result.whoGuidelinePct).toBeCloseTo(157.265, 3);
  });

  it('reports yearly net kcal and its body-fat equivalent', () => {
    const result = computeWellbeing(DEFAULT_INPUTS);
    expect(result.netKcalPerYear).toBeCloseTo(70702.7, 1);
    expect(result.fatEquivalentKg).toBeCloseTo(9.182, 3);
  });
});
