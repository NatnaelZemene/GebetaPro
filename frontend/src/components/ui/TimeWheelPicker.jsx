/**
 * TimeWheelPicker.jsx — Advanced scroll-wheel time selector with mechanical tick audio & haptics.
 *
 * Modeled after premium iOS/watchOS dial wheels:
 *   - Continuous smooth vertical scrolling with native momentum and snap.
 *   - Tactile audio ratchet click on every item tick (via Web Audio API) + mobile vibration.
 *   - Gradient depth perspective fading out items away from the center line.
 *   - Desktop & touch friendly (touch drag, mouse wheel, or direct click on any number).
 *   - Converts seamlessly between 24h internal storage ("HH:mm") and 12h user display ("hh:mm A").
 */
import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { playWheelTickSound } from '../../utils/wheelAudio.js'

const ITEM_HEIGHT = 44 // px
const VISIBLE_COUNT = 5 // 5 items visible (center is index 2)
const PADDING_COUNT = 2 // 2 items of padding above and below center

export const HOURS_12 = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'))
export const MINUTES_60 = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))
export const PERIODS = ['AM', 'PM']

/** Helper: Parse 24h string ("09:00", "18:30") to 12h pieces */
export function parse24hTo12h(timeStr = '09:00') {
  if (!timeStr || typeof timeStr !== 'string') {
    return { hour: '09', minute: '00', period: 'AM' }
  }
  const [hStr, mStr] = timeStr.split(':')
  let h = parseInt(hStr, 10)
  const m = parseInt(mStr || '0', 10)
  if (isNaN(h)) h = 9
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return {
    hour: String(h12).padStart(2, '0'),
    minute: String(isNaN(m) ? 0 : Math.max(0, Math.min(59, m))).padStart(2, '0'),
    period,
  }
}

/** Helper: Convert 12h pieces back to 24h string ("18:30") */
export function format12hTo24h(hourStr, minuteStr, period) {
  let h = parseInt(hourStr, 10) || 12
  const m = parseInt(minuteStr, 10) || 0
  if (period === 'PM') {
    if (h < 12) h += 12
  } else {
    if (h === 12) h = 0
  }
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** Helper: Format 24h string to localized or readable 12h display */
export function formatTimeDisplay(timeStr) {
  const { hour, minute, period } = parse24hTo12h(timeStr)
  return `${hour}:${minute} ${period}`
}

/* ─────────────────────────────────────────────────────────────────────────────
   WheelColumn Component
───────────────────────────────────────────────────────────────────────────── */
function WheelColumn({ items, value, onChange, label, widthClass = 'w-16' }) {
  const scrollRef = useRef(null)
  const isUserScrollingRef = useRef(false)
  const scrollTimeoutRef = useRef(null)
  const lastEmittedValueRef = useRef(value)
  const isInitialMountRef = useRef(true)

  const selectedIndex = useMemo(() => {
    const idx = items.indexOf(value)
    return idx >= 0 ? idx : 0
  }, [items, value])

  // Center the scroll position on selected item
  const scrollToItem = useCallback((index, smooth = false) => {
    if (!scrollRef.current) return
    const targetTop = index * ITEM_HEIGHT
    if (Math.abs(scrollRef.current.scrollTop - targetTop) > 1) {
      scrollRef.current.scrollTo({
        top: targetTop,
        behavior: smooth ? 'smooth' : 'auto',
      })
    }
  }, [])

  // Initial scroll position
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToItem(selectedIndex, false)
      isInitialMountRef.current = false
    }, 10)
    return () => clearTimeout(timer)
  }, [])

  // Programmatic updates when value changes externally
  useEffect(() => {
    if (!isUserScrollingRef.current) {
      scrollToItem(selectedIndex, true)
    }
    lastEmittedValueRef.current = value
  }, [selectedIndex, scrollToItem, value])

  const handleScroll = (e) => {
    isUserScrollingRef.current = true
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)

    const scrollTop = e.currentTarget.scrollTop
    const newIndex = Math.max(0, Math.min(items.length - 1, Math.round(scrollTop / ITEM_HEIGHT)))
    const newValue = items[newIndex]

    if (newValue && newValue !== lastEmittedValueRef.current) {
      lastEmittedValueRef.current = newValue
      if (!isInitialMountRef.current) {
        playWheelTickSound()
      }
      onChange(newValue)
    }

    scrollTimeoutRef.current = setTimeout(() => {
      isUserScrollingRef.current = false
      // Snap strictly to item boundary
      scrollToItem(newIndex, true)
    }, 120)
  }

  return (
    <div
      className={`relative h-[220px] ${widthClass} select-none`}
      role="group"
      aria-label={label}
    >
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="
          h-full w-full overflow-y-scroll snap-y snap-mandatory
          no-scrollbar overscroll-y-contain
        "
        style={{
          scrollSnapType: 'y mandatory',
          paddingTop: `${PADDING_COUNT * ITEM_HEIGHT}px`,
          paddingBottom: `${PADDING_COUNT * ITEM_HEIGHT}px`,
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {items.map((item, idx) => {
          const isSelected = item === value
          return (
            <button
              key={item}
              type="button"
              onClick={() => {
                playWheelTickSound()
                onChange(item)
                scrollToItem(idx, true)
              }}
              className={`
                w-full flex items-center justify-center
                h-[44px] cursor-pointer snap-center
                transition-all duration-150 outline-none
                ${isSelected
                  ? 'text-ink font-semibold text-[20px] sm:text-[22px] scale-105'
                  : 'text-ink-3/60 hover:text-ink-2 font-medium text-[16px] sm:text-[17px]'
                }
              `}
              aria-selected={isSelected}
            >
              <span className="tabular-nums leading-none tracking-tight">
                {item}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   TimeWheelPicker Modal Dialog
───────────────────────────────────────────────────────────────────────────── */
export function TimeWheelPicker({
  isOpen,
  initialTime = '09:00',
  onSave,
  onClose,
  title,
}) {
  const { t } = useTranslation()
  const initial12h = useMemo(() => parse24hTo12h(initialTime), [initialTime])

  const [hour, setHour] = useState(initial12h.hour)
  const [minute, setMinute] = useState(initial12h.minute)
  const [period, setPeriod] = useState(initial12h.period)
  const modalRef = useRef(null)

  // Reset to initial time whenever the picker is opened
  useEffect(() => {
    if (isOpen) {
      const parsed = parse24hTo12h(initialTime)
      setHour(parsed.hour)
      setMinute(parsed.minute)
      setPeriod(parsed.period)
    }
  }, [isOpen, initialTime])

  // Dismiss on Escape key
  useEffect(() => {
    if (!isOpen) return
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Enter') handleSave()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, hour, minute, period])

  function handleSave() {
    const time24 = format12hTo24h(hour, minute, period)
    onSave(time24)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title || t('profile.hours.selectTime', 'Select time')}
    >
      <div
        ref={modalRef}
        className="
          relative w-[260px] sm:w-[280px]
          bg-surface border border-border rounded-2xl
          shadow-[0_20px_50px_rgba(0,0,0,0.22)] dark:shadow-[0_24px_60px_rgba(0,0,0,0.7)]
          p-4 sm:p-5 overflow-hidden animate-scale-in
        "
      >
        {/* Title */}
        <h3 className="text-center text-[15px] sm:text-[16px] font-semibold text-ink tracking-tight mb-3">
          {title || t('profile.hours.selectTime', 'Select time')}
        </h3>

        {/* Wheel Box Container */}
        <div className="relative flex items-center justify-center my-2 select-none overflow-hidden rounded-xl">
          {/* Active row frame indicator */}
          <div
            className="
              pointer-events-none absolute left-1 right-1
              top-[88px] h-[44px]
              border border-border/80 bg-surface-2/60
              rounded-xl z-10
            "
            aria-hidden="true"
          />

          {/* Top subtle fade gradient */}
          <div
            className="
              pointer-events-none absolute top-0 left-0 right-0 h-16
              bg-gradient-to-b from-surface via-surface/85 to-transparent
              z-20
            "
            aria-hidden="true"
          />

          {/* Bottom subtle fade gradient */}
          <div
            className="
              pointer-events-none absolute bottom-0 left-0 right-0 h-16
              bg-gradient-to-t from-surface via-surface/85 to-transparent
              z-20
            "
            aria-hidden="true"
          />

          {/* Hour Column */}
          <WheelColumn
            items={HOURS_12}
            value={hour}
            onChange={setHour}
            label="Hours"
            widthClass="w-16"
          />

          {/* Colon Separator */}
          <span
            className="text-[20px] sm:text-[22px] font-semibold text-ink-3 pb-1 px-1 z-30 select-none"
            aria-hidden="true"
          >
            :
          </span>

          {/* Minute Column */}
          <WheelColumn
            items={MINUTES_60}
            value={minute}
            onChange={setMinute}
            label="Minutes"
            widthClass="w-16"
          />

          {/* AM / PM Column */}
          <WheelColumn
            items={PERIODS}
            value={period}
            onChange={setPeriod}
            label="AM or PM"
            widthClass="w-16"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-3 mt-1 border-t border-border/60">
          <button
            type="button"
            onClick={onClose}
            className="
              px-4 py-2 text-[13.5px] font-medium text-ink-2 hover:text-ink
              transition-colors duration-150 cursor-pointer rounded-xl
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand
            "
          >
            {t('common.cancel', 'Cancel')}
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="
              px-5 py-2 text-[13.5px] font-semibold
              bg-surface border border-border hover:border-brand-border
              text-ink hover:text-brand hover:bg-surface-2
              rounded-xl shadow-xs transition-all duration-150 cursor-pointer
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand
            "
          >
            {t('common.save', 'Save')}
          </button>
        </div>
      </div>
    </div>
  )
}
