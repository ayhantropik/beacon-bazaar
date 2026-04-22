/**
 * İstanbul Büyük AVM'lerin Verileri
 * Koordinatlar, bina sınırları, kat planları ve mağaza pozisyonları
 */

export interface MallStore {
  name: string;
  svgX: number; // 0-609 viewBox koordinatı
  svgY: number; // 0-707 viewBox koordinatı
}

export interface MallFloor {
  level: number;
  name: string;
  stores: MallStore[];
}

export interface MallData {
  id: string;
  name: string;
  address: string;
  center: { lat: number; lng: number };
  bounds: { west: number; east: number; south: number; north: number };
  buildingPolygon: [number, number][];
  floors: MallFloor[];
}

export const ISTANBUL_MALLS: MallData[] = [
  // ─── 1. Cevahir AVM ───
  {
    id: 'cevahir',
    name: 'Cevahir AVM',
    address: 'Büyükdere Cad. No:22, Şişli-Mecidiyeköy',
    center: { lat: 41.062778, lng: 28.993056 },
    bounds: { west: 28.99160, east: 28.99450, south: 41.06140, north: 41.06420 },
    buildingPolygon: [
      [28.99180, 41.06410], [28.99420, 41.06410], [28.99420, 41.06310],
      [28.99370, 41.06310], [28.99370, 41.06150], [28.99180, 41.06150], [28.99180, 41.06410],
    ],
    floors: [
      { level: 1, name: '1. Kat', stores: [
        { name: 'Koton', svgX: 157, svgY: 330 }, { name: 'Simit Sarayı', svgX: 240, svgY: 280 },
        { name: 'Starbucks', svgX: 503, svgY: 475 }, { name: 'Pandora', svgX: 480, svgY: 440 },
        { name: 'Defacto', svgX: 537, svgY: 388 }, { name: 'Zara', svgX: 378, svgY: 186 },
        { name: 'D&R', svgX: 439, svgY: 526 }, { name: 'Watsons', svgX: 386, svgY: 498 },
        { name: 'Marks&Spencer', svgX: 497, svgY: 294 }, { name: 'Jack&Jones', svgX: 424, svgY: 285 },
        { name: 'Levi\'s', svgX: 332, svgY: 419 }, { name: 'Swarovski', svgX: 342, svgY: 350 },
        { name: 'Flo', svgX: 249, svgY: 468 }, { name: 'LC Waikiki Kids', svgX: 198, svgY: 369 },
      ]},
      { level: 2, name: '2. Kat', stores: [
        { name: 'Boyner', svgX: 270, svgY: 346 }, { name: 'Kahve Dünyası', svgX: 290, svgY: 432 },
        { name: 'Big Chefs', svgX: 372, svgY: 557 }, { name: 'Mado', svgX: 519, svgY: 463 },
        { name: 'SushiCo', svgX: 410, svgY: 308 }, { name: 'HD İskender', svgX: 352, svgY: 302 },
        { name: 'Happy Moon\'s', svgX: 437, svgY: 345 },
      ]},
      { level: 3, name: '3. Kat (Yeme-İçme)', stores: [
        { name: 'KFC', svgX: 314, svgY: 453 }, { name: 'Burger King', svgX: 501, svgY: 519 },
        { name: 'McDonald\'s', svgX: 419, svgY: 384 }, { name: 'Popeyes', svgX: 430, svgY: 648 },
        { name: 'Teknosa', svgX: 361, svgY: 195 }, { name: 'Toyzz Shop', svgX: 357, svgY: 322 },
        { name: 'Sbarro', svgX: 432, svgY: 626 }, { name: 'Carl\'s Jr.', svgX: 516, svgY: 482 },
      ]},
      { level: 4, name: '4. Kat (Ayakkabı)', stores: [
        { name: 'Adidas', svgX: 439, svgY: 604 }, { name: 'Puma', svgX: 259, svgY: 595 },
        { name: 'Skechers', svgX: 503, svgY: 400 }, { name: 'Mavi', svgX: 374, svgY: 309 },
        { name: 'Bershka', svgX: 423, svgY: 351 }, { name: 'Pull&Bear', svgX: 277, svgY: 469 },
        { name: 'Stradivarius', svgX: 347, svgY: 550 }, { name: 'Hotiç', svgX: 270, svgY: 374 },
        { name: 'Boyner', svgX: 119, svgY: 342 }, { name: 'Tommy Hilfiger', svgX: 278, svgY: 402 },
      ]},
      { level: 5, name: '5. Kat (Moda)', stores: [
        { name: 'Zara', svgX: 354, svgY: 178 }, { name: 'LC Waikiki', svgX: 129, svgY: 358 },
        { name: 'Mango', svgX: 207, svgY: 458 }, { name: 'GAP', svgX: 272, svgY: 536 },
        { name: 'Massimo Dutti', svgX: 297, svgY: 470 }, { name: 'Oysho', svgX: 290, svgY: 394 },
        { name: 'MAC', svgX: 196, svgY: 308 }, { name: 'Victoria\'s Secret', svgX: 387, svgY: 313 },
        { name: 'Defacto', svgX: 597, svgY: 412 }, { name: 'Network', svgX: 491, svgY: 453 },
      ]},
      { level: 6, name: '6. Kat (Ev & Teknoloji)', stores: [
        { name: 'Sephora', svgX: 361, svgY: 485 }, { name: 'Migros', svgX: 338, svgY: 579 },
        { name: 'Samsung', svgX: 522, svgY: 533 }, { name: 'Linens', svgX: 183, svgY: 319 },
        { name: 'Koçtaş', svgX: 275, svgY: 474 }, { name: 'Decathlon', svgX: 372, svgY: 237 },
        { name: 'Gratis', svgX: 367, svgY: 311 }, { name: 'Özdilek', svgX: 612, svgY: 433 },
        { name: 'MAC Fit', svgX: 586, svgY: 647 }, { name: 'Rossmann', svgX: 559, svgY: 490 },
        { name: 'Arçelik', svgX: 576, svgY: 399 },
      ]},
    ],
  },

  // ─── 2. Forum İstanbul ───
  {
    id: 'forum-istanbul',
    name: 'Forum İstanbul',
    address: 'Kocatepe Mah. Paşa Cad. No:2, Bayrampaşa',
    center: { lat: 41.0397, lng: 28.8895 },
    bounds: { west: 28.8875, east: 28.8915, south: 41.0380, north: 41.0414 },
    buildingPolygon: [
      [28.8878, 41.0412], [28.8912, 41.0412], [28.8912, 41.0382], [28.8878, 41.0382], [28.8878, 41.0412],
    ],
    floors: [
      { level: 0, name: 'Zemin Kat', stores: [
        { name: 'Zara', svgX: 150, svgY: 200 }, { name: 'H&M', svgX: 250, svgY: 200 },
        { name: 'Mango', svgX: 350, svgY: 200 }, { name: 'LC Waikiki', svgX: 450, svgY: 200 },
        { name: 'Migros', svgX: 150, svgY: 400 }, { name: 'Starbucks', svgX: 250, svgY: 400 },
        { name: 'Burger King', svgX: 350, svgY: 400 }, { name: 'Gratis', svgX: 450, svgY: 400 },
      ]},
      { level: 1, name: '1. Kat', stores: [
        { name: 'Apple Store', svgX: 150, svgY: 200 }, { name: 'Samsung', svgX: 250, svgY: 200 },
        { name: 'MediaMarkt', svgX: 350, svgY: 200 }, { name: 'Nike', svgX: 450, svgY: 200 },
        { name: 'Adidas', svgX: 150, svgY: 400 }, { name: 'Sephora', svgX: 250, svgY: 400 },
        { name: 'Watsons', svgX: 350, svgY: 400 }, { name: 'Boyner', svgX: 450, svgY: 400 },
      ]},
      { level: 2, name: '2. Kat', stores: [
        { name: 'Cinemaximum', svgX: 200, svgY: 200 }, { name: 'Food Court', svgX: 400, svgY: 200 },
        { name: 'Bowling', svgX: 200, svgY: 400 }, { name: 'Toyzz Shop', svgX: 400, svgY: 400 },
        { name: 'KFC', svgX: 300, svgY: 300 }, { name: 'Popeyes', svgX: 300, svgY: 500 },
      ]},
    ],
  },

  // ─── 3. İstinye Park ───
  {
    id: 'istinye-park',
    name: 'İstinye Park',
    address: 'İstinye Bayırı Cad. No:73, Sarıyer',
    center: { lat: 41.1147, lng: 29.0590 },
    bounds: { west: 29.0570, east: 29.0610, south: 41.1130, north: 41.1164 },
    buildingPolygon: [
      [29.0573, 41.1162], [29.0607, 41.1162], [29.0607, 41.1132], [29.0573, 41.1132], [29.0573, 41.1162],
    ],
    floors: [
      { level: 0, name: 'Zemin Kat', stores: [
        { name: 'Louis Vuitton', svgX: 150, svgY: 200 }, { name: 'Gucci', svgX: 250, svgY: 200 },
        { name: 'Dior', svgX: 350, svgY: 200 }, { name: 'Harvey Nichols', svgX: 450, svgY: 200 },
        { name: 'Nespresso', svgX: 150, svgY: 400 }, { name: 'Vakko', svgX: 250, svgY: 400 },
        { name: 'Beymen', svgX: 350, svgY: 400 }, { name: 'Macrocenter', svgX: 450, svgY: 400 },
      ]},
      { level: 1, name: '1. Kat', stores: [
        { name: 'Apple Store', svgX: 150, svgY: 200 }, { name: 'Zara', svgX: 250, svgY: 200 },
        { name: 'Massimo Dutti', svgX: 350, svgY: 200 }, { name: 'COS', svgX: 450, svgY: 200 },
        { name: 'Tommy Hilfiger', svgX: 150, svgY: 400 }, { name: 'Calvin Klein', svgX: 250, svgY: 400 },
        { name: 'Tiffany & Co', svgX: 350, svgY: 400 }, { name: 'MAC', svgX: 450, svgY: 400 },
      ]},
      { level: 2, name: '2. Kat', stores: [
        { name: 'Cinemaximum', svgX: 200, svgY: 200 }, { name: 'Eataly', svgX: 400, svgY: 200 },
        { name: 'Wagamama', svgX: 200, svgY: 400 }, { name: 'Zuma', svgX: 400, svgY: 400 },
        { name: 'Starbucks Reserve', svgX: 300, svgY: 300 },
      ]},
    ],
  },

  // ─── 4. Zorlu Center ───
  {
    id: 'zorlu-center',
    name: 'Zorlu Center',
    address: 'Levazım Mah. Koru Sok. No:2, Beşiktaş',
    center: { lat: 41.0672, lng: 29.0165 },
    bounds: { west: 29.0145, east: 29.0185, south: 41.0656, north: 41.0688 },
    buildingPolygon: [
      [29.0148, 41.0686], [29.0182, 41.0686], [29.0182, 41.0658], [29.0148, 41.0658], [29.0148, 41.0686],
    ],
    floors: [
      { level: 0, name: 'Zemin Kat', stores: [
        { name: 'Apple Store', svgX: 200, svgY: 200 }, { name: 'Beymen', svgX: 350, svgY: 200 },
        { name: 'Vakko', svgX: 200, svgY: 400 }, { name: '%100 Café', svgX: 350, svgY: 400 },
        { name: 'Nusret', svgX: 500, svgY: 300 }, { name: 'Lacoste', svgX: 150, svgY: 300 },
      ]},
      { level: 1, name: '1. Kat', stores: [
        { name: 'Zara', svgX: 200, svgY: 200 }, { name: 'Massimo Dutti', svgX: 350, svgY: 200 },
        { name: 'The North Face', svgX: 200, svgY: 400 }, { name: 'Maje', svgX: 350, svgY: 400 },
        { name: 'Sandro', svgX: 500, svgY: 300 },
      ]},
    ],
  },

  // ─── 5. Akasya AVM ───
  {
    id: 'akasya',
    name: 'Akasya AVM',
    address: 'Acıbadem Mah. Çeçen Sok. No:25, Üsküdar',
    center: { lat: 41.0035, lng: 29.0455 },
    bounds: { west: 29.0435, east: 29.0475, south: 41.0018, north: 41.0052 },
    buildingPolygon: [
      [29.0438, 41.0050], [29.0472, 41.0050], [29.0472, 41.0020], [29.0438, 41.0020], [29.0438, 41.0050],
    ],
    floors: [
      { level: 0, name: 'Zemin Kat', stores: [
        { name: 'Carrefour', svgX: 150, svgY: 250 }, { name: 'Mango', svgX: 300, svgY: 200 },
        { name: 'Espresso Lab', svgX: 450, svgY: 250 }, { name: 'Koton', svgX: 200, svgY: 400 },
        { name: 'LC Waikiki', svgX: 350, svgY: 400 }, { name: 'DeFacto', svgX: 500, svgY: 400 },
      ]},
      { level: 1, name: '1. Kat', stores: [
        { name: 'H&M', svgX: 200, svgY: 200 }, { name: 'Skechers', svgX: 350, svgY: 200 },
        { name: 'Sephora', svgX: 200, svgY: 400 }, { name: 'Boyner', svgX: 350, svgY: 400 },
        { name: 'Teknosa', svgX: 500, svgY: 300 },
      ]},
      { level: 2, name: '2. Kat', stores: [
        { name: 'Cinemaximum', svgX: 250, svgY: 200 }, { name: 'Food Court', svgX: 400, svgY: 300 },
        { name: 'Bowling', svgX: 250, svgY: 500 },
      ]},
    ],
  },

  // ─── 6. Mall of İstanbul ───
  {
    id: 'mall-of-istanbul',
    name: 'Mall of İstanbul',
    address: 'Ziya Gökalp Mah. Süleyman Demirel Blv., Başakşehir',
    center: { lat: 41.0625, lng: 28.8075 },
    bounds: { west: 28.8050, east: 28.8100, south: 41.0605, north: 41.0645 },
    buildingPolygon: [
      [28.8053, 41.0643], [28.8097, 41.0643], [28.8097, 41.0607], [28.8053, 41.0607], [28.8053, 41.0643],
    ],
    floors: [
      { level: 0, name: 'Zemin Kat', stores: [
        { name: 'Zara', svgX: 150, svgY: 200 }, { name: 'H&M', svgX: 300, svgY: 200 },
        { name: 'LC Waikiki', svgX: 450, svgY: 200 }, { name: 'Migros', svgX: 150, svgY: 450 },
        { name: 'Starbucks', svgX: 300, svgY: 450 }, { name: 'Koton', svgX: 450, svgY: 450 },
        { name: 'Gratis', svgX: 200, svgY: 350 }, { name: 'Mavi', svgX: 400, svgY: 350 },
      ]},
      { level: 1, name: '1. Kat', stores: [
        { name: 'MediaMarkt', svgX: 200, svgY: 200 }, { name: 'Nike', svgX: 350, svgY: 200 },
        { name: 'Adidas', svgX: 200, svgY: 400 }, { name: 'Sephora', svgX: 350, svgY: 400 },
        { name: 'Boyner', svgX: 500, svgY: 300 }, { name: 'Watsons', svgX: 150, svgY: 300 },
      ]},
      { level: 2, name: '2. Kat', stores: [
        { name: 'Cinemaximum', svgX: 250, svgY: 200 }, { name: 'Legoland', svgX: 400, svgY: 200 },
        { name: 'Food Court', svgX: 300, svgY: 400 }, { name: 'Toyzz Shop', svgX: 450, svgY: 400 },
      ]},
    ],
  },

  // ─── 7. Kanyon ───
  {
    id: 'kanyon',
    name: 'Kanyon',
    address: 'Büyükdere Cad. No:185, Levent',
    center: { lat: 41.0792, lng: 29.0112 },
    bounds: { west: 29.0095, east: 29.0129, south: 41.0778, north: 41.0806 },
    buildingPolygon: [
      [29.0098, 41.0804], [29.0126, 41.0804], [29.0126, 41.0780], [29.0098, 41.0780], [29.0098, 41.0804],
    ],
    floors: [
      { level: 0, name: 'Zemin Kat', stores: [
        { name: 'Harvey Nichols', svgX: 200, svgY: 200 }, { name: 'Vakko', svgX: 350, svgY: 200 },
        { name: 'Beymen', svgX: 200, svgY: 400 }, { name: 'Starbucks', svgX: 350, svgY: 400 },
        { name: 'Nusret', svgX: 500, svgY: 300 },
      ]},
      { level: 1, name: '1. Kat', stores: [
        { name: 'Zara', svgX: 200, svgY: 200 }, { name: 'Mango', svgX: 350, svgY: 200 },
        { name: 'H&M', svgX: 200, svgY: 400 }, { name: 'Massimo Dutti', svgX: 350, svgY: 400 },
        { name: 'COS', svgX: 500, svgY: 300 },
      ]},
      { level: 2, name: '2. Kat', stores: [
        { name: 'Cinema Pink', svgX: 250, svgY: 200 }, { name: 'Wagamama', svgX: 400, svgY: 300 },
        { name: 'Big Chefs', svgX: 250, svgY: 450 },
      ]},
    ],
  },

  // ─── 8. Marmara Forum ───
  {
    id: 'marmara-forum',
    name: 'Marmara Forum',
    address: 'Osmaniye Mah. Çobançeşme Koşuyolu Blv., Bakırköy',
    center: { lat: 40.9910, lng: 28.8530 },
    bounds: { west: 28.8505, east: 28.8555, south: 41.9893, north: 40.9927 },
    buildingPolygon: [
      [28.8508, 40.9925], [28.8552, 40.9925], [28.8552, 40.9895], [28.8508, 40.9895], [28.8508, 40.9925],
    ],
    floors: [
      { level: 0, name: 'Zemin Kat', stores: [
        { name: 'Zara', svgX: 150, svgY: 200 }, { name: 'H&M', svgX: 300, svgY: 200 },
        { name: 'LC Waikiki', svgX: 450, svgY: 200 }, { name: 'Koton', svgX: 150, svgY: 400 },
        { name: 'Migros', svgX: 300, svgY: 400 }, { name: 'Mavi', svgX: 450, svgY: 400 },
        { name: 'Starbucks', svgX: 300, svgY: 550 },
      ]},
      { level: 1, name: '1. Kat', stores: [
        { name: 'MediaMarkt', svgX: 200, svgY: 200 }, { name: 'Nike', svgX: 400, svgY: 200 },
        { name: 'Adidas', svgX: 200, svgY: 400 }, { name: 'Boyner', svgX: 400, svgY: 400 },
        { name: 'Sephora', svgX: 300, svgY: 300 }, { name: 'Watsons', svgX: 300, svgY: 500 },
      ]},
      { level: 2, name: '2. Kat', stores: [
        { name: 'Cinemaximum', svgX: 250, svgY: 200 }, { name: 'Food Court', svgX: 400, svgY: 300 },
        { name: 'KFC', svgX: 200, svgY: 450 }, { name: 'Burger King', svgX: 400, svgY: 450 },
      ]},
    ],
  },

  // ─── 9. Emaar Square Mall ───
  {
    id: 'emaar-square',
    name: 'Emaar Square Mall',
    address: 'Ünalan Mah. Libadiye Cad. No:82F, Üsküdar',
    center: { lat: 41.0073, lng: 29.0762 },
    bounds: { west: 29.0742, east: 29.0782, south: 41.0056, north: 41.0090 },
    buildingPolygon: [
      [29.0745, 41.0088], [29.0779, 41.0088], [29.0779, 41.0058], [29.0745, 41.0058], [29.0745, 41.0088],
    ],
    floors: [
      { level: 0, name: 'Zemin Kat', stores: [
        { name: 'Zara', svgX: 150, svgY: 200 }, { name: 'H&M', svgX: 300, svgY: 200 },
        { name: 'Mango', svgX: 450, svgY: 200 }, { name: 'Beymen', svgX: 150, svgY: 400 },
        { name: 'Apple Store', svgX: 300, svgY: 400 }, { name: 'Samsung', svgX: 450, svgY: 400 },
      ]},
      { level: 1, name: '1. Kat', stores: [
        { name: 'LC Waikiki', svgX: 200, svgY: 200 }, { name: 'Koton', svgX: 350, svgY: 200 },
        { name: 'Nike', svgX: 200, svgY: 400 }, { name: 'Adidas', svgX: 350, svgY: 400 },
        { name: 'Sephora', svgX: 500, svgY: 300 },
      ]},
      { level: 2, name: '2. Kat', stores: [
        { name: 'Cinemaximum', svgX: 250, svgY: 200 }, { name: 'Food Court', svgX: 400, svgY: 300 },
        { name: 'Aquarium', svgX: 300, svgY: 500 },
      ]},
    ],
  },

  // ─── 10. Capitol (Altunizade) ───
  {
    id: 'capitol',
    name: 'Capitol AVM',
    address: 'Altunizade Mah. Mahir İz Cad. No:30, Üsküdar',
    center: { lat: 41.0218, lng: 29.0397 },
    bounds: { west: 29.0382, east: 29.0412, south: 41.0205, north: 41.0231 },
    buildingPolygon: [
      [29.0385, 41.0229], [29.0409, 41.0229], [29.0409, 41.0207], [29.0385, 41.0207], [29.0385, 41.0229],
    ],
    floors: [
      { level: 0, name: 'Zemin Kat', stores: [
        { name: 'Migros', svgX: 200, svgY: 200 }, { name: 'Starbucks', svgX: 350, svgY: 200 },
        { name: 'LC Waikiki', svgX: 200, svgY: 400 }, { name: 'Koton', svgX: 350, svgY: 400 },
      ]},
      { level: 1, name: '1. Kat', stores: [
        { name: 'Boyner', svgX: 200, svgY: 200 }, { name: 'Mavi', svgX: 350, svgY: 200 },
        { name: 'Watsons', svgX: 200, svgY: 400 }, { name: 'Gratis', svgX: 350, svgY: 400 },
      ]},
      { level: 2, name: '2. Kat', stores: [
        { name: 'Cinema Pink', svgX: 250, svgY: 250 }, { name: 'Food Court', svgX: 400, svgY: 350 },
      ]},
    ],
  },
];

// Yardımcı: SVG koordinatını gerçek lat/lng'ye dönüştür
export function svgToGeo(mall: MallData, svgX: number, svgY: number) {
  const SVG_W = 609;
  const SVG_H = 707;
  const lng = mall.bounds.west + (svgX / SVG_W) * (mall.bounds.east - mall.bounds.west);
  const lat = mall.bounds.north - (svgY / SVG_H) * (mall.bounds.north - mall.bounds.south);
  return { lat, lng };
}
