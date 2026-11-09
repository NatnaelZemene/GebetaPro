/**
 * subscriptions.cron.js — Daily subscription expiry & warning sweep.
 *
 * Runs once daily at 00:05 (UTC).
 * Finds expired subscriptions to downgrade, and upcoming expirations (within 3 days)
 * to send advance warning emails and in-app notifications.
 *
 * Called once from server.js after the HTTP server starts listening.
 */
import cron from 'node-cron'
import logger from '../../utils/logger.js'
import { runSubscriptionMaintenance } from '../../workers/subscriptionExpiryWorker.js'

/**
 * Execute the subscription maintenance sweep (expiry + advance warnings).
 *
 * @returns {Promise<{ expiredCount: number, warnedCount: number }>}
 */
export async function runExpiryJob() {
  return await runSubscriptionMaintenance()
}

/**
 * Schedule the expiry sweep to run daily at 00:05 UTC.
 */
export function startExpiryJob() {
  cron.schedule('5 0 * * *', () => {
    runSubscriptionMaintenance().catch((err) =>
      logger.error({ err }, 'Expiry job: cron execution failed'),
    )
  })

  logger.info('Expiry job: scheduled — runs daily at 00:05 UTC (expiry + advance warnings)')
}
