/**
 * Adds a temporary, publicly sourced Gondar directory dataset for presentations.
 * These are unclaimed listings: public source details are credited in profile
 * notes and image alt text; no verification badge, reviews, ratings, or prices
 * are fabricated. Re-run is safe. Remove only this dataset with
 * `npm run db:cleanup:gondar-presentation`.
 */
import 'dotenv/config'
import pg from 'pg'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'node:crypto'

const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
const RESERVED_EMAIL = (slug) => `presentation.gondar.${slug}@example.test`

const entries = [
  {
    slug: 'nor-gondar-guesthouse', name: 'Nor Gondar Guesthouse', category: 'hotels', kind: 'BUSINESS',
    headline: 'A furnished, family-friendly guesthouse in Gondar',
    description: 'Nor Gondar Guesthouse describes its property as a quiet, furnished and family-friendly stay on the outskirts of Gondar. Public contact details and location are listed by the business.',
    offerings: [['Guesthouse accommodation', 'Furnished guesthouse accommodation described by the business. Contact Nor Gondar for current room options and availability.']],
    phone: '+251 91 822 6248', email: 'info@norgondar.com', website: 'https://norgondar.com/',
    source: 'https://norgondar.com/contact/', source2: 'https://gondarcity.org/hotels/',
    photos: [
      ['https://gondarcity.org/wp-content/uploads/2023/01/nor-gondar-guest-house-gondar-1170x878.jpg', 'Nor Gondar Guesthouse room photo; source: Gondar City hotel directory'],
      ['https://gondarcity.org/wp-content/uploads/2023/01/nor-gondar-guest-house-gondar-bedroom-1170x878.jpg', 'Nor Gondar Guesthouse bedroom photo; source: Gondar City hotel directory'],
    ], socials: [],
  },
  {
    slug: 'haile-resort-gondar', name: 'Haile Resort Gondar', category: 'hotels', kind: 'BUSINESS',
    headline: 'Resort stay in Gondar',
    description: 'Haile Resort Gondar is listed in the Gondar City hotel directory. The directory publishes the Gondar reservation contacts; the resort group website describes accommodation, dining, spa, pool, fitness and event facilities across its properties.',
    offerings: [['Resort accommodation', 'Contact the Gondar reservation desk for current room options and availability.'], ['Dining and resort facilities', 'The Haile Resorts group lists restaurant, spa, pool, fitness and event facilities; contact the Gondar property to confirm current offerings.']],
    phone: '+251 907 01 01 01', email: 'reservationgondar@haileresorts.com', website: 'https://hailehotelsandresorts.com/',
    source: 'https://gondarcity.org/hotels/', source2: 'https://hailehotelsandresorts.com/',
    photos: [
      ['https://gondarcity.org/wp-content/uploads/2022/12/haile-resort-gondar-pool-norgondar.jpg', 'Haile Resort Gondar pool; source: Gondar City hotel directory'],
      ['https://gondarcity.org/wp-content/uploads/2022/12/haile-resort-gondar-room-1-norgondar.jpg', 'Haile Resort Gondar room; source: Gondar City hotel directory'],
    ], socials: [],
  },
  {
    slug: 'zobel-resort-hotel', name: 'Zobel Resort Hotel', category: 'hotels', kind: 'BUSINESS',
    headline: 'Hilltop resort with views across Gondar',
    description: 'Zobel Resort Hotel describes its location as a hillside setting in Gondar with city views. Phone, email and booking website are published by the Gondar City hotel directory.',
    offerings: [['Hotel accommodation', 'Accommodation in the hillside resort setting described by the business. Contact the hotel for current room options and availability.']],
    phone: '+251 920 636363', email: 'reception@zobelresort.com', website: 'https://zobelresort.com/',
    source: 'https://gondarcity.org/hotels/', source2: 'https://zobelresort.com/',
    photos: [
      ['https://gondarcity.org/wp-content/uploads/2021/12/Zobel-Resort-Hotel-Gonder-2.jpg', 'Zobel Resort Hotel in Gondar; source: Gondar City hotel directory'],
      ['https://gondarcity.org/wp-content/uploads/2021/12/Zobel-Resort-Hotel-ethiopian-homecoming.jpg', 'Zobel Resort Hotel view; source: Gondar City hotel directory'],
    ], socials: [],
  },
  {
    slug: 'gondar-hills-resort', name: 'Gondar Hills Resort', category: 'hotels', kind: 'BUSINESS',
    headline: 'Resort accommodation in Gondar',
    description: 'Gondar Hills Resort is listed as a Gondar hotel by the Gondar City directory. Its official website publishes the resort contact information and accommodation details.',
    offerings: [['Resort accommodation', 'Contact Gondar Hills Resort for room options and availability.']],
    phone: '+251 993 950 400', email: 'reservations@gondarhills.com', website: 'https://gondarhillsresort.com/',
    source: 'https://gondarcity.org/hotels/', source2: 'https://gondarhillsresort.com/',
    photos: [
      ['https://gondarcity.org/wp-content/uploads/2022/12/Gondar-Hills-Resort-ethiopia.jpg', 'Gondar Hills Resort exterior; source: Gondar City hotel directory'],
      ['https://cdn.adventure-life.com/33/03/97/Gondar_Hills_Resort_Exterior_Angle/663x400.webp', 'Gondar Hills Resort exterior; source: Adventure Life hotel page'],
    ], socials: [],
  },
  {
    slug: 'haz-hotel-gondar', name: 'HaZ Hotel', category: 'hotels', kind: 'BUSINESS',
    headline: 'Hotel in Atatami-Michael, Gondar',
    description: 'HaZ Hotel publishes its address in Atatami-Michael Sub-City, Kebele 3, Gondar, along with its phone number and email. The hotel website includes a property photo gallery.',
    offerings: [['Hotel accommodation', 'Contact HaZ Hotel for current room options and availability.']],
    phone: '+251 581 260002', email: 'info@hazhotel.com', website: 'https://www.hazhotel.com/',
    source: 'https://www.hazhotel.com/', source2: 'https://www.hazhotel.com/',
    photos: [
      ['https://static.wixstatic.com/media/4ef64f_206803e56f6e4373a85c567048f7e4c1~mv2.jpg/v1/fill/w_1200%2Ch_800%2Cal_c%2Cq_90%2Cenc_auto/4ef64f_206803e56f6e4373a85c567048f7e4c1~mv2.jpg', 'HaZ Hotel property gallery photo; source: official HaZ Hotel website'],
      ['https://static.wixstatic.com/media/4ef64f_2bb825007e42429ea347efcb3e4ccb9a~mv2.jpg/v1/fill/w_1200%2Ch_800%2Cal_c%2Cq_90%2Cenc_auto/4ef64f_2bb825007e42429ea347efcb3e4ccb9a~mv2.jpg', 'HaZ Hotel property gallery photo; source: official HaZ Hotel website'],
    ], socials: [],
  },
  {
    slug: 'gondar-plaza-hotel', name: 'Gondar Plaza Hotel', category: 'hotels', kind: 'BUSINESS',
    headline: 'Hotel, restaurant, coffee shop and terrace in Kebelle 18',
    description: 'Gondar Plaza Hotel lists its address in Kebelle 18 and describes 25 rooms, a restaurant, coffee shop, bar and terrace. Contact details are published on the hotel website.',
    offerings: [['Hotel accommodation', 'The hotel lists 25 rooms; rates and availability are confirmed by enquiry.'], ['Restaurant and coffee shop', 'The hotel lists Ethiopian and international dining, coffee, pastries and a terrace bar. Contact the hotel for current service details.']],
    phone: '+251 58 211 2121', email: 'info@gondarplaza.com', website: 'https://www.gondarplaza.com/',
    source: 'https://www.gondarplaza.com/', source2: 'https://www.gondarplaza.com/',
    photos: [
      ['https://www.gondarplaza.com/photos/exterior.jpg', 'Gondar Plaza Hotel exterior; source: official hotel website'],
      ['https://www.gondarplaza.com/photos/terrace.jpg', 'Gondar Plaza Hotel terrace; source: official hotel website'],
    ], socials: [['WHATSAPP', 'https://wa.me/251582112121']],
  },
  {
    slug: 'goha-hotel-gondar', name: 'Goha Hotel', category: 'hotels', kind: 'BUSINESS',
    headline: 'Hilltop hotel overlooking Gondar',
    description: 'The Gondar City Culture and Tourism Department describes Goha Hotel as a hilltop property overlooking Gondar. Its public directory entry lists hotel services and contact numbers.',
    offerings: [['Hotel accommodation', 'Hotel accommodation at a hilltop property overlooking Gondar, as listed by the city tourism department. Contact the hotel for current availability.'], ['Restaurant and meeting facilities', 'The city tourism listing describes restaurant, bar and meeting facilities. Contact the hotel to confirm current details.']],
    phone: '+251 58 111 8624', email: 'gohahotel@yahoo.com', website: 'https://gohahotel.com/',
    source: 'https://gcctso.gov.et/', source2: 'https://ecdd-ethiopia.org/wp-content/uploads/Gondar.compressed.pdf',
    photos: [
      ['https://www.africa-royal-tours.de/media/Aethiopien/Hotels/Goha_Hotel/AEthiopien-Reisen-Goha-Hotel-Gondar-2.jpg', 'Goha Hotel pool; source: Africa Royal Tours hotel page'],
      ['https://dynamic-media-cdn.tripadvisor.com/media/photo-o/2e/65/f1/16/caption.jpg?h=-1&s=1&w=1200', 'Goha Hotel exterior; source: Tripadvisor hotel page'],
    ], socials: [],
  },
  {
    slug: 'florida-international-hotel-gondar', name: 'Florida International Hotel', category: 'hotels', kind: 'BUSINESS',
    headline: 'Hotel accommodation in Gondar',
    description: 'Florida International Hotel is listed by the Gondar City Culture and Tourism Department as a local hotel with guest rooms, dining and leisure facilities. A public hotel listing gives the Gondar phone contact.',
    offerings: [['Hotel accommodation', 'The city tourism listing describes guest rooms. Contact the hotel for current room options and availability.'], ['Dining and leisure facilities', 'The city tourism listing describes restaurant, café, pool, sauna and conference facilities. Contact the hotel to confirm what is currently available.']],
    phone: '+251 91 835 0860', email: null, website: null,
    source: 'https://gcctso.gov.et/', source2: 'https://gondarcity.org/hotels/',
    photos: [
      ['https://dynamic-media-cdn.tripadvisor.com/media/photo-o/04/6b/4b/a9/twin-beds.jpg?h=-1&s=1&w=1200', 'Florida International Hotel room; source: Tripadvisor hotel page'],
      ['https://images.trvl-media.com/lodging/6000000/5950000/5947500/5947447/20156c30.jpg?impolicy=resizecrop&ra=fill&rh=575&rw=575', 'Florida International Hotel property photo; source: Expedia hotel listing'],
    ], socials: [],
  },
  {
    slug: 'simien-ethio-tours', name: 'Simien Ethio Tours', category: 'tour-operators', kind: 'BUSINESS',
    headline: 'Locally owned tour operator based in Gondar',
    description: 'Simien Ethio Tours describes itself as a locally owned tour company based in Gondar, offering guided trips across Ethiopia, including the historic north and Simien Mountains. Its official site publishes contact details and social profiles.',
    offerings: [['Gondar and northern Ethiopia tours', 'Guided journeys to Gondar and historic sites in northern Ethiopia, as described by the tour operator. Contact for itinerary and pricing.'], ['Simien Mountains trips', 'The company offers trips around the Simien Mountains; contact the operator for dates, route details and pricing.']],
    phone: '+251 956 61 6969', email: 'info@simienethiotours.com', website: 'https://simienethiotours.com/',
    source: 'https://simienethiotours.com/about-us/', source2: 'https://simienethiotours.com/contact-us/',
    photos: [
      ['https://simienethiotours.com/wp-content/uploads/slider25/simien-ethio-tours-simien-mountain-holiday-vacations-home-page-4.webp', 'Simien Mountains tour photo; source: official Simien Ethio Tours website'],
      ['https://simienethiotours.com/wp-content/uploads/Simien-Ethio-Tours-Camping-in-Simien-Mountains-National-Park.webp', 'Simien Mountains camp; source: official Simien Ethio Tours website'],
    ], socials: [['FACEBOOK', 'https://www.facebook.com/tesema.travels.Ethiopia/'], ['INSTAGRAM', 'https://www.instagram.com/tesemaethiopiatour/']],
  },
  {
    slug: 'simien-eco-tours', name: 'SimienEcoTours PLC', category: 'tour-operators', kind: 'BUSINESS',
    headline: 'Tour operator with an office in Gondar',
    description: 'SimienEcoTours publishes a Gondar office address in Kebele 02, Ketena 02 and contact numbers for its Gondar office. The company profile describes its registered tour operation and North Gondar base.',
    offerings: [['Guided Ethiopia tours', 'Tour operation and guided travel services as described in the company profile. Contact the Gondar office for itineraries and pricing.'], ['Simien Mountains trekking', 'Trekking trips in the Simien Mountains; contact the operator for route, date and availability details.']],
    phone: '+251 58 2110044', email: 'info@simienecotours.com', website: 'https://www.simienecotours.com/',
    source: 'https://www.simienecotours.com/contact/contact-us/', source2: 'https://b-cdn.springnest.com/media/doc/z8/simienecotours_company_profile.pdf',
    photos: [
      ['https://b-cdn.springnest.com/media/img/z8/home_header1_certad7d177.jpg?crop=1800%2C900%2C0%2C100&width=1500&quality=78', 'Ethiopia tour landscape; source: official SimienEcoTours website'],
      ['https://b-cdn.springnest.com/media/img/z8/tours_trekking_tours_pice2d3a19.jpg', 'SimienEcoTours trekking photo; source: official SimienEcoTours website'],
    ], socials: [['FACEBOOK', 'https://www.facebook.com/SimienEcoTours/'], ['LINKEDIN', 'https://www.linkedin.com/company/42753875/'], ['YOUTUBE', 'https://www.youtube.com/channel/UC0EnDqQM2y8ioLambciyi5Q/']],
  },
  {
    slug: 'north-expeditions-ethiopia', name: 'North Expeditions Ethiopia', category: 'tour-operators', kind: 'BUSINESS',
    headline: 'Northern Ethiopia tours and Simien Mountains treks',
    description: 'North Expeditions Ethiopia states that it is based in Gondar and offers northern Ethiopia tours, Simien Mountains treks and customized trips. Its website publishes Gondar postal, email and phone contacts.',
    offerings: [['Simien Mountains treks', 'The operator lists multiple trek routes, including Sankaber–Gich–Chennek and Ras Dashen. Contact for dates and pricing.'], ['Northern Ethiopia tours', 'Customized cultural and historical itineraries in northern Ethiopia, as described by the operator.']],
    phone: '+251 918 043 603', email: 'contact@northexpeditionsethiopia.com', website: 'https://www.northexpeditionsethiopia.com/',
    source: 'https://www.northexpeditionsethiopia.com/about/', source2: 'https://www.northexpeditionsethiopia.com/',
    photos: [
      ['https://northexpeditionsethiopia.com/image/base-layer-0.jpg', 'North Ethiopia expedition page image; source: official North Expeditions Ethiopia website'],
      ['https://northexpeditionsethiopia.com/image/base-layer-portrait-0.jpg', 'North Ethiopia expedition page portrait image; source: official North Expeditions Ethiopia website'],
    ], socials: [['FACEBOOK', 'https://www.facebook.com/NorthExpeditionsEthiopia']],
  },
  {
    slug: 'simien-tour-ethiopia', name: 'Simien Tour', category: 'tour-operators', kind: 'BUSINESS',
    headline: 'Ethiopian tour operator with Gondar contact listing',
    description: 'Simien Tour describes itself as an Ethiopian tour and travel company. Its website lists itineraries and contact details; a business directory lists a Gondar contact and location.',
    offerings: [['Ethiopia tour packages', 'The company publishes itineraries for Ethiopian destinations including Gondar and the Simien Mountains. Contact for current itinerary and pricing details.'], ['Private local guides', 'The company lists local private guides among its travel services. Contact for arrangements and availability.']],
    phone: '+251 912 658 734', email: 'info@simientour.com', website: 'https://simientour.com/',
    source: 'https://simientour.com/', source2: 'https://www.africabizinfo.com/ET/simien-tour-091-265-8734',
    photos: [
      ['https://simientour.com/wp-content/uploads/Homepage-Slider-Gonder-fasiledes-Simien-Tour.jpg', 'Fasil Ghebbi tour image; source: official Simien Tour website'],
      ['https://simientour.com/wp-content/uploads/Homepage-Slider-Simien-Mountain-Image-Simien-Tours.jpg', 'Simien Mountains tour image; source: official Simien Tour website'],
    ], socials: [],
  },
  {
    slug: 'mass-ethiopia-tours', name: 'Mass Ethiopia Tours', category: 'tour-operators', kind: 'BUSINESS',
    headline: 'Private and small-group tours based in Gondar and Addis Ababa',
    description: 'Mass Ethiopia Tours states that it is based in Gondar and Addis Ababa and offers private and small-group tours, including itineraries in Gondar and the Simien Mountains. Public contact information appears on its website.',
    offerings: [['Gondar historical tours', 'The operator publishes Gondar and Fasil Ghebbi itineraries. Contact for current itinerary, dates and pricing.'], ['Private and small-group tours', 'The operator describes private and small-group travel across Ethiopia, including northern routes.']],
    phone: '+251 918 770 308', email: 'info@massethiopiatours.com', website: 'https://massethiopiatours.com/',
    source: 'https://massethiopiatours.com/about-us/', source2: 'https://massethiopiatours.com/',
    photos: [
      ['https://massethiopiatours.com/wp-content/uploads/2024/12/145-5.jpg', 'Ethiopia travel photo; source: official Mass Ethiopia Tours website'],
      ['https://massethiopiatours.com/wp-content/uploads/2024/12/ffcdd726-d6eb-4e5f-a5f5-63919c92ae2e.jpg', 'Ethiopia travel photo; source: official Mass Ethiopia Tours website'],
    ], socials: [],
  },
  {
    slug: 'simien-trekking-tours', name: 'Simien Trekking Tours', category: 'tour-operators', kind: 'BUSINESS',
    city: 'North Gondar', area: 'North Gondar (Kebele 3)', locationPrecision: 'DISTRICT',
    headline: 'Simien trekking and tour guide service',
    description: 'Simien Trekking Tours publishes a North Gondar address and contact information for guide Gismu Syum Agdew. Its website describes trekking and tour services in Ethiopia.',
    offerings: [['Simien Mountains trekking', 'Trekking and hiking trips described by Simien Trekking Tours. Contact the guide for route, date and availability details.'], ['Ethiopia travel planning', 'The operator accepts tour enquiries for Ethiopia; contact for itinerary and pricing.']],
    phone: '+251 935 480 330', email: 'gismudebark@yahoo.com', website: 'https://www.simienstrek.com/',
    source: 'https://www.simienstrek.com/contact/', source2: 'https://www.simienstrek.com/',
    photos: [
      ['https://www.simienstrek.com/wp-content/uploads/2019/11/kontaktbild.jpg', 'Simien Trekking Tours contact page photo; source: official Simien Trekking Tours website'],
      ['https://www.simienstrek.com/wp-content/uploads/2019/11/unten.jpg', 'Tour guide Gismu photo; source: official Simien Trekking Tours website'],
    ], socials: [],
  },
  {
    slug: 'tesema-simien-ethio-guide', name: 'Tesema “Tevan” — Professional Tour Guide', category: 'tour-operators', kind: 'PROFESSIONAL',
    headline: 'Certified professional guide and founder of Simien Ethio Tours',
    description: 'Simien Ethio Tours identifies Tesema (Tevan) as its founder and lead guide. The official biography states that he holds a Ministry of Labor and Skills Level IV professional tour-guiding qualification assessed at Gondar PTC, valid through 20 October 2028. This is a publicly sourced professional listing, not a GebetaPro verification.',
    offerings: [['Professional tour guiding', 'Tour-guiding service by the founder and lead guide of Simien Ethio Tours. Contact the company for destinations and availability.']],
    phone: '+251 956 61 6969', email: 'info@simienethiotours.com', website: 'https://simienethiotours.com/about-us/',
    source: 'https://simienethiotours.com/about-us/', source2: 'https://simienethiotours.com/contact-us/',
    photos: [
      ['https://simienethiotours.com/wp-content/uploads/Simien-Ethio-Tours-Tesema-Ethiopia-Tours-Simein-North-Ethiopia-Tours-Holidays.jpg', 'Tesema, founder and lead guide; source: official Simien Ethio Tours website'],
      ['https://simienethiotours.com/wp-content/uploads/slider25/simien-ethio-tours-simien-mountain-holiday-vacations-home-page-4.webp', 'Simien Mountains tour photo; source: official Simien Ethio Tours website'],
    ], socials: [['FACEBOOK', 'https://www.facebook.com/tesema.travels.Ethiopia/'], ['INSTAGRAM', 'https://www.instagram.com/tesemaethiopiatour/']],
  },
]

async function seed() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    for (const entry of entries) {
      const email = RESERVED_EMAIL(entry.slug)
      const passwordHash = await bcrypt.hash(randomBytes(32).toString('hex'), 10)
      const user = await client.query(
        `INSERT INTO users (email,password_hash,role,status,email_verified_at)
         VALUES ($1,$2,'USER','ACTIVE',now())
         ON CONFLICT (email) DO UPDATE SET password_hash=EXCLUDED.password_hash, role='USER', status='ACTIVE', email_verified_at=now(), updated_at=now()
         RETURNING id`, [email, passwordHash],
      )
      const category = await client.query('SELECT id FROM categories WHERE slug=$1', [entry.category])
      if (!category.rowCount) throw new Error(`Missing category ${entry.category}; run npm run db:seed first.`)
      const profile = await client.query(
        `INSERT INTO profiles (user_id,display_name,slug,description,category_id,contact_phone,contact_email,website_url,
          is_published,is_verified,profile_type,headline,avatar_url,cover_url,country,region,city,area,location_precision,
          verification_status,completion_score,business_name,business_type,business_city,business_region,business_country,
          additional_information,published_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true,false,$9,$10,$11,$12,'Ethiopia','Amhara',$15,$16,$17,
          'ACTIVE',85,$2,$13,$15,'Amhara','Ethiopia',$14,now())
         ON CONFLICT (slug) DO UPDATE SET user_id=EXCLUDED.user_id,display_name=EXCLUDED.display_name,
          description=EXCLUDED.description,category_id=EXCLUDED.category_id,contact_phone=EXCLUDED.contact_phone,
          contact_email=EXCLUDED.contact_email,website_url=EXCLUDED.website_url,is_published=true,is_verified=false,
          profile_type=EXCLUDED.profile_type,headline=EXCLUDED.headline,avatar_url=EXCLUDED.avatar_url,
          cover_url=EXCLUDED.cover_url,country='Ethiopia',region='Amhara',city=EXCLUDED.city,area=EXCLUDED.area,
          location_precision=EXCLUDED.location_precision,verification_status='ACTIVE',completion_score=85,business_name=EXCLUDED.business_name,
          business_type=EXCLUDED.business_type,business_city=EXCLUDED.business_city,business_region='Amhara',business_country='Ethiopia',
          additional_information=EXCLUDED.additional_information,published_at=COALESCE(profiles.published_at,now()),updated_at=now()
         RETURNING id`,
        [user.rows[0].id, entry.name, entry.slug, entry.description, category.rows[0].id, entry.phone,
          entry.email, entry.website, entry.kind, entry.headline, entry.photos[0][0], entry.photos[0][0],
          entry.kind === 'PROFESSIONAL' ? 'PROFESSIONAL TOUR GUIDE' : entry.category === 'hotels' ? 'HOTEL / GUESTHOUSE' : 'TOUR OPERATOR',
          `UNCLAIMED PRESENTATION LISTING — public information compiled from ${entry.source}${entry.source2 ? ` and ${entry.source2}` : ''}. This business or professional has not claimed or verified this GebetaPro profile. Photos are linked from the credited source pages; image rights remain with their respective owners.`,
          entry.city || 'Gondar', entry.area || entry.city || 'Gondar', entry.locationPrecision || 'CITY'],
      )
      const profileId = profile.rows[0].id
      await client.query('DELETE FROM social_links WHERE profile_id=$1', [profileId])
      await client.query('DELETE FROM profile_images WHERE profile_id=$1', [profileId])
      await client.query('DELETE FROM profile_services_offered WHERE profile_id=$1', [profileId])
      const socialLinks = [...(entry.website ? [['WEBSITE', entry.website]] : []), ...entry.socials]
      for (const [platform, url] of socialLinks) {
        await client.query('INSERT INTO social_links(profile_id,platform,url) VALUES($1,$2,$3)', [profileId, platform, url])
      }
      for (let i = 0; i < entry.photos.length; i++) {
        const [url, alt] = entry.photos[i]
        await client.query(
          'INSERT INTO profile_images(profile_id,image_url,storage_key,alt_text,sort_order,is_primary) VALUES($1,$2,NULL,$3,$4,$5)',
          [profileId, url, alt, i, i === 0],
        )
      }
      for (let i = 0; i < entry.offerings.length; i++) {
        const [title, description] = entry.offerings[i]
        await client.query(
          `INSERT INTO profile_services_offered(profile_id,title,description,category_id,pricing_type,location,
            availability,is_featured,is_published,sort_order)
          VALUES($1,$2,$3,$4,'CONTACT_FOR_PRICE',$5,'AVAILABLE',$6,true,$7)`,
          [profileId, title, description, category.rows[0].id, `${entry.city || 'Gondar'}, Amhara, Ethiopia`, i === 0, i],
        )
      }
    }
    await client.query('COMMIT')
    console.log(`[gondar-presentation] Upserted ${entries.length} unclaimed Gondar profiles (${entries.filter((e) => e.kind === 'BUSINESS').length} businesses, ${entries.filter((e) => e.kind === 'PROFESSIONAL').length} professional).`)
    console.log('[gondar-presentation] Every listing has two source-credited image URLs; existing records were not modified.')
    console.log('[gondar-presentation] Cleanup: npm run db:cleanup:gondar-presentation')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

try { await seed() } catch (error) { console.error('[gondar-presentation] Failed:', error.message); process.exitCode = 1 } finally { await pool.end() }
