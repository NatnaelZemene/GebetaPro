/**
 * tests/profile-gallery.test.js — Task 2.4: Profile Multi-Image Showcase / Gallery Management tests.
 *
 * Covers:
 *  1. Public Gallery Retrieval:
 *     - GET /api/profiles/@:slug/gallery (with and without @)
 *     - Strips internal storage_key from public exposure
 *     - Returns 404 for nonexistent slug
 *  2. Image Uploads:
 *     - POST /api/profile/gallery & /api/profile/gallery/upload
 *     - Authentication requirement (401)
 *     - Validation handling: 422 for no files, 422 for unsupported MIME types
 *     - Successful upload of single and multiple images (201)
 *     - Auto-sets is_primary = true for first image
 *  3. Plan-based Image Limits:
 *     - Free plan limit (3 images) rejected with 403 PLAN_LIMIT_EXCEEDED
 *     - Pro plan subscription unlocks higher limit (up to 30 images)
 *  4. Image Reordering:
 *     - PATCH /api/profile/gallery/reorder
 *     - Reorders sort_order safely
 *     - Rejects foreign image IDs (cross-user isolation)
 *  5. Image Deletion & Cover Promotion:
 *     - DELETE /api/profile/gallery/:imageId
 *     - Cross-user deletion isolation (cannot delete other's image)
 *     - Primary photo deletion promotes next available photo or clears cover
 */
import 'dotenv/config'
import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { URL } from 'node:url'
import pool from '../src/db/index.js'
import { generateToken } from '../src/utils/jwt.js'

process.env.NODE_ENV = 'test'
process.env.PORT = '0'

const { default: app } = await import('../src/app.js')

let server
let baseUrl
let freePlanId
let proPlanId
const createdUserIds = []

// ── HTTP Request Helpers ───────────────────────────────────────────────────────

function makeRequest(method, path, { body, headers = {} } = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl)
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers,
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
    if (body) {
      req.write(body)
    }
    req.end()
  })
}

function jsonRequest(method, path, data = null, headers = {}) {
  const body = data ? JSON.stringify(data) : null
  const reqHeaders = {
    ...headers,
    ...(body ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } : {}),
  }
  return makeRequest(method, path, { body, headers: reqHeaders })
}

function multipartRequest(path, fields = {}, files = [], headers = {}) {
  const boundary = '----WebKitFormBoundaryTestGallery' + Date.now()
  const chunks = []

  for (const [key, val] of Object.entries(fields)) {
    chunks.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${val}\r\n`,
      ),
    )
  }

  for (const file of files) {
    const fieldname = file.fieldname || 'images'
    const filename = file.filename || 'photo.jpg'
    const mimetype = file.mimetype || 'image/jpeg'
    const buffer = Buffer.isBuffer(file.buffer) ? file.buffer : Buffer.from(file.buffer || 'fake-img-content')

    chunks.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${fieldname}"; filename="${filename}"\r\nContent-Type: ${mimetype}\r\n\r\n`,
      ),
    )
    chunks.push(buffer)
    chunks.push(Buffer.from('\r\n'))
  }

  chunks.push(Buffer.from(`--${boundary}--\r\n`))
  const body = Buffer.concat(chunks)

  const reqHeaders = {
    ...headers,
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': body.length,
  }

  return makeRequest('POST', path, { body, headers: reqHeaders })
}

// ── Test User Helpers ──────────────────────────────────────────────────────────

async function createTestUserWithProfile(tag, isPro = false) {
  const email = `gallery-test-${tag}-${Date.now()}-${Math.floor(Math.random() * 1000)}@example.test`
  const phone = `+25191${Math.floor(1000000 + Math.random() * 9000000)}`
  const slug = `gallery-shop-${tag}-${Date.now()}-${Math.floor(Math.random() * 1000)}`

  // 1. Direct DB user creation
  const userRes = await pool.query(
    `INSERT INTO users (email, phone, password_hash, role, status, email_verified_at)
     VALUES ($1, $2, 'test_hash_placeholder', 'USER', 'ACTIVE', NOW())
     RETURNING id, email, role`,
    [email, phone],
  )
  const user = userRes.rows[0]
  createdUserIds.push(user.id)

  const token = generateToken({ id: user.id, email: user.email, role: user.role })

  // 2. Direct DB profile creation
  const profileRes = await pool.query(
    `INSERT INTO profiles (user_id, slug, display_name, headline, is_published, is_featured)
     VALUES ($1, $2, $3, 'Professional test showcase', TRUE, $4)
     RETURNING id, user_id, slug, display_name`,
    [user.id, slug, `Gallery Shop ${tag}`, isPro],
  )
  const profile = profileRes.rows[0]

  // 3. Subscription assignment
  let planId
  if (isPro) {
    const proRes = await pool.query("SELECT id FROM subscription_plans WHERE name = 'PRO'")
    planId = proRes.rows[0]?.id
  } else {
    const freeRes = await pool.query("SELECT id FROM subscription_plans WHERE name = 'FREE'")
    planId = freeRes.rows[0]?.id
  }

  const subStatus = isPro ? 'ACTIVE' : 'FREE'
  const updateRes = await pool.query(
    `UPDATE user_subscriptions
     SET plan_id = $1, status = $2, current_period_start = NOW(), current_period_end = NOW() + INTERVAL '30 days', updated_at = NOW()
     WHERE user_id = $3`,
    [planId, subStatus, user.id],
  )
  if (updateRes.rowCount === 0) {
    await pool.query(
      `INSERT INTO user_subscriptions (user_id, plan_id, status, current_period_start, current_period_end)
       VALUES ($1, $2, $3, NOW(), NOW() + INTERVAL '30 days')`,
      [user.id, planId, subStatus],
    )
  }

  return { token, user, profile, slug }
}

describe('Task 2.4: Profile Multi-Image Showcase / Gallery Management', () => {
  before(async () => {
    // 1. Start HTTP server
    server = http.createServer(app)
    await new Promise((resolve) => server.listen(0, resolve))
    const { port } = server.address()
    baseUrl = `http://127.0.0.1:${port}`

    // 2. Fetch plans
    const freeRes = await pool.query("SELECT id FROM subscription_plans WHERE name = 'FREE'")
    freePlanId = freeRes.rows[0]?.id
    const proRes = await pool.query("SELECT id FROM subscription_plans WHERE name = 'PRO'")
    proPlanId = proRes.rows[0]?.id
  })

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve))
    }
    // Clean up created test accounts
    if (createdUserIds.length > 0) {
      await pool.query('DELETE FROM users WHERE id = ANY($1)', [createdUserIds])
    }
    await pool.query("DELETE FROM users WHERE email LIKE 'gallery-test-%'")
  })

  // ── Public Gallery API ───────────────────────────────────────────────────────

  describe('Public Gallery Retrieval', () => {
    it('returns empty gallery for newly created profile', async () => {
      const { slug } = await createTestUserWithProfile('pub-empty')
      const res = await jsonRequest('GET', `/api/profiles/@${slug}/gallery`)

      assert.strictEqual(res.statusCode, 200)
      assert.strictEqual(res.body.success, true)
      assert.ok(Array.isArray(res.body.data.gallery))
      assert.strictEqual(res.body.data.gallery.length, 0)
    })

    it('supports route with and without leading @ symbol', async () => {
      const { slug } = await createTestUserWithProfile('pub-alias')
      const resWithAt = await jsonRequest('GET', `/api/profiles/@${slug}/gallery`)
      const resWithoutAt = await jsonRequest('GET', `/api/profiles/${slug}/gallery`)

      assert.strictEqual(resWithAt.statusCode, 200)
      assert.strictEqual(resWithoutAt.statusCode, 200)
      assert.deepStrictEqual(resWithAt.body.data, resWithoutAt.body.data)
    })

    it('returns 404 for nonexistent profile slug', async () => {
      const res = await jsonRequest('GET', '/api/profiles/@non-existent-gallery-slug/gallery')
      assert.strictEqual(res.statusCode, 404)
    })
  })

  // ── Upload Gallery Images ───────────────────────────────────────────────────

  describe('Upload Gallery Images (POST /api/profile/gallery)', () => {
    it('rejects unauthenticated upload requests with 401', async () => {
      const res = await multipartRequest(
        '/api/profile/gallery',
        {},
        [{ fieldname: 'images', filename: 'photo.jpg', mimetype: 'image/jpeg', buffer: 'dummy' }],
      )
      assert.strictEqual(res.statusCode, 401)
    })

    it('rejects uploads with no image files with 422', async () => {
      const { token } = await createTestUserWithProfile('upload-nofile')
      const res = await multipartRequest(
        '/api/profile/gallery',
        {},
        [],
        { Authorization: `Bearer ${token}` },
      )
      assert.strictEqual(res.statusCode, 422)
    })

    it('rejects unsupported file MIME types (e.g. text/plain) with 422', async () => {
      const { token } = await createTestUserWithProfile('upload-badmime')
      const res = await multipartRequest(
        '/api/profile/gallery',
        {},
        [{ fieldname: 'images', filename: 'document.txt', mimetype: 'text/plain', buffer: 'hello world' }],
        { Authorization: `Bearer ${token}` },
      )
      assert.strictEqual(res.statusCode, 422)
      assert.strictEqual(res.body.error.code, 'UNSUPPORTED_FILE_TYPE')
    })

    it('successfully uploads a single image and auto-sets is_primary = true for the first photo', async () => {
      const { token, slug } = await createTestUserWithProfile('upload-single')
      const res = await multipartRequest(
        '/api/profile/gallery',
        { alt_text: 'Storefront front view' },
        [{ fieldname: 'images', filename: 'storefront.jpg', mimetype: 'image/jpeg', buffer: 'img-bytes-1' }],
        { Authorization: `Bearer ${token}` },
      )

      assert.strictEqual(res.statusCode, 201)
      assert.strictEqual(res.body.success, true)
      assert.ok(Array.isArray(res.body.data))
      assert.strictEqual(res.body.data.length, 1)

      const uploaded = res.body.data[0]
      assert.ok(uploaded.id)
      assert.strictEqual(uploaded.is_primary, true)
      assert.strictEqual(uploaded.alt_text, 'Storefront front view')

      // Verify in public gallery and check internal storage_key is sanitized
      const pubRes = await jsonRequest('GET', `/api/profiles/@${slug}/gallery`)
      assert.strictEqual(pubRes.statusCode, 200)
      assert.strictEqual(pubRes.body.data.gallery.length, 1)
      assert.strictEqual(pubRes.body.data.gallery[0].id, uploaded.id)
      assert.strictEqual(pubRes.body.data.gallery[0].storage_key, undefined, 'storage_key must not be exposed')
    })

    it('successfully uploads multiple images with captions in batch via /api/profile/gallery/upload', async () => {
      const { token } = await createTestUserWithProfile('upload-multi')
      const captions = JSON.stringify(['Work Area 1', 'Work Area 2'])
      const res = await multipartRequest(
        '/api/profile/gallery/upload',
        { captions },
        [
          { fieldname: 'images', filename: 'work1.png', mimetype: 'image/png', buffer: 'bytes-work-1' },
          { fieldname: 'images', filename: 'work2.webp', mimetype: 'image/webp', buffer: 'bytes-work-2' },
        ],
        { Authorization: `Bearer ${token}` },
      )

      assert.strictEqual(res.statusCode, 201)
      assert.strictEqual(res.body.data.length, 2)
      assert.strictEqual(res.body.data[0].alt_text, 'Work Area 1')
      assert.strictEqual(res.body.data[1].alt_text, 'Work Area 2')
    })
  })

  // ── Plan-based Image Limits ────────────────────────────────────────────────

  describe('Plan-based Image Limits', () => {
    it('enforces Free tier quota (max 3 images) with 403 PLAN_LIMIT_EXCEEDED', async () => {
      const { token } = await createTestUserWithProfile('limit-free', false) // Free plan

      // 1. Upload 2 images (allowed, 2 <= 3)
      const res1 = await multipartRequest(
        '/api/profile/gallery',
        {},
        [
          { fieldname: 'images', filename: 'img1.jpg', mimetype: 'image/jpeg', buffer: 'b1' },
          { fieldname: 'images', filename: 'img2.jpg', mimetype: 'image/jpeg', buffer: 'b2' },
        ],
        { Authorization: `Bearer ${token}` },
      )
      assert.strictEqual(res1.statusCode, 201)

      // 2. Try to upload 2 more images (total would be 4 > 3 -> reject)
      const res2 = await multipartRequest(
        '/api/profile/gallery',
        {},
        [
          { fieldname: 'images', filename: 'img3.jpg', mimetype: 'image/jpeg', buffer: 'b3' },
          { fieldname: 'images', filename: 'img4.jpg', mimetype: 'image/jpeg', buffer: 'b4' },
        ],
        { Authorization: `Bearer ${token}` },
      )

      assert.strictEqual(res2.statusCode, 403)
      assert.strictEqual(res2.body.error.code, 'PLAN_LIMIT_EXCEEDED')
    })

    it('allows higher uploads for users with a paid PRO subscription (up to 30)', async () => {
      const { token } = await createTestUserWithProfile('limit-pro', true) // PRO plan

      // Upload 4 images simultaneously (allowed on PRO)
      const res = await multipartRequest(
        '/api/profile/gallery',
        {},
        [
          { fieldname: 'images', filename: 'p1.jpg', mimetype: 'image/jpeg', buffer: 'p1' },
          { fieldname: 'images', filename: 'p2.jpg', mimetype: 'image/jpeg', buffer: 'p2' },
          { fieldname: 'images', filename: 'p3.jpg', mimetype: 'image/jpeg', buffer: 'p3' },
          { fieldname: 'images', filename: 'p4.jpg', mimetype: 'image/jpeg', buffer: 'p4' },
        ],
        { Authorization: `Bearer ${token}` },
      )

      assert.strictEqual(res.statusCode, 201)
      assert.strictEqual(res.body.data.length, 4)
    })
  })

  // ── Image Reordering ────────────────────────────────────────────────────────

  describe('Image Reordering (PATCH /api/profile/gallery/reorder)', () => {
    it('successfully reorders images and persists new sort_order', async () => {
      const { token, slug } = await createTestUserWithProfile('reorder-ok', true)

      // Upload 3 images
      const uploadRes = await multipartRequest(
        '/api/profile/gallery',
        {},
        [
          { fieldname: 'images', filename: 'a.jpg', mimetype: 'image/jpeg', buffer: 'a' },
          { fieldname: 'images', filename: 'b.jpg', mimetype: 'image/jpeg', buffer: 'b' },
          { fieldname: 'images', filename: 'c.jpg', mimetype: 'image/jpeg', buffer: 'c' },
        ],
        { Authorization: `Bearer ${token}` },
      )
      assert.strictEqual(uploadRes.statusCode, 201)
      const [imgA, imgB, imgC] = uploadRes.body.data

      // Reorder to [C, A, B]
      const newOrder = [imgC.id, imgA.id, imgB.id]
      const reorderRes = await jsonRequest(
        'PATCH',
        '/api/profile/gallery/reorder',
        { image_ids: newOrder },
        { Authorization: `Bearer ${token}` },
      )

      assert.strictEqual(reorderRes.statusCode, 200)
      assert.strictEqual(reorderRes.body.success, true)

      // Check public gallery reflects updated sort_order
      const pubRes = await jsonRequest('GET', `/api/profiles/@${slug}/gallery`)
      const galleryIds = pubRes.body.data.gallery.map((img) => img.id)
      assert.deepStrictEqual(galleryIds, newOrder)
    })

    it('rejects reorder requests with image IDs belonging to another user', async () => {
      const userA = await createTestUserWithProfile('reorder-user-a')
      const userB = await createTestUserWithProfile('reorder-user-b')

      // User B uploads an image
      const uploadB = await multipartRequest(
        '/api/profile/gallery',
        {},
        [{ fieldname: 'images', filename: 'b.jpg', mimetype: 'image/jpeg', buffer: 'b' }],
        { Authorization: `Bearer ${userB.token}` },
      )
      const userBImageId = uploadB.body.data[0].id

      // User A attempts to reorder using User B's image ID
      const res = await jsonRequest(
        'PATCH',
        '/api/profile/gallery/reorder',
        { image_ids: [userBImageId] },
        { Authorization: `Bearer ${userA.token}` },
      )

      assert.strictEqual(res.statusCode, 404)
    })
  })

  // ── Image Deletion & Cover Promotion ────────────────────────────────────────

  describe('Image Deletion & Cover Promotion (DELETE /api/profile/gallery/:id)', () => {
    it('prevents user from deleting another user gallery image (cross-user isolation)', async () => {
      const userA = await createTestUserWithProfile('del-user-a')
      const userB = await createTestUserWithProfile('del-user-b')

      // User A uploads an image
      const uploadA = await multipartRequest(
        '/api/profile/gallery',
        {},
        [{ fieldname: 'images', filename: 'a.jpg', mimetype: 'image/jpeg', buffer: 'a' }],
        { Authorization: `Bearer ${userA.token}` },
      )
      const userAImageId = uploadA.body.data[0].id

      // User B attempts to delete User A's image
      const delRes = await jsonRequest(
        'DELETE',
        `/api/profile/gallery/${userAImageId}`,
        null,
        { Authorization: `Bearer ${userB.token}` },
      )

      assert.strictEqual(delRes.statusCode, 404)
    })

    it('successfully deletes an image and promotes the next available image to cover', async () => {
      const { token, profile } = await createTestUserWithProfile('del-cover-promo')

      // Upload 2 images: first becomes primary cover
      const uploadRes = await multipartRequest(
        '/api/profile/gallery',
        {},
        [
          { fieldname: 'images', filename: 'first.jpg', mimetype: 'image/jpeg', buffer: '1' },
          { fieldname: 'images', filename: 'second.jpg', mimetype: 'image/jpeg', buffer: '2' },
        ],
        { Authorization: `Bearer ${token}` },
      )
      const [img1, img2] = uploadRes.body.data
      assert.strictEqual(img1.is_primary, true)

      // Delete the primary image
      const delRes = await jsonRequest(
        'DELETE',
        `/api/profile/gallery/${img1.id}`,
        null,
        { Authorization: `Bearer ${token}` },
      )
      assert.strictEqual(delRes.statusCode, 200)

      // Verify the remaining image was promoted to primary cover
      const remainingRes = await pool.query(
        'SELECT id, is_primary FROM profile_images WHERE profile_id = $1',
        [profile.id],
      )
      assert.strictEqual(remainingRes.rows.length, 1)
      assert.strictEqual(remainingRes.rows[0].id, img2.id)
      assert.strictEqual(remainingRes.rows[0].is_primary, true)
    })
  })
})
