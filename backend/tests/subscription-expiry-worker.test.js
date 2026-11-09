/**
 * tests/subscription-expiry-worker.test.js — Task 2.3 Automated Subscription Expiry Worker & Tier Downgrades.
 *
 * Tests:
 *  - Active subscription past current_period_end is updated to 'EXPIRED'
 *  - Associated profile is_featured is downgraded to FALSE
 *  - In-app notification created with type 'SUBSCRIPTION_EXPIRED' and metadata
 *  - Active subscription not past expiry remains 'ACTIVE' with no downgrade or notification
 *  - FREE and already-EXPIRED subscriptions are not modified
 *  - Idempotent execution (repeated runs do not generate duplicate notifications)
 *  - Batch expiry of multiple subscriptions simultaneously
 *  - HTTP cron endpoint POST /api/internal/cron/expire-subscriptions rejects unauthorized requests (401)
 *  - HTTP cron endpoint executes successfully when authenticated with valid x-cron-secret
 *
 * Uses Node.js built-in test runner (node:test).
 */
import 'dotenv/config'
import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { URL } from 'node:url'
import pool from '../src/db/index.js'
import { config } from '../src/config/index.js'
import {
  processExpiredSubscriptions,
  processUpcomingExpiryWarnings,
  runSubscriptionMaintenance,
} from '../src/workers/subscriptionExpiryWorker.js'

process.env.NODE_ENV = 'test'
process.env.PORT = '0'

const { default: app } = await import('../src/app.js')

let server
let baseUrl
const testUserIds = []
const testProfileIds = []
let proPlanId
let freePlanId

function request(method, path, { body, headers = {} } = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl)
    const payload = body ? JSON.stringify(body) : null
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        ...headers,
      },
    }

    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        let json = null
        try {
          json = JSON.parse(data)
        } catch {
          json = data
        }
        resolve({ statusCode: res.statusCode, headers: res.headers, body: json })
      })
    })

    req.on('error', reject)
    if (payload) req.write(payload)
    req.end()
  })
}

/** Helper: create a test user, profile, and subscription */
async function createTestSubscriber({
  emailSuffix,
  status = 'ACTIVE',
  periodEndOffsetMinutes = -10, // negative means in the past (expired)
  isFeatured = true,
  isFree = false,
}) {
  const email = `test-worker-${Date.now()}-${emailSuffix}@example.com`
  const userRes = await pool.query(
    `INSERT INTO users (email, password_hash, role, status, email_verified_at)
     VALUES ($1, 'hash_placeholder', 'USER', 'ACTIVE', NOW())
     RETURNING id`,
    [email],
  )
  const userId = userRes.rows[0].id
  testUserIds.push(userId)

  const slug = `worker-test-${Date.now()}-${emailSuffix}`
  const profileRes = await pool.query(
    `INSERT INTO profiles (user_id, slug, display_name, is_published, is_featured)
     VALUES ($1, $2, $3, TRUE, $4)
     RETURNING id`,
    [userId, slug, `Test User ${emailSuffix}`, isFeatured],
  )
  const profileId = profileRes.rows[0].id
  testProfileIds.push(profileId)

  const planId = isFree ? freePlanId : proPlanId
  const periodStart = isFree ? null : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const periodEnd = isFree ? null : new Date(Date.now() + periodEndOffsetMinutes * 60 * 1000)

  // Use UPSERT because 020 trigger may have already created a FREE subscription
  const subRes = await pool.query(
    `INSERT INTO user_subscriptions (user_id, plan_id, status, current_period_start, current_period_end)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id) 
     DO UPDATE SET plan_id = EXCLUDED.plan_id,
                   status = EXCLUDED.status,
                   current_period_start = EXCLUDED.current_period_start,
                   current_period_end = EXCLUDED.current_period_end,
                   updated_at = NOW()
     RETURNING id`,
    [userId, planId, status, periodStart, periodEnd],
  )

  return { userId, profileId, subscriptionId: subRes.rows[0].id }
}

describe('Task 2.3: Automated Subscription Expiry Worker & Tier Downgrades', () => {
  before(async () => {
    // 1. Start test HTTP server
    await new Promise((resolve) => {
      server = http.createServer(app)
      server.listen(0, () => {
        const { port } = server.address()
        baseUrl = `http://127.0.0.1:${port}`
        resolve()
      })
    })

    // 2. Fetch plan IDs
    const plansRes = await pool.query(
      `SELECT id, name FROM subscription_plans WHERE name IN ('FREE', 'PRO')`,
    )
    for (const p of plansRes.rows) {
      if (p.name === 'FREE') freePlanId = p.id
      if (p.name === 'PRO') proPlanId = p.id
    }
    assert.ok(freePlanId, 'FREE plan must exist')
    assert.ok(proPlanId, 'PRO plan must exist')
  })

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve))
    }

    // Clean up created test entities
    if (testUserIds.length > 0) {
      await pool.query('DELETE FROM notifications WHERE user_id = ANY($1::uuid[])', [testUserIds])
      await pool.query('DELETE FROM user_subscriptions WHERE user_id = ANY($1::uuid[])', [testUserIds])
      await pool.query('DELETE FROM profiles WHERE user_id = ANY($1::uuid[])', [testUserIds])
      await pool.query('DELETE FROM users WHERE id = ANY($1::uuid[])', [testUserIds])
    }

    await pool.end().catch(() => {})
  })

  describe('Worker Logic & Data Integrity', () => {
    it('expires an ACTIVE subscription whose end date has passed and downgrades profile', async () => {
      // User 1: Expired active subscription (ended 1 hour ago), profile is_featured = TRUE
      const { userId, profileId, subscriptionId } = await createTestSubscriber({
        emailSuffix: 'expired-1',
        status: 'ACTIVE',
        periodEndOffsetMinutes: -60,
        isFeatured: true,
      })

      // User 2: Non-expired active subscription (ends in 10 days), profile is_featured = TRUE
      const { userId: activeUserId, profileId: activeProfileId } = await createTestSubscriber({
        emailSuffix: 'active-keep',
        status: 'ACTIVE',
        periodEndOffsetMinutes: 10 * 24 * 60,
        isFeatured: true,
      })

      // Run worker sweep
      const result = await processExpiredSubscriptions()
      assert.ok(result.expiredCount >= 1, 'At least 1 subscription should be expired')

      // Verify User 1 is expired and profile downgraded
      const sub1 = await pool.query('SELECT status FROM user_subscriptions WHERE id = $1', [subscriptionId])
      assert.equal(sub1.rows[0].status, 'EXPIRED', 'Subscription status must be EXPIRED')

      const prof1 = await pool.query('SELECT is_featured FROM profiles WHERE id = $1', [profileId])
      assert.equal(prof1.rows[0].is_featured, false, 'Profile is_featured must be downgraded to FALSE')

      // Verify User 1 received in-app notification
      const notifs1 = await pool.query(
        'SELECT * FROM notifications WHERE user_id = $1 AND type = $2',
        [userId, 'SUBSCRIPTION_EXPIRED'],
      )
      assert.equal(notifs1.rows.length, 1, 'User must have exactly 1 expiry notification')
      assert.equal(notifs1.rows[0].title, 'Subscription Expired')
      assert.ok(notifs1.rows[0].body.includes('expired'))
      assert.equal(notifs1.rows[0].link, '/dashboard/subscription')
      assert.deepEqual(notifs1.rows[0].metadata, { subscription_id: subscriptionId })

      // Verify User 2 (unexpired) is unaffected
      const sub2 = await pool.query('SELECT status FROM user_subscriptions WHERE user_id = $1', [activeUserId])
      assert.equal(sub2.rows[0].status, 'ACTIVE', 'Unexpired subscription must remain ACTIVE')

      const prof2 = await pool.query('SELECT is_featured FROM profiles WHERE id = $1', [activeProfileId])
      assert.equal(prof2.rows[0].is_featured, true, 'Unexpired profile must remain featured')

      const notifs2 = await pool.query(
        'SELECT * FROM notifications WHERE user_id = $1 AND type = $2',
        [activeUserId, 'SUBSCRIPTION_EXPIRED'],
      )
      assert.equal(notifs2.rows.length, 0, 'Unexpired user must not receive any expiry notification')
    })

    it('is idempotent: subsequent execution does not re-expire or generate duplicate notifications', async () => {
      // Re-run the worker immediately
      const secondResult = await processExpiredSubscriptions()

      // The previously expired user should NOT be processed again
      const testUserId = testUserIds[0]
      const notifs = await pool.query(
        'SELECT * FROM notifications WHERE user_id = $1 AND type = $2',
        [testUserId, 'SUBSCRIPTION_EXPIRED'],
      )
      assert.equal(notifs.rows.length, 1, 'Must still have only 1 notification (no duplicates)')
    })

    it('does not touch FREE or already EXPIRED subscriptions', async () => {
      // User Free: FREE plan
      const { userId: freeUserId, subscriptionId: freeSubId } = await createTestSubscriber({
        emailSuffix: 'free-user',
        status: 'FREE',
        isFree: true,
        isFeatured: false,
      })

      // User Expired: Already EXPIRED
      const { userId: expUserId, subscriptionId: expSubId } = await createTestSubscriber({
        emailSuffix: 'already-exp',
        status: 'EXPIRED',
        periodEndOffsetMinutes: -120,
        isFeatured: false,
      })

      await processExpiredSubscriptions()

      const freeSub = await pool.query('SELECT status FROM user_subscriptions WHERE id = $1', [freeSubId])
      assert.equal(freeSub.rows[0].status, 'FREE', 'FREE subscription must remain FREE')

      const expSub = await pool.query('SELECT status FROM user_subscriptions WHERE id = $1', [expSubId])
      assert.equal(expSub.rows[0].status, 'EXPIRED', 'EXPIRED subscription must remain EXPIRED')

      // Verify neither received notification
      const freeNotifs = await pool.query('SELECT * FROM notifications WHERE user_id = $1', [freeUserId])
      assert.equal(freeNotifs.rows.length, 0)
      const expNotifs = await pool.query('SELECT * FROM notifications WHERE user_id = $1', [expUserId])
      assert.equal(expNotifs.rows.length, 0)
    })

    it('expires multiple subscriptions simultaneously in batch', async () => {
      const subA = await createTestSubscriber({
        emailSuffix: 'batch-a',
        status: 'ACTIVE',
        periodEndOffsetMinutes: -30,
        isFeatured: true,
      })
      const subB = await createTestSubscriber({
        emailSuffix: 'batch-b',
        status: 'ACTIVE',
        periodEndOffsetMinutes: -45,
        isFeatured: true,
      })

      const sweep = await processExpiredSubscriptions()
      assert.ok(sweep.expiredCount >= 2, 'Sweep should process at least the 2 batch subscriptions')

      for (const sub of [subA, subB]) {
        const s = await pool.query('SELECT status FROM user_subscriptions WHERE id = $1', [sub.subscriptionId])
        assert.equal(s.rows[0].status, 'EXPIRED')

        const p = await pool.query('SELECT is_featured FROM profiles WHERE id = $1', [sub.profileId])
        assert.equal(p.rows[0].is_featured, false)

        const n = await pool.query('SELECT * FROM notifications WHERE user_id = $1 AND type = $2', [
          sub.userId,
          'SUBSCRIPTION_EXPIRED',
        ])
        assert.equal(n.rows.length, 1)
      }
    })

    it('sends advance warning notification 2 to 3 days before subscription expires without downgrading', async () => {
      // User expiring in 2 days (48 hours)
      const subSoon = await createTestSubscriber({
        emailSuffix: 'warning-2days',
        status: 'ACTIVE',
        periodEndOffsetMinutes: 48 * 60,
        isFeatured: true,
      })

      // User expiring in 10 days (outside the 3-day warning window)
      const subLater = await createTestSubscriber({
        emailSuffix: 'safe-10days',
        status: 'ACTIVE',
        periodEndOffsetMinutes: 10 * 24 * 60,
        isFeatured: true,
      })

      const warningResult = await processUpcomingExpiryWarnings(3)
      assert.ok(warningResult.warnedCount >= 1, 'Should warn at least 1 upcoming expiry')

      // Verify user expiring in 2 days got an advance warning notification
      const notifsSoon = await pool.query(
        'SELECT * FROM notifications WHERE user_id = $1 AND type = $2',
        [subSoon.userId, 'SUBSCRIPTION_EXPIRING_SOON'],
      )
      assert.equal(notifsSoon.rows.length, 1, 'User must have exactly 1 upcoming expiry notification')
      assert.equal(notifsSoon.rows[0].title, 'Subscription Expiring Soon')
      assert.ok(notifsSoon.rows[0].body.includes('expire in'))

      // Subscription remains ACTIVE and featured
      const s = await pool.query('SELECT status FROM user_subscriptions WHERE id = $1', [subSoon.subscriptionId])
      assert.equal(s.rows[0].status, 'ACTIVE')
      const p = await pool.query('SELECT is_featured FROM profiles WHERE id = $1', [subSoon.profileId])
      assert.equal(p.rows[0].is_featured, true)

      // User expiring in 10 days should NOT receive a warning notification
      const notifsLater = await pool.query(
        'SELECT * FROM notifications WHERE user_id = $1 AND type = $2',
        [subLater.userId, 'SUBSCRIPTION_EXPIRING_SOON'],
      )
      assert.equal(notifsLater.rows.length, 0, 'User with 10 days remaining should not be warned yet')

      // Test idempotency: re-running does not duplicate the warning
      const repeatResult = await processUpcomingExpiryWarnings(3)
      const notifsRepeat = await pool.query(
        'SELECT * FROM notifications WHERE user_id = $1 AND type = $2',
        [subSoon.userId, 'SUBSCRIPTION_EXPIRING_SOON'],
      )
      assert.equal(notifsRepeat.rows.length, 1, 'Must not create duplicate warning notifications')
    })
  })

  describe('Protected Production HTTP Cron Endpoint (POST /api/internal/cron/expire-subscriptions)', () => {
    it('rejects requests with missing x-cron-secret (401 Unauthorized)', async () => {
      const res = await request('POST', '/api/internal/cron/expire-subscriptions')
      assert.equal(res.statusCode, 401)
      assert.equal(res.body.success, false)
      assert.equal(res.body.error.code, 'UNAUTHORIZED_CRON')
    })

    it('rejects requests with incorrect x-cron-secret (401 Unauthorized)', async () => {
      const res = await request('POST', '/api/internal/cron/expire-subscriptions', {
        headers: { 'x-cron-secret': 'wrong-secret-token' },
      })
      assert.equal(res.statusCode, 401)
      assert.equal(res.body.success, false)
      assert.equal(res.body.error.code, 'UNAUTHORIZED_CRON')
    })

    it('successfully triggers expiry sweep when authenticated with valid x-cron-secret', async () => {
      // Set up a new expired subscriber to be cleaned by the HTTP endpoint
      const { subscriptionId, profileId, userId } = await createTestSubscriber({
        emailSuffix: 'http-cron-test',
        status: 'ACTIVE',
        periodEndOffsetMinutes: -15,
        isFeatured: true,
      })

      const res = await request('POST', '/api/internal/cron/expire-subscriptions', {
        headers: { 'x-cron-secret': config.cronSecret },
      })

      assert.equal(res.statusCode, 200)
      assert.equal(res.body.success, true)
      assert.ok(typeof res.body.data.expiredCount === 'number')
      assert.ok(res.body.data.expiredCount >= 1)

      // Verify the subscription was expired
      const s = await pool.query('SELECT status FROM user_subscriptions WHERE id = $1', [subscriptionId])
      assert.equal(s.rows[0].status, 'EXPIRED')

      const p = await pool.query('SELECT is_featured FROM profiles WHERE id = $1', [profileId])
      assert.equal(p.rows[0].is_featured, false)

      const n = await pool.query('SELECT * FROM notifications WHERE user_id = $1 AND type = $2', [
        userId,
        'SUBSCRIPTION_EXPIRED',
      ])
      assert.equal(n.rows.length, 1)
    })
  })
})
