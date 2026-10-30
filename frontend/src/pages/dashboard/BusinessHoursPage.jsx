import { useState, useMemo, useEffect } from 'react'
import {
  Clock, Copy, Check, Sparkles, Building2, Store, Zap,
  AlertCircle, Moon, RotateCcw,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { DashboardLayout } from '../../components/layout/DashboardLayout.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Skeleton } from '../../components/ui/Skeleton.jsx'
import { NoProfileGuard } from '../../features/profiles/components/NoProfileGuard.jsx'
import { useBusinessDetails, useUpsertBusinessDetails } from '../../features/profiles/hooks/useProfile.js'
import { TimeWheelPicker, formatTimeDisplay } from '../../components/ui/TimeWheelPicker.jsx'
import {
  evaluateBusinessStatus,
  isDay24Hours,
  isDayOvernight,
} from '../../utils/businessHours.js'

const DAY_INDICES = [0, 1, 2, 3, 4, 5, 6]

const DEFAULT_HOURS = DAY_INDICES.map(i => ({
  day_of_week: i,
  opens_at: '09:00',
  closes_at: '18:00',
  is_closed: i === 0,
}))

export default function BusinessHoursPage() {
  const { t } = useTranslation()
  const { data, isLoading } = useBusinessDetails()
  const upsertMutation = useUpsertBusinessDetails()

  const [hours, setHours] = useState(null)
  const [initialHours, setInitialHours] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [copiedMsg, setCopiedMsg] = useState(false)
  const [error, setError] = useState('')
  const [pickerState, setPickerState] = useState(null)

  // Initialize hours from server data
  useEffect(() => {
    if (data && hours === null) {
      let loaded = DEFAULT_HOURS
      if (data.business_hours?.length === 7) {
        loaded = data.business_hours.map(h => ({
          day_of_week: h.day_of_week,
          opens_at: h.opens_at ? h.opens_at.slice(0, 5) : '09:00',
          closes_at: h.closes_at ? h.closes_at.slice(0, 5) : '18:00',
          is_closed: h.is_closed ?? false,
        }))
      }
      setHours(loaded)
      setInitialHours(loaded)
    }
  }, [data, hours])

  const currentHours = hours ?? DEFAULT_HOURS

  // Detect unsaved dirty state
  const isDirty = useMemo(() => {
    if (!initialHours || !hours) return false
    return JSON.stringify(hours) !== JSON.stringify(initialHours)
  }, [hours, initialHours])

  // Prevent accidental navigation when there are unsaved changes
  useEffect(() => {
    function handleBeforeUnload(e) {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  // Live visitor preview calculation
  const liveStatus = useMemo(() => {
    return evaluateBusinessStatus(currentHours, t)
  }, [currentHours, t])

  function update(realIdx, field, value) {
    setHours(prev => {
      const next = prev ? [...prev] : [...DEFAULT_HOURS]
      next[realIdx] = { ...next[realIdx], [field]: value }
      return next
    })
  }

  // Preset 1: Standard Office (Mon–Fri 09:00–17:00, Sat–Sun Closed)
  function applyPresetOffice() {
    setHours(DAY_INDICES.map(day => ({
      day_of_week: day,
      opens_at: '09:00',
      closes_at: '17:00',
      is_closed: day === 0 || day === 6, // Sunday or Saturday closed
    })))
  }

  // Preset 2: Retail / Commercial (Mon–Sat 08:30–19:00, Sun Closed)
  function applyPresetRetail() {
    setHours(DAY_INDICES.map(day => ({
      day_of_week: day,
      opens_at: '08:30',
      closes_at: '19:00',
      is_closed: day === 0, // Sunday closed
    })))
  }

  // Preset 3: 24/7 Always Open
  function applyPreset247() {
    setHours(DAY_INDICES.map(day => ({
      day_of_week: day,
      opens_at: '00:00',
      closes_at: '23:59',
      is_closed: false,
    })))
  }

  // Quick Action: Copy Monday hours to all weekdays (Tue–Fri)
  function copyMondayToWeekdays() {
    const monday = currentHours.find(h => h.day_of_week === 1) || {
      opens_at: '09:00',
      closes_at: '18:00',
      is_closed: false,
    }
    setHours(prev => {
      const base = prev ? [...prev] : [...DEFAULT_HOURS]
      return base.map(h => {
        // Apply to Tuesday (2), Wednesday (3), Thursday (4), Friday (5)
        if ([2, 3, 4, 5].includes(h.day_of_week)) {
          return {
            ...h,
            opens_at: monday.opens_at,
            closes_at: monday.closes_at,
            is_closed: monday.is_closed,
          }
        }
        return h
      })
    })
    setCopiedMsg(true)
    setTimeout(() => setCopiedMsg(false), 2500)
  }

  // Quick Action: Toggle 24-hours for a single day
  function toggleDay24h(realIdx) {
    const current = currentHours[realIdx]
    const already24h = isDay24Hours(current)
    if (already24h) {
      setHours(prev => {
        const next = [...prev]
        next[realIdx] = { ...next[realIdx], opens_at: '09:00', closes_at: '18:00' }
        return next
      })
    } else {
      setHours(prev => {
        const next = [...prev]
        next[realIdx] = { ...next[realIdx], opens_at: '00:00', closes_at: '23:59', is_closed: false }
        return next
      })
    }
  }

  // Reset unsaved changes to original loaded state
  function resetChanges() {
    if (initialHours) {
      setHours(initialHours)
    }
  }

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await upsertMutation.mutateAsync({ business_hours: currentHours })
      setInitialHours(currentHours)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err?.response?.data?.message || t('profile.hours.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) return (
    <DashboardLayout title={t('profile.hours.title')}>
      <div className="space-y-3 max-w-xl">
        {DAY_INDICES.map(d => <Skeleton key={d} className="h-14 rounded-lg" />)}
      </div>
    </DashboardLayout>
  )

  const sortedHours = [...currentHours].sort((a, b) => {
    const order = [1, 2, 3, 4, 5, 6, 0]
    return order.indexOf(a.day_of_week) - order.indexOf(b.day_of_week)
  })

  return (
    <DashboardLayout title={t('profile.hours.title')}>
      <NoProfileGuard>
        <div className="max-w-2xl space-y-6">
          {/* Header intro */}
          <div>
            <p className="text-[13.5px] text-ink-2 leading-relaxed">
              {t('profile.hours.subtitle')}
            </p>
          </div>

          {/* ── 1. Live Visitor Preview Card ────────────────────────────── */}
          {liveStatus && (
            <div className="p-4 rounded-2xl bg-surface border border-border shadow-xs flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <span className="relative flex h-3 w-3 shrink-0" aria-hidden="true">
                  {liveStatus.open && (
                    <span
                      className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70"
                      style={{ animationDuration: '2s' }}
                    />
                  )}
                  <span
                    className={`relative inline-flex rounded-full h-3 w-3 ${
                      liveStatus.open ? 'bg-emerald-500' : 'bg-ink-4'
                    }`}
                  />
                </span>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-[13.5px] font-bold ${liveStatus.open ? 'text-emerald-700 dark:text-emerald-400' : 'text-ink-2'}`}>
                      {liveStatus.label}
                    </span>
                    <span className="text-[11px] text-ink-3 uppercase tracking-wider font-semibold">
                      • {t('profile.hours.previewTitle', 'Customer Live Preview')}
                    </span>
                  </div>
                  {(liveStatus.detail || liveStatus.nextMsg) && (
                    <p className="text-[12px] text-ink-3 truncate mt-0.5">
                      {liveStatus.detail || liveStatus.nextMsg}
                    </p>
                  )}
                </div>
              </div>

              {liveStatus.isOvernight && (
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
                  <Moon size={11} />
                  <span>{t('profile.hours.overnightShift', 'Overnight')}</span>
                </span>
              )}
            </div>
          )}

          {/* ── 2. Quick Schedule Presets ───────────────────────────────── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11.5px] font-bold uppercase tracking-wider text-ink-3">
                {t('profile.hours.presets', 'Quick Presets')}
              </span>

              {/* Copy Monday to Weekdays Action */}
              <button
                type="button"
                onClick={copyMondayToWeekdays}
                className="
                  inline-flex items-center gap-1.5 text-[12px] font-medium text-brand hover:text-brand-hover
                  transition-colors cursor-pointer py-1 px-2 rounded-lg hover:bg-brand-light/30
                "
              >
                {copiedMsg ? (
                  <>
                    <Check size={13} className="text-emerald-600" />
                    <span className="text-emerald-600 font-semibold">{t('profile.hours.copiedToWeekdays', 'Copied to Tue–Fri!')}</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} />
                    <span>{t('profile.hours.copyToWeekdays', 'Copy Mon to all weekdays')}</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={applyPresetOffice}
                className="
                  flex items-center gap-2.5 p-2.5 rounded-xl border border-border bg-surface hover:bg-surface-2
                  text-left transition-colors cursor-pointer group text-[12.5px] font-medium text-ink
                "
              >
                <Building2 size={15} className="text-ink-3 group-hover:text-brand shrink-0 transition-colors" />
                <span className="truncate">{t('profile.hours.presetOffice', 'Office (Mon–Fri 9–5)')}</span>
              </button>

              <button
                type="button"
                onClick={applyPresetRetail}
                className="
                  flex items-center gap-2.5 p-2.5 rounded-xl border border-border bg-surface hover:bg-surface-2
                  text-left transition-colors cursor-pointer group text-[12.5px] font-medium text-ink
                "
              >
                <Store size={15} className="text-ink-3 group-hover:text-brand shrink-0 transition-colors" />
                <span className="truncate">{t('profile.hours.presetRetail', 'Retail (Mon–Sat 8:30–7)')}</span>
              </button>

              <button
                type="button"
                onClick={applyPreset247}
                className="
                  flex items-center gap-2.5 p-2.5 rounded-xl border border-border bg-surface hover:bg-surface-2
                  text-left transition-colors cursor-pointer group text-[12.5px] font-medium text-ink
                "
              >
                <Zap size={15} className="text-ink-3 group-hover:text-brand shrink-0 transition-colors" />
                <span className="truncate">{t('profile.hours.preset247', 'Open 24/7')}</span>
              </button>
            </div>
          </div>

          {/* ── 3. Weekly Hours Form ────────────────────────────────────── */}
          <form onSubmit={handleSave} className="space-y-2.5">
            {sortedHours.map((h) => {
              const realIdx = currentHours.indexOf(h)
              const dayName = t(`profile.hours.days.${h.day_of_week}`)
              const is24h = isDay24Hours(h)
              const isOvernight = isDayOvernight(h)

              return (
                <div
                  key={h.day_of_week}
                  className={`flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 p-3 sm:p-3.5 rounded-xl border transition-all ${
                    h.is_closed ? 'bg-surface-2/60 border-border opacity-70' : 'bg-surface border-border shadow-xs'
                  }`}
                >
                  {/* Day label */}
                  <div className="w-28 shrink-0 flex items-center justify-between sm:justify-start gap-2">
                    <span className="text-[13.5px] font-semibold text-ink">
                      {dayName}
                    </span>
                    {h.day_of_week === 1 && (
                      <span className="sm:hidden text-[10px] text-ink-4 uppercase">Mon</span>
                    )}
                  </div>

                  {h.is_closed ? (
                    <span className="text-[13px] text-ink-3 flex-1 italic">{t('profile.hours.closed')}</span>
                  ) : is24h ? (
                    /* 24 Hours Open pill */
                    <div className="flex items-center gap-2 flex-1">
                      <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-brand-light/50 border border-brand/20 text-brand text-[12.5px] font-semibold">
                        <Zap size={12} />
                        <span>{t('profile.hours.open24h', 'Open 24 hours')}</span>
                      </span>
                    </div>
                  ) : (
                    /* Normal or Overnight time pickers */
                    <div className="flex items-center gap-2 flex-1 flex-wrap">
                      {/* Opens at button */}
                      <button
                        type="button"
                        onClick={() => setPickerState({
                          dayIdx: realIdx,
                          field: 'opens_at',
                          time: h.opens_at || '09:00',
                          title: `${dayName} • ${t('profile.hours.opensAt', 'Opening Time').replace('{{time}}', '')}`,
                        })}
                        className="
                          inline-flex items-center justify-between gap-2 h-8 px-2.5 sm:px-3
                          bg-canvas border border-border hover:border-brand-border
                          rounded-lg text-[13px] font-medium text-ink tabular-nums
                          hover:bg-surface-2 transition-all duration-150 cursor-pointer select-none
                          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand
                        "
                        aria-label={`${dayName} opens at`}
                      >
                        <span>{formatTimeDisplay(h.opens_at)}</span>
                        <Clock size={12} className="text-ink-3 shrink-0" aria-hidden="true" />
                      </button>

                      <span className="text-ink-3 text-[12px]">{t('profile.hours.to')}</span>

                      {/* Closes at button */}
                      <button
                        type="button"
                        onClick={() => setPickerState({
                          dayIdx: realIdx,
                          field: 'closes_at',
                          time: h.closes_at || '18:00',
                          title: `${dayName} • ${t('profile.hours.closesAt', 'Closing Time').replace('{{time}}', '')}`,
                        })}
                        className="
                          inline-flex items-center justify-between gap-2 h-8 px-2.5 sm:px-3
                          bg-canvas border border-border hover:border-brand-border
                          rounded-lg text-[13px] font-medium text-ink tabular-nums
                          hover:bg-surface-2 transition-all duration-150 cursor-pointer select-none
                          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand
                        "
                        aria-label={`${dayName} closes at`}
                      >
                        <span>{formatTimeDisplay(h.closes_at)}</span>
                        <Clock size={12} className="text-ink-3 shrink-0" aria-hidden="true" />
                      </button>

                      {/* Overnight indicator pill */}
                      {isOvernight && (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                          title={t('profile.hours.overnightShift', 'Overnight shift: ends following morning')}
                        >
                          <Moon size={11} />
                          <span>+1 day</span>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Right side day action buttons */}
                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                    {/* 24h Toggle */}
                    {!h.is_closed && (
                      <button
                        type="button"
                        onClick={() => toggleDay24h(realIdx)}
                        className={`
                          text-[11.5px] font-medium px-2.5 py-1 rounded-full border transition-all cursor-pointer
                          ${is24h
                            ? 'bg-brand text-white border-brand'
                            : 'bg-canvas border-border text-ink-2 hover:border-brand-border hover:text-ink'
                          }
                        `}
                        title="Set day to 24 hours open"
                      >
                        24h
                      </button>
                    )}

                    {/* Open / Close Toggle */}
                    <button
                      type="button"
                      onClick={() => update(realIdx, 'is_closed', !h.is_closed)}
                      className={`text-[11.5px] font-medium px-2.5 py-1 rounded-full border transition-all shrink-0 cursor-pointer ${
                        h.is_closed
                          ? 'bg-canvas border-border text-ink-2 hover:border-brand hover:text-brand'
                          : 'bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/15'
                      }`}
                    >
                      {h.is_closed ? t('profile.hours.setOpen') : t('profile.hours.markClosed')}
                    </button>
                  </div>
                </div>
              )
            })}

            {error && <p className="text-[13px] text-danger">{error}</p>}

            {/* Save bar & Unsaved changes indicator */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3">
              <div className="flex items-center gap-3">
                <Button type="submit" variant="primary" icon={<Clock size={13} />} loading={saving}>
                  {t('profile.hours.saveHours')}
                </Button>
                {saved && <span className="text-[13px] text-emerald-600 font-semibold">{t('profile.hours.saved')}</span>}
              </div>

              {isDirty && !saved && (
                <div className="flex items-center gap-2 text-[12.5px] text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl">
                  <AlertCircle size={13} className="shrink-0" />
                  <span>{t('profile.hours.unsavedChanges', 'Unsaved schedule changes')}</span>
                  <button
                    type="button"
                    onClick={resetChanges}
                    className="ml-2 inline-flex items-center gap-1 text-[11.5px] font-medium underline hover:no-underline text-ink-2 cursor-pointer"
                  >
                    <RotateCcw size={11} />
                    <span>{t('profile.hours.discardChanges', 'Reset')}</span>
                  </button>
                </div>
              )}
            </div>
          </form>

          {/* Time Wheel Picker Dialog */}
          <TimeWheelPicker
            isOpen={Boolean(pickerState)}
            initialTime={pickerState?.time || '09:00'}
            title={pickerState?.title}
            onSave={(newTime) => {
              if (pickerState) {
                update(pickerState.dayIdx, pickerState.field, newTime)
              }
            }}
            onClose={() => setPickerState(null)}
          />
        </div>
      </NoProfileGuard>
    </DashboardLayout>
  )
}
