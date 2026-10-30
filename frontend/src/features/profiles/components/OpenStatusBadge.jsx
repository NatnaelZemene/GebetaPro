/**
 * OpenStatusBadge.jsx — Real-time open/closed status badge based on business hours.
 * Supports timezone awareness (EAT/Addis Ababa), overnight shifts, and 24h operations.
 */
import { useTranslation } from 'react-i18next'
import { evaluateBusinessStatus } from '../../../utils/businessHours.js'

export function OpenStatusBadge({
  businessHours,
  variant = 'text', // 'text' | 'badge' | 'dot'
  className = '',
}) {
  const { t } = useTranslation()

  if (!businessHours || !Array.isArray(businessHours) || businessHours.length === 0) {
    return null
  }

  const status = evaluateBusinessStatus(businessHours, t)
  if (!status) return null

  // 1. Pill Badge Variant (used on Profile Cards & Directory)
  if (variant === 'badge') {
    if (status.open) {
      return (
        <span
          className={`
            inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full
            bg-emerald-500/10 dark:bg-emerald-500/15
            border border-emerald-500/25
            text-emerald-700 dark:text-emerald-400
            text-[11px] font-semibold leading-tight shrink-0 select-none
            ${className}
          `}
          aria-label={`${status.label}${status.detail ? ` (${status.detail})` : ''}`}
        >
          <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"
              style={{ animationDuration: '2s' }}
            />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span>{status.is24h ? t('profile.hours.open24h', '24h Open') : t('profile.hours.openNow', 'Open')}</span>
        </span>
      )
    }

    return (
      <span
        className={`
          inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full
          bg-surface-2 border border-border text-ink-3
          text-[11px] font-medium leading-tight shrink-0 select-none
          ${className}
        `}
        aria-label={status.label}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-ink-4 shrink-0" aria-hidden="true" />
        <span>{t('profile.hours.closed', 'Closed')}</span>
      </span>
    )
  }

  // 2. Simple Indicator Dot Variant
  if (variant === 'dot') {
    return (
      <span
        className="relative flex h-2.5 w-2.5 shrink-0"
        title={status.open ? `${status.label} • ${status.detail}` : status.label}
        aria-label={status.open ? 'Open now' : 'Closed'}
      >
        {status.open && (
          <span
            className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"
            style={{ animationDuration: '2s' }}
          />
        )}
        <span
          className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
            status.open ? 'bg-emerald-500' : 'bg-ink-4'
          }`}
        />
      </span>
    )
  }

  // 3. Detailed Text Variant (used in ProfileHeader)
  const fullLabel = status.open
    ? `${status.label}${status.detail ? ` — ${status.detail}` : ''}`
    : `${status.label}${status.nextMsg ? ` · ${status.nextMsg}` : ''}`

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 text-[12px] font-medium
        ${status.open ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-ink-3'}
        ${className}
      `}
      aria-label={fullLabel}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
          status.open ? 'bg-emerald-500' : 'bg-ink-4'
        }`}
        aria-hidden="true"
      />
      <span>{status.label}</span>
      {status.open && status.detail && (
        <>
          <span aria-hidden="true" className="text-ink-4"> · </span>
          <span className="text-ink-2 font-normal">{status.detail}</span>
        </>
      )}
      {!status.open && status.nextMsg && (
        <>
          <span aria-hidden="true" className="text-ink-4"> · </span>
          <span className="text-ink-3 font-normal">{status.nextMsg}</span>
        </>
      )}
    </span>
  )
}
