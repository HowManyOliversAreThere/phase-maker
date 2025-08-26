import PhaseGenerator from './components/PhaseGenerator';
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <PhaseGenerator />
    </ErrorBoundary>
  );
}

export default App;
