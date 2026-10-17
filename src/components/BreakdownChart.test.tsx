import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RESULTS_FIXTURE } from '../test/fixtures';
import { BreakdownChart, breakdownTotals } from './BreakdownChart';

const rows = RESULTS_FIXTURE.costs.rows;

describe('breakdownTotals', () => {
  it('sums each category over the horizon', () => {
    expect(breakdownTotals(rows)).toEqual({
      bike: { capital: 222, care: 240, food: 1300, time: 7280, total: 9042 },
      transit: { tickets: 1440, time: 8050, total: 9490 },
    });
  });
});

describe('BreakdownChart', () => {
  it('renders a table with the totals', () => {
    render(<BreakdownChart rows={rows} />);
    const totalRow = screen.getByRole('row', { name: /total/i });
    expect(within(totalRow).getByText('€9,042')).toBeInTheDocument();
    expect(within(totalRow).getByText('€9,490')).toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: 'Extra food' })).toBeInTheDocument();
  });

  it('labels the bike cost as a purchase, not depreciation', () => {
    render(<BreakdownChart rows={rows} />);
    expect(screen.getByRole('rowheader', { name: 'Bike purchase' })).toBeInTheDocument();
    expect(screen.queryByText(/depreciation/i)).not.toBeInTheDocument();
  });
});
