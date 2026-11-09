/**
 * subscriptionExpiryWorker.js — Automated Subscription Expiry Worker, Tier Downgrades & Email Notifications.
 *
 * Scans for:
 *  1. Expired active subscriptions: marks them EXPIRED, sets profiles is_featured = FALSE,
 *     and dispatches both in-app and email expiry notifications.
 *  2. Upcoming expiring subscriptions (2-3 days before downgrade): dispatches early warning
 *     in-app and email notifications to give providers time to renew before losing priority rank.
 */
import pool from '../db/index.js'
import logger from '../utils/logger.js'
import {
  sendSubscriptionExpiredEmail,
  sendSubscriptionExpiringSoonEmail,
} from '../services/email.service.js'

/**
 * Process expired subscriptions atomically and send expiry notification emails.
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
      SELECT us.id, us.user_id, us.plan_id, p.id AS profile_id,
             u.email, p.display_name, sp.display_name AS plan_name
      FROM user_subscriptions us
      JOIN users u ON u.id = us.user_id
      JOIN subscription_plans sp ON sp.id = us.plan_id
      LEFT JOIN profiles p ON p.user_id = us.user_id
      WHERE us.status = 'ACTIVE' 
        AND sp.name != 'FREE'
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

    // 5. Send email notifications (non-blocking: email delivery failures must not affect database commit)
    for (const sub of expiredSubs) {
      if (sub.email) {
        sendSubscriptionExpiredEmail({
          to: sub.email,
          displayName: sub.display_name,
          planName: sub.plan_name,
        }).catch((err) =>
          logger.warn({ err: err?.message, userId: sub.user_id }, 'Failed to send subscription expired email'),
        )
      }
    }

    return { expiredCount: expiredSubs.length }
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    logger.error({ err: error }, 'Error processing expired subscriptions')
    throw error
  } finally {
    client.release()
  }
}

/**
 * Scan for active subscriptions expiring within `daysBefore` days (e.g. 2 or 3 days)
 * and send advance warning notifications (both in-app and email).
 * Deduplicated so users receive at most one reminder per billing period.
 *
 * @param {number} [daysBefore=3]
 * @returns {Promise<{ warnedCount: number }>}
 */
export async function processUpcomingExpiryWarnings(daysBefore = 3) {
  logger.info({ daysBefore }, 'Starting upcoming subscription expiry warnings check...')

  const client = await pool.connect()
  try {
    // Find active subscriptions expiring within the warning window that have NOT received
    // an upcoming expiry notification in the past 4 days
    const selectUpcomingSql = `
      SELECT us.id, us.user_id, us.current_period_end,
             u.email, p.display_name, sp.display_name AS plan_name,
             CEIL(EXTRACT(EPOCH FROM (us.current_period_end - NOW())) / 86400)::int AS days_remaining
      FROM user_subscriptions us
      JOIN users u ON u.id = us.user_id
      JOIN subscription_plans sp ON sp.id = us.plan_id
      LEFT JOIN profiles p ON p.user_id = us.user_id
      WHERE us.status = 'ACTIVE'
        AND sp.name != 'FREE'
        AND us.current_period_end > NOW()
        AND us.current_period_end <= NOW() + ($1 || ' days')::INTERVAL
        AND NOT EXISTS (
          SELECT 1 FROM notifications n
          WHERE n.user_id = us.user_id
            AND n.type = 'SUBSCRIPTION_EXPIRING_SOON'
            AND n.created_at > NOW() - INTERVAL '4 days'
        )
    `
    const { rows: upcomingSubs } = await client.query(selectUpcomingSql, [daysBefore])

    if (upcomingSubs.length === 0) {
      logger.info('No upcoming expirations requiring warning.')
      return { warnedCount: 0 }
    }

    await client.query('BEGIN')

    for (const sub of upcomingSubs) {
      const daysRemaining = Math.max(1, sub.days_remaining || daysBefore)
      await client.query(
        `INSERT INTO notifications (user_id, title, body, type, link, metadata)
         VALUES (
           $1,
           'Subscription Expiring Soon',
           $2,
           'SUBSCRIPTION_EXPIRING_SOON',
           '/dashboard/subscription',
           $3
         )`,
        [
          sub.user_id,
          `Your ${sub.plan_name || 'Paid'} plan will expire in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}. Renew now to maintain your featured status and premium limits.`,
          JSON.stringify({ subscription_id: sub.id, days_remaining: daysRemaining }),
        ],
      )
    }

    await client.query('COMMIT')

    // Send email warnings (non-blocking)
    for (const sub of upcomingSubs) {
      if (sub.email) {
        const daysRemaining = Math.max(1, sub.days_remaining || daysBefore)
        sendSubscriptionExpiringSoonEmail({
          to: sub.email,
          displayName: sub.display_name,
          planName: sub.plan_name,
          expiryDate: sub.current_period_end,
          daysRemaining,
        }).catch((err) =>
          logger.warn({ err: err?.message, userId: sub.user_id }, 'Failed to send subscription warning email'),
        )
      }
    }

    logger.info({ warnedCount: upcomingSubs.length }, 'Upcoming subscription expiry warnings processed.')
    return { warnedCount: upcomingSubs.length }
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    logger.error({ err: error }, 'Error processing upcoming expiry warnings')
    throw error
  } finally {
    client.release()
  }
}

/**
 * Run full subscription maintenance: process expired subscriptions and upcoming expiry warnings.
 *
 * @returns {Promise<{ expiredCount: number, warnedCount: number }>}
 */
export async function runSubscriptionMaintenance() {
  const expired = await processExpiredSubscriptions()
  const warned = await processUpcomingExpiryWarnings(3)
  return {
    expiredCount: expired.expiredCount,
    warnedCount: warned.warnedCount,
  }
}
