/**
 * subscriptionExpiryWorker.js — Automated Subscription Expiry Worker & Tier Downgrades.
 *
 * Scans for paid ACTIVE subscriptions whose current_period_end has passed, marks them EXPIRED,
 * downgrades associated profiles by setting is_featured = FALSE, and issues in-app renewal notifications.
 */
import pool from '../db/index.js'
import logger from '../utils/logger.js'

/**
 * Process expired subscriptions atomically.
 *
 * @returns {Promise<{ expiredCount: number }>}
 */
export async function processExpiredSubscriptions() {
  logger.info('Starting subscription expiry worker check...')

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // 1. Find all active subscriptions whose billing end date has passed, locking selected rows
    const selectExpiredSql = `
      SELECT us.id, us.user_id, us.plan_id, p.id AS profile_id
      FROM user_subscriptions us
      LEFT JOIN profiles p ON p.user_id = us.user_id
      WHERE us.status = 'ACTIVE' 
        AND us.current_period_end < NOW()
      FOR UPDATE OF us
    `
    const { rows: expiredSubs } = await client.query(selectExpiredSql)

    if (expiredSubs.length === 0) {
      logger.info('No expired subscriptions found.')
      await client.query('COMMIT')
      return { expiredCount: 0 }
    }

    // 2. Mark subscriptions as EXPIRED
    const subIds = expiredSubs.map((s) => s.id)
    await client.query(
      `UPDATE user_subscriptions 
       SET status = 'EXPIRED', updated_at = NOW()
       WHERE id = ANY($1::uuid[])`,
      [subIds],
    )

    // 3. Mark corresponding profiles as non-featured
    const profileIds = expiredSubs.map((s) => s.profile_id).filter(Boolean)
    if (profileIds.length > 0) {
      await client.query(
        `UPDATE profiles
         SET is_featured = FALSE, updated_at = NOW()
         WHERE id = ANY($1::uuid[])`,
        [profileIds],
      )
    }

    // 4. Create in-app notification for each affected user
    for (const sub of expiredSubs) {
      await client.query(
        `INSERT INTO notifications (user_id, title, body, type, link, metadata)
         VALUES (
           $1, 
           'Subscription Expired', 
           'Your premium plan has expired. Renew your plan to restore featured placement and premium limits.',
           'SUBSCRIPTION_EXPIRED',
           '/dashboard/subscription',
           $2
         )`,
        [sub.user_id, JSON.stringify({ subscription_id: sub.id })],
      )
    }

    await client.query('COMMIT')
    logger.info(`Successfully expired ${expiredSubs.length} subscriptions.`)
    return { expiredCount: expiredSubs.length }
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    logger.error({ err: error }, 'Error processing expired subscriptions')
    throw error
  } finally {
    client.release()
  }
}

