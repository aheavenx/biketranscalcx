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
