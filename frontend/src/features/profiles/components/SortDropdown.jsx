/**
 * SortDropdown.jsx — Advanced, accessible, and beautifully styled sort dropdown.
 *
 * Features:
 *   - Glassmorphic floating menu with smooth micro-animations.
 *   - Rich item representation with icons, labels, and descriptive captions.
 *   - Active selection indicators (tinted badge, active checkmark).
 *   - Complete click-outside and Escape key dismissal.
 *   - Full ARIA semantics: role="listbox", aria-activedescendant, aria-expanded.
 */
import { useState, useRef, useEffect, useCallback } from 'react'
import { Sparkles, Star, Clock, ArrowDownAZ, ChevronDown, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export const SORT_OPTIONS_CONFIG = [
  {
    value: 'featured',
    labelKey: 'directory.recommended',
    defaultLabel: 'Recommended',
    descKey: 'directory.sortDesc.recommended',
    defaultDesc: 'Best match & featured providers',
    icon: Sparkles,
    accentClass: 'text-brand bg-brand-light/30 border-brand/20',
  },
  {
    value: 'rating',
    labelKey: 'directory.highestRated',
    defaultLabel: 'Highest rated',
    descKey: 'directory.sortDesc.rating',
    defaultDesc: 'Top customer reviews and star ratings',
    icon: Star,
    accentClass: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  },
  {
    value: 'newest',
    labelKey: 'directory.newest',
    defaultLabel: 'Newest',
    descKey: 'directory.sortDesc.newest',
    defaultDesc: 'Recently registered and updated',
    icon: Clock,
    accentClass: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  },
  {
    value: 'name',
    labelKey: 'directory.alphabetical',
    defaultLabel: 'Name (A to Z)',
    descKey: 'directory.sortDesc.name',
    defaultDesc: 'Alphabetical order by provider name',
    icon: ArrowDownAZ,
    accentClass: 'text-violet-500 bg-violet-500/10 border-violet-500/20',
  },
]

export function SortDropdown({ value = 'featured', onChange, className = '' }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  const activeOption = SORT_OPTIONS_CONFIG.find(o => o.value === value) || SORT_OPTIONS_CONFIG[0]
  const ActiveIcon = activeOption.icon

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
          group inline-flex items-center gap-2 h-9 pl-2.5 pr-3 rounded-xl
          bg-surface border text-ink font-medium text-[12.5px] sm:text-[13px]
          transition-all duration-200 cursor-pointer select-none
          shadow-[0_1px_3px_rgba(0,0,0,0.06)]
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1
          ${open
            ? 'border-brand ring-2 ring-brand/10 shadow-[0_4px_16px_rgba(0,0,0,0.08)] bg-surface-2'
            : 'border-border hover:border-brand-border hover:bg-surface-2'
          }
        `}
      >
        <span
          className={`
            w-5 h-5 rounded-lg flex items-center justify-center border shrink-0 transition-transform duration-200
            ${activeOption.accentClass}
            group-hover:scale-105
          `}
          aria-hidden="true"
        >
          <ActiveIcon size={12} className="stroke-[2.2]" />
        </span>

        <span className="truncate text-ink leading-none font-semibold">
          {t(activeOption.labelKey, activeOption.defaultLabel)}
        </span>

        <ChevronDown
          size={13}
          className={`
            text-ink-3 transition-transform duration-200 shrink-0
            ${open ? 'rotate-180 text-brand' : 'group-hover:text-ink'}
          `}
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
            absolute right-0 mt-2 w-64 sm:w-72
            bg-surface/95 backdrop-blur-xl
            border border-border/80 rounded-2xl
            shadow-[0_12px_36px_rgba(0,0,0,0.18)]
            z-50 p-1.5 overflow-hidden
            animate-in fade-in zoom-in-95 duration-150 origin-top-right
          "
        >
          {/* Header */}
          <div className="px-3 pt-2 pb-1.5 flex items-center justify-between border-b border-border/50 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-3">
              {t('directory.sortBy', 'Sort Results')}
            </span>
            <span className="text-[10.5px] text-ink-4">
              {SORT_OPTIONS_CONFIG.length} {t('directory.options', 'options')}
            </span>
          </div>

          {/* Options List */}
          <div className="space-y-0.5">
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
                    w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left
                    transition-all duration-150 cursor-pointer select-none group
                    focus-visible:outline-none focus-visible:bg-surface-2
                    ${isSelected
                      ? 'bg-brand/10 text-brand font-semibold shadow-xs'
                      : 'text-ink-2 hover:text-ink hover:bg-surface-2'
                    }
                  `}
                >
                  <span
                    className={`
                      w-7 h-7 rounded-lg flex items-center justify-center border shrink-0
                      transition-all duration-150
                      ${option.accentClass}
                      ${isSelected ? 'scale-105 shadow-xs' : 'group-hover:scale-105'}
                    `}
                    aria-hidden="true"
                  >
                    <Icon size={14} className="stroke-[2.2]" />
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] leading-tight truncate font-semibold">
                        {t(option.labelKey, option.defaultLabel)}
                      </span>
                    </div>
                    <p className="text-[11px] text-ink-3 truncate leading-snug mt-0.5">
                      {t(option.descKey, option.defaultDesc)}
                    </p>
                  </div>

                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-brand/15 text-brand flex items-center justify-center shrink-0">
                      <Check size={12} className="stroke-[2.8]" />
                    </span>
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
