/**
 * analytics.controller.js — HTTP layer for analytics endpoints.
 */
import { asyncHandler, sendSuccess } from '../../utils/index.js'
import * as svc from './analytics.service.js'

/**
 * POST /api/analytics/track
 * Track a profile analytics event (views, lead clicks, etc.)
 */
export const trackEvent = asyncHandler(async (req, res) => {
  const { profile_id, event_type, metadata } = req.body
  const ip =
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.ip ||
    req.socket?.remoteAddress ||
    null
  const userAgent = req.headers['user-agent'] || null

  const result = await svc.trackEvent(
    { profile_id, event_type, metadata },
    { ip, userAgent }
  )

  sendSuccess(res, 'Event recorded successfully', result, 201)
})
