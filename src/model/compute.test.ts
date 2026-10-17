import { describe, expect, it } from 'vitest';
import { computeAll } from './compute';
import { DEFAULT_INPUTS } from './defaults';

describe('computeAll', () => {
  it('returns every result section sized to the horizon', () => {
    const results = computeAll({ ...DEFAULT_INPUTS, horizonYears: 7 });
    expect(results.costs.rows).toHaveLength(7);
    expect(results.fitness.points).toHaveLength(8);
    expect(results.lifeExpectancy.baselineRemainingYears).toBeGreaterThan(0);
    expect(results.wellbeing.netKcalPerYear).toBeCloseTo(
      results.costs.tripsPerYear * results.costs.netKcalPerTrip,
      6,
    );
  });
});
