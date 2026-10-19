import { describe, expect, it } from 'vitest';
import { DEFAULT_INPUTS, FIELD_SPECS, getNumberSpec, isValidNumber, isValidSelect, rangeMessage } from './defaults';

describe('FIELD_SPECS', () => {
  it('covers every input exactly once', () => {
    const keys = FIELD_SPECS.map((spec) => spec.key).sort();
    expect(keys).toEqual(Object.keys(DEFAULT_INPUTS).sort());
  });

  it('uses unique URL keys', () => {
    const urlKeys = FIELD_SPECS.map((spec) => spec.urlKey);
    expect(new Set(urlKeys).size).toBe(urlKeys.length);
  });

  it('has defaults that are valid for their own specs', () => {
    for (const spec of FIELD_SPECS) {
      let valid: boolean;
      if (spec.kind === 'number') valid = isValidNumber(spec, DEFAULT_INPUTS[spec.key]);
      else if (spec.kind === 'optionalNumber') {
        const value = DEFAULT_INPUTS[spec.key];
        valid = value === null || isValidNumber(spec, value);
      } else valid = isValidSelect(spec, DEFAULT_INPUTS[spec.key]);
      expect(valid, spec.key).toBe(true);
    }
  });
});

describe('isValidNumber', () => {
  const distance = getNumberSpec('distanceKm');
  const trips = getNumberSpec('tripsPerWeek');

  it('accepts values inside the range, including the bounds', () => {
    expect(isValidNumber(distance, 0.5)).toBe(true);
    expect(isValidNumber(distance, 60)).toBe(true);
  });

  it('rejects out-of-range values, NaN and infinity', () => {
    expect(isValidNumber(distance, 0.4)).toBe(false);
    expect(isValidNumber(distance, 60.1)).toBe(false);
    expect(isValidNumber(distance, Number.NaN)).toBe(false);
    expect(isValidNumber(distance, Number.POSITIVE_INFINITY)).toBe(false);
  });

  it('rejects fractions for integer fields', () => {
    expect(isValidNumber(trips, 2.5)).toBe(false);
    expect(isValidNumber(trips, 3)).toBe(true);
  });
});

describe('isValidSelect', () => {
  it('accepts only listed options', () => {
    const sex = FIELD_SPECS.find((spec) => spec.key === 'sex');
    if (sex?.kind !== 'select') throw new Error('sex spec missing');
    expect(isValidSelect(sex, 'female')).toBe(true);
    expect(isValidSelect(sex, 'robot')).toBe(false);
  });
});

describe('rangeMessage', () => {
  it('describes decimal and whole-number ranges', () => {
    expect(rangeMessage(getNumberSpec('distanceKm'))).toBe('Enter a number from 0.5 to 60');
    expect(rangeMessage(getNumberSpec('tripsPerWeek'))).toBe('Enter a whole number from 0 to 28');
  });
});

describe('protein price visibility', () => {
  it('shows each protein price only for its diet', () => {
    const diets = ['meat', 'vegetarian', 'vegan'] as const;
    const shownFor = { cp: 'meat', hp: 'vegetarian', tp: 'vegan' };
    for (const [urlKey, shownDiet] of Object.entries(shownFor)) {
      const spec = FIELD_SPECS.find((candidate) => candidate.urlKey === urlKey);
      expect(spec?.visibleWhen, urlKey).toBeDefined();
      for (const diet of diets) {
        expect(spec?.visibleWhen?.({ ...DEFAULT_INPUTS, diet }), `${urlKey} ${diet}`).toBe(diet === shownDiet);
      }
    }
  });
});
