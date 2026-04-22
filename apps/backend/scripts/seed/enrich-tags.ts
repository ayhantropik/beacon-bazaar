import 'dotenv/config';
import { DataSource } from 'typeorm';

/**
 * Enriches product tags with category-matching keywords.
 * Tags are used for category filtering and search — they represent
 * what categories/subcategories a product belongs to.
 */

// Target tag rules: if product name matches pattern, add these tags
const TAG_RULES: Array<{ pattern: RegExp; tags: string[] }> = [
  // Gender
  { pattern: /kadın|bayan|elbise|bluz|etek|sütyen|gecelik|topuklu|babet/i, tags: ['kadın', 'bayan'] },
  { pattern: /erkek|bay|polo|boxer|kravat|takım elbise/i, tags: ['erkek', 'bay'] },
  { pattern: /çocuk|bebek|junior|kids/i, tags: ['çocuk', 'anne & çocuk'] },
  { pattern: /unisex/i, tags: ['kadın', 'erkek', 'unisex'] },

  // Clothing subcategories
  { pattern: /elbise|dress/i, tags: ['giyim', 'elbise'] },
  { pattern: /gömlek|shirt/i, tags: ['giyim', 'gömlek', 'üst giyim'] },
  { pattern: /pantolon|jean|kot/i, tags: ['giyim', 'pantolon', 'alt giyim'] },
  { pattern: /tişört|t-shirt/i, tags: ['giyim', 'tişört', 'üst giyim'] },
  { pattern: /ceket|jacket|mont|kaban|parka/i, tags: ['giyim', 'dış giyim', 'ceket'] },
  { pattern: /hırka|kazak|triko|sweat/i, tags: ['giyim', 'üst giyim', 'triko'] },
  { pattern: /etek|skirt/i, tags: ['giyim', 'etek', 'alt giyim'] },
  { pattern: /şort|bermuda/i, tags: ['giyim', 'şort', 'alt giyim'] },
  { pattern: /eşofman/i, tags: ['giyim', 'spor giyim', 'eşofman'] },
  { pattern: /tayt|legging/i, tags: ['giyim', 'spor giyim', 'tayt'] },
  { pattern: /pijama|gecelik/i, tags: ['iç giyim', 'ev giyim'] },
  { pattern: /trençkot|palto|kaban/i, tags: ['giyim', 'dış giyim'] },
  { pattern: /yelek/i, tags: ['giyim', 'üst giyim'] },

  // Footwear
  { pattern: /ayakkabı|shoe/i, tags: ['ayakkabı'] },
  { pattern: /sneaker/i, tags: ['ayakkabı', 'sneaker', 'spor ayakkabı'] },
  { pattern: /topuklu|stiletto/i, tags: ['ayakkabı', 'topuklu'] },
  { pattern: /bot|boot/i, tags: ['ayakkabı', 'bot'] },
  { pattern: /sandalet/i, tags: ['ayakkabı', 'sandalet', 'yazlık'] },
  { pattern: /babet/i, tags: ['ayakkabı', 'babet'] },
  { pattern: /terlik/i, tags: ['ayakkabı', 'terlik'] },

  // Bags
  { pattern: /çanta|bag/i, tags: ['çanta'] },
  { pattern: /sırt çanta|backpack/i, tags: ['çanta', 'sırt çantası'] },
  { pattern: /omuz çanta/i, tags: ['çanta', 'omuz çantası'] },
  { pattern: /valiz|bavul/i, tags: ['çanta', 'valiz', 'seyahat'] },
  { pattern: /cüzdan|wallet/i, tags: ['aksesuar', 'cüzdan'] },
  { pattern: /clutch/i, tags: ['çanta', 'el çantası'] },

  // Electronics
  { pattern: /iphone|samsung|xiaomi|telefon|phone/i, tags: ['elektronik', 'telefon', 'akıllı telefon'] },
  { pattern: /laptop|notebook|macbook/i, tags: ['elektronik', 'bilgisayar', 'laptop'] },
  { pattern: /tablet|ipad/i, tags: ['elektronik', 'tablet'] },
  { pattern: /kulaklık|airpods|earbuds/i, tags: ['elektronik', 'ses', 'kulaklık'] },
  { pattern: /hoparlör|speaker/i, tags: ['elektronik', 'ses', 'hoparlör'] },
  { pattern: /kamera|camera/i, tags: ['elektronik', 'fotoğraf', 'kamera'] },
  { pattern: /gaming|oyuncu/i, tags: ['elektronik', 'gaming', 'oyun'] },
  { pattern: /monitör|ekran/i, tags: ['elektronik', 'bilgisayar', 'monitör'] },
  { pattern: /klavye|keyboard/i, tags: ['elektronik', 'bilgisayar', 'klavye'] },
  { pattern: /mouse|fare/i, tags: ['elektronik', 'bilgisayar'] },
  { pattern: /bluetooth/i, tags: ['elektronik', 'kablosuz'] },
  { pattern: /drone|dji/i, tags: ['elektronik', 'drone', 'hobi'] },
  { pattern: /playstation|ps5|xbox|nintendo/i, tags: ['elektronik', 'oyun konsolu'] },
  { pattern: /powerbank|şarj/i, tags: ['elektronik', 'aksesuar', 'şarj'] },

  // Cosmetics
  { pattern: /parfüm|perfume/i, tags: ['kozmetik', 'parfüm', 'koku'] },
  { pattern: /ruj|lipstick/i, tags: ['kozmetik', 'makyaj', 'dudak'] },
  { pattern: /fondöten|foundation/i, tags: ['kozmetik', 'makyaj', 'yüz'] },
  { pattern: /rimel|mascara/i, tags: ['kozmetik', 'makyaj', 'göz'] },
  { pattern: /göz farı|eyeshadow/i, tags: ['kozmetik', 'makyaj', 'göz'] },
  { pattern: /cilt|skin|krem|cream/i, tags: ['kozmetik', 'cilt bakım'] },
  { pattern: /şampuan|shampoo/i, tags: ['kozmetik', 'saç bakım'] },
  { pattern: /saç/i, tags: ['kozmetik', 'saç bakım'] },
  { pattern: /makyaj|makeup/i, tags: ['kozmetik', 'makyaj'] },
  { pattern: /serum/i, tags: ['kozmetik', 'cilt bakım', 'serum'] },
  { pattern: /güneş krem/i, tags: ['kozmetik', 'cilt bakım', 'güneş koruması'] },

  // Watches & Accessories
  { pattern: /kol saati|saat|watch/i, tags: ['saat', 'aksesuar'] },
  { pattern: /akıllı saat|smartwatch/i, tags: ['saat', 'akıllı saat', 'teknoloji'] },
  { pattern: /kolye|necklace/i, tags: ['takı', 'kolye', 'aksesuar'] },
  { pattern: /bileklik|bracelet/i, tags: ['takı', 'bileklik', 'aksesuar'] },
  { pattern: /küpe|earring/i, tags: ['takı', 'küpe', 'aksesuar'] },
  { pattern: /yüzük|ring/i, tags: ['takı', 'yüzük', 'aksesuar'] },
  { pattern: /güneş gözlüğü|sunglasses/i, tags: ['aksesuar', 'gözlük'] },
  { pattern: /kemer|belt/i, tags: ['aksesuar', 'kemer'] },
  { pattern: /şapka|bere|hat/i, tags: ['aksesuar', 'şapka'] },

  // Sports
  { pattern: /dambıl|dumbbell/i, tags: ['spor', 'fitness', 'ağırlık'] },
  { pattern: /yoga/i, tags: ['spor', 'fitness', 'yoga'] },
  { pattern: /koşu|running/i, tags: ['spor', 'koşu'] },
  { pattern: /bisiklet|bicycle/i, tags: ['spor', 'outdoor', 'bisiklet'] },
  { pattern: /kamp|camp/i, tags: ['spor', 'outdoor', 'kamp'] },
  { pattern: /tenis/i, tags: ['spor', 'tenis'] },
  { pattern: /protein|supplement/i, tags: ['spor', 'beslenme'] },
  { pattern: /fitness/i, tags: ['spor', 'fitness'] },

  // Food / Supermarket
  { pattern: /bal|honey/i, tags: ['gıda', 'doğal', 'kahvaltılık'] },
  { pattern: /peynir|cheese/i, tags: ['gıda', 'süt ürünleri', 'kahvaltılık'] },
  { pattern: /zeytin|olive/i, tags: ['gıda', 'kahvaltılık'] },
  { pattern: /kahve|coffee/i, tags: ['gıda', 'içecek', 'kahve'] },
  { pattern: /çay|tea/i, tags: ['gıda', 'içecek', 'çay'] },
  { pattern: /baklava/i, tags: ['gıda', 'tatlı', 'geleneksel'] },
  { pattern: /sucuk/i, tags: ['gıda', 'et ürünleri'] },
  { pattern: /lokum/i, tags: ['gıda', 'tatlı', 'geleneksel'] },
  { pattern: /tahin/i, tags: ['gıda', 'kahvaltılık'] },
  { pattern: /baharat|spice/i, tags: ['gıda', 'baharat'] },
  { pattern: /nar/i, tags: ['gıda', 'meyve'] },
  { pattern: /organik/i, tags: ['organik', 'doğal'] },

  // Home & Living
  { pattern: /koltuk|sofa/i, tags: ['mobilya', 'oturma grubu'] },
  { pattern: /masa|table/i, tags: ['mobilya', 'masa'] },
  { pattern: /sandalye|chair/i, tags: ['mobilya', 'sandalye'] },
  { pattern: /halı|carpet/i, tags: ['ev tekstili', 'halı'] },
  { pattern: /perde|curtain/i, tags: ['ev tekstili', 'perde'] },
  { pattern: /yastık|pillow/i, tags: ['ev tekstili', 'yastık'] },
  { pattern: /nevresim/i, tags: ['ev tekstili', 'yatak'] },
  { pattern: /aydınlatma|lamba|led/i, tags: ['dekorasyon', 'aydınlatma'] },
  { pattern: /vazo|vase/i, tags: ['dekorasyon', 'vazo'] },
  { pattern: /mum|candle/i, tags: ['dekorasyon', 'mum'] },
  { pattern: /tencere|tava|pot/i, tags: ['mutfak', 'pişirme'] },
  { pattern: /bıçak|knife/i, tags: ['mutfak', 'bıçak'] },
  { pattern: /seramik/i, tags: ['dekorasyon', 'seramik'] },
  { pattern: /bahçe|garden/i, tags: ['bahçe', 'outdoor'] },

  // Kids
  { pattern: /lego/i, tags: ['oyuncak', 'lego', 'eğitici'] },
  { pattern: /puzzle/i, tags: ['oyuncak', 'puzzle', 'eğitici'] },
  { pattern: /peluş/i, tags: ['oyuncak', 'peluş'] },
  { pattern: /bebek arabası/i, tags: ['bebek', 'araba'] },
  { pattern: /bebek bezi/i, tags: ['bebek', 'hijyen'] },
  { pattern: /mama/i, tags: ['bebek', 'beslenme'] },
  { pattern: /biberon/i, tags: ['bebek', 'beslenme'] },
  { pattern: /oyuncak/i, tags: ['oyuncak', 'çocuk'] },

  // Books & Music
  { pattern: /kitap|book|roman/i, tags: ['kitap', 'okuma'] },
  { pattern: /gitar|guitar/i, tags: ['müzik', 'enstrüman', 'gitar'] },
  { pattern: /piyano|piano/i, tags: ['müzik', 'enstrüman', 'piyano'] },
  { pattern: /ukulele/i, tags: ['müzik', 'enstrüman', 'ukulele'] },
  { pattern: /mikrofon/i, tags: ['müzik', 'ses', 'mikrofon'] },

  // Materials
  { pattern: /deri|leather/i, tags: ['deri'] },
  { pattern: /pamuk|cotton/i, tags: ['pamuklu', 'doğal'] },
  { pattern: /keten|linen/i, tags: ['keten', 'doğal'] },
  { pattern: /kaşmir|cashmere/i, tags: ['kaşmir', 'premium'] },
  { pattern: /ipek|silk/i, tags: ['ipek', 'premium'] },
  { pattern: /yün|wool/i, tags: ['yün', 'doğal'] },

  // Season
  { pattern: /yazlık|summer/i, tags: ['yazlık', 'yaz'] },
  { pattern: /kışlık|winter/i, tags: ['kışlık', 'kış'] },

  // School (user's example)
  { pattern: /okul|school/i, tags: ['okul', 'eğitim'] },
];

// Category → implicit tags (all products in this category get these)
const CATEGORY_TAGS: Record<string, string[]> = {
  'Kadın': ['kadın', 'moda'],
  'Erkek': ['erkek', 'moda'],
  'Anne & Çocuk': ['aile', 'çocuk'],
  'Ev & Yaşam': ['ev', 'yaşam'],
  'Süpermarket': ['market', 'gıda'],
  'Kozmetik': ['güzellik', 'bakım'],
  'Ayakkabı & Çanta': ['aksesuar'],
  'Elektronik': ['teknoloji'],
  'Saat & Aksesuar': ['aksesuar', 'stil'],
  'Spor & Outdoor': ['spor', 'sağlık'],
};

async function main() {
  const ds = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    extra: { prepared_statements: false },
  });
  await ds.initialize();
  console.log('Connected to database');

  // Fetch all products
  const products = await ds.query('SELECT id, name, categories, tags FROM products');
  console.log(`Processing ${products.length} products...`);

  let updated = 0;
  const batchSize = 50;
  const batches: Array<{ id: string; tags: string[] }> = [];

  for (const product of products) {
    const name: string = product.name || '';
    const cats: string[] = product.categories || [];
    const existingTags: string[] = product.tags || [];
    const newTags = new Set<string>(existingTags.map((t: string) => t.toLowerCase()));

    // Add category-based implicit tags
    for (const cat of cats) {
      const implicit = CATEGORY_TAGS[cat];
      if (implicit) implicit.forEach(t => newTags.add(t));
    }

    // Apply name-based rules
    for (const rule of TAG_RULES) {
      if (rule.pattern.test(name)) {
        rule.tags.forEach(t => newTags.add(t));
      }
    }

    // Add the product name's first word as tag (lowercase)
    const firstWord = name.split(' ')[0]?.toLowerCase();
    if (firstWord && firstWord.length > 2) newTags.add(firstWord);

    const tagArr = [...newTags].filter(t => t.length > 1);

    if (tagArr.length !== existingTags.length || !tagArr.every(t => existingTags.includes(t))) {
      batches.push({ id: product.id, tags: tagArr });
      updated++;
    }
  }

  // Batch update using a VALUES clause
  console.log(`Updating ${updated} products with enriched tags...`);

  for (let i = 0; i < batches.length; i += batchSize) {
    const batch = batches.slice(i, i + batchSize);
    const cases = batch.map((b, idx) => `WHEN id = $${idx * 2 + 1} THEN $${idx * 2 + 2}::jsonb`).join(' ');
    const ids = batch.map((_, idx) => `$${idx * 2 + 1}`).join(',');
    const params: any[] = [];
    for (const b of batch) {
      params.push(b.id, JSON.stringify(b.tags));
    }

    await ds.query(`
      UPDATE products SET tags = CASE ${cases} END
      WHERE id IN (${ids})
    `, params);

    process.stdout.write(`  Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(batches.length / batchSize)}\r`);
  }

  console.log(`\nDone! Updated ${updated} products with enriched tags.`);

  // Verify: show sample
  const samples = await ds.query('SELECT name, categories, tags FROM products ORDER BY RANDOM() LIMIT 8');
  console.log('\n=== SAMPLE PRODUCTS ===');
  for (const s of samples) {
    console.log(`${s.name}`);
    console.log(`  categories: ${JSON.stringify(s.categories)}`);
    console.log(`  tags: ${JSON.stringify(s.tags)}`);
    console.log();
  }

  // Show tag counts for target categories
  const tagCounts = await ds.query(`
    SELECT tag, COUNT(*) as cnt
    FROM products, jsonb_array_elements_text(tags) tag
    GROUP BY tag ORDER BY cnt DESC LIMIT 30
  `);
  console.log('=== TOP 30 TAGS ===');
  for (const t of tagCounts) console.log(`  ${t.tag}: ${t.cnt}`);

  await ds.destroy();
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
