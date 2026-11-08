/**
 * internal.routes.js — Internal routes for administrative operations and scheduled workers.
 */
import { Router } from 'express'
import { requireCronSecret } from '../../middleware/cronAuth.js'
import { processExpiredSubscriptions } from '../../workers/subscriptionExpiryWorker.js'
import { asyncHandler, sendSuccess } from '../../utils/index.js'

const router = Router()

/**
 * POST /api/internal/cron/expire-subscriptions
 * Protected webhook for scheduled cron services (Cloudflare, GitHub Actions, serverless).
 */
router.post(
  '/cron/expire-subscriptions',
  requireCronSecret,
  asyncHandler(async (req, res) => {
    const result = await processExpiredSubscriptions()
    sendSuccess(res, 'Subscription expiry sweep completed', result)
  }),
)

export default router

