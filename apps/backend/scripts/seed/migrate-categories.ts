import 'dotenv/config';
import { DataSource } from 'typeorm';

const TARGET_CATEGORIES = [
  'Kadın', 'Erkek', 'Anne & Çocuk', 'Ev & Yaşam', 'Süpermarket',
  'Kozmetik', 'Ayakkabı & Çanta', 'Elektronik', 'Saat & Aksesuar', 'Spor & Outdoor',
];

async function main() {
  const ds = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    extra: { prepared_statements: false },
  });
  await ds.initialize();
  console.log('Connected to database');

  // ==========================================
  // STEP 1: Batch remap product categories using SQL
  // ==========================================
  console.log('\n=== STEP 1: Batch remap product categories ===');

  // First, add target category tags based on existing categories and product name keywords
  const categoryMappings = [
    // Map old categories to new target categories
    { oldCat: 'Gıda', newCat: 'Süpermarket' },
    { oldCat: 'Yiyecek', newCat: 'Süpermarket' },
    { oldCat: 'Market', newCat: 'Süpermarket' },
    { oldCat: 'Organik', newCat: 'Süpermarket' },
    { oldCat: 'Spor', newCat: 'Spor & Outdoor' },
    { oldCat: 'Outdoor', newCat: 'Spor & Outdoor' },
    { oldCat: 'Fitness', newCat: 'Spor & Outdoor' },
    { oldCat: 'Aksesuar', newCat: 'Saat & Aksesuar' },
    { oldCat: 'Takı', newCat: 'Saat & Aksesuar' },
    { oldCat: 'Oyuncak', newCat: 'Anne & Çocuk' },
    { oldCat: 'Hobi', newCat: 'Anne & Çocuk' },
    { oldCat: 'Çocuk', newCat: 'Anne & Çocuk' },
    { oldCat: 'Oyuncak & Hobi', newCat: 'Anne & Çocuk' },
    { oldCat: 'Eğitim', newCat: 'Anne & Çocuk' },
    { oldCat: 'Dekorasyon', newCat: 'Ev & Yaşam' },
    { oldCat: 'Mobilya', newCat: 'Ev & Yaşam' },
    { oldCat: 'Ev', newCat: 'Ev & Yaşam' },
    { oldCat: 'Ev & Mobilya', newCat: 'Ev & Yaşam' },
    { oldCat: 'Güzellik', newCat: 'Kozmetik' },
    { oldCat: 'Bakım', newCat: 'Kozmetik' },
    { oldCat: 'Ayakkabı', newCat: 'Ayakkabı & Çanta' },
    { oldCat: 'Çanta', newCat: 'Ayakkabı & Çanta' },
    { oldCat: 'Teknoloji', newCat: 'Elektronik' },
    { oldCat: 'Bilgisayar', newCat: 'Elektronik' },
    { oldCat: 'Telefon', newCat: 'Elektronik' },
    { oldCat: 'Kitap', newCat: 'Ev & Yaşam' },
    { oldCat: 'Kırtasiye', newCat: 'Ev & Yaşam' },
    { oldCat: 'Kitap & Kırtasiye', newCat: 'Ev & Yaşam' },
    { oldCat: 'Müzik', newCat: 'Ev & Yaşam' },
    { oldCat: 'Enstrüman', newCat: 'Ev & Yaşam' },
    { oldCat: 'Hediyelik', newCat: 'Ev & Yaşam' },
    { oldCat: 'El Sanatları', newCat: 'Ev & Yaşam' },
    { oldCat: 'Hediye', newCat: 'Ev & Yaşam' },
    { oldCat: 'Moda', newCat: 'Kadın' },
    { oldCat: 'Giyim', newCat: 'Kadın' },
    { oldCat: 'Anne & Çocuk', newCat: 'Anne & Çocuk' },
    { oldCat: 'Spor & Outdoor', newCat: 'Spor & Outdoor' },
    { oldCat: 'Saat & Aksesuar', newCat: 'Saat & Aksesuar' },
    { oldCat: 'Hayvan', newCat: 'Süpermarket' },
    { oldCat: 'Pet', newCat: 'Süpermarket' },
    { oldCat: 'Mama', newCat: 'Süpermarket' },
    { oldCat: 'Kahve', newCat: 'Süpermarket' },
    { oldCat: 'Kafe', newCat: 'Süpermarket' },
    { oldCat: 'İçecek', newCat: 'Süpermarket' },
    { oldCat: 'Geleneksel', newCat: 'Süpermarket' },
    { oldCat: 'Çiçek', newCat: 'Ev & Yaşam' },
    { oldCat: 'Deniz', newCat: 'Spor & Outdoor' },
    { oldCat: 'Otomotiv', newCat: 'Spor & Outdoor' },
    { oldCat: 'Kültür', newCat: 'Ev & Yaşam' },
    { oldCat: 'Sanat', newCat: 'Ev & Yaşam' },
    { oldCat: 'Tasarım', newCat: 'Ev & Yaşam' },
  ];

  // Build a massive CASE expression for products
  // We'll do this with a temp mapping table approach for efficiency
  // First: for each product, compute new categories array based on old categories

  // Approach: Use a single UPDATE with a subquery that maps categories
  // Step 1a: Create temp mapping
  await ds.query(`
    CREATE TEMP TABLE IF NOT EXISTS cat_map (old_cat TEXT, new_cat TEXT)
  `);
  await ds.query('DELETE FROM cat_map');

  // Insert all mappings at once
  const mapValues = categoryMappings.map(m => `('${m.oldCat.replace(/'/g, "''")}', '${m.newCat.replace(/'/g, "''")}')`).join(',');
  await ds.query(`INSERT INTO cat_map (old_cat, new_cat) VALUES ${mapValues}`);
  console.log(`Inserted ${categoryMappings.length} category mappings`);

  // Step 1b: Compute new categories for each product and update in one shot
  // For each product: extract old categories → map each → deduplicate → build new jsonb array
  const updateResult = await ds.query(`
    UPDATE products p
    SET categories = sub.new_cats
    FROM (
      SELECT p2.id,
        (
          SELECT jsonb_agg(DISTINCT mapped)
          FROM (
            SELECT COALESCE(cm.new_cat, oc.val) as mapped
            FROM jsonb_array_elements_text(p2.categories) as oc(val)
            LEFT JOIN cat_map cm ON cm.old_cat = oc.val
          ) t
          WHERE mapped = ANY($1::text[])
        ) as new_cats
      FROM products p2
    ) sub
    WHERE p.id = sub.id AND sub.new_cats IS NOT NULL AND sub.new_cats != p.categories
  `, [TARGET_CATEGORIES]);
  console.log(`Products updated: ${updateResult[1] || 'done'}`);

  // Step 1c: For products that ended up with NO target category, assign based on name keywords
  console.log('Assigning categories to uncategorized products by name...');

  const namePatterns = [
    { pattern: 'parfüm|ruj|makyaj|cilt|krem|serum|şampuan|saç|fondöten|rimel|allık', cat: 'Kozmetik' },
    { pattern: 'telefon|laptop|tablet|kulaklık|hoparlör|kamera|gaming|iphone|samsung|ipad|macbook|bluetooth|mekanik klavye|monitör|DJI', cat: 'Elektronik' },
    { pattern: 'ayakkabı|sneaker|çanta|bot|sandalet|valiz|babet|terlik|sırt çanta', cat: 'Ayakkabı & Çanta' },
    { pattern: 'saat|kolye|bileklik|küpe|yüzük|gözlük|kemer|broş', cat: 'Saat & Aksesuar' },
    { pattern: 'bebek|çocuk|oyuncak|lego|puzzle|mama|peluş', cat: 'Anne & Çocuk' },
    { pattern: 'koşu|dambıl|yoga|bisiklet|kamp|fitness|tenis|protein|spor', cat: 'Spor & Outdoor' },
    { pattern: 'bal|peynir|zeytin|kahve|çay|baklava|sucuk|lokum|tahin|baharat|nar', cat: 'Süpermarket' },
    { pattern: 'koltuk|masa|sandalye|halı|perde|aydınlatma|vazo|mum|tencere|mutfak|seramik|bahçe|dekoratif|LED', cat: 'Ev & Yaşam' },
    { pattern: 'elbise|bluz|gömlek|pantolon|ceket|hırka|triko|kazak|palto|mont', cat: 'Kadın' },
  ];

  for (const np of namePatterns) {
    await ds.query(`
      UPDATE products
      SET categories = categories || $1::jsonb
      WHERE NOT (categories @> $1::jsonb)
        AND NOT EXISTS (
          SELECT 1 FROM jsonb_array_elements_text(categories) c WHERE c = ANY($2::text[])
        )
        AND LOWER(name) ~* $3
    `, [JSON.stringify([np.cat]), TARGET_CATEGORIES, np.pattern]);
  }

  // Final fallback: anything still without a target category → Ev & Yaşam
  await ds.query(`
    UPDATE products
    SET categories = categories || '["Ev & Yaşam"]'::jsonb
    WHERE NOT EXISTS (
      SELECT 1 FROM jsonb_array_elements_text(categories) c WHERE c = ANY($1::text[])
    )
  `, [TARGET_CATEGORIES]);

  // Step 1d: Split "Kadın" tagged clothing — assign ~half to "Erkek"
  // Get IDs of products in Kadın that don't have gender-specific keywords
  console.log('Splitting generic clothing between Kadın and Erkek...');

  // Products that have "Kadın" but name suggests Erkek
  await ds.query(`
    UPDATE products
    SET categories = (
      SELECT jsonb_agg(CASE WHEN c = 'Kadın' THEN 'Erkek' ELSE c END)
      FROM jsonb_array_elements_text(categories) c
    )
    WHERE categories @> '"Kadın"'::jsonb
      AND LOWER(name) ~* 'erkek|bay|polo|boxer|kravat|tıraş|takım elbise'
  `);

  // For remaining generic Kadın products, alternate ~half to Erkek using modulo on id hash
  await ds.query(`
    UPDATE products
    SET categories = (
      SELECT jsonb_agg(CASE WHEN c = 'Kadın' THEN 'Erkek' ELSE c END)
      FROM jsonb_array_elements_text(categories) c
    )
    WHERE categories @> '"Kadın"'::jsonb
      AND NOT categories @> '"Erkek"'::jsonb
      AND NOT LOWER(name) ~* 'kadın|bayan|elbise|bluz|etek|ruj|rimel|fondöten|makyaj|toka|topuklu|babet|sütyen|gecelik'
      AND ('x' || substr(md5(id::text), 1, 8))::bit(32)::int % 2 = 0
  `);

  // ==========================================
  // STEP 2: Remap store categories
  // ==========================================
  console.log('\n=== STEP 2: Batch remap store categories ===');

  await ds.query(`
    UPDATE stores s
    SET categories = sub.new_cats
    FROM (
      SELECT s2.id,
        (
          SELECT jsonb_agg(DISTINCT mapped)
          FROM (
            SELECT COALESCE(cm.new_cat, oc.val) as mapped
            FROM jsonb_array_elements_text(s2.categories) as oc(val)
            LEFT JOIN cat_map cm ON cm.old_cat = oc.val
          ) t
          WHERE mapped = ANY($1::text[])
        ) as new_cats
      FROM stores s2
    ) sub
    WHERE s.id = sub.id AND sub.new_cats IS NOT NULL
  `, [TARGET_CATEGORIES]);

  // Stores with no target category → use their products' categories
  await ds.query(`
    UPDATE stores s
    SET categories = COALESCE(
      (
        SELECT jsonb_agg(DISTINCT cat)
        FROM products p, jsonb_array_elements_text(p.categories) cat
        WHERE p."storeId" = s.id AND cat = ANY($1::text[])
      ),
      '["Ev & Yaşam"]'::jsonb
    )
    WHERE NOT EXISTS (
      SELECT 1 FROM jsonb_array_elements_text(s.categories) c WHERE c = ANY($1::text[])
    )
  `, [TARGET_CATEGORIES]);

  console.log('Store categories updated');

  // ==========================================
  // STEP 3: Check coverage and create new products if needed
  // ==========================================
  console.log('\n=== STEP 3: Category coverage ===');

  const catCounts = await ds.query(`
    SELECT cat, COUNT(*) as cnt
    FROM products, jsonb_array_elements_text(categories) as cat
    WHERE cat = ANY($1::text[])
    GROUP BY cat ORDER BY cnt DESC
  `, [TARGET_CATEGORIES]);

  const countMap: Record<string, number> = {};
  for (const cat of TARGET_CATEGORIES) countMap[cat] = 0;
  for (const row of catCounts) countMap[row.cat] = parseInt(row.cnt);
  for (const cat of TARGET_CATEGORIES) console.log(`  ${cat}: ${countMap[cat]} products`);

  // ==========================================
  // STEP 4: Create products for thin categories
  // ==========================================
  const MIN_PRODUCTS = 15;
  const thinCats = TARGET_CATEGORIES.filter(c => countMap[c] < MIN_PRODUCTS);

  if (thinCats.length > 0) {
    console.log(`\n=== STEP 4: Creating products for thin categories: ${thinCats.join(', ')} ===`);

    const newProductDefs: Record<string, Array<{ name: string; desc: string; price: number; sale?: number; tags: string[] }>> = {
      'Kadın': [
        { name: 'Kadın Yazlık Elbise Çiçek Desenli', desc: 'Şık ve rahat yazlık elbise', price: 349.90, sale: 249.90, tags: ['kadın', 'elbise', 'yazlık', 'giyim'] },
        { name: 'Kadın Deri Ceket Siyah', desc: 'Gerçek deri slim fit kadın ceket', price: 1299.90, tags: ['kadın', 'ceket', 'deri', 'giyim'] },
        { name: 'Kadın Beyaz Bluz Pamuklu', desc: 'Pamuklu beyaz bluz, ofis şıklığı', price: 199.90, sale: 149.90, tags: ['kadın', 'bluz', 'giyim'] },
        { name: 'Kadın Yüksek Bel Kot Pantolon', desc: 'Yüksek bel skinny jean', price: 399.90, sale: 299.90, tags: ['kadın', 'kot', 'pantolon', 'giyim'] },
        { name: 'Kadın Triko Kazak Oversize', desc: 'Yumuşak yün karışımlı triko kazak', price: 279.90, tags: ['kadın', 'kazak', 'triko', 'giyim'] },
        { name: 'Kadın Saten Pijama Takımı', desc: 'Saten pijama takımı, şık ve rahat', price: 249.90, tags: ['kadın', 'pijama', 'iç giyim'] },
        { name: 'Kadın Kaşmir Şal Yaka Hırka', desc: 'Oversize şal yaka kaşmir hırka', price: 459.90, sale: 359.90, tags: ['kadın', 'hırka', 'kaşmir', 'giyim'] },
        { name: 'Kadın Spor Tayt Yüksek Bel', desc: 'Nefes alan kumaş yüksek bel spor tayt', price: 189.90, sale: 139.90, tags: ['kadın', 'tayt', 'spor'] },
        { name: 'Kadın Pilili Midi Etek', desc: 'Pilili midi etek, zarif ve şık', price: 259.90, tags: ['kadın', 'etek', 'giyim'] },
        { name: 'Kadın Trençkot Bej', desc: 'Klasik bej trençkot, su itici kumaş', price: 899.90, sale: 699.90, tags: ['kadın', 'trençkot', 'dış giyim'] },
      ],
      'Erkek': [
        { name: 'Erkek Slim Fit Gömlek Mavi', desc: 'Pamuklu slim fit erkek gömlek', price: 249.90, sale: 179.90, tags: ['erkek', 'gömlek', 'giyim'] },
        { name: 'Erkek Hakiki Deri Cüzdan', desc: 'RFID korumalı hakiki deri cüzdan', price: 349.90, sale: 249.90, tags: ['erkek', 'cüzdan', 'deri', 'aksesuar'] },
        { name: 'Erkek Chino Pantolon Bej', desc: 'Slim fit chino pantolon', price: 329.90, sale: 249.90, tags: ['erkek', 'pantolon', 'giyim'] },
        { name: 'Erkek Bomber Ceket Lacivert', desc: 'Su geçirmez bomber ceket', price: 599.90, sale: 449.90, tags: ['erkek', 'ceket', 'giyim'] },
        { name: 'Erkek Polo Yaka Tişört', desc: 'Pamuklu polo yaka tişört', price: 179.90, sale: 129.90, tags: ['erkek', 'tişört', 'giyim'] },
        { name: 'Erkek İtalyan Takım Elbise', desc: 'İtalyan kumaş slim fit takım elbise', price: 2499.90, sale: 1899.90, tags: ['erkek', 'takım elbise', 'giyim'] },
        { name: 'Erkek Eşofman Takımı Antrasit', desc: 'Pamuklu eşofman takımı', price: 449.90, sale: 349.90, tags: ['erkek', 'eşofman', 'spor'] },
        { name: 'Erkek Keten Şort Yazlık', desc: 'Yazlık keten şort, rahat kesim', price: 199.90, tags: ['erkek', 'şort', 'giyim'] },
        { name: 'Erkek Deri Mont Kahverengi', desc: 'Hakiki deri erkek mont', price: 1599.90, sale: 1199.90, tags: ['erkek', 'mont', 'dış giyim'] },
        { name: 'Erkek Yün Kazak V Yaka', desc: 'Merino yün V yaka kazak', price: 399.90, tags: ['erkek', 'kazak', 'giyim'] },
      ],
      'Anne & Çocuk': [
        { name: 'Bebek Arabası Travel Sistem', desc: 'Travel sistem bebek arabası 0-36 ay', price: 4999.90, sale: 3999.90, tags: ['bebek', 'araba', 'anne'] },
        { name: 'Bebek Bezi Mega Paket 120 Adet', desc: '120 adet bebek bezi, 3 numara', price: 449.90, sale: 349.90, tags: ['bebek', 'bezi', 'hijyen'] },
        { name: 'Çocuk Eğitici Tablet 3-8 Yaş', desc: 'Eğitici içerikli çocuk tableti', price: 1299.90, sale: 999.90, tags: ['çocuk', 'tablet', 'eğitici'] },
        { name: 'Hamile Yastığı U Şekil', desc: 'U şekil hamile destek yastığı', price: 349.90, tags: ['hamile', 'yastık', 'anne'] },
        { name: 'Katlanır Mama Sandalyesi', desc: 'Katlanabilir mama sandalyesi 6+ ay', price: 899.90, sale: 699.90, tags: ['mama', 'sandalye', 'bebek'] },
        { name: 'Çocuk Pijama Takımı Organik', desc: 'Organik pamuk çocuk pijama', price: 149.90, sale: 99.90, tags: ['çocuk', 'pijama', 'organik'] },
        { name: 'Lego Classic 1000 Parça', desc: 'Lego Classic yaratıcı kutu', price: 699.90, sale: 549.90, tags: ['lego', 'oyuncak', 'çocuk'] },
        { name: 'Bebek Bakım Çantası Çok Gözlü', desc: 'Çok gözlü bebek bakım çantası', price: 399.90, sale: 299.90, tags: ['bebek', 'çanta', 'bakım'] },
        { name: 'Çocuk Bisikleti 16 Jant', desc: 'Çocuk bisikleti, yardımcı tekerlekli', price: 1899.90, sale: 1499.90, tags: ['çocuk', 'bisiklet', 'spor'] },
        { name: 'Bebek Biberon Seti Anti-Kolik', desc: '3lü anti-kolik biberon seti', price: 249.90, tags: ['bebek', 'biberon', 'beslenme'] },
      ],
      'Ayakkabı & Çanta': [
        { name: 'Kadın Topuklu Stiletto Siyah', desc: 'Siyah süet stiletto 8cm topuk', price: 599.90, sale: 449.90, tags: ['topuklu', 'stiletto', 'kadın', 'ayakkabı'] },
        { name: 'Erkek Deri Klasik Ayakkabı', desc: 'El yapımı hakiki deri klasik ayakkabı', price: 899.90, sale: 699.90, tags: ['klasik', 'deri', 'erkek', 'ayakkabı'] },
        { name: 'Unisex Beyaz Sneaker', desc: 'Günlük beyaz sneaker, hafif taban', price: 449.90, sale: 349.90, tags: ['sneaker', 'beyaz', 'günlük', 'ayakkabı'] },
        { name: 'Kadın Deri Omuz Çantası', desc: 'Hakiki deri kadın omuz çantası', price: 799.90, sale: 599.90, tags: ['omuz çantası', 'deri', 'kadın', 'çanta'] },
        { name: 'Laptop Sırt Çantası USB', desc: 'Su geçirmez laptop sırt çantası USB girişli', price: 349.90, sale: 269.90, tags: ['sırt çantası', 'laptop', 'çanta'] },
        { name: 'Kadın Yazlık Sandalet Deri', desc: 'Deri yazlık sandalet bej renk', price: 299.90, sale: 219.90, tags: ['sandalet', 'yazlık', 'kadın', 'ayakkabı'] },
        { name: '3lü ABS Valiz Seti', desc: '3 parça ABS valiz seti 360 derece tekerlekli', price: 1499.90, sale: 999.90, tags: ['valiz', 'seyahat', 'çanta'] },
        { name: 'Kadın Babet Nude Düz Taban', desc: 'Yumuşak deri babet nude renk', price: 249.90, tags: ['babet', 'düz taban', 'kadın', 'ayakkabı'] },
        { name: 'Erkek Deri Bot Kışlık', desc: 'Su geçirmez hakiki deri erkek bot', price: 699.90, sale: 549.90, tags: ['bot', 'deri', 'erkek', 'ayakkabı'] },
        { name: 'Kadın El Çantası Clutch', desc: 'Saten clutch el çantası, gece', price: 399.90, sale: 299.90, tags: ['clutch', 'el çantası', 'kadın', 'çanta'] },
      ],
      'Saat & Aksesuar': [
        { name: 'Erkek Otomatik Kol Saati', desc: 'Otomatik mekanizma safir cam erkek kol saati', price: 2999.90, sale: 2299.90, tags: ['saat', 'otomatik', 'erkek'] },
        { name: 'Kadın 14 Ayar Altın Kolye', desc: '14 ayar altın ince zincir kolye', price: 1899.90, tags: ['kolye', 'altın', 'kadın', 'takı'] },
        { name: 'Polarize Güneş Gözlüğü UV400', desc: 'UV400 polarize güneş gözlüğü unisex', price: 349.90, sale: 249.90, tags: ['güneş gözlüğü', 'polarize', 'aksesuar'] },
        { name: 'Kadın 5li Bileklik Seti Altın', desc: '5li altın kaplama bileklik seti', price: 199.90, sale: 149.90, tags: ['bileklik', 'set', 'kadın', 'takı'] },
        { name: 'Akıllı Saat GPS SpO2 Nabız', desc: 'SpO2 nabız ölçer GPS akıllı saat', price: 1299.90, sale: 999.90, tags: ['akıllı saat', 'fitness', 'teknoloji'] },
        { name: 'Erkek Hakiki Deri Kemer', desc: 'Hakiki deri erkek kemer otomatik toka', price: 249.90, sale: 179.90, tags: ['kemer', 'deri', 'erkek', 'aksesuar'] },
        { name: 'Kadın Tek Taş Pırlanta Küpe', desc: 'Tek taş pırlanta küpe 0.10 karat', price: 3499.90, tags: ['küpe', 'pırlanta', 'kadın', 'takı'] },
        { name: 'Erkek 925 Gümüş Yüzük', desc: '925 ayar gümüş erkek yüzük', price: 299.90, sale: 229.90, tags: ['yüzük', 'gümüş', 'erkek', 'takı'] },
        { name: 'Kadın Dijital Kol Saati Rose', desc: 'Rose gold dijital kadın kol saati', price: 799.90, sale: 599.90, tags: ['saat', 'dijital', 'kadın'] },
        { name: 'Unisex Deri Kartlık RFID', desc: 'RFID korumalı hakiki deri kartlık', price: 149.90, sale: 99.90, tags: ['kartlık', 'deri', 'aksesuar'] },
      ],
    };

    for (const cat of thinCats) {
      const prods = newProductDefs[cat];
      if (!prods) continue;

      // Find stores matching this category
      let storeIds = await ds.query(
        `SELECT id FROM stores WHERE categories @> $1::jsonb LIMIT 10`,
        [JSON.stringify([cat])],
      );

      if (storeIds.length === 0) {
        // Assign category to random stores
        storeIds = await ds.query('SELECT id, categories FROM stores ORDER BY RANDOM() LIMIT 5');
        for (const s of storeIds) {
          const cats: string[] = s.categories || [];
          if (!cats.includes(cat)) {
            cats.push(cat);
            await ds.query('UPDATE stores SET categories = $1 WHERE id = $2', [JSON.stringify(cats), s.id]);
          }
        }
      }

      // Batch insert
      const values: string[] = [];
      const params: any[] = [];
      let idx = 1;

      for (let i = 0; i < prods.length; i++) {
        const p = prods[i];
        const storeId = storeIds[i % storeIds.length].id;
        const slug = p.name.toLowerCase()
          .replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ğ/g, 'g')
          .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ü/g, 'u')
          .replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
          + '-' + Math.random().toString(36).slice(2, 6);

        values.push(`($${idx}, $${idx+1}, $${idx+2}, $${idx+3}, $${idx+4}, 'TRY', $${idx+5}::jsonb, $${idx+6}::jsonb, $${idx+7}, ${Math.floor(Math.random()*200)+10}, true, ${Math.random()>0.5}, ${(3.5+Math.random()*1.5).toFixed(1)}, ${Math.floor(Math.random()*500)+10}, '[]'::jsonb)`);
        params.push(p.name, slug, p.desc, p.price, p.sale || null, JSON.stringify([cat, ...p.tags.slice(0,2)]), JSON.stringify(p.tags), storeId);
        idx += 8;
      }

      await ds.query(`
        INSERT INTO products (name, slug, description, price, "salePrice", currency, categories, tags, "storeId", "stockQuantity", "isActive", "isFeatured", "ratingAverage", "ratingCount", images)
        VALUES ${values.join(',')}
      `, params);

      console.log(`  ${cat}: created ${prods.length} new products`);
    }
  }

  // ==========================================
  // STEP 5: Update store productsCount
  // ==========================================
  await ds.query(`
    UPDATE stores s SET "productsCount" = (
      SELECT COUNT(*) FROM products p WHERE p."storeId" = s.id AND p."isActive" = true
    )
  `);

  // ==========================================
  // FINAL: Verification
  // ==========================================
  console.log('\n=== FINAL PRODUCT DISTRIBUTION ===');
  const finalCats = await ds.query(`
    SELECT cat, COUNT(*) as cnt
    FROM products, jsonb_array_elements_text(categories) as cat
    WHERE cat = ANY($1::text[])
    GROUP BY cat ORDER BY cnt DESC
  `, [TARGET_CATEGORIES]);
  for (const row of finalCats) console.log(`  ${row.cat}: ${row.cnt} products`);

  console.log('\n=== FINAL STORE DISTRIBUTION ===');
  const finalStoreCats = await ds.query(`
    SELECT cat, COUNT(*) as cnt
    FROM stores, jsonb_array_elements_text(categories) as cat
    WHERE cat = ANY($1::text[])
    GROUP BY cat ORDER BY cnt DESC
  `, [TARGET_CATEGORIES]);
  for (const row of finalStoreCats) console.log(`  ${row.cat}: ${row.cnt} stores`);

  const tc = await ds.query('SELECT COUNT(*) as cnt FROM products');
  const ts = await ds.query('SELECT COUNT(*) as cnt FROM stores');
  console.log(`\nTotal: ${tc[0].cnt} products, ${ts[0].cnt} stores`);

  await ds.destroy();
  console.log('\nDone!');
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
