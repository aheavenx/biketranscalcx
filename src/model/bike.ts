import type { Inputs } from './types';

/** Declining-balance value of a bike that is `ageYears` old. */
export function bikeValue(price: number, depreciationPct: number, ageYears: number): number {
  return price * (1 - depreciationPct / 100) ** ageYears;
}

/** Age at the end of projection year `year` (1-based) of the bike in use, given replacement every N years. */
export function bikeAgeAtYearEnd(year: number, replaceEveryYears: number): number {
  return ((year - 1) % replaceEveryYears) + 1;
}

/**
 * Economic capital cost in projection year `year`: the value the current bike loses that year.
 * A replaced bike is sold at its depreciated value and a new one bought at full price, so the
 * swap itself adds nothing beyond depreciation.
 */
export function capitalCostForYear(inputs: Inputs, year: number): number {
  const age = bikeAgeAtYearEnd(year, inputs.replaceEveryYears);
  return (
    bikeValue(inputs.bikePrice, inputs.depreciationPct, age - 1) -
    bikeValue(inputs.bikePrice, inputs.depreciationPct, age)
  );
}

export function bikesBought(inputs: Inputs): number {
  return Math.ceil(inputs.horizonYears / inputs.replaceEveryYears);
}

/** Value of the bike you still own at the end of the horizon. */
export function residualValueAtHorizon(inputs: Inputs): number {
  const age = bikeAgeAtYearEnd(inputs.horizonYears, inputs.replaceEveryYears);
  return bikeValue(inputs.bikePrice, inputs.depreciationPct, age);
}
