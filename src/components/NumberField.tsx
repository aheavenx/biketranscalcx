import { useId, useState } from 'react';
import { formatNumber } from '../format';
import { isValidNumber, rangeMessage } from '../model/defaults';
import type { NumericFieldSpec } from '../model/defaults';

/** Parses user text, accepting a decimal comma; blank text is NaN. */
export function parseNumber(text: string): number {
  const raw = text.trim();
  if (/^\d{1,3}(,\d{3})+$/.test(raw)) return Number.NaN; // thousands separator, not a decimal comma
  const trimmed = raw.replace(',', '.');
  return trimmed === '' ? Number.NaN : Number(trimmed);
}

/** The step-grid value at `index` steps from zero, rounded to the step's decimals. */
function gridValue(spec: NumericFieldSpec, index: number): number {
  const decimals = (String(spec.step).split('.')[1] ?? '').length;
  return Number((index * spec.step).toFixed(decimals));
}

/** The next value on the step grid (multiples of `spec.step`) strictly above or below `current`, clamped to the spec's range. */
export function stepValue(spec: NumericFieldSpec, current: number, direction: 1 | -1): number {
  const quotient = current / spec.step;
  const onGrid = Math.abs(quotient - Math.round(quotient)) < 1e-9;
  const index = onGrid ? Math.round(quotient) + direction : direction > 0 ? Math.ceil(quotient) : Math.floor(quotient);
  return Math.min(spec.max, Math.max(spec.min, gridValue(spec, index)));
}

function Chevron({ down }: { down?: boolean }) {
  return (
    <svg viewBox="0 0 10 6" width="10" height="6" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d={down ? 'M1 1l4 4 4-4' : 'M1 5l4-4 4 4'} />
    </svg>
  );
}

interface NumberFieldProps {
  spec: NumericFieldSpec;
  /** Seeds the draft text and is the step base while the draft is invalid; the parent remounts the field (via `key`) to reset it. Null seeds a blank field. */
  value: number | null;
  onChange: (value: number) => void;
  /** Optional fields only: called when the text is cleared, so the model falls back to `fallback`. */
  onClear?: () => void;
  /** Optional fields only: the computed value used while the field is blank. */
  fallback?: number;
}

/** Keeps the raw text while typing; reports only valid values, so invalid drafts never reach the model. */
export function NumberField({ spec, value, onChange, onClear, fallback }: NumberFieldProps) {
  const id = useId();
  const [draft, setDraft] = useState(value === null ? '' : String(value));
  const isBlankAllowed = (text: string) => spec.kind === 'optionalNumber' && text.trim() === '';
  const valid = isBlankAllowed(draft) || isValidNumber(spec, parseNumber(draft));
  const hint =
    fallback === undefined ? spec.hint : [`Computed: ${formatNumber(fallback)} ${spec.unit}.`, spec.hint].join(' ');
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : '', valid ? '' : errorId].filter(Boolean).join(' ');

  const parsedDraft = parseNumber(draft);
  const base = !Number.isNaN(parsedDraft)
    ? parsedDraft
    : isBlankAllowed(draft)
      ? fallback !== undefined
        ? gridValue(spec, Math.round(fallback / spec.step))
        : (value ?? spec.min)
      : (value ?? fallback ?? spec.min);
  const step = (direction: 1 | -1) => {
    if (direction > 0 ? base >= spec.max : base <= spec.min) return;
    const next = stepValue(spec, base, direction);
    setDraft(String(next));
    onChange(next);
  };

  return (
    <div className="field">
      <label htmlFor={id}>
        {spec.label} <span className="unit">({spec.unit})</span>
      </label>
      <div className="number-input">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={draft}
          placeholder={fallback === undefined ? undefined : formatNumber(fallback)}
          aria-invalid={!valid}
          aria-describedby={describedBy || undefined}
          onKeyDown={(event) => {
            if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
            if (event.ctrlKey || event.altKey || event.metaKey) return;
            event.preventDefault();
            step(event.key === 'ArrowUp' ? 1 : -1);
          }}
          onChange={(event) => {
            const text = event.target.value;
            setDraft(text);
            if (isBlankAllowed(text)) {
              onClear?.();
              return;
            }
            const parsed = parseNumber(text);
            if (isValidNumber(spec, parsed)) onChange(parsed);
          }}
        />
        <div className="stepper" onMouseDown={(event) => event.preventDefault()}>
          <button type="button" tabIndex={-1} disabled={base >= spec.max} onClick={() => step(1)}>
            <Chevron />
            <span className="visually-hidden">Increase {spec.label}</span>
          </button>
          <button type="button" tabIndex={-1} disabled={base <= spec.min} onClick={() => step(-1)}>
            <Chevron down />
            <span className="visually-hidden">Decrease {spec.label}</span>
          </button>
        </div>
      </div>
      {hint && (
        <p id={hintId} className="hint">
          {hint}
        </p>
      )}
      {!valid && (
        <p id={errorId} className="error" role="alert">
          {rangeMessage(spec)}
        </p>
      )}
    </div>
  );
}
