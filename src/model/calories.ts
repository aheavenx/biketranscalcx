import { rideMinutesPerTrip } from './commute';
import type { FitnessLevel, Inputs, Sex } from './types';

export const BIKE_MASS_KG = 15;
export const GRAVITY = 9.81;
/** Rolling resistance coefficient for city tyres on asphalt. */
export const ROLLING_RESISTANCE = 0.008;
export const AIR_DENSITY = 1.2;
/** Drag area (m²) of an upright commuter whose body surface area is REFERENCE_BSA. */
export const REFERENCE_CDA = 0.55;
export const REFERENCE_BSA = 1.9;
/** Extra work from stopping and accelerating in city traffic; the road is assumed flat with no wind. */
export const STOP_AND_GO_FACTOR = 1.1;
const JOULES_PER_KCAL = 4184;

/** Gross efficiency of cycling: trained riders turn more of the energy they burn into work. */
export const GROSS_EFFICIENCY: Record<FitnessLevel, number> = {
  sedentary: 0.18,
  light: 0.19,
  moderate: 0.2,
  active: 0.215,
  athlete: 0.23,
};

/** Mifflin-St Jeor sex term; "unspecified" is the midpoint of male (+5) and female (−161). */
const MIFFLIN_SEX_OFFSET: Record<Sex, number> = { male: 5, female: -161, unspecified: -78 };

/** Du Bois & Du Bois (1916) body surface area in m². */
export function bodySurfaceArea(weightKg: number, heightCm: number): number {
  return 0.007184 * weightKg ** 0.425 * heightCm ** 0.725;
}

/** Mechanical power (W) to ride at the input speed on a flat road with no wind, including stop-and-go. */
export function computedPowerW(inputs: Inputs): number {
  const speed = inputs.bikeSpeedKmh / 3.6;
  const mass = inputs.weightKg + BIKE_MASS_KG;
  const dragArea = (REFERENCE_CDA * bodySurfaceArea(inputs.weightKg, inputs.heightCm)) / REFERENCE_BSA;
  const rolling = ROLLING_RESISTANCE * mass * GRAVITY * speed;
  const aero = 0.5 * AIR_DENSITY * dragArea * speed ** 3;
  return (rolling + aero) * STOP_AND_GO_FACTOR;
}

/** The rider's own average power when entered (e.g. from a power meter), otherwise the computed estimate. */
export function averagePowerW(inputs: Inputs): number {
  return inputs.avgPowerW ?? computedPowerW(inputs);
}

/** Mifflin-St Jeor resting energy expenditure, per hour. */
export function restingKcalPerHour(inputs: Inputs): number {
  const bmr = 10 * inputs.weightKg + 6.25 * inputs.heightCm - 5 * inputs.age + MIFFLIN_SEX_OFFSET[inputs.sex];
  return bmr / 24;
}

export function grossKcalPerHour(inputs: Inputs): number {
  const metabolicWatts = averagePowerW(inputs) / GROSS_EFFICIENCY[inputs.fitness];
  return (metabolicWatts * 3600) / JOULES_PER_KCAL;
}

/** Calories burned per hour of riding above what the body burns at rest anyway. */
export function netKcalPerHour(inputs: Inputs): number {
  return Math.max(0, grossKcalPerHour(inputs) - restingKcalPerHour(inputs));
}

export function netKcalPerTrip(inputs: Inputs): number {
  return (netKcalPerHour(inputs) * rideMinutesPerTrip(inputs)) / 60;
}
