export function Methodology() {
  return (
    <section className="panel methodology" aria-labelledby="methodology-heading">
      <h2 id="methodology-heading">Methodology</h2>
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
    </section>
  );
}
