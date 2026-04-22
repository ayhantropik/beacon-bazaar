/**
 * ─── CEVAHİR AVM VERİLERİ ────────────────────────────────────
 *
 * Bu dosya 3 şey içerir:
 *
 *   1. ANCHOR — Kat planı görselini haritaya hizalamak için
 *               3 referans noktası (AnchorTool ile üretilir)
 *
 *   2. FLOOR_IMAGE — Kat planı görsel URL'si
 *
 *   3. FLOORS — Her kattaki mağazaların piksel poligonları
 *              (kat planı görseli üzerindeki x,y koordinatları)
 *
 * YENİ AVM EKLEMEK İÇİN:
 *   Bu dosyayı kopyalayıp değiştirin.
 *   Sadece ANCHOR, FLOOR_IMAGE ve FLOORS değişir.
 */
import type { AnchorData } from './affine';

// ─── Mağaza poligon tipi ───

export interface FloorStore {
  /** Mağaza adı */
  name: string;
  /** Kategori */
  type: string;
  /** Renk */
  color: string;
  /**
   * Poligon köşeleri — piksel [x, y]
   * Kat planı görseli üzerindeki koordinatlar.
   * 4 köşe = dikdörtgen, daha fazla köşe = özel şekil.
   * Kapatmaya gerek yok (otomatik kapatılır).
   */
  polygon: [number, number][];
}

export interface FloorData {
  level: number;
  name: string;
  /** Bu kat için görsel URL (her kata farklı görsel olabilir) */
  imageUrl: string;
  /**
   * Bu kat için anchor — her katın görseli farklı olduğunda
   * farklı anchor kullanılabilir. null ise genel anchor kullanılır.
   */
  anchor: AnchorData | null;
  /** Görselin piksel boyutları */
  imageWidth: number;
  imageHeight: number;
  /** Mağazalar */
  stores: FloorStore[];
}

// ─── Renk sabitleri ───

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
  kitap: '#a855f7',
  ev: '#0ea5e9',
};

// ═══════════════════════════════════════════════════
// CEVAHİR AVM — Büyükdere Cad. No:22, Şişli
// Koordinat: 41°03′46″N 28°59′35″E
// ═══════════════════════════════════════════════════

/** AVM merkez koordinatı [lng, lat] */
export const CENTER: [number, number] = [28.993056, 41.062778];

/** AVM adı ve adresi */
export const NAME = 'Cevahir AVM';
export const ADDRESS = 'Büyükdere Cad. No:22, Şişli-Mecidiyeköy';

/**
 * Ana anchor noktaları.
 *
 * Bu veriler kat planı görselinin 3 köşesinin
 * haritadaki karşılıklarıdır.
 *
 * NASIL ÜRETİLDİ:
 *   /anchor-tool sayfasından görsel yüklendi,
 *   3 tanınan nokta seçildi (örn: giriş kapısı, köşe, asansör)
 *   ve haritadaki karşılıkları tıklandı.
 *
 * Not: Aşağıdaki değerler basitleştirilmiş örnektir.
 *      Gerçek kullanımda AnchorTool'dan çıkan JSON yapıştırılır.
 */
export const ANCHOR: AnchorData = {
  image: [
    [0, 0],       // Görselin sol-üst köşesi
    [609, 0],     // Görselin sağ-üst köşesi
    [0, 707],     // Görselin sol-alt köşesi
  ],
  geo: [
    [28.99180, 41.06410],  // Sol-üst → harita
    [28.99420, 41.06410],  // Sağ-üst → harita
    [28.99180, 41.06150],  // Sol-alt → harita
  ],
};

/**
 * Bina dış sınır poligonu [lng, lat][]
 * Haritada kalın çizgiyle çizilir.
 */
export const OUTLINE: [number, number][] = [
  [28.99180, 41.06410],
  [28.99420, 41.06410],
  [28.99420, 41.06310],
  [28.99370, 41.06310],
  [28.99370, 41.06150],
  [28.99180, 41.06150],
  [28.99180, 41.06410], // kapanış
];

/**
 * Kat verileri.
 *
 * Her kat kendi görsel URL'si ve mağaza poligonlarını içerir.
 * Mağaza poligonları kat planı görseli üzerindeki piksel koordinatlarıdır.
 *
 * Yeni mağaza eklemek:
 *   1. Kat planı görselini açın
 *   2. Mağazanın 4 köşesinin piksel koordinatlarını not edin
 *   3. Aşağıya ekleyin
 */
export const FLOORS: FloorData[] = [
  // ─── 1. Kat ───
  {
    level: 1,
    name: '1. Kat',
    imageUrl: '', // Gerçek kat planı görseli buraya
    anchor: null, // null = genel ANCHOR kullanılır
    imageWidth: 609,
    imageHeight: 707,
    stores: [
      { name: 'Koton',           type: 'giyim',    color: C.giyim,    polygon: [[80, 220], [180, 220], [180, 310], [80, 310]] },
      { name: 'Zara',            type: 'giyim',    color: C.giyim,    polygon: [[250, 100], [370, 100], [370, 190], [250, 190]] },
      { name: 'Simit Sarayı',    type: 'yemek',    color: C.yemek,    polygon: [[190, 200], [290, 200], [290, 270], [190, 270]] },
      { name: 'Starbucks',       type: 'kafe',     color: C.kafe,     polygon: [[430, 350], [540, 350], [540, 430], [430, 430]] },
      { name: 'Pandora',         type: 'aksesuar',  color: C.aksesuar, polygon: [[400, 260], [510, 260], [510, 340], [400, 340]] },
      { name: 'D&R',             type: 'kitap',    color: C.kitap,    polygon: [[360, 430], [470, 430], [470, 520], [360, 520]] },
      { name: 'Watsons',         type: 'kozmetik', color: C.kozmetik, polygon: [[300, 370], [410, 370], [410, 450], [300, 450]] },
      { name: 'Swarovski',       type: 'aksesuar',  color: C.aksesuar, polygon: [[260, 250], [360, 250], [360, 330], [260, 330]] },
      { name: 'Flo',             type: 'giyim',    color: C.giyim,    polygon: [[170, 370], [270, 370], [270, 450], [170, 450]] },
      { name: 'LC Waikiki Kids', type: 'giyim',    color: C.giyim,    polygon: [[100, 280], [210, 280], [210, 370], [100, 370]] },
      { name: 'Marks&Spencer',   type: 'giyim',    color: C.giyim,    polygon: [[410, 170], [540, 170], [540, 260], [410, 260]] },
      { name: 'Jack&Jones',      type: 'giyim',    color: C.giyim,    polygon: [[340, 180], [440, 180], [440, 260], [340, 260]] },
      { name: 'Defacto',         type: 'giyim',    color: C.giyim,    polygon: [[460, 260], [570, 260], [570, 350], [460, 350]] },
    ],
  },

  // ─── 3. Kat (Yeme-İçme) ───
  {
    level: 3,
    name: '3. Kat (Yeme-İçme)',
    imageUrl: '',
    anchor: null,
    imageWidth: 609,
    imageHeight: 707,
    stores: [
      { name: 'KFC',           type: 'yemek', color: C.yemek, polygon: [[230, 340], [340, 340], [340, 420], [230, 420]] },
      { name: 'Burger King',   type: 'yemek', color: C.yemek, polygon: [[420, 390], [540, 390], [540, 470], [420, 470]] },
      { name: 'McDonald\'s',   type: 'yemek', color: C.yemek, polygon: [[330, 260], [450, 260], [450, 340], [330, 340]] },
      { name: 'Popeyes',       type: 'yemek', color: C.yemek, polygon: [[350, 520], [470, 520], [470, 600], [350, 600]] },
      { name: 'Sbarro',        type: 'yemek', color: C.yemek, polygon: [[350, 490], [460, 490], [460, 560], [350, 560]] },
      { name: 'Carl\'s Jr.',   type: 'yemek', color: C.yemek, polygon: [[430, 350], [550, 350], [550, 430], [430, 430]] },
      { name: 'Teknosa',       type: 'elektronik', color: C.elektronik, polygon: [[280, 100], [420, 100], [420, 200], [280, 200]] },
      { name: 'Toyzz Shop',    type: 'ev',    color: C.ev,    polygon: [[270, 210], [380, 210], [380, 290], [270, 290]] },
    ],
  },

  // ─── 5. Kat (Moda) ───
  {
    level: 5,
    name: '5. Kat (Moda)',
    imageUrl: '',
    anchor: null,
    imageWidth: 609,
    imageHeight: 707,
    stores: [
      { name: 'Zara',              type: 'giyim',    color: C.giyim,    polygon: [[270, 80], [420, 80], [420, 190], [270, 190]] },
      { name: 'LC Waikiki',        type: 'giyim',    color: C.giyim,    polygon: [[50, 250], [190, 250], [190, 370], [50, 370]] },
      { name: 'Mango',             type: 'giyim',    color: C.giyim,    polygon: [[120, 350], [250, 350], [250, 440], [120, 440]] },
      { name: 'GAP',               type: 'giyim',    color: C.giyim,    polygon: [[190, 420], [310, 420], [310, 510], [190, 510]] },
      { name: 'Massimo Dutti',     type: 'giyim',    color: C.giyim,    polygon: [[210, 340], [340, 340], [340, 420], [210, 420]] },
      { name: 'MAC',               type: 'kozmetik', color: C.kozmetik, polygon: [[110, 200], [230, 200], [230, 280], [110, 280]] },
      { name: 'Victoria\'s Secret',type: 'giyim',    color: C.giyim,    polygon: [[300, 200], [440, 200], [440, 290], [300, 290]] },
      { name: 'Defacto',           type: 'giyim',    color: C.giyim,    polygon: [[500, 290], [600, 290], [600, 380], [500, 380]] },
    ],
  },

  // ─── 6. Kat (Ev & Teknoloji) ───
  {
    level: 6,
    name: '6. Kat (Ev & Teknoloji)',
    imageUrl: '',
    anchor: null,
    imageWidth: 609,
    imageHeight: 707,
    stores: [
      { name: 'Sephora',   type: 'kozmetik',   color: C.kozmetik,   polygon: [[280, 370], [400, 370], [400, 460], [280, 460]] },
      { name: 'Migros',    type: 'market',      color: C.market,     polygon: [[250, 460], [390, 460], [390, 560], [250, 560]] },
      { name: 'Samsung',   type: 'elektronik',  color: C.elektronik, polygon: [[440, 410], [560, 410], [560, 500], [440, 500]] },
      { name: 'Koçtaş',    type: 'ev',          color: C.ev,         polygon: [[190, 360], [300, 360], [300, 450], [190, 450]] },
      { name: 'Decathlon',  type: 'spor',        color: C.spor,       polygon: [[290, 130], [420, 130], [420, 230], [290, 230]] },
      { name: 'Gratis',     type: 'kozmetik',   color: C.kozmetik,   polygon: [[280, 200], [400, 200], [400, 280], [280, 280]] },
      { name: 'MAC Fit',    type: 'spor',        color: C.spor,       polygon: [[500, 520], [600, 520], [600, 610], [500, 610]] },
      { name: 'Arçelik',    type: 'elektronik',  color: C.elektronik, polygon: [[490, 280], [600, 280], [600, 370], [490, 370]] },
      { name: 'Rossmann',   type: 'kozmetik',   color: C.kozmetik,   polygon: [[470, 370], [580, 370], [580, 450], [470, 450]] },
    ],
  },
];
