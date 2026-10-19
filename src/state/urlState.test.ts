import { describe, expect, it } from 'vitest';
import { DEFAULT_INPUTS } from '../model/defaults';
import type { Inputs } from '../model/types';
import { hasInputParams, inputsFromSearch, inputsToSearch, sanitizeInputs } from './urlState';

describe('inputsToSearch', () => {
  it('is empty for defaults', () => {
    expect(inputsToSearch(DEFAULT_INPUTS)).toBe('');
  });

  it('writes only changed fields, in field order', () => {
    expect(inputsToSearch({ ...DEFAULT_INPUTS, sex: 'female', tripsPerWeek: 5 })).toBe('tw=5&sx=female');
  });

  it('writes an entered own power and omits a blank one', () => {
    expect(inputsToSearch({ ...DEFAULT_INPUTS, avgPowerW: 150 })).toBe('pw=150');
    expect(inputsToSearch({ ...DEFAULT_INPUTS, avgPowerW: null })).toBe('');
  });
});

describe('inputsFromSearch', () => {
  it('round-trips', () => {
    const inputs: Inputs = {
      ...DEFAULT_INPUTS,
      horizonYears: 12,
      distanceKm: 12.5,
      fitness: 'athlete',
      valueOfTimePerHour: 0,
      avgPowerW: 142.5,
    };
    expect(inputsFromSearch(`?${inputsToSearch(inputs)}`)).toEqual(inputs);
  });

  it('falls back to defaults for invalid values per field', () => {
    expect(inputsFromSearch('?tw=abc&dk=999&sx=robot&hy=7&ag=')).toEqual({ ...DEFAULT_INPUTS, horizonYears: 7 });
  });

  it('leaves own power blank when the param is missing, empty or out of range', () => {
    expect(inputsFromSearch('?pw=').avgPowerW).toBeNull();
    expect(inputsFromSearch('?pw=5').avgPowerW).toBeNull();
    expect(inputsFromSearch('?pw=abc&hy=7')).toEqual({ ...DEFAULT_INPUTS, horizonYears: 7 });
  });

  it('rejects fractions for whole-number fields', () => {
    expect(inputsFromSearch('?tw=2.5').tripsPerWeek).toBe(DEFAULT_INPUTS.tripsPerWeek);
  });
});

describe('hasInputParams', () => {
  it('detects known keys only', () => {
    expect(hasInputParams('?hy=3')).toBe(true);
    expect(hasInputParams('?utm_source=newsletter')).toBe(false);
    expect(hasInputParams('')).toBe(false);
  });
});

describe('sanitizeInputs', () => {
  it('returns defaults for non-objects', () => {
    expect(sanitizeInputs(null)).toEqual(DEFAULT_INPUTS);
    expect(sanitizeInputs('nope')).toEqual(DEFAULT_INPUTS);
  });

  it('keeps valid fields and drops invalid or unknown ones', () => {
    expect(sanitizeInputs({ tripsPerWeek: 4, weightKg: 'heavy', sex: 'male', extra: 1 })).toEqual({
      ...DEFAULT_INPUTS,
      tripsPerWeek: 4,
      sex: 'male',
    });
  });

  it('keeps a stored own power and treats null or junk as blank', () => {
    expect(sanitizeInputs({ avgPowerW: 180 }).avgPowerW).toBe(180);
    expect(sanitizeInputs({ avgPowerW: null }).avgPowerW).toBeNull();
    expect(sanitizeInputs({ avgPowerW: 'fast' }).avgPowerW).toBeNull();
  });
});
