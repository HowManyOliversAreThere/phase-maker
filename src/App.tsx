import PhaseGenerator from './components/PhaseGenerator';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider } from './components/ui/toast';

function App() {
  return (
    <ToastProvider>
      <ErrorBoundary>
        <PhaseGenerator />
      </ErrorBoundary>
    </ToastProvider>
  );
}

export default App;
