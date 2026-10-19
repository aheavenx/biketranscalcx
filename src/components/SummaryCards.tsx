import { formatEuro, formatNumber, formatPayback, pluralYears } from '../format';
import type { CostResults } from '../model/types';

interface StatTileProps {
  label: string;
  value: string;
  detail: string;
}

function StatTile({ label, value, detail }: StatTileProps) {
  return (
    <div className="stat-tile">
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
      <p className="stat-detail">{detail}</p>
    </div>
  );
}

interface SummaryCardsProps {
  costs: CostResults;
  horizonYears: number;
}

export function SummaryCards({ costs, horizonYears }: SummaryCardsProps) {
  const period = pluralYears(horizonYears);
  const { savings } = costs.totals;
  const headline =
    savings >= 0
      ? `Cycling saves ${formatEuro(savings)} over ${period}`
      : `Public transport saves ${formatEuro(-savings)} over ${period}`;
  const ticketFact =
    costs.ticketStrategy === 'pass' ? 'A monthly pass is the cheaper way' : 'Single tickets are the cheaper way';
  const bikeFact =
    costs.bike.bikesBought === 1
      ? `1 bike bought at ${formatEuro(costs.bike.upfront)}.`
      : `${costs.bike.bikesBought} bikes bought at ${formatEuro(costs.bike.upfront)} each.`;

  return (
    <section className="summary" aria-labelledby="summary-heading">
      <h2 id="summary-heading" className="headline">
        {headline}
      </h2>
      <p className="subhead">True cost = money spent + time valued at your hourly rate.</p>
      <div className="stat-grid">
        <StatTile
          label="Bike true cost"
          value={formatEuro(costs.totals.bikeTrue)}
          detail={`${formatEuro(costs.perMonth.bikeTrue)} per month`}
        />
        <StatTile
          label="Public transport true cost"
          value={formatEuro(costs.totals.transitTrue)}
          detail={`${formatEuro(costs.perMonth.transitTrue)} per month`}
        />
        <StatTile
          label="Bike price paid back in"
          value={formatPayback(costs.paybackMonths)}
          detail={`From money savings alone, ${formatEuro(costs.bike.upfront)} upfront`}
        />
        <StatTile
          label="Hours commuting per year"
          value={`${formatNumber(costs.hoursPerYear.bike)} vs ${formatNumber(costs.hoursPerYear.transit)}`}
          detail="Bike including showering vs public transport"
        />
      </div>
      <ul className="facts">
        <li>
          {ticketFact} to pay for {formatNumber(costs.tripsPerYear)} trips a year.
        </li>
        <li>
          {costs.breakEvenYear === null
            ? `Cycling does not become cheaper on true cost within ${period}.`
            : `Cycling is cheaper on true cost from year ${costs.breakEvenYear}.`}
        </li>
        <li>{bikeFact}</li>
      </ul>
    </section>
  );
}
