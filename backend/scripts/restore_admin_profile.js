import 'dotenv/config'
import pool from '../src/db/index.js'

async function restoreAdminProfile() {
  const admins = [
    {
      email: 'natnaelzemene21@gmail.com',
      name: 'Nathy',
      slug: 'nathy',
      headline: 'GebetaPro Platform Administrator & Developer',
      description: 'Official administrator profile for GebetaPro platform.',
    },
    {
      email: 'alemugetu2123@gmail.com',
      name: 'Alemu Getu',
      slug: 'alemu-getu',
      headline: 'GebetaPro Administrator & Engineer',
      description: 'Software engineer and system administrator on GebetaPro.',
    },
  ]

  for (const adm of admins) {
    const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [adm.email])
    if (!userRes.rows[0]) {
      console.log('User not found:', adm.email)
      continue
    }
    const user = userRes.rows[0]

    // Check if profile already exists
    const existingProfile = await pool.query('SELECT * FROM profiles WHERE user_id = $1', [user.id])
    if (existingProfile.rows[0]) {
      console.log('Profile already exists for:', adm.email, existingProfile.rows[0].slug)
      continue
    }

    const catRes = await pool.query("SELECT id FROM categories WHERE slug IN ('computer-repair', 'home-services') LIMIT 1")
    const categoryId = catRes.rows[0]?.id || null

    const insertSql = `
      INSERT INTO profiles (
        user_id, display_name, slug, headline, description, category_id,
        contact_email, is_published, is_verified, is_featured, profile_type,
        country, city, area, location_precision, verification_status,
        completion_score, phone_visibility, email_visibility, published_at,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, true, true, true, 'PROFESSIONAL',
        'Ethiopia', 'Addis Ababa', 'Bole', 'FULL', 'VERIFIED',
        100, 'PUBLIC', 'PUBLIC', now(), now(), now()
      )
      RETURNING id, display_name, slug
    `

    const newProfile = await pool.query(insertSql, [
      user.id,
      adm.name,
      adm.slug,
      adm.headline,
      adm.description,
      categoryId,
      adm.email,
    ])
    console.log('Successfully created profile for:', adm.email, newProfile.rows[0])
  }

  // Print verification status
  const check = await pool.query(
    `SELECT u.email, u.role, p.slug, p.display_name, p.is_published, p.is_verified, p.is_featured, us.status AS sub_status
     FROM users u
     JOIN profiles p ON p.user_id = u.id
     LEFT JOIN user_subscriptions us ON us.user_id = u.id
     WHERE u.email = 'natnaelzemene21@gmail.com'`
  )
  console.log('\nVerified user & profile in database:')
  console.log(check.rows[0])

  await pool.end()
}

restoreAdminProfile().catch((err) => {
  console.error('Error restoring profile:', err)
  process.exit(1)
})
