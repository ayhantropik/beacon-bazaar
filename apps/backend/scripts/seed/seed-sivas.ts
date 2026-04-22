/**
 * Sivas Çifte Minareli Medrese çevresine hediyelik mağazaları ekle
 * Run with: cd apps/backend && npx tsx src/seed-sivas.ts
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

// Çifte Minareli Medrese: 39.7481, 37.0195
// Mağazalar gerçek cadde/sokak üzerinde, tam adresleriyle
const STORES = [
  {
    name: 'Sivas Hediyelik Dünyası',
    desc: 'Sivas yöresine özgü el yapımı hediyelik eşyalar, Divriği işlemeleri ve geleneksel Sivas madımağı',
    lat: 39.74980, lng: 37.01934,
    street: 'Atatürk Caddesi',
    categories: ['Hediyelik', 'El Sanatları'],
    products: [
      { name: 'Divriği Taş İşlemesi', desc: 'El yapımı dekoratif taş oyma, Divriği Ulu Cami motifli', price: 450, salePrice: 379, img: 'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=300' },
      { name: 'Sivas Madımağı Halısı', desc: 'Geleneksel Sivas dokuma, %100 yün, 80x120cm', price: 2500, salePrice: 1999, img: 'https://images.unsplash.com/photo-1600166898405-da9535204843?w=300' },
      { name: 'Çifte Minare Maketi', desc: 'El yapımı ahşap maket, detaylı minyatür', price: 350, salePrice: null, img: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=300' },
      { name: 'Kangal Köpeği Figürü', desc: 'Seramik Kangal köpeği heykelciği, el boyaması', price: 180, salePrice: 149, img: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=300' },
      { name: 'Sivas Pastırması 500g', desc: 'Geleneksel Sivas pastırması, doğal kurutma', price: 320, salePrice: null, img: 'https://images.unsplash.com/photo-1608039858788-667850f129f6?w=300' },
      { name: 'El Yapımı Kilim Çanta', desc: 'Sivas motifli kilim çanta, vintage tasarım', price: 280, salePrice: 229, img: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=300' },
      { name: 'Bakır Cezve Seti', desc: 'El dövme bakır cezve + 2 fincan, Sivas işçiliği', price: 420, salePrice: 359, img: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefda?w=300' },
      { name: 'Sivas Lokumu 1kg', desc: 'Cevizli Sivas lokumu, taze üretim', price: 150, salePrice: null, img: 'https://images.unsplash.com/photo-1590080876351-941da357b7f1?w=300' },
    ],
  },
  {
    name: 'Anadolu El Sanatları',
    desc: 'Geleneksel Anadolu el sanatları, çini, seramik ve bakır ürünler',
    lat: 39.75002, lng: 37.01869,
    street: 'Atatürk Caddesi',
    categories: ['Hediyelik', 'El Sanatları'],
    products: [
      { name: 'Çini Tabak Seti', desc: 'El boyaması çini tabak, 3lü set, duvar süsü', price: 550, salePrice: 449, img: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=300' },
      { name: 'Bakır Sahan', desc: 'El dövme bakır sahan, kalaylanmış, 20cm', price: 280, salePrice: null, img: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=300' },
      { name: 'Ebru Sanatı Tablo', desc: 'Orijinal ebru sanatı, çerçeveli, 30x40cm', price: 650, salePrice: 549, img: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=300' },
      { name: 'Seramik Vazo', desc: 'El yapımı seramik vazo, Selçuklu deseni', price: 380, salePrice: null, img: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=300' },
      { name: 'Deri Kaplı Defter', desc: 'El yapımı deri defter, Osmanlı motifli', price: 120, salePrice: 99, img: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=300' },
      { name: 'Nazar Boncuğu Seti', desc: 'Cam nazar boncuğu, 7 parça dekoratif set', price: 190, salePrice: 159, img: 'https://images.unsplash.com/photo-1601158935942-52255782d322?w=300' },
    ],
  },
  {
    name: 'Selçuklu Hediyelik',
    desc: 'Selçuklu ve Osmanlı motifli hediyelik eşyalar, takı ve dekoratif ürünler',
    lat: 39.75024, lng: 37.01779,
    street: 'Atatürk Caddesi',
    categories: ['Hediyelik', 'Saat & Aksesuar'],
    products: [
      { name: 'Selçuklu Yıldızı Kolye', desc: 'Gümüş kaplama Selçuklu yıldızı kolye', price: 220, salePrice: 179, img: 'https://images.unsplash.com/photo-1515562141589-67f0d569b6aa?w=300' },
      { name: 'Osmanlı Tuğra Yüzük', desc: 'El işçiliği gümüş tuğra yüzük', price: 350, salePrice: null, img: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=300' },
      { name: 'Hat Sanatı Levha', desc: 'Altın varaklı hat sanatı, Besmele, 40x50cm', price: 890, salePrice: 749, img: 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=300' },
      { name: 'Tesbih - Kehribar', desc: 'Doğal Baltık kehribarı tesbih, 33lük', price: 1200, salePrice: 999, img: 'https://images.unsplash.com/photo-1590076082562-1e4c2e6e0e1d?w=300' },
      { name: 'Osmanlı Kalem Kutusu', desc: 'Sedef kakmalı ahşap kalem kutusu', price: 480, salePrice: 399, img: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=300' },
      { name: 'Minyatür Çini Kase', desc: 'İznik çinisi minyatür kase seti, 4lü', price: 320, salePrice: null, img: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=300' },
      { name: 'Türk Kahvesi Seti', desc: 'Bakır cezve, 6 fincan, tepsi, el işlemeli', price: 750, salePrice: 629, img: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=300' },
    ],
  },
  {
    name: 'Sivas Yöresel Lezzetler',
    desc: 'Sivas yöresine ait doğal ve organik gıda ürünleri, pastırma, sucuk ve bal',
    lat: 39.75043, lng: 37.01678,
    street: 'Atatürk Caddesi',
    categories: ['Süpermarket', 'Gıda', 'Hediyelik'],
    products: [
      { name: 'Sivas Bal Kavanozu 1kg', desc: 'Sivas yaylası çiçek balı, süzme', price: 450, salePrice: 389, img: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=300' },
      { name: 'Sivas Sucuğu 1kg', desc: 'Geleneksel Sivas sucuğu, doğal bağırsak', price: 280, salePrice: null, img: 'https://images.unsplash.com/photo-1599921841143-819065a55cc6?w=300' },
      { name: 'Sivas Pastırması 500g', desc: 'Çemen kaplı dana pastırma, geleneksel', price: 350, salePrice: 299, img: 'https://images.unsplash.com/photo-1608039858788-667850f129f6?w=300' },
      { name: 'Sivas Katmeri 12li', desc: 'El açma yufka katmer, taze', price: 120, salePrice: null, img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300' },
      { name: 'Sivas Pekmezi 750ml', desc: 'Üzüm pekmezi, doğal, katkısız', price: 90, salePrice: 75, img: 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=300' },
      { name: 'Ceviz İçi 500g', desc: 'Sivas cevizi, taze kırılmış', price: 180, salePrice: null, img: 'https://images.unsplash.com/photo-1563412885-139e4045e3e8?w=300' },
    ],
  },
  {
    name: 'Medrese Kitap & Hediyelik',
    desc: 'Tarih, kültür ve sanat kitapları, Sivas rehberleri ve kültürel hediyelikler',
    lat: 39.75055, lng: 37.01557,
    street: 'Atatürk Caddesi',
    categories: ['Kitap & Kırtasiye', 'Hediyelik'],
    products: [
      { name: 'Sivas Tarihi Kitabı', desc: 'Sivas tarihi ve kültür rehberi, renkli baskı', price: 120, salePrice: 99, img: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300' },
      { name: 'Divriği Ulu Cami Fotoğraf Albümü', desc: 'UNESCO mirası, büyük boy fotoğraf albümü', price: 280, salePrice: null, img: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=300' },
      { name: 'Selçuklu Sanatı Kitabı', desc: 'Selçuklu mimarisi ve süsleme sanatları', price: 190, salePrice: 159, img: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300' },
      { name: 'Sivas Kartpostal Seti', desc: '12li Sivas manzara kartpostal seti', price: 45, salePrice: null, img: 'https://images.unsplash.com/photo-1594818379496-da1e58bfe5ef?w=300' },
      { name: 'Minyatür Baskı Tablo', desc: 'Osmanlı minyatür sanatı reprodüksiyon, A4', price: 150, salePrice: 119, img: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=300' },
      { name: 'Sivas Magnet Seti', desc: 'Buzdolabı magneti, 5li Sivas simgeleri', price: 60, salePrice: null, img: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=300' },
    ],
  },
];

async function seed() {
  await ds.initialize();
  console.log('Connected to database');

  // Get a user to own the stores (first user found)
  const [user] = await ds.query('SELECT id FROM users LIMIT 1');
  if (!user) {
    console.error('No users found. Please seed users first.');
    await ds.destroy();
    return;
  }
  const ownerId = user.id;
  console.log(`Using owner: ${ownerId}`);

  for (const store of STORES) {
    const storeSlug = slug(store.name);
    const address = JSON.stringify({
      street: store.street,
      district: 'Merkez',
      city: 'Sivas',
      country: 'Türkiye',
    });
    const contactInfo = JSON.stringify({
      phone: '+90 346 ' + Math.floor(2000000 + Math.random() * 8000000),
      email: `info@${storeSlug}.com`,
    });
    const openingHours = JSON.stringify([
      { day: 'Pazartesi', open: '09:00', close: '19:00' },
      { day: 'Salı', open: '09:00', close: '19:00' },
      { day: 'Çarşamba', open: '09:00', close: '19:00' },
      { day: 'Perşembe', open: '09:00', close: '19:00' },
      { day: 'Cuma', open: '09:00', close: '19:00' },
      { day: 'Cumartesi', open: '10:00', close: '18:00' },
      { day: 'Pazar', open: '10:00', close: '17:00' },
    ]);
    const categories = JSON.stringify(store.categories);
    const ratingAvg = +(3.5 + Math.random() * 1.5).toFixed(2);
    const ratingCount = Math.floor(50 + Math.random() * 400);
    const logo = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=100';

    const storeResult = await ds.query(`
      INSERT INTO stores (id, "ownerId", name, slug, description, logo, "coverImage", images,
        latitude, longitude, location, address, categories, "contactInfo", "openingHours",
        "ratingAverage", "ratingCount", "followersCount", "isVerified", "isActive", "createdAt", "updatedAt")
      VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $5, '[]'::jsonb,
        $6, $7, ST_SetSRID(ST_MakePoint($7, $6), 4326)::geography,
        $8::jsonb, $9::jsonb, $10::jsonb, $11::jsonb,
        $12, $13, ${Math.floor(10 + Math.random() * 200)},
        true, true, NOW(), NOW()
      )
      ON CONFLICT (slug) DO UPDATE SET
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        location = EXCLUDED.location,
        address = EXCLUDED.address,
        description = EXCLUDED.description,
        categories = EXCLUDED.categories,
        "updatedAt" = NOW()
      RETURNING id
    `, [ownerId, store.name, storeSlug, store.desc, logo, store.lat, store.lng,
        address, categories, contactInfo, openingHours, ratingAvg, ratingCount]);

    const storeId = storeResult[0].id;
    console.log(`  Store: ${store.name} (${storeId})`);

    // Insert products
    for (const prod of store.products) {
      const prodSlug = slug(prod.name) + '-' + storeSlug;
      await ds.query(`
        INSERT INTO products (id, "storeId", name, slug, description, "shortDescription",
          price, "salePrice", currency, categories, tags, images, thumbnail,
          "stockQuantity", "isActive", "isFeatured", "ratingAverage", "ratingCount", "createdAt", "updatedAt")
        VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5,
          $6, $7, 'TRY', $8::jsonb, '[]'::jsonb, $9::jsonb, $10,
          ${Math.floor(10 + Math.random() * 100)}, true, ${Math.random() > 0.5},
          ${+(3 + Math.random() * 2).toFixed(2)}, ${Math.floor(5 + Math.random() * 100)},
          NOW(), NOW()
        )
        ON CONFLICT (slug) DO UPDATE SET
          price = EXCLUDED.price,
          "salePrice" = EXCLUDED."salePrice",
          "updatedAt" = NOW()
      `, [storeId, prod.name, prodSlug, prod.desc, prod.desc,
          prod.price, prod.salePrice, JSON.stringify(store.categories),
          JSON.stringify([prod.img]), prod.img]);
      console.log(`    Product: ${prod.name}`);
    }
  }

  console.log('\nSivas seed complete!');
  await ds.destroy();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
