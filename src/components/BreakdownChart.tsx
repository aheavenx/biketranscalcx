import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatEuro, formatEuroCompact, pluralYears } from '../format';
import type { YearRow } from '../model/types';
import { AXIS_PROPS, renderLegendLabel, TOOLTIP_PROPS } from './chartTheme';

export interface BreakdownTotals {
  bike: { capital: number; care: number; food: number; time: number; total: number };
  transit: { tickets: number; time: number; total: number };
}

export function breakdownTotals(rows: YearRow[]): BreakdownTotals {
  const sum = (pick: (row: YearRow) => number) => rows.reduce((total, row) => total + pick(row), 0);
  const bike = {
    capital: sum((row) => row.bike.capital),
    care: sum((row) => row.bike.care),
    food: sum((row) => row.bike.food),
    time: sum((row) => row.bike.time),
  };
  const transit = { tickets: sum((row) => row.transit.tickets), time: sum((row) => row.transit.time) };
  return {
    bike: { ...bike, total: bike.capital + bike.care + bike.food + bike.time },
    transit: { ...transit, total: transit.tickets + transit.time },
  };
}

/** Fixed slot order (validated palette adjacency): Time, Tickets, Depreciation, Care, Food. */
const CATEGORIES = [
  { key: 'time', label: 'Time', color: 'var(--series-1)' },
  { key: 'tickets', label: 'Tickets', color: 'var(--series-2)' },
  { key: 'capital', label: 'Bike depreciation', color: 'var(--series-3)' },
  { key: 'care', label: 'Bike care', color: 'var(--series-4)' },
  { key: 'food', label: 'Extra food', color: 'var(--series-5)' },
] as const;

export function BreakdownChart({ rows }: { rows: YearRow[] }) {
  const totals = breakdownTotals(rows);
  const data = [
    { mode: 'Bike', time: totals.bike.time, tickets: 0, capital: totals.bike.capital, care: totals.bike.care, food: totals.bike.food },
    { mode: 'Public transport', time: totals.transit.time, tickets: totals.transit.tickets, capital: 0, care: 0, food: 0 },
  ];
  const dash = '—';

  return (
    <section className="panel" aria-labelledby="breakdown-heading">
      <h2 id="breakdown-heading">Where the money and time go</h2>
      <p className="subhead">Totals over {pluralYears(rows.length)}.</p>
      <div className="chart" role="img" aria-label="Stacked bar chart of cost categories. Values in the table below.">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="var(--grid)" horizontal={false} />
            <XAxis type="number" tickFormatter={(value: number) => formatEuroCompact(value)} {...AXIS_PROPS} />
            <YAxis type="category" dataKey="mode" width={120} {...AXIS_PROPS} />
            <Tooltip formatter={(value) => formatEuro(Number(value))} cursor={{ fill: 'var(--hover)' }} {...TOOLTIP_PROPS} />
            <Legend formatter={renderLegendLabel} />
            {CATEGORIES.map((category) => (
              <Bar
                key={category.key}
                dataKey={category.key}
                name={category.label}
                stackId="cost"
                fill={category.color}
                stroke="var(--surface)"
                strokeWidth={2}
                maxBarSize={24}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <table className="breakdown-table">
        <thead>
          <tr>
            <th scope="col">Category</th>
            <th scope="col">Bike</th>
            <th scope="col">Public transport</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">Time</th>
            <td>{formatEuro(totals.bike.time)}</td>
            <td>{formatEuro(totals.transit.time)}</td>
          </tr>
          <tr>
            <th scope="row">Tickets</th>
            <td>{dash}</td>
            <td>{formatEuro(totals.transit.tickets)}</td>
          </tr>
          <tr>
            <th scope="row">Bike depreciation</th>
            <td>{formatEuro(totals.bike.capital)}</td>
            <td>{dash}</td>
          </tr>
          <tr>
            <th scope="row">Bike care</th>
            <td>{formatEuro(totals.bike.care)}</td>
            <td>{dash}</td>
          </tr>
          <tr>
            <th scope="row">Extra food</th>
            <td>{formatEuro(totals.bike.food)}</td>
            <td>{dash}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">Total</th>
            <td>{formatEuro(totals.bike.total)}</td>
            <td>{formatEuro(totals.transit.total)}</td>
          </tr>
        </tfoot>
      </table>
    </section>
  );
}
