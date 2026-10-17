import { useId, useState } from 'react';
import { isValidNumber, rangeMessage } from '../model/defaults';
import type { NumberFieldSpec } from '../model/defaults';

/** Parses user text, accepting a decimal comma; blank text is NaN. */
export function parseNumber(text: string): number {
  const trimmed = text.trim().replace(',', '.');
  return trimmed === '' ? Number.NaN : Number(trimmed);
}

interface NumberFieldProps {
  spec: NumberFieldSpec;
  /** Seeds the draft text only; the parent remounts the field (via `key`) to reset it. */
  value: number;
  onChange: (value: number) => void;
}

/** Keeps the raw text while typing; reports only valid values, so invalid drafts never reach the model. */
export function NumberField({ spec, value, onChange }: NumberFieldProps) {
  const id = useId();
  const [draft, setDraft] = useState(String(value));
  const valid = isValidNumber(spec, parseNumber(draft));
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [spec.hint ? hintId : '', valid ? '' : errorId].filter(Boolean).join(' ');

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
        aria-invalid={!valid}
        aria-describedby={describedBy || undefined}
        onChange={(event) => {
          const text = event.target.value;
          setDraft(text);
          const parsed = parseNumber(text);
          if (isValidNumber(spec, parsed)) onChange(parsed);
        }}
      />
      {spec.hint && (
        <p id={hintId} className="hint">
          {spec.hint}
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
