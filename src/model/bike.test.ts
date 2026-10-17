import { describe, expect, it } from 'vitest';
import { bikesBought, bikeValue, capitalCostForYear, residualValueAtHorizon } from './bike';
import { DEFAULT_INPUTS } from './defaults';
import type { Inputs } from './types';

const sumCapital = (inputs: Inputs) => {
  let total = 0;
  for (let year = 1; year <= inputs.horizonYears; year++) total += capitalCostForYear(inputs, year);
  return total;
};

describe('bikeValue', () => {
  it('declines by the depreciation rate each year', () => {
    expect(bikeValue(800, 15, 0)).toBe(800);
    expect(bikeValue(800, 15, 1)).toBeCloseTo(680, 10);
    expect(bikeValue(800, 15, 2)).toBeCloseTo(578, 10);
  });
});

describe('capitalCostForYear', () => {
  it('is the value lost in each year', () => {
    expect(capitalCostForYear(DEFAULT_INPUTS, 1)).toBeCloseTo(120, 10);
    expect(capitalCostForYear(DEFAULT_INPUTS, 2)).toBeCloseTo(102, 10);
    expect(capitalCostForYear(DEFAULT_INPUTS, 3)).toBeCloseTo(86.7, 10);
  });

  it('restarts with a new bike after replacement', () => {
    const inputs = { ...DEFAULT_INPUTS, replaceEveryYears: 2 };
    expect(capitalCostForYear(inputs, 3)).toBeCloseTo(120, 10);
  });

  it('is zero without depreciation', () => {
    expect(capitalCostForYear({ ...DEFAULT_INPUTS, depreciationPct: 0 }, 4)).toBe(0);
  });
});

describe('totals over the horizon', () => {
  it('equals price minus residual value without replacement', () => {
    expect(bikesBought(DEFAULT_INPUTS)).toBe(1);
    expect(residualValueAtHorizon(DEFAULT_INPUTS)).toBeCloseTo(354.964, 3);
    expect(sumCapital(DEFAULT_INPUTS)).toBeCloseTo(800 - 354.96425, 6);
  });

  it('equals purchases minus resales minus residual with replacement', () => {
    const inputs = { ...DEFAULT_INPUTS, horizonYears: 5, replaceEveryYears: 2 };
    const bikes = bikesBought(inputs);
    expect(bikes).toBe(3);
    const resaleEach = bikeValue(800, 15, 2);
    const residual = residualValueAtHorizon(inputs);
    expect(residual).toBeCloseTo(680, 10);
    expect(sumCapital(inputs)).toBeCloseTo(bikes * 800 - (bikes - 1) * resaleEach - residual, 6);
    expect(sumCapital(inputs)).toBeCloseTo(564, 6);
  });
});
