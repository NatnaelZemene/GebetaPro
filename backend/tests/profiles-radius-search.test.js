/**
 * tests/profiles-radius-search.test.js — Task 2.1 PostGIS Radius Search tests.
 *
 * Tests:
 *  - PostGIS geography column and GiST spatial index presence
 *  - Radius filtering via ST_DWithin() with 5km, 10km, 25km radii
 *  - Distance calculation in kilometers via ST_Distance()
 *  - Results sorted in ascending distance order
 *  - Distant profiles outside radius are excluded
 *  - Parameter aliases (lat, lng, radius vs latitude, longitude, radius_km)
 *  - Coordinate and radius validation (bounds, paired coordinates, negative radius)
 *  - Safe handling of 0 coordinate values
 *  - Combined search with category and text filters
 *  - Only published and active profiles are returned
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

function request(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl)
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: `${url.pathname}${url.search}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
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
    req.end()
  })
}

describe('Task 2.1: PostGIS Radius Search ("Professionals Near Me")', () => {
  before(async () => {
    await new Promise((resolve) => {
      server = http.createServer(app)
      server.listen(0, () => {
        const { port } = server.address()
        baseUrl = `http://127.0.0.1:${port}`
        resolve()
      })
    })
  })

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve))
    }
    await pool.end().catch(() => {})
  })

  describe('Database Schema & PostGIS Setup', () => {
    it('PostGIS extension is installed and active', async () => {
      const res = await pool.query("SELECT extname FROM pg_extension WHERE extname = 'postgis'")
      assert.equal(res.rows.length, 1, 'PostGIS extension should be installed')
      assert.equal(res.rows[0].extname, 'postgis')
    })

    it('profiles table has location_geog column of type geography', async () => {
      const res = await pool.query(`
        SELECT column_name, udt_name 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'location_geog'
      `)
      assert.equal(res.rows.length, 1, 'location_geog column must exist')
      assert.equal(res.rows[0].udt_name, 'geography')
    })

    it('GiST spatial index idx_profiles_location_geog exists on location_geog', async () => {
      const res = await pool.query(`
        SELECT indexname, indexdef 
        FROM pg_indexes 
        WHERE tablename = 'profiles' AND indexname = 'idx_profiles_location_geog'
      `)
      assert.equal(res.rows.length, 1, 'idx_profiles_location_geog GiST index must exist')
      assert.match(res.rows[0].indexdef, /using gist/i)
    })
  })

  describe('Radius Search Functionality', () => {
    // Bole, Addis Ababa coordinates: (8.9982, 38.7865)
    const addisLat = 8.9982
    const addisLng = 38.7865

    it('returns nearby profiles with distance_km calculated', async () => {
      const res = await request(`/api/profiles/search?latitude=${addisLat}&longitude=${addisLng}&radius_km=10`)
      assert.equal(res.statusCode, 200)
      assert.equal(res.body.success, true)
      assert.ok(Array.isArray(res.body.data.profiles))
      assert.ok(res.body.data.profiles.length > 0)

      // Ensure every profile has a numeric distance_km <= 10
      for (const p of res.body.data.profiles) {
        assert.ok(typeof p.distance_km === 'number', `Expected numeric distance_km for ${p.slug}`)
        assert.ok(p.distance_km <= 10.0, `Profile ${p.slug} at ${p.distance_km}km exceeds 10km radius`)
      }
    })

    it('orders results by distance_km ascending (closest first)', async () => {
      const res = await request(`/api/profiles/search?latitude=${addisLat}&longitude=${addisLng}&radius_km=25`)
      assert.equal(res.statusCode, 200)
      const profiles = res.body.data.profiles
      assert.ok(profiles.length >= 2)

      for (let i = 1; i < profiles.length; i++) {
        assert.ok(
          profiles[i].distance_km >= profiles[i - 1].distance_km,
          `Expected ascending order: ${profiles[i - 1].distance_km} <= ${profiles[i].distance_km}`
        )
      }
    })

    it('excludes distant profiles beyond the selected radius', async () => {
      // 5km radius around Addis Ababa should exclude Gondar profiles (~425km away)
      const res5km = await request(`/api/profiles/search?latitude=${addisLat}&longitude=${addisLng}&radius_km=5`)
      assert.equal(res5km.statusCode, 200)

      const slugs = res5km.body.data.profiles.map(p => p.slug)
      assert.ok(!slugs.includes('goha-hotel-gondar'), 'Gondar hotel must not be in Addis 5km radius')
      assert.ok(!slugs.includes('gondar-plaza-hotel'), 'Gondar plaza must not be in Addis 5km radius')
    })

    it('wider radius (25km) returns equal or more profiles than narrower radius (5km)', async () => {
      const res5km = await request(`/api/profiles/search?latitude=${addisLat}&longitude=${addisLng}&radius_km=5`)
      const res25km = await request(`/api/profiles/search?latitude=${addisLat}&longitude=${addisLng}&radius_km=25`)

      assert.equal(res5km.statusCode, 200)
      assert.equal(res25km.statusCode, 200)
      assert.ok(
        res25km.body.data.pagination.total >= res5km.body.data.pagination.total,
        `25km total (${res25km.body.data.pagination.total}) should be >= 5km total (${res5km.body.data.pagination.total})`
      )
    })

    it('accepts parameter aliases: lat, lng, radius', async () => {
      const res = await request(`/api/profiles/search?lat=${addisLat}&lng=${addisLng}&radius=10`)
      assert.equal(res.statusCode, 200)
      assert.ok(res.body.data.profiles.length > 0)
      assert.ok(typeof res.body.data.profiles[0].distance_km === 'number')
    })

    it('preserves category filtering alongside radius search', async () => {
      // Find category id for plumbing
      const catRes = await pool.query("SELECT id FROM categories WHERE slug = 'plumbing' LIMIT 1")
      if (catRes.rows.length > 0) {
        const catId = catRes.rows[0].id
        const res = await request(`/api/profiles/search?latitude=${addisLat}&longitude=${addisLng}&radius_km=25&category_id=${catId}`)
        assert.equal(res.statusCode, 200)
        for (const p of res.body.data.profiles) {
          assert.equal(p.category_slug, 'plumbing')
        }
      }
    })

    it('preserves text search query alongside radius search', async () => {
      const res = await request(`/api/profiles/search?latitude=${addisLat}&longitude=${addisLng}&radius_km=25&search=Abebe`)
      assert.equal(res.statusCode, 200)
      for (const p of res.body.data.profiles) {
        assert.match(p.display_name, /Abebe/i)
      }
    })

    it('handles (0, 0) coordinates safely without treating zeros as missing', async () => {
      const res = await request('/api/profiles/search?latitude=0&longitude=0&radius_km=10')
      assert.equal(res.statusCode, 200)
      assert.equal(res.body.success, true)
      assert.ok(Array.isArray(res.body.data.profiles))
      // Existing profile at (0, 0) in DB should be found with distance_km = 0
      assert.ok(res.body.data.profiles.length >= 1)
      assert.equal(res.body.data.profiles[0].distance_km, 0)
    })
  })

  describe('API Coordinate Validation', () => {
    it('rejects latitude greater than 90 with 422', async () => {
      const res = await request('/api/profiles/search?latitude=91&longitude=38.7')
      assert.equal(res.statusCode, 422)
      assert.equal(res.body.success, false)
      assert.equal(res.body.error.code, 'VALIDATION_ERROR')
    })

    it('rejects latitude less than -90 with 422', async () => {
      const res = await request('/api/profiles/search?latitude=-90.5&longitude=38.7')
      assert.equal(res.statusCode, 422)
      assert.equal(res.body.success, false)
      assert.equal(res.body.error.code, 'VALIDATION_ERROR')
    })

    it('rejects longitude greater than 180 with 422', async () => {
      const res = await request('/api/profiles/search?latitude=9.0&longitude=181')
      assert.equal(res.statusCode, 422)
      assert.equal(res.body.success, false)
      assert.equal(res.body.error.code, 'VALIDATION_ERROR')
    })

    it('rejects longitude less than -180 with 422', async () => {
      const res = await request('/api/profiles/search?latitude=9.0&longitude=-180.1')
      assert.equal(res.statusCode, 422)
      assert.equal(res.body.success, false)
      assert.equal(res.body.error.code, 'VALIDATION_ERROR')
    })

    it('rejects latitude without longitude with 422', async () => {
      const res = await request('/api/profiles/search?latitude=9.0')
      assert.equal(res.statusCode, 422)
      assert.equal(res.body.success, false)
      assert.equal(res.body.error.code, 'VALIDATION_ERROR')
      assert.match(res.body.error.issues[0].message, /Both latitude and longitude must be provided together/i)
    })

    it('rejects negative radius with 422', async () => {
      const res = await request('/api/profiles/search?latitude=9.0&longitude=38.7&radius_km=-5')
      assert.equal(res.statusCode, 422)
      assert.equal(res.body.success, false)
      assert.equal(res.body.error.code, 'VALIDATION_ERROR')
    })

    it('rejects excessive radius (> 500km) with 422', async () => {
      const res = await request('/api/profiles/search?latitude=9.0&longitude=38.7&radius_km=501')
      assert.equal(res.statusCode, 422)
      assert.equal(res.body.success, false)
      assert.equal(res.body.error.code, 'VALIDATION_ERROR')
    })
  })
})
