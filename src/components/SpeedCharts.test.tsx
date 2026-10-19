import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DEFAULT_INPUTS } from '../model/defaults';
import { RESULTS_FIXTURE } from '../test/fixtures';
import { SpeedCharts } from './SpeedCharts';

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
});
