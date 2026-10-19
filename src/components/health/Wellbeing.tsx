import { formatNumber } from '../../format';
import { WHO_MAX_WEEKLY_MINUTES } from '../../model/wellbeing';
import type { WellbeingResults } from '../../model/types';

export const EVIDENCE = [
  {
    finding: 'People who switched from driving to walking or cycling to work reported better psychological well-being.',
    citation: 'Martin, Goryakin & Suhrcke (2014), Preventive Medicine',
  },
  {
    finding: 'Cyclists reported better self-perceived health, less stress and less loneliness than users of other modes.',
    citation: 'Avila-Palencia et al. (2018), Environment International',
  },
  {
    finding: 'Cyclists were the most satisfied commuters, ahead of public transport users and drivers.',
    citation: 'St-Louis et al. (2014), Transportation Research Part F',
  },
];

export function Wellbeing({ wellbeing }: { wellbeing: WellbeingResults }) {
  const fill = Math.min(wellbeing.weeklyActiveMinutes / WHO_MAX_WEEKLY_MINUTES, 1) * 100;
  return (
    <div className="health-card">
      <h3>Well-being</h3>
      <p>
        <strong>{formatNumber(wellbeing.weeklyActiveMinutes)} minutes a week</strong> of cycling,{' '}
        {formatNumber(wellbeing.whoGuidelinePct)}% of the WHO minimum of 150 minutes of moderate activity.
      </p>
      <div className="guideline-bar" aria-hidden="true">
        <div className="guideline-fill" style={{ width: `${fill}%` }} />
        <div className="guideline-mark" />
      </div>
      <p className="hint">The marker is the WHO minimum (150 min); the full bar is the upper guideline (300 min).</p>
      <p>
        About {formatNumber(wellbeing.netKcalPerYear)} extra kcal a year, roughly{' '}
        {formatNumber(wellbeing.fatEquivalentKg, 1)} kg of body fat if not offset by food.
      </p>
      <ul className="evidence">
        {EVIDENCE.map((item) => (
          <li key={item.citation}>
            <p>{item.finding}</p>
            <p className="citation">{item.citation}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
