import { describe, expect, it } from 'vitest';
import { bikesBought, capitalCostForYear } from './bike';
import { DEFAULT_INPUTS } from './defaults';

describe('capitalCostForYear', () => {
  it('charges the full price in the year the bike is bought', () => {
    expect(capitalCostForYear(DEFAULT_INPUTS, 1)).toBe(800);
  });

  it('charges nothing in the years between purchases', () => {
    expect(capitalCostForYear(DEFAULT_INPUTS, 2)).toBe(0);
    expect(capitalCostForYear(DEFAULT_INPUTS, 5)).toBe(0);
  });

  it('charges the full price again at each replacement', () => {
    const inputs = { ...DEFAULT_INPUTS, horizonYears: 5, replaceEveryYears: 2 };
    expect([1, 2, 3, 4, 5].map((year) => capitalCostForYear(inputs, year))).toEqual([800, 0, 800, 0, 800]);
  });
});

describe('bikesBought', () => {
  it('counts the first bike and every replacement within the horizon', () => {
    expect(bikesBought(DEFAULT_INPUTS)).toBe(1);
    expect(bikesBought({ ...DEFAULT_INPUTS, horizonYears: 5, replaceEveryYears: 2 })).toBe(3);
  });
});
