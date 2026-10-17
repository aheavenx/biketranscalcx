export const AXIS_PROPS = {
  stroke: 'var(--axis)',
  tick: { fill: 'var(--text-muted)', fontSize: 12 },
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
