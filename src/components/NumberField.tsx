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

interface NumberFieldProps {
  spec: NumericFieldSpec;
  /** Seeds the draft text only; the parent remounts the field (via `key`) to reset it. Null seeds a blank field. */
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

  return (
    <div className="field">
      <label htmlFor={id}>
        {spec.label} <span className="unit">({spec.unit})</span>
      </label>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        value={draft}
        placeholder={fallback === undefined ? undefined : formatNumber(fallback)}
        aria-invalid={!valid}
        aria-describedby={describedBy || undefined}
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
