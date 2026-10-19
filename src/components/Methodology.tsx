export const SOURCES = [
  'WHO (2017). Health economic assessment tool (HEAT) for walking and for cycling: methods and user guide.',
  'Kelly P. et al. (2014). Systematic review and meta-analysis of reduction in all-cause mortality from walking and cycling. Int J Behav Nutr Phys Act 11:132.',
  'Eurostat (2026). Life expectancy at birth by sex, 2024 (demo_mlexpec).',
  'ITF/IRTAD. Cyclist fatalities per billion km cycled, 2011–2015.',
  'Jackson A.S. et al. (1990). Prediction of functional aerobic capacity without exercise testing. Med Sci Sports Exerc 22:863–870.',
  'Hendriksen I.J.M. et al. (2000). Effect of commuter cycling on physical performance of male and female employees. Med Sci Sports Exerc 32:504–510.',
  'Mifflin M.D., St Jeor S.T. et al. (1990). A new predictive equation for resting energy expenditure in healthy individuals. Am J Clin Nutr 51:241–247.',
  'USDA FoodData Central (SR Legacy). Chicken, broilers or fryers, breast, meat only, raw: 120 kcal/100 g; Rice, white, medium-grain, raw: 360 kcal/100 g.',
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
            <strong>Bike purchase</strong> is the full bike price in the year you buy it, and again each time you
            replace it. Old bikes are not resold.
          </li>
          <li>
            <strong>Extra food</strong> comes from a physics model of riding power on a flat road with no wind
            (rolling resistance of commuter tyres, air drag scaled by body size, ×1.1 for city stop-and-go), or your
            own average power if you enter one. Power is divided by a fitness-dependent muscle efficiency, minus
            resting burn (Mifflin-St Jeor). Half the extra calories are eaten back as chicken breast and half as rice.
          </li>
          <li>
            <strong>Life expectancy</strong> follows WHO HEAT: 10% lower risk of death per 100 minutes of cycling a
            week, capped at 45%, for ages 20–64, applied to an EU mortality curve while you commute, minus crash risk
            at your fatality rate.
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
