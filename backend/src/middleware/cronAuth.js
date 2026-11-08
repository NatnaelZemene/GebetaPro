/**
 * middleware/cronAuth.js — Authentication middleware for internal cron jobs.
 *
 * Verifies that incoming requests contain a valid x-cron-secret header matching config.cronSecret.
 */
import { config } from '../config/index.js'

export function requireCronSecret(req, res, next) {
  const secret = req.headers['x-cron-secret']
  const expectedSecret = config.cronSecret

  if (!expectedSecret || !secret || secret !== expectedSecret) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized cron request',
      error: { code: 'UNAUTHORIZED_CRON' },
    })
  }

  next()
}

