import { describe, expect, it } from 'vitest';
import { annualTickets, computeCosts } from './costs';
import { DEFAULT_INPUTS } from './defaults';

describe('annualTickets', () => {
  it('picks the monthly pass when it is cheaper', () => {
    expect(annualTickets(DEFAULT_INPUTS)).toEqual({ cost: 720, strategy: 'pass' });
  });

  it('picks single tickets when they are cheaper', () => {
    expect(annualTickets({ ...DEFAULT_INPUTS, singleTicket: 1 })).toEqual({ cost: 460, strategy: 'single' });
  });

  it('prefers the pass on a tie', () => {
    // 10 trips × 24 weeks × €3 = €720 = 12 × €60
    expect(annualTickets({ ...DEFAULT_INPUTS, weeksPerYear: 24 })).toEqual({ cost: 720, strategy: 'pass' });
  });

  it('costs nothing with zero trips', () => {
    expect(annualTickets({ ...DEFAULT_INPUTS, tripsPerWeek: 0 }).cost).toBe(0);
  });
});

describe('computeCosts with defaults', () => {
  const costs = computeCosts(DEFAULT_INPUTS);

  it('produces one row per year with the yearly components', () => {
    expect(costs.rows).toHaveLength(5);
    const first = costs.rows[0];
    expect(first.transit.tickets).toBe(720);
    expect(first.transit.time).toBeCloseTo(4025, 6);
    expect(first.bike.capital).toBe(800);
    expect(first.bike.care).toBe(120);
    expect(first.bike.food).toBeCloseTo(269.3, 2);
    expect(first.bike.time).toBeCloseTo(3641.667, 3);
    expect(costs.rows[1].bike.capital).toBe(0);
  });

  it('accumulates running totals', () => {
    expect(costs.rows[1].cumulative.transitTrue).toBeCloseTo(9490, 6);
    expect(costs.rows[4].cumulative).toEqual({
      transitTrue: costs.totals.transitTrue,
      bikeTrue: costs.totals.bikeTrue,
      transitMoney: costs.totals.transitMoney,
      bikeMoney: costs.totals.bikeMoney,
    });
  });

  it('computes totals, savings and per-month figures', () => {
    expect(costs.totals.transitTrue).toBeCloseTo(23725, 6);
    expect(costs.totals.bikeTrue).toBeCloseTo(20954.83, 2);
    expect(costs.totals.transitMoney).toBeCloseTo(3600, 6);
    expect(costs.totals.bikeMoney).toBeCloseTo(2746.5, 2);
    expect(costs.totals.savings).toBeCloseTo(2770.17, 2);
    expect(costs.perMonth.transitTrue).toBeCloseTo(395.417, 3);
  });

  it('reports hours, trips, km and the ticket strategy', () => {
    expect(costs.tripsPerYear).toBe(460);
    expect(costs.kmPerYear).toBe(3680);
    expect(costs.ticketStrategy).toBe('pass');
    expect(costs.computedPowerW).toBeCloseTo(84.3, 2);
    expect(costs.hoursPerYear.transit).toBeCloseTo(268.333, 3);
    expect(costs.hoursPerYear.bike).toBeCloseTo(242.778, 3);
  });

  it('reports bike purchase facts', () => {
    expect(costs.bike).toEqual({ upfront: 800, bikesBought: 1 });
  });

  it('breaks even in year 2 and pays the bike back from money savings', () => {
    expect(costs.breakEvenYear).toBe(2);
    expect(costs.paybackMonths).toBeCloseTo(29.03, 2);
  });
});

describe('computeCosts food', () => {
  // Defaults burn 60,592 extra kcal a year; half is bought as chicken (1,200 kcal/kg), half as rice (3,600 kcal/kg).
  it('buys half the extra calories as chicken breast', () => {
    const costs = computeCosts({ ...DEFAULT_INPUTS, chickenPricePerKg: 12, ricePricePerKg: 0 });
    expect(costs.rows[0].bike.food).toBeCloseTo(302.96, 2);
  });

  it('buys the other half as rice', () => {
    const costs = computeCosts({ ...DEFAULT_INPUTS, chickenPricePerKg: 0, ricePricePerKg: 3.6 });
    expect(costs.rows[0].bike.food).toBeCloseTo(30.3, 2);
  });
});

describe('computeCosts edge cases', () => {
  it('computes payback when money savings are positive', () => {
    const costs = computeCosts({ ...DEFAULT_INPUTS, monthlyPass: 200 });
    expect(costs.ticketStrategy).toBe('single');
    expect(costs.paybackMonths).toBeCloseTo(9.69, 2);
  });

  it('pays back immediately for a free bike', () => {
    expect(computeCosts({ ...DEFAULT_INPUTS, bikePrice: 0 }).paybackMonths).toBe(0);
  });

  it('never breaks even when time is free and the bike costs more money', () => {
    const costs = computeCosts({ ...DEFAULT_INPUTS, valueOfTimePerHour: 0, monthlyPass: 30 });
    expect(costs.breakEvenYear).toBeNull();
    expect(costs.paybackMonths).toBeNull();
    expect(costs.totals.savings).toBeCloseTo(-946.5, 2);
  });

  it('handles zero trips without NaN', () => {
    const costs = computeCosts({ ...DEFAULT_INPUTS, tripsPerWeek: 0 });
    expect(costs.rows[0].bike.food).toBe(0);
    expect(costs.rows[0].transit.time).toBe(0);
    expect(Number.isNaN(costs.totals.bikeTrue)).toBe(false);
  });
});
