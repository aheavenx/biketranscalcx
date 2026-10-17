import type { Inputs, NumericInputKey, OptionalNumericInputKey, SelectInputKey } from './types';

export type FieldGroup = 'projection' | 'commute' | 'transit' | 'bike' | 'you' | 'advanced' | 'geeky';

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

/** A number that may be left blank, in which case the model computes the value itself. */
export interface OptionalNumberFieldSpec extends Omit<NumberFieldSpec, 'kind' | 'key'> {
  kind: 'optionalNumber';
  key: OptionalNumericInputKey;
}

export type NumericFieldSpec = NumberFieldSpec | OptionalNumberFieldSpec;

export interface SelectFieldSpec {
  kind: 'select';
  key: SelectInputKey;
  urlKey: string;
  group: FieldGroup;
  label: string;
  options: { value: string; label: string; hint?: string }[];
}

export type FieldSpec = NumberFieldSpec | OptionalNumberFieldSpec | SelectFieldSpec;

export const DEFAULT_INPUTS: Inputs = {
  horizonYears: 5,
  tripsPerWeek: 10,
  weeksPerYear: 46,
  distanceKm: 8,
  transitMinutes: 35,
  singleTicket: 3,
  monthlyPass: 60,
  bikePrice: 800,
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
  chickenPricePerKg: 10,
  ricePricePerKg: 2,
  cyclistFatalityPerBillionKm: 15,
  avgPowerW: null,
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
    // Hints describe the Jackson et al. (1990) activity rating each level maps to (see fitness.ts).
    options: [
      { value: 'sedentary', label: 'Sedentary', hint: 'Little exercise beyond occasional walks.' },
      { value: 'light', label: 'Lightly active', hint: 'Up to 1 hour a week of moderate exercise.' },
      { value: 'moderate', label: 'Moderately active', hint: 'More than 1 hour a week of moderate exercise.' },
      { value: 'active', label: 'Very active', hint: '30–60 minutes a week of hard exercise like running.' },
      { value: 'athlete', label: 'Athlete', hint: 'More than 3 hours a week of hard training.' },
    ],
  },
  num({ key: 'valueOfTimePerHour', urlKey: 'vt', group: 'you', label: 'Value of your time', unit: '€/h', min: 0, max: 500, step: 1, integer: false, hint: 'Set to 0 to compare money only.' }),
  num({ key: 'chickenPricePerKg', urlKey: 'cp', group: 'you', label: 'Chicken breast price', unit: '€/kg', min: 0, max: 100, step: 0.1, integer: false }),
  num({ key: 'ricePricePerKg', urlKey: 'rp', group: 'you', label: 'Rice price', unit: '€/kg', min: 0, max: 50, step: 0.1, integer: false, hint: 'The extra calories you burn are eaten back half as chicken, half as rice.' }),
  num({ key: 'cyclistFatalityPerBillionKm', urlKey: 'cf', group: 'advanced', label: 'Cyclist fatality rate', unit: 'deaths per billion km', min: 0, max: 200, step: 1, integer: false, hint: 'About 8 in the Netherlands and 21 in the UK (ITF/IRTAD, 2011–2015).' }),
  {
    kind: 'optionalNumber',
    key: 'avgPowerW',
    urlKey: 'pw',
    group: 'geeky',
    label: 'Average power per trip',
    unit: 'W',
    min: 10,
    max: 1000,
    step: 1,
    integer: false,
    hint: 'Enter your own, e.g. from a power meter, or leave blank to use the computed value.',
  },
];

export const NUMBER_FIELDS: NumberFieldSpec[] = FIELD_SPECS.filter(
  (spec): spec is NumberFieldSpec => spec.kind === 'number',
);

export function getNumberSpec(key: NumericInputKey): NumberFieldSpec {
  const spec = NUMBER_FIELDS.find((candidate) => candidate.key === key);
  if (!spec) throw new Error(`No field spec for ${key}`);
  return spec;
}

export function isValidNumber(spec: NumericFieldSpec, value: number): boolean {
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

export function rangeMessage(spec: NumericFieldSpec): string {
  const kind = spec.integer ? 'a whole number' : 'a number';
  return `Enter ${kind} from ${spec.min} to ${spec.max}`;
}
