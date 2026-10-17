import { formatLifeDelta, formatNumber, pluralYears } from '../../format';
import type { LifeExpectancyResults } from '../../model/types';

interface LifeExpectancyProps {
  lifeExpectancy: LifeExpectancyResults;
  age: number;
  horizonYears: number;
}

export function LifeExpectancy({ lifeExpectancy: le, age, horizonYears }: LifeExpectancyProps) {
  return (
    <div className="health-card">
      <h3>Life expectancy</h3>
      <p className="big-figure">{formatLifeDelta(le.netGainYears)}</p>
      <p>
        Expected net change in lifespan from cycling for {pluralYears(horizonYears)}, starting at age {age}.
      </p>
      <dl className="metric-list">
        <div>
          <dt>Gain from physical activity</dt>
          <dd>{formatLifeDelta(le.activityGainYears)}</dd>
        </div>
        <div>
          <dt>Loss from crash risk</dt>
          <dd>{formatLifeDelta(-le.crashLossYears)}</dd>
        </div>
        <div>
          <dt>Lower risk of death while commuting</dt>
          <dd>{formatNumber(le.riskReduction * 100)}%</dd>
        </div>
        <div>
          <dt>Remaining life expectancy without cycling</dt>
          <dd>{formatNumber(le.baselineRemainingYears, 1)} years</dd>
        </div>
      </dl>
      {le.outsideHeatAgeRange && (
        <p className="note">
          Part of this period falls outside ages 20–64. WHO HEAT counts the activity benefit only for those ages, so
          the other years count crash risk but no benefit.
        </p>
      )}
    </div>
  );
}
