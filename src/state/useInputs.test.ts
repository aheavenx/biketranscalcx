import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_INPUTS } from '../model/defaults';
import { buildShareUrl, loadInitialInputs, PERSIST_DEBOUNCE_MS, STORAGE_KEY, useInputs } from './useInputs';

describe('loadInitialInputs', () => {
  it('returns defaults with no URL params and empty storage', () => {
    expect(loadInitialInputs('', localStorage)).toEqual(DEFAULT_INPUTS);
  });

  it('uses stored inputs when the URL has none', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...DEFAULT_INPUTS, tripsPerWeek: 4 }));
    expect(loadInitialInputs('', localStorage)).toEqual({ ...DEFAULT_INPUTS, tripsPerWeek: 4 });
  });

  it('prefers URL params and does not mix in stored values', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...DEFAULT_INPUTS, tripsPerWeek: 4 }));
    expect(loadInitialInputs('?hy=9', localStorage)).toEqual({ ...DEFAULT_INPUTS, horizonYears: 9 });
  });

  it('ignores corrupt storage', () => {
    localStorage.setItem(STORAGE_KEY, '{not json');
    expect(loadInitialInputs('', localStorage)).toEqual(DEFAULT_INPUTS);
  });

  it('works without storage', () => {
    expect(loadInitialInputs('', null)).toEqual(DEFAULT_INPUTS);
  });
});

describe('buildShareUrl', () => {
  const location = { origin: 'https://example.com', pathname: '/' };

  it('omits the query string for defaults', () => {
    expect(buildShareUrl(location, DEFAULT_INPUTS)).toBe('https://example.com/');
  });

  it('includes changed fields', () => {
    expect(buildShareUrl(location, { ...DEFAULT_INPUTS, tripsPerWeek: 6 })).toBe('https://example.com/?tw=6');
  });
});

describe('useInputs', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('reads initial inputs from the URL', () => {
    window.history.replaceState(null, '', '/?hy=12');
    const { result } = renderHook(() => useInputs());
    expect(result.current.inputs.horizonYears).toBe(12);
  });

  it('updates immediately and persists to URL and storage after the debounce', () => {
    const { result } = renderHook(() => useInputs());
    act(() => result.current.setInput('tripsPerWeek', 6));
    expect(result.current.inputs.tripsPerWeek).toBe(6);
    expect(result.current.shareUrl).toMatch(/\?tw=6$/);
    expect(window.location.search).toBe('');

    act(() => {
      vi.advanceTimersByTime(PERSIST_DEBOUNCE_MS);
    });
    expect(window.location.search).toBe('?tw=6');
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')).toMatchObject({ tripsPerWeek: 6 });
  });

  it('resets to defaults', () => {
    const { result } = renderHook(() => useInputs());
    act(() => result.current.setInput('age', 50));
    act(() => result.current.reset());
    expect(result.current.inputs).toEqual(DEFAULT_INPUTS);
  });
});
