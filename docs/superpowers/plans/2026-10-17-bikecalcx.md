# BikeCalcX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A static React SPA that compares the true cost (money + valued time) of commuting by bike vs public transport over 1–30 years, plus an evidence-based health projection, deployable to Vercel.

**Architecture:** All maths lives in pure TypeScript modules under `src/model/` with a single entry point `computeAll(inputs)`. React components are presentational; one hook (`useInputs`) owns state and persists it to the URL and localStorage. Recharts renders three charts; every chart has a text/table equivalent.

**Tech Stack:** Vite, React, TypeScript (strict), Recharts, Vitest + React Testing Library (jsdom), plain CSS.

**Spec:** `docs/superpowers/specs/2026-10-17-bikecalcx-design.md`

## Global Constraints

- npm only. Node ≥ 20.19 (dev machine runs Node 24). Never use `--force` or `--legacy-peer-deps`; if npm reports a peer conflict, stop and report it.
- TypeScript `strict: true`; no `any` in `src/` (the narrow casts shown in this plan are the only casts allowed).
- `src/model/**` is pure TypeScript: no React, no DOM, no `window`.
- All money in € (no currency selection), all units metric, number formatting via the helpers in `src/format.ts` (locale `en-IE`).
- Tests live next to the code as `*.test.ts` / `*.test.tsx`, import `describe/it/expect/vi` explicitly from `vitest` (no globals).
- Chart colours come only from CSS custom properties (`--series-1` … `--series-5`, `--series-bike`, `--series-transit`); text never uses a series colour.
- Do not deploy to Vercel.
- Every commit message ends with a blank line and `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## File Structure

```
package.json, package-lock.json, tsconfig.json, vite.config.ts, index.html, .gitignore, README.md
src/
  main.tsx                 React entry
  App.tsx                  layout + wiring (Task 1 placeholder, Task 12 final)
  App.test.tsx             integration tests (Task 12)
  index.css                all styles (Task 1 minimal, Task 12 final)
  vite-env.d.ts
  format.ts                euro/number/life-delta/payback formatting
  test/setup.ts            jest-dom, cleanup, ResizeObserver stub, URL/storage reset
  test/fixtures.ts         RESULTS_FIXTURE for component tests
  components/chartTheme.tsx  shared Recharts axis/tooltip/legend props (Task 1)
  model/
    types.ts               Inputs, Results and all result types, SetInput
    defaults.ts            DEFAULT_INPUTS, FIELD_SPECS, validation helpers
    commute.ts             trips/km/minutes derived from inputs
    calories.ts            physics power model, BMR, net kcal
    bike.ts                depreciation & replacement schedule
    costs.ts               transit & bike yearly costs, totals, payback, break-even
    mortality.ts           Gompertz-Makeham, WHO HEAT, crash risk, life expectancy
    fitness.ts             Jackson VO2max, trajectories, fitness age
    wellbeing.ts           WHO guideline %, kcal, fat equivalent
    compute.ts             computeAll()
  state/
    urlState.ts            Inputs <-> query string, sanitising
    useInputs.ts           state hook with URL + localStorage persistence
  components/
    NumberField.tsx, SelectField.tsx, InputPanel.tsx
    SummaryCards.tsx, CumulativeChart.tsx, BreakdownChart.tsx
    Methodology.tsx
    health/LifeExpectancy.tsx, health/FitnessChart.tsx, health/Wellbeing.tsx, health/HealthPanel.tsx
```

## Task dependencies

- Task 1 first (scaffold + shared contracts).
- Then independent: Tasks 2, 3, 5, 6, 8, 9, 10, 11.
- Task 4 needs 2 and 3. Task 7 needs 4, 5, 6. Task 12 needs everything.

---

### Task 1: Project scaffold and shared contracts

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `.gitignore`
- Create: `src/main.tsx`, `src/App.tsx`, `src/index.css`, `src/vite-env.d.ts`
- Create: `src/test/setup.ts`, `src/test/fixtures.ts`
- Create: `src/model/types.ts`, `src/model/defaults.ts`, `src/model/commute.ts`, `src/format.ts`
- Create: `src/components/chartTheme.tsx`
- Test: `src/model/defaults.test.ts`, `src/model/commute.test.ts`, `src/format.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces (everything below is relied on by later tasks — names are exact):
  - `src/model/types.ts`: `Sex`, `FitnessLevel`, `Inputs`, `NumericInputKey`, `SelectInputKey`, `SetInput`, `TicketStrategy`, `YearRow`, `CostResults`, `LifeExpectancyResults`, `FitnessPoint`, `FitnessResults`, `WellbeingResults`, `Results`
  - `src/model/defaults.ts`: `FieldGroup`, `NumberFieldSpec`, `SelectFieldSpec`, `FieldSpec`, `DEFAULT_INPUTS`, `FIELD_SPECS`, `NUMBER_FIELDS`, `getNumberSpec(key)`, `isValidNumber(spec, value)`, `isValidSelect(spec, value)`, `rangeMessage(spec)`
  - `src/model/commute.ts`: `tripsPerYear(i)`, `kmPerYear(i)`, `rideMinutesPerTrip(i)`, `weeklyCyclingMinutes(i)` (all `(inputs: Inputs) => number`)
  - `src/format.ts`: `formatEuro`, `formatEuroCompact`, `formatNumber`, `formatLifeDelta`, `formatPayback`, `pluralYears`
  - `src/test/fixtures.ts`: `RESULTS_FIXTURE: Results` (2-year horizon)
  - `src/components/chartTheme.tsx`: `AXIS_PROPS`, `TOOLTIP_PROPS`, `renderLegendLabel(value: string)` — shared Recharts props used by Tasks 10 and 11

- [ ] **Step 1: Create config files**

`package.json`:
```json
{
  "name": "bikecalcx",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc"
  }
}
```

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "noEmit": true
  },
  "include": ["src"]
}
```

`vite.config.ts`:
```ts
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});
```

`.gitignore`:
```
node_modules
dist
coverage
*.local
.vercel
```

`index.html`:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Estimate the true cost of commuting by bike versus public transport: money, time and health." />
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🚲</text></svg>" />
    <title>BikeCalcX: bike vs public transport true cost</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 2: Install dependencies**

Run:
```bash
npm install react react-dom recharts
npm install -D typescript vite @vitejs/plugin-react vitest jsdom @testing-library/react @testing-library/dom @testing-library/jest-dom @testing-library/user-event @types/react @types/react-dom
```
Expected: both complete without `ERESOLVE` errors. If a peer conflict appears, stop and report it (do not use `--force`).

- [ ] **Step 3: Create the app entry files**

`src/vite-env.d.ts`:
```ts
/// <reference types="vite/client" />
```

`src/main.tsx`:
```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

`src/App.tsx` (replaced in Task 12):
```tsx
export default function App() {
  return <h1>BikeCalcX</h1>;
}
```

`src/index.css` (replaced in Task 12):
```css
:root {
  color-scheme: light dark;
  font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
}

body {
  margin: 0;
}
```

`src/test/setup.ts`:
```ts
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// jsdom has no ResizeObserver; Recharts' ResponsiveContainer needs one to mount.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;

afterEach(() => {
  cleanup();
  localStorage.clear();
  window.history.replaceState(null, '', '/');
});
```

- [ ] **Step 4: Create the shared types**

`src/model/types.ts`:
```ts
export type Sex = 'male' | 'female' | 'unspecified';
export type FitnessLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'athlete';

export interface Inputs {
  horizonYears: number;
  tripsPerWeek: number;
  weeksPerYear: number;
  distanceKm: number;
  transitMinutes: number;
  singleTicket: number;
  monthlyPass: number;
  bikePrice: number;
  depreciationPct: number;
  replaceEveryYears: number;
  bikeCarePerYear: number;
  bikeSpeedKmh: number;
  showerMinutesPerTrip: number;
  age: number;
  sex: Sex;
  heightCm: number;
  weightKg: number;
  fitness: FitnessLevel;
  valueOfTimePerHour: number;
  mealPrice: number;
  kcalPerMeal: number;
  cyclistFatalityPerBillionKm: number;
}

export type NumericInputKey = { [K in keyof Inputs]: Inputs[K] extends number ? K : never }[keyof Inputs];
export type SelectInputKey = 'sex' | 'fitness';
export type SetInput = <K extends keyof Inputs>(key: K, value: Inputs[K]) => void;

export type TicketStrategy = 'pass' | 'single';

/** Money figures exclude time; "true" figures include time valued at the hourly rate. */
export interface CumulativeTotals {
  transitTrue: number;
  bikeTrue: number;
  transitMoney: number;
  bikeMoney: number;
}

export interface YearRow {
  year: number;
  transit: { tickets: number; time: number };
  bike: { capital: number; care: number; food: number; time: number };
  cumulative: CumulativeTotals;
}

export interface CostResults {
  tripsPerYear: number;
  kmPerYear: number;
  ticketStrategy: TicketStrategy;
  netKcalPerTrip: number;
  rows: YearRow[];
  totals: CumulativeTotals & { savings: number };
  perMonth: { transitTrue: number; bikeTrue: number };
  hoursPerYear: { transit: number; bike: number };
  bike: { upfront: number; bikesBought: number; residualValue: number };
  /** Months until money savings repay the bike price; null if money savings are not positive. */
  paybackMonths: number | null;
  /** First year in which the cumulative bike true cost is at or below transit; null if never. */
  breakEvenYear: number | null;
}

export interface LifeExpectancyResults {
  baselineRemainingYears: number;
  activityGainYears: number;
  crashLossYears: number;
  netGainYears: number;
  /** HEAT relative mortality reduction while commuting, 0–0.45. */
  riskReduction: number;
  outsideHeatAgeRange: boolean;
}

export interface FitnessPoint {
  year: number;
  transit: number;
  bike: number;
}

export interface FitnessResults {
  baselineVo2max: number;
  /** Year 0 to horizonYears inclusive, VO2max in ml/kg/min. */
  points: FitnessPoint[];
  currentFitnessAge: number;
  fitnessAgeAtEnd: { transit: number; bike: number };
}

export interface WellbeingResults {
  weeklyActiveMinutes: number;
  whoGuidelinePct: number;
  netKcalPerYear: number;
  fatEquivalentKg: number;
}

export interface Results {
  costs: CostResults;
  lifeExpectancy: LifeExpectancyResults;
  fitness: FitnessResults;
  wellbeing: WellbeingResults;
}
```

- [ ] **Step 5: Write failing tests for defaults, commute and format**

`src/model/defaults.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { DEFAULT_INPUTS, FIELD_SPECS, getNumberSpec, isValidNumber, isValidSelect, rangeMessage } from './defaults';

describe('FIELD_SPECS', () => {
  it('covers every input exactly once', () => {
    const keys = FIELD_SPECS.map((spec) => spec.key).sort();
    expect(keys).toEqual(Object.keys(DEFAULT_INPUTS).sort());
  });

  it('uses unique URL keys', () => {
    const urlKeys = FIELD_SPECS.map((spec) => spec.urlKey);
    expect(new Set(urlKeys).size).toBe(urlKeys.length);
  });

  it('has defaults that are valid for their own specs', () => {
    for (const spec of FIELD_SPECS) {
      const valid =
        spec.kind === 'number'
          ? isValidNumber(spec, DEFAULT_INPUTS[spec.key])
          : isValidSelect(spec, DEFAULT_INPUTS[spec.key]);
      expect(valid, spec.key).toBe(true);
    }
  });
});

describe('isValidNumber', () => {
  const distance = getNumberSpec('distanceKm');
  const trips = getNumberSpec('tripsPerWeek');

  it('accepts values inside the range, including the bounds', () => {
    expect(isValidNumber(distance, 0.5)).toBe(true);
    expect(isValidNumber(distance, 60)).toBe(true);
  });

  it('rejects out-of-range values, NaN and infinity', () => {
    expect(isValidNumber(distance, 0.4)).toBe(false);
    expect(isValidNumber(distance, 60.1)).toBe(false);
    expect(isValidNumber(distance, Number.NaN)).toBe(false);
    expect(isValidNumber(distance, Number.POSITIVE_INFINITY)).toBe(false);
  });

  it('rejects fractions for integer fields', () => {
    expect(isValidNumber(trips, 2.5)).toBe(false);
    expect(isValidNumber(trips, 3)).toBe(true);
  });
});

describe('isValidSelect', () => {
  it('accepts only listed options', () => {
    const sex = FIELD_SPECS.find((spec) => spec.key === 'sex');
    if (sex?.kind !== 'select') throw new Error('sex spec missing');
    expect(isValidSelect(sex, 'female')).toBe(true);
    expect(isValidSelect(sex, 'robot')).toBe(false);
  });
});

describe('rangeMessage', () => {
  it('describes decimal and whole-number ranges', () => {
    expect(rangeMessage(getNumberSpec('distanceKm'))).toBe('Enter a number from 0.5 to 60');
    expect(rangeMessage(getNumberSpec('tripsPerWeek'))).toBe('Enter a whole number from 0 to 28');
  });
});
```

`src/model/commute.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { kmPerYear, rideMinutesPerTrip, tripsPerYear, weeklyCyclingMinutes } from './commute';
import { DEFAULT_INPUTS } from './defaults';

describe('commute helpers', () => {
  it('derives yearly trips and km from the defaults', () => {
    expect(tripsPerYear(DEFAULT_INPUTS)).toBe(460);
    expect(kmPerYear(DEFAULT_INPUTS)).toBe(3680);
  });

  it('derives ride minutes per trip from distance and speed', () => {
    expect(rideMinutesPerTrip(DEFAULT_INPUTS)).toBeCloseTo(26.667, 3);
  });

  it('averages weekly cycling minutes over 52 weeks', () => {
    expect(weeklyCyclingMinutes(DEFAULT_INPUTS)).toBeCloseTo(235.897, 3);
  });

  it('returns zero activity for zero trips', () => {
    const inputs = { ...DEFAULT_INPUTS, tripsPerWeek: 0 };
    expect(tripsPerYear(inputs)).toBe(0);
    expect(weeklyCyclingMinutes(inputs)).toBe(0);
  });
});
```

`src/format.test.ts`:
```ts
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
```

- [ ] **Step 6: Run the tests to verify they fail**

Run: `npm test`
Expected: FAIL — cannot resolve `./defaults`, `./commute`, `./format`.

- [ ] **Step 7: Implement defaults, commute and format**

`src/model/defaults.ts`:
```ts
import type { Inputs, NumericInputKey, SelectInputKey } from './types';

export type FieldGroup = 'projection' | 'commute' | 'transit' | 'bike' | 'you' | 'advanced';

export interface NumberFieldSpec {
  kind: 'number';
  key: NumericInputKey;
  urlKey: string;
  group: FieldGroup;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  integer: boolean;
  hint?: string;
}

export interface SelectFieldSpec {
  kind: 'select';
  key: SelectInputKey;
  urlKey: string;
  group: FieldGroup;
  label: string;
  options: { value: string; label: string }[];
}

export type FieldSpec = NumberFieldSpec | SelectFieldSpec;

export const DEFAULT_INPUTS: Inputs = {
  horizonYears: 5,
  tripsPerWeek: 10,
  weeksPerYear: 46,
  distanceKm: 8,
  transitMinutes: 35,
  singleTicket: 3,
  monthlyPass: 60,
  bikePrice: 800,
  depreciationPct: 15,
  replaceEveryYears: 8,
  bikeCarePerYear: 120,
  bikeSpeedKmh: 18,
  showerMinutesPerTrip: 5,
  age: 35,
  sex: 'unspecified',
  heightCm: 175,
  weightKg: 75,
  fitness: 'moderate',
  valueOfTimePerHour: 15,
  mealPrice: 6,
  kcalPerMeal: 650,
  cyclistFatalityPerBillionKm: 15,
};

const num = (spec: Omit<NumberFieldSpec, 'kind'>): NumberFieldSpec => ({ kind: 'number', ...spec });

/** Order here is the order fields appear in the UI and in share URLs. */
export const FIELD_SPECS: FieldSpec[] = [
  num({ key: 'horizonYears', urlKey: 'hy', group: 'projection', label: 'Projection horizon', unit: 'years', min: 1, max: 30, step: 1, integer: true }),
  num({ key: 'tripsPerWeek', urlKey: 'tw', group: 'commute', label: 'One-way trips per week', unit: 'trips', min: 0, max: 28, step: 1, integer: true }),
  num({ key: 'weeksPerYear', urlKey: 'wy', group: 'commute', label: 'Commuting weeks per year', unit: 'weeks', min: 1, max: 52, step: 1, integer: true, hint: 'Leave out holidays and remote-work weeks.' }),
  num({ key: 'distanceKm', urlKey: 'dk', group: 'commute', label: 'One-way distance', unit: 'km', min: 0.5, max: 60, step: 0.5, integer: false }),
  num({ key: 'transitMinutes', urlKey: 'tm', group: 'commute', label: 'Public transport time per trip, door to door', unit: 'min', min: 1, max: 240, step: 1, integer: false }),
  num({ key: 'singleTicket', urlKey: 'st', group: 'transit', label: 'Single ticket price', unit: '€', min: 0, max: 50, step: 0.1, integer: false }),
  num({ key: 'monthlyPass', urlKey: 'mp', group: 'transit', label: 'Monthly pass price', unit: '€', min: 0, max: 1000, step: 1, integer: false }),
  num({ key: 'bikePrice', urlKey: 'bp', group: 'bike', label: 'Bike price', unit: '€', min: 0, max: 20000, step: 10, integer: false }),
  num({ key: 'depreciationPct', urlKey: 'dp', group: 'bike', label: 'Depreciation', unit: '%/year', min: 0, max: 60, step: 1, integer: false }),
  num({ key: 'replaceEveryYears', urlKey: 'ry', group: 'bike', label: 'Replace bike every', unit: 'years', min: 1, max: 30, step: 1, integer: true }),
  num({ key: 'bikeCarePerYear', urlKey: 'bc', group: 'bike', label: 'Bike care', unit: '€/year', min: 0, max: 5000, step: 5, integer: false }),
  num({ key: 'bikeSpeedKmh', urlKey: 'bs', group: 'bike', label: 'Average riding speed', unit: 'km/h', min: 5, max: 45, step: 0.5, integer: false }),
  num({ key: 'showerMinutesPerTrip', urlKey: 'sm', group: 'bike', label: 'Extra shower and changing time per trip', unit: 'min', min: 0, max: 60, step: 1, integer: false, hint: 'A 10-minute shower after each arrival at work averages 5 minutes per one-way trip.' }),
  num({ key: 'age', urlKey: 'ag', group: 'you', label: 'Age', unit: 'years', min: 16, max: 90, step: 1, integer: true }),
  {
    kind: 'select',
    key: 'sex',
    urlKey: 'sx',
    group: 'you',
    label: 'Sex',
    options: [
      { value: 'unspecified', label: 'Prefer not to say' },
      { value: 'female', label: 'Female' },
      { value: 'male', label: 'Male' },
    ],
  },
  num({ key: 'heightCm', urlKey: 'hc', group: 'you', label: 'Height', unit: 'cm', min: 120, max: 220, step: 1, integer: false }),
  num({ key: 'weightKg', urlKey: 'wk', group: 'you', label: 'Weight', unit: 'kg', min: 35, max: 200, step: 0.5, integer: false }),
  {
    kind: 'select',
    key: 'fitness',
    urlKey: 'ft',
    group: 'you',
    label: 'Fitness level',
    options: [
      { value: 'sedentary', label: 'Sedentary' },
      { value: 'light', label: 'Lightly active' },
      { value: 'moderate', label: 'Moderately active' },
      { value: 'active', label: 'Very active' },
      { value: 'athlete', label: 'Athlete' },
    ],
  },
  num({ key: 'valueOfTimePerHour', urlKey: 'vt', group: 'you', label: 'Value of your time', unit: '€/h', min: 0, max: 500, step: 1, integer: false, hint: 'Set to 0 to compare money only.' }),
  num({ key: 'mealPrice', urlKey: 'ml', group: 'you', label: 'Price per balanced meal', unit: '€', min: 0, max: 100, step: 0.5, integer: false }),
  num({ key: 'kcalPerMeal', urlKey: 'kc', group: 'you', label: 'Calories per balanced meal', unit: 'kcal', min: 200, max: 2000, step: 10, integer: false }),
  num({ key: 'cyclistFatalityPerBillionKm', urlKey: 'cf', group: 'advanced', label: 'Cyclist fatality rate', unit: 'deaths per billion km', min: 0, max: 200, step: 1, integer: false, hint: 'About 8 in the Netherlands and 21 in the UK (ITF/IRTAD, 2011–2015).' }),
];

export const NUMBER_FIELDS: NumberFieldSpec[] = FIELD_SPECS.filter(
  (spec): spec is NumberFieldSpec => spec.kind === 'number',
);

export function getNumberSpec(key: NumericInputKey): NumberFieldSpec {
  const spec = NUMBER_FIELDS.find((candidate) => candidate.key === key);
  if (!spec) throw new Error(`No field spec for ${key}`);
  return spec;
}

export function isValidNumber(spec: NumberFieldSpec, value: number): boolean {
  return (
    Number.isFinite(value) &&
    value >= spec.min &&
    value <= spec.max &&
    (!spec.integer || Number.isInteger(value))
  );
}

export function isValidSelect(spec: SelectFieldSpec, value: string): boolean {
  return spec.options.some((option) => option.value === value);
}

export function rangeMessage(spec: NumberFieldSpec): string {
  const kind = spec.integer ? 'a whole number' : 'a number';
  return `Enter ${kind} from ${spec.min} to ${spec.max}`;
}
```

`src/model/commute.ts`:
```ts
import type { Inputs } from './types';

const WEEKS_PER_YEAR = 52;

export function tripsPerYear(inputs: Inputs): number {
  return inputs.tripsPerWeek * inputs.weeksPerYear;
}

export function kmPerYear(inputs: Inputs): number {
  return tripsPerYear(inputs) * inputs.distanceKm;
}

export function rideMinutesPerTrip(inputs: Inputs): number {
  return (inputs.distanceKm / inputs.bikeSpeedKmh) * 60;
}

/** Cycling minutes per week averaged over the whole year, so holidays dilute the dose. */
export function weeklyCyclingMinutes(inputs: Inputs): number {
  return (tripsPerYear(inputs) * rideMinutesPerTrip(inputs)) / WEEKS_PER_YEAR;
}
```

`src/format.ts`:
```ts
const LOCALE = 'en-IE';
const MINUS = '−';

const euro = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const euroCompact = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: 'EUR',
  notation: 'compact',
  maximumFractionDigits: 1,
});

/** Whole euros, e.g. "€1,208". Rounds first so tiny negatives never print as "-€0". */
export function formatEuro(value: number): string {
  return euro.format(Math.round(value) || 0);
}

export function formatEuroCompact(value: number): string {
  return euroCompact.format(value);
}

export function formatNumber(value: number, fractionDigits = 0): string {
  return new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

/** Signed lifespan change: days below two months, months below two years, years above. */
export function formatLifeDelta(years: number): string {
  const magnitude = Math.abs(years);
  const days = Math.round(magnitude * 365);
  if (days === 0) return '0 days';
  const sign = years < 0 ? MINUS : '+';
  if (magnitude < 1 / 6) return `${sign}${days} ${days === 1 ? 'day' : 'days'}`;
  if (magnitude < 2) return `${sign}${(magnitude * 12).toFixed(1)} months`;
  return `${sign}${magnitude.toFixed(1)} years`;
}

export function formatPayback(months: number | null): string {
  if (months === null) return 'Never (money only)';
  if (months === 0) return 'Immediately';
  if (months < 1) return 'Under 1 month';
  const whole = Math.ceil(months);
  return `${whole} ${whole === 1 ? 'month' : 'months'}`;
}

export function pluralYears(years: number): string {
  return `${years} ${years === 1 ? 'year' : 'years'}`;
}
```

`src/test/fixtures.ts` (internally consistent 2-year results used by component tests):
```ts
import type { CostResults, Results, YearRow } from '../model/types';

const rows: YearRow[] = [
  {
    year: 1,
    transit: { tickets: 720, time: 4025 },
    bike: { capital: 120, care: 120, food: 650, time: 3640 },
    cumulative: { transitTrue: 4745, bikeTrue: 4530, transitMoney: 720, bikeMoney: 890 },
  },
  {
    year: 2,
    transit: { tickets: 720, time: 4025 },
    bike: { capital: 102, care: 120, food: 650, time: 3640 },
    cumulative: { transitTrue: 9490, bikeTrue: 9042, transitMoney: 1440, bikeMoney: 1762 },
  },
];

const costs: CostResults = {
  tripsPerYear: 460,
  kmPerYear: 3680,
  ticketStrategy: 'pass',
  netKcalPerTrip: 150,
  rows,
  totals: { transitTrue: 9490, bikeTrue: 9042, transitMoney: 1440, bikeMoney: 1762, savings: 448 },
  perMonth: { transitTrue: 395.42, bikeTrue: 376.75 },
  hoursPerYear: { transit: 268.3, bike: 242.8 },
  bike: { upfront: 800, bikesBought: 1, residualValue: 578 },
  paybackMonths: null,
  breakEvenYear: 1,
};

export const RESULTS_FIXTURE: Results = {
  costs,
  lifeExpectancy: {
    baselineRemainingYears: 47.65,
    activityGainYears: 0.0677,
    crashLossYears: 0.0125,
    netGainYears: 0.0552,
    riskReduction: 0.2359,
    outsideHeatAgeRange: false,
  },
  fitness: {
    baselineVo2max: 35.8,
    points: [
      { year: 0, transit: 35.8, bike: 35.8 },
      { year: 1, transit: 35.44, bike: 37.59 },
      { year: 2, transit: 35.09, bike: 37.4 },
    ],
    currentFitnessAge: 36,
    fitnessAgeAtEnd: { transit: 38, bike: 32 },
  },
  wellbeing: { weeklyActiveMinutes: 236, whoGuidelinePct: 157.3, netKcalPerYear: 70700, fatEquivalentKg: 9.18 },
};
```

`src/components/chartTheme.tsx` (shared by every chart so axes, tooltips and legends use text tokens, never series colours):
```tsx
export const AXIS_PROPS = {
  stroke: 'var(--axis)',
  tick: { fill: 'var(--text-muted)', fontSize: 12 },
  tickLine: false,
} as const;

export const TOOLTIP_PROPS = {
  contentStyle: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    color: 'var(--text)',
  },
  itemStyle: { color: 'var(--text)' },
  labelStyle: { color: 'var(--text-secondary)' },
} as const;

/** Legend labels use the secondary text colour; the swatch beside them carries the series colour. */
export function renderLegendLabel(value: string) {
  return <span className="legend-label">{value}</span>;
}
```

- [ ] **Step 8: Run tests, type-check and build**

Run: `npm test && npm run build`
Expected: all tests PASS; `tsc` reports no errors; `vite build` writes `dist/`.

- [ ] **Step 9: Commit**

```bash
git add .gitignore package.json package-lock.json tsconfig.json vite.config.ts index.html src
git commit -m "chore: scaffold Vite React TS app with shared model contracts

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Calorie model

**Files:**
- Create: `src/model/calories.ts`
- Test: `src/model/calories.test.ts`

**Interfaces:**
- Consumes: `Inputs`, `FitnessLevel`, `Sex` (types.ts); `rideMinutesPerTrip` (commute.ts); `DEFAULT_INPUTS` (defaults.ts, tests only).
- Produces: `bodySurfaceArea(weightKg: number, heightCm: number): number`, `mechanicalPowerW(inputs: Inputs): number`, `restingKcalPerHour(inputs: Inputs): number`, `grossKcalPerHour(inputs: Inputs): number`, `netKcalPerHour(inputs: Inputs): number`, `netKcalPerTrip(inputs: Inputs): number`, `GROSS_EFFICIENCY`.

- [ ] **Step 1: Write the failing tests**

`src/model/calories.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import {
  bodySurfaceArea,
  mechanicalPowerW,
  netKcalPerHour,
  netKcalPerTrip,
  restingKcalPerHour,
} from './calories';
import { DEFAULT_INPUTS } from './defaults';

describe('bodySurfaceArea', () => {
  it('matches the Du Bois formula', () => {
    expect(bodySurfaceArea(75, 175)).toBeCloseTo(1.9031, 4);
  });
});

describe('mechanicalPowerW', () => {
  it('includes rolling, aero and the urban factor', () => {
    expect(mechanicalPowerW(DEFAULT_INPUTS)).toBeCloseTo(95.79, 2);
  });
});

describe('restingKcalPerHour', () => {
  it('uses Mifflin-St Jeor with the averaged sex offset for unspecified', () => {
    expect(restingKcalPerHour(DEFAULT_INPUTS)).toBeCloseTo(66.281, 3);
  });

  it('is higher for male than female inputs', () => {
    expect(restingKcalPerHour({ ...DEFAULT_INPUTS, sex: 'male' })).toBeGreaterThan(
      restingKcalPerHour({ ...DEFAULT_INPUTS, sex: 'female' }),
    );
  });
});

describe('netKcalPerHour', () => {
  it('lands in the expected range for defaults', () => {
    const value = netKcalPerHour(DEFAULT_INPUTS);
    expect(value).toBeCloseTo(345.83, 2);
    expect(value).toBeGreaterThan(300);
    expect(value).toBeLessThan(380);
  });

  it('is lower for fitter riders (higher efficiency)', () => {
    const sedentary = netKcalPerHour({ ...DEFAULT_INPUTS, fitness: 'sedentary' });
    const moderate = netKcalPerHour(DEFAULT_INPUTS);
    const athlete = netKcalPerHour({ ...DEFAULT_INPUTS, fitness: 'athlete' });
    expect(sedentary).toBeGreaterThan(moderate);
    expect(moderate).toBeGreaterThan(athlete);
  });

  it('is higher for heavier riders and faster speeds', () => {
    expect(netKcalPerHour({ ...DEFAULT_INPUTS, weightKg: 95 })).toBeGreaterThan(netKcalPerHour(DEFAULT_INPUTS));
    expect(netKcalPerHour({ ...DEFAULT_INPUTS, bikeSpeedKmh: 25 })).toBeGreaterThan(netKcalPerHour(DEFAULT_INPUTS));
  });

  it('never goes negative', () => {
    const tinySlowRider = {
      ...DEFAULT_INPUTS,
      bikeSpeedKmh: 5,
      weightKg: 35,
      heightCm: 120,
      age: 16,
      sex: 'male' as const,
      fitness: 'athlete' as const,
    };
    expect(netKcalPerHour(tinySlowRider)).toBe(0);
  });
});

describe('netKcalPerTrip', () => {
  it('scales hourly burn by ride time', () => {
    expect(netKcalPerTrip(DEFAULT_INPUTS)).toBeCloseTo(153.7, 1);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/model/calories.test.ts`
Expected: FAIL — cannot resolve `./calories`.

- [ ] **Step 3: Implement**

`src/model/calories.ts`:
```ts
import { rideMinutesPerTrip } from './commute';
import type { FitnessLevel, Inputs, Sex } from './types';

export const BIKE_MASS_KG = 15;
export const GRAVITY = 9.81;
/** Rolling resistance coefficient for city tyres on asphalt. */
export const ROLLING_RESISTANCE = 0.008;
export const AIR_DENSITY = 1.2;
/** Drag area (m²) of an upright commuter whose body surface area is REFERENCE_BSA. */
export const REFERENCE_CDA = 0.55;
export const REFERENCE_BSA = 1.9;
/** Extra work from stopping, accelerating and small hills in city riding. */
export const URBAN_FACTOR = 1.25;
const JOULES_PER_KCAL = 4184;

/** Gross efficiency of cycling: trained riders turn more of the energy they burn into work. */
export const GROSS_EFFICIENCY: Record<FitnessLevel, number> = {
  sedentary: 0.18,
  light: 0.19,
  moderate: 0.2,
  active: 0.215,
  athlete: 0.23,
};

/** Mifflin-St Jeor sex term; "unspecified" is the midpoint of male (+5) and female (−161). */
const MIFFLIN_SEX_OFFSET: Record<Sex, number> = { male: 5, female: -161, unspecified: -78 };

/** Du Bois & Du Bois (1916) body surface area in m². */
export function bodySurfaceArea(weightKg: number, heightCm: number): number {
  return 0.007184 * weightKg ** 0.425 * heightCm ** 0.725;
}

/** Mechanical power (W) to ride at the input speed on flat ground, including the urban factor. */
export function mechanicalPowerW(inputs: Inputs): number {
  const speed = inputs.bikeSpeedKmh / 3.6;
  const mass = inputs.weightKg + BIKE_MASS_KG;
  const dragArea = (REFERENCE_CDA * bodySurfaceArea(inputs.weightKg, inputs.heightCm)) / REFERENCE_BSA;
  const rolling = ROLLING_RESISTANCE * mass * GRAVITY * speed;
  const aero = 0.5 * AIR_DENSITY * dragArea * speed ** 3;
  return (rolling + aero) * URBAN_FACTOR;
}

/** Mifflin-St Jeor resting energy expenditure, per hour. */
export function restingKcalPerHour(inputs: Inputs): number {
  const bmr = 10 * inputs.weightKg + 6.25 * inputs.heightCm - 5 * inputs.age + MIFFLIN_SEX_OFFSET[inputs.sex];
  return bmr / 24;
}

export function grossKcalPerHour(inputs: Inputs): number {
  const metabolicWatts = mechanicalPowerW(inputs) / GROSS_EFFICIENCY[inputs.fitness];
  return (metabolicWatts * 3600) / JOULES_PER_KCAL;
}

/** Calories burned per hour of riding above what the body burns at rest anyway. */
export function netKcalPerHour(inputs: Inputs): number {
  return Math.max(0, grossKcalPerHour(inputs) - restingKcalPerHour(inputs));
}

export function netKcalPerTrip(inputs: Inputs): number {
  return (netKcalPerHour(inputs) * rideMinutesPerTrip(inputs)) / 60;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/model/calories.test.ts && npx tsc`
Expected: PASS, no type errors.

- [ ] **Step 5: Commit**

```bash
git add src/model/calories.ts src/model/calories.test.ts
git commit -m "feat: add physics-based cycling calorie model

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Bike depreciation and replacement

**Files:**
- Create: `src/model/bike.ts`
- Test: `src/model/bike.test.ts`

**Interfaces:**
- Consumes: `Inputs` (types.ts); `DEFAULT_INPUTS` (tests only).
- Produces: `bikeValue(price: number, depreciationPct: number, ageYears: number): number`, `bikeAgeAtYearEnd(year: number, replaceEveryYears: number): number`, `capitalCostForYear(inputs: Inputs, year: number): number`, `bikesBought(inputs: Inputs): number`, `residualValueAtHorizon(inputs: Inputs): number`.

- [ ] **Step 1: Write the failing tests**

`src/model/bike.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { bikesBought, bikeValue, capitalCostForYear, residualValueAtHorizon } from './bike';
import { DEFAULT_INPUTS } from './defaults';
import type { Inputs } from './types';

const sumCapital = (inputs: Inputs) => {
  let total = 0;
  for (let year = 1; year <= inputs.horizonYears; year++) total += capitalCostForYear(inputs, year);
  return total;
};

describe('bikeValue', () => {
  it('declines by the depreciation rate each year', () => {
    expect(bikeValue(800, 15, 0)).toBe(800);
    expect(bikeValue(800, 15, 1)).toBeCloseTo(680, 10);
    expect(bikeValue(800, 15, 2)).toBeCloseTo(578, 10);
  });
});

describe('capitalCostForYear', () => {
  it('is the value lost in each year', () => {
    expect(capitalCostForYear(DEFAULT_INPUTS, 1)).toBeCloseTo(120, 10);
    expect(capitalCostForYear(DEFAULT_INPUTS, 2)).toBeCloseTo(102, 10);
    expect(capitalCostForYear(DEFAULT_INPUTS, 3)).toBeCloseTo(86.7, 10);
  });

  it('restarts with a new bike after replacement', () => {
    const inputs = { ...DEFAULT_INPUTS, replaceEveryYears: 2 };
    expect(capitalCostForYear(inputs, 3)).toBeCloseTo(120, 10);
  });

  it('is zero without depreciation', () => {
    expect(capitalCostForYear({ ...DEFAULT_INPUTS, depreciationPct: 0 }, 4)).toBe(0);
  });
});

describe('totals over the horizon', () => {
  it('equals price minus residual value without replacement', () => {
    expect(bikesBought(DEFAULT_INPUTS)).toBe(1);
    expect(residualValueAtHorizon(DEFAULT_INPUTS)).toBeCloseTo(354.964, 3);
    expect(sumCapital(DEFAULT_INPUTS)).toBeCloseTo(800 - 354.96425, 6);
  });

  it('equals purchases minus resales minus residual with replacement', () => {
    const inputs = { ...DEFAULT_INPUTS, horizonYears: 5, replaceEveryYears: 2 };
    const bikes = bikesBought(inputs);
    expect(bikes).toBe(3);
    const resaleEach = bikeValue(800, 15, 2);
    const residual = residualValueAtHorizon(inputs);
    expect(residual).toBeCloseTo(680, 10);
    expect(sumCapital(inputs)).toBeCloseTo(bikes * 800 - (bikes - 1) * resaleEach - residual, 6);
    expect(sumCapital(inputs)).toBeCloseTo(564, 6);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/model/bike.test.ts`
Expected: FAIL — cannot resolve `./bike`.

- [ ] **Step 3: Implement**

`src/model/bike.ts`:
```ts
import type { Inputs } from './types';

/** Declining-balance value of a bike that is `ageYears` old. */
export function bikeValue(price: number, depreciationPct: number, ageYears: number): number {
  return price * (1 - depreciationPct / 100) ** ageYears;
}

/** Age at the end of projection year `year` (1-based) of the bike in use, given replacement every N years. */
export function bikeAgeAtYearEnd(year: number, replaceEveryYears: number): number {
  return ((year - 1) % replaceEveryYears) + 1;
}

/**
 * Economic capital cost in projection year `year`: the value the current bike loses that year.
 * A replaced bike is sold at its depreciated value and a new one bought at full price, so the
 * swap itself adds nothing beyond depreciation.
 */
export function capitalCostForYear(inputs: Inputs, year: number): number {
  const age = bikeAgeAtYearEnd(year, inputs.replaceEveryYears);
  return (
    bikeValue(inputs.bikePrice, inputs.depreciationPct, age - 1) -
    bikeValue(inputs.bikePrice, inputs.depreciationPct, age)
  );
}

export function bikesBought(inputs: Inputs): number {
  return Math.ceil(inputs.horizonYears / inputs.replaceEveryYears);
}

/** Value of the bike you still own at the end of the horizon. */
export function residualValueAtHorizon(inputs: Inputs): number {
  const age = bikeAgeAtYearEnd(inputs.horizonYears, inputs.replaceEveryYears);
  return bikeValue(inputs.bikePrice, inputs.depreciationPct, age);
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/model/bike.test.ts && npx tsc`
Expected: PASS, no type errors.

- [ ] **Step 5: Commit**

```bash
git add src/model/bike.ts src/model/bike.test.ts
git commit -m "feat: add bike depreciation and replacement schedule

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Cost model

**Files:**
- Create: `src/model/costs.ts`
- Test: `src/model/costs.test.ts`

**Interfaces:**
- Consumes: `capitalCostForYear`, `bikesBought`, `residualValueAtHorizon` (bike.ts); `netKcalPerTrip` (calories.ts); `tripsPerYear`, `kmPerYear`, `rideMinutesPerTrip` (commute.ts); `CostResults`, `Inputs`, `TicketStrategy`, `YearRow` (types.ts).
- Produces: `annualTickets(inputs: Inputs): { cost: number; strategy: TicketStrategy }`, `computeCosts(inputs: Inputs): CostResults`.

- [ ] **Step 1: Write the failing tests**

`src/model/costs.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { annualTickets, computeCosts } from './costs';
import { DEFAULT_INPUTS } from './defaults';

describe('annualTickets', () => {
  it('picks the monthly pass when it is cheaper', () => {
    expect(annualTickets(DEFAULT_INPUTS)).toEqual({ cost: 720, strategy: 'pass' });
  });

  it('picks single tickets when they are cheaper', () => {
    expect(annualTickets({ ...DEFAULT_INPUTS, singleTicket: 1 })).toEqual({ cost: 460, strategy: 'single' });
  });

  it('prefers the pass on a tie', () => {
    // 10 trips × 24 weeks × €3 = €720 = 12 × €60
    expect(annualTickets({ ...DEFAULT_INPUTS, weeksPerYear: 24 })).toEqual({ cost: 720, strategy: 'pass' });
  });

  it('costs nothing with zero trips', () => {
    expect(annualTickets({ ...DEFAULT_INPUTS, tripsPerWeek: 0 }).cost).toBe(0);
  });
});

describe('computeCosts with defaults', () => {
  const costs = computeCosts(DEFAULT_INPUTS);

  it('produces one row per year with the yearly components', () => {
    expect(costs.rows).toHaveLength(5);
    const first = costs.rows[0];
    expect(first.transit.tickets).toBe(720);
    expect(first.transit.time).toBeCloseTo(4025, 6);
    expect(first.bike.capital).toBeCloseTo(120, 6);
    expect(first.bike.care).toBe(120);
    expect(first.bike.food).toBeCloseTo(652.64, 2);
    expect(first.bike.time).toBeCloseTo(3641.667, 3);
  });

  it('accumulates running totals', () => {
    expect(costs.rows[1].cumulative.transitTrue).toBeCloseTo(9490, 6);
    expect(costs.rows[4].cumulative).toEqual({
      transitTrue: costs.totals.transitTrue,
      bikeTrue: costs.totals.bikeTrue,
      transitMoney: costs.totals.transitMoney,
      bikeMoney: costs.totals.bikeMoney,
    });
  });

  it('computes totals, savings and per-month figures', () => {
    expect(costs.totals.transitTrue).toBeCloseTo(23725, 6);
    expect(costs.totals.bikeTrue).toBeCloseTo(22516.57, 2);
    expect(costs.totals.transitMoney).toBeCloseTo(3600, 6);
    expect(costs.totals.bikeMoney).toBeCloseTo(4308.24, 2);
    expect(costs.totals.savings).toBeCloseTo(1208.43, 2);
    expect(costs.perMonth.transitTrue).toBeCloseTo(395.417, 3);
  });

  it('reports hours, trips, km and the ticket strategy', () => {
    expect(costs.tripsPerYear).toBe(460);
    expect(costs.kmPerYear).toBe(3680);
    expect(costs.ticketStrategy).toBe('pass');
    expect(costs.hoursPerYear.transit).toBeCloseTo(268.333, 3);
    expect(costs.hoursPerYear.bike).toBeCloseTo(242.778, 3);
  });

  it('reports bike purchase facts', () => {
    expect(costs.bike.upfront).toBe(800);
    expect(costs.bike.bikesBought).toBe(1);
    expect(costs.bike.residualValue).toBeCloseTo(354.964, 3);
  });

  it('breaks even in year 1 but never pays back on money alone', () => {
    expect(costs.breakEvenYear).toBe(1);
    expect(costs.paybackMonths).toBeNull();
  });
});

describe('computeCosts edge cases', () => {
  it('computes payback when money savings are positive', () => {
    const costs = computeCosts({ ...DEFAULT_INPUTS, monthlyPass: 200 });
    expect(costs.ticketStrategy).toBe('single');
    expect(costs.paybackMonths).toBeCloseTo(15.806, 2);
  });

  it('pays back immediately for a free bike', () => {
    expect(computeCosts({ ...DEFAULT_INPUTS, bikePrice: 0 }).paybackMonths).toBe(0);
  });

  it('never breaks even when time is free and the bike costs more money', () => {
    const costs = computeCosts({ ...DEFAULT_INPUTS, valueOfTimePerHour: 0 });
    expect(costs.breakEvenYear).toBeNull();
    expect(costs.totals.savings).toBeCloseTo(-708.24, 2);
  });

  it('handles zero trips without NaN', () => {
    const costs = computeCosts({ ...DEFAULT_INPUTS, tripsPerWeek: 0 });
    expect(costs.rows[0].bike.food).toBe(0);
    expect(costs.rows[0].transit.time).toBe(0);
    expect(Number.isNaN(costs.totals.bikeTrue)).toBe(false);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/model/costs.test.ts`
Expected: FAIL — cannot resolve `./costs`.

- [ ] **Step 3: Implement**

`src/model/costs.ts`:
```ts
import { bikesBought, capitalCostForYear, residualValueAtHorizon } from './bike';
import { netKcalPerTrip } from './calories';
import { kmPerYear, rideMinutesPerTrip, tripsPerYear } from './commute';
import type { CostResults, CumulativeTotals, Inputs, TicketStrategy, YearRow } from './types';

/** Cheaper of 12 monthly passes or a single ticket per trip; ties go to the pass. */
export function annualTickets(inputs: Inputs): { cost: number; strategy: TicketStrategy } {
  const pass = 12 * inputs.monthlyPass;
  const singles = tripsPerYear(inputs) * inputs.singleTicket;
  return singles < pass ? { cost: singles, strategy: 'single' } : { cost: pass, strategy: 'pass' };
}

export function computeCosts(inputs: Inputs): CostResults {
  const trips = tripsPerYear(inputs);
  const tickets = annualTickets(inputs);
  const transitHours = (trips * inputs.transitMinutes) / 60;
  const bikeHours = (trips * (rideMinutesPerTrip(inputs) + inputs.showerMinutesPerTrip)) / 60;
  const kcalPerTrip = netKcalPerTrip(inputs);
  const food = ((trips * kcalPerTrip) / inputs.kcalPerMeal) * inputs.mealPrice;
  const care = inputs.bikeCarePerYear;
  const transitTime = transitHours * inputs.valueOfTimePerHour;
  const bikeTime = bikeHours * inputs.valueOfTimePerHour;

  const rows: YearRow[] = [];
  const running: CumulativeTotals = { transitTrue: 0, bikeTrue: 0, transitMoney: 0, bikeMoney: 0 };
  for (let year = 1; year <= inputs.horizonYears; year++) {
    const capital = capitalCostForYear(inputs, year);
    const bikeMoney = capital + care + food;
    running.transitMoney += tickets.cost;
    running.bikeMoney += bikeMoney;
    running.transitTrue += tickets.cost + transitTime;
    running.bikeTrue += bikeMoney + bikeTime;
    rows.push({
      year,
      transit: { tickets: tickets.cost, time: transitTime },
      bike: { capital, care, food, time: bikeTime },
      cumulative: { ...running },
    });
  }

  const months = inputs.horizonYears * 12;
  const monthlyMoneySaving = (tickets.cost - care - food) / 12;
  let paybackMonths: number | null = null;
  if (inputs.bikePrice === 0) paybackMonths = 0;
  else if (monthlyMoneySaving > 0) paybackMonths = inputs.bikePrice / monthlyMoneySaving;

  return {
    tripsPerYear: trips,
    kmPerYear: kmPerYear(inputs),
    ticketStrategy: tickets.strategy,
    netKcalPerTrip: kcalPerTrip,
    rows,
    totals: { ...running, savings: running.transitTrue - running.bikeTrue },
    perMonth: { transitTrue: running.transitTrue / months, bikeTrue: running.bikeTrue / months },
    hoursPerYear: { transit: transitHours, bike: bikeHours },
    bike: {
      upfront: inputs.bikePrice,
      bikesBought: bikesBought(inputs),
      residualValue: residualValueAtHorizon(inputs),
    },
    paybackMonths,
    breakEvenYear: rows.find((row) => row.cumulative.bikeTrue <= row.cumulative.transitTrue)?.year ?? null,
  };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/model/costs.test.ts && npx tsc`
Expected: PASS, no type errors.

- [ ] **Step 5: Commit**

```bash
git add src/model/costs.ts src/model/costs.test.ts
git commit -m "feat: add transit and bike true-cost model

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Mortality and life expectancy

**Files:**
- Create: `src/model/mortality.ts`
- Test: `src/model/mortality.test.ts`

**Interfaces:**
- Consumes: `kmPerYear`, `weeklyCyclingMinutes` (commute.ts); `Inputs`, `LifeExpectancyResults`, `Sex` (types.ts).
- Produces: `MORTALITY`, `Hazard`, `gompertzHazard(params, age)`, `baselineHazard(sex: Sex): Hazard`, `remainingLifeExpectancy(hazard: Hazard, fromAge: number): number`, `heatRiskReduction(weeklyMinutes: number): number`, `annualCrashHazard(inputs: Inputs): number`, `computeLifeExpectancy(inputs: Inputs): LifeExpectancyResults`.

- [ ] **Step 1: Write the failing tests**

`src/model/mortality.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { DEFAULT_INPUTS } from './defaults';
import {
  annualCrashHazard,
  baselineHazard,
  computeLifeExpectancy,
  heatRiskReduction,
  remainingLifeExpectancy,
} from './mortality';

describe('baseline mortality', () => {
  it('matches Eurostat 2024 life expectancy at birth', () => {
    expect(Math.abs(remainingLifeExpectancy(baselineHazard('male'), 0) - 78.9)).toBeLessThan(0.3);
    expect(Math.abs(remainingLifeExpectancy(baselineHazard('female'), 0) - 84.1)).toBeLessThan(0.3);
  });

  it('puts unspecified between male and female', () => {
    const unspecified = remainingLifeExpectancy(baselineHazard('unspecified'), 0);
    expect(unspecified).toBeGreaterThan(78.9);
    expect(unspecified).toBeLessThan(84.1);
  });

  it('gives the expected remaining years at 35', () => {
    expect(remainingLifeExpectancy(baselineHazard('unspecified'), 35)).toBeCloseTo(47.65, 2);
  });

  it('rises with age', () => {
    const hazard = baselineHazard('male');
    expect(hazard(60)).toBeGreaterThan(hazard(40));
  });
});

describe('heatRiskReduction', () => {
  it('is 10% per 100 minutes, capped at 45%', () => {
    expect(heatRiskReduction(0)).toBe(0);
    expect(heatRiskReduction(100)).toBeCloseTo(0.1, 10);
    expect(heatRiskReduction(300)).toBeCloseTo(0.3, 10);
    expect(heatRiskReduction(450)).toBeCloseTo(0.45, 10);
    expect(heatRiskReduction(1000)).toBe(0.45);
  });
});

describe('annualCrashHazard', () => {
  it('is km per year times the fatality rate', () => {
    expect(annualCrashHazard(DEFAULT_INPUTS)).toBeCloseTo(3680 * 15e-9, 15);
  });
});

describe('computeLifeExpectancy', () => {
  it('nets the activity benefit against crash risk for defaults', () => {
    const result = computeLifeExpectancy(DEFAULT_INPUTS);
    expect(result.riskReduction).toBeCloseTo(0.2359, 4);
    expect(result.activityGainYears).toBeCloseTo(0.0677, 4);
    expect(result.crashLossYears).toBeCloseTo(0.0125, 4);
    expect(result.netGainYears).toBeCloseTo(0.0552, 4);
    expect(result.netGainYears).toBeCloseTo(result.activityGainYears - result.crashLossYears, 10);
    expect(result.outsideHeatAgeRange).toBe(false);
  });

  it('grows with a longer horizon', () => {
    expect(computeLifeExpectancy({ ...DEFAULT_INPUTS, horizonYears: 30 }).netGainYears).toBeCloseTo(0.727, 2);
  });

  it('counts no activity benefit above 64 but still counts crash risk', () => {
    const result = computeLifeExpectancy({ ...DEFAULT_INPUTS, age: 70 });
    expect(result.activityGainYears).toBe(0);
    expect(result.crashLossYears).toBeGreaterThan(0);
    expect(result.outsideHeatAgeRange).toBe(true);
  });

  it('flags horizons that run past 64 but still counts the years before', () => {
    const result = computeLifeExpectancy({ ...DEFAULT_INPUTS, age: 60, horizonYears: 10 });
    expect(result.outsideHeatAgeRange).toBe(true);
    expect(result.activityGainYears).toBeGreaterThan(0);
  });

  it('has no crash loss with a zero fatality rate', () => {
    expect(computeLifeExpectancy({ ...DEFAULT_INPUTS, cyclistFatalityPerBillionKm: 0 }).crashLossYears).toBe(0);
  });

  it('changes nothing with zero trips', () => {
    expect(computeLifeExpectancy({ ...DEFAULT_INPUTS, tripsPerWeek: 0 }).netGainYears).toBe(0);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/model/mortality.test.ts`
Expected: FAIL — cannot resolve `./mortality`.

- [ ] **Step 3: Implement**

`src/model/mortality.ts`:
```ts
import { kmPerYear, weeklyCyclingMinutes } from './commute';
import type { Inputs, LifeExpectancyResults, Sex } from './types';

export interface GompertzMakeham {
  lambda: number;
  alpha: number;
  beta: number;
}

/**
 * Annual hazard h(a) = lambda + alpha·e^(beta·a). Fitted so remainingLifeExpectancy(…, 0) matches
 * Eurostat 2024 EU life expectancy at birth (demo_mlexpec): male 78.9, female 84.1.
 */
export const MORTALITY: Record<'male' | 'female', GompertzMakeham> = {
  male: { lambda: 0.0005, alpha: 4.635e-5, beta: 0.087 },
  female: { lambda: 0.0003, alpha: 1.71e-5, beta: 0.095 },
};

export const MAX_AGE = 110;
/** WHO HEAT: all-cause mortality RR 0.90 per 100 min/week of cycling (Kelly et al. 2014), capped at 45%. */
export const HEAT_REDUCTION_PER_100_MIN = 0.1;
export const HEAT_MAX_REDUCTION = 0.45;
export const HEAT_MIN_AGE = 20;
export const HEAT_MAX_AGE = 64;

export type Hazard = (age: number) => number;

export function gompertzHazard(params: GompertzMakeham, age: number): number {
  return params.lambda + params.alpha * Math.exp(params.beta * age);
}

export function baselineHazard(sex: Sex): Hazard {
  if (sex === 'unspecified') {
    return (age) => (gompertzHazard(MORTALITY.male, age) + gompertzHazard(MORTALITY.female, age)) / 2;
  }
  const params = MORTALITY[sex];
  return (age) => gompertzHazard(params, age);
}

/** e(x) = 0.5 + Σ_{t≥1} S(x+t)/S(x), with annual steps up to MAX_AGE. */
export function remainingLifeExpectancy(hazard: Hazard, fromAge: number): number {
  let survival = 1;
  let years = 0.5;
  for (let age = fromAge; age < MAX_AGE; age++) {
    survival *= Math.exp(-hazard(age));
    years += survival;
  }
  return years;
}

export function heatRiskReduction(weeklyMinutes: number): number {
  return Math.min((HEAT_REDUCTION_PER_100_MIN * weeklyMinutes) / 100, HEAT_MAX_REDUCTION);
}

/** Extra annual probability of dying in a cycling crash. */
export function annualCrashHazard(inputs: Inputs): number {
  return (kmPerYear(inputs) * inputs.cyclistFatalityPerBillionKm) / 1e9;
}

export function computeLifeExpectancy(inputs: Inputs): LifeExpectancyResults {
  const base = baselineHazard(inputs.sex);
  const reduction = heatRiskReduction(weeklyCyclingMinutes(inputs));
  const crash = annualCrashHazard(inputs);
  const lastCommuteAge = inputs.age + inputs.horizonYears - 1;
  const commuting = (age: number) => age >= inputs.age && age <= lastCommuteAge;
  const heatApplies = (age: number) => age >= HEAT_MIN_AGE && age <= HEAT_MAX_AGE;

  const activityOnly: Hazard = (age) => base(age) * (commuting(age) && heatApplies(age) ? 1 - reduction : 1);
  const withCrashes: Hazard = (age) => activityOnly(age) + (commuting(age) ? crash : 0);

  const baseline = remainingLifeExpectancy(base, inputs.age);
  const withActivity = remainingLifeExpectancy(activityOnly, inputs.age);
  const withCycling = remainingLifeExpectancy(withCrashes, inputs.age);

  return {
    baselineRemainingYears: baseline,
    activityGainYears: withActivity - baseline,
    crashLossYears: withActivity - withCycling,
    netGainYears: withCycling - baseline,
    riskReduction: reduction,
    outsideHeatAgeRange: inputs.age < HEAT_MIN_AGE || lastCommuteAge > HEAT_MAX_AGE,
  };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/model/mortality.test.ts && npx tsc`
Expected: PASS, no type errors.

- [ ] **Step 5: Commit**

```bash
git add src/model/mortality.ts src/model/mortality.test.ts
git commit -m "feat: add HEAT-based life expectancy model with crash risk

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Fitness model

**Files:**
- Create: `src/model/fitness.ts`
- Test: `src/model/fitness.test.ts`

**Interfaces:**
- Consumes: `weeklyCyclingMinutes` (commute.ts); `FitnessLevel`, `FitnessPoint`, `FitnessResults`, `Inputs`, `Sex` (types.ts).
- Produces: `PAR_BY_FITNESS`, `YEAR1_GAIN`, `sexCode(sex)`, `bmi(weightKg, heightCm)`, `jacksonVo2max(age, sex, bmiValue, par): number`, `fitnessAge(vo2max, sex): number`, `computeFitness(inputs: Inputs): FitnessResults`.

- [ ] **Step 1: Write the failing tests**

`src/model/fitness.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { weeklyCyclingMinutes } from './commute';
import { DEFAULT_INPUTS } from './defaults';
import { bmi, computeFitness, fitnessAge, jacksonVo2max } from './fitness';

describe('jacksonVo2max', () => {
  it('matches a hand-computed example', () => {
    // 56.363 + 1.921·5 − 0.381·40 − 0.754·25 + 10.987
    expect(jacksonVo2max(40, 'male', 25, 5)).toBeCloseTo(42.865, 3);
    expect(jacksonVo2max(40, 'female', 25, 5)).toBeCloseTo(31.878, 3);
  });
});

describe('bmi', () => {
  it('is weight over height squared', () => {
    expect(bmi(75, 175)).toBeCloseTo(24.49, 2);
  });
});

describe('fitnessAge', () => {
  it('inverts the Jackson equation for an average person', () => {
    expect(fitnessAge(jacksonVo2max(50, 'female', 24, 3), 'female')).toBeCloseTo(50, 6);
  });

  it('clamps to 18–90', () => {
    expect(fitnessAge(80, 'male')).toBe(18);
    expect(fitnessAge(0, 'male')).toBe(90);
  });
});

describe('computeFitness', () => {
  const result = computeFitness(DEFAULT_INPUTS);

  it('starts both modes at the baseline estimate', () => {
    expect(result.baselineVo2max).toBeCloseTo(35.819, 3);
    expect(result.points).toHaveLength(6);
    expect(result.points[0]).toEqual({ year: 0, transit: result.baselineVo2max, bike: result.baselineVo2max });
    expect(result.currentFitnessAge).toBeCloseTo(35.97, 2);
  });

  it('declines without cycling and improves then declines slower with cycling', () => {
    expect(result.points[5].transit).toBeCloseTo(34.0637, 3);
    expect(result.points[5].bike).toBeCloseTo(36.8636, 3);
    expect(result.fitnessAgeAtEnd.bike).toBeLessThan(result.fitnessAgeAtEnd.transit);
  });

  it('gives athletes no first-year gain', () => {
    const athlete = computeFitness({ ...DEFAULT_INPUTS, fitness: 'athlete' });
    expect(athlete.points[1].bike).toBeCloseTo(athlete.baselineVo2max, 10);
  });

  it('scales the gain with dose below 150 minutes', () => {
    const inputs = { ...DEFAULT_INPUTS, tripsPerWeek: 2 };
    const low = computeFitness(inputs);
    const expectedGain = 0.05 * (weeklyCyclingMinutes(inputs) / 150);
    expect(low.points[1].bike).toBeCloseTo(low.baselineVo2max * (1 + expectedGain), 10);
  });

  it('treats zero trips as no cycling', () => {
    const none = computeFitness({ ...DEFAULT_INPUTS, tripsPerWeek: 0 });
    for (const point of none.points) expect(point.bike).toBe(point.transit);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/model/fitness.test.ts`
Expected: FAIL — cannot resolve `./fitness`.

- [ ] **Step 3: Implement**

`src/model/fitness.ts`:
```ts
import { weeklyCyclingMinutes } from './commute';
import type { FitnessLevel, FitnessPoint, FitnessResults, Inputs, Sex } from './types';

/** Jackson et al. (1990) physical-activity rating (0–7) assumed for each fitness level. */
export const PAR_BY_FITNESS: Record<FitnessLevel, number> = {
  sedentary: 1,
  light: 2,
  moderate: 3,
  active: 5,
  athlete: 7,
};

/** Relative VO2max gain after a year of ≥150 min/week; anchored to Hendriksen et al. (2000): +6% in men. */
export const YEAR1_GAIN: Record<FitnessLevel, number> = {
  sedentary: 0.1,
  light: 0.07,
  moderate: 0.05,
  active: 0.02,
  athlete: 0,
};

export const FULL_DOSE_WEEKLY_MINUTES = 150;
export const INACTIVE_ANNUAL_DECLINE = 0.01;
export const ACTIVE_ANNUAL_DECLINE = 0.005;
const AVERAGE_BMI = 24;
const AVERAGE_PAR = 3;
const AGE_COEFFICIENT = 0.381;
const FITNESS_AGE_MIN = 18;
const FITNESS_AGE_MAX = 90;

export function sexCode(sex: Sex): number {
  if (sex === 'male') return 1;
  if (sex === 'female') return 0;
  return 0.5;
}

export function bmi(weightKg: number, heightCm: number): number {
  return weightKg / (heightCm / 100) ** 2;
}

/** Jackson et al. (1990) non-exercise VO2max estimate in ml/kg/min (BMI model). */
export function jacksonVo2max(age: number, sex: Sex, bmiValue: number, par: number): number {
  return 56.363 + 1.921 * par - AGE_COEFFICIENT * age - 0.754 * bmiValue + 10.987 * sexCode(sex);
}

/** Age at which an average person of the same sex (BMI 24, activity rating 3) has this VO2max. */
export function fitnessAge(vo2max: number, sex: Sex): number {
  const age = (jacksonVo2max(0, sex, AVERAGE_BMI, AVERAGE_PAR) - vo2max) / AGE_COEFFICIENT;
  return Math.min(FITNESS_AGE_MAX, Math.max(FITNESS_AGE_MIN, age));
}

export function computeFitness(inputs: Inputs): FitnessResults {
  const baseline = jacksonVo2max(
    inputs.age,
    inputs.sex,
    bmi(inputs.weightKg, inputs.heightCm),
    PAR_BY_FITNESS[inputs.fitness],
  );
  const minutes = weeklyCyclingMinutes(inputs);
  const gain = YEAR1_GAIN[inputs.fitness] * Math.min(minutes / FULL_DOSE_WEEKLY_MINUTES, 1);

  const points: FitnessPoint[] = [{ year: 0, transit: baseline, bike: baseline }];
  for (let year = 1; year <= inputs.horizonYears; year++) {
    const transit = baseline * (1 - INACTIVE_ANNUAL_DECLINE) ** year;
    const bike = minutes > 0 ? baseline * (1 + gain) * (1 - ACTIVE_ANNUAL_DECLINE) ** (year - 1) : transit;
    points.push({ year, transit, bike });
  }

  const last = points[points.length - 1];
  return {
    baselineVo2max: baseline,
    points,
    currentFitnessAge: fitnessAge(baseline, inputs.sex),
    fitnessAgeAtEnd: { transit: fitnessAge(last.transit, inputs.sex), bike: fitnessAge(last.bike, inputs.sex) },
  };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/model/fitness.test.ts && npx tsc`
Expected: PASS, no type errors.

- [ ] **Step 5: Commit**

```bash
git add src/model/fitness.ts src/model/fitness.test.ts
git commit -m "feat: add VO2max fitness projection and fitness age

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Well-being and computeAll

**Files:**
- Create: `src/model/wellbeing.ts`, `src/model/compute.ts`
- Test: `src/model/wellbeing.test.ts`, `src/model/compute.test.ts`

**Interfaces:**
- Consumes: `netKcalPerTrip` (calories.ts); `tripsPerYear`, `weeklyCyclingMinutes` (commute.ts); `computeCosts` (costs.ts); `computeLifeExpectancy` (mortality.ts); `computeFitness` (fitness.ts); `Inputs`, `Results`, `WellbeingResults` (types.ts).
- Produces: `computeWellbeing(inputs: Inputs): WellbeingResults`, `computeAll(inputs: Inputs): Results` — the only model function the UI calls.

- [ ] **Step 1: Write the failing tests**

`src/model/wellbeing.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { DEFAULT_INPUTS } from './defaults';
import { computeWellbeing } from './wellbeing';

describe('computeWellbeing', () => {
  it('compares weekly minutes with the WHO 150-minute minimum', () => {
    const result = computeWellbeing(DEFAULT_INPUTS);
    expect(result.weeklyActiveMinutes).toBeCloseTo(235.897, 3);
    expect(result.whoGuidelinePct).toBeCloseTo(157.265, 3);
  });

  it('reports yearly net kcal and its body-fat equivalent', () => {
    const result = computeWellbeing(DEFAULT_INPUTS);
    expect(result.netKcalPerYear).toBeCloseTo(70702.7, 1);
    expect(result.fatEquivalentKg).toBeCloseTo(9.182, 3);
  });
});
```

`src/model/compute.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { computeAll } from './compute';
import { DEFAULT_INPUTS } from './defaults';

describe('computeAll', () => {
  it('returns every result section sized to the horizon', () => {
    const results = computeAll({ ...DEFAULT_INPUTS, horizonYears: 7 });
    expect(results.costs.rows).toHaveLength(7);
    expect(results.fitness.points).toHaveLength(8);
    expect(results.lifeExpectancy.baselineRemainingYears).toBeGreaterThan(0);
    expect(results.wellbeing.netKcalPerYear).toBeCloseTo(
      results.costs.tripsPerYear * results.costs.netKcalPerTrip,
      6,
    );
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/model/wellbeing.test.ts src/model/compute.test.ts`
Expected: FAIL — cannot resolve `./wellbeing` and `./compute`.

- [ ] **Step 3: Implement**

`src/model/wellbeing.ts`:
```ts
import { netKcalPerTrip } from './calories';
import { tripsPerYear, weeklyCyclingMinutes } from './commute';
import type { Inputs, WellbeingResults } from './types';

/** WHO (2020): adults should do 150–300 minutes of moderate activity a week. */
export const WHO_MIN_WEEKLY_MINUTES = 150;
export const WHO_MAX_WEEKLY_MINUTES = 300;
export const KCAL_PER_KG_FAT = 7700;

export function computeWellbeing(inputs: Inputs): WellbeingResults {
  const minutes = weeklyCyclingMinutes(inputs);
  const kcal = tripsPerYear(inputs) * netKcalPerTrip(inputs);
  return {
    weeklyActiveMinutes: minutes,
    whoGuidelinePct: (minutes / WHO_MIN_WEEKLY_MINUTES) * 100,
    netKcalPerYear: kcal,
    fatEquivalentKg: kcal / KCAL_PER_KG_FAT,
  };
}
```

`src/model/compute.ts`:
```ts
import { computeCosts } from './costs';
import { computeFitness } from './fitness';
import { computeLifeExpectancy } from './mortality';
import type { Inputs, Results } from './types';
import { computeWellbeing } from './wellbeing';

export function computeAll(inputs: Inputs): Results {
  return {
    costs: computeCosts(inputs),
    lifeExpectancy: computeLifeExpectancy(inputs),
    fitness: computeFitness(inputs),
    wellbeing: computeWellbeing(inputs),
  };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/model && npx tsc`
Expected: all model tests PASS, no type errors.

- [ ] **Step 5: Commit**

```bash
git add src/model/wellbeing.ts src/model/wellbeing.test.ts src/model/compute.ts src/model/compute.test.ts
git commit -m "feat: add well-being metrics and computeAll entry point

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: URL state and the useInputs hook

**Files:**
- Create: `src/state/urlState.ts`, `src/state/useInputs.ts`
- Test: `src/state/urlState.test.ts`, `src/state/useInputs.test.ts`

**Interfaces:**
- Consumes: `DEFAULT_INPUTS`, `FIELD_SPECS`, `FieldSpec`, `isValidNumber`, `isValidSelect` (defaults.ts); `Inputs`, `SetInput` (types.ts).
- Produces:
  - `inputsToSearch(inputs: Inputs): string` (no leading `?`), `hasInputParams(search: string): boolean`, `inputsFromSearch(search: string): Inputs`, `sanitizeInputs(raw: unknown): Inputs`
  - `STORAGE_KEY = 'bikecalcx:inputs:v1'`, `PERSIST_DEBOUNCE_MS = 300`, `loadInitialInputs(search: string, storage: Storage | null): Inputs`, `buildShareUrl(location: { origin: string; pathname: string }, inputs: Inputs): string`, `useInputs(): { inputs: Inputs; setInput: SetInput; reset: () => void; shareUrl: string }`

- [ ] **Step 1: Write the failing tests**

`src/state/urlState.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { DEFAULT_INPUTS } from '../model/defaults';
import type { Inputs } from '../model/types';
import { hasInputParams, inputsFromSearch, inputsToSearch, sanitizeInputs } from './urlState';

describe('inputsToSearch', () => {
  it('is empty for defaults', () => {
    expect(inputsToSearch(DEFAULT_INPUTS)).toBe('');
  });

  it('writes only changed fields, in field order', () => {
    expect(inputsToSearch({ ...DEFAULT_INPUTS, sex: 'female', tripsPerWeek: 5 })).toBe('tw=5&sx=female');
  });
});

describe('inputsFromSearch', () => {
  it('round-trips', () => {
    const inputs: Inputs = {
      ...DEFAULT_INPUTS,
      horizonYears: 12,
      distanceKm: 12.5,
      fitness: 'athlete',
      valueOfTimePerHour: 0,
    };
    expect(inputsFromSearch(`?${inputsToSearch(inputs)}`)).toEqual(inputs);
  });

  it('falls back to defaults for invalid values per field', () => {
    expect(inputsFromSearch('?tw=abc&dk=999&sx=robot&hy=7&ag=')).toEqual({ ...DEFAULT_INPUTS, horizonYears: 7 });
  });

  it('rejects fractions for whole-number fields', () => {
    expect(inputsFromSearch('?tw=2.5').tripsPerWeek).toBe(DEFAULT_INPUTS.tripsPerWeek);
  });
});

describe('hasInputParams', () => {
  it('detects known keys only', () => {
    expect(hasInputParams('?hy=3')).toBe(true);
    expect(hasInputParams('?utm_source=newsletter')).toBe(false);
    expect(hasInputParams('')).toBe(false);
  });
});

describe('sanitizeInputs', () => {
  it('returns defaults for non-objects', () => {
    expect(sanitizeInputs(null)).toEqual(DEFAULT_INPUTS);
    expect(sanitizeInputs('nope')).toEqual(DEFAULT_INPUTS);
  });

  it('keeps valid fields and drops invalid or unknown ones', () => {
    expect(sanitizeInputs({ tripsPerWeek: 4, weightKg: 'heavy', sex: 'male', extra: 1 })).toEqual({
      ...DEFAULT_INPUTS,
      tripsPerWeek: 4,
      sex: 'male',
    });
  });
});
```

`src/state/useInputs.test.ts`:
```ts
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/state`
Expected: FAIL — cannot resolve `./urlState` and `./useInputs`.

- [ ] **Step 3: Implement**

`src/state/urlState.ts`:
```ts
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
```

`src/state/useInputs.ts`:
```ts
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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/state && npx tsc`
Expected: PASS, no type errors.

- [ ] **Step 5: Commit**

```bash
git add src/state
git commit -m "feat: persist inputs to share URL and localStorage

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Input components

**Files:**
- Create: `src/components/NumberField.tsx`, `src/components/SelectField.tsx`, `src/components/InputPanel.tsx`
- Test: `src/components/InputPanel.test.tsx`

**Interfaces:**
- Consumes: `FIELD_SPECS`, `FieldGroup`, `FieldSpec`, `NumberFieldSpec`, `SelectFieldSpec`, `getNumberSpec`, `isValidNumber`, `rangeMessage`, `DEFAULT_INPUTS` (defaults.ts); `Inputs`, `SetInput` (types.ts); `pluralYears` (format.ts).
- Produces:
  - `parseNumber(text: string): number` and `NumberField({ spec, value, onChange })` — `value` only seeds the draft; parents remount (via `key`) to reset it.
  - `SelectField({ spec, value, onChange })`
  - `InputPanel({ inputs, setInput, onReset, shareUrl })`
  - CSS class names used: `input-panel`, `field`, `horizon`, `unit`, `hint`, `error`, `advanced`, `actions`, `secondary`, `status`.

- [ ] **Step 1: Write the failing tests**

`src/components/InputPanel.test.tsx`:
```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_INPUTS } from '../model/defaults';
import { InputPanel } from './InputPanel';
import { parseNumber } from './NumberField';

function setup() {
  const props = {
    inputs: DEFAULT_INPUTS,
    setInput: vi.fn(),
    onReset: vi.fn(),
    shareUrl: 'https://example.com/?tw=6',
  };
  const user = userEvent.setup();
  render(<InputPanel {...props} />);
  return { ...props, user };
}

describe('parseNumber', () => {
  it('accepts a decimal comma and rejects blanks', () => {
    expect(parseNumber('7,5')).toBe(7.5);
    expect(parseNumber(' 12 ')).toBe(12);
    expect(parseNumber('')).toBeNaN();
  });
});

describe('InputPanel', () => {
  it('shows current values', () => {
    setup();
    expect(screen.getByRole('slider')).toHaveValue('5');
    expect(screen.getByLabelText(/one-way distance/i)).toHaveValue('8');
    expect(screen.getByLabelText(/^sex/i)).toHaveValue('unspecified');
  });

  it('reports valid numbers', async () => {
    const { user, setInput } = setup();
    const field = screen.getByLabelText(/one-way distance/i);
    await user.clear(field);
    await user.type(field, '12');
    expect(setInput).toHaveBeenLastCalledWith('distanceKm', 12);
  });

  it('accepts a decimal comma', async () => {
    const { user, setInput } = setup();
    const field = screen.getByLabelText(/one-way distance/i);
    await user.clear(field);
    await user.type(field, '7,5');
    expect(setInput).toHaveBeenLastCalledWith('distanceKm', 7.5);
  });

  it('shows an error and does not report out-of-range values', async () => {
    const { user, setInput } = setup();
    const field = screen.getByLabelText(/one-way distance/i);
    await user.clear(field);
    await user.type(field, '999');
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a number from 0.5 to 60');
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(setInput).not.toHaveBeenCalledWith('distanceKm', 999);
  });

  it('reports slider changes', () => {
    const { setInput } = setup();
    fireEvent.change(screen.getByRole('slider'), { target: { value: '12' } });
    expect(setInput).toHaveBeenCalledWith('horizonYears', 12);
  });

  it('reports select changes', async () => {
    const { user, setInput } = setup();
    await user.selectOptions(screen.getByLabelText(/fitness level/i), 'athlete');
    expect(setInput).toHaveBeenCalledWith('fitness', 'athlete');
  });

  it('resets', async () => {
    const { user, onReset } = setup();
    await user.click(screen.getByRole('button', { name: /reset to defaults/i }));
    expect(onReset).toHaveBeenCalledOnce();
  });

  it('copies the share link', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: /copy share link/i }));
    expect(await screen.findByText('Link copied')).toBeInTheDocument();
    await expect(navigator.clipboard.readText()).resolves.toBe('https://example.com/?tw=6');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/components/InputPanel.test.tsx`
Expected: FAIL — cannot resolve `./InputPanel`.

- [ ] **Step 3: Implement**

`src/components/NumberField.tsx`:
```tsx
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
```

`src/components/SelectField.tsx`:
```tsx
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
```

`src/components/InputPanel.tsx`:
```tsx
import { useState } from 'react';
import { pluralYears } from '../format';
import { FIELD_SPECS, getNumberSpec } from '../model/defaults';
import type { FieldGroup, FieldSpec } from '../model/defaults';
import type { Inputs, SetInput } from '../model/types';
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
}

type CopyStatus = 'idle' | 'copied' | 'failed';

const COPY_MESSAGES: Record<CopyStatus, string> = {
  idle: '',
  copied: 'Link copied',
  failed: 'Could not copy. Use the address bar instead.',
};

export function InputPanel({ inputs, setInput, onReset, shareUrl }: InputPanelProps) {
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle');
  const horizon = getNumberSpec('horizonYears');

  const renderField = (spec: FieldSpec) =>
    spec.kind === 'number' ? (
      <NumberField
        key={spec.key}
        spec={spec}
        value={inputs[spec.key]}
        onChange={(value) => setInput(spec.key, value)}
      />
    ) : (
      <SelectField
        key={spec.key}
        spec={spec}
        value={inputs[spec.key]}
        onChange={(value) => setInput(spec.key, value as Inputs[typeof spec.key])}
      />
    );

  const fieldsIn = (group: FieldGroup) => FIELD_SPECS.filter((spec) => spec.group === group).map(renderField);

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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/components/InputPanel.test.tsx && npx tsc`
Expected: PASS, no type errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/NumberField.tsx src/components/SelectField.tsx src/components/InputPanel.tsx src/components/InputPanel.test.tsx
git commit -m "feat: add validated input panel with share and reset

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Cost result components

**Files:**
- Create: `src/components/SummaryCards.tsx`, `src/components/CumulativeChart.tsx`, `src/components/BreakdownChart.tsx`
- Test: `src/components/SummaryCards.test.tsx`, `src/components/CumulativeChart.test.tsx`, `src/components/BreakdownChart.test.tsx`

**Interfaces:**
- Consumes: `CostResults`, `CumulativeTotals`, `YearRow` (types.ts); `formatEuro`, `formatEuroCompact`, `formatNumber`, `formatPayback`, `pluralYears` (format.ts); `AXIS_PROPS`, `TOOLTIP_PROPS`, `renderLegendLabel` (components/chartTheme.tsx); `RESULTS_FIXTURE` (test/fixtures.ts, tests only).
- Produces: `SummaryCards({ costs, horizonYears })`, `CumulativeChart({ rows })` + `cumulativeSeries(rows)`, `BreakdownChart({ rows })` + `breakdownTotals(rows)`.
- CSS class names used: `summary`, `headline`, `subhead`, `stat-grid`, `stat-tile`, `stat-label`, `stat-value`, `stat-detail`, `facts`, `panel`, `chart`, `chart-summary`, `legend-label`, `breakdown-table`.

Chart rules (from the dataviz guidance): 2px lines, no dots; solid horizontal-only hairline grid; legend for every multi-series chart with labels in text colour (never series colour); bars ≤24px thick with a 2px surface-coloured gap between stacked segments; a text or table equivalent for every chart. Colours: cumulative and fitness lines use `--series-bike` / `--series-transit`; breakdown categories use `--series-1…5` in the fixed order Time, Tickets, Depreciation, Care, Food (validated palette order).

- [ ] **Step 1: Write the failing tests**

`src/components/SummaryCards.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RESULTS_FIXTURE } from '../test/fixtures';
import { SummaryCards } from './SummaryCards';

const costs = RESULTS_FIXTURE.costs;

describe('SummaryCards', () => {
  it('leads with cycling savings', () => {
    render(<SummaryCards costs={costs} horizonYears={2} />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Cycling saves €448 over 2 years');
  });

  it('flips the headline when public transport is cheaper', () => {
    render(<SummaryCards costs={{ ...costs, totals: { ...costs.totals, savings: -300 } }} horizonYears={1} />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Public transport saves €300 over 1 year');
  });

  it('shows totals, payback, hours and facts', () => {
    render(<SummaryCards costs={costs} horizonYears={2} />);
    expect(screen.getByText('€9,042')).toBeInTheDocument();
    expect(screen.getByText('€9,490')).toBeInTheDocument();
    expect(screen.getByText('Never (money only)')).toBeInTheDocument();
    expect(screen.getByText('243 vs 268')).toBeInTheDocument();
    expect(screen.getByText(/A monthly pass is the cheaper way to pay for 460 trips a year/)).toBeInTheDocument();
    expect(screen.getByText(/Cycling is cheaper on true cost from year 1/)).toBeInTheDocument();
    expect(screen.getByText(/1 bike bought; the one you finish with is worth about €578/)).toBeInTheDocument();
  });

  it('explains when cycling never breaks even', () => {
    render(<SummaryCards costs={{ ...costs, breakEvenYear: null }} horizonYears={2} />);
    expect(screen.getByText(/does not become cheaper on true cost within 2 years/)).toBeInTheDocument();
  });
});
```

`src/components/CumulativeChart.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RESULTS_FIXTURE } from '../test/fixtures';
import { CumulativeChart, cumulativeSeries } from './CumulativeChart';

const rows = RESULTS_FIXTURE.costs.rows;

describe('cumulativeSeries', () => {
  it('starts at zero and adds one point per year', () => {
    const series = cumulativeSeries(rows);
    expect(series).toHaveLength(3);
    expect(series[0]).toEqual({ year: 0, transitTrue: 0, bikeTrue: 0, transitMoney: 0, bikeMoney: 0 });
    expect(series[2]).toEqual({ year: 2, ...rows[1].cumulative });
  });
});

describe('CumulativeChart', () => {
  it('summarises the final year in text', () => {
    render(<CumulativeChart rows={rows} />);
    expect(
      screen.getByText(
        'After 2 years: true cost €9,042 by bike vs €9,490 by public transport; money only €1,762 vs €1,440.',
      ),
    ).toBeInTheDocument();
  });
});
```

`src/components/BreakdownChart.test.tsx`:
```tsx
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RESULTS_FIXTURE } from '../test/fixtures';
import { BreakdownChart, breakdownTotals } from './BreakdownChart';

const rows = RESULTS_FIXTURE.costs.rows;

describe('breakdownTotals', () => {
  it('sums each category over the horizon', () => {
    expect(breakdownTotals(rows)).toEqual({
      bike: { capital: 222, care: 240, food: 1300, time: 7280, total: 9042 },
      transit: { tickets: 1440, time: 8050, total: 9490 },
    });
  });
});

describe('BreakdownChart', () => {
  it('renders a table with the totals', () => {
    render(<BreakdownChart rows={rows} />);
    const totalRow = screen.getByRole('row', { name: /total/i });
    expect(within(totalRow).getByText('€9,042')).toBeInTheDocument();
    expect(within(totalRow).getByText('€9,490')).toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: 'Extra food' })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/components/SummaryCards.test.tsx src/components/CumulativeChart.test.tsx src/components/BreakdownChart.test.tsx`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement the components**

`src/components/SummaryCards.tsx`:
```tsx
import { formatEuro, formatNumber, formatPayback, pluralYears } from '../format';
import type { CostResults } from '../model/types';

interface StatTileProps {
  label: string;
  value: string;
  detail: string;
}

function StatTile({ label, value, detail }: StatTileProps) {
  return (
    <div className="stat-tile">
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
      <p className="stat-detail">{detail}</p>
    </div>
  );
}

interface SummaryCardsProps {
  costs: CostResults;
  horizonYears: number;
}

export function SummaryCards({ costs, horizonYears }: SummaryCardsProps) {
  const period = pluralYears(horizonYears);
  const { savings } = costs.totals;
  const headline =
    savings >= 0
      ? `Cycling saves ${formatEuro(savings)} over ${period}`
      : `Public transport saves ${formatEuro(-savings)} over ${period}`;
  const ticketFact =
    costs.ticketStrategy === 'pass' ? 'A monthly pass is the cheaper way' : 'Single tickets are the cheaper way';
  const bikes = costs.bike.bikesBought === 1 ? '1 bike' : `${costs.bike.bikesBought} bikes`;

  return (
    <section className="summary" aria-labelledby="summary-heading">
      <h2 id="summary-heading" className="headline">
        {headline}
      </h2>
      <p className="subhead">True cost = money spent + time valued at your hourly rate.</p>
      <div className="stat-grid">
        <StatTile
          label="Bike true cost"
          value={formatEuro(costs.totals.bikeTrue)}
          detail={`${formatEuro(costs.perMonth.bikeTrue)} per month`}
        />
        <StatTile
          label="Public transport true cost"
          value={formatEuro(costs.totals.transitTrue)}
          detail={`${formatEuro(costs.perMonth.transitTrue)} per month`}
        />
        <StatTile
          label="Bike price paid back in"
          value={formatPayback(costs.paybackMonths)}
          detail={`From money savings alone, ${formatEuro(costs.bike.upfront)} upfront`}
        />
        <StatTile
          label="Hours commuting per year"
          value={`${formatNumber(costs.hoursPerYear.bike)} vs ${formatNumber(costs.hoursPerYear.transit)}`}
          detail="Bike including showering vs public transport"
        />
      </div>
      <ul className="facts">
        <li>
          {ticketFact} to pay for {formatNumber(costs.tripsPerYear)} trips a year.
        </li>
        <li>
          {costs.breakEvenYear === null
            ? `Cycling does not become cheaper on true cost within ${period}.`
            : `Cycling is cheaper on true cost from year ${costs.breakEvenYear}.`}
        </li>
        <li>
          {bikes} bought; the one you finish with is worth about {formatEuro(costs.bike.residualValue)}.
        </li>
      </ul>
    </section>
  );
}
```

`src/components/CumulativeChart.tsx`:
```tsx
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatEuro, formatEuroCompact, pluralYears } from '../format';
import type { CumulativeTotals, YearRow } from '../model/types';
import { AXIS_PROPS, renderLegendLabel, TOOLTIP_PROPS } from './chartTheme';

export function cumulativeSeries(rows: YearRow[]): (CumulativeTotals & { year: number })[] {
  return [
    { year: 0, transitTrue: 0, bikeTrue: 0, transitMoney: 0, bikeMoney: 0 },
    ...rows.map((row) => ({ year: row.year, ...row.cumulative })),
  ];
}

const LINES = [
  { key: 'bikeTrue', name: 'Bike, true cost', color: 'var(--series-bike)', dashed: false },
  { key: 'transitTrue', name: 'Public transport, true cost', color: 'var(--series-transit)', dashed: false },
  { key: 'bikeMoney', name: 'Bike, money only', color: 'var(--series-bike)', dashed: true },
  { key: 'transitMoney', name: 'Public transport, money only', color: 'var(--series-transit)', dashed: true },
] as const;

export function CumulativeChart({ rows }: { rows: YearRow[] }) {
  const last = rows[rows.length - 1];
  return (
    <section className="panel" aria-labelledby="cumulative-heading">
      <h2 id="cumulative-heading">Cumulative cost</h2>
      <p className="subhead">Solid lines include time; dashed lines are money only.</p>
      <div className="chart" role="img" aria-label="Line chart of cumulative cost by year. Summary below.">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={cumulativeSeries(rows)} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="var(--grid)" vertical={false} />
            <XAxis dataKey="year" tickFormatter={(year: number) => `Y${year}`} {...AXIS_PROPS} />
            <YAxis tickFormatter={(value: number) => formatEuroCompact(value)} width={64} {...AXIS_PROPS} />
            <Tooltip
              formatter={(value) => formatEuro(Number(value))}
              labelFormatter={(year) => `Year ${year}`}
              {...TOOLTIP_PROPS}
            />
            <Legend formatter={renderLegendLabel} />
            {LINES.map((line) => (
              <Line
                key={line.key}
                type="monotone"
                dataKey={line.key}
                name={line.name}
                stroke={line.color}
                strokeWidth={2}
                strokeDasharray={line.dashed ? '6 4' : undefined}
                dot={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="chart-summary">
        After {pluralYears(last.year)}: true cost {formatEuro(last.cumulative.bikeTrue)} by bike vs{' '}
        {formatEuro(last.cumulative.transitTrue)} by public transport; money only{' '}
        {formatEuro(last.cumulative.bikeMoney)} vs {formatEuro(last.cumulative.transitMoney)}.
      </p>
    </section>
  );
}
```

`src/components/BreakdownChart.tsx`:
```tsx
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatEuro, formatEuroCompact, pluralYears } from '../format';
import type { YearRow } from '../model/types';
import { AXIS_PROPS, renderLegendLabel, TOOLTIP_PROPS } from './chartTheme';

export interface BreakdownTotals {
  bike: { capital: number; care: number; food: number; time: number; total: number };
  transit: { tickets: number; time: number; total: number };
}

export function breakdownTotals(rows: YearRow[]): BreakdownTotals {
  const sum = (pick: (row: YearRow) => number) => rows.reduce((total, row) => total + pick(row), 0);
  const bike = {
    capital: sum((row) => row.bike.capital),
    care: sum((row) => row.bike.care),
    food: sum((row) => row.bike.food),
    time: sum((row) => row.bike.time),
  };
  const transit = { tickets: sum((row) => row.transit.tickets), time: sum((row) => row.transit.time) };
  return {
    bike: { ...bike, total: bike.capital + bike.care + bike.food + bike.time },
    transit: { ...transit, total: transit.tickets + transit.time },
  };
}

/** Fixed slot order (validated palette adjacency): Time, Tickets, Depreciation, Care, Food. */
const CATEGORIES = [
  { key: 'time', label: 'Time', color: 'var(--series-1)' },
  { key: 'tickets', label: 'Tickets', color: 'var(--series-2)' },
  { key: 'capital', label: 'Bike depreciation', color: 'var(--series-3)' },
  { key: 'care', label: 'Bike care', color: 'var(--series-4)' },
  { key: 'food', label: 'Extra food', color: 'var(--series-5)' },
] as const;

export function BreakdownChart({ rows }: { rows: YearRow[] }) {
  const totals = breakdownTotals(rows);
  const data = [
    { mode: 'Bike', time: totals.bike.time, tickets: 0, capital: totals.bike.capital, care: totals.bike.care, food: totals.bike.food },
    { mode: 'Public transport', time: totals.transit.time, tickets: totals.transit.tickets, capital: 0, care: 0, food: 0 },
  ];
  const dash = '—';

  return (
    <section className="panel" aria-labelledby="breakdown-heading">
      <h2 id="breakdown-heading">Where the money and time go</h2>
      <p className="subhead">Totals over {pluralYears(rows.length)}.</p>
      <div className="chart" role="img" aria-label="Stacked bar chart of cost categories. Values in the table below.">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="var(--grid)" horizontal={false} />
            <XAxis type="number" tickFormatter={(value: number) => formatEuroCompact(value)} {...AXIS_PROPS} />
            <YAxis type="category" dataKey="mode" width={120} {...AXIS_PROPS} />
            <Tooltip formatter={(value) => formatEuro(Number(value))} cursor={{ fill: 'var(--hover)' }} {...TOOLTIP_PROPS} />
            <Legend formatter={renderLegendLabel} />
            {CATEGORIES.map((category) => (
              <Bar
                key={category.key}
                dataKey={category.key}
                name={category.label}
                stackId="cost"
                fill={category.color}
                stroke="var(--surface)"
                strokeWidth={2}
                maxBarSize={24}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <table className="breakdown-table">
        <thead>
          <tr>
            <th scope="col">Category</th>
            <th scope="col">Bike</th>
            <th scope="col">Public transport</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">Time</th>
            <td>{formatEuro(totals.bike.time)}</td>
            <td>{formatEuro(totals.transit.time)}</td>
          </tr>
          <tr>
            <th scope="row">Tickets</th>
            <td>{dash}</td>
            <td>{formatEuro(totals.transit.tickets)}</td>
          </tr>
          <tr>
            <th scope="row">Bike depreciation</th>
            <td>{formatEuro(totals.bike.capital)}</td>
            <td>{dash}</td>
          </tr>
          <tr>
            <th scope="row">Bike care</th>
            <td>{formatEuro(totals.bike.care)}</td>
            <td>{dash}</td>
          </tr>
          <tr>
            <th scope="row">Extra food</th>
            <td>{formatEuro(totals.bike.food)}</td>
            <td>{dash}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">Total</th>
            <td>{formatEuro(totals.bike.total)}</td>
            <td>{formatEuro(totals.transit.total)}</td>
          </tr>
        </tfoot>
      </table>
    </section>
  );
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/components/SummaryCards.test.tsx src/components/CumulativeChart.test.tsx src/components/BreakdownChart.test.tsx && npx tsc`
Expected: PASS, no type errors. Recharts may log a "width(0) and height(0)" warning under jsdom; that is expected.

- [ ] **Step 5: Commit**

```bash
git add src/components/SummaryCards.tsx src/components/SummaryCards.test.tsx src/components/CumulativeChart.tsx src/components/CumulativeChart.test.tsx src/components/BreakdownChart.tsx src/components/BreakdownChart.test.tsx
git commit -m "feat: add cost summary, cumulative chart and breakdown

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Health and methodology components

**Files:**
- Create: `src/components/health/LifeExpectancy.tsx`, `src/components/health/FitnessChart.tsx`, `src/components/health/Wellbeing.tsx`, `src/components/health/HealthPanel.tsx`, `src/components/Methodology.tsx`
- Test: `src/components/health/HealthPanel.test.tsx`, `src/components/Methodology.test.tsx`

**Interfaces:**
- Consumes: `Inputs`, `Results`, `LifeExpectancyResults`, `FitnessResults`, `WellbeingResults` (types.ts); `formatLifeDelta`, `formatNumber`, `pluralYears` (format.ts); `AXIS_PROPS`, `TOOLTIP_PROPS`, `renderLegendLabel` (components/chartTheme.tsx, from Task 1); `RESULTS_FIXTURE`, `DEFAULT_INPUTS` (tests only).
- Produces: `HealthPanel({ results, inputs })`, `Methodology()`, `EVIDENCE`, `SOURCES`.
- CSS class names used: `panel`, `subhead`, `health-grid`, `health-card`, `big-figure`, `metric-list`, `note`, `chart`, `chart-summary`, `guideline-bar`, `guideline-fill`, `guideline-mark`, `hint`, `evidence`, `citation`, `methodology`, `sources`.

- [ ] **Step 1: Write the failing tests**

`src/components/health/HealthPanel.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DEFAULT_INPUTS } from '../../model/defaults';
import { RESULTS_FIXTURE } from '../../test/fixtures';
import { HealthPanel } from './HealthPanel';

const inputs = { ...DEFAULT_INPUTS, horizonYears: 2 };

describe('HealthPanel', () => {
  it('shows the net life-expectancy change and its parts', () => {
    render(<HealthPanel results={RESULTS_FIXTURE} inputs={inputs} />);
    expect(screen.getByText('+20 days')).toBeInTheDocument();
    expect(screen.getByText('+25 days')).toBeInTheDocument();
    expect(screen.getByText('−5 days')).toBeInTheDocument();
    expect(screen.getByText('24%')).toBeInTheDocument();
    expect(screen.queryByText(/outside ages 20–64/)).not.toBeInTheDocument();
  });

  it('explains the HEAT age range when relevant', () => {
    const results = {
      ...RESULTS_FIXTURE,
      lifeExpectancy: { ...RESULTS_FIXTURE.lifeExpectancy, outsideHeatAgeRange: true },
    };
    render(<HealthPanel results={results} inputs={inputs} />);
    expect(screen.getByText(/outside ages 20–64/)).toBeInTheDocument();
  });

  it('summarises fitness in text', () => {
    render(<HealthPanel results={RESULTS_FIXTURE} inputs={inputs} />);
    expect(
      screen.getByText(
        'After 2 years: 37.4 ml/kg/min by bike (fitness age 32) vs 35.1 by public transport (fitness age 38).',
      ),
    ).toBeInTheDocument();
  });

  it('shows well-being figures and three evidence cards', () => {
    const { container } = render(<HealthPanel results={RESULTS_FIXTURE} inputs={inputs} />);
    expect(screen.getByText(/236 minutes a week/)).toBeInTheDocument();
    expect(screen.getByText(/157% of the WHO minimum/)).toBeInTheDocument();
    expect(screen.getByText(/70,700 extra kcal a year/)).toBeInTheDocument();
    expect(container.querySelectorAll('.evidence li')).toHaveLength(3);
  });
});
```

`src/components/Methodology.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Methodology, SOURCES } from './Methodology';

describe('Methodology', () => {
  it('lists every source', () => {
    render(<Methodology />);
    expect(SOURCES).toHaveLength(12);
    for (const source of SOURCES) expect(screen.getByText(source)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/components/health src/components/Methodology.test.tsx`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement**

`src/components/health/LifeExpectancy.tsx`:
```tsx
import { formatLifeDelta, formatNumber, pluralYears } from '../../format';
import type { LifeExpectancyResults } from '../../model/types';

interface LifeExpectancyProps {
  lifeExpectancy: LifeExpectancyResults;
  age: number;
  horizonYears: number;
}

export function LifeExpectancy({ lifeExpectancy: le, age, horizonYears }: LifeExpectancyProps) {
  return (
    <div className="health-card">
      <h3>Life expectancy</h3>
      <p className="big-figure">{formatLifeDelta(le.netGainYears)}</p>
      <p>
        Expected net change in lifespan from cycling for {pluralYears(horizonYears)}, starting at age {age}.
      </p>
      <dl className="metric-list">
        <div>
          <dt>Gain from physical activity</dt>
          <dd>{formatLifeDelta(le.activityGainYears)}</dd>
        </div>
        <div>
          <dt>Loss from crash risk</dt>
          <dd>{formatLifeDelta(-le.crashLossYears)}</dd>
        </div>
        <div>
          <dt>Lower risk of death while commuting</dt>
          <dd>{formatNumber(le.riskReduction * 100)}%</dd>
        </div>
        <div>
          <dt>Remaining life expectancy without cycling</dt>
          <dd>{formatNumber(le.baselineRemainingYears, 1)} years</dd>
        </div>
      </dl>
      {le.outsideHeatAgeRange && (
        <p className="note">
          Part of this period falls outside ages 20–64. WHO HEAT counts the activity benefit only for those ages, so
          the other years count crash risk but no benefit.
        </p>
      )}
    </div>
  );
}
```

`src/components/health/FitnessChart.tsx`:
```tsx
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatNumber, pluralYears } from '../../format';
import type { FitnessResults } from '../../model/types';
import { AXIS_PROPS, renderLegendLabel, TOOLTIP_PROPS } from '../chartTheme';

export function FitnessChart({ fitness }: { fitness: FitnessResults }) {
  const last = fitness.points[fitness.points.length - 1];
  return (
    <div className="health-card">
      <h3>Aerobic fitness (VO₂max)</h3>
      <p>
        Estimated today: <strong>{formatNumber(fitness.baselineVo2max, 1)} ml/kg/min</strong>, a fitness age of{' '}
        {formatNumber(fitness.currentFitnessAge)}.
      </p>
      <div className="chart" role="img" aria-label="Line chart of estimated VO2max by year. Summary below.">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={fitness.points} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="var(--grid)" vertical={false} />
            <XAxis dataKey="year" tickFormatter={(year: number) => `Y${year}`} {...AXIS_PROPS} />
            <YAxis domain={['auto', 'auto']} tickFormatter={(value: number) => formatNumber(value)} width={40} {...AXIS_PROPS} />
            <Tooltip
              formatter={(value) => `${formatNumber(Number(value), 1)} ml/kg/min`}
              labelFormatter={(year) => `Year ${year}`}
              {...TOOLTIP_PROPS}
            />
            <Legend formatter={renderLegendLabel} />
            <Line type="monotone" dataKey="bike" name="Bike commuting" stroke="var(--series-bike)" strokeWidth={2} dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="transit" name="Public transport" stroke="var(--series-transit)" strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="chart-summary">
        After {pluralYears(last.year)}: {formatNumber(last.bike, 1)} ml/kg/min by bike (fitness age{' '}
        {formatNumber(fitness.fitnessAgeAtEnd.bike)}) vs {formatNumber(last.transit, 1)} by public transport (fitness
        age {formatNumber(fitness.fitnessAgeAtEnd.transit)}).
      </p>
    </div>
  );
}
```

`src/components/health/Wellbeing.tsx`:
```tsx
import { formatNumber } from '../../format';
import type { WellbeingResults } from '../../model/types';

const WHO_MAX_WEEKLY_MINUTES = 300;

export const EVIDENCE = [
  {
    finding: 'People who switched from driving to walking or cycling to work reported better psychological well-being.',
    citation: 'Martin, Goryakin & Suhrcke (2014), Preventive Medicine',
  },
  {
    finding: 'Cyclists reported better self-perceived health, less stress and less loneliness than users of other modes.',
    citation: 'Avila-Palencia et al. (2018), Environment International',
  },
  {
    finding: 'Cyclists were the most satisfied commuters, ahead of public transport users and drivers.',
    citation: 'St-Louis et al. (2014), Transportation Research Part F',
  },
];

export function Wellbeing({ wellbeing }: { wellbeing: WellbeingResults }) {
  const fill = Math.min(wellbeing.weeklyActiveMinutes / WHO_MAX_WEEKLY_MINUTES, 1) * 100;
  return (
    <div className="health-card">
      <h3>Well-being</h3>
      <p>
        <strong>{formatNumber(wellbeing.weeklyActiveMinutes)} minutes a week</strong> of cycling,{' '}
        {formatNumber(wellbeing.whoGuidelinePct)}% of the WHO minimum of 150 minutes of moderate activity.
      </p>
      <div className="guideline-bar" aria-hidden="true">
        <div className="guideline-fill" style={{ width: `${fill}%` }} />
        <div className="guideline-mark" />
      </div>
      <p className="hint">The marker is the WHO minimum (150 min); the full bar is the upper guideline (300 min).</p>
      <p>
        About {formatNumber(wellbeing.netKcalPerYear)} extra kcal a year, roughly{' '}
        {formatNumber(wellbeing.fatEquivalentKg, 1)} kg of body fat if not offset by food.
      </p>
      <ul className="evidence">
        {EVIDENCE.map((item) => (
          <li key={item.citation}>
            <p>{item.finding}</p>
            <p className="citation">{item.citation}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

`src/components/health/HealthPanel.tsx`:
```tsx
import type { Inputs, Results } from '../../model/types';
import { FitnessChart } from './FitnessChart';
import { LifeExpectancy } from './LifeExpectancy';
import { Wellbeing } from './Wellbeing';

interface HealthPanelProps {
  results: Results;
  inputs: Inputs;
}

export function HealthPanel({ results, inputs }: HealthPanelProps) {
  return (
    <section className="panel" aria-labelledby="health-heading">
      <h2 id="health-heading">Health projection</h2>
      <p className="subhead">
        Kept separate from the cost figures. Population averages from published studies, not medical advice.
      </p>
      <div className="health-grid">
        <LifeExpectancy lifeExpectancy={results.lifeExpectancy} age={inputs.age} horizonYears={inputs.horizonYears} />
        <FitnessChart fitness={results.fitness} />
        <Wellbeing wellbeing={results.wellbeing} />
      </div>
    </section>
  );
}
```

`src/components/Methodology.tsx`:
```tsx
export const SOURCES = [
  'WHO (2017). Health economic assessment tool (HEAT) for walking and for cycling: methods and user guide.',
  'Kelly P. et al. (2014). Systematic review and meta-analysis of reduction in all-cause mortality from walking and cycling. Int J Behav Nutr Phys Act 11:132.',
  'Eurostat (2026). Life expectancy at birth by sex, 2024 (demo_mlexpec).',
  'ITF/IRTAD. Cyclist fatalities per billion km cycled, 2011–2015.',
  'Jackson A.S. et al. (1990). Prediction of functional aerobic capacity without exercise testing. Med Sci Sports Exerc 22:863–870.',
  'Hendriksen I.J.M. et al. (2000). Effect of commuter cycling on physical performance of male and female employees. Med Sci Sports Exerc 32:504–510.',
  'Mifflin M.D., St Jeor S.T. et al. (1990). A new predictive equation for resting energy expenditure in healthy individuals. Am J Clin Nutr 51:241–247.',
  'Du Bois D., Du Bois E.F. (1916). A formula to estimate the approximate surface area if height and weight be known. Arch Intern Med 17:863–871.',
  'WHO (2020). Guidelines on physical activity and sedentary behaviour.',
  'Martin A., Goryakin Y., Suhrcke M. (2014). Does active commuting improve psychological wellbeing? Prev Med 69:296–303.',
  'Avila-Palencia I. et al. (2018). The effects of transport mode use on self-perceived health, mental health, and social contact measures. Environ Int 120:199–206.',
  'St-Louis E. et al. (2014). The happy commuter: a comparison of commuter satisfaction across modes. Transp Res Part F 26:160–170.',
];

export function Methodology() {
  return (
    <section className="panel methodology" aria-labelledby="methodology-heading">
      <h2 id="methodology-heading">Methodology and sources</h2>
      <details>
        <summary>How the numbers are calculated</summary>
        <ul>
          <li>
            <strong>True cost</strong> is money plus time multiplied by your hourly value, in today's euros without
            inflation.
          </li>
          <li>
            <strong>Tickets</strong> are the cheaper of 12 monthly passes or a single ticket for every trip.
          </li>
          <li>
            <strong>Bike depreciation</strong> is the value the bike loses each year at your depreciation rate. A
            replaced bike is sold at its remaining value, and the bike you finish with keeps its value.
          </li>
          <li>
            <strong>Extra food</strong> comes from a physics model of riding power (rolling resistance, air drag scaled
            by body size, ×1.25 for city stop-and-go), divided by a fitness-dependent muscle efficiency, minus resting
            burn (Mifflin-St Jeor).
          </li>
          <li>
            <strong>Life expectancy</strong> follows WHO HEAT: 10% lower risk of death per 100 minutes of cycling a
            week, capped at 45%, for ages 20–64, applied to an EU mortality curve while you commute, minus crash risk
            at your fatality rate.
          </li>
          <li>
            <strong>Fitness</strong> is VO₂max estimated without an exercise test (Jackson et al. 1990). Commuting
            adds a first-year gain scaled to your weekly minutes, then fitness declines more slowly than when
            inactive.
          </li>
        </ul>
      </details>
      <details>
        <summary>Sources</summary>
        <ol className="sources">
          {SOURCES.map((source) => (
            <li key={source}>{source}</li>
          ))}
        </ol>
      </details>
    </section>
  );
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/components/health src/components/Methodology.test.tsx && npx tsc`
Expected: PASS, no type errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/health src/components/Methodology.tsx src/components/Methodology.test.tsx
git commit -m "feat: add health projection and methodology sections

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: App assembly, styles, integration tests and README

**Files:**
- Modify: `src/App.tsx` (replace placeholder), `src/index.css` (replace minimal styles)
- Create: `README.md`
- Test: `src/App.test.tsx`

**Interfaces:**
- Consumes: `useInputs` (state/useInputs.ts); `computeAll` (model/compute.ts); `InputPanel`, `SummaryCards`, `CumulativeChart`, `BreakdownChart`, `HealthPanel`, `Methodology` (components).
- Produces: the finished app.

- [ ] **Step 1: Write the failing integration tests**

`src/App.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';

const headline = () => screen.getByRole('heading', { name: /saves/ });

describe('App', () => {
  it('shows the default headline', () => {
    render(<App />);
    expect(headline()).toHaveTextContent('Cycling saves €1,208 over 5 years');
  });

  it('recomputes when an input changes', async () => {
    const user = userEvent.setup();
    render(<App />);
    const field = screen.getByLabelText(/value of your time/i);
    await user.clear(field);
    await user.type(field, '0');
    expect(headline()).toHaveTextContent('Public transport saves €708 over 5 years');
  });

  it('keeps the last valid value while showing an error', async () => {
    const user = userEvent.setup();
    render(<App />);
    const field = screen.getByLabelText(/value of your time/i);
    await user.clear(field);
    await user.type(field, 'abc');
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a number from 0 to 500');
    expect(headline()).toHaveTextContent('Cycling saves €1,208 over 5 years');
  });

  it('resets inputs and field text to defaults', async () => {
    const user = userEvent.setup();
    render(<App />);
    const field = screen.getByLabelText(/value of your time/i);
    await user.clear(field);
    await user.type(field, '0');
    await user.click(screen.getByRole('button', { name: /reset to defaults/i }));
    expect(headline()).toHaveTextContent('Cycling saves €1,208 over 5 years');
    expect(screen.getByLabelText(/value of your time/i)).toHaveValue('15');
  });

  it('loads inputs from the URL', () => {
    window.history.replaceState(null, '', '/?hy=10');
    render(<App />);
    expect(headline()).toHaveTextContent(/over 10 years/);
    expect(screen.getByRole('slider')).toHaveValue('10');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/App.test.tsx`
Expected: FAIL — no heading matching /saves/ (placeholder App).

- [ ] **Step 3: Implement the App**

`src/App.tsx`:
```tsx
import { useMemo, useState } from 'react';
import { BreakdownChart } from './components/BreakdownChart';
import { CumulativeChart } from './components/CumulativeChart';
import { HealthPanel } from './components/health/HealthPanel';
import { InputPanel } from './components/InputPanel';
import { Methodology } from './components/Methodology';
import { SummaryCards } from './components/SummaryCards';
import { computeAll } from './model/compute';
import { useInputs } from './state/useInputs';

export default function App() {
  const { inputs, setInput, reset, shareUrl } = useInputs();
  // Remounting the panel on reset re-seeds every field's draft text from the defaults.
  const [resetCount, setResetCount] = useState(0);
  const results = useMemo(() => computeAll(inputs), [inputs]);

  const handleReset = () => {
    reset();
    setResetCount((count) => count + 1);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>BikeCalcX</h1>
        <p>The true cost of commuting by bike vs public transport: money, time and health.</p>
      </header>
      <main className="layout">
        <div className="area-summary">
          <SummaryCards costs={results.costs} horizonYears={inputs.horizonYears} />
        </div>
        <aside className="area-inputs">
          <InputPanel key={resetCount} inputs={inputs} setInput={setInput} onReset={handleReset} shareUrl={shareUrl} />
        </aside>
        <div className="area-details">
          <CumulativeChart rows={results.costs.rows} />
          <BreakdownChart rows={results.costs.rows} />
          <HealthPanel results={results} inputs={inputs} />
          <Methodology />
        </div>
      </main>
      <footer className="app-footer">
        <p>Estimates for comparison only, based on averages. Your costs, risks and health will differ.</p>
      </footer>
    </div>
  );
}
```

- [ ] **Step 4: Write the styles**

`src/index.css` (colour values from the validated dataviz palette; dark mode has its own steps):
```css
:root {
  color-scheme: light;
  --page: #f9f9f7;
  --surface: #fcfcfb;
  --text: #0b0b0b;
  --text-secondary: #52514e;
  --text-muted: #898781;
  --grid: #e1e0d9;
  --axis: #c3c2b7;
  --border: rgba(11, 11, 11, 0.1);
  --hover: rgba(11, 11, 11, 0.04);
  --accent: #256abf;
  --accent-ink: #ffffff;
  --error: #d03b3b;
  --series-1: #2a78d6;
  --series-2: #eb6834;
  --series-3: #1baf7a;
  --series-4: #eda100;
  --series-5: #e87ba4;
  --series-bike: var(--series-1);
  --series-transit: var(--series-2);
  --radius: 12px;
  font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
  line-height: 1.5;
}

@media (prefers-color-scheme: dark) {
  :root {
    color-scheme: dark;
    --page: #0d0d0d;
    --surface: #1a1a19;
    --text: #f0efec;
    --text-secondary: #c3c2b7;
    --text-muted: #898781;
    --grid: #2c2c2a;
    --axis: #383835;
    --border: rgba(255, 255, 255, 0.1);
    --hover: rgba(255, 255, 255, 0.06);
    --accent: #3987e5;
    --accent-ink: #0b0b0b;
    --error: #e66767;
    --series-1: #3987e5;
    --series-2: #d95926;
    --series-3: #199e70;
    --series-4: #c98500;
    --series-5: #d55181;
  }
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: var(--page);
  color: var(--text);
}

h1,
h2,
h3 {
  line-height: 1.2;
  margin: 0 0 8px;
}

p {
  margin: 0 0 8px;
}

.app {
  max-width: 1280px;
  margin: 0 auto;
  padding: 24px 16px 48px;
}

.app-header {
  margin-bottom: 24px;
}

.app-header h1 {
  font-size: 1.75rem;
}

.app-header p,
.subhead,
.hint,
.stat-detail,
.citation,
.app-footer {
  color: var(--text-secondary);
}

.app-footer {
  margin-top: 32px;
  font-size: 0.875rem;
}

/* Mobile: headline, then inputs, then details. Desktop: inputs on the left, results on the right. */
.layout {
  display: grid;
  gap: 24px;
  grid-template-columns: minmax(0, 1fr);
  grid-template-areas:
    'summary'
    'inputs'
    'details';
}

.area-summary {
  grid-area: summary;
}

.area-inputs {
  grid-area: inputs;
}

.area-details {
  grid-area: details;
  display: grid;
  gap: 24px;
  min-width: 0;
}

@media (min-width: 960px) {
  .layout {
    grid-template-columns: minmax(300px, 360px) minmax(0, 1fr);
    grid-template-areas:
      'inputs summary'
      'inputs details';
    align-items: start;
  }

  .area-inputs {
    position: sticky;
    top: 16px;
    max-height: calc(100vh - 32px);
    overflow-y: auto;
  }
}

.summary,
.panel,
.input-panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px;
}

.headline {
  font-size: clamp(1.5rem, 4vw, 2.25rem);
  font-weight: 650;
}

.stat-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  margin: 16px 0;
}

.stat-tile {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px 14px;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 4px;
}

.stat-detail {
  font-size: 0.8125rem;
  margin: 0;
}

.facts {
  margin: 0;
  padding-left: 20px;
  color: var(--text-secondary);
}

.input-panel fieldset {
  border: 0;
  border-top: 1px solid var(--border);
  margin: 16px 0 0;
  padding: 12px 0 0;
}

.input-panel legend {
  font-weight: 600;
  padding: 0;
}

.field {
  display: grid;
  gap: 4px;
  margin-top: 12px;
}

.field label {
  font-size: 0.875rem;
}

.unit {
  color: var(--text-secondary);
}

.field input[type='text'],
.field select {
  font: inherit;
  color: var(--text);
  background: var(--page);
  border: 1px solid var(--axis);
  border-radius: 8px;
  padding: 8px 10px;
  width: 100%;
}

.field input[aria-invalid='true'] {
  border-color: var(--error);
}

.field input[type='range'] {
  width: 100%;
  accent-color: var(--accent);
}

.hint {
  font-size: 0.8125rem;
  margin: 0;
}

.error {
  color: var(--error);
  font-size: 0.8125rem;
  margin: 0;
}

.advanced {
  margin-top: 16px;
  border-top: 1px solid var(--border);
  padding-top: 12px;
}

.advanced summary,
.methodology summary {
  cursor: pointer;
  font-weight: 600;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-top: 20px;
}

.actions button {
  font: inherit;
  border-radius: 8px;
  padding: 8px 14px;
  border: 1px solid var(--accent);
  background: var(--accent);
  color: var(--accent-ink);
  cursor: pointer;
}

.actions button.secondary {
  background: transparent;
  color: var(--text);
  border-color: var(--axis);
}

.actions button:focus-visible,
.field input:focus-visible,
.field select:focus-visible,
summary:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.status {
  flex-basis: 100%;
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
  min-height: 1.3em;
}

.chart {
  width: 100%;
  margin: 12px 0;
}

.chart-summary {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.legend-label {
  color: var(--text-secondary);
  font-size: 0.8125rem;
}

.breakdown-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
  font-variant-numeric: tabular-nums;
}

.breakdown-table th,
.breakdown-table td {
  text-align: right;
  padding: 6px 8px;
  border-bottom: 1px solid var(--grid);
}

.breakdown-table th:first-child {
  text-align: left;
  font-weight: 400;
}

.breakdown-table thead th,
.breakdown-table tfoot th,
.breakdown-table tfoot td {
  font-weight: 600;
}

.health-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  margin-top: 12px;
}

.health-card {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 16px;
  min-width: 0;
}

.big-figure {
  font-size: 2rem;
  font-weight: 650;
  margin-bottom: 4px;
}

.metric-list {
  margin: 12px 0 0;
}

.metric-list div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 6px 0;
  border-top: 1px solid var(--grid);
}

.metric-list dt {
  color: var(--text-secondary);
}

.metric-list dd {
  margin: 0;
  font-weight: 600;
  white-space: nowrap;
}

.note {
  margin-top: 12px;
  font-size: 0.875rem;
  color: var(--text-secondary);
  border-left: 3px solid var(--axis);
  padding-left: 10px;
}

.guideline-bar {
  position: relative;
  height: 10px;
  border-radius: 5px;
  background: var(--grid);
  margin: 12px 0 6px;
  overflow: hidden;
}

.guideline-fill {
  height: 100%;
  background: var(--series-bike);
  border-radius: 5px;
}

.guideline-mark {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 2px;
  background: var(--text);
}

.evidence {
  list-style: none;
  padding: 0;
  margin: 12px 0 0;
  display: grid;
  gap: 8px;
}

.evidence li {
  border-top: 1px solid var(--grid);
  padding-top: 8px;
}

.citation {
  font-size: 0.8125rem;
  margin: 0;
}

.methodology ul,
.sources {
  color: var(--text-secondary);
  font-size: 0.875rem;
  padding-left: 20px;
}

.methodology details + details {
  margin-top: 12px;
}
```

- [ ] **Step 5: Write the README**

`README.md`:
````md
# BikeCalcX

Estimate the true cost of commuting by bike versus public transport over 1–30 years: money spent, time valued at
your hourly rate, plus a separate evidence-based health projection (life expectancy net of crash risk, VO₂max fitness
and well-being). Inputs are saved in the URL, so any scenario can be shared as a link.

## Develop

```bash
npm install
npm run dev       # start the dev server
npm test          # run the test suite
npm run build     # type-check and build to dist/
npm run preview   # serve the production build locally
```

## Deploy to Vercel

The app is a static Vite build, so no configuration file is needed.

1. Push this repository to GitHub, GitLab or Bitbucket.
2. In Vercel, choose **Add New → Project** and import the repository.
3. Vercel detects the **Vite** framework preset: build command `npm run build`, output directory `dist`.
4. Click **Deploy**.

Or from the command line: `npx vercel` for a preview deployment, then `npx vercel --prod`.

## How it works

All calculations live in `src/model/` as pure functions with unit tests. The formulas, assumptions and sources are
described in the app's "Methodology and sources" section and in
`docs/superpowers/specs/2026-10-17-bikecalcx-design.md`.
````

- [ ] **Step 6: Run the full suite and build**

Run: `npm test && npm run build`
Expected: every test PASS; `tsc` clean; `dist/` produced.

- [ ] **Step 7: Smoke-test the production build**

Run: `npx vite preview --port 4173 --strictPort &` then `curl -s http://localhost:4173/ | grep -o '<title>.*</title>'`, then stop the preview server.
Expected: `<title>BikeCalcX: bike vs public transport true cost</title>`.

- [ ] **Step 8: Commit**

```bash
git add src/App.tsx src/App.test.tsx src/index.css README.md
git commit -m "feat: assemble calculator app with styles and README

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
