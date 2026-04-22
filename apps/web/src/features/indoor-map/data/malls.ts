/**
 * ─── AVM VERİ YAPISI ─────────────────────────────────────────
 *
 * Her AVM şu bilgileri içerir:
 *   - id, name, address: Kimlik bilgileri
 *   - center: Haritada AVM'nin merkez noktası [lng, lat]
 *   - bounds: Kat planı görselinin haritaya yerleştirileceği köşe koordinatları
 *   - floors: Katlar dizisi
 *     - Her kat: level, name ve stores dizisi
 *       - Her mağaza: name, tıklanabilir poligon köşe koordinatları [lng, lat][]
 *
 * ÖNEMLI: Poligon koordinatları [longitude, latitude] sırasında —
 *         Azure Maps ve GeoJSON standardı bu sırayı kullanır.
 *
 * Koordinat üretme mantığı:
 *   AVM binasının gerçek sınırları (bounds) belirlenir.
 *   Mağazalar bu sınırlar içinde grid şeklinde yerleştirilir.
 *   Her mağaza ~20m x ~15m boyutunda bir dikdörtgen poligondur.
 */

// ─── Tip tanımları ───

export interface StorePolygon {
  /** Mağaza adı */
  name: string;
  /** Mağaza kategorisi (giyim, elektronik, yemek vb.) */
  type: string;
  /** Poligon köşe koordinatları — [lng, lat][] — kapalı ring (ilk=son) */
  coordinates: [number, number][];
  /** Poligon rengi */
  color: string;
}

export interface Floor {
  /** Kat numarası (0=zemin, 1=1.kat, -1=bodrum) */
  level: number;
  /** Kat adı */
  name: string;
  /** Bu kattaki mağazalar */
  stores: StorePolygon[];
}

export interface Mall {
  id: string;
  name: string;
  address: string;
  /** Haritada AVM merkezi [lng, lat] */
  center: [number, number];
  /**
   * Bina dış sınır poligonu — [lng, lat][]
   * Haritada kalın çizgiyle çizilir
   */
  outline: [number, number][];
  /** Katlar */
  floors: Floor[];
}

// ─── Yardımcı: Grid mağaza üretici ───

/**
 * Bir AVM binasının sınırları içinde mağazaları grid olarak yerleştirir.
 *
 * @param west   Binanın batı sınırı (longitude)
 * @param east   Binanın doğu sınırı
 * @param south  Binanın güney sınırı (latitude)
 * @param north  Binanın kuzey sınırı
 * @param names  Mağaza adları ve tipleri
 * @param cols   Grid sütun sayısı
 */
function buildStoreGrid(
  west: number, east: number, south: number, north: number,
  names: { name: string; type: string; color: string }[],
  cols = 4,
): StorePolygon[] {
  const rows = Math.ceil(names.length / cols);
  // Her hücrenin boyutu
  const cellW = (east - west) / cols;
  const cellH = (north - south) / rows;
  // Mağaza poligonu hücrenin %80'ini kaplar (kenar boşluğu)
  const padX = cellW * 0.1;
  const padY = cellH * 0.1;

  return names.map((item, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);

    // Hücrenin sol-alt köşesi
    const x0 = west + col * cellW + padX;
    const y0 = north - (row + 1) * cellH + padY;
    // Hücrenin sağ-üst köşesi
    const x1 = west + (col + 1) * cellW - padX;
    const y1 = north - row * cellH - padY;

    return {
      name: item.name,
      type: item.type,
      color: item.color,
      // Kapalı dikdörtgen poligon: 5 nokta (ilk = son)
      coordinates: [
        [x0, y1], // sol-üst
        [x1, y1], // sağ-üst
        [x1, y0], // sağ-alt
        [x0, y0], // sol-alt
        [x0, y1], // kapanış
      ],
    };
  });
}

// ─── AVM Verileri ───

// Renk paleti
const C = {
  giyim: '#3b82f6',
  elektronik: '#8b5cf6',
  market: '#10b981',
  yemek: '#ef4444',
  kafe: '#f59e0b',
  kozmetik: '#ec4899',
  sinema: '#6366f1',
  spor: '#14b8a6',
  aksesuar: '#f97316',
  ev: '#0ea5e9',
  kitap: '#a855f7',
  lüks: '#b45309',
};

export const MALLS: Mall[] = [
  // ────────────────────────────────────────────────
  // 1. CEVAHİR AVM (Şişli)
  // ────────────────────────────────────────────────
  {
    id: 'cevahir',
    name: 'Cevahir AVM',
    address: 'Büyükdere Cad. No:22, Şişli',
    center: [28.993056, 41.062778],
    outline: [
      [28.99180, 41.06410], [28.99420, 41.06410],
      [28.99420, 41.06310], [28.99370, 41.06310],
      [28.99370, 41.06150], [28.99180, 41.06150],
      [28.99180, 41.06410],
    ],
    floors: [
      {
        level: 1, name: '1. Kat',
        stores: buildStoreGrid(28.99190, 28.99410, 41.06160, 41.06400, [
          { name: 'Koton', type: 'giyim', color: C.giyim },
          { name: 'Zara', type: 'giyim', color: C.giyim },
          { name: 'Starbucks', type: 'kafe', color: C.kafe },
          { name: 'Pandora', type: 'aksesuar', color: C.aksesuar },
          { name: 'D&R', type: 'kitap', color: C.kitap },
          { name: 'Watsons', type: 'kozmetik', color: C.kozmetik },
          { name: 'Swarovski', type: 'aksesuar', color: C.aksesuar },
          { name: 'Flo', type: 'giyim', color: C.giyim },
        ]),
      },
      {
        level: 2, name: '2. Kat',
        stores: buildStoreGrid(28.99190, 28.99410, 41.06160, 41.06400, [
          { name: 'Boyner', type: 'giyim', color: C.giyim },
          { name: 'Kahve Dünyası', type: 'kafe', color: C.kafe },
          { name: 'Big Chefs', type: 'yemek', color: C.yemek },
          { name: 'Mado', type: 'yemek', color: C.yemek },
          { name: 'SushiCo', type: 'yemek', color: C.yemek },
          { name: 'HD İskender', type: 'yemek', color: C.yemek },
        ]),
      },
      {
        level: 3, name: '3. Kat (Yeme-İçme)',
        stores: buildStoreGrid(28.99190, 28.99410, 41.06160, 41.06400, [
          { name: 'KFC', type: 'yemek', color: C.yemek },
          { name: 'Burger King', type: 'yemek', color: C.yemek },
          { name: 'McDonald\'s', type: 'yemek', color: C.yemek },
          { name: 'Popeyes', type: 'yemek', color: C.yemek },
          { name: 'Sbarro', type: 'yemek', color: C.yemek },
          { name: 'Teknosa', type: 'elektronik', color: C.elektronik },
          { name: 'Toyzz Shop', type: 'ev', color: C.ev },
          { name: 'Carl\'s Jr.', type: 'yemek', color: C.yemek },
        ]),
      },
      {
        level: 5, name: '5. Kat (Moda)',
        stores: buildStoreGrid(28.99190, 28.99410, 41.06160, 41.06400, [
          { name: 'Zara', type: 'giyim', color: C.giyim },
          { name: 'LC Waikiki', type: 'giyim', color: C.giyim },
          { name: 'Mango', type: 'giyim', color: C.giyim },
          { name: 'GAP', type: 'giyim', color: C.giyim },
          { name: 'Massimo Dutti', type: 'lüks', color: C.lüks },
          { name: 'MAC', type: 'kozmetik', color: C.kozmetik },
          { name: 'Victoria\'s Secret', type: 'giyim', color: C.giyim },
          { name: 'Defacto', type: 'giyim', color: C.giyim },
        ]),
      },
      {
        level: 6, name: '6. Kat (Ev & Teknoloji)',
        stores: buildStoreGrid(28.99190, 28.99410, 41.06160, 41.06400, [
          { name: 'Sephora', type: 'kozmetik', color: C.kozmetik },
          { name: 'Migros', type: 'market', color: C.market },
          { name: 'Samsung', type: 'elektronik', color: C.elektronik },
          { name: 'Koçtaş', type: 'ev', color: C.ev },
          { name: 'Decathlon', type: 'spor', color: C.spor },
          { name: 'Gratis', type: 'kozmetik', color: C.kozmetik },
          { name: 'MAC Fit', type: 'spor', color: C.spor },
          { name: 'Arçelik', type: 'elektronik', color: C.elektronik },
        ]),
      },
    ],
  },

  // ────────────────────────────────────────────────
  // 2. FORUM İSTANBUL (Bayrampaşa)
  // ────────────────────────────────────────────────
  {
    id: 'forum-istanbul',
    name: 'Forum İstanbul',
    address: 'Kocatepe Mah. Paşa Cad., Bayrampaşa',
    center: [28.8895, 41.0397],
    outline: [
      [28.8878, 41.0412], [28.8912, 41.0412],
      [28.8912, 41.0382], [28.8878, 41.0382],
      [28.8878, 41.0412],
    ],
    floors: [
      {
        level: 0, name: 'Zemin Kat',
        stores: buildStoreGrid(28.8880, 28.8910, 41.0384, 41.0410, [
          { name: 'Zara', type: 'giyim', color: C.giyim },
          { name: 'H&M', type: 'giyim', color: C.giyim },
          { name: 'LC Waikiki', type: 'giyim', color: C.giyim },
          { name: 'Migros', type: 'market', color: C.market },
          { name: 'Starbucks', type: 'kafe', color: C.kafe },
          { name: 'Burger King', type: 'yemek', color: C.yemek },
          { name: 'Boyner', type: 'giyim', color: C.giyim },
          { name: 'Gratis', type: 'kozmetik', color: C.kozmetik },
        ]),
      },
      {
        level: 1, name: '1. Kat',
        stores: buildStoreGrid(28.8880, 28.8910, 41.0384, 41.0410, [
          { name: 'MediaMarkt', type: 'elektronik', color: C.elektronik },
          { name: 'Nike', type: 'spor', color: C.spor },
          { name: 'Adidas', type: 'spor', color: C.spor },
          { name: 'Sephora', type: 'kozmetik', color: C.kozmetik },
          { name: 'Watsons', type: 'kozmetik', color: C.kozmetik },
          { name: 'Apple Store', type: 'elektronik', color: C.elektronik },
        ]),
      },
      {
        level: 2, name: '2. Kat',
        stores: buildStoreGrid(28.8880, 28.8910, 41.0384, 41.0410, [
          { name: 'Cinemaximum', type: 'sinema', color: C.sinema },
          { name: 'KFC', type: 'yemek', color: C.yemek },
          { name: 'Popeyes', type: 'yemek', color: C.yemek },
          { name: 'Toyzz Shop', type: 'ev', color: C.ev },
        ]),
      },
    ],
  },

  // ────────────────────────────────────────────────
  // 3. ZORLU CENTER (Beşiktaş)
  // ────────────────────────────────────────────────
  {
    id: 'zorlu',
    name: 'Zorlu Center',
    address: 'Levazım Mah. Koru Sok., Beşiktaş',
    center: [29.0165, 41.0672],
    outline: [
      [29.0148, 41.0686], [29.0182, 41.0686],
      [29.0182, 41.0658], [29.0148, 41.0658],
      [29.0148, 41.0686],
    ],
    floors: [
      {
        level: 0, name: 'Zemin Kat',
        stores: buildStoreGrid(29.0150, 29.0180, 41.0660, 41.0684, [
          { name: 'Apple Store', type: 'elektronik', color: C.elektronik },
          { name: 'Beymen', type: 'lüks', color: C.lüks },
          { name: 'Vakko', type: 'lüks', color: C.lüks },
          { name: 'Louis Vuitton', type: 'lüks', color: C.lüks },
          { name: 'Nusret', type: 'yemek', color: C.yemek },
          { name: 'Lacoste', type: 'giyim', color: C.giyim },
        ]),
      },
      {
        level: 1, name: '1. Kat',
        stores: buildStoreGrid(29.0150, 29.0180, 41.0660, 41.0684, [
          { name: 'Zara', type: 'giyim', color: C.giyim },
          { name: 'Massimo Dutti', type: 'giyim', color: C.giyim },
          { name: 'COS', type: 'giyim', color: C.giyim },
          { name: 'The North Face', type: 'spor', color: C.spor },
        ]),
      },
    ],
  },

  // ────────────────────────────────────────────────
  // 4. İSTİNYE PARK (Sarıyer)
  // ────────────────────────────────────────────────
  {
    id: 'istinye',
    name: 'İstinye Park',
    address: 'İstinye Bayırı Cad. No:73, Sarıyer',
    center: [29.0590, 41.1147],
    outline: [
      [29.0573, 41.1162], [29.0607, 41.1162],
      [29.0607, 41.1132], [29.0573, 41.1132],
      [29.0573, 41.1162],
    ],
    floors: [
      {
        level: 0, name: 'Zemin Kat',
        stores: buildStoreGrid(29.0575, 29.0605, 41.1134, 41.1160, [
          { name: 'Louis Vuitton', type: 'lüks', color: C.lüks },
          { name: 'Gucci', type: 'lüks', color: C.lüks },
          { name: 'Dior', type: 'lüks', color: C.lüks },
          { name: 'Harvey Nichols', type: 'lüks', color: C.lüks },
          { name: 'Beymen', type: 'lüks', color: C.lüks },
          { name: 'Macrocenter', type: 'market', color: C.market },
        ]),
      },
      {
        level: 1, name: '1. Kat',
        stores: buildStoreGrid(29.0575, 29.0605, 41.1134, 41.1160, [
          { name: 'Zara', type: 'giyim', color: C.giyim },
          { name: 'Apple Store', type: 'elektronik', color: C.elektronik },
          { name: 'Tommy Hilfiger', type: 'giyim', color: C.giyim },
          { name: 'Tiffany & Co', type: 'aksesuar', color: C.aksesuar },
          { name: 'MAC', type: 'kozmetik', color: C.kozmetik },
          { name: 'Wagamama', type: 'yemek', color: C.yemek },
        ]),
      },
    ],
  },

  // ────────────────────────────────────────────────
  // 5. KANYON (Levent)
  // ────────────────────────────────────────────────
  {
    id: 'kanyon',
    name: 'Kanyon',
    address: 'Büyükdere Cad. No:185, Levent',
    center: [29.0112, 41.0792],
    outline: [
      [29.0098, 41.0804], [29.0126, 41.0804],
      [29.0126, 41.0780], [29.0098, 41.0780],
      [29.0098, 41.0804],
    ],
    floors: [
      {
        level: 0, name: 'Zemin Kat',
        stores: buildStoreGrid(29.0100, 29.0124, 41.0782, 41.0802, [
          { name: 'Harvey Nichols', type: 'lüks', color: C.lüks },
          { name: 'Vakko', type: 'lüks', color: C.lüks },
          { name: 'Beymen', type: 'lüks', color: C.lüks },
          { name: 'Starbucks', type: 'kafe', color: C.kafe },
        ]),
      },
      {
        level: 1, name: '1. Kat',
        stores: buildStoreGrid(29.0100, 29.0124, 41.0782, 41.0802, [
          { name: 'Zara', type: 'giyim', color: C.giyim },
          { name: 'H&M', type: 'giyim', color: C.giyim },
          { name: 'Mango', type: 'giyim', color: C.giyim },
          { name: 'COS', type: 'giyim', color: C.giyim },
        ]),
      },
    ],
  },

  // ────────────────────────────────────────────────
  // 6. MALL OF İSTANBUL (Başakşehir)
  // ────────────────────────────────────────────────
  {
    id: 'mall-of-istanbul',
    name: 'Mall of İstanbul',
    address: 'Süleyman Demirel Blv., Başakşehir',
    center: [28.8075, 41.0625],
    outline: [
      [28.8053, 41.0643], [28.8097, 41.0643],
      [28.8097, 41.0607], [28.8053, 41.0607],
      [28.8053, 41.0643],
    ],
    floors: [
      {
        level: 0, name: 'Zemin Kat',
        stores: buildStoreGrid(28.8055, 28.8095, 41.0609, 41.0641, [
          { name: 'Zara', type: 'giyim', color: C.giyim },
          { name: 'H&M', type: 'giyim', color: C.giyim },
          { name: 'LC Waikiki', type: 'giyim', color: C.giyim },
          { name: 'Migros', type: 'market', color: C.market },
          { name: 'Starbucks', type: 'kafe', color: C.kafe },
          { name: 'Koton', type: 'giyim', color: C.giyim },
          { name: 'Mavi', type: 'giyim', color: C.giyim },
          { name: 'Gratis', type: 'kozmetik', color: C.kozmetik },
        ]),
      },
      {
        level: 1, name: '1. Kat',
        stores: buildStoreGrid(28.8055, 28.8095, 41.0609, 41.0641, [
          { name: 'MediaMarkt', type: 'elektronik', color: C.elektronik },
          { name: 'Nike', type: 'spor', color: C.spor },
          { name: 'Adidas', type: 'spor', color: C.spor },
          { name: 'Sephora', type: 'kozmetik', color: C.kozmetik },
          { name: 'Boyner', type: 'giyim', color: C.giyim },
          { name: 'Decathlon', type: 'spor', color: C.spor },
        ]),
      },
      {
        level: 2, name: '2. Kat',
        stores: buildStoreGrid(28.8055, 28.8095, 41.0609, 41.0641, [
          { name: 'Cinemaximum', type: 'sinema', color: C.sinema },
          { name: 'Legoland', type: 'ev', color: C.ev },
          { name: 'KFC', type: 'yemek', color: C.yemek },
          { name: 'Burger King', type: 'yemek', color: C.yemek },
        ]),
      },
    ],
  },

  // ────────────────────────────────────────────────
  // 7. AKASYA AVM (Üsküdar)
  // ────────────────────────────────────────────────
  {
    id: 'akasya',
    name: 'Akasya AVM',
    address: 'Acıbadem Mah. Çeçen Sok., Üsküdar',
    center: [29.0455, 41.0035],
    outline: [
      [29.0438, 41.0050], [29.0472, 41.0050],
      [29.0472, 41.0020], [29.0438, 41.0020],
      [29.0438, 41.0050],
    ],
    floors: [
      {
        level: 0, name: 'Zemin Kat',
        stores: buildStoreGrid(29.0440, 29.0470, 41.0022, 41.0048, [
          { name: 'Zara', type: 'giyim', color: C.giyim },
          { name: 'Mango', type: 'giyim', color: C.giyim },
          { name: 'Koton', type: 'giyim', color: C.giyim },
          { name: 'Carrefour', type: 'market', color: C.market },
          { name: 'Starbucks', type: 'kafe', color: C.kafe },
          { name: 'Espresso Lab', type: 'kafe', color: C.kafe },
        ]),
      },
      {
        level: 1, name: '1. Kat',
        stores: buildStoreGrid(29.0440, 29.0470, 41.0022, 41.0048, [
          { name: 'H&M', type: 'giyim', color: C.giyim },
          { name: 'Sephora', type: 'kozmetik', color: C.kozmetik },
          { name: 'Boyner', type: 'giyim', color: C.giyim },
          { name: 'Teknosa', type: 'elektronik', color: C.elektronik },
        ]),
      },
    ],
  },

  // ────────────────────────────────────────────────
  // 8. MARMARA FORUM (Bakırköy)
  // ────────────────────────────────────────────────
  {
    id: 'marmara-forum',
    name: 'Marmara Forum',
    address: 'Osmaniye Mah., Bakırköy',
    center: [28.8530, 40.9910],
    outline: [
      [28.8508, 40.9925], [28.8552, 40.9925],
      [28.8552, 40.9895], [28.8508, 40.9895],
      [28.8508, 40.9925],
    ],
    floors: [
      {
        level: 0, name: 'Zemin Kat',
        stores: buildStoreGrid(28.8510, 28.8550, 40.9897, 40.9923, [
          { name: 'Zara', type: 'giyim', color: C.giyim },
          { name: 'H&M', type: 'giyim', color: C.giyim },
          { name: 'LC Waikiki', type: 'giyim', color: C.giyim },
          { name: 'Migros', type: 'market', color: C.market },
          { name: 'Koton', type: 'giyim', color: C.giyim },
          { name: 'Mavi', type: 'giyim', color: C.giyim },
        ]),
      },
      {
        level: 1, name: '1. Kat',
        stores: buildStoreGrid(28.8510, 28.8550, 40.9897, 40.9923, [
          { name: 'MediaMarkt', type: 'elektronik', color: C.elektronik },
          { name: 'Nike', type: 'spor', color: C.spor },
          { name: 'Sephora', type: 'kozmetik', color: C.kozmetik },
          { name: 'Boyner', type: 'giyim', color: C.giyim },
        ]),
      },
    ],
  },
];
