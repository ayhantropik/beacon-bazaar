/**
 * Mağazalara gerçekçi ürünler ekleyen seed script
 * Kullanım: npx ts-node -r tsconfig-paths/register src/seed-products.ts
 * Veya doğrudan: npx tsx src/seed-products.ts
 */

const API = 'http://localhost:4000/api/v1';

// Kategori bazlı ürün şablonları
const PRODUCT_TEMPLATES: Record<string, Array<{
  name: string; description: string; price: number; salePrice?: number;
  categories: string[]; tags: string[]; thumbnail: string; stock: number;
}>> = {
  'Elektronik': [
    { name: 'Apple iPhone 15 Pro 256GB', description: 'A17 Pro çip, titanium tasarım, 48MP kamera sistemi. En gelişmiş iPhone deneyimi.', price: 64999, salePrice: 59999, categories: ['Elektronik', 'Telefon'], tags: ['apple', 'iphone', 'akıllı telefon'], thumbnail: 'https://picsum.photos/seed/iphone15/400/400', stock: 25 },
    { name: 'Samsung Galaxy S24 Ultra', description: '200MP kamera, Galaxy AI özellikleri, S Pen dahil, Titanium çerçeve.', price: 54999, salePrice: 49990, categories: ['Elektronik', 'Telefon'], tags: ['samsung', 'galaxy', 'android'], thumbnail: 'https://picsum.photos/seed/galaxys24/400/400', stock: 30 },
    { name: 'MacBook Air M3 13"', description: 'Apple M3 çip, 8GB RAM, 256GB SSD, 18 saat pil ömrü. Taşınabilirliğin zirvesi.', price: 42999, salePrice: 39999, categories: ['Elektronik', 'Bilgisayar'], tags: ['apple', 'macbook', 'laptop'], thumbnail: 'https://picsum.photos/seed/macbookair/400/400', stock: 15 },
    { name: 'Sony WH-1000XM5 Kulaklık', description: 'Endüstri lideri gürültü engelleme, 30 saat pil, multipoint bağlantı.', price: 8999, salePrice: 7499, categories: ['Elektronik', 'Ses & Görüntü'], tags: ['sony', 'kulaklık', 'bluetooth'], thumbnail: 'https://picsum.photos/seed/sonywh/400/400', stock: 40 },
    { name: 'iPad Air M2 11"', description: 'M2 çip, Liquid Retina ekran, Apple Pencil Pro desteği.', price: 24999, categories: ['Elektronik', 'Tablet'], tags: ['apple', 'ipad', 'tablet'], thumbnail: 'https://picsum.photos/seed/ipadair/400/400', stock: 20 },
    { name: 'Samsung 65" QLED 4K TV', description: 'Quantum Dot teknolojisi, Smart TV, Dolby Atmos ses.', price: 32999, salePrice: 27999, categories: ['Elektronik', 'Ses & Görüntü'], tags: ['samsung', 'tv', 'qled'], thumbnail: 'https://picsum.photos/seed/samsungtv/400/400', stock: 10 },
    { name: 'Apple Watch Series 9', description: 'Çift dokunma hareketi, parlak ekran, sağlık izleme.', price: 14999, salePrice: 12999, categories: ['Elektronik', 'Akıllı Saat'], tags: ['apple', 'watch', 'akıllı saat'], thumbnail: 'https://picsum.photos/seed/applewatch/400/400', stock: 35 },
    { name: 'Dyson V15 Detect Süpürge', description: 'Lazer toz algılama, LCD ekran, güçlü emme gücü.', price: 19999, salePrice: 16999, categories: ['Elektronik', 'Ev Aletleri'], tags: ['dyson', 'süpürge', 'kablosuz'], thumbnail: 'https://picsum.photos/seed/dysonv15/400/400', stock: 18 },
    { name: 'JBL Charge 5 Hoparlör', description: 'IP67 su geçirmez, 20 saat pil, Powerbank özelliği.', price: 3999, salePrice: 3299, categories: ['Elektronik', 'Ses & Görüntü'], tags: ['jbl', 'hoparlör', 'bluetooth'], thumbnail: 'https://picsum.photos/seed/jblcharge/400/400', stock: 50 },
    { name: 'Logitech MX Master 3S Mouse', description: 'Sessiz tıklama, MagSpeed scroll, ergonomik tasarım, USB-C şarj.', price: 2999, categories: ['Elektronik', 'Bilgisayar Aksesuarı'], tags: ['logitech', 'mouse', 'kablosuz'], thumbnail: 'https://picsum.photos/seed/mxmaster/400/400', stock: 45 },
  ],
  'Moda & Giyim': [
    { name: 'Slim Fit Pamuk Gömlek', description: 'Premium pamuk kumaş, slim fit kesim, düğmeli yaka. Günlük ve ofis kullanımı.', price: 899, salePrice: 599, categories: ['Moda & Giyim', 'Erkek'], tags: ['gömlek', 'slim fit', 'pamuk'], thumbnail: 'https://picsum.photos/seed/slimgomlek/400/400', stock: 80 },
    { name: 'Kadın Trençkot', description: 'Klasik trençkot kesimi, su itici kumaş, kemer detaylı. Sonbahar-kış sezonu.', price: 2499, salePrice: 1899, categories: ['Moda & Giyim', 'Kadın'], tags: ['trençkot', 'kadın', 'mont'], thumbnail: 'https://picsum.photos/seed/trenchcoat/400/400', stock: 35 },
    { name: 'Oversize Hoodie Unisex', description: 'Organik pamuk, oversize kesim, kanguru cep. Rahat günlük giyim.', price: 699, salePrice: 499, categories: ['Moda & Giyim', 'Unisex'], tags: ['hoodie', 'oversize', 'sweatshirt'], thumbnail: 'https://picsum.photos/seed/hoodie/400/400', stock: 100 },
    { name: 'Erkek Deri Ceket', description: 'Hakiki kuzu derisi, siyah renk, fermuarlı cepler, slim kesim.', price: 4999, salePrice: 3999, categories: ['Moda & Giyim', 'Erkek'], tags: ['deri ceket', 'erkek', 'hakiki deri'], thumbnail: 'https://picsum.photos/seed/dericeket/400/400', stock: 20 },
    { name: 'Kadın Midi Elbise', description: 'Çiçek desenli, A kesim, midi boy, yazlık kumaş.', price: 1299, salePrice: 899, categories: ['Moda & Giyim', 'Kadın'], tags: ['elbise', 'midi', 'çiçekli'], thumbnail: 'https://picsum.photos/seed/midielbise/400/400', stock: 45 },
    { name: 'Erkek Chino Pantolon', description: 'Streç kumaş, slim fit, 4 renk seçeneği.', price: 799, salePrice: 549, categories: ['Moda & Giyim', 'Erkek'], tags: ['pantolon', 'chino', 'slim fit'], thumbnail: 'https://picsum.photos/seed/chino/400/400', stock: 60 },
    { name: 'Basic V-Yaka Tişört 3lü Paket', description: 'Pamuklu jersey, V-yaka, siyah-beyaz-gri set.', price: 599, salePrice: 399, categories: ['Moda & Giyim', 'Erkek'], tags: ['tişört', 'basic', 'v-yaka'], thumbnail: 'https://picsum.photos/seed/basictshirt/400/400', stock: 120 },
    { name: 'Kadın High-Waist Jean', description: 'Yüksek bel, straight leg, koyu mavi yıkama.', price: 999, salePrice: 749, categories: ['Moda & Giyim', 'Kadın'], tags: ['jean', 'yüksek bel', 'kadın'], thumbnail: 'https://picsum.photos/seed/highwaist/400/400', stock: 55 },
  ],
  'Kozmetik': [
    { name: 'MAC Ruby Woo Ruj', description: 'İkonik kırmızı ruj, mat bitişli, yoğun pigment, uzun süre kalıcı.', price: 899, salePrice: 749, categories: ['Kozmetik', 'Makyaj'], tags: ['mac', 'ruj', 'mat'], thumbnail: 'https://picsum.photos/seed/macruj/400/400', stock: 70 },
    { name: 'La Roche-Posay Effaclar Duo+', description: 'Akne karşıtı bakım kremi, yağlı ciltler için, niacinamide içerikli.', price: 659, salePrice: 549, categories: ['Kozmetik', 'Cilt Bakım'], tags: ['cilt bakım', 'akne', 'la roche posay'], thumbnail: 'https://picsum.photos/seed/effaclar/400/400', stock: 90 },
    { name: 'Estée Lauder Double Wear Fondöten', description: '24 saat kalıcılık, orta-yoğun kapatıcılık, mat bitişli fondöten.', price: 1899, salePrice: 1599, categories: ['Kozmetik', 'Makyaj'], tags: ['fondöten', 'estee lauder', 'mat'], thumbnail: 'https://picsum.photos/seed/doublewear/400/400', stock: 40 },
    { name: 'Dior Sauvage EDP 100ml', description: 'Maskülen, taze ve baharatlı notalar. En çok satan erkek parfümü.', price: 4999, salePrice: 4199, categories: ['Kozmetik', 'Parfüm'], tags: ['parfüm', 'dior', 'erkek'], thumbnail: 'https://picsum.photos/seed/sauvage/400/400', stock: 25 },
    { name: 'The Ordinary Niacinamide 10%', description: 'Gözenek küçültücü serum, 30ml, tüm cilt tipleri için.', price: 249, categories: ['Kozmetik', 'Cilt Bakım'], tags: ['serum', 'niacinamide', 'the ordinary'], thumbnail: 'https://picsum.photos/seed/niacinamide/400/400', stock: 150 },
    { name: 'Maybelline Sky High Maskara', description: 'Uzatıcı ve kıvırıcı etki, bambu lif içerikli fırça.', price: 349, salePrice: 279, categories: ['Kozmetik', 'Makyaj'], tags: ['maskara', 'maybelline', 'göz makyajı'], thumbnail: 'https://picsum.photos/seed/skyhigh/400/400', stock: 80 },
    { name: 'Bioderma Sensibio H2O 500ml', description: 'Misel su, hassas ciltler için, makyaj temizleyici.', price: 399, salePrice: 329, categories: ['Kozmetik', 'Cilt Bakım'], tags: ['misel su', 'bioderma', 'temizleyici'], thumbnail: 'https://picsum.photos/seed/bioderma/400/400', stock: 100 },
    { name: 'Chanel No.5 EDP 100ml', description: 'Efsanevi kadın parfümü, çiçeksi-pudralı notalar.', price: 6999, salePrice: 5999, categories: ['Kozmetik', 'Parfüm'], tags: ['parfüm', 'chanel', 'kadın'], thumbnail: 'https://picsum.photos/seed/chanel5/400/400', stock: 15 },
  ],
  'Spor & Outdoor': [
    { name: 'Nike Air Max 270 React', description: 'Max Air yastıklama, React köpük, nefes alan mesh üst.', price: 3999, salePrice: 2999, categories: ['Spor & Outdoor', 'Spor Ayakkabı'], tags: ['nike', 'air max', 'koşu'], thumbnail: 'https://picsum.photos/seed/airmax270/400/400', stock: 40 },
    { name: 'Adidas Ultraboost 23', description: 'Boost teknolojisi, Primeknit üst, Continental kauçuk taban.', price: 4499, salePrice: 3499, categories: ['Spor & Outdoor', 'Spor Ayakkabı'], tags: ['adidas', 'ultraboost', 'koşu'], thumbnail: 'https://picsum.photos/seed/ultraboost/400/400', stock: 35 },
    { name: 'Profesyonel Yoga Matı 6mm', description: 'Kaymaz yüzey, TPE malzeme, taşıma kayışlı, 183x61cm.', price: 599, salePrice: 449, categories: ['Spor & Outdoor', 'Fitness'], tags: ['yoga matı', 'fitness', 'pilates'], thumbnail: 'https://picsum.photos/seed/yogamat/400/400', stock: 70 },
    { name: '20kg Ayarlanabilir Dumbbell Set', description: 'Kauçuk kaplama, ergonomik kavrama, 2.5-20kg arası ayar.', price: 2499, salePrice: 1999, categories: ['Spor & Outdoor', 'Fitness'], tags: ['dumbbell', 'ağırlık', 'fitness'], thumbnail: 'https://picsum.photos/seed/dumbbell/400/400', stock: 25 },
    { name: '4 Mevsim Kamp Çadırı 4 Kişilik', description: 'Su geçirmez, UV korumalı, kolay kurulum, fiberglas çubuklar.', price: 3999, salePrice: 2999, categories: ['Spor & Outdoor', 'Outdoor'], tags: ['çadır', 'kamp', 'outdoor'], thumbnail: 'https://picsum.photos/seed/kampcadiri/400/400', stock: 20 },
    { name: 'The North Face Termal Mont', description: 'ThermoBall eco yalıtım, su geçirmez DryVent kabuk.', price: 5999, salePrice: 4499, categories: ['Spor & Outdoor', 'Giyim'], tags: ['mont', 'north face', 'kışlık'], thumbnail: 'https://picsum.photos/seed/northface/400/400', stock: 30 },
    { name: 'Garmin Forerunner 265 GPS Saat', description: 'AMOLED ekran, GPS, nabız ölçer, koşu dinamikleri.', price: 12999, salePrice: 10999, categories: ['Spor & Outdoor', 'Akıllı Saat'], tags: ['garmin', 'gps saat', 'koşu'], thumbnail: 'https://picsum.photos/seed/garmin265/400/400', stock: 15 },
    { name: 'Direnç Bandı Seti 5li', description: '5 farklı direnç seviyesi, lateks, çantalı set.', price: 299, salePrice: 199, categories: ['Spor & Outdoor', 'Fitness'], tags: ['direnç bandı', 'egzersiz', 'fitness'], thumbnail: 'https://picsum.photos/seed/resistband/400/400', stock: 100 },
  ],
  'Ev & Yaşam': [
    { name: 'Karaca Hatır Hüps Türk Kahve Makinesi', description: 'Süt köpürtme özelliği, 5 fincan kapasitesi, türk kahvesi pişirme.', price: 1999, salePrice: 1599, categories: ['Ev & Yaşam', 'Mutfak'], tags: ['kahve makinesi', 'karaca', 'türk kahvesi'], thumbnail: 'https://picsum.photos/seed/karacakahve/400/400', stock: 45 },
    { name: 'Linens Pamuk Nevresim Takımı Çift', description: '200 iplik sıklığı, %100 pamuk, 4 parça, beyaz.', price: 2499, salePrice: 1899, categories: ['Ev & Yaşam', 'Ev Tekstili'], tags: ['nevresim', 'pamuk', 'çift kişilik'], thumbnail: 'https://picsum.photos/seed/nevresim/400/400', stock: 30 },
    { name: 'Philips Air Fryer XXL', description: 'Yağsız fritöz, 7.3L kapasite, dijital ekran, 5 program.', price: 4999, salePrice: 3999, categories: ['Ev & Yaşam', 'Mutfak'], tags: ['airfryer', 'philips', 'fritöz'], thumbnail: 'https://picsum.photos/seed/airfryer/400/400', stock: 20 },
    { name: 'İskandinav Tarz Koltuk Örtüsü', description: 'Waffle dokuma, pamuk-polyester karışım, bej renk.', price: 799, salePrice: 599, categories: ['Ev & Yaşam', 'Dekorasyon'], tags: ['koltuk örtüsü', 'dekorasyon', 'iskandinav'], thumbnail: 'https://picsum.photos/seed/koltuk/400/400', stock: 40 },
    { name: 'Korkmaz Proline Tencere Seti 7 Parça', description: '18/10 paslanmaz çelik, kapsüllü taban, cam kapak.', price: 3999, salePrice: 2999, categories: ['Ev & Yaşam', 'Mutfak'], tags: ['tencere', 'korkmaz', 'set'], thumbnail: 'https://picsum.photos/seed/tencere/400/400', stock: 25 },
    { name: 'LED Masa Lambası Şarjlı', description: '3 renk sıcaklığı, parlaklık ayarı, USB şarjlı, dokunmatik kontrol.', price: 499, salePrice: 349, categories: ['Ev & Yaşam', 'Aydınlatma'], tags: ['lamba', 'led', 'şarjlı'], thumbnail: 'https://picsum.photos/seed/masalamba/400/400', stock: 65 },
    { name: 'Dekoratif Duvar Aynası 80cm', description: 'Yuvarlak, altın çerçeve, banyo ve salon için uygun.', price: 1299, salePrice: 999, categories: ['Ev & Yaşam', 'Dekorasyon'], tags: ['ayna', 'dekoratif', 'duvar'], thumbnail: 'https://picsum.photos/seed/duvararyna/400/400', stock: 20 },
    { name: 'Bambu Mutfak Düzenleyici Set', description: '5 parça, kaşıklık, bıçaklık, baharat rafı, çekmece düzenleyici.', price: 699, salePrice: 549, categories: ['Ev & Yaşam', 'Mutfak'], tags: ['bambu', 'düzenleyici', 'mutfak'], thumbnail: 'https://picsum.photos/seed/bambuduz/400/400', stock: 50 },
  ],
  'Ayakkabı & Çanta': [
    { name: 'Kadın Deri Omuz Çantası', description: 'Hakiki dana derisi, orta boy, ayarlanabilir askı, iç cepli.', price: 2999, salePrice: 2299, categories: ['Ayakkabı & Çanta', 'Çanta'], tags: ['çanta', 'deri', 'kadın'], thumbnail: 'https://picsum.photos/seed/omuz-canta/400/400', stock: 30 },
    { name: 'Erkek Oxford Klasik Ayakkabı', description: 'Hakiki deri, el dikimi, kauçuk taban, siyah.', price: 1999, salePrice: 1499, categories: ['Ayakkabı & Çanta', 'Erkek Ayakkabı'], tags: ['oxford', 'klasik', 'deri'], thumbnail: 'https://picsum.photos/seed/oxford/400/400', stock: 25 },
    { name: 'Kadın Sneaker Beyaz Platform', description: 'Deri üst, yükseltilmiş taban, ortopedik iç taban.', price: 1599, salePrice: 1199, categories: ['Ayakkabı & Çanta', 'Kadın Ayakkabı'], tags: ['sneaker', 'platform', 'beyaz'], thumbnail: 'https://picsum.photos/seed/sneaker/400/400', stock: 50 },
    { name: 'Travel Kabin Boy Valiz', description: 'Polikarbonat, 4 tekerlekli, TSA kilit, 55cm kabin boy.', price: 2499, salePrice: 1799, categories: ['Ayakkabı & Çanta', 'Valiz'], tags: ['valiz', 'kabin boy', 'seyahat'], thumbnail: 'https://picsum.photos/seed/valiz/400/400', stock: 20 },
    { name: 'Erkek Deri Sırt Çantası', description: 'Laptop bölmeli, hakiki deri, USB şarj portu.', price: 1899, salePrice: 1499, categories: ['Ayakkabı & Çanta', 'Çanta'], tags: ['sırt çantası', 'deri', 'laptop'], thumbnail: 'https://picsum.photos/seed/sirtcanta/400/400', stock: 35 },
    { name: 'Kadın Topuklu Sandalet', description: 'İnce topuk 8cm, süet kaplama, nude renk.', price: 1299, salePrice: 899, categories: ['Ayakkabı & Çanta', 'Kadın Ayakkabı'], tags: ['sandalet', 'topuklu', 'kadın'], thumbnail: 'https://picsum.photos/seed/topuklu/400/400', stock: 40 },
  ],
  'Süpermarket': [
    { name: 'Organik Zeytinyağı 1L', description: 'Soğuk sıkım, erken hasat, Ege bölgesi, extra virgin.', price: 349, salePrice: 279, categories: ['Süpermarket', 'Gıda'], tags: ['zeytinyağı', 'organik', 'soğuk sıkım'], thumbnail: 'https://picsum.photos/seed/zeytinyag/400/400', stock: 100 },
    { name: 'Filtre Kahve 1kg Çekirdek', description: 'Kolombiya Supremo, orta kavrulmuş, aromatik.', price: 499, salePrice: 399, categories: ['Süpermarket', 'İçecek'], tags: ['kahve', 'filtre', 'çekirdek'], thumbnail: 'https://picsum.photos/seed/filtrekahve/400/400', stock: 80 },
    { name: 'Doğal Bal 850g Kavanoz', description: 'Çam balı, süzme, Muğla menşeli, saf doğal bal.', price: 299, salePrice: 249, categories: ['Süpermarket', 'Gıda'], tags: ['bal', 'doğal', 'çam balı'], thumbnail: 'https://picsum.photos/seed/dogalbal/400/400', stock: 60 },
    { name: 'Protein Bar Çeşit Paketi 12li', description: 'Her biri 20g protein, 4 farklı aroma, düşük şeker.', price: 399, salePrice: 329, categories: ['Süpermarket', 'Atıştırmalık'], tags: ['protein bar', 'spor gıda', 'atıştırmalık'], thumbnail: 'https://picsum.photos/seed/proteinbar/400/400', stock: 90 },
    { name: 'Organik Granola 500g', description: 'Yulaf gevreği, kuru meyveli, bal ve tarçınlı.', price: 149, salePrice: 119, categories: ['Süpermarket', 'Kahvaltılık'], tags: ['granola', 'organik', 'kahvaltı'], thumbnail: 'https://picsum.photos/seed/granola/400/400', stock: 70 },
    { name: 'Ev Yapımı Makarna Set 3lü', description: 'Fettuccine, penne, fusilli — doğal malzemeler.', price: 189, categories: ['Süpermarket', 'Gıda'], tags: ['makarna', 'ev yapımı', 'doğal'], thumbnail: 'https://picsum.photos/seed/makarna/400/400', stock: 55 },
  ],
  'Saat & Aksesuar': [
    { name: 'Daniel Wellington Classic 36mm', description: 'Deri kayış, minimal tasarım, safir cam, su geçirmez.', price: 2999, salePrice: 2499, categories: ['Saat & Aksesuar', 'Kadın Saat'], tags: ['saat', 'daniel wellington', 'kadın'], thumbnail: 'https://picsum.photos/seed/dwwatch/400/400', stock: 25 },
    { name: 'Casio G-Shock GA-2100', description: 'Karbon çekirdek koruma, 200m su geçirmez, dünya saati.', price: 3499, salePrice: 2799, categories: ['Saat & Aksesuar', 'Erkek Saat'], tags: ['casio', 'g-shock', 'erkek saat'], thumbnail: 'https://picsum.photos/seed/gshock/400/400', stock: 30 },
    { name: 'Gümüş Zincir Kolye', description: '925 ayar gümüş, 45cm, minimal tasarım, hediye kutulu.', price: 599, salePrice: 449, categories: ['Saat & Aksesuar', 'Takı'], tags: ['kolye', 'gümüş', 'takı'], thumbnail: 'https://picsum.photos/seed/kolye/400/400', stock: 60 },
    { name: 'Ray-Ban Wayfarer Güneş Gözlüğü', description: 'Orijinal Wayfarer, polarize lens, UV400 koruma.', price: 3999, salePrice: 3299, categories: ['Saat & Aksesuar', 'Güneş Gözlüğü'], tags: ['rayban', 'wayfarer', 'güneş gözlüğü'], thumbnail: 'https://picsum.photos/seed/rayban/400/400', stock: 35 },
    { name: 'Fossil Erkek Deri Kemer', description: 'Hakiki deri, otomatik tokalı, siyah-kahverengi çift taraflı.', price: 899, salePrice: 699, categories: ['Saat & Aksesuar', 'Aksesuar'], tags: ['kemer', 'deri', 'fossil'], thumbnail: 'https://picsum.photos/seed/kemer/400/400', stock: 45 },
    { name: 'Pandora Charm Bileklik Set', description: 'Gümüş bileklik + 3 charm, hediye kutulu.', price: 2499, salePrice: 1999, categories: ['Saat & Aksesuar', 'Takı'], tags: ['pandora', 'bileklik', 'charm'], thumbnail: 'https://picsum.photos/seed/pandora/400/400', stock: 20 },
  ],
  'Anne & Çocuk': [
    { name: 'Bebek Arabası Travel Sistem', description: 'Portbebe, ana kucağı, puset 3in1. Alüminyum şase, tek elle katlama.', price: 8999, salePrice: 6999, categories: ['Anne & Çocuk', 'Bebek'], tags: ['bebek arabası', 'travel sistem', 'puset'], thumbnail: 'https://picsum.photos/seed/bebekaraba/400/400', stock: 15 },
    { name: 'LEGO Technic Yarış Arabası', description: '1580 parça, 1:8 ölçek, fonksiyonel direksiyon ve süspansiyon.', price: 2499, salePrice: 1999, categories: ['Anne & Çocuk', 'Oyuncak'], tags: ['lego', 'technic', 'yapı oyuncağı'], thumbnail: 'https://picsum.photos/seed/legotechnic/400/400', stock: 25 },
    { name: 'Eğitici Tablet Çocuk 7"', description: 'Ebeveyn kontrolü, 32GB, şoka dayanıklı kılıf, eğitici içerik.', price: 1999, salePrice: 1499, categories: ['Anne & Çocuk', 'Eğitici'], tags: ['tablet', 'çocuk', 'eğitici'], thumbnail: 'https://picsum.photos/seed/cocuktablet/400/400', stock: 30 },
    { name: 'Pampers Premium Care 4 Beden 104lü', description: 'En yumuşak koruma, hava kanalı teknolojisi, 9-14kg.', price: 549, salePrice: 449, categories: ['Anne & Çocuk', 'Bebek'], tags: ['bez', 'pampers', 'bebek'], thumbnail: 'https://picsum.photos/seed/pampers/400/400', stock: 80 },
    { name: 'Montessori Ahşap Oyuncak Seti', description: '12 parça eğitici ahşap blok, doğal boya, 1-4 yaş.', price: 699, salePrice: 549, categories: ['Anne & Çocuk', 'Oyuncak'], tags: ['montessori', 'ahşap', 'eğitici'], thumbnail: 'https://picsum.photos/seed/montessori/400/400', stock: 40 },
    { name: 'Çocuk Bisikleti 16 Jant', description: 'Yardımcı tekerlekli, çelik kadro, 4-7 yaş.', price: 2999, salePrice: 2499, categories: ['Anne & Çocuk', 'Oyuncak'], tags: ['bisiklet', 'çocuk', 'jant'], thumbnail: 'https://picsum.photos/seed/cocukbisik/400/400', stock: 20 },
    { name: 'Mama Sandalyesi Katlanabilir', description: '5 noktalı emniyet kemeri, çıkarılabilir tepsi, ayarlanabilir.', price: 1599, salePrice: 1199, categories: ['Anne & Çocuk', 'Bebek'], tags: ['mama sandalyesi', 'bebek', 'katlanabilir'], thumbnail: 'https://picsum.photos/seed/mamasandal/400/400', stock: 25 },
  ],
  'Oyuncak & Hobi': [
    { name: 'STEM Robot Kodlama Seti', description: '150+ parça, bluetooth kontrol, app destekli, 8-14 yaş.', price: 1299, salePrice: 999, categories: ['Oyuncak & Hobi', 'Eğitici'], tags: ['stem', 'robot', 'kodlama'], thumbnail: 'https://picsum.photos/seed/stemrobot/400/400', stock: 35 },
    { name: 'Puzzle 1000 Parça İstanbul', description: 'İstanbul silüeti, premium kalite, 68x48cm tamamlanmış boyut.', price: 249, salePrice: 199, categories: ['Oyuncak & Hobi', 'Puzzle'], tags: ['puzzle', 'istanbul', 'hobi'], thumbnail: 'https://picsum.photos/seed/puzzle1000/400/400', stock: 50 },
    { name: 'Teleskop Başlangıç Seti', description: '70mm açıklık, 400mm odak, tripod dahil, gezegen gözlemi.', price: 1999, salePrice: 1599, categories: ['Oyuncak & Hobi', 'Bilim'], tags: ['teleskop', 'astronomi', 'gözlem'], thumbnail: 'https://picsum.photos/seed/teleskop/400/400', stock: 15 },
    { name: 'Drone Mini Kamera 4K', description: '4K kamera, 30dk uçuş süresi, GPS, otomatik dönüş.', price: 3999, salePrice: 2999, categories: ['Oyuncak & Hobi', 'Drone'], tags: ['drone', '4k', 'kamera'], thumbnail: 'https://picsum.photos/seed/drone4k/400/400', stock: 20 },
    { name: 'Model Gemi Yapım Kiti', description: 'Ahşap yelkenli gemi, 1:75 ölçek, tüm malzemeler dahil.', price: 899, salePrice: 699, categories: ['Oyuncak & Hobi', 'Maket'], tags: ['model gemi', 'hobi', 'ahşap'], thumbnail: 'https://picsum.photos/seed/modelgemi/400/400', stock: 25 },
    { name: 'Masa Oyunu Catan', description: 'Strateji oyunu, 3-4 oyuncu, Türkçe, 10+ yaş.', price: 699, salePrice: 579, categories: ['Oyuncak & Hobi', 'Masa Oyunu'], tags: ['catan', 'masa oyunu', 'strateji'], thumbnail: 'https://picsum.photos/seed/catan/400/400', stock: 40 },
  ],
  'Hediyelik': [
    { name: 'Kişiye Özel İsim Kolye', description: '925 ayar gümüş, el yapımı, istenilen isim yazılır.', price: 499, salePrice: 399, categories: ['Hediyelik', 'Kişiye Özel'], tags: ['kolye', 'isim', 'hediye'], thumbnail: 'https://picsum.photos/seed/isimkolye/400/400', stock: 30 },
    { name: 'Lüks Çikolata Kutusu 24lü', description: 'El yapımı pralin, 12 farklı aroma, hediye kutulu.', price: 699, salePrice: 549, categories: ['Hediyelik', 'Çikolata'], tags: ['çikolata', 'lüks', 'hediye'], thumbnail: 'https://picsum.photos/seed/cikolata/400/400', stock: 45 },
    { name: 'Aromaterapi Mum Seti 3lü', description: 'Soya wax, doğal esanslar, lavanta-vanilya-bergamot.', price: 399, salePrice: 299, categories: ['Hediyelik', 'Dekorasyon'], tags: ['mum', 'aromaterapi', 'hediye'], thumbnail: 'https://picsum.photos/seed/mumseti/400/400', stock: 60 },
    { name: 'Fotoğraf Baskılı Yastık', description: 'Kişiye özel fotoğraf baskı, kadife kumaş, 40x40cm.', price: 299, salePrice: 229, categories: ['Hediyelik', 'Kişiye Özel'], tags: ['yastık', 'fotoğraf', 'kişiye özel'], thumbnail: 'https://picsum.photos/seed/fotoyastik/400/400', stock: 50 },
  ],
  'Kitap & Kırtasiye': [
    { name: 'Atomik Alışkanlıklar - James Clear', description: 'Küçük değişiklikler, olağanüstü sonuçlar. Bestseller kişisel gelişim.', price: 129, salePrice: 99, categories: ['Kitap & Kırtasiye', 'Kişisel Gelişim'], tags: ['kitap', 'kişisel gelişim', 'bestseller'], thumbnail: 'https://picsum.photos/seed/atomik/400/400', stock: 100 },
    { name: 'Moleskine Classic Defter A5', description: 'Sert kapak, noktalı, 240 sayfa, şeritli kapatma.', price: 349, salePrice: 279, categories: ['Kitap & Kırtasiye', 'Defter'], tags: ['defter', 'moleskine', 'a5'], thumbnail: 'https://picsum.photos/seed/moleskine/400/400', stock: 55 },
    { name: 'Lamy Safari Dolma Kalem', description: 'ABS gövde, ergonomik kavrama, değiştirilebilir kartuş.', price: 799, salePrice: 649, categories: ['Kitap & Kırtasiye', 'Kalem'], tags: ['dolma kalem', 'lamy', 'premium'], thumbnail: 'https://picsum.photos/seed/lamysafari/400/400', stock: 40 },
    { name: 'Küçük Prens - Antoine de Saint-Exupéry', description: 'Orijinal çizimlerle, sert kapak, özel baskı.', price: 79, salePrice: 59, categories: ['Kitap & Kırtasiye', 'Roman'], tags: ['kitap', 'klasik', 'roman'], thumbnail: 'https://picsum.photos/seed/kucukprens/400/400', stock: 80 },
    { name: 'Stabilo Pastel Marker Set 15li', description: 'Boss pastel renkler, yüzey kalemi, floresan ve pastel.', price: 399, salePrice: 319, categories: ['Kitap & Kırtasiye', 'Kalem'], tags: ['stabilo', 'marker', 'pastel'], thumbnail: 'https://picsum.photos/seed/stabilo/400/400', stock: 65 },
  ],
};

// Fallback ürünler (bilinmeyen kategoriler için)
const FALLBACK_PRODUCTS = [
  { name: 'Premium Ürün A', description: 'Yüksek kaliteli ürün, özenle seçilmiş malzemeler.', price: 999, salePrice: 799, categories: ['Genel'], tags: ['premium'], thumbnail: 'https://picsum.photos/seed/premiumA/400/400', stock: 30 },
  { name: 'Premium Ürün B', description: 'Müşteri memnuniyeti garantili, hızlı teslimat.', price: 1499, salePrice: 1199, categories: ['Genel'], tags: ['premium'], thumbnail: 'https://picsum.photos/seed/premiumB/400/400', stock: 25 },
  { name: 'Premium Ürün C', description: 'En çok satanlar arasında, özel fiyat avantajı.', price: 599, salePrice: 449, categories: ['Genel'], tags: ['indirim'], thumbnail: 'https://picsum.photos/seed/premiumC/400/400', stock: 40 },
  { name: 'Premium Ürün D', description: 'Yeni sezon koleksiyonu, sınırlı stok.', price: 2499, salePrice: 1999, categories: ['Genel'], tags: ['yeni'], thumbnail: 'https://picsum.photos/seed/premiumD/400/400', stock: 15 },
];

function getProductsForStore(storeCategories: string[]): typeof FALLBACK_PRODUCTS {
  const products: typeof FALLBACK_PRODUCTS = [];
  const seen = new Set<string>();

  for (const cat of storeCategories) {
    const templates = PRODUCT_TEMPLATES[cat];
    if (templates) {
      for (const t of templates) {
        if (!seen.has(t.name)) {
          seen.add(t.name);
          products.push(t);
        }
      }
    }
  }

  // Eğer hiç ürün bulamadıysa fallback
  if (products.length === 0) {
    return FALLBACK_PRODUCTS;
  }

  // Her mağaza için rastgele 5-10 ürün seç
  const shuffled = products.sort(() => Math.random() - 0.5);
  const count = Math.min(shuffled.length, 5 + Math.floor(Math.random() * 6));
  return shuffled.slice(0, count);
}

async function getToken(): Promise<string> {
  // First try env variable
  if (process.env.AUTH_TOKEN) return process.env.AUTH_TOKEN;

  // Try refresh token from env
  if (process.env.REFRESH_TOKEN) {
    const res = await fetch(`${API}/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: process.env.REFRESH_TOKEN }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.data?.accessToken || '';
    }
  }

  // Try login credentials
  const credentials = [
    { email: 'ayhantatay@yahoo.com.tr', password: 'Test1234' },
    { email: 'testpw@beacon.com', password: 'Test1234' },
    { email: 'seed@beacon.com', password: 'Seed1234' },
  ];

  for (const cred of credentials) {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cred),
    });
    if (res.ok) {
      const data = await res.json();
      const token = data.data?.accessToken || data.tokens?.accessToken || data.accessToken || '';
      if (token) {
        console.log(`✅ Giriş başarılı: ${cred.email}`);
        return token;
      }
    }
  }

  return '';
}

async function main() {
  console.log('🔐 Token alınıyor...');
  const token = await getToken();
  if (!token) {
    console.error('❌ Token bulunamadı. AUTH_TOKEN veya REFRESH_TOKEN env variable kullanın.');
    process.exit(1);
  }
  console.log('✅ Token alındı.');

  console.log('📦 Mağazalar yükleniyor...');

  // Fetch all stores
  const storesRes = await fetch(`${API}/stores/search?limit=100`);
  const storesData = await storesRes.json();
  const stores = storesData.data || storesData || [];

  console.log(`📍 ${stores.length} mağaza bulundu.`);

  let totalProducts = 0;
  let skipped = 0;

  for (const store of stores) {
    // Check existing products
    const existingRes = await fetch(`${API}/stores/${store.id}/products`);
    const existingData = await existingRes.json();
    const existing = existingData.data || existingData || [];

    if (existing.length >= 3) {
      skipped++;
      continue;
    }

    const products = getProductsForStore(store.categories || []);
    console.log(`\n🏪 ${store.name} — ${products.length} ürün ekleniyor...`);

    for (const product of products) {
      try {
        const res = await fetch(`${API}/products`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            storeId: store.id,
            name: product.name,
            description: product.description,
            price: product.price,
            salePrice: product.salePrice || undefined,
            categories: product.categories,
            tags: product.tags,
            thumbnail: product.thumbnail,
            images: [product.thumbnail],
            stockQuantity: product.stock,
            isFeatured: Math.random() > 0.7,
          }),
        });

        if (res.ok) {
          totalProducts++;
          process.stdout.write('.');
        } else {
          const err = await res.text();
          console.log(`\n  ❌ ${product.name}: ${err}`);
        }
      } catch (e: any) {
        console.log(`\n  ❌ ${product.name}: ${e.message}`);
      }
    }
  }

  console.log(`\n\n✅ Tamamlandı!`);
  console.log(`   Toplam ürün eklendi: ${totalProducts}`);
  console.log(`   Atlandı (yeterli ürünü olan): ${skipped}`);
}

main().catch(console.error);
