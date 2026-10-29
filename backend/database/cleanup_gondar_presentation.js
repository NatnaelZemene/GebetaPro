/** Delete only the temporary Gondar presentation profiles and their login users. */
import 'dotenv/config'
import pg from 'pg'

const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
const gondarPresentationSlugs = [
  'nor-gondar-guesthouse', 'haile-resort-gondar', 'zobel-resort-hotel', 'gondar-hills-resort',
  'haz-hotel-gondar', 'gondar-plaza-hotel', 'goha-hotel-gondar', 'florida-international-hotel-gondar',
  'simien-ethio-tours', 'simien-eco-tours', 'north-expeditions-ethiopia', 'simien-tour-ethiopia',
  'mass-ethiopia-tours', 'simien-trekking-tours', 'tesema-simien-ethio-guide',
]

try {
  const result = await pool.query(
    `DELETE FROM users u
     USING profiles p
     WHERE p.user_id = u.id
       AND p.slug = ANY($1::text[])
       AND u.email LIKE 'presentation.gondar.%@example.test'
     RETURNING u.id`,
    [gondarPresentationSlugs],
  )
  console.log(`[gondar-presentation-cleanup] Removed ${result.rowCount} temporary accounts and their cascading profiles.`)
} catch (error) {
  console.error('[gondar-presentation-cleanup] Failed:', error.message)
  process.exitCode = 1
} finally {
  await pool.end()
}
