import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatEuro, formatEuroCompact, formatNumber, formatSpeed, pluralYears } from '../format';
import type { Inputs, SpeedPoint } from '../model/types';
import { AXIS_PROPS, COST_LINES, renderLegendLabel, TOOLTIP_PROPS } from './chartTheme';

const CHART_MARGIN = { top: 8, right: 16, bottom: 0, left: 0 };

/** The first, rider and last points, in that order, without repeats. */
function summaryPoints(points: SpeedPoint[], riderKmh: number): SpeedPoint[] {
  const rider = points.find((point) => point.speedKmh === riderKmh);
  const picked = [points[0], rider, points[points.length - 1]].filter((point): point is SpeedPoint => point !== undefined);
  return picked.filter((point, index) => picked.indexOf(point) === index);
}

/** X-axis ticks for the sweep: every multiple of 5 inside it, plus both endpoints. */
export function speedTicks(points: SpeedPoint[]): number[] {
  const low = points[0].speedKmh;
  const high = points[points.length - 1].speedKmh;
  const ticks = [low, high];
  for (let tick = Math.ceil(low / 5) * 5; tick <= high; tick += 5) ticks.push(tick);
  return [...new Set(ticks)].sort((a, b) => a - b);
}

/** Dashed marker at the rider's speed; its label sits right of the line in the lower half of the sweep so it clears the y-axis ticks. */
function YouLine({ speed, points }: { speed: number; points: SpeedPoint[] }) {
  const low = points[0].speedKmh;
  const high = points[points.length - 1].speedKmh;
  const position = speed < (low + high) / 2 ? 'insideTopLeft' : 'insideTopRight';
  return (
    <ReferenceLine
      x={speed}
      stroke="var(--text-secondary)"
      strokeDasharray="3 3"
      label={{ value: 'You', position, fill: 'var(--text-secondary)', fontSize: 12 }}
    />
  );
}

export function SpeedCharts({ points, inputs }: { points: SpeedPoint[]; inputs: Inputs }) {
  const shown = summaryPoints(points, inputs.bikeSpeedKmh);
  const label = (point: SpeedPoint) => (point.speedKmh === inputs.bikeSpeedKmh ? `at your ${formatSpeed(point.speedKmh)}` : `at ${formatSpeed(point.speedKmh)}`);
  const transit = points[0];
  const ticks = speedTicks(points);
  return (
    <section className="panel" aria-labelledby="speed-heading">
      <h2 id="speed-heading">Riding speed</h2>
      <p className="subhead">
        How your results change if you ride faster or slower. Faster rides take less time but burn more calories.
      </p>
      {inputs.avgPowerW !== null && (
        <p className="note">These curves use the computed power at each speed, not the average power you entered.</p>
      )}
      <div className="card-grid">
        <div className="card">
          <h3>Cost vs riding speed</h3>
          <div className="chart" role="img" aria-label="Line chart of cost by riding speed. Summary below.">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={points} margin={CHART_MARGIN}>
                <CartesianGrid stroke="var(--grid)" vertical={false} />
                <XAxis dataKey="speedKmh" type="number" domain={['dataMin', 'dataMax']} ticks={ticks} tickFormatter={(speed: number) => formatSpeed(speed)} {...AXIS_PROPS} />
                <YAxis tickFormatter={(value: number) => formatEuroCompact(value)} width={64} {...AXIS_PROPS} />
                <Tooltip formatter={(value) => formatEuro(Number(value))} labelFormatter={(speed) => formatSpeed(Number(speed))} {...TOOLTIP_PROPS} />
                <Legend formatter={renderLegendLabel} />
                <YouLine speed={inputs.bikeSpeedKmh} points={points} />
                {COST_LINES.map((line) => (
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
            Over {pluralYears(inputs.horizonYears)} by bike:{' '}
            {shown
              .map((point, index) =>
                index === 0
                  ? `${formatEuro(point.bikeTrue)} true cost (${formatEuro(point.bikeMoney)} money only) ${label(point)}`
                  : `${formatEuro(point.bikeTrue)} (${formatEuro(point.bikeMoney)}) ${label(point)}`,
              )
              .join(', ')}
            . Public transport: {formatEuro(transit.transitTrue)} true cost ({formatEuro(transit.transitMoney)} money only).
          </p>
        </div>
        <div className="card">
          <h3>Weight loss vs riding speed</h3>
          <p className="note">Body fat burned a year if you don't eat the extra calories back. The cost chart assumes you do.</p>
          <div className="chart" role="img" aria-label="Line chart of body fat burned a year by riding speed. Summary below.">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={points} margin={CHART_MARGIN}>
                <CartesianGrid stroke="var(--grid)" vertical={false} />
                <XAxis dataKey="speedKmh" type="number" domain={['dataMin', 'dataMax']} ticks={ticks} tickFormatter={(speed: number) => formatSpeed(speed)} {...AXIS_PROPS} />
                <YAxis tickFormatter={(value: number) => `${formatNumber(value, 1)} kg`} width={64} {...AXIS_PROPS} />
                <Tooltip formatter={(value) => `${formatNumber(Number(value), 1)} kg`} labelFormatter={(speed) => formatSpeed(Number(speed))} {...TOOLTIP_PROPS} />
                <YouLine speed={inputs.bikeSpeedKmh} points={points} />
                <Line type="monotone" dataKey="fatKgPerYear" name="Body fat burned" stroke="var(--series-bike)" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="chart-summary">
            About{' '}
            {shown
              .map((point, index) => `${formatNumber(point.fatKgPerYear, 1)} kg${index === 0 ? ' a year' : ''} ${label(point)}`)
              .join(', ')}
            .
          </p>
        </div>
      </div>
    </section>
  );
}
