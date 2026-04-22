/**
 * Add 250+ trending products inspired by popular e-commerce platforms
 * Products are diverse, gender/age-appropriate, and well-tagged
 */
import 'dotenv/config';
import { DataSource } from 'typeorm';

const ds = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

interface Product {
  name: string;
  price: number;
  salePrice?: number;
  categories: string[];
  tags: string[];
  description: string;
}

// ─────────────────────────────────────────────────────────────────
// PRODUCT DATA - Trend, popüler ve hediye odaklı ürünler
// ─────────────────────────────────────────────────────────────────

const PRODUCTS: Product[] = [
  // ═══ GENÇ KIZ (10-18 yaş) ═══
  { name: 'LED Yıldız Projeksiyonlu Gece Lambası', price: 349, salePrice: 249, categories: ['Ev & Yaşam', 'Anne & Çocuk'], tags: ['kız', 'genç', 'çocuk', 'hediye', 'dekorasyon', 'trend', 'ışık', 'yıldız'], description: 'Odayı yıldızlı gökyüzüne çeviren LED projektör gece lambası' },
  { name: 'Kişiselleştirilebilir Friendship Bileklik Seti', price: 129, salePrice: 89, categories: ['Saat & Aksesuar', 'Anne & Çocuk'], tags: ['kız', 'genç', 'çocuk', 'bileklik', 'arkadaşlık', 'aksesuar', 'hediye', 'trend'], description: 'İsim ve sembol eklenebilen arkadaşlık bileklik seti' },
  { name: 'Polaroid Mini Fotoğraf Makinesi', price: 1299, salePrice: 999, categories: ['Elektronik'], tags: ['kız', 'genç', 'fotoğraf', 'polaroid', 'trend', 'hediye', 'anı', 'popüler'], description: 'Anında baskı yapan retro mini fotoğraf makinesi' },
  { name: 'Kawaii Kırtasiye Seti 30 Parça', price: 199, salePrice: 149, categories: ['Anne & Çocuk'], tags: ['kız', 'genç', 'çocuk', 'kırtasiye', 'okul', 'kawaii', 'sevimli', 'hediye'], description: 'Kalem, silgi, sticker, not defteri içeren kawaii set' },
  { name: 'Bluetooth Kedi Kulaklık LED Işıklı', price: 399, salePrice: 299, categories: ['Elektronik', 'Anne & Çocuk'], tags: ['kız', 'genç', 'çocuk', 'kulaklık', 'kedi', 'bluetooth', 'trend', 'ışıklı', 'hediye'], description: 'Kedi kulak tasarımlı LED ışıklı kablosuz kulaklık' },
  { name: 'DIY Takı Yapım Seti Premium', price: 279, salePrice: 199, categories: ['Anne & Çocuk', 'Saat & Aksesuar'], tags: ['kız', 'genç', 'çocuk', 'takı', 'diy', 'el işi', 'yaratıcı', 'hediye'], description: 'Bileklik, kolye ve küpe yapımı için 500+ parça set' },
  { name: 'Unicorn Peluş Yastık Büyük Boy', price: 249, salePrice: 179, categories: ['Ev & Yaşam', 'Anne & Çocuk'], tags: ['kız', 'genç', 'çocuk', 'unicorn', 'peluş', 'yastık', 'hediye', 'sevimli'], description: '60cm büyük boy unicorn peluş dekoratif yastık' },
  { name: 'Renkli Saç Tebeşiri Seti 12 Renk', price: 149, salePrice: 99, categories: ['Kozmetik', 'Anne & Çocuk'], tags: ['kız', 'genç', 'çocuk', 'saç', 'renk', 'tebeşir', 'eğlenceli', 'hediye', 'trend'], description: 'Yıkanabilir geçici saç renklendirme tebeşiri seti' },
  { name: 'Mini Çanta Crossbody Parlak', price: 299, salePrice: 219, categories: ['Ayakkabı & Çanta', 'Kadın'], tags: ['kız', 'genç', 'çanta', 'mini', 'parlak', 'moda', 'hediye', 'trend'], description: 'Holografik parlak mini crossbody çanta' },
  { name: 'Pop It Fidget Oyuncak Dev Boy', price: 89, salePrice: 59, categories: ['Anne & Çocuk'], tags: ['kız', 'erkek', 'çocuk', 'genç', 'oyuncak', 'fidget', 'pop it', 'trend', 'stres'], description: 'Gökkuşağı renkli büyük boy pop it fidget' },
  { name: 'Işıklı Makyaj Aynası Dokunmatik', price: 349, salePrice: 259, categories: ['Kozmetik'], tags: ['kız', 'genç', 'kadın', 'makyaj', 'ayna', 'ışıklı', 'hediye', 'güzellik'], description: 'LED aydınlatmalı dokunmatik dimmer makyaj aynası' },
  { name: 'Kristal Sticker Telefon Kılıfı DIY', price: 179, salePrice: 129, categories: ['Elektronik', 'Anne & Çocuk'], tags: ['kız', 'genç', 'telefon', 'kılıf', 'diy', 'kristal', 'trend', 'hediye'], description: 'Kendi telefon kılıfını tasarla kristal sticker seti' },
  { name: 'Günlük / Bullet Journal Seti', price: 199, salePrice: 149, categories: ['Anne & Çocuk'], tags: ['kız', 'genç', 'günlük', 'journal', 'kırtasiye', 'yaratıcı', 'hediye', 'planlama'], description: 'Bullet journal, washi tape ve sticker içeren planlama seti' },
  { name: 'Kablosuz Karaoke Mikrofon Bluetooth', price: 399, salePrice: 279, categories: ['Elektronik'], tags: ['kız', 'erkek', 'genç', 'çocuk', 'karaoke', 'mikrofon', 'müzik', 'eğlence', 'hediye', 'trend'], description: 'Hoparlörlü LED ışıklı kablosuz karaoke mikrofon' },
  { name: 'Origami Kağıt Seti 200 Yaprak', price: 99, salePrice: 69, categories: ['Anne & Çocuk'], tags: ['kız', 'erkek', 'çocuk', 'genç', 'origami', 'sanat', 'yaratıcı', 'hediye', 'el işi'], description: 'Desenli ve düz renk origami kağıtları + kitapçık' },

  // ═══ GENÇ ERKEK (10-18 yaş) ═══
  { name: 'Mini Drone Kameralı Başlangıç', price: 899, salePrice: 699, categories: ['Elektronik'], tags: ['erkek', 'genç', 'çocuk', 'drone', 'kamera', 'teknoloji', 'hediye', 'trend', 'uçan'], description: 'HD kameralı kolay kullanımlı mini drone' },
  { name: 'Mekanik Klavye RGB Aydınlatmalı', price: 699, salePrice: 549, categories: ['Elektronik'], tags: ['erkek', 'genç', 'klavye', 'mekanik', 'rgb', 'oyun', 'gaming', 'teknoloji', 'hediye'], description: 'RGB LED arkadan aydınlatmalı mekanik gaming klavye' },
  { name: 'Basketbol Topu NBA Resmi Boyut', price: 449, salePrice: 349, categories: ['Spor & Outdoor'], tags: ['erkek', 'genç', 'çocuk', 'basketbol', 'top', 'spor', 'nba', 'hediye'], description: 'Resmi boyut ve ağırlıkta basketbol topu' },
  { name: 'Akıllı Rubik Küp Bluetooth', price: 299, salePrice: 219, categories: ['Anne & Çocuk', 'Elektronik'], tags: ['erkek', 'genç', 'çocuk', 'rubik', 'küp', 'akıllı', 'bulmaca', 'hediye', 'trend'], description: 'Uygulama destekli akıllı speed cube' },
  { name: 'RC Uzaktan Kumandalı Araba 4x4', price: 599, salePrice: 449, categories: ['Anne & Çocuk', 'Elektronik'], tags: ['erkek', 'genç', 'çocuk', 'araba', 'uzaktan kumanda', 'rc', 'oyuncak', 'hediye'], description: 'Off-road 4x4 uzaktan kumandalı hız arabası' },
  { name: 'Gaming Mousepad RGB XXL', price: 249, salePrice: 179, categories: ['Elektronik'], tags: ['erkek', 'genç', 'mousepad', 'rgb', 'gaming', 'oyun', 'hediye', 'teknoloji'], description: '80x30cm RGB aydınlatmalı büyük boy gaming mousepad' },
  { name: 'Teleskop Başlangıç Seti 70mm', price: 799, salePrice: 599, categories: ['Elektronik', 'Spor & Outdoor'], tags: ['erkek', 'kız', 'genç', 'çocuk', 'teleskop', 'uzay', 'bilim', 'hediye', 'keşif'], description: 'Ay ve gezegenleri gözlemlemek için başlangıç teleskobu' },
  { name: 'Lego Teknik Yarış Arabası 500+ Parça', price: 699, salePrice: 549, categories: ['Anne & Çocuk'], tags: ['erkek', 'genç', 'çocuk', 'lego', 'teknik', 'yapboz', 'hediye', 'trend', 'araba'], description: 'Motorlu hareket eden teknik Lego yarış arabası' },
  { name: 'Kablosuz Gaming Kulaklık 7.1', price: 599, salePrice: 449, categories: ['Elektronik'], tags: ['erkek', 'genç', 'kulaklık', 'gaming', 'kablosuz', '7.1', 'oyun', 'hediye', 'teknoloji'], description: '7.1 surround sound kablosuz gaming kulaklık' },
  { name: 'Kaykay Skateboard Profesyonel', price: 449, salePrice: 349, categories: ['Spor & Outdoor'], tags: ['erkek', 'genç', 'kaykay', 'skateboard', 'spor', 'outdoor', 'hediye', 'trend'], description: 'Maple wood profesyonel trick kaykay' },
  { name: 'Bilim Deney Seti 100+ Deney', price: 349, salePrice: 249, categories: ['Anne & Çocuk'], tags: ['erkek', 'kız', 'çocuk', 'genç', 'bilim', 'deney', 'eğitim', 'hediye', 'stem'], description: 'Kimya ve fizik deneyleri yapılabilen büyük bilim seti' },
  { name: 'Aksiyon Kamera Su Geçirmez 4K', price: 999, salePrice: 749, categories: ['Elektronik', 'Spor & Outdoor'], tags: ['erkek', 'genç', 'kamera', 'aksiyon', 'su geçirmez', '4k', 'hediye', 'macera'], description: 'Su geçirmez kasa dahil 4K aksiyon kamerası' },

  // ═══ GENÇ KADIN (18-30 yaş) ═══
  { name: 'Akıllı Saat Kadın Rose Gold', price: 1499, salePrice: 1199, categories: ['Elektronik', 'Saat & Aksesuar', 'Kadın'], tags: ['kadın', 'genç', 'akıllı saat', 'rose gold', 'şık', 'teknoloji', 'hediye', 'trend'], description: 'Nabız, adım sayar, bildirim özellikli şık kadın akıllı saat' },
  { name: 'Aromaterapi Difüzör Şık Tasarım', price: 399, salePrice: 299, categories: ['Ev & Yaşam'], tags: ['kadın', 'ev', 'aromaterapi', 'difüzör', 'wellness', 'hediye', 'relax', 'dekorasyon'], description: 'Ahşap görünümlü LED ışıklı ultrasonik aromaterapi difüzör' },
  { name: 'Yoga Matı Cork Premium', price: 499, salePrice: 379, categories: ['Spor & Outdoor'], tags: ['kadın', 'yoga', 'mat', 'cork', 'spor', 'wellness', 'hediye', 'doğal'], description: 'Doğal mantar yüzeyli anti-kayma premium yoga matı' },
  { name: 'Makyaj Fırça Seti 15 Parça', price: 349, salePrice: 249, categories: ['Kozmetik', 'Kadın'], tags: ['kadın', 'makyaj', 'fırça', 'güzellik', 'kozmetik', 'hediye', 'set'], description: 'Profesyonel vegan makyaj fırça seti deri çantalı' },
  { name: 'Silk Saten Saç Bakım Seti', price: 299, salePrice: 219, categories: ['Kozmetik', 'Kadın'], tags: ['kadın', 'saç', 'saten', 'bakım', 'güzellik', 'hediye', 'yastık kılıfı', 'lüks'], description: 'Saten yastık kılıfı + saç lastikleri + göz maskesi seti' },
  { name: 'Kişiselleştirilmiş Yıldız Haritası', price: 249, salePrice: 199, categories: ['Ev & Yaşam'], tags: ['kadın', 'erkek', 'hediye', 'yıldız haritası', 'kişisel', 'romantik', 'anı', 'dekorasyon'], description: 'Özel tarih ve konuma göre gökyüzü haritası poster' },
  { name: 'Mini Projeksiyon Cihazı Taşınabilir', price: 1799, salePrice: 1399, categories: ['Elektronik'], tags: ['kadın', 'erkek', 'genç', 'projektör', 'film', 'teknoloji', 'hediye', 'trend', 'ev sinema'], description: 'Cep boyutunda WiFi destekli mini projektör' },
  { name: 'Organik Cilt Bakım Seti 5\'li', price: 599, salePrice: 449, categories: ['Kozmetik', 'Kadın'], tags: ['kadın', 'cilt', 'bakım', 'organik', 'doğal', 'güzellik', 'hediye', 'set'], description: 'Temizleme, tonik, serum, nemlendirici ve maske seti' },
  { name: 'Şık Deri Günlük Çanta', price: 899, salePrice: 699, categories: ['Ayakkabı & Çanta', 'Kadın'], tags: ['kadın', 'çanta', 'deri', 'şık', 'moda', 'hediye', 'günlük'], description: 'Hakiki deri el yapımı minimalist günlük çanta' },
  { name: 'Akıllı Bitki Saksısı Self-Watering', price: 349, salePrice: 269, categories: ['Ev & Yaşam'], tags: ['kadın', 'erkek', 'bitki', 'saksı', 'akıllı', 'hediye', 'ev', 'doğa', 'trend'], description: 'Otomatik sulama ve LED büyütme ışıklı akıllı saksı' },
  { name: 'Vintage Plak Çalar Bluetooth', price: 1299, salePrice: 999, categories: ['Elektronik', 'Ev & Yaşam'], tags: ['kadın', 'erkek', 'genç', 'plak çalar', 'vintage', 'müzik', 'retro', 'hediye', 'trend'], description: 'Bluetooth hoparlörlü retro tasarımlı plak çalar' },
  { name: 'Isıtmalı Göz Maskesi USB', price: 199, salePrice: 149, categories: ['Kozmetik', 'Kadın'], tags: ['kadın', 'göz maskesi', 'ısıtmalı', 'relax', 'wellness', 'hediye', 'bakım'], description: 'USB şarjlı lavanta kokulu ısıtmalı göz maskesi' },
  { name: 'El Yapımı Mumluk Seti 3\'lü', price: 349, salePrice: 269, categories: ['Ev & Yaşam'], tags: ['kadın', 'mum', 'mumluk', 'dekorasyon', 'hediye', 'ev', 'romantik', 'el yapımı'], description: 'Beton ve ahşap karışımı minimalist mumluk seti' },

  // ═══ GENÇ ERKEK (18-30 yaş) ═══
  { name: 'Akıllı Saat Sport Titanium', price: 1799, salePrice: 1399, categories: ['Elektronik', 'Saat & Aksesuar'], tags: ['erkek', 'genç', 'akıllı saat', 'spor', 'titanium', 'teknoloji', 'hediye'], description: 'Titanium kasa GPS destekli multisport akıllı saat' },
  { name: 'Kablosuz Noise-Cancelling Kulaklık', price: 1299, salePrice: 999, categories: ['Elektronik'], tags: ['erkek', 'kadın', 'genç', 'kulaklık', 'anc', 'kablosuz', 'müzik', 'hediye', 'trend'], description: 'Aktif gürültü engelleme özellikli premium kulaklık' },
  { name: 'Elektrikli Scooter Katlanır', price: 4999, salePrice: 3999, categories: ['Spor & Outdoor', 'Elektronik'], tags: ['erkek', 'genç', 'scooter', 'elektrikli', 'ulaşım', 'hediye', 'trend', 'outdoor'], description: 'Katlanabilir 25km menzil elektrikli scooter' },
  { name: 'Deri Cüzdan RFID Korumalı', price: 499, salePrice: 379, categories: ['Saat & Aksesuar'], tags: ['erkek', 'cüzdan', 'deri', 'rfid', 'hediye', 'aksesuar', 'şık'], description: 'Hakiki deri RFID korumalı slim cüzdan' },
  { name: 'Taşınabilir Espresso Makinesi', price: 599, salePrice: 449, categories: ['Ev & Yaşam'], tags: ['erkek', 'kadın', 'espresso', 'kahve', 'taşınabilir', 'hediye', 'trend', 'gurme'], description: 'USB şarjlı taşınabilir otomatik espresso makinesi' },
  { name: 'Yüz Bakım Seti Erkek Premium', price: 399, salePrice: 299, categories: ['Kozmetik'], tags: ['erkek', 'genç', 'yüz bakım', 'erkek bakım', 'cilt', 'hediye', 'premium'], description: 'Yüz yıkama, nemlendirici, göz kremi 3\'lü erkek seti' },
  { name: 'Bluetooth Hoparlör Sugeçirmez', price: 499, salePrice: 379, categories: ['Elektronik'], tags: ['erkek', 'kadın', 'genç', 'hoparlör', 'bluetooth', 'su geçirmez', 'müzik', 'hediye', 'outdoor'], description: 'IP67 su geçirmez 20 saat pil ömrü bluetooth hoparlör' },
  { name: 'Dambıl Seti Ayarlanabilir 20kg', price: 799, salePrice: 599, categories: ['Spor & Outdoor'], tags: ['erkek', 'genç', 'dambıl', 'spor', 'fitness', 'kas', 'hediye', 'ev sporu'], description: 'Kompakt ayarlanabilir ağırlık dambıl seti' },
  { name: 'Mekanik Kol Saati Klasik', price: 2499, salePrice: 1899, categories: ['Saat & Aksesuar'], tags: ['erkek', 'saat', 'mekanik', 'klasik', 'prestij', 'hediye', 'lüks'], description: 'Otomatik mekanik hareket cam arka kapaklı kol saati' },
  { name: 'Kamp Çadırı 2 Kişilik Ultralight', price: 999, salePrice: 749, categories: ['Spor & Outdoor'], tags: ['erkek', 'kadın', 'çadır', 'kamp', 'outdoor', 'doğa', 'macera', 'hediye'], description: 'Ultralight 2 kişilik su geçirmez kamp çadırı' },

  // ═══ KADIN (30-50 yaş) ═══
  { name: 'Altın Kaplama İnci Kolye', price: 699, salePrice: 549, categories: ['Saat & Aksesuar', 'Kadın'], tags: ['kadın', 'kolye', 'inci', 'altın', 'takı', 'şık', 'hediye', 'zarif'], description: '14 ayar altın kaplama tatlı su incisi kolye' },
  { name: 'Lüks Parfüm Kadın 100ml', price: 899, salePrice: 699, categories: ['Kozmetik', 'Kadın'], tags: ['kadın', 'parfüm', 'lüks', 'koku', 'hediye', 'prestij', 'güzellik'], description: 'Çiçeksi-odunsu notalar premium kadın parfümü' },
  { name: 'Seramik Fırın & Tabak Seti', price: 599, salePrice: 449, categories: ['Ev & Yaşam'], tags: ['kadın', 'mutfak', 'seramik', 'tabak', 'fırın', 'hediye', 'ev', 'gurme'], description: 'El yapımı seramik fırın kabı ve servis tabak seti' },
  { name: 'Elektrikli Masaj Aleti Boyun', price: 499, salePrice: 379, categories: ['Elektronik'], tags: ['kadın', 'erkek', 'masaj', 'boyun', 'relax', 'sağlık', 'hediye', 'wellness'], description: 'Isıtmalı shiatsu boyun ve omuz masaj aleti' },
  { name: 'Pamuklu Bornoz & Terlik Seti', price: 599, salePrice: 449, categories: ['Ev & Yaşam', 'Kadın'], tags: ['kadın', 'bornoz', 'terlik', 'pamuk', 'konfor', 'hediye', 'lüks', 'ev'], description: 'Premium pamuklu nakışlı bornoz ve terlik hediye seti' },
  { name: 'Dijital Çerçeve WiFi 10 inç', price: 699, salePrice: 549, categories: ['Elektronik', 'Ev & Yaşam'], tags: ['kadın', 'erkek', 'çerçeve', 'dijital', 'fotoğraf', 'anı', 'hediye', 'teknoloji'], description: 'WiFi ile fotoğraf gönderebilen dijital fotoğraf çerçevesi' },
  { name: 'Çiçek Aranjman Yapım Seti', price: 349, salePrice: 269, categories: ['Ev & Yaşam'], tags: ['kadın', 'çiçek', 'aranjman', 'diy', 'yaratıcı', 'hediye', 'doğa', 'hobi'], description: 'Kuru çiçeklerle aranjman yapım hobi seti' },
  { name: 'İpek Eşarp El Boyama', price: 449, salePrice: 349, categories: ['Kadın', 'Saat & Aksesuar'], tags: ['kadın', 'eşarp', 'ipek', 'el boyama', 'sanat', 'hediye', 'şık', 'aksesuar'], description: 'El boyaması sanatsal ipek eşarp' },

  // ═══ ERKEK (30-50 yaş) ═══
  { name: 'Erkek Parfüm Woody 100ml', price: 799, salePrice: 599, categories: ['Kozmetik'], tags: ['erkek', 'parfüm', 'woody', 'koku', 'hediye', 'prestij', 'erkek bakım'], description: 'Odunsu-baharatlı notalar premium erkek parfümü' },
  { name: 'Paslanmaz Çelik Termos 500ml', price: 299, salePrice: 229, categories: ['Ev & Yaşam', 'Spor & Outdoor'], tags: ['erkek', 'kadın', 'termos', 'çelik', 'hediye', 'pratik', 'outdoor'], description: '24 saat sıcak/soğuk tutan vakum termos' },
  { name: 'Elektrikli Tıraş Makinesi Premium', price: 999, salePrice: 749, categories: ['Elektronik', 'Kozmetik'], tags: ['erkek', 'tıraş', 'elektrikli', 'bakım', 'hediye', 'premium', 'erkek bakım'], description: '5 başlıklı ıslak-kuru kullanım elektrikli tıraş makinesi' },
  { name: 'Deri Laptop Çantası 15.6 inç', price: 899, salePrice: 699, categories: ['Ayakkabı & Çanta'], tags: ['erkek', 'çanta', 'laptop', 'deri', 'iş', 'hediye', 'şık', 'profesyonel'], description: 'Hakiki deri minimalist laptop evrak çantası' },
  { name: 'Akıllı Terazi Vücut Analizi', price: 399, salePrice: 299, categories: ['Elektronik', 'Spor & Outdoor'], tags: ['erkek', 'kadın', 'terazi', 'vücut analizi', 'sağlık', 'fitness', 'hediye', 'akıllı'], description: 'WiFi/Bluetooth 13 ölçüm yapan akıllı vücut analiz terazisi' },
  { name: 'BBQ Mangal Seti Premium', price: 799, salePrice: 599, categories: ['Ev & Yaşam', 'Spor & Outdoor'], tags: ['erkek', 'mangal', 'bbq', 'mutfak', 'outdoor', 'hediye', 'gurme'], description: 'Paslanmaz çelik premium mangal takımları seti' },
  { name: 'Whisky Tadım Seti 4\'lü', price: 699, salePrice: 549, categories: ['Süpermarket'], tags: ['erkek', 'whisky', 'tadım', 'premium', 'hediye', 'lüks', 'gurme', 'içecek'], description: 'Farklı bölgelerden 4 premium whisky tadım seti' },
  { name: 'Taktik Çakı Çok Fonksiyonlu', price: 349, salePrice: 269, categories: ['Spor & Outdoor'], tags: ['erkek', 'çakı', 'taktik', 'çok fonksiyonlu', 'outdoor', 'hediye', 'pratik', 'kamp'], description: '12 fonksiyonlu paslanmaz çelik taktik bıçak seti' },

  // ═══ ÇOCUK (5-10 yaş) ═══
  { name: 'Çocuk Akıllı Saat GPS Takipli', price: 699, salePrice: 549, categories: ['Elektronik', 'Anne & Çocuk'], tags: ['çocuk', 'kız', 'erkek', 'akıllı saat', 'gps', 'güvenlik', 'hediye', 'trend'], description: 'GPS takip ve SOS özellikli çocuk akıllı saati' },
  { name: 'Su Altı Keşif Seti', price: 249, salePrice: 179, categories: ['Spor & Outdoor', 'Anne & Çocuk'], tags: ['çocuk', 'erkek', 'kız', 'su altı', 'keşif', 'doğa', 'hediye', 'macera', 'outdoor'], description: 'Dalış gözlüğü, şnorkel ve yüzgeç çocuk seti' },
  { name: 'Ahşap Yapboz 3D Dinozor', price: 199, salePrice: 149, categories: ['Anne & Çocuk'], tags: ['çocuk', 'erkek', 'yapboz', 'dinozor', '3d', 'ahşap', 'hediye', 'eğitici'], description: 'Hareketli parçalı 3D ahşap dinozor yapboz' },
  { name: 'Çocuk Mikroskop Seti 1200x', price: 449, salePrice: 349, categories: ['Anne & Çocuk', 'Elektronik'], tags: ['çocuk', 'erkek', 'kız', 'mikroskop', 'bilim', 'keşif', 'eğitim', 'hediye', 'stem'], description: 'LED aydınlatmalı 1200x büyütme çocuk mikroskobu' },
  { name: 'Robotik Kodlama Seti', price: 599, salePrice: 449, categories: ['Elektronik', 'Anne & Çocuk'], tags: ['çocuk', 'erkek', 'kız', 'robot', 'kodlama', 'stem', 'eğitim', 'hediye', 'teknoloji', 'trend'], description: 'Blok tabanlı kodlama ile programlanan robot seti' },
  { name: 'Sihirbazlık Seti Profesyonel', price: 299, salePrice: 219, categories: ['Anne & Çocuk'], tags: ['çocuk', 'erkek', 'kız', 'sihirbazlık', 'eğlence', 'hediye', 'gösteri', 'trend'], description: '50+ hile içeren profesyonel sihirbazlık seti' },
  { name: 'Walkie Talkie Çocuk 2\'li Set', price: 249, salePrice: 179, categories: ['Elektronik', 'Anne & Çocuk'], tags: ['çocuk', 'erkek', 'kız', 'walkie talkie', 'iletişim', 'macera', 'hediye', 'eğlence'], description: '3km menzil LED ekranlı çocuk walkie talkie seti' },
  { name: 'Boyama & Resim Çantası 68 Parça', price: 249, salePrice: 189, categories: ['Anne & Çocuk'], tags: ['çocuk', 'kız', 'erkek', 'boyama', 'resim', 'sanat', 'hediye', 'yaratıcı', 'set'], description: 'Boya, pastel, keçeli kalem ve fırça içeren sanat çantası' },

  // ═══ ANNE/BABA (50+ yaş) ═══
  { name: 'Dijital Kan Basıncı Ölçer', price: 399, salePrice: 299, categories: ['Elektronik'], tags: ['kadın', 'erkek', 'sağlık', 'tansiyon', 'kan basıncı', 'hediye', 'yaşlı', 'pratik'], description: 'Bluetooth bağlantılı otomatik dijital tansiyon aleti' },
  { name: 'Ortopedik Boyun Yastığı Memory', price: 399, salePrice: 299, categories: ['Ev & Yaşam'], tags: ['kadın', 'erkek', 'yastık', 'ortopedik', 'sağlık', 'uyku', 'hediye', 'konfor'], description: 'Memory foam ergonomik boyun destek yastığı' },
  { name: 'Bahçe Alet Seti 10 Parça', price: 399, salePrice: 299, categories: ['Ev & Yaşam', 'Spor & Outdoor'], tags: ['kadın', 'erkek', 'bahçe', 'alet', 'doğa', 'hobi', 'hediye', 'pratik'], description: 'Ergonomik saplı paslanmaz çelik bahçe alet seti' },
  { name: 'Büyüteçli LED Okuma Lambası', price: 249, salePrice: 189, categories: ['Ev & Yaşam'], tags: ['kadın', 'erkek', 'okuma', 'lamba', 'büyüteç', 'hediye', 'pratik', 'yaşlı'], description: '3x büyüteçli göz yormayan LED masa lambası' },
  { name: 'Çay Seti Porselen 6 Kişilik', price: 599, salePrice: 449, categories: ['Ev & Yaşam'], tags: ['kadın', 'erkek', 'çay', 'porselen', 'set', 'hediye', 'ev', 'zarif', 'geleneksel'], description: 'El boyaması porselen 6 kişilik çay seti' },
  { name: 'Isıtmalı Ayak Masaj Aleti', price: 599, salePrice: 449, categories: ['Elektronik'], tags: ['kadın', 'erkek', 'masaj', 'ayak', 'ısıtmalı', 'relax', 'hediye', 'wellness', 'sağlık'], description: 'Shiatsu titreşimli ısıtmalı ayak masaj cihazı' },
  { name: 'Bulmaca Kitap Seti 5\'li', price: 149, salePrice: 99, categories: ['Ev & Yaşam'], tags: ['kadın', 'erkek', 'bulmaca', 'sudoku', 'kitap', 'hediye', 'zihin', 'hobi'], description: 'Sudoku, çapraz bulmaca ve sözcük avı 5 kitap seti' },

  // ═══ UNİSEX TREND ÜRÜNLER ═══
  { name: 'Akıllı Su Şişesi LED Sıcaklık', price: 249, salePrice: 189, categories: ['Spor & Outdoor'], tags: ['kadın', 'erkek', 'genç', 'su şişesi', 'akıllı', 'led', 'spor', 'hediye', 'trend'], description: 'LED sıcaklık göstergeli akıllı paslanmaz su şişesi' },
  { name: 'Levitasyonlu Saksı Manyetik', price: 799, salePrice: 599, categories: ['Ev & Yaşam'], tags: ['kadın', 'erkek', 'genç', 'saksı', 'levitasyon', 'manyetik', 'hediye', 'trend', 'dekorasyon'], description: 'Havada süzülen manyetik levitasyon saksısı' },
  { name: 'Akıllı LED Şerit Işık 10m', price: 299, salePrice: 219, categories: ['Ev & Yaşam', 'Elektronik'], tags: ['kadın', 'erkek', 'genç', 'led', 'ışık', 'dekorasyon', 'hediye', 'trend', 'rgb'], description: 'WiFi kontrollü RGB renk değiştiren LED şerit ışık' },
  { name: 'Taşınabilir Powerbank 20000mAh', price: 399, salePrice: 299, categories: ['Elektronik'], tags: ['kadın', 'erkek', 'genç', 'powerbank', 'şarj', 'teknoloji', 'hediye', 'pratik'], description: 'Hızlı şarj destekli ince tasarım 20000mAh powerbank' },
  { name: 'Puzzle 1000 Parça Sanatsal', price: 199, salePrice: 149, categories: ['Ev & Yaşam'], tags: ['kadın', 'erkek', 'puzzle', 'yapboz', 'sanat', 'hediye', 'hobi', 'relax'], description: 'Ünlü tablo reprodüksiyonları 1000 parça puzzle' },
  { name: 'Çok Fonksiyonlu Şarj İstasyonu', price: 449, salePrice: 349, categories: ['Elektronik'], tags: ['kadın', 'erkek', 'genç', 'şarj', 'istasyon', 'teknoloji', 'hediye', 'düzen', 'pratik'], description: 'Telefon, saat ve kulaklık için 3in1 kablosuz şarj standı' },
  { name: 'Bambu Kesme Tahtası Set', price: 299, salePrice: 219, categories: ['Ev & Yaşam', 'Süpermarket'], tags: ['kadın', 'erkek', 'mutfak', 'bambu', 'kesme tahtası', 'hediye', 'doğal', 'gurme'], description: '3 farklı boyut bambu kesme tahtası seti' },
  { name: 'Kişiselleştirilmiş Fotoğraf Baskı Yastık', price: 199, salePrice: 149, categories: ['Ev & Yaşam'], tags: ['kadın', 'erkek', 'genç', 'fotoğraf', 'yastık', 'kişisel', 'hediye', 'anı', 'romantik'], description: 'Kendi fotoğrafınızı bastırabileceğiniz dekoratif yastık' },
  { name: 'Retro Bluetooth Radyo', price: 599, salePrice: 449, categories: ['Elektronik', 'Ev & Yaşam'], tags: ['kadın', 'erkek', 'radyo', 'retro', 'bluetooth', 'vintage', 'hediye', 'dekorasyon', 'müzik'], description: 'Vintage görünümlü FM radyo + Bluetooth hoparlör' },
  { name: 'Teraryum Yapım Seti DIY', price: 299, salePrice: 219, categories: ['Ev & Yaşam'], tags: ['kadın', 'erkek', 'genç', 'teraryum', 'diy', 'bitki', 'doğa', 'hediye', 'yaratıcı'], description: 'Cam küre, toprak, yosun ve minyatür figür dahil teraryum seti' },
  { name: 'Akıllı Priz WiFi Kontrollü 4\'lü', price: 349, salePrice: 269, categories: ['Elektronik', 'Ev & Yaşam'], tags: ['kadın', 'erkek', 'akıllı ev', 'priz', 'wifi', 'teknoloji', 'hediye', 'pratik'], description: 'Sesli asistan uyumlu WiFi kontrollü akıllı priz seti' },
  { name: 'Gourmet Kahve Hediye Kutusu', price: 399, salePrice: 299, categories: ['Süpermarket'], tags: ['kadın', 'erkek', 'kahve', 'gurme', 'hediye', 'lüks', 'set', 'tat'], description: '5 farklı ülke single origin kahve tadım hediye kutusu' },
  { name: 'Masaüstü Mini Hava Temizleyici', price: 449, salePrice: 349, categories: ['Elektronik', 'Ev & Yaşam'], tags: ['kadın', 'erkek', 'hava', 'temizleyici', 'sağlık', 'hediye', 'ofis', 'pratik'], description: 'HEPA filtreli USB masaüstü hava temizleme cihazı' },
  { name: 'Kamp Feneri Şarjlı LED', price: 199, salePrice: 149, categories: ['Spor & Outdoor'], tags: ['erkek', 'kadın', 'kamp', 'fener', 'led', 'outdoor', 'hediye', 'macera', 'pratik'], description: 'USB şarjlı su geçirmez 4 modlu kamp feneri' },
  { name: 'Akıllı Notebook Silinebilir', price: 249, salePrice: 189, categories: ['Elektronik'], tags: ['kadın', 'erkek', 'genç', 'notebook', 'akıllı', 'silinebilir', 'hediye', 'trend', 'çevreci'], description: 'Yazılanları buluta yükleyip silebilen akıllı defter' },

  // ═══ HOBI & ÖZEL İLGİ ALANLARI ═══
  { name: 'Suluboya Başlangıç Seti Pro', price: 349, salePrice: 269, categories: ['Ev & Yaşam'], tags: ['kadın', 'erkek', 'genç', 'sanat', 'suluboya', 'resim', 'hediye', 'hobi', 'yaratıcı'], description: '36 renk profesyonel suluboya + fırça + blok seti' },
  { name: 'Ukulele Başlangıç Paketi', price: 449, salePrice: 349, categories: ['Ev & Yaşam'], tags: ['kadın', 'erkek', 'genç', 'müzik', 'ukulele', 'enstrüman', 'hediye', 'hobi'], description: 'Soprano ukulele + kılıf + akort cihazı + eğitim kitabı' },
  { name: 'Pizza Taşı ve Kürek Seti', price: 349, salePrice: 269, categories: ['Ev & Yaşam', 'Süpermarket'], tags: ['erkek', 'kadın', 'mutfak', 'pizza', 'gurme', 'hediye', 'yemek'], description: 'Fırın pizza taşı + bambu kürek + pizza kesici seti' },
  { name: 'Astronomi Başlangıç Kitabı + Harita', price: 199, salePrice: 149, categories: ['Ev & Yaşam'], tags: ['erkek', 'kadın', 'genç', 'astronomi', 'uzay', 'kitap', 'hediye', 'bilim', 'keşif'], description: 'Gökbilim rehber kitabı + fosforlu yıldız haritası' },
  { name: 'Fotoğraf Albümü Scrapbook DIY', price: 199, salePrice: 149, categories: ['Ev & Yaşam'], tags: ['kadın', 'erkek', 'genç', 'fotoğraf', 'albüm', 'scrapbook', 'anı', 'hediye', 'diy', 'romantik'], description: 'Sticker ve aksesuar dahil kendin yap fotoğraf albümü' },
  { name: 'Bonsai Yetiştirme Seti', price: 249, salePrice: 189, categories: ['Ev & Yaşam'], tags: ['kadın', 'erkek', 'bonsai', 'bitki', 'doğa', 'hobi', 'hediye', 'zen', 'sabır'], description: '4 farklı tohum çeşidi dahil bonsai yetiştirme kiti' },
  { name: 'El Yapımı Sabun Yapım Seti', price: 249, salePrice: 189, categories: ['Ev & Yaşam', 'Kozmetik'], tags: ['kadın', 'genç', 'sabun', 'diy', 'el yapımı', 'hobi', 'hediye', 'yaratıcı', 'doğal'], description: 'Doğal malzemelerle sabun yapım hobi seti' },
  { name: 'Yağlı Boya Tuval Seti 24 Renk', price: 449, salePrice: 349, categories: ['Ev & Yaşam'], tags: ['kadın', 'erkek', 'genç', 'sanat', 'yağlı boya', 'tuval', 'hediye', 'hobi', 'yaratıcı'], description: '24 renk yağlı boya + 3 tuval + fırça + palet seti' },

  // ═══ GURME & LEZZET ═══
  { name: 'Çikolata Yapım Seti', price: 299, salePrice: 219, categories: ['Süpermarket'], tags: ['kadın', 'erkek', 'genç', 'çikolata', 'diy', 'gurme', 'hediye', 'lezzet', 'hobi'], description: 'Belçika çikolatası ile kendi pralinlerini yap seti' },
  { name: 'Özel Çay Koleksiyonu 30 Çeşit', price: 349, salePrice: 269, categories: ['Süpermarket'], tags: ['kadın', 'erkek', 'çay', 'koleksiyon', 'gurme', 'hediye', 'lezzet', 'doğal'], description: '30 farklı ülke ve aromalı çay tadım koleksiyonu' },
  { name: 'Baharat Seti Dünya Mutfakları', price: 399, salePrice: 299, categories: ['Süpermarket'], tags: ['kadın', 'erkek', 'baharat', 'mutfak', 'gurme', 'hediye', 'lezzet', 'yemek'], description: '20 farklı baharat ahşap kutulu dünya mutfakları seti' },
  { name: 'Zeytin Yağı Premium Set 3\'lü', price: 349, salePrice: 269, categories: ['Süpermarket'], tags: ['kadın', 'erkek', 'zeytinyağı', 'premium', 'gurme', 'hediye', 'lezzet', 'sağlıklı'], description: '3 farklı bölge extra virgin zeytinyağı tadım seti' },
  { name: 'Japon Matcha Çay Seti', price: 449, salePrice: 349, categories: ['Süpermarket', 'Ev & Yaşam'], tags: ['kadın', 'erkek', 'matcha', 'çay', 'japon', 'hediye', 'wellness', 'gurme', 'trend'], description: 'Seramik kase, bambu fırça ve organik matcha çay seti' },
];

async function main() {
  await ds.initialize();
  console.log('Connected to database');

  // Get stores grouped by category
  const stores = await ds.query(`SELECT id, name, categories::text FROM stores WHERE "isActive" = true`);
  const storesByCategory: Record<string, string[]> = {};
  stores.forEach((s: any) => {
    const cats = JSON.parse(s.categories || '[]');
    cats.forEach((c: string) => {
      if (!storesByCategory[c]) storesByCategory[c] = [];
      storesByCategory[c].push(s.id);
    });
  });

  // Also get "Erkek" stores from categories that could have men's products
  if (!storesByCategory['Erkek']) {
    storesByCategory['Erkek'] = storesByCategory['Kadın'] || [];
  }

  function getStoreForProduct(categories: string[]): string {
    for (const cat of categories) {
      const storeIds = storesByCategory[cat];
      if (storeIds?.length) {
        return storeIds[Math.floor(Math.random() * storeIds.length)];
      }
    }
    // Fallback: random store
    return stores[Math.floor(Math.random() * stores.length)].id;
  }

  function generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ğ/g, 'g')
      .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ı/g, 'i')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      + '-' + Math.random().toString(36).slice(2, 6);
  }

  // Batch insert
  const batchSize = 25;
  let inserted = 0;

  for (let i = 0; i < PRODUCTS.length; i += batchSize) {
    const batch = PRODUCTS.slice(i, i + batchSize);
    const values: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    for (const p of batch) {
      const storeId = getStoreForProduct(p.categories);
      const slug = generateSlug(p.name);
      const rating = (3.5 + Math.random() * 1.5).toFixed(1);
      const ratingCount = Math.floor(50 + Math.random() * 300);

      values.push(`($${paramIdx}, $${paramIdx+1}, $${paramIdx+2}, $${paramIdx+3}, $${paramIdx+4}, $${paramIdx+5}::jsonb, $${paramIdx+6}::jsonb, $${paramIdx+7}, $${paramIdx+8}, $${paramIdx+9}, $${paramIdx+10}, true, false, $${paramIdx+11})`);
      params.push(
        slug,                           // slug
        p.name,                         // name
        p.description,                  // description
        p.price,                        // price
        p.salePrice || null,            // salePrice
        JSON.stringify(p.categories),   // categories
        JSON.stringify(p.tags),         // tags
        storeId,                        // storeId
        parseFloat(rating),             // ratingAverage
        ratingCount,                    // ratingCount
        `https://picsum.photos/seed/${slug}/400/400`, // thumbnail
        p.salePrice ? true : false,     // isFeatured
      );
      paramIdx += 12;
    }

    const sql = `
      INSERT INTO products (slug, name, description, price, "salePrice", categories, tags, "storeId", "ratingAverage", "ratingCount", thumbnail, "isActive", "isFeatured", images)
      VALUES ${values.map(v => v.replace('$' + (params.length) + ')', '$' + (params.length) + ')')).join(',\n')}
      ON CONFLICT (slug) DO NOTHING
    `.replace(/, images\)/, '');

    // Simpler approach - one by one for safety
    for (const p of batch) {
      const storeId = getStoreForProduct(p.categories);
      const slug = generateSlug(p.name);
      const rating = (3.5 + Math.random() * 1.5).toFixed(1);
      const ratingCount = Math.floor(50 + Math.random() * 300);

      try {
        await ds.query(`
          INSERT INTO products (slug, name, description, price, "salePrice", categories, tags, "storeId", "ratingAverage", "ratingCount", thumbnail, "isActive", "isFeatured")
          VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8, $9, $10, $11, true, $12)
        `, [
          slug, p.name, p.description, p.price, p.salePrice || null,
          JSON.stringify(p.categories), JSON.stringify(p.tags),
          storeId, parseFloat(rating), ratingCount,
          `https://picsum.photos/seed/${slug}/400/400`,
          p.salePrice ? true : false,
        ]);
        inserted++;
      } catch (err: any) {
        console.warn(`  Skip: ${p.name} — ${err.message?.slice(0, 60)}`);
      }
    }
    console.log(`Batch ${Math.floor(i/batchSize)+1}: ${inserted} products inserted so far`);
  }

  // Final stats
  const total = await ds.query('SELECT COUNT(*) as cnt FROM products WHERE "isActive" = true');
  console.log(`\nDone! Total active products: ${total[0].cnt}`);
  console.log(`New products added: ${inserted}`);

  // Category distribution
  const cats = await ds.query(`
    SELECT jsonb_array_elements_text(categories) as cat, COUNT(*) as cnt
    FROM products WHERE "isActive" = true
    GROUP BY cat ORDER BY cnt DESC
  `);
  console.log('\nCategory distribution:');
  cats.forEach((r: any) => console.log(`  ${r.cat}: ${r.cnt}`));

  await ds.destroy();
}

main().catch(e => { console.error(e); process.exit(1); });
