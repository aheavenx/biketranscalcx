import { describe, expect, it } from 'vitest';
import { computeAll } from './compute';
import { DEFAULT_INPUTS } from './defaults';
import { computeSpeedSweep, sweepSpeeds } from './speed';

describe('sweepSpeeds', () => {
  it('covers every whole km/h from 10 to 40', () => {
    const speeds = sweepSpeeds(18);
    expect(speeds).toHaveLength(31);
    expect(speeds[0]).toBe(10);
    expect(speeds[30]).toBe(40);
  });
  it('inserts an off-grid rider speed in order', () => {
    const speeds = sweepSpeeds(17.5);
    expect(speeds).toHaveLength(32);
    expect(speeds.slice(7, 10)).toEqual([17, 17.5, 18]);
  });
  it('extends the range to a rider speed outside it', () => {
    expect(sweepSpeeds(5)[0]).toBe(5);
    expect(sweepSpeeds(45).at(-1)).toBe(45);
  });
});

describe('computeSpeedSweep', () => {
  const sweep = computeSpeedSweep(DEFAULT_INPUTS);
  it("matches the main results at the rider's speed", () => {
    const rider = sweep.find((point) => point.speedKmh === 18)!;
    const { costs, wellbeing } = computeAll(DEFAULT_INPUTS);
    expect(rider.bikeTrue).toBeCloseTo(costs.totals.bikeTrue, 6);
    expect(rider.bikeMoney).toBeCloseTo(costs.totals.bikeMoney, 6);
    expect(rider.fatKgPerYear).toBeCloseTo(wellbeing.fatEquivalentKg, 6);
  });
  it('keeps public transport flat', () => {
    for (const point of sweep) {
      expect(point.transitTrue).toBeCloseTo(23725, 6);
      expect(point.transitMoney).toBeCloseTo(3600, 6);
    }
  });
  it('burns more fat at higher speeds', () => {
    for (let i = 1; i < sweep.length; i++) expect(sweep[i].fatKgPerYear).toBeGreaterThan(sweep[i - 1].fatKgPerYear);
  });
  it('ignores an entered own power', () => {
    expect(computeSpeedSweep({ ...DEFAULT_INPUTS, avgPowerW: 150 })).toEqual(sweep);
  });
  it('stays finite with zero trips', () => {
    for (const point of computeSpeedSweep({ ...DEFAULT_INPUTS, tripsPerWeek: 0 })) {
      for (const value of Object.values(point)) expect(Number.isFinite(value)).toBe(true);
      expect(point.fatKgPerYear).toBe(0);
    }
  });
});
