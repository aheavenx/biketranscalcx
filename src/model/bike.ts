import type { Inputs } from './types';

/**
 * Cash spent on bikes in projection year `year` (1-based): the full price in a year a bike is
 * bought (the first year and every replacement), otherwise nothing. Old bikes are not resold.
 */
export function capitalCostForYear(inputs: Inputs, year: number): number {
  return (year - 1) % inputs.replaceEveryYears === 0 ? inputs.bikePrice : 0;
}

export function bikesBought(inputs: Inputs): number {
  return Math.ceil(inputs.horizonYears / inputs.replaceEveryYears);
}
