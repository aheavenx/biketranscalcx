import { bikesBought, capitalCostForYear } from './bike';
import { computedPowerW, netKcalPerTrip } from './calories';
import { kmPerYear, rideMinutesPerTrip, tripsPerYear } from './commute';
import type { CostResults, CumulativeTotals, Diet, Inputs, TicketStrategy, YearRow } from './types';

/** Raw skinless chicken breast and dry white rice (USDA FoodData Central). */
export const CHICKEN_KCAL_PER_KG = 1200;
export const RICE_KCAL_PER_KG = 3600;
/** Halloumi, ≈320 kcal/100 g (UK CoFID 311; retail labels 312–333). */
export const HALLOUMI_KCAL_PER_KG = 3200;
/** Firm tofu prepared with calcium sulfate, 144 kcal/100 g (USDA FoodData Central SR Legacy 172475). */
export const TOFU_KCAL_PER_KG = 1440;
/** Share of the extra calories eaten as protein food; the rest is eaten as rice (carbs). */
export const PROTEIN_KCAL_SHARE = 0.5;

const PROTEIN_KCAL_PER_KG: Record<Diet, number> = {
  meat: CHICKEN_KCAL_PER_KG,
  vegetarian: HALLOUMI_KCAL_PER_KG,
  vegan: TOFU_KCAL_PER_KG,
};

/** Cost of eating back one kcal burned, bought as the diet's protein food (chicken breast, halloumi or tofu) and rice. */
export function foodCostPerKcal(inputs: Inputs): number {
  const proteinPricePerKg = {
    meat: inputs.chickenPricePerKg,
    vegetarian: inputs.halloumiPricePerKg,
    vegan: inputs.tofuPricePerKg,
  }[inputs.diet];
  return (
    (PROTEIN_KCAL_SHARE * proteinPricePerKg) / PROTEIN_KCAL_PER_KG[inputs.diet] +
    ((1 - PROTEIN_KCAL_SHARE) * inputs.ricePricePerKg) / RICE_KCAL_PER_KG
  );
}

/** Cheaper of 12 monthly passes or a single ticket per trip; ties go to the pass. */
export function annualTickets(inputs: Inputs): { cost: number; strategy: TicketStrategy } {
  const pass = 12 * inputs.monthlyPass;
  const singles = tripsPerYear(inputs) * inputs.singleTicket;
  return singles < pass ? { cost: singles, strategy: 'single' } : { cost: pass, strategy: 'pass' };
}

export function computeCosts(inputs: Inputs): CostResults {
  const trips = tripsPerYear(inputs);
  const tickets = annualTickets(inputs);
  const transitHours = (trips * inputs.transitMinutes) / 60;
  const bikeHours = (trips * (rideMinutesPerTrip(inputs) + inputs.showerMinutesPerTrip)) / 60;
  const kcalPerTrip = netKcalPerTrip(inputs);
  const food = trips * kcalPerTrip * foodCostPerKcal(inputs);
  const care = inputs.bikeCarePerYear;
  const transitTime = transitHours * inputs.valueOfTimePerHour;
  const bikeTime = bikeHours * inputs.valueOfTimePerHour;

  const rows: YearRow[] = [];
  const running: CumulativeTotals = { transitTrue: 0, bikeTrue: 0, transitMoney: 0, bikeMoney: 0 };
  for (let year = 1; year <= inputs.horizonYears; year++) {
    const capital = capitalCostForYear(inputs, year);
    const bikeMoney = capital + care + food;
    running.transitMoney += tickets.cost;
    running.bikeMoney += bikeMoney;
    running.transitTrue += tickets.cost + transitTime;
    running.bikeTrue += bikeMoney + bikeTime;
    rows.push({
      year,
      transit: { tickets: tickets.cost, time: transitTime },
      bike: { capital, care, food, time: bikeTime },
      cumulative: { ...running },
    });
  }

  const months = inputs.horizonYears * 12;
  const monthlyMoneySaving = (tickets.cost - care - food) / 12;
  let paybackMonths: number | null = null;
  if (inputs.bikePrice === 0) paybackMonths = 0;
  else if (monthlyMoneySaving > 0) paybackMonths = inputs.bikePrice / monthlyMoneySaving;

  return {
    tripsPerYear: trips,
    kmPerYear: kmPerYear(inputs),
    ticketStrategy: tickets.strategy,
    netKcalPerTrip: kcalPerTrip,
    computedPowerW: computedPowerW(inputs),
    rows,
    totals: { ...running, savings: running.transitTrue - running.bikeTrue },
    perMonth: { transitTrue: running.transitTrue / months, bikeTrue: running.bikeTrue / months },
    hoursPerYear: { transit: transitHours, bike: bikeHours },
    bike: { upfront: inputs.bikePrice, bikesBought: bikesBought(inputs) },
    paybackMonths,
    breakEvenYear: rows.find((row) => row.cumulative.bikeTrue <= row.cumulative.transitTrue)?.year ?? null,
  };
}
