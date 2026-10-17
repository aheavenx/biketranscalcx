import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatEuro, formatEuroCompact, pluralYears } from '../format';
import type { CumulativeTotals, YearRow } from '../model/types';
import { AXIS_PROPS, renderLegendLabel, TOOLTIP_PROPS } from './chartTheme';

export function cumulativeSeries(rows: YearRow[]): (CumulativeTotals & { year: number })[] {
  return [
    { year: 0, transitTrue: 0, bikeTrue: 0, transitMoney: 0, bikeMoney: 0 },
    ...rows.map((row) => ({ year: row.year, ...row.cumulative })),
  ];
}

const LINES = [
  { key: 'bikeTrue', name: 'Bike, true cost', color: 'var(--series-bike)', dashed: false },
  { key: 'transitTrue', name: 'Public transport, true cost', color: 'var(--series-transit)', dashed: false },
  { key: 'bikeMoney', name: 'Bike, money only', color: 'var(--series-bike)', dashed: true },
  { key: 'transitMoney', name: 'Public transport, money only', color: 'var(--series-transit)', dashed: true },
] as const;

export function CumulativeChart({ rows }: { rows: YearRow[] }) {
  const last = rows[rows.length - 1];
  return (
    <section className="panel" aria-labelledby="cumulative-heading">
      <h2 id="cumulative-heading">Cumulative cost</h2>
      <p className="subhead">Solid lines include time; dashed lines are money only.</p>
      <div className="chart" role="img" aria-label="Line chart of cumulative cost by year. Summary below.">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={cumulativeSeries(rows)} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="var(--grid)" vertical={false} />
            <XAxis dataKey="year" tickFormatter={(year: number) => `Y${year}`} {...AXIS_PROPS} />
            <YAxis tickFormatter={(value: number) => formatEuroCompact(value)} width={64} {...AXIS_PROPS} />
            <Tooltip
              formatter={(value) => formatEuro(Number(value))}
              labelFormatter={(year) => `Year ${year}`}
              {...TOOLTIP_PROPS}
            />
            <Legend formatter={renderLegendLabel} />
            {LINES.map((line) => (
              <Line
                key={line.key}
                type="monotone"
                dataKey={line.key}
                name={line.name}
                stroke={line.color}
                strokeWidth={2}
                strokeDasharray={line.dashed ? '6 4' : undefined}
                dot={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="chart-summary">
        After {pluralYears(last.year)}: true cost {formatEuro(last.cumulative.bikeTrue)} by bike vs{' '}
        {formatEuro(last.cumulative.transitTrue)} by public transport; money only{' '}
        {formatEuro(last.cumulative.bikeMoney)} vs {formatEuro(last.cumulative.transitMoney)}.
      </p>
    </section>
  );
}
