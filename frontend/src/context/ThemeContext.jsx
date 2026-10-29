import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'

const STORAGE_KEY = 'theme'
const TRANSITION_DURATION_MS = 260

const ThemeContext = createContext(null)

/**
 * Returns the OS preferred color scheme ('dark' | 'light').
 */
function getSystemPreference() {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * Reads initial theme from localStorage safely, falling back to 'system'.
 */
function getInitialTheme() {
  if (typeof window === 'undefined') return 'system'
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      return saved
    }
  } catch {
    // LocalStorage may be blocked (private browsing)
  }
  return 'system'
}

/**
 * ThemeProvider — Global White & Dark Theme Orchestrator.
 * 
 * Features:
 * - Supports 'light', 'dark', and 'system' (OS auto-detection)
 * - Anti-FOUC compatible with index.html pre-hydration script
 * - Multi-tab synchronization via storage event
 * - Hardware-accelerated smooth cross-fade without permanent transition lag
 * - Proper color-scheme DOM meta tagging
 */
export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getInitialTheme)
  const [systemTheme, setSystemTheme] = useState(getSystemPreference)

  // Listen to OS system theme changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e) => {
      setSystemTheme(e.matches ? 'dark' : 'light')
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Listen to storage changes across browser tabs
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        if (e.newValue === 'light' || e.newValue === 'dark' || e.newValue === 'system') {
          setThemeState(e.newValue)
        }
      }
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  // Resolve current active theme
  const resolvedTheme = useMemo(() => {
    return theme === 'system' ? systemTheme : theme
  }, [theme, systemTheme])

  // Apply to DOM with temporary transition class
  const applyThemeToDOM = useCallback((targetTheme, enableTransition = true) => {
    const root = document.documentElement
    
    if (enableTransition) {
      root.classList.add('theme-transitioning')
    }

    if (targetTheme === 'dark') {
      root.classList.add('dark')
      root.style.colorScheme = 'dark'
    } else {
      root.classList.remove('dark')
      root.style.colorScheme = 'light'
    }

    if (enableTransition) {
      window.clearTimeout(applyThemeToDOM._timer)
      applyThemeToDOM._timer = window.setTimeout(() => {
        root.classList.remove('theme-transitioning')
      }, TRANSITION_DURATION_MS)
    }
  }, [])

  // Apply resolvedTheme whenever it changes
  useEffect(() => {
    applyThemeToDOM(resolvedTheme, true)
  }, [resolvedTheme, applyThemeToDOM])

  // Public setter with persistence
  const setTheme = useCallback((newTheme) => {
    if (newTheme !== 'light' && newTheme !== 'dark' && newTheme !== 'system') return
    try {
      localStorage.setItem(STORAGE_KEY, newTheme)
    } catch {
      // Ignored if storage quota exceeded or disabled
    }
    setThemeState(newTheme)
  }, [])

  // Quick toggle between light & dark
  const toggleTheme = useCallback(() => {
    const next = resolvedTheme === 'dark' ? 'light' : 'dark'
    setTheme(next)
  }, [resolvedTheme, setTheme])

  const contextValue = useMemo(() => ({
    theme,
    resolvedTheme,
    isDark: resolvedTheme === 'dark',
    setTheme,
    toggleTheme,
  }), [theme, resolvedTheme, setTheme, toggleTheme])

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  )
}

/**
 * useTheme hook to consume the current theme context.
 */
export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export default ThemeContext
