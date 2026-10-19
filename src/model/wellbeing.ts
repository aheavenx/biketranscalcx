import { netKcalPerTrip } from './calories';
import { tripsPerYear, weeklyCyclingMinutes } from './commute';
import type { Inputs, WellbeingResults } from './types';

/** WHO (2020): adults should do 150–300 minutes of moderate activity a week. */
export const WHO_MIN_WEEKLY_MINUTES = 150;
export const WHO_MAX_WEEKLY_MINUTES = 300;
export const KCAL_PER_KG_FAT = 7700;

export function computeWellbeing(inputs: Inputs): WellbeingResults {
  const minutes = weeklyCyclingMinutes(inputs);
  const kcal = tripsPerYear(inputs) * netKcalPerTrip(inputs);
  return {
    weeklyActiveMinutes: minutes,
    whoGuidelinePct: (minutes / WHO_MIN_WEEKLY_MINUTES) * 100,
    netKcalPerYear: kcal,
    fatEquivalentKg: kcal / KCAL_PER_KG_FAT,
  };
}
