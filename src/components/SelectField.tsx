import { useId } from 'react';
import type { SelectFieldSpec } from '../model/defaults';

interface SelectFieldProps {
  spec: SelectFieldSpec;
  value: string;
  onChange: (value: string) => void;
}

export function SelectField({ spec, value, onChange }: SelectFieldProps) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{spec.label}</label>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
        {spec.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
