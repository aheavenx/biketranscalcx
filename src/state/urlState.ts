import { DEFAULT_INPUTS, FIELD_SPECS, isValidNumber, isValidSelect } from '../model/defaults';
import type { FieldSpec } from '../model/defaults';
import type { Inputs } from '../model/types';

/** Parses one untrusted value (URL string or stored JSON value); undefined when invalid. */
function parseFieldValue(spec: FieldSpec, raw: unknown): Inputs[keyof Inputs] | undefined {
  if (spec.kind === 'number') {
    let value = Number.NaN;
    if (typeof raw === 'number') value = raw;
    else if (typeof raw === 'string' && raw.trim() !== '') value = Number(raw);
    return isValidNumber(spec, value) ? value : undefined;
  }
  return typeof raw === 'string' && isValidSelect(spec, raw) ? (raw as Inputs[typeof spec.key]) : undefined;
}

function buildInputs(read: (spec: FieldSpec) => unknown): Inputs {
  const result: Record<string, unknown> = { ...DEFAULT_INPUTS };
  for (const spec of FIELD_SPECS) {
    const value = parseFieldValue(spec, read(spec));
    if (value !== undefined) result[spec.key] = value;
  }
  return result as unknown as Inputs;
}

/** Query string (without "?") holding only the inputs that differ from the defaults. */
export function inputsToSearch(inputs: Inputs): string {
  const params = new URLSearchParams();
  for (const spec of FIELD_SPECS) {
    const value = inputs[spec.key];
    if (value !== DEFAULT_INPUTS[spec.key]) params.set(spec.urlKey, String(value));
  }
  return params.toString();
}

export function hasInputParams(search: string): boolean {
  const params = new URLSearchParams(search);
  return FIELD_SPECS.some((spec) => params.has(spec.urlKey));
}

/** Defaults overridden by every valid field in the query string. */
export function inputsFromSearch(search: string): Inputs {
  const params = new URLSearchParams(search);
  return buildInputs((spec) => params.get(spec.urlKey));
}

/** Validates an untrusted object (e.g. parsed from localStorage) field by field. */
export function sanitizeInputs(raw: unknown): Inputs {
  const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  return buildInputs((spec) => record[spec.key]);
}
