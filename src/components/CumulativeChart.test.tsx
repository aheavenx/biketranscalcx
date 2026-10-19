import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RESULTS_FIXTURE } from '../test/fixtures';
import { CumulativeChart, cumulativeSeries } from './CumulativeChart';
import { COST_LINES } from './chartTheme';

const rows = RESULTS_FIXTURE.costs.rows;

describe('COST_LINES', () => {
  it('gives every cost line its own colour', () => {
    expect(new Set(COST_LINES.map((line) => line.color)).size).toBe(COST_LINES.length);
  });
});

describe('cumulativeSeries', () => {
  it('starts at zero and adds one point per year', () => {
    const series = cumulativeSeries(rows);
    expect(series).toHaveLength(3);
    expect(series[0]).toEqual({ year: 0, transitTrue: 0, bikeTrue: 0, transitMoney: 0, bikeMoney: 0 });
    expect(series[2]).toEqual({ year: 2, ...rows[1].cumulative });
  });
});

describe('CumulativeChart', () => {
  it('summarises the final year in text', () => {
    render(<CumulativeChart rows={rows} />);
    expect(
      screen.getByText(
        'After 2 years: true cost €9,042 by bike vs €9,490 by public transport; money only €1,762 vs €1,440.',
      ),
    ).toBeInTheDocument();
  });
});
