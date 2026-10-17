import { describe, expect, it } from 'vitest';
import { kmPerYear, rideMinutesPerTrip, tripsPerYear, weeklyCyclingMinutes } from './commute';
import { DEFAULT_INPUTS } from './defaults';

describe('commute helpers', () => {
  it('derives yearly trips and km from the defaults', () => {
    expect(tripsPerYear(DEFAULT_INPUTS)).toBe(460);
    expect(kmPerYear(DEFAULT_INPUTS)).toBe(3680);
  });

  it('derives ride minutes per trip from distance and speed', () => {
    expect(rideMinutesPerTrip(DEFAULT_INPUTS)).toBeCloseTo(26.667, 3);
  });

  it('averages weekly cycling minutes over 52 weeks', () => {
    expect(weeklyCyclingMinutes(DEFAULT_INPUTS)).toBeCloseTo(235.897, 3);
  });

  it('returns zero activity for zero trips', () => {
    const inputs = { ...DEFAULT_INPUTS, tripsPerWeek: 0 };
    expect(tripsPerYear(inputs)).toBe(0);
    expect(weeklyCyclingMinutes(inputs)).toBe(0);
  });
});
