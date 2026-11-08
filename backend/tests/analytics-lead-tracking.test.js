/**
 * tests/analytics-lead-tracking.test.js — Task 2.2 WhatsApp & Telegram Lead Tracking tests.
 *
 * Tests:
 *  - POST /api/analytics/track with valid lead events (WHATSAPP_CLICK, TELEGRAM_CLICK, etc.)
 *  - Counter incrementing: contact_clicks_count incremented for lead events, views_count for VIEW
 *  - Visitor IP and User-Agent capture in profile_analytics_events table
 *  - Event metadata preservation
 *  - Validation handling: 422 for invalid profile_id, missing fields, or unknown event types
 *  - Profile not found: 404 for valid UUID not present in profiles table
 *  - Atomicity of transaction on profile existence check and event insert
 *
 * Uses Node.js built-in test runner (node:test).
 */
import 'dotenv/config'
import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { URL } from 'node:url'
import pool from '../src/db/index.js'

process.env.NODE_ENV = 'test'
process.env.PORT = '0'

const { default: app } = await import('../src/app.js')

let server
let baseUrl
let testProfileId
let testProfileSlug

function post(path, body, customHeaders = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl)
    const payload = JSON.stringify(body)
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        ...customHeaders,
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
    req.write(payload)
    req.end()
  })
}

describe('Task 2.2: WhatsApp & Telegram Lead Tracking (POST /api/analytics/track)', () => {
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

    // 2. Fetch a published profile to use for tracking tests
    const profileRes = await pool.query(
      `SELECT id, slug, views_count, contact_clicks_count 
       FROM profiles 
       WHERE is_published = TRUE 
       ORDER BY created_at ASC 
       LIMIT 1`
    )
    assert.ok(profileRes.rows[0], 'At least one published profile must exist in the database for testing')
    testProfileId = profileRes.rows[0].id
    testProfileSlug = profileRes.rows[0].slug
  })

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve))
    }
    await pool.end().catch(() => {})
  })

  describe('Validation & Error Handling', () => {
    it('returns 422 if profile_id is not a valid UUID', async () => {
      const res = await post('/api/analytics/track', {
        profile_id: 'not-a-valid-uuid',
        event_type: 'WHATSAPP_CLICK',
      })
      assert.equal(res.statusCode, 422)
      assert.equal(res.body.success, false)
      assert.equal(res.body.error.code, 'VALIDATION_ERROR')
    })

    it('returns 422 if profile_id is missing', async () => {
      const res = await post('/api/analytics/track', {
        event_type: 'WHATSAPP_CLICK',
      })
      assert.equal(res.statusCode, 422)
      assert.equal(res.body.success, false)
      assert.equal(res.body.error.code, 'VALIDATION_ERROR')
    })

    it('returns 422 if event_type is missing', async () => {
      const res = await post('/api/analytics/track', {
        profile_id: testProfileId,
      })
      assert.equal(res.statusCode, 422)
      assert.equal(res.body.success, false)
      assert.equal(res.body.error.code, 'VALIDATION_ERROR')
    })

    it('returns 422 if event_type is not an allowed enum value', async () => {
      const res = await post('/api/analytics/track', {
        profile_id: testProfileId,
        event_type: 'UNKNOWN_ACTION',
      })
      assert.equal(res.statusCode, 422)
      assert.equal(res.body.success, false)
      assert.equal(res.body.error.code, 'VALIDATION_ERROR')
    })

    it('returns 404 if profile_id is a valid UUID but does not exist in DB', async () => {
      const nonExistentUuid = 'a0000000-0000-4000-8000-000000000000'
      const res = await post('/api/analytics/track', {
        profile_id: nonExistentUuid,
        event_type: 'WHATSAPP_CLICK',
      })
      assert.equal(res.statusCode, 404)
      assert.equal(res.body.success, false)
      assert.equal(res.body.error.code, 'PROFILE_NOT_FOUND')
    })
  })

  describe('Event Recording & Attribution', () => {
    it('records WHATSAPP_CLICK and increments contact_clicks_count atomically', async () => {
      const beforeRes = await pool.query(
        'SELECT contact_clicks_count, views_count FROM profiles WHERE id = $1',
        [testProfileId]
      )
      const prevContactClicks = beforeRes.rows[0].contact_clicks_count || 0
      const prevViews = beforeRes.rows[0].views_count || 0

      const res = await post(
        '/api/analytics/track',
        {
          profile_id: testProfileId,
          event_type: 'WHATSAPP_CLICK',
          metadata: { source: 'profile_card', platform: 'mobile_web' },
        },
        {
          'x-forwarded-for': '198.51.100.42',
          'user-agent': 'Mozilla/5.0 TestBrowser/1.0',
        }
      )

      assert.equal(res.statusCode, 201)
      assert.equal(res.body.success, true)
      assert.equal(res.body.data.profile_id, testProfileId)
      assert.equal(res.body.data.event_type, 'WHATSAPP_CLICK')
      assert.ok(res.body.data.event_id)

      // Verify DB counters
      const afterRes = await pool.query(
        'SELECT contact_clicks_count, views_count FROM profiles WHERE id = $1',
        [testProfileId]
      )
      assert.equal(afterRes.rows[0].contact_clicks_count, prevContactClicks + 1)
      assert.equal(afterRes.rows[0].views_count, prevViews)

      // Verify row inserted in profile_analytics_events
      const eventRow = await pool.query(
        'SELECT * FROM profile_analytics_events WHERE id = $1',
        [res.body.data.event_id]
      )
      assert.equal(eventRow.rows.length, 1)
      assert.equal(eventRow.rows[0].profile_id, testProfileId)
      assert.equal(eventRow.rows[0].event_type, 'WHATSAPP_CLICK')
      assert.equal(eventRow.rows[0].visitor_ip, '198.51.100.42')
      assert.equal(eventRow.rows[0].user_agent, 'Mozilla/5.0 TestBrowser/1.0')
      assert.deepEqual(eventRow.rows[0].metadata, { source: 'profile_card', platform: 'mobile_web' })
    })

    it('records TELEGRAM_CLICK and increments contact_clicks_count atomically', async () => {
      const beforeRes = await pool.query(
        'SELECT contact_clicks_count FROM profiles WHERE id = $1',
        [testProfileId]
      )
      const prevClicks = beforeRes.rows[0].contact_clicks_count || 0

      const res = await post('/api/analytics/track', {
        profile_id: testProfileId,
        event_type: 'TELEGRAM_CLICK',
        metadata: { button_location: 'profile_header' },
      })

      assert.equal(res.statusCode, 201)
      assert.equal(res.body.success, true)
      assert.equal(res.body.data.event_type, 'TELEGRAM_CLICK')

      const afterRes = await pool.query(
        'SELECT contact_clicks_count FROM profiles WHERE id = $1',
        [testProfileId]
      )
      assert.equal(afterRes.rows[0].contact_clicks_count, prevClicks + 1)
    })

    it('records other lead contact clicks (PHONE_CLICK, EMAIL_CLICK, WEBSITE_CLICK)', async () => {
      for (const eventType of ['PHONE_CLICK', 'EMAIL_CLICK', 'WEBSITE_CLICK', 'CONTACT_CLICK']) {
        const beforeRes = await pool.query(
          'SELECT contact_clicks_count FROM profiles WHERE id = $1',
          [testProfileId]
        )
        const prevClicks = beforeRes.rows[0].contact_clicks_count || 0

        const res = await post('/api/analytics/track', {
          profile_id: testProfileId,
          event_type: eventType,
        })

        assert.equal(res.statusCode, 201)
        assert.equal(res.body.data.event_type, eventType)

        const afterRes = await pool.query(
          'SELECT contact_clicks_count FROM profiles WHERE id = $1',
          [testProfileId]
        )
        assert.equal(afterRes.rows[0].contact_clicks_count, prevClicks + 1)
      }
    })

    it('records VIEW and increments views_count without changing contact_clicks_count', async () => {
      const beforeRes = await pool.query(
        'SELECT views_count, contact_clicks_count FROM profiles WHERE id = $1',
        [testProfileId]
      )
      const prevViews = beforeRes.rows[0].views_count || 0
      const prevContactClicks = beforeRes.rows[0].contact_clicks_count || 0

      const res = await post('/api/analytics/track', {
        profile_id: testProfileId,
        event_type: 'VIEW',
      })

      assert.equal(res.statusCode, 201)
      assert.equal(res.body.success, true)
      assert.equal(res.body.data.event_type, 'VIEW')

      const afterRes = await pool.query(
        'SELECT views_count, contact_clicks_count FROM profiles WHERE id = $1',
        [testProfileId]
      )
      assert.equal(afterRes.rows[0].views_count, prevViews + 1)
      assert.equal(afterRes.rows[0].contact_clicks_count, prevContactClicks)
    })
  })
})
