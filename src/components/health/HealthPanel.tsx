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
