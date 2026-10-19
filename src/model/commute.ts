import type { Inputs } from './types';

const WEEKS_PER_YEAR = 52;

export function tripsPerYear(inputs: Inputs): number {
  return inputs.tripsPerWeek * inputs.weeksPerYear;
}

export function kmPerYear(inputs: Inputs): number {
  return tripsPerYear(inputs) * inputs.distanceKm;
}

export function rideMinutesPerTrip(inputs: Inputs): number {
  return (inputs.distanceKm / inputs.bikeSpeedKmh) * 60;
}

/** Cycling minutes per week averaged over the whole year, so holidays dilute the dose. */
export function weeklyCyclingMinutes(inputs: Inputs): number {
  return (tripsPerYear(inputs) * rideMinutesPerTrip(inputs)) / WEEKS_PER_YEAR;
}
