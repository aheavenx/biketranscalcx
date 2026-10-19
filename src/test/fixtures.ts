import type { CostResults, Results, YearRow } from '../model/types';

const rows: YearRow[] = [
  {
    year: 1,
    transit: { tickets: 720, time: 4025 },
    bike: { capital: 120, care: 120, food: 650, time: 3640 },
    cumulative: { transitTrue: 4745, bikeTrue: 4530, transitMoney: 720, bikeMoney: 890 },
  },
  {
    year: 2,
    transit: { tickets: 720, time: 4025 },
    bike: { capital: 102, care: 120, food: 650, time: 3640 },
    cumulative: { transitTrue: 9490, bikeTrue: 9042, transitMoney: 1440, bikeMoney: 1762 },
  },
];

const costs: CostResults = {
  tripsPerYear: 460,
  kmPerYear: 3680,
  ticketStrategy: 'pass',
  netKcalPerTrip: 150,
  computedPowerW: 84.3,
  rows,
  totals: { transitTrue: 9490, bikeTrue: 9042, transitMoney: 1440, bikeMoney: 1762, savings: 448 },
  perMonth: { transitTrue: 395.42, bikeTrue: 376.75 },
  hoursPerYear: { transit: 268.3, bike: 242.8 },
  bike: { upfront: 800, bikesBought: 1 },
  paybackMonths: null,
  breakEvenYear: 1,
};

export const RESULTS_FIXTURE: Results = {
  costs,
  lifeExpectancy: {
    baselineRemainingYears: 47.65,
    activityGainYears: 0.0677,
    crashLossYears: 0.0125,
    netGainYears: 0.0552,
    riskReduction: 0.2359,
    outsideHeatAgeRange: false,
  },
  wellbeing: { weeklyActiveMinutes: 236, whoGuidelinePct: 157.3, netKcalPerYear: 70700, fatEquivalentKg: 9.18 },
};
