/**
 * internal.routes.js — Internal routes for administrative operations and scheduled workers.
 */
import { Router } from 'express'
import { requireCronSecret } from '../../middleware/cronAuth.js'
import { runSubscriptionMaintenance } from '../../workers/subscriptionExpiryWorker.js'
import { asyncHandler, sendSuccess } from '../../utils/index.js'

const router = Router()

/**
 * POST /api/internal/cron/expire-subscriptions
 * Protected webhook for scheduled cron services (Cloudflare, GitHub Actions, serverless).
 * Performs both expired subscription downgrades and 3-day advance warning notifications.
 */
router.post(
  '/cron/expire-subscriptions',
  requireCronSecret,
  asyncHandler(async (req, res) => {
    const result = await runSubscriptionMaintenance()
    sendSuccess(res, 'Subscription maintenance sweep completed', result)
  }),
)

export default router
