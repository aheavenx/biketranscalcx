import { computeCosts } from './costs';
import type { Inputs, SpeedPoint } from './types';
import { computeWellbeing } from './wellbeing';

/** Slowest speed of the sweep, km/h. */
export const SWEEP_MIN_KMH = 10;
/** Fastest speed of the sweep, km/h. */
export const SWEEP_MAX_KMH = 40;

/** Whole km/h from the sweep minimum to maximum, plus the rider's own speed, sorted ascending. */
export function sweepSpeeds(riderSpeedKmh: number): number[] {
  const speeds = new Set<number>([riderSpeedKmh]);
  for (let speed = SWEEP_MIN_KMH; speed <= SWEEP_MAX_KMH; speed++) speeds.add(speed);
  return [...speeds].sort((a, b) => a - b);
}

/** Re-runs the cost and calorie model at each sweep speed, using the modelled (not entered) power. */
export function computeSpeedSweep(inputs: Inputs): SpeedPoint[] {
  return sweepSpeeds(inputs.bikeSpeedKmh).map((speedKmh) => {
    const atSpeed = { ...inputs, bikeSpeedKmh: speedKmh, avgPowerW: null };
    const { totals } = computeCosts(atSpeed);
    return {
      speedKmh,
      bikeTrue: totals.bikeTrue,
      bikeMoney: totals.bikeMoney,
      transitTrue: totals.transitTrue,
      transitMoney: totals.transitMoney,
      fatKgPerYear: computeWellbeing(atSpeed).fatEquivalentKg,
    };
  });
}
