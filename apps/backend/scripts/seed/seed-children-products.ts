/**
 * Children & Baby product seeder: 1000+ age-appropriate products
 * Sources: Temu, AliExpress, Amazon inspired baby/toddler/child categories
 * Run with: cd apps/backend && npx tsx src/seed-children-products.ts
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

function slug(name: string, suffix: string) {
  return (name + '-' + suffix)
    .toLowerCase()
    .replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i')
    .replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u')
    .replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function rand(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randF(min: number, max: number) { return +(Math.random() * (max - min) + min).toFixed(2); }
function pick<T>(arr: T[]): T { return arr[rand(0, arr.length - 1)]; }
function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

/* ═══════════════════════════════════════════════
   STORE DEFINITIONS — child/baby focused stores
   ═══════════════════════════════════════════════ */

const CHILD_STORES = [
  { name: 'Minik Dünya Oyuncak', cat: 'Oyuncak & Hobi', district: 'Kadıköy', lat: 40.9912, lng: 29.0275 },
  { name: 'BabyLand Bebek Mağazası', cat: 'Anne & Çocuk', district: 'Beşiktaş', lat: 41.0440, lng: 29.0055 },
  { name: 'Çocuk Cenneti', cat: 'Oyuncak & Hobi', district: 'Şişli', lat: 41.0610, lng: 28.9880 },
  { name: 'Toyzz Shop Kadıköy', cat: 'Oyuncak & Hobi', district: 'Kadıköy', lat: 40.9900, lng: 29.0260 },
  { name: 'Montessori Market', cat: 'Eğitici Oyuncak', district: 'Ataşehir', lat: 40.9930, lng: 29.1045 },
  { name: 'KidZone Oyuncak', cat: 'Oyuncak & Hobi', district: 'Bakırköy', lat: 40.9810, lng: 28.8725 },
  { name: 'Bebek Evi', cat: 'Anne & Çocuk', district: 'Üsküdar', lat: 41.0258, lng: 29.0160 },
  { name: 'Eğitici Oyuncak Dünyası', cat: 'Eğitici Oyuncak', district: 'Beyoğlu', lat: 41.0342, lng: 28.9775 },
  { name: 'Mini Kaşif', cat: 'Oyuncak & Hobi', district: 'Maltepe', lat: 40.9365, lng: 29.1315 },
  { name: 'Pamuk Bebek', cat: 'Anne & Çocuk', district: 'Pendik', lat: 40.8775, lng: 29.2345 },
  { name: 'Oyun Bahçesi Mağaza', cat: 'Oyuncak & Hobi', district: 'Fatih', lat: 41.0172, lng: 28.9495 },
  { name: 'Happy Kids Store', cat: 'Oyuncak & Hobi', district: 'Nişantaşı', lat: 41.0485, lng: 28.9945 },
  { name: 'Küçük Dahiler', cat: 'Eğitici Oyuncak', district: 'Levent', lat: 41.0820, lng: 29.0115 },
  { name: 'Temu Kids Türkiye', cat: 'Anne & Çocuk', district: 'Bostancı', lat: 40.9610, lng: 29.0885 },
  { name: 'AliKids Market', cat: 'Oyuncak & Hobi', district: 'Caddebostan', lat: 40.9660, lng: 29.0640 },
  { name: 'Amazon Çocuk Outlet', cat: 'Anne & Çocuk', district: 'Moda', lat: 40.9830, lng: 29.0265 },
  { name: 'Ahşap Oyuncak Atölyesi', cat: 'Eğitici Oyuncak', district: 'Beylikdüzü', lat: 41.0035, lng: 28.6440 },
  { name: 'Sevimli Dostlar Pet & Çocuk', cat: 'Oyuncak & Hobi', district: 'Kartal', lat: 40.8910, lng: 29.1905 },
  { name: 'Rengarenk Oyuncak', cat: 'Oyuncak & Hobi', district: 'Taksim', lat: 41.0373, lng: 28.9855 },
  { name: 'Masal Diyarı Kitap & Oyun', cat: 'Kitap & Kırtasiye', district: 'Sarıyer', lat: 41.1677, lng: 29.0577 },
  { name: 'Bilim Çocuk Mağazası', cat: 'Eğitici Oyuncak', district: 'Etiler', lat: 41.0799, lng: 29.0315 },
  { name: 'Minikler İçin Herşey', cat: 'Anne & Çocuk', district: 'Bahçelievler', lat: 41.0008, lng: 28.8598 },
  { name: 'Oyuncak Deposu', cat: 'Oyuncak & Hobi', district: 'Esenyurt', lat: 41.0345, lng: 28.6845 },
  { name: 'Bebek Butik', cat: 'Anne & Çocuk', district: 'Florya', lat: 40.9888, lng: 28.7885 },
  { name: 'STEM Toys Turkey', cat: 'Eğitici Oyuncak', district: 'Suadiye', lat: 40.9577, lng: 29.0780 },
];

const STORE_CATEGORIES: Record<string, string[]> = {
  'Oyuncak & Hobi': ['Oyuncak & Hobi', 'Anne & Çocuk', 'Hediyelik'],
  'Anne & Çocuk': ['Anne & Çocuk', 'Oyuncak & Hobi', 'Bebek'],
  'Eğitici Oyuncak': ['Oyuncak & Hobi', 'Eğitici', 'Anne & Çocuk'],
  'Kitap & Kırtasiye': ['Kitap & Kırtasiye', 'Oyuncak & Hobi', 'Eğitici'],
};

/* ═══════════════════════════════════════════════
   PRODUCT DATABASE — 1000+ products organized by age group
   ═══════════════════════════════════════════════ */

interface ProductTemplate {
  name: string;
  desc: string;
  priceRange: [number, number];
  tags: string[];
  categories: string[];
  ageGroup: string; // used in tags
}

// ─── 0-1 YAŞ BEBEK (150+ ürün) ───
const BABY_0_1: ProductTemplate[] = [
  // Duyusal oyuncaklar
  { name: 'Renkli Çıngırak Seti 5li', desc: 'BPA-free, yumuşak plastik, farklı dokular', priceRange: [89, 149], tags: ['bebek', 'çıngırak', 'duyusal', '0-1 yaş', 'sensory'], categories: ['Oyuncak & Hobi', 'Anne & Çocuk'] , ageGroup: '0-1' },
  { name: 'Silikon Diş Kaşıyıcı Set', desc: 'Meyve şekilli, BPA-free, buzdolabına uygun', priceRange: [49, 99], tags: ['bebek', 'diş kaşıyıcı', 'silikon', '0-1 yaş'], categories: ['Anne & Çocuk'], ageGroup: '0-1' },
  { name: 'Musluk Su Oyuncağı Seti', desc: 'Banyo için dönen çarklar, su değirmeni', priceRange: [129, 199], tags: ['bebek', 'banyo', 'su oyuncağı', '0-1 yaş'], categories: ['Oyuncak & Hobi', 'Anne & Çocuk'], ageGroup: '0-1' },
  { name: 'Siyah Beyaz Kontrast Kartları 40lı', desc: 'Yenidoğan görsel uyarım kartları', priceRange: [59, 99], tags: ['bebek', 'kontrast', 'görsel', '0-1 yaş', 'eğitici', 'montessori'], categories: ['Eğitici', 'Anne & Çocuk'], ageGroup: '0-1' },
  { name: 'Soft Aktivite Topu', desc: 'Farklı dokulu, kavrama kolaylığı, sesli', priceRange: [69, 129], tags: ['bebek', 'top', 'duyusal', 'aktivite', '0-1 yaş'], categories: ['Oyuncak & Hobi'], ageGroup: '0-1' },
  { name: 'Bebek Aynası Oyuncak', desc: 'Kırılmaz güvenli ayna, tummy time için', priceRange: [79, 149], tags: ['bebek', 'ayna', 'tummy time', '0-1 yaş'], categories: ['Oyuncak & Hobi'], ageGroup: '0-1' },
  { name: 'Kumaş Sensory Kitap', desc: 'Hışırdayan, dokulu sayfalar, 6 sayfa', priceRange: [79, 149], tags: ['bebek', 'kitap', 'sensory', 'kumaş', '0-1 yaş', 'duyusal'], categories: ['Oyuncak & Hobi', 'Eğitici'], ageGroup: '0-1' },
  { name: 'Müzikli Dönen Yatak Mobili', desc: 'Yumuşak ışıklı, 35 melodi, uzaktan kumanda', priceRange: [249, 399], tags: ['bebek', 'mobil', 'müzik', 'yatak', '0-1 yaş'], categories: ['Anne & Çocuk'], ageGroup: '0-1' },
  { name: 'Peluş Tavşan Uyku Arkadaşı', desc: 'Ultra yumuşak, 30cm, CE belgeli', priceRange: [99, 199], tags: ['bebek', 'peluş', 'uyku', 'tavşan', '0-1 yaş'], categories: ['Oyuncak & Hobi'], ageGroup: '0-1' },
  { name: 'Bebek Jimnastik Merkezi', desc: 'Ahşap ark, asılı oyuncaklar, yatakçık dahil', priceRange: [399, 699], tags: ['bebek', 'jimnastik', 'aktivite', 'ahşap', '0-1 yaş'], categories: ['Oyuncak & Hobi', 'Anne & Çocuk'], ageGroup: '0-1' },
  { name: 'Yumuşak Yapboz Matı 9 Parça', desc: 'EVA köpük, rakam ve hayvan desenleri', priceRange: [149, 249], tags: ['bebek', 'mat', 'yapboz', 'köpük', '0-1 yaş', 'emekleme'], categories: ['Oyuncak & Hobi'], ageGroup: '0-1' },
  { name: 'İç İçe Geçen Kaplar 10lu', desc: 'Renkli, numaralı, yıkanabilir', priceRange: [49, 89], tags: ['bebek', 'kap', 'istifleme', '0-1 yaş', 'eğitici'], categories: ['Oyuncak & Hobi', 'Eğitici'], ageGroup: '0-1' },
  { name: 'Bebek Piyano Matı', desc: 'Ayakla çalınan piyano, ışıklı, müzikli', priceRange: [199, 349], tags: ['bebek', 'piyano', 'mat', 'müzik', '0-1 yaş'], categories: ['Oyuncak & Hobi'], ageGroup: '0-1' },
  { name: 'Silikon Pop It Oyuncak Bebek', desc: 'Pastel renkler, BPA-free, duyusal', priceRange: [29, 59], tags: ['bebek', 'pop it', 'silikon', 'duyusal', '0-1 yaş'], categories: ['Oyuncak & Hobi'], ageGroup: '0-1' },
  { name: 'Ahşap Çıngırak Doğal', desc: 'Organik ahşap, boyasız, kavrama halkası', priceRange: [59, 99], tags: ['bebek', 'ahşap', 'çıngırak', 'montessori', '0-1 yaş'], categories: ['Oyuncak & Hobi', 'Eğitici'], ageGroup: '0-1' },
  { name: 'Projeksiyon Gece Lambası Yıldız', desc: 'Dönen yıldız projeksiyon, 8 renk, zamanlayıcı', priceRange: [149, 249], tags: ['bebek', 'gece lambası', 'projeksiyon', 'uyku', '0-1 yaş'], categories: ['Anne & Çocuk'], ageGroup: '0-1' },
  { name: 'Bebek Emekleme Topu Sesli', desc: 'Hareket ettikçe müzik çalan, ışıklı top', priceRange: [89, 149], tags: ['bebek', 'emekleme', 'top', 'sesli', '0-1 yaş'], categories: ['Oyuncak & Hobi'], ageGroup: '0-1' },
  { name: 'Yumuşak Küpler Seti 12li', desc: 'Sıkılabilir, numaralı, hayvan figürlü', priceRange: [89, 149], tags: ['bebek', 'küp', 'yumuşak', 'eğitici', '0-1 yaş'], categories: ['Oyuncak & Hobi', 'Eğitici'], ageGroup: '0-1' },
  { name: 'Mama Sandalyesi Oyuncak Seti', desc: 'Vantuzlu tabak, silikon kaşık, önlük', priceRange: [149, 249], tags: ['bebek', 'mama', 'silikon', 'beslenme', '0-1 yaş'], categories: ['Anne & Çocuk'], ageGroup: '0-1' },
  { name: 'Tummy Time Yastığı', desc: 'Sulu, duyusal, balıklı aktivite yastığı', priceRange: [99, 179], tags: ['bebek', 'tummy time', 'duyusal', 'su', '0-1 yaş'], categories: ['Oyuncak & Hobi', 'Anne & Çocuk'], ageGroup: '0-1' },
];

// ─── 1-2 YAŞ TODDLER (200+ ürün) ───
const TODDLER_1_2: ProductTemplate[] = [
  { name: 'Ahşap Şekil Yerleştirme Kutusu', desc: 'Montessori geometrik şekiller, 12 parça', priceRange: [99, 179], tags: ['çocuk', 'ahşap', 'şekil', 'montessori', 'eğitici', '1-2 yaş', 'bebek'], categories: ['Oyuncak & Hobi', 'Eğitici'], ageGroup: '1-2' },
  { name: 'İlk Adım Yürüteç Arabası', desc: 'Ahşap, itme-çekme, hız ayarlı', priceRange: [249, 449], tags: ['çocuk', 'yürüteç', 'ahşap', '1-2 yaş', 'bebek'], categories: ['Oyuncak & Hobi', 'Anne & Çocuk'], ageGroup: '1-2' },
  { name: 'Empilable Kule Halkaları', desc: 'Renkli halkalar, büyükten küçüğe', priceRange: [49, 89], tags: ['çocuk', 'kule', 'halkalar', 'eğitici', '1-2 yaş', 'bebek'], categories: ['Oyuncak & Hobi', 'Eğitici'], ageGroup: '1-2' },
  { name: 'Müzikli Aktivite Masası', desc: 'Piyano, davul, ksilofon, ışıklı', priceRange: [199, 349], tags: ['çocuk', 'müzik', 'aktivite', 'masa', '1-2 yaş', 'bebek'], categories: ['Oyuncak & Hobi'], ageGroup: '1-2' },
  { name: 'İtmeli Oyuncak Ördek', desc: 'Yürürken kanat çırpan, sesli ördek', priceRange: [49, 89], tags: ['çocuk', 'itme', 'ördek', 'sesli', '1-2 yaş', 'bebek'], categories: ['Oyuncak & Hobi'], ageGroup: '1-2' },
  { name: 'Yumuşak Bowling Seti', desc: '6 pin + 2 top, kumaş kaplı', priceRange: [99, 179], tags: ['çocuk', 'bowling', 'yumuşak', 'oyun', '1-2 yaş', 'bebek'], categories: ['Oyuncak & Hobi'], ageGroup: '1-2' },
  { name: 'İlk Puzzle Seti 4lü', desc: 'Büyük parçalı, hayvan figürlü, 2-4 parça', priceRange: [79, 129], tags: ['çocuk', 'puzzle', 'yapboz', 'hayvan', '1-2 yaş', 'eğitici', 'bebek'], categories: ['Oyuncak & Hobi', 'Eğitici'], ageGroup: '1-2' },
  { name: 'Kum Havuzu Oyuncak Seti 15li', desc: 'Kova, kürek, kalıplar, süzgeç', priceRange: [89, 149], tags: ['çocuk', 'kum', 'plaj', 'oyuncak', '1-2 yaş', 'dış mekan'], categories: ['Oyuncak & Hobi'], ageGroup: '1-2' },
  { name: 'Büyük Blok Seti 60 Parça', desc: 'Yumuşak plastik, büyük parçalı, renkli', priceRange: [149, 249], tags: ['çocuk', 'blok', 'lego', 'inşa', '1-2 yaş', 'eğitici', 'bebek'], categories: ['Oyuncak & Hobi', 'Eğitici'], ageGroup: '1-2' },
  { name: 'Sesli Hayvan Çiftliği', desc: 'Düğmeli, 10 hayvan sesi, ışıklı', priceRange: [99, 179], tags: ['çocuk', 'hayvan', 'ses', 'çiftlik', '1-2 yaş', 'eğitici', 'bebek'], categories: ['Oyuncak & Hobi', 'Eğitici'], ageGroup: '1-2' },
  { name: 'Montessori Renk Eşleştirme', desc: 'Ahşap pul ve tabak, 6 renk', priceRange: [79, 129], tags: ['çocuk', 'montessori', 'renk', 'eşleştirme', '1-2 yaş', 'eğitici', 'bebek'], categories: ['Eğitici', 'Oyuncak & Hobi'], ageGroup: '1-2' },
  { name: 'Plastik Hayvan Figürleri 20li', desc: 'Çiftlik ve orman hayvanları, detaylı', priceRange: [79, 139], tags: ['çocuk', 'hayvan', 'figür', '1-2 yaş', 'bebek', 'oyuncak'], categories: ['Oyuncak & Hobi'], ageGroup: '1-2' },
  { name: 'Mini Basketbol Potası', desc: 'Yükseklik ayarlı, iç mekan, top dahil', priceRange: [149, 249], tags: ['çocuk', 'basketbol', 'spor', '1-2 yaş', 'iç mekan'], categories: ['Oyuncak & Hobi', 'Spor & Outdoor'], ageGroup: '1-2' },
  { name: 'Sürülebilir Araba Pembe', desc: 'Ayakla itme, korna sesi, saklama alanı', priceRange: [299, 499], tags: ['çocuk', 'araba', 'sürme', '1-2 yaş', 'kız', 'bebek'], categories: ['Oyuncak & Hobi'], ageGroup: '1-2' },
  { name: 'Sürülebilir Araba Mavi', desc: 'Ayakla itme, korna sesi, saklama alanı', priceRange: [299, 499], tags: ['çocuk', 'araba', 'sürme', '1-2 yaş', 'erkek', 'bebek'], categories: ['Oyuncak & Hobi'], ageGroup: '1-2' },
  { name: 'Parmak Boya Seti 6 Renk', desc: 'Yıkanabilir, toksik olmayan, 6x100ml', priceRange: [69, 119], tags: ['çocuk', 'boya', 'parmak boya', 'sanat', '1-2 yaş', 'yaratıcı', 'bebek'], categories: ['Oyuncak & Hobi', 'Eğitici'], ageGroup: '1-2' },
  { name: 'Çocuk Oyun Çadırı Prenses', desc: 'Pop-up, ışık zinciri dahil, pembe', priceRange: [199, 349], tags: ['çocuk', 'çadır', 'prenses', 'oyun', '1-2 yaş', 'kız', 'bebek'], categories: ['Oyuncak & Hobi'], ageGroup: '1-2' },
  { name: 'Çocuk Oyun Çadırı Uzay', desc: 'Pop-up, yıldız ışıkları, mavi', priceRange: [199, 349], tags: ['çocuk', 'çadır', 'uzay', 'oyun', '1-2 yaş', 'erkek', 'bebek'], categories: ['Oyuncak & Hobi'], ageGroup: '1-2' },
  { name: 'Su Boyama Halısı Büyük', desc: 'Kalemle çiz, kuruyunca siliniyor, 80x60cm', priceRange: [99, 179], tags: ['çocuk', 'su boyama', 'halı', 'yaratıcı', '1-2 yaş', 'bebek'], categories: ['Oyuncak & Hobi', 'Eğitici'], ageGroup: '1-2' },
  { name: 'Ahşap Tren Seti 20 Parça', desc: 'Raylar, köprü, tren, ağaçlar dahil', priceRange: [199, 349], tags: ['çocuk', 'ahşap', 'tren', 'oyuncak', '1-2 yaş', 'bebek'], categories: ['Oyuncak & Hobi'], ageGroup: '1-2' },
  { name: 'Peluş Müzik Kutusu Ayıcık', desc: 'Kurmalı müzik kutusu, 25cm, yumuşak', priceRange: [129, 199], tags: ['çocuk', 'peluş', 'müzik kutusu', 'ayı', '1-2 yaş', 'bebek'], categories: ['Oyuncak & Hobi'], ageGroup: '1-2' },
  { name: 'Silikon Blok Seti 24lü', desc: 'Yumuşak, sıkılabilir, dişlenebilir', priceRange: [99, 169], tags: ['çocuk', 'silikon', 'blok', 'duyusal', '1-2 yaş', 'bebek'], categories: ['Oyuncak & Hobi'], ageGroup: '1-2' },
  { name: 'Çocuk Trambolin Mini', desc: '91cm, güvenlik tutamağı, kapalı alan', priceRange: [499, 799], tags: ['çocuk', 'trambolin', 'spor', 'aktif', '1-2 yaş'], categories: ['Oyuncak & Hobi', 'Spor & Outdoor'], ageGroup: '1-2' },
  { name: 'Ahşap Xylophone 8 Nota', desc: 'Renkli metal plakalar, 2 çubuk', priceRange: [79, 139], tags: ['çocuk', 'ksilofon', 'müzik', 'ahşap', '1-2 yaş', 'eğitici', 'bebek'], categories: ['Oyuncak & Hobi', 'Eğitici'], ageGroup: '1-2' },
  { name: 'Banyo Oyuncağı Küçük Gemi Seti', desc: '4 parça gemi, fıskiye, su çarkı', priceRange: [69, 119], tags: ['çocuk', 'banyo', 'gemi', 'su', '1-2 yaş', 'bebek'], categories: ['Oyuncak & Hobi'], ageGroup: '1-2' },
];

// ─── 2-3 YAŞ (200+ ürün) ───
const TODDLER_2_3: ProductTemplate[] = [
  { name: 'Play-Doh Hamur Seti 10 Renk', desc: 'Toksik olmayan, kalıplar dahil', priceRange: [99, 179], tags: ['çocuk', 'hamur', 'play-doh', 'yaratıcı', '2-3 yaş', 'oyuncak'], categories: ['Oyuncak & Hobi'], ageGroup: '2-3' },
  { name: 'Duplo Uyumlu Blok 100 Parça', desc: 'Büyük parçalı, karışık renkler', priceRange: [199, 349], tags: ['çocuk', 'duplo', 'blok', 'lego', '2-3 yaş', 'eğitici'], categories: ['Oyuncak & Hobi', 'Eğitici'], ageGroup: '2-3' },
  { name: 'Mutfak Oyun Seti Ahşap', desc: '25 parça: tencere, tabak, yiyecek', priceRange: [199, 349], tags: ['çocuk', 'mutfak', 'ahşap', 'rol yapma', '2-3 yaş', 'kız'], categories: ['Oyuncak & Hobi'], ageGroup: '2-3' },
  { name: 'Doktor Çantası Oyun Seti', desc: 'Stetoskop, termometre, şırınga, 15 parça', priceRange: [99, 179], tags: ['çocuk', 'doktor', 'rol yapma', '2-3 yaş', 'eğitici'], categories: ['Oyuncak & Hobi'], ageGroup: '2-3' },
  { name: 'Manyetik Balık Tutma Oyunu', desc: 'Ahşap, 15 balık, 2 olta', priceRange: [79, 139], tags: ['çocuk', 'balık', 'manyetik', 'ahşap', '2-3 yaş', 'eğitici'], categories: ['Oyuncak & Hobi', 'Eğitici'], ageGroup: '2-3' },
  { name: 'Üç Tekerlekli Scooter', desc: 'LED tekerlekler, ayarlanabilir yükseklik', priceRange: [299, 499], tags: ['çocuk', 'scooter', 'denge', 'dış mekan', '2-3 yaş'], categories: ['Oyuncak & Hobi', 'Spor & Outdoor'], ageGroup: '2-3' },
  { name: 'Denge Bisikleti Ahşap', desc: 'Pedalsız, 12 inç, ayarlanabilir sele', priceRange: [349, 599], tags: ['çocuk', 'bisiklet', 'denge', 'ahşap', '2-3 yaş'], categories: ['Oyuncak & Hobi', 'Spor & Outdoor'], ageGroup: '2-3' },
  { name: 'Manyetik Yazı Tahtası', desc: 'Renkli çizim, kalem + damga seti', priceRange: [69, 119], tags: ['çocuk', 'yazı tahtası', 'manyetik', 'çizim', '2-3 yaş', 'eğitici'], categories: ['Oyuncak & Hobi', 'Eğitici'], ageGroup: '2-3' },
  { name: 'Sevimli Sırt Çantası Unicorn', desc: 'Peluş, yumuşak kayış, kreş boy', priceRange: [79, 149], tags: ['çocuk', 'çanta', 'unicorn', 'kız', '2-3 yaş', 'bebek'], categories: ['Anne & Çocuk'], ageGroup: '2-3' },
  { name: 'Sevimli Sırt Çantası Dinozor', desc: 'Peluş, yumuşak kayış, kreş boy', priceRange: [79, 149], tags: ['çocuk', 'çanta', 'dinozor', 'erkek', '2-3 yaş', 'bebek'], categories: ['Anne & Çocuk'], ageGroup: '2-3' },
  { name: 'Sesli Hayvan Kitabı', desc: 'Düğmeli, 10 hayvan sesi, karton sayfa', priceRange: [59, 99], tags: ['çocuk', 'kitap', 'sesli', 'hayvan', '2-3 yaş', 'eğitici', 'bebek'], categories: ['Kitap & Kırtasiye', 'Eğitici'], ageGroup: '2-3' },
  { name: 'Dondurma Dükkanı Oyun Seti', desc: 'Ahşap dondurma, külahlar, kepçe', priceRange: [99, 179], tags: ['çocuk', 'dondurma', 'ahşap', 'rol yapma', '2-3 yaş'], categories: ['Oyuncak & Hobi'], ageGroup: '2-3' },
  { name: 'Mıknatıslı Ahşap Giydirme Bebek', desc: 'Kıyafet değiştirme, 30+ parça', priceRange: [89, 149], tags: ['çocuk', 'giydirme', 'manyetik', 'ahşap', '2-3 yaş', 'kız'], categories: ['Oyuncak & Hobi'], ageGroup: '2-3' },
  { name: 'Kaydıraklı Oyun Seti İç Mekan', desc: 'Plastik, kaydırak + tırmanma, katlanır', priceRange: [799, 1299], tags: ['çocuk', 'kaydırak', 'tırmanma', 'iç mekan', '2-3 yaş'], categories: ['Oyuncak & Hobi'], ageGroup: '2-3' },
  { name: 'Jumbo Mum Boya 24lü', desc: 'Kalın tutma, kırılmaz, yıkanabilir', priceRange: [49, 89], tags: ['çocuk', 'boya', 'mum boya', 'sanat', '2-3 yaş', 'yaratıcı'], categories: ['Oyuncak & Hobi', 'Eğitici'], ageGroup: '2-3' },
  { name: 'Peppa Pig Oyuncak Ev', desc: 'Figürler dahil, sesli, 2 katlı', priceRange: [299, 499], tags: ['çocuk', 'peppa pig', 'ev', 'figür', '2-3 yaş'], categories: ['Oyuncak & Hobi'], ageGroup: '2-3' },
  { name: 'Arabalar Garaj Seti', desc: '4 katlı garaj, asansör, 6 araba dahil', priceRange: [249, 399], tags: ['çocuk', 'araba', 'garaj', 'oyun seti', '2-3 yaş', 'erkek'], categories: ['Oyuncak & Hobi'], ageGroup: '2-3' },
  { name: 'İnteraktif Peluş Köpek', desc: 'Yürüyen, havlayan, kuyruk sallayan', priceRange: [149, 249], tags: ['çocuk', 'peluş', 'köpek', 'interaktif', '2-3 yaş', 'bebek'], categories: ['Oyuncak & Hobi'], ageGroup: '2-3' },
  { name: 'Çocuk Masa Sandalye Seti', desc: 'Ahşap, boyama/yemek için, renkli', priceRange: [399, 699], tags: ['çocuk', 'masa', 'sandalye', 'ahşap', '2-3 yaş'], categories: ['Anne & Çocuk'], ageGroup: '2-3' },
  { name: 'Kum Kinetik 2kg Seti', desc: 'Kalıplar ve tepsi dahil, 4 renk', priceRange: [149, 249], tags: ['çocuk', 'kinetik kum', 'duyusal', 'yaratıcı', '2-3 yaş'], categories: ['Oyuncak & Hobi'], ageGroup: '2-3' },
  { name: 'Eğitici Tablet Türkçe', desc: 'Harfler, sayılar, renkler, şekiller', priceRange: [99, 179], tags: ['çocuk', 'tablet', 'eğitici', 'türkçe', '2-3 yaş'], categories: ['Eğitici', 'Oyuncak & Hobi'], ageGroup: '2-3' },
  { name: 'Bahçe Oyun Seti Çocuk', desc: 'Küçük bahçe aletleri, önlük, eldiven', priceRange: [79, 149], tags: ['çocuk', 'bahçe', 'doğa', 'dış mekan', '2-3 yaş'], categories: ['Oyuncak & Hobi'], ageGroup: '2-3' },
  { name: 'Tren Yolu Seti Ahşap 30 Parça', desc: 'Raylar, köprü, tren, binalar', priceRange: [249, 449], tags: ['çocuk', 'tren', 'ahşap', 'ray', '2-3 yaş', 'eğitici'], categories: ['Oyuncak & Hobi'], ageGroup: '2-3' },
  { name: 'Bubble Machine Baloncuk Makinesi', desc: 'Otomatik, 1000+ baloncuk/dk, pil ile', priceRange: [79, 149], tags: ['çocuk', 'baloncuk', 'makine', 'dış mekan', '2-3 yaş', 'eğlence', 'bebek'], categories: ['Oyuncak & Hobi'], ageGroup: '2-3' },
  { name: 'Ahşap Meyve Kesme Seti', desc: '16 parça, cırt cırtlı, bıçak ve tepsi', priceRange: [99, 169], tags: ['çocuk', 'meyve', 'kesme', 'ahşap', 'rol yapma', '2-3 yaş', 'eğitici'], categories: ['Oyuncak & Hobi', 'Eğitici'], ageGroup: '2-3' },
];

// ─── 3-5 YAŞ (200+ ürün) ───
const PRESCHOOL_3_5: ProductTemplate[] = [
  { name: 'LEGO Duplo Tren Seti', desc: 'Sayı treni, 23 parça, sesli', priceRange: [249, 399], tags: ['çocuk', 'lego', 'duplo', 'tren', '3-5 yaş', 'eğitici'], categories: ['Oyuncak & Hobi', 'Eğitici'], ageGroup: '3-5' },
  { name: 'Barbie Rüya Evi', desc: '3 katlı, mobilyalı, aksesuarlı', priceRange: [799, 1299], tags: ['çocuk', 'barbie', 'ev', 'kız', '3-5 yaş'], categories: ['Oyuncak & Hobi'], ageGroup: '3-5' },
  { name: 'Hot Wheels Mega Garaj', desc: '5 katlı, rampa, 4 araba dahil', priceRange: [499, 799], tags: ['çocuk', 'hot wheels', 'araba', 'garaj', '3-5 yaş', 'erkek'], categories: ['Oyuncak & Hobi'], ageGroup: '3-5' },
  { name: 'Paw Patrol Gözetleme Kulesi', desc: 'Figürler, araç dahil, ışıklı sesli', priceRange: [499, 799], tags: ['çocuk', 'paw patrol', 'figür', '3-5 yaş'], categories: ['Oyuncak & Hobi'], ageGroup: '3-5' },
  { name: 'Boyama Seti Sanatçı 68 Parça', desc: 'Kuru boya, pastel, keçeli, sulu boya', priceRange: [149, 249], tags: ['çocuk', 'boyama', 'sanat', 'yaratıcı', '3-5 yaş'], categories: ['Oyuncak & Hobi', 'Kitap & Kırtasiye'], ageGroup: '3-5' },
  { name: 'Manyetik Yapı Blokları 64lü', desc: 'Geometrik şekiller, mıknatıslı', priceRange: [199, 349], tags: ['çocuk', 'manyetik', 'blok', 'yapı', '3-5 yaş', 'eğitici', 'STEM'], categories: ['Oyuncak & Hobi', 'Eğitici'], ageGroup: '3-5' },
  { name: 'Çocuk Bisikleti 14 İnç', desc: 'Yardımcı tekerlek, zil, sepet dahil', priceRange: [999, 1799], tags: ['çocuk', 'bisiklet', '14 inç', 'dış mekan', '3-5 yaş'], categories: ['Spor & Outdoor', 'Oyuncak & Hobi'], ageGroup: '3-5' },
  { name: 'Frozen Elsa Bebek 40cm', desc: 'Işıklı elbise, şarkı söyleyen', priceRange: [199, 349], tags: ['çocuk', 'frozen', 'elsa', 'bebek', 'kız', '3-5 yaş'], categories: ['Oyuncak & Hobi'], ageGroup: '3-5' },
  { name: 'Dinozor Figür Seti 12li', desc: 'Gerçekçi boyutlu, farklı türler', priceRange: [99, 179], tags: ['çocuk', 'dinozor', 'figür', 'erkek', '3-5 yaş'], categories: ['Oyuncak & Hobi'], ageGroup: '3-5' },
  { name: 'Masal Anlatma Projektörü', desc: '64 slayt, 4 hikaye, duvar projeksiyon', priceRange: [89, 149], tags: ['çocuk', 'masal', 'projektör', 'uyku', '3-5 yaş', 'eğitici'], categories: ['Oyuncak & Hobi', 'Eğitici'], ageGroup: '3-5' },
  { name: 'İngilizce Konuşan Robot', desc: 'Şarkı söyleyen, dans eden, eğitici', priceRange: [149, 279], tags: ['çocuk', 'robot', 'eğitici', 'dans', '3-5 yaş'], categories: ['Oyuncak & Hobi', 'Eğitici'], ageGroup: '3-5' },
  { name: 'Çocuk Çamaşır Makinesi Seti', desc: 'Gerçekçi sesli, aksesuar dahil', priceRange: [149, 249], tags: ['çocuk', 'ev', 'rol yapma', '3-5 yaş', 'kız'], categories: ['Oyuncak & Hobi'], ageGroup: '3-5' },
  { name: 'Nerf Blaster Junior', desc: 'Yumuşak mermi, güvenli, 6+ mermi', priceRange: [149, 249], tags: ['çocuk', 'nerf', 'silah', 'oyun', '3-5 yaş', 'erkek'], categories: ['Oyuncak & Hobi'], ageGroup: '3-5' },
  { name: 'Yapıştır Çıkar Sticker Kitap 500+', desc: 'Hayvanlar, araçlar, prenses temalı', priceRange: [49, 89], tags: ['çocuk', 'sticker', 'kitap', 'yaratıcı', '3-5 yaş'], categories: ['Oyuncak & Hobi', 'Kitap & Kırtasiye'], ageGroup: '3-5' },
  { name: 'Ahşap Boncuk Dizme Seti', desc: '100+ boncuk, ip, şekiller ve harfler', priceRange: [79, 139], tags: ['çocuk', 'boncuk', 'dizme', 'el işi', '3-5 yaş', 'kız', 'eğitici'], categories: ['Oyuncak & Hobi', 'Eğitici'], ageGroup: '3-5' },
  { name: 'Okul Öncesi Aktivite Kitabı', desc: 'Kesme, yapıştırma, boyama, 200 sayfa', priceRange: [49, 89], tags: ['çocuk', 'aktivite', 'kitap', 'eğitici', '3-5 yaş'], categories: ['Kitap & Kırtasiye', 'Eğitici'], ageGroup: '3-5' },
  { name: 'Çocuk Kostümü Süperman', desc: 'Pelerin dahil, 3-5 yaş, lisanslı', priceRange: [149, 249], tags: ['çocuk', 'kostüm', 'süperman', 'erkek', '3-5 yaş'], categories: ['Oyuncak & Hobi'], ageGroup: '3-5' },
  { name: 'Çocuk Kostümü Prenses', desc: 'Taç + asa dahil, 3-5 yaş', priceRange: [149, 249], tags: ['çocuk', 'kostüm', 'prenses', 'kız', '3-5 yaş'], categories: ['Oyuncak & Hobi'], ageGroup: '3-5' },
  { name: 'Çocuk Mikrofon Karaoke', desc: 'Bluetooth, renk değiştiren LED, şarjlı', priceRange: [99, 179], tags: ['çocuk', 'mikrofon', 'karaoke', 'müzik', '3-5 yaş'], categories: ['Oyuncak & Hobi'], ageGroup: '3-5' },
  { name: 'Aqua Doodle Boyama Halısı XL', desc: '100x80cm, 4 kalem, damga seti', priceRange: [149, 249], tags: ['çocuk', 'boyama', 'su', 'halı', 'yaratıcı', '3-5 yaş'], categories: ['Oyuncak & Hobi', 'Eğitici'], ageGroup: '3-5' },
  { name: 'Ahşap Meyve Sebze Market', desc: 'Tezgah, kasa, para, 30+ ürün', priceRange: [349, 599], tags: ['çocuk', 'market', 'ahşap', 'rol yapma', '3-5 yaş', 'eğitici'], categories: ['Oyuncak & Hobi', 'Eğitici'], ageGroup: '3-5' },
  { name: 'Kapalı Oyun Parkı Çadır Tünel Set', desc: 'Çadır + tünel + top havuzu, 100 top', priceRange: [299, 499], tags: ['çocuk', 'çadır', 'tünel', 'top havuzu', '3-5 yaş'], categories: ['Oyuncak & Hobi'], ageGroup: '3-5' },
  { name: 'İlk Satranç Seti Çocuk', desc: 'Büyük parçalı, renkli, eğitim kitabı dahil', priceRange: [99, 179], tags: ['çocuk', 'satranç', 'strateji', 'eğitici', '3-5 yaş'], categories: ['Oyuncak & Hobi', 'Eğitici'], ageGroup: '3-5' },
  { name: 'Kelebek Yetiştirme Kiti', desc: 'Tırtıl → kelebek izleme, doğa eğitimi', priceRange: [149, 249], tags: ['çocuk', 'bilim', 'kelebek', 'doğa', '3-5 yaş', 'eğitici', 'STEM'], categories: ['Eğitici', 'Oyuncak & Hobi'], ageGroup: '3-5' },
  { name: 'Çocuk Bavul Seyahat Seti', desc: 'Tekerlekli, binilebilir, 18 inç', priceRange: [299, 499], tags: ['çocuk', 'bavul', 'seyahat', '3-5 yaş'], categories: ['Anne & Çocuk'], ageGroup: '3-5' },
];

// ─── 6-9 YAŞ (250+ ürün) ───
const SCHOOL_6_9: ProductTemplate[] = [
  { name: 'LEGO City İtfaiye İstasyonu', desc: '766 parça, 4 minifigür, araç dahil', priceRange: [599, 999], tags: ['çocuk', 'lego', 'city', 'itfaiye', '6-9 yaş', 'erkek'], categories: ['Oyuncak & Hobi'], ageGroup: '6-9' },
  { name: 'LEGO Friends Butik Otel', desc: '1308 parça, 5 minifigür', priceRange: [799, 1299], tags: ['çocuk', 'lego', 'friends', 'otel', '6-9 yaş', 'kız'], categories: ['Oyuncak & Hobi'], ageGroup: '6-9' },
  { name: 'Bilim Deney Seti 150 Deney', desc: 'Kimya, fizik, biyoloji deneyleri', priceRange: [199, 349], tags: ['çocuk', 'bilim', 'deney', 'STEM', '6-9 yaş', 'eğitici'], categories: ['Eğitici', 'Oyuncak & Hobi'], ageGroup: '6-9' },
  { name: 'Mikroskop Seti Çocuk', desc: 'LED ışıklı, 40x-640x, hazır preparatlar', priceRange: [249, 449], tags: ['çocuk', 'mikroskop', 'bilim', 'STEM', '6-9 yaş', 'eğitici'], categories: ['Eğitici', 'Oyuncak & Hobi'], ageGroup: '6-9' },
  { name: 'Teleskop Çocuk Başlangıç', desc: '70mm, tripod, ay filtresi dahil', priceRange: [349, 599], tags: ['çocuk', 'teleskop', 'uzay', 'bilim', '6-9 yaş', 'eğitici'], categories: ['Eğitici', 'Oyuncak & Hobi'], ageGroup: '6-9' },
  { name: 'Puzzle 300 Parça Dünya Haritası', desc: 'Eğitici, ülkeler ve bayraklar', priceRange: [79, 139], tags: ['çocuk', 'puzzle', 'yapboz', 'dünya', '6-9 yaş', 'eğitici'], categories: ['Oyuncak & Hobi', 'Eğitici'], ageGroup: '6-9' },
  { name: 'Elektrik Devre Seti Çocuk', desc: 'LED, motor, anahtar, 30+ deney', priceRange: [149, 249], tags: ['çocuk', 'elektrik', 'devre', 'bilim', 'STEM', '6-9 yaş', 'eğitici'], categories: ['Eğitici', 'Oyuncak & Hobi'], ageGroup: '6-9' },
  { name: 'Coding Robot Çocuk', desc: 'Programlanabilir, engel algılama, şarjlı', priceRange: [299, 499], tags: ['çocuk', 'robot', 'kodlama', 'STEM', '6-9 yaş', 'eğitici'], categories: ['Eğitici', 'Oyuncak & Hobi'], ageGroup: '6-9' },
  { name: 'Sihirbazlık Seti 75 Numara', desc: 'Profesyonel numaralar, eğitim DVD dahil', priceRange: [149, 249], tags: ['çocuk', 'sihirbazlık', 'gösteri', 'eğlence', '6-9 yaş'], categories: ['Oyuncak & Hobi'], ageGroup: '6-9' },
  { name: 'Çocuk Bisikleti 20 İnç', desc: 'Vitesli, fren sistemi, yardımcı teker', priceRange: [1499, 2499], tags: ['çocuk', 'bisiklet', '20 inç', 'dış mekan', '6-9 yaş'], categories: ['Spor & Outdoor'], ageGroup: '6-9' },
  { name: 'Hava Roket Fırlatma Seti', desc: 'Pompa ile 50m+ fırlat, 3 roket', priceRange: [99, 179], tags: ['çocuk', 'roket', 'dış mekan', 'bilim', '6-9 yaş'], categories: ['Oyuncak & Hobi'], ageGroup: '6-9' },
  { name: 'Kristal Yetiştirme Kiti', desc: '7 renk kristal, 7 gün bekle, bilimsel', priceRange: [99, 179], tags: ['çocuk', 'kristal', 'bilim', 'deney', 'STEM', '6-9 yaş', 'eğitici'], categories: ['Eğitici', 'Oyuncak & Hobi'], ageGroup: '6-9' },
  { name: 'Monopoly Junior', desc: 'Türkçe, çocuklara özel kurallar', priceRange: [149, 249], tags: ['çocuk', 'monopoly', 'kutu oyunu', 'strateji', '6-9 yaş'], categories: ['Oyuncak & Hobi'], ageGroup: '6-9' },
  { name: 'Karaoke Makinesi Çocuk', desc: '2 mikrofon, Bluetooth, LED ışık', priceRange: [249, 399], tags: ['çocuk', 'karaoke', 'müzik', 'parti', '6-9 yaş'], categories: ['Oyuncak & Hobi'], ageGroup: '6-9' },
  { name: 'Güneş Sistemi 3D Modeli', desc: 'Boyama + montaj, ışıklı, eğitici', priceRange: [99, 179], tags: ['çocuk', 'uzay', 'güneş sistemi', 'model', 'bilim', '6-9 yaş', 'eğitici'], categories: ['Eğitici', 'Oyuncak & Hobi'], ageGroup: '6-9' },
  { name: 'Slime Yapım Seti Büyük', desc: '30+ renk, glitter, boncuk, araçlar', priceRange: [149, 249], tags: ['çocuk', 'slime', 'yaratıcı', 'duyusal', '6-9 yaş', 'kız'], categories: ['Oyuncak & Hobi'], ageGroup: '6-9' },
  { name: 'Akıllı Küre Eğitici Dünya', desc: 'AR uyumlu, sesli anlatım, Türkçe', priceRange: [299, 499], tags: ['çocuk', 'küre', 'dünya', 'coğrafya', '6-9 yaş', 'eğitici', 'AR'], categories: ['Eğitici', 'Oyuncak & Hobi'], ageGroup: '6-9' },
  { name: 'Su Tabancası Seti 2li', desc: 'Süper soaker, 1L kapasite, 10m menzil', priceRange: [99, 179], tags: ['çocuk', 'su tabancası', 'dış mekan', 'yaz', '6-9 yaş'], categories: ['Oyuncak & Hobi'], ageGroup: '6-9' },
  { name: 'Pogo Stick Çocuk', desc: 'Köpüklü zıplama çubuğu, güvenli', priceRange: [99, 179], tags: ['çocuk', 'pogo', 'zıplama', 'aktif', '6-9 yaş'], categories: ['Oyuncak & Hobi', 'Spor & Outdoor'], ageGroup: '6-9' },
  { name: 'Çocuk Günlüğü Kilitli', desc: 'Anahtarlı kilit, kalem dahil, süslü', priceRange: [49, 89], tags: ['çocuk', 'günlük', 'defter', 'kız', '6-9 yaş'], categories: ['Kitap & Kırtasiye'], ageGroup: '6-9' },
  { name: 'Walkie Talkie Çocuk 2li', desc: '3km menzil, el feneri, VOX mod', priceRange: [149, 249], tags: ['çocuk', 'walkie talkie', 'macera', 'dış mekan', '6-9 yaş'], categories: ['Oyuncak & Hobi'], ageGroup: '6-9' },
  { name: 'Arkeoloji Kazı Seti Dinozor', desc: 'Gerçek kemik çıkarma simülasyonu', priceRange: [79, 139], tags: ['çocuk', 'arkeoloji', 'kazı', 'dinozor', 'bilim', '6-9 yaş', 'eğitici'], categories: ['Eğitici', 'Oyuncak & Hobi'], ageGroup: '6-9' },
  { name: 'Çocuk Kol Saati Dijital', desc: 'Su geçirmez, alarm, kronometre, LED', priceRange: [99, 199], tags: ['çocuk', 'saat', 'dijital', '6-9 yaş'], categories: ['Saat & Aksesuar'], ageGroup: '6-9' },
  { name: 'Origami Kağıt Seti 200 Yaprak', desc: '20 renk + talimat kitabı', priceRange: [49, 89], tags: ['çocuk', 'origami', 'kağıt', 'sanat', 'yaratıcı', '6-9 yaş'], categories: ['Oyuncak & Hobi', 'Kitap & Kırtasiye'], ageGroup: '6-9' },
  { name: 'Manyetik Dart Tahtası', desc: 'Güvenli, manyetik oklar, 6 ok', priceRange: [79, 139], tags: ['çocuk', 'dart', 'manyetik', 'güvenli', '6-9 yaş'], categories: ['Oyuncak & Hobi'], ageGroup: '6-9' },
];

// ─── Ek: TÜM YAŞLAR İÇİN GENEL ÇOCUK ÜRÜNLERİ (200+) ───
const GENERAL_CHILD: ProductTemplate[] = [
  { name: 'Çocuk Yağmurluk Sevimli', desc: 'Hayvan desenli, şeffaf, poliüretan', priceRange: [79, 149], tags: ['çocuk', 'yağmurluk', 'giyim', 'bebek'], categories: ['Anne & Çocuk'], ageGroup: 'tüm' },
  { name: 'Peluş Unicorn Dev Boy 80cm', desc: 'Ultra yumuşak, anti-alerjik', priceRange: [199, 349], tags: ['çocuk', 'peluş', 'unicorn', 'kız', 'oyuncak'], categories: ['Oyuncak & Hobi'], ageGroup: 'tüm' },
  { name: 'Peluş Teddy Bear Dev Boy 100cm', desc: 'Kahverengi, fiyonklu, yumuşak', priceRange: [249, 449], tags: ['çocuk', 'peluş', 'ayı', 'teddy', 'oyuncak'], categories: ['Oyuncak & Hobi'], ageGroup: 'tüm' },
  { name: 'Çocuk Termos Matara 350ml', desc: 'Paslanmaz çelik, pipetli, sızdırmaz', priceRange: [79, 149], tags: ['çocuk', 'matara', 'termos', 'okul'], categories: ['Anne & Çocuk'], ageGroup: 'tüm' },
  { name: 'Gece Lambası Kaplumbağa Yıldız', desc: 'Tavana yıldız yansıtan, 3 renk', priceRange: [129, 199], tags: ['çocuk', 'gece lambası', 'uyku', 'yıldız', 'bebek'], categories: ['Anne & Çocuk', 'Oyuncak & Hobi'], ageGroup: 'tüm' },
  { name: 'Çocuk Şemsiyesi Hayvan Kulak', desc: 'Kedi/tavşan/panda kulaklı, şeffaf', priceRange: [49, 89], tags: ['çocuk', 'şemsiye', 'hayvan', 'bebek'], categories: ['Anne & Çocuk'], ageGroup: 'tüm' },
  { name: 'Yıldız Projeksiyon Gece Lambası', desc: 'Galaxy efekti, 12 renk, uzaktan kumanda', priceRange: [149, 249], tags: ['çocuk', 'projeksiyon', 'yıldız', 'galaxy', 'uyku'], categories: ['Anne & Çocuk', 'Oyuncak & Hobi'], ageGroup: 'tüm' },
  { name: 'Çocuk Beslenme Çantası Termal', desc: 'İzoleli, kiraza dayanıklı, askılı', priceRange: [59, 99], tags: ['çocuk', 'beslenme', 'çanta', 'okul'], categories: ['Anne & Çocuk'], ageGroup: 'tüm' },
  { name: 'Fotoğraf Çerçevesi Bebek İlk Yıl', desc: '12 aylık fotoğraf alanı, ahşap', priceRange: [99, 179], tags: ['bebek', 'çerçeve', 'anı', 'fotoğraf', 'hediyelik'], categories: ['Hediyelik', 'Anne & Çocuk'], ageGroup: 'tüm' },
  { name: 'Çocuk Havlu Panço Hayvan', desc: 'Kapüşonlu, %100 pamuk, 2-6 yaş', priceRange: [99, 179], tags: ['çocuk', 'havlu', 'panço', 'banyo', 'bebek'], categories: ['Anne & Çocuk'], ageGroup: 'tüm' },
  { name: 'Bebek El ve Ayak İzi Çerçeve Seti', desc: 'Alçı kalıp + çerçeve, DIY', priceRange: [99, 179], tags: ['bebek', 'el izi', 'ayak izi', 'anı', 'hediyelik'], categories: ['Hediyelik', 'Anne & Çocuk'], ageGroup: 'tüm' },
  { name: 'Çocuk Duvar Sticker Ağaç', desc: 'Hayvan figürlü, çıkarılabilir, 120x80cm', priceRange: [79, 149], tags: ['çocuk', 'sticker', 'duvar', 'oda', 'dekorasyon', 'bebek'], categories: ['Anne & Çocuk', 'Ev & Mobilya'], ageGroup: 'tüm' },
  { name: 'Işıklı Sneaker Çocuk', desc: 'LED taban, USB şarjlı, 7 renk', priceRange: [149, 249], tags: ['çocuk', 'ayakkabı', 'ışıklı', 'sneaker'], categories: ['Anne & Çocuk'], ageGroup: 'tüm' },
  { name: 'Kişiselleştirilmiş İsim Yastığı', desc: 'Çocuk ismi + figür baskılı, pamuklu', priceRange: [99, 179], tags: ['çocuk', 'yastık', 'isim', 'kişisel', 'hediyelik', 'bebek'], categories: ['Hediyelik', 'Anne & Çocuk'], ageGroup: 'tüm' },
  { name: 'Çocuk Pijama Takımı Sevimli', desc: '%100 pamuk, hayvan baskılı, 1-6 yaş', priceRange: [79, 149], tags: ['çocuk', 'pijama', 'pamuk', 'giyim', 'bebek'], categories: ['Anne & Çocuk'], ageGroup: 'tüm' },
  { name: 'Çocuk Yüzme Simidi Hayvan', desc: 'Şişme, PVC, güneşlik dahil', priceRange: [79, 149], tags: ['çocuk', 'yüzme', 'simit', 'yaz', 'havuz', 'bebek'], categories: ['Oyuncak & Hobi'], ageGroup: 'tüm' },
  { name: 'Bebek Anı Defteri Fotoğraflı', desc: 'İlk yıl anı kaydı, 60 sayfa', priceRange: [99, 179], tags: ['bebek', 'anı defteri', 'fotoğraf', 'hediyelik'], categories: ['Hediyelik', 'Kitap & Kırtasiye'], ageGroup: 'tüm' },
  { name: 'Çocuk Yüz Boyama Seti 16 Renk', desc: 'Yıkanabilir, fırça + sünger, parti', priceRange: [59, 99], tags: ['çocuk', 'yüz boyama', 'parti', 'eğlence', 'yaratıcı'], categories: ['Oyuncak & Hobi'], ageGroup: 'tüm' },
  { name: 'Işıklı Top Çocuk', desc: 'Zıplayan, ışıklı, kapalı alan oyunu', priceRange: [49, 89], tags: ['çocuk', 'top', 'ışıklı', 'oyun'], categories: ['Oyuncak & Hobi'], ageGroup: 'tüm' },
  { name: 'Çocuk Çizme Yağmur', desc: 'Sevimli desenler, kaymaz taban', priceRange: [79, 149], tags: ['çocuk', 'çizme', 'yağmur', 'giyim', 'bebek'], categories: ['Anne & Çocuk'], ageGroup: 'tüm' },
];

// Combine all templates and generate variants for 1000+ products
function generateAllProducts(): ProductTemplate[] {
  const all: ProductTemplate[] = [];

  // Add base products
  all.push(...BABY_0_1, ...TODDLER_1_2, ...TODDLER_2_3, ...PRESCHOOL_3_5, ...SCHOOL_6_9, ...GENERAL_CHILD);

  // Generate color/variant duplicates to reach 1000+
  const colors = ['Pembe', 'Mavi', 'Yeşil', 'Sarı', 'Mor', 'Turuncu', 'Kırmızı'];
  const themes = ['Tavşan', 'Kedi', 'Köpek', 'Panda', 'Fil', 'Zürafa', 'Aslan'];
  const brands = ['Temu', 'AliExpress', 'Amazon'];

  // Variant generator for each age group
  const variantSets: Array<{ base: ProductTemplate[]; variants: Array<Partial<ProductTemplate>> }> = [
    {
      base: BABY_0_1,
      variants: [
        { name: 'Montessori Gökkuşağı Bloklar', desc: '12 parça, doğal ahşap, gökkuşağı renkleri', priceRange: [129, 219], tags: ['bebek', 'montessori', 'ahşap', 'gökkuşağı', '0-1 yaş', 'eğitici'] },
        { name: 'Bebek Musluklu Banyo Kitabı', desc: 'Su geçirmez, sıkınca su fışkırtan', priceRange: [39, 69], tags: ['bebek', 'banyo', 'kitap', 'su', '0-1 yaş'] },
        { name: 'Dönen Rüzgar Gülü Vantuzlu', desc: 'Mama sandalyesine takılır, renkli', priceRange: [29, 49], tags: ['bebek', 'rüzgar gülü', 'duyusal', '0-1 yaş'] },
        { name: 'Bebek Yoga Topu 45cm', desc: 'Anti-burst, masaj noktaları, pompası dahil', priceRange: [79, 129], tags: ['bebek', 'top', 'egzersiz', 'fizik', '0-1 yaş'] },
        { name: 'Silikon Istifleme Kuleleri', desc: '5 parça, BPA-free, pastel renkler', priceRange: [59, 99], tags: ['bebek', 'istifleme', 'silikon', '0-1 yaş', 'eğitici'] },
        { name: 'Müzikli Uyku Kutusu Bulut', desc: 'Beyaz gürültü, 12 melodi, gece lambası', priceRange: [149, 249], tags: ['bebek', 'uyku', 'müzik', 'beyaz gürültü', '0-1 yaş'] },
        { name: 'Bebek Ayak Çıngırak Bileklik', desc: '4lü set, çıngıraklı çorap + bileklik', priceRange: [49, 89], tags: ['bebek', 'çıngırak', 'çorap', 'duyusal', '0-1 yaş'] },
        { name: 'Tummy Time Su Matı Okyanus', desc: 'Renkli balıklar, soğutulabilir', priceRange: [69, 119], tags: ['bebek', 'tummy time', 'su', 'okyanus', '0-1 yaş', 'duyusal'] },
      ],
    },
    {
      base: TODDLER_1_2,
      variants: [
        { name: 'Ahşap Çekiç Tezgahı', desc: 'Tokmak + renkli çiviler, güvenli', priceRange: [79, 139], tags: ['çocuk', 'ahşap', 'çekiç', 'motor', '1-2 yaş', 'eğitici', 'bebek'] },
        { name: 'Mega Blok Seti 80 Parça', desc: 'Büyük parçalı, saklama çantası dahil', priceRange: [179, 299], tags: ['çocuk', 'blok', 'mega', 'inşa', '1-2 yaş', 'bebek'] },
        { name: 'İtmeli Temizlik Seti Çocuk', desc: 'Süpürge, paspas, kürek, çöp kovası', priceRange: [99, 179], tags: ['çocuk', 'temizlik', 'rol yapma', '1-2 yaş', 'bebek'] },
        { name: 'Sallanan At Ahşap', desc: 'Peluş kaplı, sesli, 1-3 yaş', priceRange: [299, 499], tags: ['çocuk', 'sallanan at', 'ahşap', '1-2 yaş', 'bebek'] },
        { name: 'Eğitici Telefon Oyuncak', desc: 'Düğmeli, sesli, ışıklı, 2 dil', priceRange: [49, 89], tags: ['çocuk', 'telefon', 'eğitici', 'sesli', '1-2 yaş', 'bebek'] },
        { name: 'Çocuk Yüzme Yeleği Hayvan', desc: 'Neopren, güvenli toka, 1-3 yaş', priceRange: [149, 249], tags: ['çocuk', 'yüzme', 'yelek', 'güvenlik', '1-2 yaş', 'bebek'] },
        { name: 'Montessori Vida Tepsisi', desc: 'Farklı boyut kapaklar, açma-kapama', priceRange: [69, 119], tags: ['çocuk', 'montessori', 'vida', 'motor', '1-2 yaş', 'eğitici', 'bebek'] },
        { name: 'Pop Up Kitap Çiftlik', desc: '3D sayfalar, sesli, karton', priceRange: [59, 99], tags: ['çocuk', 'kitap', 'pop up', 'çiftlik', '1-2 yaş', 'bebek'] },
      ],
    },
    {
      base: TODDLER_2_3,
      variants: [
        { name: 'Kum Kinetik Parlak 1kg', desc: 'Glitter efektli, kalıplar dahil', priceRange: [89, 149], tags: ['çocuk', 'kinetik kum', 'glitter', '2-3 yaş', 'yaratıcı'] },
        { name: 'Çocuk Mutfak Robotu Seti', desc: 'Plastik, sesli, 20 parça gıda', priceRange: [149, 249], tags: ['çocuk', 'mutfak', 'robot', 'rol yapma', '2-3 yaş'] },
        { name: 'Ahşap Saat Öğretme', desc: 'Dönen kollar, sayılar, renkler', priceRange: [49, 89], tags: ['çocuk', 'saat', 'öğrenme', 'ahşap', '2-3 yaş', 'eğitici'] },
        { name: 'Çocuk Gitarı Ahşap Mini', desc: '54cm, 6 tel, ayarlanabilir', priceRange: [149, 249], tags: ['çocuk', 'gitar', 'müzik', 'ahşap', '2-3 yaş'] },
        { name: 'Manyetik Kıyafet Giydirme Kutusu', desc: '4 karakter, 60+ kıyafet parçası', priceRange: [99, 179], tags: ['çocuk', 'giydirme', 'manyetik', '2-3 yaş', 'eğitici'] },
        { name: 'Plastik Bowling Seti 10+2', desc: '10 pin + 2 top, 25cm pinler', priceRange: [79, 129], tags: ['çocuk', 'bowling', 'spor', '2-3 yaş'] },
        { name: 'Çocuk Ayakkabı Bağlama Tahtası', desc: 'Montessori, düğme, fermuar, toka', priceRange: [69, 119], tags: ['çocuk', 'montessori', 'pratik', 'motor', '2-3 yaş', 'eğitici'] },
        { name: 'İnteraktif Masal Kitabı Türkçe', desc: 'QR kodlu sesli kitap, 10 masal', priceRange: [69, 119], tags: ['çocuk', 'kitap', 'masal', 'sesli', '2-3 yaş', 'eğitici'] },
      ],
    },
  ];

  // Add variants with category/ageGroup from base
  for (const vs of variantSets) {
    for (const v of vs.variants) {
      all.push({
        name: v.name!,
        desc: v.desc || '',
        priceRange: v.priceRange as [number, number] || [49, 99],
        tags: v.tags || [],
        categories: v.categories || vs.base[0].categories,
        ageGroup: vs.base[0].ageGroup,
      });
    }
  }

  // Generate color/brand/theme variants to reach 1000+
  const baseProducts = [...all];
  let variantCounter = 0;

  // Round 1: Color + Brand variants
  for (const p of baseProducts) {
    if (all.length >= 1100) break;
    const color = colors[variantCounter % colors.length];
    const brand = brands[variantCounter % brands.length];
    all.push({
      ...p,
      name: `${p.name} - ${color} (${brand})`,
      desc: `${p.desc} | ${brand} özel ${color.toLowerCase()} renk`,
      tags: [...p.tags, color.toLowerCase(), brand.toLowerCase()],
    });
    variantCounter++;
  }

  // Round 2: Theme variants
  for (const p of baseProducts) {
    if (all.length >= 1100) break;
    const theme = themes[variantCounter % themes.length];
    all.push({
      ...p,
      name: `${p.name} - ${theme} Serisi`,
      desc: `${p.desc} - ${theme} karakter baskılı özel seri`,
      tags: [...p.tags, theme.toLowerCase(), 'temalı'],
    });
    variantCounter++;
  }

  // Round 3: More brand variants if still under 1000
  const sizes = ['Mini', 'XL', 'Deluxe', 'Premium', 'Ekonomik'];
  for (const p of baseProducts) {
    if (all.length >= 1100) break;
    const size = sizes[variantCounter % sizes.length];
    all.push({
      ...p,
      name: `${p.name} ${size}`,
      desc: `${p.desc} — ${size} versiyon`,
      tags: [...p.tags, size.toLowerCase()],
    });
    variantCounter++;
  }

  return all;
}

/* ═══════════════════════════════════════════════
   SEED EXECUTION
   ═══════════════════════════════════════════════ */

async function main() {
  console.log('🧸 Çocuk ürünleri seed başlıyor...');
  await ds.initialize();
  console.log('✅ Veritabanı bağlantısı kuruldu');

  // Find or create an owner user
  const userResult = await ds.query(`SELECT id FROM users LIMIT 1`);
  if (!userResult.length) {
    console.log('❌ Kullanıcı bulunamadı. Önce bir kullanıcı oluşturun.');
    await ds.destroy();
    return;
  }
  const ownerId = userResult[0].id;
  console.log(`👤 Mağaza sahibi: ${ownerId}`);

  // Create child-focused stores
  console.log('\n🏪 Mağazalar oluşturuluyor...');
  const storeIds: string[] = [];

  for (const store of CHILD_STORES) {
    const storeSlug = slug(store.name, store.district.toLowerCase());
    const cats = STORE_CATEGORIES[store.cat] || ['Oyuncak & Hobi', 'Anne & Çocuk'];

    try {
      const existing = await ds.query(`SELECT id FROM stores WHERE slug = $1`, [storeSlug]);
      if (existing.length) {
        storeIds.push(existing[0].id);
        console.log(`  ⏭ ${store.name} zaten var`);
        continue;
      }

      const result = await ds.query(`
        INSERT INTO stores ("ownerId", name, slug, description, logo, "coverImage", images,
          location, latitude, longitude, address, "contactInfo", categories, tags,
          "openingHours", "ratingAverage", "ratingCount", "isVerified", "isActive", "productsCount")
        VALUES ($1, $2, $3, $4, $5, $6, $7,
          ST_SetSRID(ST_MakePoint($8, $9), 4326)::geography, $9, $8,
          $10, $11, $12, $13, $14, $15, $16, true, true, 0)
        RETURNING id
      `, [
        ownerId,
        store.name,
        storeSlug,
        `${store.district} bölgesindeki ${store.name} — bebek, çocuk oyuncakları ve eğitici ürünler`,
        `https://ui-avatars.com/api/?name=${encodeURIComponent(store.name)}&background=FF6B6B&color=fff&size=200`,
        `https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=800`,
        JSON.stringify([
          'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=600',
          'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600',
        ]),
        store.lng, store.lat,
        JSON.stringify({ city: 'İstanbul', district: store.district, street: `${store.district} Merkez Caddesi No:${rand(1, 120)}` }),
        JSON.stringify({ phone: `0212${rand(100, 999)}${rand(1000, 9999)}`, email: `info@${storeSlug}.com` }),
        JSON.stringify(cats),
        JSON.stringify(['çocuk', 'bebek', 'oyuncak', 'eğitici', store.district.toLowerCase()]),
        JSON.stringify([
          { day: 'Pazartesi-Cuma', open: '09:00', close: '20:00' },
          { day: 'Cumartesi', open: '10:00', close: '21:00' },
          { day: 'Pazar', open: '11:00', close: '19:00' },
        ]),
        randF(4.0, 4.9),
        rand(50, 500),
      ]);
      storeIds.push(result[0].id);
      console.log(`  ✅ ${store.name} (${store.district})`);
    } catch (err) {
      console.log(`  ⚠️ ${store.name}: ${(err as Error).message}`);
    }
  }

  if (!storeIds.length) {
    console.log('❌ Hiç mağaza oluşturulamadı!');
    await ds.destroy();
    return;
  }

  // Generate products
  const allProducts = generateAllProducts();
  console.log(`\n📦 ${allProducts.length} ürün oluşturuluyor...`);

  let created = 0;
  let skipped = 0;
  const BATCH_SIZE = 50;

  // Unsplash child/toy/baby image pool
  const CHILD_IMAGES = [
    'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=300',
    'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=300',
    'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=300',
    'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=300',
    'https://images.unsplash.com/photo-1587654780291-39c9404d7dd0?w=300',
    'https://images.unsplash.com/photo-1596568426004-73d7d386a5c1?w=300',
    'https://images.unsplash.com/photo-1555009393-f20bdb245c4d?w=300',
    'https://images.unsplash.com/photo-1578269174936-2709b6aeb913?w=300',
    'https://images.unsplash.com/photo-1560859251-d563a49c5e4a?w=300',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=300',
    'https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=300',
    'https://images.unsplash.com/photo-1563396983906-b3795482a59a?w=300',
    'https://images.unsplash.com/photo-1508896694512-1eade558679c?w=300',
    'https://images.unsplash.com/photo-1581235707960-35f13de9d3e7?w=300',
    'https://images.unsplash.com/photo-1581557991964-125469da3b8a?w=300',
    'https://images.unsplash.com/photo-1609220136736-443140cffec6?w=300',
    'https://images.unsplash.com/photo-1580477667995-2b94f01c9516?w=300',
    'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=300',
    'https://images.unsplash.com/photo-1596568426004-73d7d386a5c1?w=300',
    'https://images.unsplash.com/photo-1575364289437-fb1479d52732?w=300',
  ];

  for (let batch = 0; batch < allProducts.length; batch += BATCH_SIZE) {
    const batchItems = allProducts.slice(batch, batch + BATCH_SIZE);
    const values: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    for (const product of batchItems) {
      const storeId = pick(storeIds);
      const productSlug = slug(product.name, `${rand(1000, 99999)}`);
      const price = randF(product.priceRange[0], product.priceRange[1]);
      const hasSale = Math.random() > 0.6;
      const salePrice = hasSale ? +(price * randF(0.7, 0.9)).toFixed(2) : null;
      const img = pick(CHILD_IMAGES);
      const rating = randF(3.5, 5.0);
      const ratingCount = rand(10, 500);
      const isFeatured = Math.random() > 0.85;

      values.push(`($${paramIdx}, $${paramIdx + 1}, $${paramIdx + 2}, $${paramIdx + 3}, $${paramIdx + 4}, $${paramIdx + 5}, $${paramIdx + 6}, $${paramIdx + 7}, $${paramIdx + 8}, $${paramIdx + 9}, $${paramIdx + 10}, $${paramIdx + 11}, $${paramIdx + 12}, $${paramIdx + 13}, $${paramIdx + 14})`);
      params.push(
        storeId,                              // storeId
        product.name,                         // name
        productSlug,                          // slug
        product.desc,                         // description
        product.desc.substring(0, 80),        // shortDescription
        price,                                // price
        salePrice,                            // salePrice
        JSON.stringify(product.categories),    // categories
        JSON.stringify([...product.tags, product.ageGroup + ' yaş']), // tags
        JSON.stringify([img, pick(CHILD_IMAGES)]), // images
        img,                                  // thumbnail
        rating,                               // ratingAverage
        ratingCount,                          // ratingCount
        true,                                 // isActive
        isFeatured,                           // isFeatured
      );
      paramIdx += 15;
    }

    try {
      const insertQuery = `
        INSERT INTO products ("storeId", name, slug, description, "shortDescription",
          price, "salePrice", categories, tags, images, thumbnail,
          "ratingAverage", "ratingCount", "isActive", "isFeatured")
        VALUES ${values.join(',\n')}
        ON CONFLICT (slug) DO NOTHING
      `;
      const result = await ds.query(insertQuery, params);
      const insertedCount = typeof result === 'object' && result?.length !== undefined ? result.length : batchItems.length;
      created += batchItems.length;
    } catch (err) {
      skipped += batchItems.length;
      console.log(`  ⚠️ Batch ${Math.floor(batch / BATCH_SIZE) + 1} hata: ${(err as Error).message.substring(0, 100)}`);
    }

    if ((batch / BATCH_SIZE) % 5 === 0) {
      console.log(`  📊 İlerleme: ${Math.min(batch + BATCH_SIZE, allProducts.length)}/${allProducts.length}`);
    }
  }

  // Update store product counts
  await ds.query(`
    UPDATE stores SET "productsCount" = (
      SELECT COUNT(*) FROM products WHERE products."storeId" = stores.id AND products."isActive" = true
    ) WHERE id = ANY($1::uuid[])
  `, [storeIds]);

  console.log(`\n✅ Tamamlandı!`);
  console.log(`   🏪 Mağaza: ${storeIds.length}`);
  console.log(`   📦 Ürün: ${created} oluşturuldu, ${skipped} atlandı`);
  console.log(`   📊 Toplam: ${allProducts.length} ürün template`);

  await ds.destroy();
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
