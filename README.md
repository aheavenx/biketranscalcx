# BikeCalcX

Estimate the true cost of commuting by bike versus public transport over 1–30 years: money spent, time valued at
your hourly rate, plus a separate evidence-based health projection (life expectancy net of crash risk
and well-being). Inputs are saved in the URL, so any scenario can be shared as a link.

## Develop

Requires Node 22.22.2+ or 24.15+ (the test tooling — jsdom 30 and jest-dom 7 — needs it; the Vite build alone runs on Node 20.19+).

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
