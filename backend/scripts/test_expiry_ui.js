/**
 * test_expiry_ui.js — Helper script to simulate subscription expiry for Browser UI verification.
 *
 * Sets demo.abebe-plumbing@example.test to an expired PRO subscription,
 * then triggers the expiry worker sweep so you can see the notification and
 * expired badge in the browser dashboard.
 */
import 'dotenv/config'
import pool from '../src/db/index.js'
import { processExpiredSubscriptions } from '../src/workers/subscriptionExpiryWorker.js'

async function run() {
  console.log('1. Setting up expired PRO subscription for demo.abebe-plumbing@example.test...')

  const userRes = await pool.query(
    "SELECT id FROM users WHERE email = 'demo.abebe-plumbing@example.test'"
  )
  if (!userRes.rows[0]) {
    console.error('Demo user demo.abebe-plumbing@example.test not found. Run npm run db:seed:demo first.')
    process.exit(1)
  }
  const userId = userRes.rows[0].id

  const proPlanRes = await pool.query(
    "SELECT id FROM subscription_plans WHERE name = 'PRO'"
  )
  const proPlanId = proPlanRes.rows[0].id

  // Delete previous test notifications for clean demonstration
  await pool.query(
    "DELETE FROM notifications WHERE user_id = $1 AND type = 'SUBSCRIPTION_EXPIRED'",
    [userId]
  )

  // Set subscription to ACTIVE with an expiry date 1 hour in the past
  await pool.query(
    `UPDATE user_subscriptions
     SET plan_id = $1,
         status = 'ACTIVE',
         current_period_start = NOW() - INTERVAL '30 days',
         current_period_end = NOW() - INTERVAL '1 hour',
         updated_at = NOW()
     WHERE user_id = $2`,
    [proPlanId, userId]
  )

  // Flag profile as featured
  await pool.query(
    'UPDATE profiles SET is_featured = TRUE WHERE user_id = $1',
    [userId]
  )

  console.log('2. Running subscription expiry worker sweep...')
  const result = await processExpiredSubscriptions()
  console.log('Sweep result:', result)

  console.log('\n✅ Demo ready for Browser UI check!')
  console.log('Login credentials:')
  console.log('  Email:    demo.abebe-plumbing@example.test')
  console.log('  Password: GebetaDemo2026!')
  console.log('  URL:      http://localhost:5173/login')

  await pool.end()
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})

