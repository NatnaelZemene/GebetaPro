/**
 * Cloudflare-compatible subscription expiry sweep.
 *
 * Keeps database work separate from node-cron scheduler so
 * the same sweep can be invoked by a Cloudflare Cron Trigger or internal route.
 */
import { runSubscriptionMaintenance } from '../../workers/subscriptionExpiryWorker.js'

export async function runExpiryJob() {
  return await runSubscriptionMaintenance()
}
