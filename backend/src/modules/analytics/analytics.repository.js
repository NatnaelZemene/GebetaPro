/**
 * analytics.repository.js — SQL queries for analytics data.
 */
import pool from '../../db/index.js'

/**
 * Record a profile analytics event (e.g. view, contact click) and atomically
 * increment the corresponding counter on the profiles table.
 *
 * @param {string} profileId
 * @param {string} eventType
 * @param {object} [metadata]
 * @param {string|null} [visitorIp]
 * @param {string|null} [userAgent]
 * @returns {Promise<object|null>}
 */
export async function recordAnalyticsEvent(profileId, eventType, metadata = {}, visitorIp = null, userAgent = null) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // 1. Verify profile existence
    const profileCheck = await client.query(
      'SELECT id FROM profiles WHERE id = $1 LIMIT 1',
      [profileId]
    )
    if (!profileCheck.rows[0]) {
      await client.query('ROLLBACK')
      return null
    }

    // 2. Insert analytics event
    const insertRes = await client.query(
      `INSERT INTO profile_analytics_events 
       (profile_id, event_type, metadata, visitor_ip, user_agent)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, profile_id, event_type, created_at`,
      [profileId, eventType, JSON.stringify(metadata || {}), visitorIp, userAgent]
    )

    // 3. Increment counter atomically on profiles table
    const counterColumn = eventType === 'VIEW' ? 'views_count' : 'contact_clicks_count'
    await client.query(
      `UPDATE profiles 
       SET ${counterColumn} = ${counterColumn} + 1,
           updated_at = now()
       WHERE id = $1`,
      [profileId]
    )

    await client.query('COMMIT')

    const row = insertRes.rows[0]
    return {
      success: true,
      event_id: row.id,
      profile_id: row.profile_id,
      event_type: row.event_type,
      created_at: row.created_at,
    }
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}
