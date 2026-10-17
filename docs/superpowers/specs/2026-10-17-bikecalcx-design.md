# BikeCalcX — Bike vs Public Transport True-Cost Calculator: Design

Date: 2026-10-17
Status: approved in brainstorming, pending written-spec review

## 1. Purpose

A client-only single-page app that estimates the **true cost** of commuting by bicycle versus public
transport over a user-selected number of years (1–30). "True cost" = cash costs + time valued at the
user's hourly rate. A separate health panel projects the effect on life expectancy (net of crash
risk), aerobic fitness, and well-being, with cited sources. Hosted as a static site on Vercel.

Non-goals: backend, accounts, inflation modelling, currency selection, imperial units, car
comparison, air-pollution modelling, monetising health outcomes.

## 2. Stack

- Vite + React + TypeScript (`strict: true`), npm.
- Recharts for charts.
- Vitest + React Testing Library (jsdom) for tests.
- Plain CSS with custom properties; light/dark via `prefers-color-scheme`. No UI library.
- Deployed to Vercel as a static Vite build (`npm run build` → `dist/`); no `vercel.json` needed.

## 3. Inputs

All money in €, all units metric. Each input has a default, a valid range, and a short URL key.

| Group | Field (id) | Unit | Default | Range |
|---|---|---|---|---|
| Projection | `horizonYears` | years | 5 | 1–30 (integer, slider) |
| Commute | `tripsPerWeek` (one-way trips) | trips | 10 | 0–28 (integer) |
| | `weeksPerYear` | weeks | 46 | 1–52 (integer) |
| | `distanceKm` (one-way) | km | 8 | 0.5–60 |
| | `transitMinutes` (door to door, one-way) | min | 35 | 1–240 |
| Transit | `singleTicket` | € | 3.00 | 0–50 |
| | `monthlyPass` | € | 60 | 0–1000 |
| Bike | `bikePrice` | € | 800 | 0–20000 |
| | `depreciationPct` | %/yr | 15 | 0–60 |
| | `replaceEveryYears` | years | 8 | 1–30 (integer) |
| | `bikeCarePerYear` | €/yr | 120 | 0–5000 |
| | `bikeSpeedKmh` | km/h | 18 | 5–45 |
| | `showerMinutesPerTrip` | min | 5 | 0–60 |
| You | `age` | years | 35 | 16–90 (integer) |
| | `sex` | `male` \| `female` \| `unspecified` | `unspecified` | enum |
| | `heightCm` | cm | 175 | 120–220 |
| | `weightKg` | kg | 75 | 35–200 |
| | `fitness` | `sedentary` \| `light` \| `moderate` \| `active` \| `athlete` | `moderate` | enum |
| | `valueOfTimePerHour` | €/h | 15 | 0–500 |
| | `mealPrice` | € | 6 | 0–100 |
| | `kcalPerMeal` | kcal | 650 | 200–2000 |
| Advanced (collapsed) | `cyclistFatalityPerBillionKm` | deaths / 10⁹ km | 15 | 0–200 |

UI hints:
- `showerMinutesPerTrip`: "e.g. a 10-min shower after each arrival at work ≈ 5 min per one-way trip".
- `cyclistFatalityPerBillionKm`: "≈ 8 Netherlands, ≈ 21 UK (ITF/IRTAD 2011–2015)".

## 4. Cost model (`src/model/costs.ts`, `bike.ts`, `calories.ts`)

All figures are in today's money (no inflation). Computed per projection year `y = 1..horizonYears`.

### 4.1 Shared

- Annual one-way trips `T = tripsPerWeek × weeksPerYear`.
- Annual cycled km `K = T × distanceKm`.
- Time cost of `h` hours = `h × valueOfTimePerHour`.

### 4.2 Public transport (per year)

- Tickets = `min(12 × monthlyPass, T × singleTicket)`; record which strategy is cheaper
  (`"pass"` or `"single"`; ties → `"pass"`).
- Time = `T × transitMinutes / 60` hours → time cost.

### 4.3 Bike (per year)

- **Capital (economic depreciation).** Declining balance with rate `d = depreciationPct / 100`.
  The bike in use in year `y` has age `k = ((y − 1) mod replaceEveryYears) + 1` at year end.
  Capital cost in year `y` = `P·(1−d)^(k−1) − P·(1−d)^k`, `P = bikePrice`.
  At replacement the old bike is sold at its depreciated value and a new one bought at `P`, so the
  swap adds no economic cost beyond depreciation. Also reported: upfront cash outlay `P`, number of
  bikes bought within the horizon (`ceil(horizonYears / replaceEveryYears)`), residual value at the
  horizon end.
- **Care** = `bikeCarePerYear`.
- **Food** = `T × netKcalPerTrip / kcalPerMeal × mealPrice`.
- **Time** = `T × (distanceKm / bikeSpeedKmh × 60 + showerMinutesPerTrip) / 60` hours → time cost.

### 4.4 Calories (physics model)

Constants: bike mass 15 kg, `g = 9.81`, `Crr = 0.008`, air density `ρ = 1.2 kg/m³`,
reference `CdA = 0.55 m²` at body surface area 1.9 m², urban factor 1.25.

- Body surface area (Du Bois): `BSA = 0.007184 × W^0.425 × H^0.725` (W kg, H cm).
- `CdA = 0.55 × BSA / 1.9`.
- `v = bikeSpeedKmh / 3.6`, `m = weightKg + 15`.
- Mechanical power `P_mech = (Crr·m·g·v + ½·ρ·CdA·v³) × 1.25` (W).
- Gross efficiency by fitness: sedentary 0.18, light 0.19, moderate 0.20, active 0.215, athlete 0.23.
- Metabolic power `P_met = P_mech / efficiency`; gross kcal/h = `P_met × 3600 / 4184`.
- Resting kcal/h from Mifflin-St Jeor BMR / 24:
  `BMR = 10W + 6.25H − 5·age + s`, `s = +5` male, `−161` female, `−78` unspecified.
- Net kcal/h = gross − resting (floored at 0). Net kcal per trip = net kcal/h × ride hours per trip.
- Sanity target: defaults give ≈ 340 kcal/h net, ≈ 150 kcal per trip.

### 4.5 Outputs

- Per-year rows: transit `{tickets, time}`, bike `{capital, care, food, time}`, and cumulative
  true-cost and cash-only totals for both modes.
- Headline: total true cost over the horizon per mode, savings (transit − bike), per-month
  equivalents (`total / (horizonYears × 12)`).
- Cash payback: months for the upfront bike price to be recovered by monthly cash savings
  `(transit tickets − bike care − bike food) / 12`; "never" if savings ≤ 0. A bike price of €0 pays back immediately (0 months), whatever the savings.
- Break-even year on true cost: first year whose cumulative bike true cost ≤ transit true cost, or
  "not within horizon".
- Hours per year spent commuting per mode.

## 5. Health model (`src/model/mortality.ts`, `fitness.ts`, `wellbeing.ts`)

Weekly cycling minutes (holiday-averaged): `M = T × (distanceKm / bikeSpeedKmh × 60) / 52`.
Health results are displayed only; they never enter the money figures.

### 5.1 Life expectancy (WHO HEAT approach, net of crash risk)

- Baseline hazard: Gompertz-Makeham `h(a) = λ + α·e^(β·a)` per sex. Parameters are fitted so the
  model's life expectancy at birth equals Eurostat 2024 EU values (male 78.9, female 84.1) within
  ±0.3 years; `unspecified` uses the mean of the male and female hazards. Fitted constants and the
  fitting target are documented in code comments.
- Annual-step survival: `S(a+1) = S(a)·exp(−h(a))`; remaining life expectancy from current age is
  `e(age) = 0.5 + Σ_{t ≥ 1} S(age + t) / S(age)`, summed until age 110.
- Physical-activity benefit (HEAT, Kelly et al. 2014): relative reduction
  `r = min(0.10 × M / 100, 0.45)`, applied only for ages 20–64 and only during commute years
  (`age .. age + horizonYears − 1`).
- Crash hazard during commute years: `c = K × cyclistFatalityPerBillionKm / 1e9`.
- Bike hazard during commute years: `h(a)·(1 − r) + c`; afterwards baseline.
- Reported: `activityGain = LE(activity only) − LE(base)`, `crashLoss = LE(activity only) − LE(full)`,
  `net = LE(full) − LE(base)` — shown in days (or months/years when large). Note shown when part
  of the horizon falls outside ages 20–64.

### 5.2 Fitness (VO₂max, ml/kg/min)

- Baseline (Jackson et al. 1990, BMI model):
  `VO2 = 56.363 + 1.921·PAR − 0.381·age − 0.754·BMI + 10.987·sexCode`,
  `sexCode` = 1 male, 0 female, 0.5 unspecified; `PAR` from fitness: sedentary 1, light 2,
  moderate 3, active 5, athlete 7.
- Year 0 is the baseline for both modes. For `y ≥ 1`:
  - Transit: `VO2(y) = base × 0.99^y`.
  - Bike: `VO2(y) = base × (1 + g × min(M / 150, 1)) × 0.995^(y − 1)`, with `g` by fitness —
    sedentary 10 %, light 7 %, moderate 5 %, active 2 %, athlete 0 % (anchored to Hendriksen et al.
    2000: +6 % in male commuter cyclists).
- Fitness age: age at which an average person (same `sexCode`, BMI 24, PAR 3) has the given VO₂max
  under the Jackson equation, clamped to 18–90.
- Chart: VO₂max per year, both modes; fitness age at the horizon end for both modes.

### 5.3 Well-being

- Weekly active minutes from commuting vs WHO 2020 guideline (150–300 min/week moderate);
  shown as % of 150.
- Net kcal per year and body-fat equivalent at 7,700 kcal/kg ("if not offset by food").
- Three evidence cards: Martin et al. 2014 (switching to active commuting improved GHQ well-being),
  Avila-Palencia et al. 2018 (cyclists: better self-perceived health, less stress), St-Louis et al.
  2014 (cyclists are the most satisfied commuters).
- No synthetic well-being score.

## 6. Architecture

```
src/
  model/            pure TypeScript, no React
    types.ts        Inputs, Results, YearRow, enums
    defaults.ts     DEFAULT_INPUTS, FIELD_SPECS (range, unit, url key, label, hint)
    calories.ts     BSA, CdA, power, efficiency, BMR, net kcal/trip
    bike.ts         depreciation/replacement schedule
    costs.ts        transit & bike annual rows, cumulative totals, payback, break-even
    mortality.ts    Gompertz-Makeham, HEAT, crash risk, LE deltas
    fitness.ts      Jackson VO2max, trajectories, fitness age
    wellbeing.ts    guideline %, fat equivalent
    compute.ts      computeAll(inputs: Inputs): Results  ← only entry point used by the UI
  state/
    urlState.ts     Inputs ↔ query string (short keys), per-field validation
    useInputs.ts    init: URL → localStorage → defaults; persist on change
  components/
    InputPanel.tsx  grouped fields, horizon slider, advanced section, share/reset buttons
    NumberField.tsx, SelectField.tsx
    SummaryCards.tsx
    CumulativeChart.tsx
    BreakdownChart.tsx
    HealthPanel.tsx (LifeExpectancy, FitnessChart, Wellbeing)
    Methodology.tsx assumptions + sources
  App.tsx, main.tsx, index.css
```

Data flow: `useInputs()` → `App` → `useMemo(() => computeAll(inputs))` → presentational
components. Components contain no calculation logic.

Layout: two columns on desktop (inputs left, results right); single column on mobile with the
headline first. Every chart's key numbers also appear as text.

## 7. State, persistence, validation

- Each `NumberField` keeps its own text draft; invalid/empty/out-of-range drafts show an inline
  error and the last valid value stays in `Inputs`.
- URL: inputs differing from defaults are written to the query string via
  `history.replaceState`, debounced 300 ms. On load, malformed or out-of-range params fall back to
  defaults per field.
- localStorage key `bikecalcx:inputs:v1`; every access wrapped in try/catch; URL params take
  precedence over stored values.
- "Copy share link" (Clipboard API, with visible confirmation) and "Reset to defaults".
- Model functions guard against division by zero (e.g. `T = 0`, `kcalPerMeal` floor via range).

## 8. Testing

Test-first with Vitest:
- `calories`: BSA for a known case; net kcal/h for defaults within 300–380; efficiency ordering.
- `bike`: total depreciation over a horizon equals `P − residual` without replacement; with
  replacement equals the sum per bike cycle; `d = 0` → 0.
- `costs`: ticket strategy choice both ways; `T = 0`; cumulative sums; payback and break-even.
- `mortality`: LE at birth matches targets ±0.3; 45 % cap; no benefit outside ages 20–64;
  crash risk lowers LE; `net = activityGain − crashLoss`.
- `fitness`: Jackson value for a hand-computed example; athlete gain 0; fitness age inverse
  round-trip.
- `urlState`: round-trip; invalid params fall back to defaults.
- Components (RTL): app renders headline; changing an input updates the headline; invalid input
  shows an error.

## 9. Deployment

`README.md` documents `npm install`, `npm run dev`, `npm test`, `npm run build`, and deploying by
importing the repo in Vercel (framework preset: Vite). No deploy is performed as part of this work.

## 10. Sources (shown in the Methodology section)

- WHO HEAT for walking and cycling, methods and user guide (2017 update).
- Kelly P. et al. (2014). Systematic review and meta-analysis of reduction in all-cause mortality
  from walking and cycling. *Int J Behav Nutr Phys Act* 11:132.
- Eurostat `demo_mlexpec`, life expectancy at birth 2024.
- ITF/IRTAD, cyclist fatalities per billion km (2011–2015).
- Jackson A.S. et al. (1990). Prediction of functional aerobic capacity without exercise testing.
  *Med Sci Sports Exerc* 22:863–870.
- Hendriksen I.J.M. et al. (2000). Effect of commuter cycling on physical performance of male and
  female employees. *Med Sci Sports Exerc* 32:504–510.
- Mifflin M.D., St Jeor S.T. et al. (1990). A new predictive equation for resting energy
  expenditure. *Am J Clin Nutr* 51:241–247.
- Du Bois D., Du Bois E.F. (1916). A formula to estimate the approximate surface area.
- WHO (2020). Guidelines on physical activity and sedentary behaviour.
- Martin A., Goryakin Y., Suhrcke M. (2014). Does active commuting improve psychological
  wellbeing? *Prev Med* 69:296–303.
- Avila-Palencia I. et al. (2018). The effects of transport mode use on self-perceived health,
  mental health, and social contact measures. *Environ Int* 120:199–206.
- St-Louis E. et al. (2014). The happy commuter. *Transp Res Part F* 26:160–170.
