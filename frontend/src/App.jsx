import AppRoutes from './routes/AppRoutes.jsx'
import { ErrorBoundary } from './components/ui/ErrorBoundary.jsx'

/**
 * App — root component.
 * Routing is handled by AppRoutes; layout wrappers will be added there.
 */
function App() {
  return (
    <ErrorBoundary>
      <AppRoutes />
    </ErrorBoundary>
  )
}

export default App
