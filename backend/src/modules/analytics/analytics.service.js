/**
 * analytics.service.js — Business logic for analytics tracking and aggregation.
 */
import * as analyticsRepo from './analytics.repository.js'

/**
 * Track an analytics event for a given profile.
 *
 * @param {object} data
 * @param {string} data.profile_id
 * @param {string} data.event_type
 * @param {object} [data.metadata]
 * @param {object} clientInfo
 * @param {string|null} [clientInfo.ip]
 * @param {string|null} [clientInfo.userAgent]
 * @returns {Promise<object>}
 */
export async function trackEvent({ profile_id, event_type, metadata }, { ip, userAgent }) {
  const result = await analyticsRepo.recordAnalyticsEvent(
    profile_id,
    event_type,
    metadata,
    ip,
    userAgent
  )

  if (!result) {
    const err = new Error('Profile not found')
    err.statusCode = 404
    err.code = 'PROFILE_NOT_FOUND'
    err.isOperational = true
    throw err
  }

  return result
}
