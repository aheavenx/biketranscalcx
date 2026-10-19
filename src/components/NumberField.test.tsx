import { describe, expect, it } from 'vitest';
import { getNumberSpec } from '../model/defaults';
import { stepValue } from './NumberField';

const distance = getNumberSpec('distanceKm'); // step 0.5, 0.5-60
const ticket = getNumberSpec('singleTicket'); // step 0.1, 0-50
const trips = getNumberSpec('tripsPerWeek'); // step 1, 0-28

describe('stepValue', () => {
  it('steps to the next value on the grid', () => {
    expect(stepValue(distance, 18, 1)).toBe(18.5);
    expect(stepValue(distance, 18, -1)).toBe(17.5);
    expect(stepValue(trips, 10, 1)).toBe(11);
  });
  it('snaps an off-grid value to the neighbouring grid value', () => {
    expect(stepValue(distance, 17.3, 1)).toBe(17.5);
    expect(stepValue(distance, 17.3, -1)).toBe(17);
  });
  it('avoids floating-point noise', () => {
    expect(stepValue(ticket, 2.9, 1)).toBe(3);
    expect(stepValue(ticket, 0.3, -1)).toBe(0.2);
  });
  it('clamps to the range', () => {
    expect(stepValue(distance, 60, 1)).toBe(60);
    expect(stepValue(distance, 0.5, -1)).toBe(0.5);
  });
});
