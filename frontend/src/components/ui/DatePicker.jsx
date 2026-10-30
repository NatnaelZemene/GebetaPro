/**
 * DatePicker.jsx — Advanced, ultra-modern SaaS Date Picker component.
 *
 * Inspired by modern design systems (Linear, Vercel, Supabase, shadcn/ui):
 *   - Custom trigger with calendar icon, clear button, and formatted date label
 *   - Elevated floating popover with rounded-2xl corners, backdrop blur, and soft shadow
 *   - Multi-mode navigation: Day calendar, Month selector, and Year selector
 *   - Segmented view mode toggle ([Day | Month | Year])
 *   - Quick actions ("Today", "Clear")
 *   - Keyboard accessibility (Escape, Enter, arrows) and click-outside dismissal
 *   - Seamless drop-in compatibility for standard form onChange handlers
 */
import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, ChevronDown } from 'lucide-react'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

const DAYS_OF_WEEK = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

/**
 * Format a Date object or YYYY-MM-DD string to "YYYY-MM-DD"
 */
function toDateString(date) {
  if (!date) return ''
  if (typeof date === 'string') {
    return date.split('T')[0]
  }
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Parse YYYY-MM-DD safely into a local Date
 */
function parseDateString(str) {
  if (!str) return null
  const cleaned = String(str).split('T')[0]
  const [year, month, day] = cleaned.split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

/**
 * Format date for friendly display (e.g. "Oct 30, 2026")
 */
function formatDisplayDate(dateStr) {
  const d = parseDateString(dateStr)
  if (!d) return ''
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function DatePicker({
  value = '',
  onChange,
  placeholder = 'Select date',
  disabled = false,
  error = false,
  id,
  className = '',
  minDate,
  maxDate,
}) {
  const [open, setOpen] = useState(false)
  const [viewMode, setViewMode] = useState('day') // 'day' | 'month' | 'year'
  const containerRef = useRef(null)

  const selectedDate = useMemo(() => parseDateString(value), [value])
  const today = useMemo(() => new Date(), [])

  // Current view cursor state (year & month)
  const [viewDate, setViewDate] = useState(() => {
    return selectedDate ? new Date(selectedDate) : new Date()
  })

  // Synchronize viewDate when value changes externally
  useEffect(() => {
    if (selectedDate) {
      setViewDate(new Date(selectedDate))
    }
  }, [value])

  const currentYear = viewDate.getFullYear()
  const currentMonth = viewDate.getMonth()

  const close = useCallback(() => {
    setOpen(false)
    setViewMode('day')
  }, [])

  // Outside click & Escape listener
  useEffect(() => {
    if (!open) return
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        close()
      }
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

  // Navigation handlers
  function handlePrev() {
    if (viewMode === 'day') {
      setViewDate(new Date(currentYear, currentMonth - 1, 1))
    } else if (viewMode === 'month') {
      setViewDate(new Date(currentYear - 1, currentMonth, 1))
    } else if (viewMode === 'year') {
      setViewDate(new Date(currentYear - 12, currentMonth, 1))
    }
  }

  function handleNext() {
    if (viewMode === 'day') {
      setViewDate(new Date(currentYear, currentMonth + 1, 1))
    } else if (viewMode === 'month') {
      setViewDate(new Date(currentYear + 1, currentMonth, 1))
    } else if (viewMode === 'year') {
      setViewDate(new Date(currentYear + 12, currentMonth, 1))
    }
  }

  // Trigger onChange compatible with both raw string and event shape
  function emitChange(newDateStr) {
    if (!onChange) return
    // Support standard React synthetic event or direct value
    onChange({ target: { value: newDateStr, id, name: id }, currentTarget: { value: newDateStr } })
  }

  function handleSelectDate(dayNum, isCurrentMonth, monthOffset = 0) {
    const targetMonth = currentMonth + monthOffset
    const targetDate = new Date(currentYear, targetMonth, dayNum)
    const dateStr = toDateString(targetDate)
    emitChange(dateStr)
    close()
  }

  function handleSelectMonth(mIndex) {
    setViewDate(new Date(currentYear, mIndex, 1))
    setViewMode('day')
  }

  function handleSelectYear(y) {
    setViewDate(new Date(y, currentMonth, 1))
    setViewMode('month')
  }

  function handleSelectToday() {
    const todayStr = toDateString(today)
    emitChange(todayStr)
    setViewDate(new Date(today))
    close()
  }

  function handleClear(e) {
    e.stopPropagation()
    emitChange('')
  }

  // Calendar days grid computation (Monday-start)
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1)
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0)
    const totalDays = lastDayOfMonth.getDate()

    // 0 = Sunday, 1 = Monday ... 6 = Saturday
    // Convert to Monday = 0, Sunday = 6
    let startingDay = firstDayOfMonth.getDay() - 1
    if (startingDay === -1) startingDay = 6

    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate()

    const days = []

    // Previous month filler days
    for (let i = startingDay - 1; i >= 0; i--) {
      days.push({
        day: prevMonthLastDay - i,
        isCurrentMonth: false,
        monthOffset: -1,
      })
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      days.push({
        day: i,
        isCurrentMonth: true,
        monthOffset: 0,
      })
    }

    // Next month filler days (fill to 35 or 42 cells)
    const remaining = (7 - (days.length % 7)) % 7
    for (let i = 1; i <= remaining; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
        monthOffset: 1,
      })
    }

    return days
  }, [currentYear, currentMonth])

  // Year range computation for Year view (12 years grid)
  const yearStart = Math.floor(currentYear / 12) * 12
  const yearsList = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => yearStart + i)
  }, [yearStart])

  const formattedDisplay = value ? formatDisplayDate(value) : ''

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => !disabled && setOpen(prev => !prev)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`
          w-full h-10 px-3
          flex items-center justify-between gap-2.5
          bg-surface hover:bg-surface-2/60
          border rounded-xl
          text-left transition-all duration-150 select-none
          disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-surface-2
          ${error ? 'border-danger focus:border-danger ring-danger/20' : ''}
          ${open
            ? 'border-ink dark:border-white ring-2 ring-ink/10 dark:ring-white/10 shadow-xs'
            : 'border-border-2 hover:border-border-strong shadow-2xs'
          }
        `}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <CalendarIcon size={15} className="text-ink-3 shrink-0" />
          <span className={`text-[13.5px] truncate ${value ? 'font-medium text-ink' : 'text-ink-3'}`}>
            {formattedDisplay || placeholder}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {value && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => e.key === 'Enter' && handleClear(e)}
              className="p-1 rounded-md text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
              title="Clear date"
              aria-label="Clear date"
            >
              <X size={12} />
            </span>
          )}
          <ChevronDown
            size={14}
            className={`text-ink-3 transition-transform duration-200 ${open ? 'rotate-180 text-ink' : ''}`}
          />
        </div>
      </button>

      {/* Floating Modern Datepicker Popover */}
      {open && (
        <div
          role="dialog"
          aria-label="Choose date"
          className="
            absolute top-full left-0 mt-2 z-50
            w-72 sm:w-80 max-w-[calc(100vw-2rem)]
            bg-surface/98 dark:bg-neutral-900/98 backdrop-blur-xl
            border border-border/80 dark:border-neutral-800
            rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.14)] dark:shadow-[0_20px_45px_rgba(0,0,0,0.6)]
            p-3.5
            animate-in fade-in zoom-in-95 duration-150
          "
        >
          {/* Top Segmented View Mode Toggle (Day | Month | Year) */}
          <div className="flex items-center justify-between gap-1 p-1 mb-3 bg-surface-2/80 dark:bg-neutral-800/80 rounded-xl border border-border/50 text-[12px] font-medium">
            <button
              type="button"
              onClick={() => setViewMode('day')}
              className={`
                flex-1 py-1 px-2 rounded-lg text-center transition-all cursor-pointer
                ${viewMode === 'day'
                  ? 'bg-surface dark:bg-neutral-900 text-ink font-semibold shadow-2xs border border-border/50'
                  : 'text-ink-3 hover:text-ink'
                }
              `}
            >
              Day
            </button>
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`
                flex-1 py-1 px-2 rounded-lg text-center transition-all cursor-pointer
                ${viewMode === 'month'
                  ? 'bg-surface dark:bg-neutral-900 text-ink font-semibold shadow-2xs border border-border/50'
                  : 'text-ink-3 hover:text-ink'
                }
              `}
            >
              Month
            </button>
            <button
              type="button"
              onClick={() => setViewMode('year')}
              className={`
                flex-1 py-1 px-2 rounded-lg text-center transition-all cursor-pointer
                ${viewMode === 'year'
                  ? 'bg-surface dark:bg-neutral-900 text-ink font-semibold shadow-2xs border border-border/50'
                  : 'text-ink-3 hover:text-ink'
                }
              `}
            >
              Year
            </button>
          </div>

          {/* Navigation Header */}
          <div className="flex items-center justify-between mb-3 px-1">
            <button
              type="button"
              onClick={handlePrev}
              className="p-1.5 rounded-lg text-ink-2 hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
              title="Previous"
            >
              <ChevronLeft size={16} />
            </button>

            <button
              type="button"
              onClick={() => {
                if (viewMode === 'day') setViewMode('month')
                else if (viewMode === 'month') setViewMode('year')
              }}
              className="text-[13.5px] font-bold text-ink hover:text-brand hover:underline transition-colors px-2 py-0.5 rounded-lg"
            >
              {viewMode === 'day' && `${MONTH_NAMES[currentMonth]} ${currentYear}`}
              {viewMode === 'month' && `${currentYear}`}
              {viewMode === 'year' && `${yearStart} – ${yearStart + 11}`}
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="p-1.5 rounded-lg text-ink-2 hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
              title="Next"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* ── Day View: Calendar Grid ─────────────────────────────────── */}
          {viewMode === 'day' && (
            <div>
              {/* Day of Week Headers */}
              <div className="grid grid-cols-7 gap-1 text-center mb-1">
                {DAYS_OF_WEEK.map(d => (
                  <span key={d} className="text-[11.5px] font-semibold text-ink-3/80 py-1 select-none">
                    {d}
                  </span>
                ))}
              </div>

              {/* Day cells grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((item, idx) => {
                  const itemDate = new Date(currentYear, currentMonth + item.monthOffset, item.day)
                  const itemDateStr = toDateString(itemDate)
                  const isSelected = value && toDateString(selectedDate) === itemDateStr
                  const isToday = toDateString(today) === itemDateStr

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectDate(item.day, item.isCurrentMonth, item.monthOffset)}
                      className={`
                        h-9 w-full rounded-xl flex items-center justify-center text-[13px] font-medium
                        transition-all duration-150 cursor-pointer select-none relative
                        ${isSelected
                          ? 'bg-ink text-canvas dark:bg-white dark:text-neutral-950 font-bold shadow-xs'
                          : item.isCurrentMonth
                          ? 'text-ink hover:bg-surface-2'
                          : 'text-ink-3/40 hover:bg-surface-2/60'
                        }
                        ${isToday && !isSelected ? 'font-bold text-brand ring-1 ring-brand/40' : ''}
                      `}
                    >
                      {item.day}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Month View: 12-Month Grid ───────────────────────────────── */}
          {viewMode === 'month' && (
            <div className="grid grid-cols-3 gap-2 py-1">
              {MONTH_NAMES.map((name, idx) => {
                const isSelected = selectedDate &&
                  selectedDate.getFullYear() === currentYear &&
                  selectedDate.getMonth() === idx
                const isCurrentMonth = today.getFullYear() === currentYear && today.getMonth() === idx

                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => handleSelectMonth(idx)}
                    className={`
                      py-2.5 px-3 rounded-xl text-[12.5px] font-medium text-center
                      border transition-all duration-150 cursor-pointer
                      ${isSelected
                        ? 'bg-ink text-canvas dark:bg-white dark:text-neutral-950 font-bold border-ink dark:border-white shadow-xs'
                        : 'bg-surface hover:bg-surface-2 text-ink border-border/80'
                      }
                      ${isCurrentMonth && !isSelected ? 'border-brand text-brand font-semibold' : ''}
                    `}
                  >
                    {MONTH_SHORT[idx]}
                  </button>
                )
              })}
            </div>
          )}

          {/* ── Year View: 12-Year Grid ─────────────────────────────────── */}
          {viewMode === 'year' && (
            <div className="grid grid-cols-3 gap-2 py-1">
              {yearsList.map(y => {
                const isSelected = selectedDate && selectedDate.getFullYear() === y
                const isCurrentYear = today.getFullYear() === y

                return (
                  <button
                    key={y}
                    type="button"
                    onClick={() => handleSelectYear(y)}
                    className={`
                      py-2.5 px-3 rounded-xl text-[12.5px] font-medium text-center
                      border transition-all duration-150 cursor-pointer
                      ${isSelected
                        ? 'bg-ink text-canvas dark:bg-white dark:text-neutral-950 font-bold border-ink dark:border-white shadow-xs'
                        : 'bg-surface hover:bg-surface-2 text-ink border-border/80'
                      }
                      ${isCurrentYear && !isSelected ? 'border-brand text-brand font-semibold' : ''}
                    `}
                  >
                    {y}
                  </button>
                )
              })}
            </div>
          )}

          {/* Footer Quick Actions */}
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-border/60 px-1">
            <button
              type="button"
              onClick={handleClear}
              className="text-[11.5px] font-medium text-ink-3 hover:text-danger transition-colors cursor-pointer"
            >
              Clear
            </button>

            <button
              type="button"
              onClick={handleSelectToday}
              className="text-[11.5px] font-bold text-ink hover:underline transition-colors cursor-pointer"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
