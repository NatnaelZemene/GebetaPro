import 'dotenv/config'
import pool from '../src/db/index.js'

async function linkSupabaseDataToNatnael() {
  const email = 'natnaelzemene21@gmail.com'
  const oldProfileId = '7d08e2e1-740d-4bf7-ab42-3839214f8ce9'

  const userRes = await pool.query('SELECT id FROM users WHERE email = $1', [email])
  if (!userRes.rows[0]) {
    console.error('User not found:', email)
    return
  }
  const userId = userRes.rows[0].id

  const profRes = await pool.query('SELECT id, slug FROM profiles WHERE user_id = $1', [userId])
  if (!profRes.rows[0]) {
    console.error('Profile not found for:', email)
    return
  }
  const currentProfile = profRes.rows[0]
  const newProfileId = currentProfile.id

  const baseUrl = 'https://geaavexnhsexwkohcczm.supabase.co/storage/v1/object/public/advertisement-images'
  const avatarKey = `profiles/${oldProfileId}/avatar/7b0e5dbf-8975-47a7-9779-207a85119e00.jpg`
  const coverKey = `profiles/${oldProfileId}/cover/12de59f5-185b-4b2c-a821-9e659f7014f2.jpg`

  const avatarUrl = `${baseUrl}/${avatarKey}`
  const coverUrl = `${baseUrl}/${coverKey}`

  // Update profile with avatar and cover from Supabase
  await pool.query(
    `UPDATE profiles 
     SET avatar_url = $1, cover_url = $2, updated_at = now() 
     WHERE id = $3`,
    [avatarUrl, coverUrl, newProfileId]
  )
  console.log('Updated profile avatar and cover.')

  // Fetch all gallery images for this profile from storage.objects
  const galleryObjs = await pool.query(
    `SELECT name FROM storage.objects 
     WHERE name LIKE $1 
     ORDER BY created_at ASC`,
    [`profiles/${oldProfileId}/gallery/%`]
  )

  console.log(`Found ${galleryObjs.rows.length} gallery images in Supabase storage:`)

  // Clear any existing and insert all from Supabase storage
  await pool.query('DELETE FROM profile_images WHERE profile_id = $1', [newProfileId])

  for (let i = 0; i < galleryObjs.rows.length; i++) {
    const storageKey = galleryObjs.rows[i].name
    const imageUrl = `${baseUrl}/${storageKey}`
    await pool.query(
      `INSERT INTO profile_images (
         profile_id, image_url, storage_key, alt_text, sort_order, is_primary
       ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        newProfileId,
        imageUrl,
        storageKey,
        `Gallery photo ${i + 1}`,
        i,
        i === 0
      ]
    )
    console.log(`  + Linked gallery image ${i + 1}: ${storageKey}`)
  }

  // Also check if alemu or other users had storage objects
  // e.g. f08ce960-0f80-409e-ae54-0aca3900349b
  const otherProfileId = 'f08ce960-0f80-409e-ae54-0aca3900349b'
  const alemuUser = await pool.query("SELECT id FROM users WHERE email = 'alemugetu2123@gmail.com'")
  if (alemuUser.rows[0]) {
    const alemuProf = await pool.query('SELECT id FROM profiles WHERE user_id = $1', [alemuUser.rows[0].id])
    if (alemuProf.rows[0]) {
      const alemuProfId = alemuProf.rows[0].id
      const alemuCoverKey = `profiles/${otherProfileId}/cover/2854dae0-f245-4e48-944d-2d9c05232e39.jpg`
      const alemuCoverUrl = `${baseUrl}/${alemuCoverKey}`
      await pool.query('UPDATE profiles SET cover_url = $1 WHERE id = $2', [alemuCoverUrl, alemuProfId])

      const otherGallery = await pool.query(
        `SELECT name FROM storage.objects WHERE name LIKE $1 ORDER BY created_at ASC`,
        [`profiles/${otherProfileId}/gallery/%`]
      )
      await pool.query('DELETE FROM profile_images WHERE profile_id = $1', [alemuProfId])
      for (let i = 0; i < otherGallery.rows.length; i++) {
        const key = otherGallery.rows[i].name
        await pool.query(
          `INSERT INTO profile_images (profile_id, image_url, storage_key, alt_text, sort_order, is_primary)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [alemuProfId, `${baseUrl}/${key}`, key, `Gallery photo ${i + 1}`, i, i === 0]
        )
      }
      console.log(`Linked ${otherGallery.rows.length} gallery images to Alemu profile.`)
    }
  }

  console.log('\n✅ Successfully restored all user data and media directly from Supabase Storage!')
  await pool.end()
}

linkSupabaseDataToNatnael().catch((err) => {
  console.error(err)
  process.exit(1)
})
