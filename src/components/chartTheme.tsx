export const AXIS_PROPS = {
  stroke: 'var(--axis)',
  tick: { fill: 'var(--text-secondary)', fontSize: 12 },
  tickLine: false,
} as const;

export const TOOLTIP_PROPS = {
  contentStyle: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    color: 'var(--text)',
  },
  itemStyle: { color: 'var(--text)' },
  labelStyle: { color: 'var(--text-secondary)' },
} as const;

/** Legend labels use the secondary text colour; the swatch beside them carries the series colour. */
export function renderLegendLabel(value: string) {
  return <span className="legend-label">{value}</span>;
}

/** The four cost series shared by the cumulative and speed charts. Each has its own colour; money-only lines are also dashed. */
export const COST_LINES = [
  { key: 'bikeTrue', name: 'Bike, true cost', color: 'var(--series-1)', dashed: false },
  { key: 'transitTrue', name: 'Public transport, true cost', color: 'var(--series-2)', dashed: false },
  { key: 'bikeMoney', name: 'Bike, money only', color: 'var(--series-3)', dashed: true },
  { key: 'transitMoney', name: 'Public transport, money only', color: 'var(--series-4)', dashed: true },
] as const;
