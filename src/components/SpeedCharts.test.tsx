import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { computeAll } from '../model/compute';
import { DEFAULT_INPUTS } from '../model/defaults';
import type { SpeedPoint } from '../model/types';
import { RESULTS_FIXTURE } from '../test/fixtures';
import { SpeedCharts, speedTicks } from './SpeedCharts';

const inputs = { ...DEFAULT_INPUTS, horizonYears: 2 };
const points = RESULTS_FIXTURE.speed;

describe('SpeedCharts', () => {
  it('summarises cost at the first, rider and last speeds', () => {
    render(<SpeedCharts points={points} inputs={inputs} />);
    expect(screen.getByText('Over 2 years by bike: €28,000 true cost (€2,500 money only) at 10 km/h, €20,955 (€2,747) at your 18 km/h, €16,000 (€6,000) at 40 km/h. Public transport: €23,725 true cost (€3,600 money only).')).toBeInTheDocument();
  });
  it('summarises weight loss', () => {
    render(<SpeedCharts points={points} inputs={inputs} />);
    expect(screen.getByText('About 4.2 kg a year at 10 km/h, 7.9 kg at your 18 km/h, 30.1 kg at 40 km/h.')).toBeInTheDocument();
  });
  it('does not repeat the rider speed when it is an endpoint', () => {
    render(<SpeedCharts points={points} inputs={{ ...inputs, bikeSpeedKmh: 40 }} />);
    expect(screen.getByText('About 4.2 kg a year at 10 km/h, 30.1 kg at your 40 km/h.')).toBeInTheDocument();
  });
  it('says 1 year for a one-year horizon', () => {
    render(<SpeedCharts points={points} inputs={{ ...inputs, horizonYears: 1 }} />);
    expect(screen.getByText(/^Over 1 year by bike:/)).toBeInTheDocument();
  });
  it('has a panel heading and two chart titles', () => {
    render(<SpeedCharts points={points} inputs={inputs} />);
    expect(screen.getByRole('heading', { level: 2, name: 'Riding speed' })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual(['Cost vs riding speed', 'Weight loss vs riding speed']);
  });
  it('notes the computed power only when own power is entered', () => {
    const { rerender } = render(<SpeedCharts points={points} inputs={inputs} />);
    expect(screen.queryByText(/not the average power you entered/)).not.toBeInTheDocument();
    rerender(<SpeedCharts points={points} inputs={{ ...inputs, avgPowerW: 150 }} />);
    expect(screen.getByText(/not the average power you entered/)).toBeInTheDocument();
  });
  it('summarises a fractional rider speed from the real model', () => {
    const real = { ...DEFAULT_INPUTS, bikeSpeedKmh: 17.5 };
    render(<SpeedCharts points={computeAll(real).speed} inputs={real} />);
    expect(screen.getAllByText(/at your 17\.5 km\/h/)).toHaveLength(2);
  });
});

describe('speedTicks', () => {
  const sweep = (from: number, to: number) => [{ speedKmh: from }, { speedKmh: 17.5 }, { speedKmh: to }] as SpeedPoint[];
  it('uses multiples of 5 for the default 10-40 sweep', () => {
    expect(speedTicks(sweep(10, 40))).toEqual([10, 15, 20, 25, 30, 35, 40]);
  });
  it('adds the lower endpoint when the sweep starts below 10', () => {
    expect(speedTicks(sweep(5, 40))).toEqual([5, 10, 15, 20, 25, 30, 35, 40]);
  });
  it('adds the upper endpoint when the sweep ends above 40', () => {
    expect(speedTicks(sweep(10, 45))).toEqual([10, 15, 20, 25, 30, 35, 40, 45]);
  });
  it('keeps off-multiple endpoints', () => {
    expect(speedTicks(sweep(12.5, 37))).toEqual([12.5, 15, 20, 25, 30, 35, 37]);
  });
});
