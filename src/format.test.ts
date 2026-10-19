import { describe, expect, it } from 'vitest';
import { formatEuro, formatEuroCompact, formatLifeDelta, formatNumber, formatPayback, pluralYears } from './format';

describe('formatEuro', () => {
  it('formats whole euros with grouping', () => {
    expect(formatEuro(1208.43)).toBe('€1,208');
    expect(formatEuro(1234567)).toBe('€1,234,567');
  });

  it('never prints negative zero', () => {
    expect(formatEuro(-0.4)).toBe('€0');
  });
});

describe('formatEuroCompact', () => {
  it('abbreviates thousands', () => {
    expect(formatEuroCompact(23725)).toBe('€23.7K');
  });
});

describe('formatNumber', () => {
  it('rounds to the requested digits', () => {
    expect(formatNumber(70700)).toBe('70,700');
    expect(formatNumber(35.09, 1)).toBe('35.1');
  });
});

describe('formatLifeDelta', () => {
  it('uses days below two months', () => {
    expect(formatLifeDelta(0.0552)).toBe('+20 days');
    expect(formatLifeDelta(-0.0041)).toBe('−1 day');
    expect(formatLifeDelta(-0.0125)).toBe('−5 days');
  });

  it('uses months below two years and years above', () => {
    expect(formatLifeDelta(0.7273)).toBe('+8.7 months');
    expect(formatLifeDelta(2.5)).toBe('+2.5 years');
  });

  it('prints zero without a sign', () => {
    expect(formatLifeDelta(0)).toBe('0 days');
  });
});

describe('formatPayback', () => {
  it('handles never, immediate, sub-month and whole months', () => {
    expect(formatPayback(null)).toBe('Never (money only)');
    expect(formatPayback(0)).toBe('Immediately');
    expect(formatPayback(0.5)).toBe('Under 1 month');
    expect(formatPayback(1)).toBe('1 month');
    expect(formatPayback(15.8)).toBe('16 months');
  });
});

describe('pluralYears', () => {
  it('pluralises', () => {
    expect(pluralYears(1)).toBe('1 year');
    expect(pluralYears(5)).toBe('5 years');
  });
});
