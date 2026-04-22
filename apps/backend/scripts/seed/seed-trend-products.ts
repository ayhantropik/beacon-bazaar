/**
 * Trend-based product seeder: 800+ products informed by 2025-2026 market research
 * Categories: teens, young adults, adults, plus trending child products
 * Run with: cd apps/backend && npx tsx src/seed-trend-products.ts
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

interface ProductTemplate {
  name: string;
  desc: string;
  priceRange: [number, number];
  tags: string[];
  categories: string[];
}

/* ═══ TREND ÇOCUK ÜRÜNLERİ (2025-2026 viral) ═══ */
const TREND_CHILD: ProductTemplate[] = [
  // Manyetik Yapı Blokları (Amazon #1 trend)
  { name: 'Magna-Tiles Deluxe 90 Parça', desc: 'Manyetik geometrik yapı blokları, şeffaf renkli', priceRange: [499, 799], tags: ['manyetik', 'blok', 'yapı', 'STEM', 'eğitici', '3-5 yaş', 'trend', 'çocuk'], categories: ['Oyuncak & Hobi', 'Eğitici'] },
  { name: 'Manyetik Toplar Yapı Seti 100lü', desc: 'Metal toplar + manyetik çubuklar, 3D yapılar', priceRange: [199, 349], tags: ['manyetik', 'top', 'yapı', 'STEM', '6-9 yaş', 'çocuk', 'eğitici'], categories: ['Oyuncak & Hobi', 'Eğitici'] },
  // Squishmallows (Global fenomen)
  { name: 'Squishmallows Unicorn 30cm', desc: 'Ultra yumuşak peluş, koleksiyon serisi', priceRange: [149, 249], tags: ['squishmallow', 'peluş', 'unicorn', 'koleksiyon', 'trend', 'çocuk', 'kız'], categories: ['Oyuncak & Hobi'] },
  { name: 'Squishmallows Panda 20cm', desc: 'Kawaii tarzı, anti-alerjik', priceRange: [99, 179], tags: ['squishmallow', 'peluş', 'panda', 'koleksiyon', 'trend', 'çocuk'], categories: ['Oyuncak & Hobi'] },
  { name: 'Squishmallows Kedi 40cm', desc: 'Dev boy, yastık olarak da kullanılır', priceRange: [199, 349], tags: ['squishmallow', 'peluş', 'kedi', 'trend', 'çocuk', 'kız'], categories: ['Oyuncak & Hobi'] },
  // Mini Brands (viral unboxing)
  { name: 'Mini Brands Buzdolabı Seti', desc: 'UV ışıklı, 30+ minyatür ürün, koleksiyon', priceRange: [199, 349], tags: ['mini brands', 'koleksiyon', 'minyatür', 'unboxing', 'trend', '6-9 yaş', 'çocuk'], categories: ['Oyuncak & Hobi'] },
  { name: 'Mini Brands Süpermarket', desc: '5 sürpriz minyatür, gerçek marka replika', priceRange: [79, 129], tags: ['mini brands', 'koleksiyon', 'sürpriz', 'trend', 'çocuk'], categories: ['Oyuncak & Hobi'] },
  // Clickeez (2025 viral fidget)
  { name: 'Clickeez Mekanik Fidget 5li', desc: 'Mekanik klavye hissi, koleksiyon, 70+ tasarım', priceRange: [99, 179], tags: ['clickeez', 'fidget', 'mekanik', 'trend', 'viral', '6-9 yaş', 'çocuk'], categories: ['Oyuncak & Hobi'] },
  // Slime Trends
  { name: 'Gui Gui Lüks Slime Koleksiyon', desc: 'Gizli figürlü, parfümlü, premium slime', priceRange: [79, 149], tags: ['slime', 'gui gui', 'koleksiyon', 'duyusal', 'trend', 'çocuk', 'kız'], categories: ['Oyuncak & Hobi'] },
  { name: 'Slime Yapım Seti Pro 40 Renk', desc: 'Glitter, boncuk, köpük, araçlar dahil', priceRange: [149, 249], tags: ['slime', 'diy', 'yaratıcı', 'trend', '6-9 yaş', 'çocuk'], categories: ['Oyuncak & Hobi'] },
  // STEM Coding (büyüyen segment)
  { name: 'Osmo Genius Starter Kit', desc: 'iPad uyumlu, 5 eğitici oyun, fiziksel+dijital', priceRange: [499, 799], tags: ['osmo', 'STEM', 'kodlama', 'eğitici', 'tablet', 'trend', '6-9 yaş', 'çocuk'], categories: ['Eğitici', 'Oyuncak & Hobi'] },
  { name: 'Botley 2.0 Kodlama Robotu', desc: 'Ekransız kodlama, 78 parça, engel algılama', priceRange: [349, 549], tags: ['robot', 'kodlama', 'STEM', 'eğitici', '6-9 yaş', 'çocuk'], categories: ['Eğitici', 'Oyuncak & Hobi'] },
  // Montessori Trend (Türkiye'de güçlü büyüme)
  { name: 'Montessori Meşgul Tahtası Büyük', desc: 'Kilit, fermuar, düğme, toka — 20 aktivite', priceRange: [199, 349], tags: ['montessori', 'meşgul tahtası', 'busy board', 'eğitici', '1-2 yaş', 'bebek', 'çocuk', 'trend'], categories: ['Eğitici', 'Oyuncak & Hobi'] },
  { name: 'Montessori Gökkuşağı İstifleme', desc: 'Ahşap gökkuşağı, 12 parça, doğal boyalar', priceRange: [149, 249], tags: ['montessori', 'gökkuşağı', 'ahşap', 'eğitici', '1-2 yaş', 'bebek', 'trend'], categories: ['Eğitici', 'Oyuncak & Hobi'] },
  { name: 'Montessori Nesne Kutusu', desc: 'Nesne sürekliliği, 4 top + kutu', priceRange: [99, 179], tags: ['montessori', 'nesne sürekliliği', 'eğitici', '0-1 yaş', 'bebek', 'trend'], categories: ['Eğitici', 'Oyuncak & Hobi'] },
  // Eco-friendly (yükselen trend)
  { name: 'Green Toys Çay Seti Geri Dönüşüm', desc: '%100 geri dönüştürülmüş plastik, BPA-free', priceRange: [149, 249], tags: ['green toys', 'eko', 'sürdürülebilir', 'çocuk', '2-3 yaş', 'trend'], categories: ['Oyuncak & Hobi'] },
  { name: 'Hape Ahşap Mutfak Seti Eko', desc: 'FSC sertifikalı ahşap, doğal boyalar', priceRange: [349, 599], tags: ['hape', 'ahşap', 'eko', 'mutfak', 'rol yapma', '3-5 yaş', 'çocuk', 'trend'], categories: ['Oyuncak & Hobi'] },
  // National Geographic Kitleri
  { name: 'National Geographic Volkan Yapım', desc: 'Patlayan volkan deneyi, bilimsel açıklama', priceRange: [99, 179], tags: ['national geographic', 'bilim', 'volkan', 'deney', 'STEM', '6-9 yaş', 'çocuk', 'eğitici'], categories: ['Eğitici', 'Oyuncak & Hobi'] },
  { name: 'National Geographic Fosil Kazı Kiti', desc: 'Gerçek fosiller, paleontolog aletleri', priceRange: [129, 199], tags: ['national geographic', 'fosil', 'kazı', 'bilim', 'STEM', '6-9 yaş', 'çocuk', 'eğitici'], categories: ['Eğitici', 'Oyuncak & Hobi'] },
  { name: 'National Geographic Mega Kristal Seti', desc: '8 renk kristal yetiştirme, 7-14 gün', priceRange: [149, 249], tags: ['national geographic', 'kristal', 'bilim', 'deney', 'STEM', '6-9 yaş', 'çocuk', 'eğitici'], categories: ['Eğitici', 'Oyuncak & Hobi'] },
];

/* ═══ ERGEN/GENÇ TREND (10-19 yaş, 2025-2026) ═══ */
const TEEN_TREND: ProductTemplate[] = [
  // Pop Mart / Blind Box (2025'in en büyük trendi)
  { name: 'Pop Mart Labubu Sitting Seri', desc: 'Sürpriz blind box, koleksiyon figür', priceRange: [149, 249], tags: ['pop mart', 'labubu', 'blind box', 'koleksiyon', 'trend', 'viral'], categories: ['Oyuncak & Hobi', 'Hediyelik'] },
  { name: 'Pop Mart Skullpanda Seri', desc: 'Karanlık estetik koleksiyon figür', priceRange: [149, 249], tags: ['pop mart', 'skullpanda', 'blind box', 'koleksiyon', 'trend'], categories: ['Oyuncak & Hobi', 'Hediyelik'] },
  { name: 'Pop Mart Molly Seri', desc: 'Klasik Pop Mart koleksiyon, 12 farklı figür', priceRange: [129, 199], tags: ['pop mart', 'molly', 'blind box', 'koleksiyon', 'trend'], categories: ['Oyuncak & Hobi', 'Hediyelik'] },
  // DIY / Craft (ergen kızlar)
  { name: 'Cool Maker Bileklik Stüdyosu', desc: 'Friendship bracelet, 100+ boncuk, düzenek', priceRange: [149, 249], tags: ['diy', 'bileklik', 'friendship', 'el işi', 'yaratıcı', 'kız', '10-14 yaş'], categories: ['Oyuncak & Hobi', 'Hediyelik'] },
  { name: 'Kendi Mumunu Yap Seti Premium', desc: 'Soya wax, esans yağları, kalıplar, fitil', priceRange: [199, 349], tags: ['diy', 'mum', 'yaratıcı', 'el işi', 'wellness', 'trend'], categories: ['Oyuncak & Hobi', 'Hediyelik'] },
  { name: 'Reçine Takı Yapım Seti', desc: 'Epoxy resin, kalıplar, glitter, zincir', priceRange: [149, 249], tags: ['diy', 'reçine', 'takı', 'yaratıcı', 'el işi', 'kız', 'trend'], categories: ['Oyuncak & Hobi', 'Hediyelik'] },
  // Tech / STEM (ergen erkekler + genel)
  { name: 'Arduino Başlangıç Kiti', desc: 'UNO R3 + 20+ deney, Türkçe kitap', priceRange: [249, 399], tags: ['arduino', 'kodlama', 'elektronik', 'STEM', 'robot', '10-14 yaş', 'eğitici'], categories: ['Eğitici', 'Elektronik'] },
  { name: 'Snap Circuits Extreme 750', desc: '750+ deney, elektronik devre öğrenme', priceRange: [399, 599], tags: ['snap circuits', 'elektronik', 'devre', 'STEM', '10-14 yaş', 'eğitici'], categories: ['Eğitici', 'Oyuncak & Hobi'] },
  { name: '3D Baskı Kalemi Seti', desc: 'PLA filament, 12 renk, şablon kitabı', priceRange: [199, 349], tags: ['3d kalem', 'yaratıcı', 'teknoloji', 'STEM', '10-14 yaş'], categories: ['Oyuncak & Hobi', 'Elektronik'] },
  // LEGO (kidult + teen trends)
  { name: 'LEGO Technic Lamborghini', desc: '3696 parça, gerçekçi mekanizma', priceRange: [2999, 4999], tags: ['lego', 'technic', 'araba', 'lamborghini', 'premium', 'koleksiyon'], categories: ['Oyuncak & Hobi'] },
  { name: 'LEGO Architecture Paris', desc: 'Eyfel Kulesi, 1458 parça, vitrin modeli', priceRange: [799, 1299], tags: ['lego', 'architecture', 'paris', 'koleksiyon', 'dekor', 'yetişkin'], categories: ['Oyuncak & Hobi', 'Hediyelik'] },
  { name: 'LEGO Botanicals Orkide', desc: 'Yapay çiçek, dekoratif, 608 parça', priceRange: [349, 549], tags: ['lego', 'botanik', 'çiçek', 'dekor', 'yetişkin', 'hediyelik'], categories: ['Oyuncak & Hobi', 'Hediyelik'] },
  { name: 'LEGO Ideas Dünya Haritası', desc: '11695 parça, duvar panosu, mega set', priceRange: [1999, 2999], tags: ['lego', 'ideas', 'dünya', 'harita', 'premium', 'koleksiyon', 'yetişkin'], categories: ['Oyuncak & Hobi', 'Hediyelik'] },
  // Nostalji (2000ler geri dönüşü)
  { name: 'Tamagotchi Uni Akıllı', desc: 'WiFi bağlantılı, renkli ekran, 2025 versiyon', priceRange: [299, 449], tags: ['tamagotchi', 'nostalji', 'sanal pet', 'retro', 'trend'], categories: ['Oyuncak & Hobi', 'Elektronik'] },
  { name: 'Polly Pocket Mega Mall', desc: 'Nostalji serisi, mikro figürler, 3 katlı AVM', priceRange: [249, 399], tags: ['polly pocket', 'nostalji', 'minyatür', 'kız', 'retro', 'trend'], categories: ['Oyuncak & Hobi'] },
  // Karaoke & Müzik
  { name: 'Bluetooth Karaoke Mikrofon LED', desc: 'Renk değiştiren LED, echo efekt, şarjlı', priceRange: [149, 249], tags: ['karaoke', 'mikrofon', 'bluetooth', 'müzik', 'parti', 'trend'], categories: ['Oyuncak & Hobi', 'Elektronik'] },
  // Journal & Stationery (ergen kız trendi)
  { name: 'Bullet Journal Premium Set', desc: 'A5 noktalı defter, 12 kalem, sticker, washi tape', priceRange: [149, 249], tags: ['journal', 'defter', 'yaratıcı', 'sticker', 'kız', 'kırtasiye', 'trend'], categories: ['Kitap & Kırtasiye', 'Hediyelik'] },
  { name: 'Washi Tape Koleksiyonu 30lu', desc: 'Japon kağıt bantlar, farklı desenler', priceRange: [79, 149], tags: ['washi', 'tape', 'diy', 'yaratıcı', 'journal', 'kız', 'trend'], categories: ['Kitap & Kırtasiye'] },
];

/* ═══ GENÇ YETİŞKİN + YETİŞKİN TREND (20+ yaş) ═══ */
const ADULT_TREND: ProductTemplate[] = [
  // Akıllı Ev (hediye trend)
  { name: 'Akıllı LED Şerit 10m WiFi', desc: 'Alexa/Google uyumlu, 16M renk, müzik senkron', priceRange: [199, 349], tags: ['akıllı ev', 'led', 'dekor', 'teknoloji', 'oda', 'trend'], categories: ['Elektronik', 'Ev & Yaşam'] },
  { name: 'Robot Süpürge Akıllı Haritalama', desc: 'LIDAR navigasyon, mop fonksiyonu, uygulama kontrol', priceRange: [3999, 6999], tags: ['robot süpürge', 'akıllı ev', 'teknoloji', 'pratik'], categories: ['Elektronik', 'Ev & Yaşam'] },
  { name: 'Akıllı Aroma Difüzör', desc: 'WiFi kontrol, zamanlayıcı, 300ml, LED ambiyans', priceRange: [199, 349], tags: ['aroma', 'difüzör', 'wellness', 'ev', 'hediye', 'trend'], categories: ['Ev & Yaşam', 'Hediyelik'] },
  // Wellness & Self-care (kadın trendi)
  { name: 'Gua Sha & Jade Roller Set', desc: 'Doğal jade taşı, hediye kutusunda', priceRange: [99, 199], tags: ['gua sha', 'jade', 'skincare', 'bakım', 'wellness', 'kadın', 'trend'], categories: ['Kozmetik', 'Hediyelik'] },
  { name: 'LED Yüz Maskesi Terapi', desc: '7 renk LED, anti-aging, akne tedavisi', priceRange: [299, 499], tags: ['led maske', 'skincare', 'anti-aging', 'teknoloji', 'wellness', 'kadın', 'trend'], categories: ['Kozmetik', 'Elektronik'] },
  { name: 'Aromaterapi Mum Seti 6lı', desc: 'Soya wax, doğal esans, hediye kutusu', priceRange: [149, 249], tags: ['mum', 'aromaterapi', 'wellness', 'ev', 'hediyelik', 'kadın'], categories: ['Ev & Yaşam', 'Hediyelik'] },
  { name: 'Spa Banyo Seti Premium', desc: 'Banyo topu, tuz, yağ, lif — hediye kutusu', priceRange: [199, 349], tags: ['spa', 'banyo', 'wellness', 'bakım', 'hediyelik', 'kadın'], categories: ['Kozmetik', 'Hediyelik'] },
  // Deneyim & Abonelik
  { name: 'Kahve Aboneliği 3 Ay', desc: 'Ayda 2 farklı single origin, el kavrulmuş', priceRange: [249, 399], tags: ['kahve', 'abonelik', 'gurme', 'deneyim', 'hediye', 'trend'], categories: ['Süpermarket', 'Hediyelik'] },
  { name: 'Çikolata Tadım Kutusu Premium', desc: '12 farklı bean-to-bar çikolata, dünya seçkisi', priceRange: [199, 349], tags: ['çikolata', 'gurme', 'tadım', 'hediyelik', 'premium'], categories: ['Süpermarket', 'Hediyelik'] },
  // Kidult Trend (yetişkin oyuncak)
  { name: 'Premium 1000 Parça Puzzle Sanat', desc: 'Klimt/Van Gogh/Monet reprodüksiyon', priceRange: [149, 249], tags: ['puzzle', 'sanat', 'yetişkin', 'rahatlatıcı', 'hediyelik'], categories: ['Oyuncak & Hobi', 'Hediyelik'] },
  { name: '3D Ahşap Mekanik Puzzle', desc: 'Vitesli saat/tren/araba, 300+ parça', priceRange: [249, 449], tags: ['puzzle', 'mekanik', 'ahşap', '3d', 'yetişkin', 'hediyelik'], categories: ['Oyuncak & Hobi', 'Hediyelik'] },
  // Fotoğraf & Yaratıcı
  { name: 'Instax Mini 12 Fotoğraf Makinesi', desc: 'Anlık baskı, selfie aynası, 10 film dahil', priceRange: [599, 899], tags: ['instax', 'polaroid', 'fotoğraf', 'anı', 'kamera', 'trend', 'kız'], categories: ['Elektronik', 'Hediyelik'] },
  { name: 'Dijital Fotoğraf Çerçevesi WiFi', desc: '10.1 inç, uygulama ile fotoğraf gönderme', priceRange: [499, 799], tags: ['fotoğraf', 'çerçeve', 'dijital', 'wifi', 'anı', 'aile'], categories: ['Elektronik', 'Hediyelik'] },
  // Erkek Hediye
  { name: 'Deri El Yapımı Cüzdan', desc: 'Hakiki deri, isim baskılı, RFID korumalı', priceRange: [249, 449], tags: ['cüzdan', 'deri', 'el yapımı', 'kişiselleştirilmiş', 'erkek', 'hediyelik'], categories: ['Saat & Aksesuar', 'Hediyelik'] },
  { name: 'Viski Tadım Seti', desc: '4 farklı single malt, tadım notları kartı', priceRange: [399, 699], tags: ['viski', 'tadım', 'gurme', 'erkek', 'premium', 'hediyelik', 'yetişkin'], categories: ['Süpermarket', 'Hediyelik'] },
  { name: 'Tıraş Seti Premium Ahşap', desc: 'Porsuk fırçası, jilet, stand, sabun — kutu', priceRange: [299, 499], tags: ['tıraş', 'bakım', 'erkek', 'premium', 'ahşap', 'hediyelik'], categories: ['Kozmetik', 'Hediyelik'] },
  // Türkiye Kültürel Hediyeler
  { name: 'El Yapımı Seramik Çay Seti', desc: 'Çini motifli, 6 kişilik, Kütahya el işi', priceRange: [349, 599], tags: ['seramik', 'çay', 'el yapımı', 'kültürel', 'hediyelik', 'premium'], categories: ['Ev & Yaşam', 'Hediyelik'] },
  { name: 'Osmanlı Motifli Lamba', desc: 'Mozaik cam, el yapımı, masaüstü', priceRange: [249, 449], tags: ['lamba', 'osmanlı', 'dekor', 'el yapımı', 'kültürel', 'hediyelik'], categories: ['Ev & Yaşam', 'Hediyelik'] },
  { name: 'Türk Kahvesi Deneyim Seti', desc: 'Cezve, fincan, kahve, lokum — hediye kutusu', priceRange: [199, 349], tags: ['türk kahvesi', 'cezve', 'kültürel', 'gurme', 'hediyelik', 'geleneksel'], categories: ['Ev & Yaşam', 'Hediyelik'] },
  // 50+ yaş hediye
  { name: 'Dijital Fotoğraf Çerçevesi Aile', desc: 'Torunlar fotoğraf gönderebilir, WiFi, büyük ekran', priceRange: [599, 999], tags: ['fotoğraf', 'aile', 'bağlantı', 'dijital', 'kolay', 'yaşlı', 'hediyelik'], categories: ['Elektronik', 'Hediyelik'] },
  { name: 'Ergonomik Bahçe Alet Seti', desc: 'Yumuşak tutma, hafif, 7 parça, çanta dahil', priceRange: [199, 349], tags: ['bahçe', 'alet', 'ergonomik', 'hobi', 'doğa', 'pratik'], categories: ['Ev & Yaşam'] },
  { name: 'Premium Battaniye Kaşmir', desc: '%100 kaşmir, hediye kutusu, monogram opsiyonu', priceRange: [499, 999], tags: ['battaniye', 'kaşmir', 'konfor', 'premium', 'sıcak', 'hediyelik'], categories: ['Ev & Yaşam', 'Hediyelik'] },
  { name: 'Sesli Kitap Cihazı Kolay Kullanım', desc: 'Büyük butonlar, 1000+ Türkçe kitap, şarjlı', priceRange: [349, 549], tags: ['sesli kitap', 'kolay', 'okuma', 'pratik', 'yaşlı'], categories: ['Elektronik', 'Kitap & Kırtasiye'] },
];

/* ═══ BAYRAM & KÜLTÜREL HEDİYELER (Türkiye özel) ═══ */
const CULTURAL_GIFTS: ProductTemplate[] = [
  { name: 'Bayram Çikolata Kutusu Premium', desc: 'El yapımı çikolata, 40 parça, ahşap kutu', priceRange: [249, 449], tags: ['bayram', 'çikolata', 'hediyelik', 'premium', 'ramazan', 'kurban'], categories: ['Süpermarket', 'Hediyelik'] },
  { name: 'Sünnet Hediye Seti Altın Kaplama', desc: 'Kur\'an, tesbih, seccade — altın detaylı kutu', priceRange: [349, 599], tags: ['sünnet', 'hediye', 'kültürel', 'altın', 'erkek', 'çocuk', 'geleneksel'], categories: ['Hediyelik'] },
  { name: 'Şeker Bayramı Özel Lokum Kutusu', desc: 'Antep fıstıklı, gül, nar — 48 parça', priceRange: [149, 249], tags: ['bayram', 'lokum', 'şeker', 'hediyelik', 'geleneksel', 'ramazan'], categories: ['Süpermarket', 'Hediyelik'] },
  { name: 'Okul Başlangıç Hediye Paketi', desc: 'Çanta, kalem kutu, matara, beslenme, 8 parça', priceRange: [249, 449], tags: ['okul', 'başlangıç', 'hediye', 'çocuk', 'eğitici', 'kırtasiye'], categories: ['Kitap & Kırtasiye', 'Anne & Çocuk'] },
  { name: 'İsme Özel Altın Kolye', desc: '14 ayar altın kaplama, isim yazılı, ince zincir', priceRange: [199, 399], tags: ['kolye', 'altın', 'isim', 'kişiselleştirilmiş', 'kadın', 'hediyelik'], categories: ['Saat & Aksesuar', 'Hediyelik'] },
  { name: 'Ramazan Hediye Kutusu Aile', desc: 'Hurma, bal, kahve, çay, fincan — premium kutu', priceRange: [299, 499], tags: ['ramazan', 'hediye', 'aile', 'gurme', 'geleneksel', 'hediyelik'], categories: ['Süpermarket', 'Hediyelik'] },
  { name: 'Nazar Boncuğu Dekor Seti', desc: 'El yapımı cam, duvar süsü + masa objesi', priceRange: [99, 199], tags: ['nazar', 'dekor', 'geleneksel', 'el yapımı', 'kültürel', 'hediyelik'], categories: ['Ev & Yaşam', 'Hediyelik'] },
  { name: 'Ebru Sanatı Başlangıç Seti', desc: 'Boyalar, fırçalar, tekne, kağıt — Türkçe rehber', priceRange: [149, 249], tags: ['ebru', 'sanat', 'geleneksel', 'yaratıcı', 'diy', 'kültürel'], categories: ['Oyuncak & Hobi', 'Hediyelik'] },
];

function generateAllProducts(): ProductTemplate[] {
  const all: ProductTemplate[] = [...TREND_CHILD, ...TEEN_TREND, ...ADULT_TREND, ...CULTURAL_GIFTS];
  const baseProducts = [...all];
  let counter = 0;

  // Round 1: Color variants (6 colors × 72 base = 432)
  const colors = ['Pembe', 'Mavi', 'Yeşil', 'Siyah', 'Beyaz', 'Mor'];
  for (const color of colors) {
    for (const p of baseProducts) {
      if (all.length >= 850) break;
      all.push({
        ...p,
        name: `${p.name} - ${color}`,
        desc: `${p.desc} | ${color} renk seçeneği`,
        tags: [...p.tags, color.toLowerCase()],
      });
    }
    if (all.length >= 850) break;
  }

  // Round 2: Edition variants
  const editions = ['Limited Edition', 'Deluxe', 'XL', 'Mini', 'Premium', 'Pro', 'Eco'];
  for (const ed of editions) {
    for (const p of baseProducts) {
      if (all.length >= 850) break;
      all.push({
        ...p,
        name: `${p.name} ${ed}`,
        desc: `${p.desc} — ${ed} versiyon`,
        tags: [...p.tags, ed.toLowerCase()],
      });
    }
    if (all.length >= 850) break;
  }

  return all;
}

/* ═══ SEED EXECUTION ═══ */
async function main() {
  console.log('🎯 Trend ürünleri seed başlıyor...');
  await ds.initialize();
  console.log('✅ Veritabanı bağlantısı kuruldu');

  // Get existing stores
  const stores = await ds.query(`SELECT id, name, categories::text FROM stores WHERE "isActive" = true ORDER BY RANDOM() LIMIT 50`);
  if (!stores.length) {
    console.log('❌ Mağaza bulunamadı!');
    await ds.destroy();
    return;
  }
  console.log(`🏪 ${stores.length} mağaza bulundu`);

  // Match products to appropriate stores
  const allProducts = generateAllProducts();
  console.log(`📦 ${allProducts.length} ürün oluşturuluyor...`);

  const IMAGES = [
    'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=300',
    'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=300',
    'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=300',
    'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=300',
    'https://images.unsplash.com/photo-1581235707960-35f13de9d3e7?w=300',
    'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=300',
    'https://images.unsplash.com/photo-1541643600914-78b084683601?w=300',
    'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=300',
    'https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=300',
    'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300',
    'https://images.unsplash.com/photo-1560859251-d563a49c5e4a?w=300',
    'https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=300',
    'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=300',
  ];

  let created = 0;
  const BATCH_SIZE = 50;

  for (let batch = 0; batch < allProducts.length; batch += BATCH_SIZE) {
    const batchItems = allProducts.slice(batch, batch + BATCH_SIZE);
    const values: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    for (const product of batchItems) {
      // Pick a store that best matches the product's categories
      let store = stores[0];
      for (const s of stores) {
        const storeCats = s.categories || '';
        if (product.categories.some(c => storeCats.includes(c))) {
          store = s;
          break;
        }
      }
      // Fallback: random store
      if (!store) store = pick(stores);

      const productSlug = slug(product.name, `${rand(10000, 99999)}`);
      const price = randF(product.priceRange[0], product.priceRange[1]);
      const hasSale = Math.random() > 0.6;
      const salePrice = hasSale ? +(price * randF(0.7, 0.9)).toFixed(2) : null;
      const img = pick(IMAGES);

      values.push(`($${paramIdx}, $${paramIdx + 1}, $${paramIdx + 2}, $${paramIdx + 3}, $${paramIdx + 4}, $${paramIdx + 5}, $${paramIdx + 6}, $${paramIdx + 7}, $${paramIdx + 8}, $${paramIdx + 9}, $${paramIdx + 10}, $${paramIdx + 11}, $${paramIdx + 12}, $${paramIdx + 13}, $${paramIdx + 14})`);
      params.push(
        store.id, product.name, productSlug, product.desc, product.desc.substring(0, 80),
        price, salePrice,
        JSON.stringify(product.categories), JSON.stringify(product.tags),
        JSON.stringify([img, pick(IMAGES)]), img,
        randF(3.8, 5.0), rand(20, 800), true, Math.random() > 0.8,
      );
      paramIdx += 15;
    }

    try {
      await ds.query(`
        INSERT INTO products ("storeId", name, slug, description, "shortDescription",
          price, "salePrice", categories, tags, images, thumbnail,
          "ratingAverage", "ratingCount", "isActive", "isFeatured")
        VALUES ${values.join(',\n')}
        ON CONFLICT (slug) DO NOTHING
      `, params);
      created += batchItems.length;
    } catch (err) {
      console.log(`  ⚠️ Batch hata: ${(err as Error).message.substring(0, 100)}`);
    }

    if ((batch / BATCH_SIZE) % 4 === 0) {
      console.log(`  📊 İlerleme: ${Math.min(batch + BATCH_SIZE, allProducts.length)}/${allProducts.length}`);
    }
  }

  // Update store product counts
  await ds.query(`
    UPDATE stores SET "productsCount" = (
      SELECT COUNT(*) FROM products WHERE products."storeId" = stores.id AND products."isActive" = true
    )
  `);

  console.log(`\n✅ Tamamlandı! ${created} trend ürünü oluşturuldu.`);
  await ds.destroy();
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
