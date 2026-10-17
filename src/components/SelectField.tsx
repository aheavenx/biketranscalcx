import { useId } from 'react';
import type { SelectFieldSpec } from '../model/defaults';

interface SelectFieldProps {
  spec: SelectFieldSpec;
  value: string;
  onChange: (value: string) => void;
}

export function SelectField({ spec, value, onChange }: SelectFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const hint = spec.options.find((option) => option.value === value)?.hint;
  return (
    <div className="field">
      <label htmlFor={id}>{spec.label}</label>
      <select
        id={id}
        value={value}
        aria-describedby={hint ? hintId : undefined}
        onChange={(event) => onChange(event.target.value)}
      >
        {spec.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint && (
        <p id={hintId} className="hint">
          {hint}
        </p>
      )}
    </div>
  );
}
