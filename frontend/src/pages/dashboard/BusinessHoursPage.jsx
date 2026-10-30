import { useState } from 'react'
import { Clock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { DashboardLayout } from '../../components/layout/DashboardLayout.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Skeleton } from '../../components/ui/Skeleton.jsx'
import { NoProfileGuard } from '../../features/profiles/components/NoProfileGuard.jsx'
import { useBusinessDetails, useUpsertBusinessDetails } from '../../features/profiles/hooks/useProfile.js'
import { TimeWheelPicker, formatTimeDisplay } from '../../components/ui/TimeWheelPicker.jsx'

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
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [pickerState, setPickerState] = useState(null)

  if (data && hours === null) {
    if (data.business_hours?.length === 7) {
      setHours(data.business_hours.map(h => ({
        day_of_week: h.day_of_week,
        opens_at: h.opens_at ? h.opens_at.slice(0, 5) : '09:00',
        closes_at: h.closes_at ? h.closes_at.slice(0, 5) : '18:00',
        is_closed: h.is_closed ?? false,
      })))
    } else {
      setHours(DEFAULT_HOURS)
    }
  }

  const currentHours = hours ?? DEFAULT_HOURS

  function update(i, field, value) {
    setHours(currentHours.map((h, idx) => idx === i ? { ...h, [field]: value } : h))
  }

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await upsertMutation.mutateAsync({ business_hours: currentHours })
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
      <div className="space-y-3 max-w-lg">
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
        <div className="max-w-xl space-y-5">
          <p className="text-[13px] text-ink-2">
            {t('profile.hours.subtitle')}
          </p>

          <form onSubmit={handleSave} className="space-y-2.5">
            {sortedHours.map((h) => {
              const realIdx = currentHours.indexOf(h)
              const dayName = t(`profile.hours.days.${h.day_of_week}`)

              return (
                <div
                  key={h.day_of_week}
                  className={`flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 p-3 sm:p-3.5 rounded-xl border transition-all ${
                    h.is_closed ? 'bg-surface-2/60 border-border opacity-70' : 'bg-surface border-border shadow-xs'
                  }`}
                >
                  <span className="text-[13.5px] font-semibold text-ink w-28 shrink-0">
                    {dayName}
                  </span>

                  {h.is_closed ? (
                    <span className="text-[13px] text-ink-3 flex-1 italic">{t('profile.hours.closed')}</span>
                  ) : (
                    <div className="flex items-center gap-2 flex-1">
                      {/* Opens at button */}
                      <button
                        type="button"
                        onClick={() => setPickerState({
                          dayIdx: realIdx,
                          field: 'opens_at',
                          time: h.opens_at || '09:00',
                          title: `${dayName} • ${t('profile.hours.openNow', 'Opens at')}`,
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
                          title: `${dayName} • ${t('profile.hours.closesAt', 'Closes at').replace('{{time}}', '')}`,
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
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => update(realIdx, 'is_closed', !h.is_closed)}
                    className={`text-[11.5px] font-medium px-2.5 py-1 rounded-full border transition-all shrink-0 cursor-pointer self-start sm:self-auto ${
                      h.is_closed
                        ? 'bg-canvas border-border text-ink-2 hover:border-brand hover:text-brand'
                        : 'bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/15'
                    }`}
                  >
                    {h.is_closed ? t('profile.hours.setOpen') : t('profile.hours.markClosed')}
                  </button>
                </div>
              )
            })}

            {error && <p className="text-[13px] text-danger">{error}</p>}

            <div className="flex items-center gap-3 pt-3">
              <Button type="submit" variant="primary" icon={<Clock size={13} />} loading={saving}>
                {t('profile.hours.saveHours')}
              </Button>
              {saved && <span className="text-[13px] text-emerald-600 font-medium">{t('profile.hours.saved')}</span>}
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
