/**
 * SortDropdown.jsx — Professional SaaS sort dropdown component.
 *
 * Designed with enterprise-grade aesthetics:
 *   - Monochromatic, purpose-built Lucide icons (no AI-style sparkles or pastel badges).
 *   - Subtle trigger with ArrowUpDown indicator.
 *   - Clean floating menu with precise typography, option subtitles, and active checkmarks.
 *   - Full keyboard navigation (Escape), click-outside dismissal, and ARIA roles.
 */
import { useState, useRef, useEffect, useCallback } from 'react'
import { TrendingUp, Star, Clock, ArrowDownAZ, ArrowUpDown, ChevronDown, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export const SORT_OPTIONS_CONFIG = [
  {
    value: 'featured',
    labelKey: 'directory.recommended',
    defaultLabel: 'Recommended',
    descKey: 'directory.sortDesc.recommended',
    defaultDesc: 'Best match & featured providers',
    icon: TrendingUp,
  },
  {
    value: 'rating',
    labelKey: 'directory.highestRated',
    defaultLabel: 'Highest rated',
    descKey: 'directory.sortDesc.rating',
    defaultDesc: 'Top customer reviews and star ratings',
    icon: Star,
  },
  {
    value: 'newest',
    labelKey: 'directory.newest',
    defaultLabel: 'Newest',
    descKey: 'directory.sortDesc.newest',
    defaultDesc: 'Recently registered and updated',
    icon: Clock,
  },
  {
    value: 'name',
    labelKey: 'directory.alphabetical',
    defaultLabel: 'Name (A to Z)',
    descKey: 'directory.sortDesc.name',
    defaultDesc: 'Alphabetical order by provider name',
    icon: ArrowDownAZ,
  },
]

export function SortDropdown({ value = 'featured', onChange, className = '' }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  const activeOption = SORT_OPTIONS_CONFIG.find(o => o.value === value) || SORT_OPTIONS_CONFIG[0]

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e) {
      if (!containerRef.current?.contains(e.target)) close()
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, close])

  function handleSelect(optionValue) {
    onChange?.(optionValue)
    close()
  }

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Sort by: ${t(activeOption.labelKey, activeOption.defaultLabel)}`}
        className={`
          inline-flex items-center gap-2 h-8 px-2.5 rounded-lg
          bg-surface border border-border text-ink text-[12.5px] font-medium
          hover:border-brand-border hover:bg-surface-2 transition-all duration-150
          cursor-pointer select-none
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1
          ${open ? 'border-brand text-ink ring-2 ring-brand/10 bg-surface-2' : ''}
        `}
      >
        <ArrowUpDown size={12} className="text-ink-3 shrink-0" aria-hidden="true" />
        <span className="truncate max-w-[130px] font-medium">
          {t(activeOption.labelKey, activeOption.defaultLabel)}
        </span>
        <ChevronDown
          size={11}
          className={`text-ink-3 shrink-0 transition-transform duration-150 ${open ? 'rotate-180 text-brand' : ''}`}
          aria-hidden="true"
        />
      </button>

      {/* Popover Menu */}
      {open && (
        <div
          role="listbox"
          tabIndex={-1}
          aria-label="Sort options"
          className="
            absolute left-0 sm:left-auto sm:right-0 mt-1.5 w-52 sm:w-56 max-w-[calc(100vw-24px)]
            bg-surface border border-border rounded-xl
            shadow-xl shadow-black/15 dark:shadow-black/60
            z-50 py-1 overflow-hidden
            animate-fade-in
          "
        >
          {/* Header */}
          <div className="px-3 py-1.5 border-b border-border/70 flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-3">
              {t('directory.sortBy', 'Sort By')}
            </span>
            <span className="text-[10px] text-ink-4">
              {SORT_OPTIONS_CONFIG.length} {t('directory.options', 'options')}
            </span>
          </div>

          {/* Options List — title-only with icon and checkmark */}
          <div className="px-1 space-y-0.5">
            {SORT_OPTIONS_CONFIG.map((option) => {
              const isSelected = option.value === value
              const Icon = option.icon
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(option.value)}
                  className={`
                    w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left
                    transition-colors duration-100 cursor-pointer select-none group
                    focus-visible:outline-none focus-visible:bg-surface-2
                    ${isSelected
                      ? 'bg-brand-light/50 text-brand font-semibold'
                      : 'text-ink-2 hover:bg-surface-2 hover:text-ink font-medium'
                    }
                  `}
                >
                  <Icon
                    size={14}
                    className={`shrink-0 transition-colors ${
                      isSelected ? 'text-brand' : 'text-ink-3 group-hover:text-ink'
                    }`}
                    aria-hidden="true"
                  />

                  <span className="flex-1 min-w-0 text-[12.5px] leading-tight truncate">
                    {t(option.labelKey, option.defaultLabel)}
                  </span>

                  {isSelected && (
                    <Check size={13} className="text-brand shrink-0 ml-1.5" aria-hidden="true" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
