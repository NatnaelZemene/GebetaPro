import { useTheme } from '../../hooks/useTheme.js'
import { Sun, Moon, Monitor } from 'lucide-react'

/**
 * ThemeToggle.jsx — High-craft, tactile theme toggle button.
 * 
 * Supports:
 * - Direct single-click toggle (Sun ↔ Moon) with micro-animation
 * - Multi-mode menu (Light, Dark, System) if dropdown mode is desired
 * - Accessible with keyboard rings, aria-label, and tooltips
 */
export function ThemeToggle({
  className = '',
  size = 'md',
  variant = 'button', // 'button' | 'segmented'
}) {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-9 h-9 text-base',
  }[size] || 'w-8 h-8 text-sm'

  const iconSizes = {
    sm: 13,
    md: 15,
    lg: 17,
  }[size] || 15

  if (variant === 'segmented') {
    const isFullWidth = className.includes('w-full') || className.includes('grid')
    return (
      <div
        className={`
          ${isFullWidth
            ? 'w-full grid grid-cols-3 gap-1 p-1 rounded-xl'
            : 'inline-flex items-center p-0.5 rounded-lg'}
          bg-surface-2 border border-border select-none ${className}
        `}
        role="group"
        aria-label="Theme selection"
      >
        <button
          type="button"
          onClick={() => setTheme('light')}
          aria-pressed={theme === 'light'}
          aria-label="Light theme"
          className={`
            flex items-center justify-center gap-1.5 ${isFullWidth ? 'py-2 px-2 rounded-lg' : 'px-2.5 py-1 rounded-md'} text-[12px] font-medium transition-all cursor-pointer
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink
            ${theme === 'light'
              ? 'bg-ink text-surface shadow-xs font-semibold'
              : 'text-ink-2 hover:text-ink hover:bg-surface/50 border border-transparent'}
          `}
        >
          <Sun size={13} className="shrink-0" />
          <span>Light</span>
        </button>

        <button
          type="button"
          onClick={() => setTheme('dark')}
          aria-pressed={theme === 'dark'}
          aria-label="Dark theme"
          className={`
            flex items-center justify-center gap-1.5 ${isFullWidth ? 'py-2 px-2 rounded-lg' : 'px-2.5 py-1 rounded-md'} text-[12px] font-medium transition-all cursor-pointer
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink
            ${theme === 'dark'
              ? 'bg-ink text-surface shadow-xs font-semibold'
              : 'text-ink-2 hover:text-ink hover:bg-surface/50 border border-transparent'}
          `}
        >
          <Moon size={13} className="shrink-0" />
          <span>Dark</span>
        </button>

        <button
          type="button"
          onClick={() => setTheme('system')}
          aria-pressed={theme === 'system'}
          aria-label="System theme"
          className={`
            flex items-center justify-center gap-1.5 ${isFullWidth ? 'py-2 px-2 rounded-lg' : 'px-2.5 py-1 rounded-md'} text-[12px] font-medium transition-all cursor-pointer
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink
            ${theme === 'system'
              ? 'bg-ink text-surface shadow-xs font-semibold'
              : 'text-ink-2 hover:text-ink hover:bg-surface/50 border border-transparent'}
          `}
        >
          <Monitor size={13} className="shrink-0" />
          <span>System</span>
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`
        relative inline-flex items-center justify-center
        rounded-lg cursor-pointer
        bg-surface-2 border border-border text-ink-2
        hover:border-brand-border hover:text-ink hover:bg-surface
        active:scale-95 transition-all duration-150
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1
        ${sizeClasses}
        ${className}
      `}
    >
      <span className="sr-only">Toggle theme</span>
      
      {/* Sun icon for dark mode */}
      <Sun
        size={iconSizes}
        className={`
          transition-all duration-300 transform
          ${isDark
            ? 'rotate-0 scale-100 opacity-100 text-amber-400'
            : '-rotate-90 scale-0 opacity-0 absolute text-amber-500'}
        `}
        aria-hidden="true"
      />

      {/* Moon icon for light mode */}
      <Moon
        size={iconSizes}
        className={`
          transition-all duration-300 transform
          ${isDark
            ? 'rotate-90 scale-0 opacity-0 absolute text-indigo-400'
            : 'rotate-0 scale-100 opacity-100 text-indigo-500'}
        `}
        aria-hidden="true"
      />
    </button>
  )
}

export default ThemeToggle
