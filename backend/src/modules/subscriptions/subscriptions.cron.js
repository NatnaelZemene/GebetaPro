/**
 * subscriptions.cron.js — Daily subscription expiry sweep.
 *
 * Runs once daily at 00:05 (UTC).
 * Finds all ACTIVE subscriptions whose billing period has ended,
 * marks them EXPIRED, sets profiles is_featured = FALSE, and issues renewal notifications.
 *
 * Called once from server.js after the HTTP server starts listening.
 *
 * Usage:
 *   import { startExpiryJob } from './modules/subscriptions/subscriptions.cron.js'
 *   startExpiryJob()
 */
import cron from 'node-cron'
import logger from '../../utils/logger.js'
import { processExpiredSubscriptions } from '../../workers/subscriptionExpiryWorker.js'

/**
 * Execute the subscription expiry sweep.
 *
 * @returns {Promise<{ expiredCount: number }>}
 */
export async function runExpiryJob() {
  return await processExpiredSubscriptions()
}

/**
 * Schedule the expiry sweep to run daily at 00:05 UTC.
 *
 * 00:05 instead of 00:00 avoids contention with other midnight jobs
 * and any period-end timestamps that are exactly at midnight.
 *
 * Call this once from server.js after the server starts listening.
 */
export function startExpiryJob() {
  cron.schedule('5 0 * * *', () => {
    processExpiredSubscriptions().catch((err) =>
      logger.error({ err }, 'Expiry job: cron execution failed'),
    )
  })

  logger.info('Expiry job: scheduled — runs daily at 00:05 UTC')
}
