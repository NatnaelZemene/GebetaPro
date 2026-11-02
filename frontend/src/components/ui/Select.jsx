/**
 * Select.jsx — Advanced, enterprise-grade custom dropdown component.
 *
 * Modern replacement for generic browser <select> controls:
 *   - Sleek trigger button with active label, placeholder state, and animated chevron.
 *   - Floating popover with backdrop blur, elevated shadow, and smooth entrance animation.
 *   - Real-time instant search filter (automatically activated when options > 7).
 *   - Support for parent/subcategory hierarchy, indented items, and option subtitles.
 *   - Active selection indicator with brand teal checkmark.
 *   - Full keyboard navigation (ArrowUp/Down, Enter, Escape, Space).
 *   - Smart viewport collision detection (opens upward when near screen bottom).
 *   - Mobile touch-optimized layout (comfortable 40px+ touch targets, smooth scrolling).
 *   - 100% backwards compatible with <option> children or an options prop.
 */
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { ChevronDown, Search, X, Check } from 'lucide-react'
import { CategoryIcon, CategoryIconInline } from '../../features/profiles/components/CategoryIcon.jsx'

export function Select({
  value,
  defaultValue,
  onChange,
  options,
  children,
  placeholder = 'Select…',
  error,
  disabled = false,
  className = '',
  searchable,
  id,
  name,
  required,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedby,
  ...rest
}) {
  const [open, setOpen] = useState(false)
  const [internalValue, setInternalValue] = useState(value !== undefined ? value : defaultValue ?? '')
  const [searchQuery, setSearchQuery] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [openUpward, setOpenUpward] = useState(false)

  const containerRef = useRef(null)
  const searchInputRef = useRef(null)
  const listboxRef = useRef(null)

  // Sync controlled value
  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value)
    }
  }, [value])

  // Parse options from either `options` prop or `children` (<option> / <optgroup> tags)
  const parsedOptions = useMemo(() => {
    if (Array.isArray(options) && options.length > 0) {
      return options.map(o => ({
        value: String(o.value ?? ''),
        label: o.label ?? o.name ?? String(o.value),
        slug: o.slug || null,
        icon: o.icon || null,
        subtitle: o.subtitle || null,
        disabled: Boolean(o.disabled),
        style: o.style || {},
        isParent: Boolean(o.isParent),
        isIndented: Boolean(o.isIndented),
        group: o.group || null,
      }))
    }

    const items = []

    function processChild(child) {
      if (!child) return
      if (Array.isArray(child)) {
        child.forEach(processChild)
        return
      }
      if (child.type === React.Fragment && child.props?.children) {
        React.Children.forEach(child.props.children, processChild)
        return
      }
      if (React.isValidElement(child)) {
        if (child.type === 'option') {
          const val = child.props.value !== undefined ? String(child.props.value) : ''
          let label = child.props.children
          if (Array.isArray(label)) {
            label = label.filter(Boolean).join('')
          }
          const isParent = Boolean(
            child.props['data-parent'] ||
            child.props.style?.fontWeight === 'bold' ||
            child.props.style?.fontWeight === 700
          )
          const isIndented = Boolean(
            child.props['data-indented'] ||
            child.props.style?.paddingLeft ||
            (typeof child.props.style?.paddingLeft === 'string' && child.props.style.paddingLeft !== '0px')
          )
          const slug = child.props['data-slug'] || child.props.slug || null
          const icon = child.props['data-icon'] || child.props.icon || null
          items.push({
            value: val,
            label: typeof label === 'string' || typeof label === 'number' ? String(label) : val,
            slug,
            icon,
            disabled: Boolean(child.props.disabled),
            style: child.props.style || {},
            className: child.props.className || '',
            isParent,
            isIndented,
          })
        } else if (child.type === 'optgroup') {
          items.push({
            isGroupHeader: true,
            label: child.props.label || '',
          })
          if (child.props.children) {
            React.Children.forEach(child.props.children, processChild)
          }
        }
      }
    }

    React.Children.forEach(children, processChild)
    return items
  }, [options, children])

  // Find currently selected option
  const selectedOption = useMemo(() => {
    const target = String(internalValue ?? '')
    return parsedOptions.find(o => !o.isGroupHeader && o.value === target) || null
  }, [parsedOptions, internalValue])

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return parsedOptions
    return parsedOptions.filter(o => {
      if (o.isGroupHeader) return false
      const labelMatch = (o.label || '').toLowerCase().includes(q)
      const valMatch = (o.value || '').toLowerCase().includes(q)
      return labelMatch || valMatch
    })
  }, [parsedOptions, searchQuery])

  // Decide whether search input should be visible (default: when > 7 selectable options)
  const isSearchable = useMemo(() => {
    if (typeof searchable === 'boolean') return searchable
    const selectableCount = parsedOptions.filter(o => !o.isGroupHeader).length
    return selectableCount > 7
  }, [searchable, parsedOptions])

  // Close helper
  const close = useCallback(() => {
    setOpen(false)
    setSearchQuery('')
    setHighlightedIndex(-1)
  }, [])

  // Check collision with screen bounds to open upward if needed
  useEffect(() => {
    if (!open || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top
    const estimatedHeight = Math.min(320, filteredOptions.length * 40 + (isSearchable ? 55 : 0))

    if (spaceBelow < estimatedHeight && spaceAbove > spaceBelow) {
      setOpenUpward(true)
    } else {
      setOpenUpward(false)
    }

    if (isSearchable) {
      setTimeout(() => searchInputRef.current?.focus(), 50)
    }
  }, [open, filteredOptions.length, isSearchable])

  // Outside click listener
  useEffect(() => {
    if (!open) return
    function handleClickOutside(e) {
      if (!containerRef.current?.contains(e.target)) {
        close()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open, close])

  // Trigger option selection
  const handleSelectOption = useCallback((opt) => {
    if (!opt || opt.disabled || opt.isGroupHeader) return
    setInternalValue(opt.value)
    close()

    if (onChange) {
      const syntheticEvent = {
        target: { value: opt.value, name: name || id || '' },
        currentTarget: { value: opt.value, name: name || id || '' },
        value: opt.value,
        preventDefault() {},
        stopPropagation() {},
      }
      onChange(syntheticEvent, opt.value)
    }
  }, [close, onChange, name, id])

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (disabled) return

    if (!open) {
      if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
        e.preventDefault()
        setOpen(true)
      }
      return
    }

    const selectableItems = filteredOptions.filter(o => !o.isGroupHeader && !o.disabled)
    if (selectableItems.length === 0) {
      if (e.key === 'Escape') close()
      return
    }

    if (e.key === 'Escape') {
      e.preventDefault()
      close()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex(prev => (prev < selectableItems.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : selectableItems.length - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (highlightedIndex >= 0 && selectableItems[highlightedIndex]) {
        handleSelectOption(selectableItems[highlightedIndex])
      }
    }
  }

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex < 0 || !listboxRef.current) return
    const el = listboxRef.current.querySelector(`[data-index="${highlightedIndex}"]`)
    if (el) {
      el.scrollIntoView({ block: 'nearest' })
    }
  }, [highlightedIndex])

  // Determine display label
  const displayLabel = useMemo(() => {
    if (selectedOption) {
      return selectedOption.label
    }
    // Fallback: check if an option with empty value exists
    const emptyOpt = parsedOptions.find(o => !o.isGroupHeader && o.value === '')
    if (emptyOpt) return emptyOpt.label
    return placeholder
  }, [selectedOption, parsedOptions, placeholder])

  const isPlaceholderActive = !selectedOption || selectedOption.value === ''

  // Distribute width classes so container respects flex or inline widths
  const widthMatches = className.match(/\bw-[^\s]+/g)
  const customWidthClass = widthMatches ? widthMatches.join(' ') : 'w-full'
  const hasCustomHeight = /\bh-[^\s]+/.test(className)

  return (
    <div
      ref={containerRef}
      className={`relative inline-block text-left font-sans select-none ${customWidthClass} ${open ? 'z-[1050]' : 'z-10'}`}
      onKeyDown={handleKeyDown}
      {...rest}
    >
      {/* Hidden standard select for HTML5 form serialization & validation */}
      <select
        id={id}
        name={name}
        value={internalValue}
        required={required}
        disabled={disabled}
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
        onChange={() => {}}
      >
        {parsedOptions.map((opt, i) => (
          <option key={opt.value || i} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* ── Main Trigger Button ────────────────────────────────────────── */}
      <button
        type="button"
        id={id ? `${id}-button` : undefined}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-invalid={error ? 'true' : undefined}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedby}
        onClick={() => setOpen(prev => !prev)}
        className={`
          w-full px-3.5
          ${hasCustomHeight ? '' : 'h-10'}
          bg-surface dark:bg-canvas/90
          border rounded-lg
          flex items-center justify-between gap-2.5
          text-[13.5px] text-ink text-left
          transition-all duration-150 cursor-pointer
          focus-visible:outline-none
          ${error
            ? 'border-danger focus:ring-2 focus:ring-danger/20'
            : open
              ? 'border-brand ring-2 ring-brand/15 shadow-xs'
              : 'border-border-2 hover:border-brand-border/80 focus:border-brand'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed bg-surface-2' : ''}
          ${className}
        `}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {selectedOption?.icon ? (
            <span className="shrink-0 flex items-center justify-center">
              {selectedOption.icon}
            </span>
          ) : selectedOption?.slug ? (
            <CategoryIcon
              slug={selectedOption.slug}
              name={selectedOption.label}
              size={13}
              boxSize="w-5.5 h-5.5"
              rounded="rounded-md"
              className="shrink-0 shadow-2xs"
            />
          ) : null}

          <span
            className={`truncate leading-normal ${
              isPlaceholderActive ? 'text-ink-3 font-normal' : 'font-medium text-ink'
            }`}
          >
            {displayLabel}
          </span>
        </div>

        <span className="shrink-0 flex items-center justify-center text-ink-3 transition-transform duration-200">
          <ChevronDown
            size={14}
            className={`transition-transform duration-200 ${open ? 'rotate-180 text-brand' : 'group-hover:text-ink'}`}
            aria-hidden="true"
          />
        </span>
      </button>

      {/* ── Floating Popover Menu ──────────────────────────────────────── */}
      {open && (
        <div
          role="listbox"
          tabIndex={-1}
          aria-label={ariaLabel || placeholder}
          className={`
            absolute left-0 w-full min-w-[200px] sm:min-w-[220px] max-w-[calc(100vw-1.5rem)]
            bg-surface/98 dark:bg-[#121820]/98 backdrop-blur-xl
            border border-border/90 dark:border-white/10
            rounded-xl shadow-[0_16px_40px_rgba(0,0,0,0.14)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)]
            overflow-hidden z-[1050]
            animate-in fade-in-50 zoom-in-95 duration-150
            ${openUpward ? 'bottom-full mb-1.5 origin-bottom' : 'top-full mt-1.5 origin-top'}
          `}
        >
          {/* Search Bar (if list is lengthy) */}
          {isSearchable && (
            <div className="p-2 border-b border-border bg-surface-2/40">
              <div className="relative flex items-center">
                <Search size={13} className="absolute left-2.5 text-ink-3 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value)
                    setHighlightedIndex(0)
                  }}
                  placeholder="Type to search…"
                  className="
                    w-full h-8 pl-7 pr-6
                    bg-surface dark:bg-canvas/80
                    border border-border rounded-lg
                    text-[12.5px] text-ink placeholder:text-ink-3
                    outline-none focus:border-brand focus:ring-1 focus:ring-brand/20
                    transition-all
                  "
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 text-ink-3 hover:text-ink p-0.5 rounded-full"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Options List */}
          <div
            ref={listboxRef}
            className="max-h-60 overflow-y-auto overscroll-contain p-1.5 space-y-0.5 scrollbar-thin text-left"
          >
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center px-3">
                <p className="text-[12.5px] font-medium text-ink-3">No matching options</p>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="mt-1.5 text-[11.5px] text-brand font-medium hover:underline cursor-pointer"
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              (() => {
                let selectableCounter = -1
                return filteredOptions.map((opt, idx) => {
                  if (opt.isGroupHeader) {
                    return (
                      <div
                        key={`header-${idx}`}
                        className="px-2.5 pt-2 pb-1 text-[11px] font-bold text-ink-4 uppercase tracking-wider select-none"
                      >
                        {opt.label}
                      </div>
                    )
                  }

                  selectableCounter++
                  const itemIndex = selectableCounter
                  const isSelected = String(internalValue ?? '') === String(opt.value ?? '')
                  const isHighlighted = highlightedIndex === itemIndex

                  // Subcategory vs Parent styling
                  const isParentCategory = opt.isParent
                  const isSubcategory = opt.isIndented

                  return (
                    <div
                      key={opt.value || `opt-${idx}`}
                      data-index={itemIndex}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelectOption(opt)}
                      onMouseEnter={() => setHighlightedIndex(itemIndex)}
                      className={`
                        w-full px-2.5 py-2 sm:py-1.5 min-h-[38px] sm:min-h-[34px] rounded-lg
                        flex items-center justify-between gap-2
                        transition-colors duration-100 cursor-pointer select-none
                        ${isSubcategory ? 'pl-5 text-[13px]' : 'text-[13.5px]'}
                        ${isParentCategory ? 'font-semibold text-ink pt-2 pb-1.5' : 'font-medium'}
                        ${isSelected
                          ? 'bg-brand-light/80 dark:bg-brand/20 text-brand font-semibold shadow-2xs'
                          : isHighlighted
                            ? 'bg-surface-2 dark:bg-white/5 text-ink'
                            : 'text-ink-2 hover:text-ink'
                        }
                        ${opt.disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''}
                      `}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {opt.icon ? (
                          <span className="shrink-0 flex items-center justify-center">
                            {opt.icon}
                          </span>
                        ) : opt.slug ? (
                          <CategoryIcon
                            slug={opt.slug}
                            name={opt.label}
                            size={isParentCategory ? 13 : 11}
                            boxSize={isParentCategory ? 'w-6 h-6' : 'w-5 h-5'}
                            rounded={isParentCategory ? 'rounded-md' : 'rounded'}
                            className="shrink-0 shadow-2xs"
                          />
                        ) : isSubcategory ? (
                          <span className={`text-[12px] ${isSelected ? 'text-brand' : 'text-ink-4'}`}>
                            ·
                          </span>
                        ) : null}

                        <span className={`truncate ${isParentCategory ? 'font-semibold text-ink' : ''}`}>
                          {opt.label}
                        </span>
                      </div>

                      {isSelected && (
                        <Check size={14} className="text-brand shrink-0 ml-1.5 animate-in zoom-in-75 duration-100" />
                      )}
                    </div>
                  )
                })
              })()
            )}
          </div>
        </div>
      )}
    </div>
  )
}
