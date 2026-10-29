/**
 * Cloudflare-compatible subscription expiry sweep.
 *
 * This module keeps the database work separate from node-cron's scheduler so
 * the same sweep can be invoked by a Cloudflare Cron Trigger.
 */
import logger from '../../utils/logger.js'
import * as repo from './subscriptions.repository.js'

export async function runExpiryJob() {
  logger.info('Expiry job: starting subscription expiry sweep')

  const freePlan = await repo.findFreePlan()
  if (!freePlan) {
    logger.error('Expiry job: FREE plan not found in database — aborting sweep')
    return
  }

  const expiredSubs = await repo.findExpiredActiveSubscriptions()
  logger.info({ count: expiredSubs.length }, 'Expiry job: found expired subscriptions')

  if (expiredSubs.length === 0) {
    logger.info('Expiry job: nothing to expire')
    return
  }

  for (const sub of expiredSubs) {
    try {
      const pausedAds = await repo.expireSubscription(sub.id, sub.user_id, freePlan.id)

      logger.info(
        {
          userId: sub.user_id,
          subscriptionId: sub.id,
          pausedAds,
        },
        'Expiry job: subscription expired, ads paused',
      )
    } catch (err) {
      logger.error(
        {
          err,
          userId: sub.user_id,
          subscriptionId: sub.id,
        },
        'Expiry job: failed to expire subscription — continuing with next',
      )
    }
  }

  logger.info('Expiry job: sweep complete')
}
