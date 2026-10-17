export type Sex = 'male' | 'female' | 'unspecified';
export type FitnessLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'athlete';

export interface Inputs {
  horizonYears: number;
  tripsPerWeek: number;
  weeksPerYear: number;
  distanceKm: number;
  transitMinutes: number;
  singleTicket: number;
  monthlyPass: number;
  bikePrice: number;
  depreciationPct: number;
  replaceEveryYears: number;
  bikeCarePerYear: number;
  bikeSpeedKmh: number;
  showerMinutesPerTrip: number;
  age: number;
  sex: Sex;
  heightCm: number;
  weightKg: number;
  fitness: FitnessLevel;
  valueOfTimePerHour: number;
  mealPrice: number;
  kcalPerMeal: number;
  cyclistFatalityPerBillionKm: number;
}

export type NumericInputKey = { [K in keyof Inputs]: Inputs[K] extends number ? K : never }[keyof Inputs];
export type SelectInputKey = 'sex' | 'fitness';
export type SetInput = <K extends keyof Inputs>(key: K, value: Inputs[K]) => void;

export type TicketStrategy = 'pass' | 'single';

/** Money figures exclude time; "true" figures include time valued at the hourly rate. */
export interface CumulativeTotals {
  transitTrue: number;
  bikeTrue: number;
  transitMoney: number;
  bikeMoney: number;
}

export interface YearRow {
  year: number;
  transit: { tickets: number; time: number };
  bike: { capital: number; care: number; food: number; time: number };
  cumulative: CumulativeTotals;
}

export interface CostResults {
  tripsPerYear: number;
  kmPerYear: number;
  ticketStrategy: TicketStrategy;
  netKcalPerTrip: number;
  rows: YearRow[];
  totals: CumulativeTotals & { savings: number };
  perMonth: { transitTrue: number; bikeTrue: number };
  hoursPerYear: { transit: number; bike: number };
  bike: { upfront: number; bikesBought: number; residualValue: number };
  /** Months until money savings repay the bike price; null if money savings are not positive. */
  paybackMonths: number | null;
  /** First year in which the cumulative bike true cost is at or below transit; null if never. */
  breakEvenYear: number | null;
}

export interface LifeExpectancyResults {
  baselineRemainingYears: number;
  activityGainYears: number;
  crashLossYears: number;
  netGainYears: number;
  /** HEAT relative mortality reduction while commuting, 0–0.45. */
  riskReduction: number;
  outsideHeatAgeRange: boolean;
}

export interface FitnessPoint {
  year: number;
  transit: number;
  bike: number;
}

export interface FitnessResults {
  baselineVo2max: number;
  /** Year 0 to horizonYears inclusive, VO2max in ml/kg/min. */
  points: FitnessPoint[];
  currentFitnessAge: number;
  fitnessAgeAtEnd: { transit: number; bike: number };
}

export interface WellbeingResults {
  weeklyActiveMinutes: number;
  whoGuidelinePct: number;
  netKcalPerYear: number;
  fatEquivalentKg: number;
}

export interface Results {
  costs: CostResults;
  lifeExpectancy: LifeExpectancyResults;
  fitness: FitnessResults;
  wellbeing: WellbeingResults;
}
