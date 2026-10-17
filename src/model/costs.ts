import { bikesBought, capitalCostForYear, residualValueAtHorizon } from './bike';
import { netKcalPerTrip } from './calories';
import { kmPerYear, rideMinutesPerTrip, tripsPerYear } from './commute';
import type { CostResults, CumulativeTotals, Inputs, TicketStrategy, YearRow } from './types';

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
  const food = ((trips * kcalPerTrip) / inputs.kcalPerMeal) * inputs.mealPrice;
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
    rows,
    totals: { ...running, savings: running.transitTrue - running.bikeTrue },
    perMonth: { transitTrue: running.transitTrue / months, bikeTrue: running.bikeTrue / months },
    hoursPerYear: { transit: transitHours, bike: bikeHours },
    bike: {
      upfront: inputs.bikePrice,
      bikesBought: bikesBought(inputs),
      residualValue: residualValueAtHorizon(inputs),
    },
    paybackMonths,
    breakEvenYear: rows.find((row) => row.cumulative.bikeTrue <= row.cumulative.transitTrue)?.year ?? null,
  };
}
