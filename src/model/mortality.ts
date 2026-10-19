import { kmPerYear, weeklyCyclingMinutes } from './commute';
import type { Inputs, LifeExpectancyResults, Sex } from './types';

export interface GompertzMakeham {
  lambda: number;
  alpha: number;
  beta: number;
}

/**
 * Annual hazard h(a) = lambda + alpha·e^(beta·a). Fitted so remainingLifeExpectancy(…, 0) matches
 * Eurostat 2024 EU life expectancy at birth (demo_mlexpec): male 78.9, female 84.1.
 */
export const MORTALITY: Record<'male' | 'female', GompertzMakeham> = {
  male: { lambda: 0.0005, alpha: 4.635e-5, beta: 0.087 },
  female: { lambda: 0.0003, alpha: 1.71e-5, beta: 0.095 },
};

export const MAX_AGE = 110;
/** WHO HEAT: all-cause mortality RR 0.90 per 100 min/week of cycling (Kelly et al. 2014), capped at 45%. */
export const HEAT_REDUCTION_PER_100_MIN = 0.1;
export const HEAT_MAX_REDUCTION = 0.45;
export const HEAT_MIN_AGE = 20;
export const HEAT_MAX_AGE = 64;

export type Hazard = (age: number) => number;

export function gompertzHazard(params: GompertzMakeham, age: number): number {
  return params.lambda + params.alpha * Math.exp(params.beta * age);
}

export function baselineHazard(sex: Sex): Hazard {
  if (sex === 'unspecified') {
    return (age) => (gompertzHazard(MORTALITY.male, age) + gompertzHazard(MORTALITY.female, age)) / 2;
  }
  const params = MORTALITY[sex];
  return (age) => gompertzHazard(params, age);
}

/** e(x) = 0.5 + Σ_{t≥1} S(x+t)/S(x), with annual steps up to MAX_AGE. */
export function remainingLifeExpectancy(hazard: Hazard, fromAge: number): number {
  let survival = 1;
  let years = 0.5;
  for (let age = fromAge; age < MAX_AGE; age++) {
    survival *= Math.exp(-hazard(age));
    years += survival;
  }
  return years;
}

export function heatRiskReduction(weeklyMinutes: number): number {
  return Math.min((HEAT_REDUCTION_PER_100_MIN * weeklyMinutes) / 100, HEAT_MAX_REDUCTION);
}

/** Extra annual probability of dying in a cycling crash. */
export function annualCrashHazard(inputs: Inputs): number {
  return (kmPerYear(inputs) * inputs.cyclistFatalityPerBillionKm) / 1e9;
}

export function computeLifeExpectancy(inputs: Inputs): LifeExpectancyResults {
  const base = baselineHazard(inputs.sex);
  const reduction = heatRiskReduction(weeklyCyclingMinutes(inputs));
  const crash = annualCrashHazard(inputs);
  const lastCommuteAge = inputs.age + inputs.horizonYears - 1;
  const commuting = (age: number) => age >= inputs.age && age <= lastCommuteAge;
  const heatApplies = (age: number) => age >= HEAT_MIN_AGE && age <= HEAT_MAX_AGE;

  const activityOnly: Hazard = (age) => base(age) * (commuting(age) && heatApplies(age) ? 1 - reduction : 1);
  const withCrashes: Hazard = (age) => activityOnly(age) + (commuting(age) ? crash : 0);

  const baseline = remainingLifeExpectancy(base, inputs.age);
  const withActivity = remainingLifeExpectancy(activityOnly, inputs.age);
  const withCycling = remainingLifeExpectancy(withCrashes, inputs.age);

  return {
    baselineRemainingYears: baseline,
    activityGainYears: withActivity - baseline,
    crashLossYears: withActivity - withCycling,
    netGainYears: withCycling - baseline,
    riskReduction: reduction,
    outsideHeatAgeRange: inputs.age < HEAT_MIN_AGE || lastCommuteAge > HEAT_MAX_AGE,
  };
}
