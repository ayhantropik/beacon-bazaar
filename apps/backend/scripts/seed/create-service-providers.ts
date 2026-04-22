/**
 * Seed script: Create sample professional service providers
 * Run with: npx ts-node src/create-service-providers.ts
 */
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

const SERVICE_PROVIDERS = [
  {
    name: 'Temiz Ev Profesyonel Temizlik',
    slug: 'temiz-ev-temizlik',
    description: 'Ev, ofis ve inşaat sonrası temizlik hizmetleri. 10 yıllık deneyim, sigortalı ekip.',
    categories: ['Temizlik'],
    tags: ['ev temizliği', 'ofis temizliği', 'inşaat sonrası'],
    ratingAverage: 4.7,
    ratingCount: 89,
    isVerified: true,
    isActive: true,
  },
  {
    name: 'Usta Eller Tadilat',
    slug: 'usta-eller-tadilat',
    description: 'Boya, badana, alçı, kartonpiyer, laminat parke ve her türlü tadilat işleri.',
    categories: ['Tadilat & Tamirat'],
    tags: ['boya', 'tadilat', 'tamirat', 'parke'],
    ratingAverage: 4.5,
    ratingCount: 156,
    isVerified: true,
    isActive: true,
  },
  {
    name: 'Akış Tesisat & Elektrik',
    slug: 'akis-tesisat-elektrik',
    description: 'Su tesisatı, kalorifer, kombi bakım, elektrik tesisat ve arıza hizmetleri.',
    categories: ['Tesisatçı & Elektrikçi'],
    tags: ['tesisat', 'elektrik', 'kombi', 'kalorifer'],
    ratingAverage: 4.3,
    ratingCount: 72,
    isVerified: true,
    isActive: true,
  },
  {
    name: 'Hızlı Nakliyat',
    slug: 'hizli-nakliyat',
    description: 'Evden eve nakliyat, ofis taşıma, paketleme ve depolama hizmetleri.',
    categories: ['Nakliyat'],
    tags: ['nakliyat', 'taşıma', 'depolama'],
    ratingAverage: 4.1,
    ratingCount: 203,
    isVerified: false,
    isActive: true,
  },
  {
    name: 'Dijital Çözüm Ajansı',
    slug: 'dijital-cozum-ajansi',
    description: 'Web sitesi, mobil uygulama, SEO, sosyal medya yönetimi ve grafik tasarım.',
    categories: ['Dijital Hizmetler'],
    tags: ['web tasarım', 'SEO', 'sosyal medya', 'grafik'],
    ratingAverage: 4.8,
    ratingCount: 45,
    isVerified: true,
    isActive: true,
  },
  {
    name: 'Lens Fotoğrafçılık',
    slug: 'lens-fotografcilik',
    description: 'Düğün, nişan, mezuniyet, ürün ve mekan fotoğrafçılığı. Drone çekimi mevcut.',
    categories: ['Fotoğraf & Video'],
    tags: ['düğün', 'fotoğraf', 'video', 'drone'],
    ratingAverage: 4.9,
    ratingCount: 67,
    isVerified: true,
    isActive: true,
  },
  {
    name: 'Akademi Özel Ders',
    slug: 'akademi-ozel-ders',
    description: 'Matematik, fizik, kimya, İngilizce özel ders. Üniversite hazırlık ve YKS destek.',
    categories: ['Eğitim & Özel Ders'],
    tags: ['özel ders', 'matematik', 'YKS', 'İngilizce'],
    ratingAverage: 4.6,
    ratingCount: 134,
    isVerified: true,
    isActive: true,
  },
  {
    name: 'Güzellik Merkezi Ela',
    slug: 'guzellik-merkezi-ela',
    description: 'Cilt bakımı, lazer epilasyon, kalıcı makyaj, saç bakımı hizmetleri.',
    categories: ['Sağlık & Güzellik'],
    tags: ['cilt bakımı', 'lazer', 'makyaj', 'saç'],
    ratingAverage: 4.4,
    ratingCount: 91,
    isVerified: false,
    isActive: true,
  },
  {
    name: 'Danışman Pro',
    slug: 'danismank-pro',
    description: 'İş hukuku, mali müşavirlik, vergi danışmanlığı ve şirket kuruluş hizmetleri.',
    categories: ['Danışmanlık'],
    tags: ['hukuk', 'mali müşavir', 'vergi', 'şirket kuruluş'],
    ratingAverage: 4.2,
    ratingCount: 38,
    isVerified: true,
    isActive: true,
  },
  {
    name: 'PatiDost Veteriner & Bakım',
    slug: 'patidost-veteriner',
    description: 'Veteriner muayene, aşılama, tıraş, yıkama ve evcil hayvan bakım hizmetleri.',
    categories: ['Evcil Hayvan'],
    tags: ['veteriner', 'köpek', 'kedi', 'bakım'],
    ratingAverage: 4.7,
    ratingCount: 112,
    isVerified: true,
    isActive: true,
  },
  {
    name: 'Oto Bakım Center',
    slug: 'oto-bakim-center',
    description: 'Araç yıkama, detaylı temizlik, boya koruma, cam filmi ve aksesuar montajı.',
    categories: ['Otomotiv Servisi'],
    tags: ['araç yıkama', 'detailing', 'boya koruma'],
    ratingAverage: 4.0,
    ratingCount: 58,
    isVerified: false,
    isActive: true,
  },
  {
    name: 'Çok Yönlü Hizmet',
    slug: 'cok-yonlu-hizmet',
    description: 'Temizlik, tadilat ve nakliyat hizmetlerini tek çatı altında sunan profesyonel ekip.',
    categories: ['Temizlik', 'Tadilat & Tamirat', 'Nakliyat'],
    tags: ['temizlik', 'tadilat', 'nakliyat', 'çok yönlü'],
    ratingAverage: 4.3,
    ratingCount: 47,
    isVerified: true,
    isActive: true,
  },
];

async function main() {
  const ds = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('supabase') ? { rejectUnauthorized: false } : false,
  });

  await ds.initialize();
  console.log('Connected to database');

  // Get a store_owner user to act as owner, or use the first user
  const owners = await ds.query(`SELECT id FROM users WHERE role = 'store_owner' LIMIT 5`);
  if (owners.length === 0) {
    const fallback = await ds.query(`SELECT id FROM users LIMIT 1`);
    if (fallback.length === 0) {
      console.error('No users found in database. Create at least one user first.');
      await ds.destroy();
      return;
    }
    owners.push(fallback[0]);
  }

  let created = 0;
  for (let i = 0; i < SERVICE_PROVIDERS.length; i++) {
    const sp = SERVICE_PROVIDERS[i];
    const owner = owners[i % owners.length];

    // Check if slug already exists
    const existing = await ds.query(`SELECT id FROM stores WHERE slug = $1`, [sp.slug]);
    if (existing.length > 0) {
      console.log(`Skipping ${sp.name} — slug already exists`);
      continue;
    }

    await ds.query(`
      INSERT INTO stores (
        id, "ownerId", name, slug, description, "storeType", categories, tags,
        "ratingAverage", "ratingCount", "isVerified", "isActive", address, "contactInfo",
        images, "openingHours", "createdAt", "updatedAt"
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, 'service', $5::jsonb, $6::jsonb,
        $7, $8, $9, $10, '{}'::jsonb, '{}'::jsonb,
        '[]'::jsonb, '[]'::jsonb, NOW(), NOW()
      )
    `, [
      owner.id,
      sp.name,
      sp.slug,
      sp.description,
      JSON.stringify(sp.categories),
      JSON.stringify(sp.tags),
      sp.ratingAverage,
      sp.ratingCount,
      sp.isVerified,
      sp.isActive,
    ]);

    created++;
    console.log(`Created: ${sp.name}`);
  }

  console.log(`\nDone! Created ${created} professional service providers.`);
  await ds.destroy();
}

main().catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});
