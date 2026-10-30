import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext.jsx'
import App from './App.jsx'
import './index.css'
// i18n must be imported before App so translations are ready on first render
import './i18n.js'
import { hydrateQueryCache, setupQueryCachePersistence } from './utils/queryCacheStorage.js'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      networkMode: 'offlineFirst',
      staleTime: 1000 * 60 * 10, // 10 minutes: fast instant navigation without refetch thrashing
      gcTime: 1000 * 60 * 60 * 24, // 24 hours: retain cached queries in memory and disk
      refetchOnWindowFocus: false, // Prevent jarring refetches when switching browser tabs
      refetchOnReconnect: true, // Auto-sync seamlessly when connection returns
      retry: (failureCount) => {
        if (typeof navigator !== 'undefined' && !navigator.onLine) return false
        return failureCount < 2
      },
    },
  },
})

// Synchronously hydrate cached queries from disk for 0ms initial render
hydrateQueryCache(queryClient)
// Subscribe to query updates to continuously save newly visited profiles
setupQueryCachePersistence(queryClient)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
)
