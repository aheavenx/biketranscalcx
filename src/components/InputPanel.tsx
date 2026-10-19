import { useState } from 'react';
import { pluralYears } from '../format';
import { FIELD_SPECS, getNumberSpec } from '../model/defaults';
import type { FieldGroup, FieldSpec } from '../model/defaults';
import type { Inputs, OptionalNumericInputKey, SetInput } from '../model/types';
import { NumberField } from './NumberField';
import { SelectField } from './SelectField';

const SECTIONS: { group: FieldGroup; title: string }[] = [
  { group: 'commute', title: 'Your commute' },
  { group: 'transit', title: 'Public transport' },
  { group: 'bike', title: 'Bike' },
  { group: 'you', title: 'You' },
];

interface InputPanelProps {
  inputs: Inputs;
  setInput: SetInput;
  onReset: () => void;
  shareUrl: string;
  /** Average power the model computes; shown while the own-power field is blank. */
  computedPowerW: number;
}

type CopyStatus = 'idle' | 'copied' | 'failed';

const COPY_MESSAGES: Record<CopyStatus, string> = {
  idle: '',
  copied: 'Link copied',
  failed: 'Could not copy. Use the address bar instead.',
};

export function InputPanel({ inputs, setInput, onReset, shareUrl, computedPowerW }: InputPanelProps) {
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle');
  const horizon = getNumberSpec('horizonYears');
  const fallbacks: Record<OptionalNumericInputKey, number> = { avgPowerW: computedPowerW };

  const renderField = (spec: FieldSpec) => {
    if (spec.kind === 'number') {
      return (
        <NumberField
          key={spec.key}
          spec={spec}
          value={inputs[spec.key]}
          onChange={(value) => setInput(spec.key, value)}
        />
      );
    }
    if (spec.kind === 'optionalNumber') {
      return (
        <NumberField
          key={spec.key}
          spec={spec}
          value={inputs[spec.key]}
          onChange={(value) => setInput(spec.key, value)}
          onClear={() => setInput(spec.key, null)}
          fallback={fallbacks[spec.key]}
        />
      );
    }
    return (
      <SelectField
        key={spec.key}
        spec={spec}
        value={inputs[spec.key]}
        onChange={(value) => setInput(spec.key, value as Inputs[typeof spec.key])}
      />
    );
  };

  const fieldsIn = (group: FieldGroup) => FIELD_SPECS.filter((spec) => spec.group === group && spec.visibleWhen?.(inputs) !== false).map(renderField);

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyStatus('copied');
    } catch {
      setCopyStatus('failed');
    }
  }

  return (
    <form className="input-panel" aria-label="Calculator inputs" onSubmit={(event) => event.preventDefault()}>
      <div className="field horizon">
        <label htmlFor="horizon-slider">
          Projection horizon: <strong>{pluralYears(inputs.horizonYears)}</strong>
        </label>
        <input
          id="horizon-slider"
          type="range"
          min={horizon.min}
          max={horizon.max}
          step={horizon.step}
          value={inputs.horizonYears}
          onChange={(event) => setInput('horizonYears', Number(event.target.value))}
        />
      </div>

      {SECTIONS.map(({ group, title }) => (
        <fieldset key={group}>
          <legend>{title}</legend>
          {fieldsIn(group)}
        </fieldset>
      ))}

      <details className="advanced">
        <summary>Advanced</summary>
        {fieldsIn('advanced')}
      </details>

      <details className="advanced">
        <summary>Geeky stats</summary>
        {fieldsIn('geeky')}
      </details>

      <div className="actions">
        <button type="button" onClick={copyShareLink}>
          Copy share link
        </button>
        <button type="button" className="secondary" onClick={onReset}>
          Reset to defaults
        </button>
        <p role="status" className="status">
          {COPY_MESSAGES[copyStatus]}
        </p>
      </div>
    </form>
  );
}
