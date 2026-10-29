/**
 * Seeds fictional, fully searchable demo provider accounts and their public
 * profile content. Safe to rerun: only rows belonging to the demo emails/slugs
 * below are refreshed. Images are uploaded to the configured public bucket.
 *
 * Demo login for every account: demo.<slug>@example.test / GebetaDemo2026!
 */
import 'dotenv/config'
import pg from 'pg'
import bcrypt from 'bcryptjs'

const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
const passwordHash = await bcrypt.hash('GebetaDemo2026!', 12)
const unsplash = (id, width = 400, height = 400) =>
  `https://images.unsplash.com/photo-${id}?w=${width}&h=${height}&fit=crop&auto=format&q=80`

const demoProfiles = [
  { slug:'abebe-plumbing', name:'Abebe Plumbing & Water Care', person:'Abebe Bekele', category:'plumbing', type:'PROFESSIONAL', city:'Addis Ababa', area:'Bole', headline:'Fast, dependable plumbing for homes and small businesses', avatarUrl:unsplash('1558618666-fcd25c85cd64'), coverUrl:unsplash('1504328345936-525aa2d8b9d6',1200,400), services:['pipe-repair','drain-cleaning','water-heater-install'], offerings:[['Leak detection & repair','Find and fix hidden leaks, replace worn fittings, and test water pressure.',650],['Water heater installation','Supply guidance and professional installation for dependable hot water.',2800]], tags:['plumbing','emergency repair','water systems'], post:'Now booking plumbing visits across Bole, Kazanchis, and nearby neighborhoods.' },
  { slug:'selam-habesha-kitchen', name:'Selam Habesha Kitchen', person:'Selam Tadesse', category:'restaurants', type:'BUSINESS', city:'Addis Ababa', area:'Piassa', headline:'Traditional Ethiopian meals, made fresh every day', avatarUrl:unsplash('1567620905732-2d1ec7ab7445'), coverUrl:unsplash('1504674900247-0877df9cc836',1200,400), services:['event-catering'], offerings:[['Traditional lunch platter','A generous seasonal platter with vegetarian and meat options.',480],['Small event catering','Freshly prepared Ethiopian dishes for family and office gatherings.',850]], tags:['Ethiopian food','injera','catering'], post:'Our demo menu highlights seasonal favorites and classic shared platters.' },
  { slug:'dawit-specialty-coffee', name:'Dawit Specialty Coffee', person:'Dawit Alemu', category:'cafes', type:'BUSINESS', city:'Addis Ababa', area:'Kazanchis', headline:'Carefully sourced coffee and a welcoming neighborhood café', avatarUrl:unsplash('1495474472287-4d71bcdd2085'), coverUrl:unsplash('1442512595331-8f998af22731',1200,400), services:[], offerings:[['Single-origin coffee','Freshly roasted Ethiopian beans with tasting notes and brewing advice.',420],['Coffee tasting session','A guided tasting for small groups and curious coffee lovers.',1200]], tags:['coffee','Ethiopian beans','cafe'], post:'Explore a sample selection of Ethiopian coffee origins and brewing styles.' },
  { slug:'belay-law-office', name:'Belay Legal Advisory', person:'Belay Hailu', category:'legal', type:'PROFESSIONAL', city:'Addis Ababa', area:'Mexico', headline:'Clear, practical legal guidance for everyday business needs', avatarUrl:unsplash('1589829545856-d10d557cf95f'), coverUrl:unsplash('1436450412741-6b79e17512d4',1200,400), services:[], offerings:[['Business document review','A structured review of common business agreements and documents.',1800],['Legal consultation','A focused introductory consultation for general legal questions.',1500]], tags:['legal services','business advisory','consultation'], post:'This fictional profile demonstrates how independent professionals can present services.' },
  { slug:'almaz-general-clinic', name:'Almaz Community Health Clinic', person:'Almaz Girma', category:'medical', type:'BUSINESS', city:'Addis Ababa', area:'Megenagna', headline:'Friendly primary care and appointment-based consultations', avatarUrl:unsplash('1576091160550-2173dba999ef'), coverUrl:unsplash('1519494026892-476f6045a2f1',1200,400), services:[], offerings:[['General consultation','Appointment-based primary care consultation for adults and families.',900],['Wellness check','A preventive check-in with general health guidance.',1100]], tags:['healthcare','clinic','appointments'], post:'Demo listing: appointment details and service information are examples only.' },
  { slug:'seble-beauty-salon', name:'Seble Beauty Studio', person:'Seble Worku', category:'hair-salons', type:'BUSINESS', city:'Addis Ababa', area:'Bole Atlas', headline:'Thoughtful cuts, styling, and natural hair care', avatarUrl:unsplash('1522337360788-8b13dee7a37e'), coverUrl:unsplash('1560066984-138dadb4c035',1200,400), services:['haircut','hair-coloring'], offerings:[['Cut and styling','Consultation-led haircut and styling for a polished everyday look.',700],['Color consultation','Color planning and care guidance tailored to your hair.',900]], tags:['hair salon','styling','beauty'], post:'See a sample service menu for a modern neighborhood beauty studio.' },
  { slug:'fasil-academic-tutoring', name:'Fasil Learning Studio', person:'Fasil Tesfaye', category:'education', type:'PROFESSIONAL', city:'Addis Ababa', area:'CMC', headline:'Patient, structured tutoring for school learners', avatarUrl:unsplash('1503676260728-1c00da094a0b'), coverUrl:unsplash('1488521787991-ed7bbaae773c',1200,400), services:[], offerings:[['Mathematics tutoring','One-to-one lessons with practice plans matched to the learner.',650],['Study skills session','Practical support with planning, revision, and exam preparation.',500]], tags:['tutoring','education','mathematics'], post:'Sample learning plans can be adapted by grade and subject.' },
  { slug:'natnael-tech-repair', name:'Natnael Device Care', person:'Natnael Kebede', category:'computer-repair', type:'BUSINESS', city:'Addis Ababa', area:'Piazza', headline:'Careful phone and computer diagnostics with clear estimates', avatarUrl:unsplash('1512941937669-90a1b58e7e9c'), coverUrl:unsplash('1518770660439-4636190af475',1200,400), services:['screen-replacement','battery-replacement'], offerings:[['Laptop diagnostics','Troubleshooting, maintenance, and a clear repair estimate.',500],['Phone screen replacement','Screen assessment and replacement options for common devices.',1600]], tags:['phone repair','computer repair','electronics'], post:'Bring your device in for an initial demo diagnostic and estimate.' },
  { slug:'shewaye-fashion-boutique', name:'Shewaye Fashion House', person:'Shewaye Mekonnen', category:'retail', type:'SHOP', city:'Addis Ababa', area:'Bole', headline:'Contemporary Ethiopian style and carefully selected accessories', avatarUrl:unsplash('1567401893414-76b7b1e5a7a5'), coverUrl:unsplash('1441986380878-c4248f5b8b5b',1200,400), services:[], offerings:[['Made-to-measure consultation','Discuss fabric, fit, and tailoring options for a custom look.',1000],['Accessory styling','A short styling appointment featuring locally inspired accessories.',450]], tags:['fashion','boutique','Ethiopian design'], post:'Browse a sample boutique profile featuring local fashion and styling.' },
  { slug:'alem-photography-studio', name:'Alem Photography Studio', person:'Alemu Desta', category:'photography', type:'PROFESSIONAL', city:'Addis Ababa', area:'Old Airport', headline:'Warm portraits and event photography with a natural style', avatarUrl:unsplash('1516035069371-29a1b244cc32'), coverUrl:unsplash('1452802447250-470a88ac82bc',1200,400), services:['portrait-photography','event-photography'], offerings:[['Portrait session','A relaxed portrait session with edited digital photographs.',3500],['Event photography','Coverage planning for celebrations and community events.',6500]], tags:['photography','portraits','events'], post:'Sample portfolio listing for portraits, celebrations, and local events.' },
  { slug:'solomon-construction', name:'Solomon Build & Finish', person:'Solomon Fikru', category:'building-construction', type:'BUSINESS', city:'Addis Ababa', area:'Sar Bet', headline:'Small construction, renovation, and finishing projects', avatarUrl:unsplash('1504307651254-35680f356dfd'), coverUrl:unsplash('1503387762-592deb58ef4e',1200,400), services:[], offerings:[['Home renovation assessment','On-site review and a written outline for a small renovation.',1800],['Tile and floor installation','Installation planning and finishing for residential interiors.',2500]], tags:['construction','renovation','finishing'], post:'Demo project showcase: interior finishing and renovation services.' },
  { slug:'yonas-garden-landscape', name:'Yonas Garden & Landscape', person:'Yonas Mulu', category:'gardening', type:'BUSINESS', city:'Addis Ababa', area:'Summit', headline:'Practical garden care and greener outdoor spaces', avatarUrl:unsplash('1416879595882-3373a0480b5b'), coverUrl:unsplash('1558904541-efa843a96f01',1200,400), services:[], offerings:[['Garden care visit','Seasonal trimming, cleanup, and practical plant care.',850],['Landscape consultation','Plan a functional, attractive outdoor space for your property.',1400]], tags:['gardening','landscaping','plant care'], post:'Explore example garden care and landscape planning services.' },
]

async function seed() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const profileIds = new Map()
    for (const p of demoProfiles) {
      const email = `demo.${p.slug}@example.test`
      const user = await client.query(
        `INSERT INTO users (email,password_hash,role,status,email_verified_at)
         VALUES ($1,$2,'USER','ACTIVE',now())
         ON CONFLICT (email) DO UPDATE SET password_hash=EXCLUDED.password_hash,role='USER',status='ACTIVE',email_verified_at=now(),updated_at=now()
         RETURNING id`, [email,passwordHash])
      const category = await client.query('SELECT id FROM categories WHERE slug=$1', [p.category])
      if (!category.rowCount) throw new Error(`Missing seeded category: ${p.category}`)
      const profile = await client.query(
        `INSERT INTO profiles (user_id,display_name,slug,description,category_id,contact_email,website_url,is_published,is_verified,profile_type,headline,avatar_url,avatar_storage_key,cover_url,cover_storage_key,country,region,city,area,location_precision,verification_status,completion_score,business_name,business_type,business_city,business_region,business_country,additional_information,published_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,true,false,$8,$9,$10,NULL,$11,NULL,'Ethiopia','Addis Ababa',$12,$13,'DISTRICT','ACTIVE',95,$14,$15,$12,'Addis Ababa','Ethiopia',$16,now())
         ON CONFLICT (slug) DO UPDATE SET user_id=EXCLUDED.user_id,display_name=EXCLUDED.display_name,description=EXCLUDED.description,category_id=EXCLUDED.category_id,contact_email=EXCLUDED.contact_email,website_url=EXCLUDED.website_url,is_published=true,is_verified=false,profile_type=EXCLUDED.profile_type,headline=EXCLUDED.headline,avatar_url=EXCLUDED.avatar_url,avatar_storage_key=NULL,cover_url=EXCLUDED.cover_url,cover_storage_key=NULL,country=EXCLUDED.country,region=EXCLUDED.region,city=EXCLUDED.city,area=EXCLUDED.area,location_precision='DISTRICT',verification_status='ACTIVE',completion_score=95,business_name=EXCLUDED.business_name,business_type=EXCLUDED.business_type,business_city=EXCLUDED.business_city,business_region=EXCLUDED.business_region,business_country='Ethiopia',additional_information=EXCLUDED.additional_information,published_at=COALESCE(profiles.published_at,now()),updated_at=now()
         RETURNING id`, [user.rows[0].id,p.name,p.slug,`${p.name} is a fictional demonstration profile for the GebetaPro local discovery directory. ${p.headline}. All contact details, service listings, updates, and portfolio details are sample content.`,category.rows[0].id,email,`https://example.test/${p.slug}`,p.type,p.headline,p.avatarUrl,p.coverUrl,p.city,p.area,p.name,p.category,`Fictional demo account operated by ${p.person}. Uses professional stock photography from Unsplash. Not a real provider. Contact email uses the reserved example.test domain.`])
      profileIds.set(p.slug, profile.rows[0].id)
    }
    const ids = [...profileIds.values()]
    for (const table of ['business_hours','social_links','profile_images','profile_services','profile_services_offered','profile_products','portfolio_items','profile_achievements','profile_posts']) await client.query(`DELETE FROM ${table} WHERE profile_id = ANY($1::uuid[])`, [ids])
    for (const p of demoProfiles) {
      const profileId = profileIds.get(p.slug)
      await client.query(`INSERT INTO profile_images(profile_id,image_url,storage_key,alt_text,sort_order,is_primary) VALUES($1,$2,NULL,$3,0,true),($1,$4,NULL,$5,1,false)`, [profileId,p.avatarUrl,`${p.name} — professional stock photo from Unsplash`,p.coverUrl,`${p.name} — cover photo from Unsplash`])
      for (const [platform,url] of [['INSTAGRAM',`https://example.test/${p.slug}/instagram`],['FACEBOOK',`https://example.test/${p.slug}/facebook`],['WHATSAPP',`https://example.test/${p.slug}/contact`]]) await client.query('INSERT INTO social_links(profile_id,platform,url) VALUES($1,$2,$3)',[profileId,platform,url])
      for (let day=0;day<7;day++) await client.query('INSERT INTO business_hours(profile_id,day_of_week,opens_at,closes_at,is_closed) VALUES($1,$2,$3,$4,$5)',[profileId,day,day===0?null:'09:00',day===0?null:(day===6?'16:00':'18:00'),day===0])
      for (const slug of p.services) {
        const svc = await client.query('SELECT id FROM services WHERE slug=$1',[slug])
        if (svc.rowCount) await client.query('INSERT INTO profile_services(profile_id,service_id) VALUES($1,$2) ON CONFLICT DO NOTHING',[profileId,svc.rows[0].id])
      }
      for (let i=0;i<p.offerings.length;i++) {
        const [title,description,price] = p.offerings[i]
        await client.query(`INSERT INTO profile_services_offered(profile_id,title,description,category_id,price_from,currency,pricing_type,location,availability,tags,is_featured,is_published,sort_order) VALUES($1,$2,$3,(SELECT id FROM categories WHERE slug=$4),$5,'ETB','STARTING_FROM',$6,'AVAILABLE',$7,$8,true,$9)`,[profileId,title,description,p.category,price,`${p.area}, ${p.city}`,p.tags,i===0,i])
      }
      await client.query(`INSERT INTO portfolio_items(profile_id,title,description,category,client,completion_date,tags,is_featured,is_published,sort_order) VALUES($1,$2,$3,$4,'Demo sample',CURRENT_DATE - 30,$5,true,true,0)`,[profileId,`Demo sample — ${p.headline}`,`Fictional portfolio entry for demonstration only. ${p.headline}. No real client or project is represented.`,p.category,p.tags])
      await client.query(`INSERT INTO profile_achievements(profile_id,title,description,date,organization,is_published,sort_order) VALUES($1,'Demo sample profile completeness','Fictional demonstration content. This is not a real award, credential, or certification.',CURRENT_DATE - 60,'GebetaPro Demo Dataset',true,0)`,[profileId])
      await client.query(`INSERT INTO profile_posts(profile_id,title,content,post_type,visibility,is_published,is_pinned,published_at) VALUES($1,'Demo update',$2,'UPDATE','PUBLIC',true,false,now())`,[profileId,`DEMO CONTENT — ${p.post} This fictional sample is provided to preview the directory.`])
    }
    await client.query('COMMIT')
    console.log(`[demo-seed] Published ${demoProfiles.length} fictional demo accounts with professional Unsplash profile and cover photos.`)
    console.log('[demo-seed] Shared demo password: GebetaDemo2026! (emails: demo.<slug>@example.test)')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally { client.release() }
}

try { await seed() } catch (error) { console.error('[demo-seed] Failed:', error.message); process.exitCode=1 } finally { await pool.end() }
