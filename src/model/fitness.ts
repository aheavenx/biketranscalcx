import { weeklyCyclingMinutes } from './commute';
import type { FitnessLevel, FitnessPoint, FitnessResults, Inputs, Sex } from './types';

/** Jackson et al. (1990) physical-activity rating (0–7) assumed for each fitness level. */
export const PAR_BY_FITNESS: Record<FitnessLevel, number> = {
  sedentary: 1,
  light: 2,
  moderate: 3,
  active: 5,
  athlete: 7,
};

/** Relative VO2max gain after a year of ≥150 min/week; anchored to Hendriksen et al. (2000): +6% in men. */
export const YEAR1_GAIN: Record<FitnessLevel, number> = {
  sedentary: 0.1,
  light: 0.07,
  moderate: 0.05,
  active: 0.02,
  athlete: 0,
};

export const FULL_DOSE_WEEKLY_MINUTES = 150;
export const INACTIVE_ANNUAL_DECLINE = 0.01;
export const ACTIVE_ANNUAL_DECLINE = 0.005;
const AVERAGE_BMI = 24;
const AVERAGE_PAR = 3;
const AGE_COEFFICIENT = 0.381;
const FITNESS_AGE_MIN = 18;
const FITNESS_AGE_MAX = 90;

export function sexCode(sex: Sex): number {
  if (sex === 'male') return 1;
  if (sex === 'female') return 0;
  return 0.5;
}

export function bmi(weightKg: number, heightCm: number): number {
  return weightKg / (heightCm / 100) ** 2;
}

/** Jackson et al. (1990) non-exercise VO2max estimate in ml/kg/min (BMI model). */
export function jacksonVo2max(age: number, sex: Sex, bmiValue: number, par: number): number {
  return 56.363 + 1.921 * par - AGE_COEFFICIENT * age - 0.754 * bmiValue + 10.987 * sexCode(sex);
}

/** Age at which an average person of the same sex (BMI 24, activity rating 3) has this VO2max. */
export function fitnessAge(vo2max: number, sex: Sex): number {
  const age = (jacksonVo2max(0, sex, AVERAGE_BMI, AVERAGE_PAR) - vo2max) / AGE_COEFFICIENT;
  return Math.min(FITNESS_AGE_MAX, Math.max(FITNESS_AGE_MIN, age));
}

export function computeFitness(inputs: Inputs): FitnessResults {
  const baseline = jacksonVo2max(
    inputs.age,
    inputs.sex,
    bmi(inputs.weightKg, inputs.heightCm),
    PAR_BY_FITNESS[inputs.fitness],
  );
  const minutes = weeklyCyclingMinutes(inputs);
  const gain = YEAR1_GAIN[inputs.fitness] * Math.min(minutes / FULL_DOSE_WEEKLY_MINUTES, 1);

  const points: FitnessPoint[] = [{ year: 0, transit: baseline, bike: baseline }];
  for (let year = 1; year <= inputs.horizonYears; year++) {
    const transit = baseline * (1 - INACTIVE_ANNUAL_DECLINE) ** year;
    const bike = minutes > 0 ? baseline * (1 + gain) * (1 - ACTIVE_ANNUAL_DECLINE) ** (year - 1) : transit;
    points.push({ year, transit, bike });
  }

  const last = points[points.length - 1];
  return {
    baselineVo2max: baseline,
    points,
    currentFitnessAge: fitnessAge(baseline, inputs.sex),
    fitnessAgeAtEnd: { transit: fitnessAge(last.transit, inputs.sex), bike: fitnessAge(last.bike, inputs.sex) },
  };
}
