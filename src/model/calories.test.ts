import { describe, expect, it } from 'vitest';
import {
  bodySurfaceArea,
  mechanicalPowerW,
  netKcalPerHour,
  netKcalPerTrip,
  restingKcalPerHour,
} from './calories';
import { DEFAULT_INPUTS } from './defaults';

describe('bodySurfaceArea', () => {
  it('matches the Du Bois formula', () => {
    expect(bodySurfaceArea(75, 175)).toBeCloseTo(1.9031, 4);
  });
});

describe('mechanicalPowerW', () => {
  it('includes rolling, aero and the urban factor', () => {
    expect(mechanicalPowerW(DEFAULT_INPUTS)).toBeCloseTo(95.79, 2);
  });
});

describe('restingKcalPerHour', () => {
  it('uses Mifflin-St Jeor with the averaged sex offset for unspecified', () => {
    expect(restingKcalPerHour(DEFAULT_INPUTS)).toBeCloseTo(66.281, 3);
  });

  it('is higher for male than female inputs', () => {
    expect(restingKcalPerHour({ ...DEFAULT_INPUTS, sex: 'male' })).toBeGreaterThan(
      restingKcalPerHour({ ...DEFAULT_INPUTS, sex: 'female' }),
    );
  });
});

describe('netKcalPerHour', () => {
  it('lands in the expected range for defaults', () => {
    const value = netKcalPerHour(DEFAULT_INPUTS);
    expect(value).toBeCloseTo(345.83, 2);
    expect(value).toBeGreaterThan(300);
    expect(value).toBeLessThan(380);
  });

  it('is lower for fitter riders (higher efficiency)', () => {
    const sedentary = netKcalPerHour({ ...DEFAULT_INPUTS, fitness: 'sedentary' });
    const moderate = netKcalPerHour(DEFAULT_INPUTS);
    const athlete = netKcalPerHour({ ...DEFAULT_INPUTS, fitness: 'athlete' });
    expect(sedentary).toBeGreaterThan(moderate);
    expect(moderate).toBeGreaterThan(athlete);
  });

  it('is higher for heavier riders and faster speeds', () => {
    expect(netKcalPerHour({ ...DEFAULT_INPUTS, weightKg: 95 })).toBeGreaterThan(netKcalPerHour(DEFAULT_INPUTS));
    expect(netKcalPerHour({ ...DEFAULT_INPUTS, bikeSpeedKmh: 25 })).toBeGreaterThan(netKcalPerHour(DEFAULT_INPUTS));
  });

  it('never goes negative', () => {
    const tinySlowRider = {
      ...DEFAULT_INPUTS,
      bikeSpeedKmh: 5,
      weightKg: 35,
      heightCm: 120,
      age: 16,
      sex: 'male' as const,
      fitness: 'athlete' as const,
    };
    expect(netKcalPerHour(tinySlowRider)).toBe(0);
  });
});

describe('netKcalPerTrip', () => {
  it('scales hourly burn by ride time', () => {
    expect(netKcalPerTrip(DEFAULT_INPUTS)).toBeCloseTo(153.7, 1);
  });
});
