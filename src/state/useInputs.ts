import { useCallback, useEffect, useMemo, useState } from 'react';
import { DEFAULT_INPUTS } from '../model/defaults';
import type { Inputs, SetInput } from '../model/types';
import { hasInputParams, inputsFromSearch, inputsToSearch, sanitizeInputs } from './urlState';

export const STORAGE_KEY = 'bikecalcx:inputs:v1';
export const PERSIST_DEBOUNCE_MS = 300;

function safeStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** URL params win (and are not mixed with stored values, so shared links reproduce exactly). */
export function loadInitialInputs(search: string, storage: Storage | null): Inputs {
  if (hasInputParams(search)) return inputsFromSearch(search);
  try {
    const stored = storage?.getItem(STORAGE_KEY);
    if (stored) return sanitizeInputs(JSON.parse(stored));
  } catch {
    // Corrupt or blocked storage: fall back to defaults.
  }
  return { ...DEFAULT_INPUTS };
}

export function buildShareUrl(location: { origin: string; pathname: string }, inputs: Inputs): string {
  const search = inputsToSearch(inputs);
  return `${location.origin}${location.pathname}${search ? `?${search}` : ''}`;
}

export function useInputs() {
  const [inputs, setInputs] = useState<Inputs>(() => loadInitialInputs(window.location.search, safeStorage()));

  const setInput: SetInput = useCallback((key, value) => {
    setInputs((previous) => ({ ...previous, [key]: value }));
  }, []);

  const reset = useCallback(() => setInputs({ ...DEFAULT_INPUTS }), []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const search = inputsToSearch(inputs);
      const { pathname, hash } = window.location;
      window.history.replaceState(null, '', `${pathname}${search ? `?${search}` : ''}${hash}`);
      try {
        safeStorage()?.setItem(STORAGE_KEY, JSON.stringify(inputs));
      } catch {
        // Storage full or blocked: the URL still holds the state.
      }
    }, PERSIST_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [inputs]);

  const shareUrl = useMemo(() => buildShareUrl(window.location, inputs), [inputs]);

  return { inputs, setInput, reset, shareUrl };
}
