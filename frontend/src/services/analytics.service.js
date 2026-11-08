/**
 * analytics.service.js — Frontend service for analytics and lead event tracking.
 */
import apiClient from './apiClient.js'

/**
 * Track an analytics event for a profile (e.g. 'VIEW', 'WHATSAPP_CLICK', 'TELEGRAM_CLICK').
 * Uses apiClient. Catches errors silently so analytics tracking never interrupts user flow.
 *
 * @param {object} params
 * @param {string} params.profile_id
 * @param {string} params.event_type
 * @param {object} [params.metadata]
 * @returns {Promise<object|null>}
 */
export async function trackAnalyticsEvent({ profile_id, event_type, metadata = {} }) {
  if (!profile_id || !event_type) return null
  try {
    const res = await apiClient.post('/analytics/track', {
      profile_id,
      event_type,
      metadata,
    })
    return res.data?.data || null
  } catch (err) {
    // Non-blocking fire-and-forget: fail silently
    if (import.meta.env?.DEV) {
      console.debug('Analytics track error:', err?.response?.data?.message || err?.message)
    }
    return null
  }
}

