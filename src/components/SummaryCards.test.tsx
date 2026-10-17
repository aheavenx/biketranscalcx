import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RESULTS_FIXTURE } from '../test/fixtures';
import { SummaryCards } from './SummaryCards';

const costs = RESULTS_FIXTURE.costs;

describe('SummaryCards', () => {
  it('leads with cycling savings', () => {
    render(<SummaryCards costs={costs} horizonYears={2} />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Cycling saves €448 over 2 years');
  });

  it('flips the headline when public transport is cheaper', () => {
    render(<SummaryCards costs={{ ...costs, totals: { ...costs.totals, savings: -300 } }} horizonYears={1} />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Public transport saves €300 over 1 year');
  });

  it('shows totals, payback, hours and facts', () => {
    render(<SummaryCards costs={costs} horizonYears={2} />);
    expect(screen.getByText('€9,042')).toBeInTheDocument();
    expect(screen.getByText('€9,490')).toBeInTheDocument();
    expect(screen.getByText('Never (money only)')).toBeInTheDocument();
    expect(screen.getByText('243 vs 268')).toBeInTheDocument();
    expect(screen.getByText(/A monthly pass is the cheaper way to pay for 460 trips a year/)).toBeInTheDocument();
    expect(screen.getByText(/Cycling is cheaper on true cost from year 1/)).toBeInTheDocument();
    expect(screen.getByText('1 bike bought at €800.')).toBeInTheDocument();
  });

  it('counts replacement bikes', () => {
    render(<SummaryCards costs={{ ...costs, bike: { upfront: 800, bikesBought: 3 } }} horizonYears={5} />);
    expect(screen.getByText('3 bikes bought at €800 each.')).toBeInTheDocument();
  });

  it('explains when cycling never breaks even', () => {
    render(<SummaryCards costs={{ ...costs, breakEvenYear: null }} horizonYears={2} />);
    expect(screen.getByText(/does not become cheaper on true cost within 2 years/)).toBeInTheDocument();
  });
});
