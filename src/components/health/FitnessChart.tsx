import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatNumber, pluralYears } from '../../format';
import type { FitnessResults } from '../../model/types';
import { AXIS_PROPS, renderLegendLabel, TOOLTIP_PROPS } from '../chartTheme';

export function FitnessChart({ fitness }: { fitness: FitnessResults }) {
  const last = fitness.points[fitness.points.length - 1];
  return (
    <div className="health-card">
      <h3>Aerobic fitness (VO₂max)</h3>
      <p>
        Estimated today: <strong>{formatNumber(fitness.baselineVo2max, 1)} ml/kg/min</strong>, a fitness age of{' '}
        {formatNumber(fitness.currentFitnessAge)}.
      </p>
      <div className="chart" role="img" aria-label="Line chart of estimated VO2max by year. Summary below.">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={fitness.points} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="var(--grid)" vertical={false} />
            <XAxis dataKey="year" tickFormatter={(year: number) => `Y${year}`} {...AXIS_PROPS} />
            <YAxis domain={['auto', 'auto']} tickFormatter={(value: number) => formatNumber(value)} width={40} {...AXIS_PROPS} />
            <Tooltip
              formatter={(value) => `${formatNumber(Number(value), 1)} ml/kg/min`}
              labelFormatter={(year) => `Year ${year}`}
              {...TOOLTIP_PROPS}
            />
            <Legend formatter={renderLegendLabel} />
            <Line type="monotone" dataKey="bike" name="Bike commuting" stroke="var(--series-bike)" strokeWidth={2} dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="transit" name="Public transport" stroke="var(--series-transit)" strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="chart-summary">
        After {pluralYears(last.year)}: {formatNumber(last.bike, 1)} ml/kg/min by bike (fitness age{' '}
        {formatNumber(fitness.fitnessAgeAtEnd.bike)}) vs {formatNumber(last.transit, 1)} by public transport (fitness
        age {formatNumber(fitness.fitnessAgeAtEnd.transit)}).
      </p>
    </div>
  );
}
