/**
 * store_owner rolündeki kullanıcılar için mağaza kaydı oluştur
 * Run with: cd apps/backend && npx tsx src/seed-stores-from-owners.ts
 */

import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

const ds = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  extra: process.env.DATABASE_URL?.includes('pooler') ? { prepared: false } : {},
});

function slug(name: string) {
  return name
    .toLowerCase()
    .replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i')
    .replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u')
    .replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

const STORE_TEMPLATES = [
  { suffix: 'Mağazası', categories: ['Ev & Yaşam', 'Hediyelik'], desc: 'Kaliteli ürünler ve uygun fiyatlarla hizmetinizdeyiz.' },
  { suffix: 'Market', categories: ['Süpermarket', 'Ev & Yaşam'], desc: 'Günlük ihtiyaçlarınız için en uygun fiyatlar.' },
  { suffix: 'Butik', categories: ['Moda & Giyim', 'Ayakkabı & Çanta'], desc: 'Trend ve şık ürünlerle gardırobunuzu yenileyin.' },
  { suffix: 'Tekno', categories: ['Elektronik'], desc: 'En yeni teknolojik ürünler ve aksesuarlar.' },
  { suffix: 'Spor Mağazası', categories: ['Spor & Outdoor'], desc: 'Spor giyim, ekipman ve outdoor ürünleri.' },
  { suffix: 'Kozmetik', categories: ['Kozmetik', 'Sağlık & Güzellik'], desc: 'Bakım, makyaj ve güzellik ürünleri.' },
  { suffix: 'Kitabevi', categories: ['Kitap & Kırtasiye'], desc: 'Kitap, kırtasiye ve hobi malzemeleri.' },
  { suffix: 'Çocuk Dünyası', categories: ['Anne & Çocuk', 'Oyuncak & Hobi'], desc: 'Çocuk giyim, oyuncak ve anne-bebek ürünleri.' },
];

async function main() {
  await ds.initialize();
  console.log('DB connected');

  // store_owner olup mağazası olmayan kullanıcıları bul
  const owners = await ds.query(`
    SELECT u.id, u.name, u.surname, u.email
    FROM users u
    WHERE u.role = 'store_owner'
      AND NOT EXISTS (SELECT 1 FROM stores s WHERE s."ownerId" = u.id)
    ORDER BY u."createdAt"
  `);

  console.log(`${owners.length} mağaza sahibi bulundu (mağazası olmayan)`);

  if (owners.length === 0) {
    // Belki zaten mağazaları var ama storeType sorunlu, kontrol edelim
    const existingStores = await ds.query(`SELECT COUNT(*) as cnt FROM stores`);
    const allOwners = await ds.query(`SELECT COUNT(*) as cnt FROM users WHERE role = 'store_owner'`);
    console.log(`Toplam mağaza: ${existingStores[0].cnt}, Toplam store_owner: ${allOwners[0].cnt}`);

    if (parseInt(existingStores[0].cnt) > 0) {
      // storeType null ya da boş olanları 'shopping' yap
      const fixed = await ds.query(`
        UPDATE stores SET "storeType" = 'shopping'
        WHERE "storeType" IS NULL OR "storeType" = ''
      `);
      console.log(`${fixed[1] || 0} mağazanın storeType değeri 'shopping' olarak güncellendi`);
    }

    await ds.destroy();
    return;
  }

  let created = 0;
  for (let i = 0; i < owners.length; i++) {
    const owner = owners[i];
    const template = STORE_TEMPLATES[i % STORE_TEMPLATES.length];
    const ownerName = owner.name || 'Mağaza';
    const storeName = `${ownerName} ${template.suffix}`;
    const storeSlug = slug(storeName) + '-' + Date.now().toString(36).slice(-4);

    try {
      await ds.query(`
        INSERT INTO stores (
          id, "ownerId", name, slug, description, "storeType",
          categories, tags, address, "contactInfo", images, "openingHours",
          "ratingAverage", "ratingCount", "isVerified", "isActive",
          "followersCount", "productsCount", "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, 'shopping',
          $5::jsonb, '[]'::jsonb, '{}'::jsonb, $6::jsonb, '[]'::jsonb, '[]'::jsonb,
          0, 0, false, true,
          0, 0, NOW(), NOW()
        )
      `, [
        owner.id,
        storeName,
        storeSlug,
        template.desc,
        JSON.stringify(template.categories),
        JSON.stringify({ email: owner.email }),
      ]);
      created++;
      console.log(`  + ${storeName} (${owner.name} ${owner.surname || ''} - ${owner.email})`);
    } catch (e: any) {
      console.warn(`  ! ${storeName} oluşturulamadı: ${e.message}`);
    }
  }

  // storeType null olanları da düzelt
  const fixed = await ds.query(`
    UPDATE stores SET "storeType" = 'shopping'
    WHERE "storeType" IS NULL OR "storeType" = ''
  `);
  console.log(`\n${fixed[1] || 0} mağazanın storeType değeri düzeltildi`);

  console.log(`\nToplam ${created} mağaza oluşturuldu.`);
  await ds.destroy();
}

main().catch((e) => { console.error(e); process.exit(1); });
