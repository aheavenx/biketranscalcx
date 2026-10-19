const LOCALE = 'en-IE';
const MINUS = '−';

const euro = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const euroCompact = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: 'EUR',
  notation: 'compact',
  maximumFractionDigits: 1,
});

/** Whole euros, e.g. "€1,208". Rounds first so tiny negatives never print as "-€0". */
export function formatEuro(value: number): string {
  return euro.format(Math.round(value) || 0);
}

export function formatEuroCompact(value: number): string {
  return euroCompact.format(value);
}

export function formatNumber(value: number, fractionDigits = 0): string {
  return new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

/** Signed lifespan change: days below two months, months below two years, years above. */
export function formatLifeDelta(years: number): string {
  const magnitude = Math.abs(years);
  const days = Math.round(magnitude * 365);
  if (days === 0) return '0 days';
  const sign = years < 0 ? MINUS : '+';
  if (magnitude < 1 / 6) return `${sign}${days} ${days === 1 ? 'day' : 'days'}`;
  if (magnitude < 2) return `${sign}${(magnitude * 12).toFixed(1)} months`;
  return `${sign}${magnitude.toFixed(1)} years`;
}

export function formatPayback(months: number | null): string {
  if (months === null) return 'Never (money only)';
  if (months === 0) return 'Immediately';
  if (months < 1) return 'Under 1 month';
  const whole = Math.ceil(months);
  return `${whole} ${whole === 1 ? 'month' : 'months'}`;
}

export function pluralYears(years: number): string {
  return `${years} ${years === 1 ? 'year' : 'years'}`;
}

/** Riding speed with a decimal only when needed, e.g. "18 km/h" or "17.5 km/h". */
export function formatSpeed(kmh: number): string {
  return `${Number.isInteger(kmh) ? kmh : formatNumber(kmh, 1)} km/h`;
}
