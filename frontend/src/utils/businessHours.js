/**
 * businessHours.js — Universal business hours parser, live status evaluator,
 * and overnight / timezone-aware schedule calculator.
 *
 * Designed for GebetaPro:
 *   - Evaluates open/closed status in East Africa Time (Africa/Addis_Ababa, UTC+3)
 *     so diaspora/overseas visitors see accurate live availability.
 *   - Supports overnight shifts (e.g. 08:00 PM to 03:00 AM crossing midnight).
 *   - Supports 24-hour open schedules (00:00 to 23:59 or 00:00 to 00:00).
 *   - Provides formatting and next-open lookahead calculations.
 */

export const BUSINESS_TIMEZONE = 'Africa/Addis_Ababa'

/** Format a "HH:mm" 24h string into a localized 12h display string ("09:00 AM") */
export function format24to12(timeStr) {
  if (!timeStr) return ''
  const [hStr, mStr] = timeStr.split(':')
  const h = parseInt(hStr, 10)
  const m = parseInt(mStr || '0', 10)
  if (isNaN(h)) return ''
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`
}

/** Check if a day's schedule represents an open 24 hours day */
export function isDay24Hours(daySchedule) {
  if (!daySchedule || daySchedule.is_closed) return false
  const o = daySchedule.opens_at?.slice(0, 5)
  const c = daySchedule.closes_at?.slice(0, 5)
  return o === '00:00' && (c === '23:59' || c === '00:00' || c === '24:00')
}

/** Check if a day's schedule represents an overnight shift crossing midnight */
export function isDayOvernight(daySchedule) {
  if (!daySchedule || daySchedule.is_closed || isDay24Hours(daySchedule)) return false
  if (!daySchedule.opens_at || !daySchedule.closes_at) return false
  const [oH, oM] = daySchedule.opens_at.split(':').map(Number)
  const [cH, cM] = daySchedule.closes_at.split(':').map(Number)
  return oH * 60 + oM > cH * 60 + cM
}

/**
 * Returns current weekday (0=Sun..6=Sat) and minute-of-day in the business's timezone.
 */
export function getCurrentTimeInZone(timeZone = BUSINESS_TIMEZONE) {
  try {
    const now = new Date()
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      weekday: 'short',
      hour: 'numeric',
      minute: 'numeric',
    })
    const parts = formatter.formatToParts(now)
    let weekdayStr = 'Sun'
    let hour = 0
    let minute = 0
    for (const p of parts) {
      if (p.type === 'weekday') weekdayStr = p.value
      if (p.type === 'hour') hour = parseInt(p.value, 10)
      if (p.type === 'minute') minute = parseInt(p.value, 10)
    }
    const dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
    const day = dayMap[weekdayStr] ?? now.getDay()
    return {
      day,
      hour,
      minute,
      totalMinutes: hour * 60 + minute,
    }
  } catch {
    const now = new Date()
    return {
      day: now.getDay(),
      hour: now.getHours(),
      minute: now.getMinutes(),
      totalMinutes: now.getHours() * 60 + now.getMinutes(),
    }
  }
}

/**
 * Evaluates whether a profile is currently open right now,
 * accounting for 24-hour operations, yesterday's overnight spillover, and today's schedule.
 */
export function evaluateBusinessStatus(businessHours, t = (k, f) => f || k, timeZone = BUSINESS_TIMEZONE) {
  if (!Array.isArray(businessHours) || !businessHours.length) return null

  const { day, totalMinutes: nowMins } = getCurrentTimeInZone(timeZone)

  const today = businessHours.find(h => h.day_of_week === day)
  const yesterdayDay = (day + 6) % 7
  const yesterday = businessHours.find(h => h.day_of_week === yesterdayDay)

  // 1. Check if yesterday had an overnight shift that extends into today's early morning
  if (yesterday && !yesterday.is_closed && isDayOvernight(yesterday)) {
    const [_, cMins] = getScheduleMinutes(yesterday)
    if (nowMins < cMins) {
      return {
        open: true,
        label: t('profile.hours.openNow', 'Open now'),
        detail: t('profile.hours.closesAt', {
          defaultValue: `Closes at ${format24to12(yesterday.closes_at)}`,
          time: format24to12(yesterday.closes_at),
        }),
        isOvernight: true,
        nextMsg: null,
      }
    }
  }

  // 2. Check today's status
  if (!today || today.is_closed) {
    const nextMsg = findNextOpening(businessHours, day, nowMins, t)
    return {
      open: false,
      label: today?.is_closed ? t('profile.hours.closedToday', 'Closed today') : t('profile.hours.closedNow', 'Closed now'),
      detail: null,
      nextMsg,
    }
  }

  // 3. 24 Hours Open
  if (isDay24Hours(today)) {
    return {
      open: true,
      label: t('profile.hours.open24h', 'Open 24 hours'),
      detail: t('profile.hours.alwaysOpen', 'Open all day & night'),
      is24h: true,
      nextMsg: null,
    }
  }

  if (!today.opens_at || !today.closes_at) return null

  const [openMins, closeMins] = getScheduleMinutes(today)
  const isOvernight = isDayOvernight(today)

  const isOpen = isOvernight
    ? nowMins >= openMins // Started tonight, closes early tomorrow morning
    : nowMins >= openMins && nowMins < closeMins

  if (isOpen) {
    const closesFormatted = format24to12(today.closes_at)
    return {
      open: true,
      label: t('profile.hours.openNow', 'Open now'),
      detail: t('profile.hours.closesAt', {
        defaultValue: `Closes at ${closesFormatted}`,
        time: closesFormatted,
      }),
      isOvernight,
      nextMsg: null,
    }
  }

  // Currently closed — find when it opens next
  let nextMsg = null
  if (nowMins < openMins) {
    // Opens later today
    nextMsg = t('profile.hours.opensAt', {
      defaultValue: `Opens today at ${format24to12(today.opens_at)}`,
      time: format24to12(today.opens_at),
    })
  } else {
    nextMsg = findNextOpening(businessHours, day, nowMins, t)
  }

  return {
    open: false,
    label: t('profile.hours.closedNow', 'Closed now'),
    detail: null,
    nextMsg,
  }
}

/** Helper: Parse opening and closing minutes from a schedule entry */
function getScheduleMinutes(entry) {
  if (!entry?.opens_at || !entry?.closes_at) return [0, 0]
  const [oH, oM] = entry.opens_at.split(':').map(Number)
  const [cH, cM] = entry.closes_at.split(':').map(Number)
  return [oH * 60 + oM, cH * 60 + cM]
}

/** Helper: Find the next day and time the business opens */
function findNextOpening(businessHours, currentDay, nowMins, t) {
  for (let offset = 1; offset <= 7; offset++) {
    const nextDay = (currentDay + offset) % 7
    const nextHours = businessHours.find(h => h.day_of_week === nextDay)
    if (nextHours && !nextHours.is_closed && nextHours.opens_at) {
      const openTimeFormatted = format24to12(nextHours.opens_at)
      if (offset === 1) {
        return t('profile.hours.opensTomorrow', {
          defaultValue: `Opens tomorrow at ${openTimeFormatted}`,
          time: openTimeFormatted,
        })
      }
      return t('profile.hours.opensOn', {
        defaultValue: `Opens ${t(`profile.hours.days.${nextDay}`)} at ${openTimeFormatted}`,
        day: t(`profile.hours.days.${nextDay}`),
        time: openTimeFormatted,
      })
    }
  }
  return null
}
