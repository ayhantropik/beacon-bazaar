/**
 * 100 magaza + 1000 urun olusturan kapsamli seed script
 * Kategoriler: Elektronik, Kadin, Erkek, Anne & Cocuk, Ev & Yasam,
 *   Supermarket, Kozmetik, Ayakkabi & Canta, Saat & Aksesuar, Spor & Outdoor
 * + Oto ve Emlak (storeType bazli)
 *
 * Kullanim: REFRESH_TOKEN="..." npx tsx src/seed-massive.ts
 */

const API = 'http://localhost:4000/api/v1';

// ==================== MAGAZA TANIMLARI ====================

const STORE_TEMPLATES: Array<{
  name: string; description: string; categories: string[]; storeType: string;
}> = [
  // Elektronik (10)
  { name: 'TeknoZone', description: 'En yeni teknoloji urunleri, akilli telefonlar ve bilgisayar aksesuarlari.', categories: ['Elektronik'], storeType: 'shopping' },
  { name: 'Digital World', description: 'Bilgisayar, tablet, aksesuar ve cevresel urunlerde en iyi fiyatlar.', categories: ['Elektronik'], storeType: 'shopping' },
  { name: 'ElektroShop', description: 'Ev elektronigi, beyaz esya ve kucuk ev aletleri.', categories: ['Elektronik'], storeType: 'shopping' },
  { name: 'GadgetPark', description: 'Akilli saat, kulaklik, powerbank ve teknolojik hediyeler.', categories: ['Elektronik'], storeType: 'shopping' },
  { name: 'MobilStore', description: 'Telefon, tablet ve aksesuar uzman magazasi.', categories: ['Elektronik'], storeType: 'shopping' },
  { name: 'SesVeGoruntu', description: 'TV, soundbar, kulaklik ve ses sistemleri.', categories: ['Elektronik'], storeType: 'shopping' },
  { name: 'PC Merkezi', description: 'Gaming bilgisayar, ekran karti, islemci ve tum bilgisayar bilesenleri.', categories: ['Elektronik'], storeType: 'shopping' },
  { name: 'FotoStore', description: 'Fotograf makinesi, lens, drone ve goruntuleme ekipmanlari.', categories: ['Elektronik'], storeType: 'shopping' },
  { name: 'SmartHome TR', description: 'Akilli ev urunleri, otomasyon ve IoT cihazlari.', categories: ['Elektronik'], storeType: 'shopping' },
  { name: 'BataryaPlus', description: 'Powerbank, sarj aleti, kablo ve enerji cozumleri.', categories: ['Elektronik'], storeType: 'shopping' },

  // Kadin (10)
  { name: 'Moda Atelier', description: 'Kadin giyimde son trendler, elbise, bluz, etek ve aksesuar.', categories: ['Kadın', 'Moda & Giyim'], storeType: 'shopping' },
  { name: 'ChicWoman', description: 'Sik kadin giyim, abiye ve ozel gun kiyafetleri.', categories: ['Kadın', 'Moda & Giyim'], storeType: 'shopping' },
  { name: 'GlamourStore', description: 'Kadin triko, hirka, kazak ve knitwear koleksiyonu.', categories: ['Kadın', 'Moda & Giyim'], storeType: 'shopping' },
  { name: 'StilKadini', description: 'Gunluk ve ofis kadin giyim, takim ve pantolon cesitleri.', categories: ['Kadın', 'Moda & Giyim'], storeType: 'shopping' },
  { name: 'PinkBoutique', description: 'Genc kadin modasi, crop top, jean ve street style.', categories: ['Kadın', 'Moda & Giyim'], storeType: 'shopping' },
  { name: 'EleganceShop', description: 'Kadin ic giyim, pijama ve ev giyim koleksiyonu.', categories: ['Kadın', 'Moda & Giyim'], storeType: 'shopping' },
  { name: 'Syal & Sal Dunyasi', description: 'Ipek sal, yun atki, esarp ve aksesuar.', categories: ['Kadın', 'Saat & Aksesuar'], storeType: 'shopping' },
  { name: 'Takistore', description: 'Kadin taki, kolye, bileklik, kupeler ve bijuteri.', categories: ['Kadın', 'Saat & Aksesuar'], storeType: 'shopping' },
  { name: 'KadinSpor', description: 'Kadin spor giyim, tayt, bustier ve antrenman kiyafetleri.', categories: ['Kadın', 'Spor & Outdoor'], storeType: 'shopping' },
  { name: 'BebegimleModa', description: 'Hamile giyim ve anne-bebek moda urunleri.', categories: ['Kadın', 'Anne & Çocuk'], storeType: 'shopping' },

  // Erkek (10)
  { name: 'Bay Giyim', description: 'Erkek giyimde premium kalite, gomlek, pantolon, takim elbise.', categories: ['Erkek', 'Moda & Giyim'], storeType: 'shopping' },
  { name: 'Gentleman Store', description: 'Erkek klasik giyim, kravat, cuzdan ve deri aksesuar.', categories: ['Erkek', 'Moda & Giyim'], storeType: 'shopping' },
  { name: 'StreetBoy', description: 'Erkek street fashion, hoodie, jogger ve sneaker.', categories: ['Erkek', 'Moda & Giyim'], storeType: 'shopping' },
  { name: 'ErkekSpor', description: 'Erkek spor giyim, esofman, sort ve antrenman urunleri.', categories: ['Erkek', 'Spor & Outdoor'], storeType: 'shopping' },
  { name: 'JeanCity', description: 'Erkek ve kadin jean, denim ceket ve denim aksesuar.', categories: ['Erkek', 'Kadın'], storeType: 'shopping' },
  { name: 'DeriDunyasi', description: 'Erkek deri ceket, cuzdan, kemer ve ayakkabi.', categories: ['Erkek', 'Ayakkabı & Çanta'], storeType: 'shopping' },
  { name: 'Kravat & Co', description: 'Kravat, papyon, gomlek ve erkek aksesuar.', categories: ['Erkek', 'Saat & Aksesuar'], storeType: 'shopping' },
  { name: 'Outdoor Man', description: 'Erkek outdoor giyim, mont, bot ve kamp malzemeleri.', categories: ['Erkek', 'Spor & Outdoor'], storeType: 'shopping' },
  { name: 'BasicErkek', description: 'Erkek basic tisort, boxer ve ic giyim.', categories: ['Erkek', 'Moda & Giyim'], storeType: 'shopping' },
  { name: 'FormalWear', description: 'Damatlik, takim elbise, smokin ve ozel gun giyim.', categories: ['Erkek', 'Moda & Giyim'], storeType: 'shopping' },

  // Anne & Cocuk (8)
  { name: 'MiniklerDunyasi', description: 'Bebek ve cocuk giyim, oyuncak ve bakim urunleri.', categories: ['Anne & Çocuk'], storeType: 'shopping' },
  { name: 'BabyLand', description: 'Bebek arabasi, mama sandalyesi, besik ve bebek odasi urunleri.', categories: ['Anne & Çocuk'], storeType: 'shopping' },
  { name: 'CocukModasi', description: 'Cocuk giyim, okul kiyafetleri ve parti elbiseleri.', categories: ['Anne & Çocuk'], storeType: 'shopping' },
  { name: 'AnneBebek+', description: 'Bebek mamasi, bezi, biberon ve bakim urunleri.', categories: ['Anne & Çocuk', 'Süpermarket'], storeType: 'shopping' },
  { name: 'OyuncakSehri', description: 'Egitici oyuncaklar, puzzle, lego ve cocuk aktivite urunleri.', categories: ['Anne & Çocuk'], storeType: 'shopping' },
  { name: 'Hamile Dunyasi', description: 'Hamile giyim, emzirme urunleri ve anne bakim seti.', categories: ['Anne & Çocuk', 'Kadın'], storeType: 'shopping' },
  { name: 'CocukOdasi', description: 'Cocuk mobilyasi, yatak, dolap ve oda dekorasyonu.', categories: ['Anne & Çocuk', 'Ev & Yaşam'], storeType: 'shopping' },
  { name: 'OkulMagazasi', description: 'Okul cantasi, suluk, beslenme kutusu ve kirtasiye.', categories: ['Anne & Çocuk'], storeType: 'shopping' },

  // Ev & Yasam (10)
  { name: 'HomeDeco', description: 'Ev dekorasyonu, tablo, vazo, mum ve aksesuar.', categories: ['Ev & Yaşam'], storeType: 'shopping' },
  { name: 'MutfakDunyasi', description: 'Mutfak gerecleri, tencere seti, bicak ve pisirme aletleri.', categories: ['Ev & Yaşam'], storeType: 'shopping' },
  { name: 'Tekstil Evi', description: 'Nevresim, havlu, perde ve ev tekstili urunleri.', categories: ['Ev & Yaşam'], storeType: 'shopping' },
  { name: 'AydınlatmaShop', description: 'Avize, aplik, masa lambasi ve dekoratif aydinlatma.', categories: ['Ev & Yaşam'], storeType: 'shopping' },
  { name: 'BahceSarayi', description: 'Bahce mobilyasi, saksi, bitki ve bahce aletleri.', categories: ['Ev & Yaşam'], storeType: 'shopping' },
  { name: 'BanyoMarket', description: 'Banyo aksesuarlari, havlu, paspas ve banyo mobilyasi.', categories: ['Ev & Yaşam'], storeType: 'shopping' },
  { name: 'YemekSofram', description: 'Yemek takimi, bardak seti, catal-kasik ve sofra urunleri.', categories: ['Ev & Yaşam'], storeType: 'shopping' },
  { name: 'OrganizeEvi', description: 'Duzenleme kutusu, askili, raf ve saklama cozumleri.', categories: ['Ev & Yaşam'], storeType: 'shopping' },
  { name: 'HaliDunyasi', description: 'Hali, kilim, yolluk ve paspas cesitleri.', categories: ['Ev & Yaşam'], storeType: 'shopping' },
  { name: 'EvAletleri+', description: 'Elektrikli supurge, utu, camasir makinesi ve beyaz esya.', categories: ['Ev & Yaşam', 'Elektronik'], storeType: 'shopping' },

  // Supermarket (8)
  { name: 'TazeMarket', description: 'Taze meyve, sebze, et ve gunluk gida urunleri.', categories: ['Süpermarket'], storeType: 'shopping' },
  { name: 'OrganikCiftlik', description: 'Organik gida, dogal urunler ve saglikli atistirmaliklar.', categories: ['Süpermarket'], storeType: 'shopping' },
  { name: 'GidaDeposu', description: 'Toptan ve perakende kuru gida, konserve ve icecek.', categories: ['Süpermarket'], storeType: 'shopping' },
  { name: 'CayKahveDunyasi', description: 'Cay cesitleri, kahve cekirdegi, bitki caylari ve demleme ekipmani.', categories: ['Süpermarket'], storeType: 'shopping' },
  { name: 'FitGida', description: 'Protein bar, granola, diyet urunleri ve saglikli atistirmalik.', categories: ['Süpermarket', 'Spor & Outdoor'], storeType: 'shopping' },
  { name: 'Sarkuteri Lezzet', description: 'Peynir, zeytin, sucuk, pastirma ve sarkuteri urunleri.', categories: ['Süpermarket'], storeType: 'shopping' },
  { name: 'BaharatDunyasi', description: 'Baharat, sos, salca ve mutfak malzemeleri.', categories: ['Süpermarket'], storeType: 'shopping' },
  { name: 'TemizlikDeposu', description: 'Temizlik urunleri, deterjan, yumusatici ve hijyen malzemeleri.', categories: ['Süpermarket'], storeType: 'shopping' },

  // Kozmetik (8)
  { name: 'GlowBeauty', description: 'Cilt bakim, makyaj ve guzellik urunleri.', categories: ['Kozmetik'], storeType: 'shopping' },
  { name: 'ParfumAtelier', description: 'Orijinal parfum, deodorant ve vucut bakim.', categories: ['Kozmetik'], storeType: 'shopping' },
  { name: 'SacBakimEvi', description: 'Sampuan, sac kremi, sac boyasi ve sac bakim urunleri.', categories: ['Kozmetik'], storeType: 'shopping' },
  { name: 'NaturelKozmetik', description: 'Dogal ve organik kozmetik, vegan guzellik urunleri.', categories: ['Kozmetik'], storeType: 'shopping' },
  { name: 'MakeUpPro', description: 'Profesyonel makyaj urunleri, firca seti ve makyaj malzemesi.', categories: ['Kozmetik'], storeType: 'shopping' },
  { name: 'ErkekBakim', description: 'Erkek bakim urunleri, tras, sac sekillendirme ve parfum.', categories: ['Kozmetik', 'Erkek'], storeType: 'shopping' },
  { name: 'NailArt Studio', description: 'Oje, tirnak bakim, protez tirnak ve nail art malzemesi.', categories: ['Kozmetik'], storeType: 'shopping' },
  { name: 'DermoEczane', description: 'Dermokozmetik, SPF urunleri ve medikal cilt bakim.', categories: ['Kozmetik'], storeType: 'shopping' },

  // Ayakkabi & Canta (8)
  { name: 'AyakkabiDunyasi', description: 'Kadin ve erkek ayakkabi, bot, sandalet ve terlik.', categories: ['Ayakkabı & Çanta'], storeType: 'shopping' },
  { name: 'SneakerHouse', description: 'Orijinal sneaker, spor ayakkabi ve limited edition modeller.', categories: ['Ayakkabı & Çanta', 'Spor & Outdoor'], storeType: 'shopping' },
  { name: 'CantaMerkezi', description: 'Kadin canta, el cantasi, sirt cantasi ve cuzdan.', categories: ['Ayakkabı & Çanta', 'Kadın'], storeType: 'shopping' },
  { name: 'DeriAyakkabi', description: 'Hakiki deri ayakkabi, klasik erkek ayakkabi ve loafer.', categories: ['Ayakkabı & Çanta', 'Erkek'], storeType: 'shopping' },
  { name: 'CocukAyakkabi', description: 'Cocuk spor ayakkabi, sandalet ve okul ayakkabisi.', categories: ['Ayakkabı & Çanta', 'Anne & Çocuk'], storeType: 'shopping' },
  { name: 'BavulDunyasi', description: 'Valiz, seyahat cantasi, laptop cantasi ve sirt cantasi.', categories: ['Ayakkabı & Çanta'], storeType: 'shopping' },
  { name: 'BootCamp', description: 'Bot, cizme, outdoor ayakkabi ve kislik modeller.', categories: ['Ayakkabı & Çanta'], storeType: 'shopping' },
  { name: 'SporCanta', description: 'Spor canta, gym bag, bel cantasi ve kosu cantasi.', categories: ['Ayakkabı & Çanta', 'Spor & Outdoor'], storeType: 'shopping' },

  // Saat & Aksesuar (8)
  { name: 'SaatGaleri', description: 'Erkek ve kadin kol saati, akilli saat ve saat aksesuarlari.', categories: ['Saat & Aksesuar'], storeType: 'shopping' },
  { name: 'GozlukEvi', description: 'Gunes gozlugu, numarali cerceve ve gozluk aksesuari.', categories: ['Saat & Aksesuar'], storeType: 'shopping' },
  { name: 'AksesuarDunyasi', description: 'Sapka, kemer, cuzdan, anahtarlik ve aksesuar.', categories: ['Saat & Aksesuar'], storeType: 'shopping' },
  { name: 'GumisAtolye', description: 'Gumus taki, yuzuk, kolye ve el yapimi takilar.', categories: ['Saat & Aksesuar'], storeType: 'shopping' },
  { name: 'LuxWatch', description: 'Premium saat markalari, Casio, Fossil, Daniel Wellington.', categories: ['Saat & Aksesuar'], storeType: 'shopping' },
  { name: 'BijuteriPark', description: 'Fantazi taki, boncuk, bileklik ve moda aksesuar.', categories: ['Saat & Aksesuar', 'Kadın'], storeType: 'shopping' },
  { name: 'ErkekAksesuar', description: 'Erkek saat, kravat ignesi, kol dugmesi ve cuzdan.', categories: ['Saat & Aksesuar', 'Erkek'], storeType: 'shopping' },
  { name: 'SporSaat', description: 'Spor saat, GPS saat, fitness tracker ve kayislar.', categories: ['Saat & Aksesuar', 'Spor & Outdoor'], storeType: 'shopping' },

  // Spor & Outdoor (10)
  { name: 'FitnessDeposu', description: 'Fitness ekipmani, dumbbell, bench press ve ev jimnastigi.', categories: ['Spor & Outdoor'], storeType: 'shopping' },
  { name: 'KampMerkezi', description: 'Cadir, uyku tulumu, kamp sandalyesi ve outdoor malzemeleri.', categories: ['Spor & Outdoor'], storeType: 'shopping' },
  { name: 'BisikletDunyasi', description: 'Bisiklet, bisiklet aksesuari, kask ve giyim.', categories: ['Spor & Outdoor'], storeType: 'shopping' },
  { name: 'YogaStudio', description: 'Yoga mati, blok, kayis ve meditasyon urunleri.', categories: ['Spor & Outdoor'], storeType: 'shopping' },
  { name: 'DagSporlari', description: 'Trekking ayakkabi, tirmanma ekipmani ve dagcilik malzemesi.', categories: ['Spor & Outdoor'], storeType: 'shopping' },
  { name: 'YuzmeShop', description: 'Yuzme gozlugu, mayo, bone ve su sporlari ekipmani.', categories: ['Spor & Outdoor'], storeType: 'shopping' },
  { name: 'FutbolStore', description: 'Futbol topu, krampon, forma ve antrenman malzemesi.', categories: ['Spor & Outdoor'], storeType: 'shopping' },
  { name: 'BalikciDunyasi', description: 'Olta, makine, yem ve balikcilik ekipmanlari.', categories: ['Spor & Outdoor'], storeType: 'shopping' },
  { name: 'SporGiyim365', description: 'Her mevsim spor giyim, esofman, tisort ve sort.', categories: ['Spor & Outdoor'], storeType: 'shopping' },
  { name: 'TenisKlubu', description: 'Tenis raketi, top, giyim ve tenis aksesuarlari.', categories: ['Spor & Outdoor'], storeType: 'shopping' },

  // Oto (5)
  { name: 'Premium Auto Gallery', description: 'Sifir ve ikinci el luks otomobil.', categories: ['Otomotiv'], storeType: 'automotive' },
  { name: 'Halk Oto', description: 'Uygun fiyatli ikinci el araclar.', categories: ['Otomotiv'], storeType: 'automotive' },
  { name: 'OtoYedekParca', description: 'Arac yedek parca, filtre ve motor parcalari.', categories: ['Otomotiv'], storeType: 'automotive' },
  { name: 'LastikDeposu', description: 'Yaz ve kis lastigi, jant cesitleri.', categories: ['Otomotiv'], storeType: 'automotive' },
  { name: 'OtoAksesuar', description: 'Arac ici aksesuar, koltuk kilifi ve organizer.', categories: ['Otomotiv'], storeType: 'automotive' },

  // Emlak (5)
  { name: 'Istanbul Emlak Ofisi', description: 'Istanbul genelinde satilik ve kiralik konut.', categories: ['Emlak'], storeType: 'realestate' },
  { name: 'Ankara Gayrimenkul', description: 'Ankara konut ve ticari gayrimenkul.', categories: ['Emlak'], storeType: 'realestate' },
  { name: 'Ege Emlak Ofisi', description: 'Izmir ve cevresinde yazlik ve konut.', categories: ['Emlak'], storeType: 'realestate' },
  { name: 'Premium Homes TR', description: 'Luks villa, penthouse ve residence.', categories: ['Emlak'], storeType: 'realestate' },
  { name: 'Antalya Homes', description: 'Antalya satilik ve kiralik emlak.', categories: ['Emlak'], storeType: 'realestate' },
];

// ==================== URUN SABLONLARI ====================

interface ProductTemplate {
  name: string; description: string; price: number; salePrice?: number;
  categories: string[]; tags: string[]; stock: number;
}

const PRODUCT_CATALOG: Record<string, ProductTemplate[]> = {
  'Elektronik': [
    { name: 'Apple iPhone 15 Pro 256GB', description: 'A17 Pro cip, titanium tasarim, 48MP kamera.', price: 64999, salePrice: 59999, categories: ['Elektronik'], tags: ['apple', 'iphone'], stock: 25 },
    { name: 'Samsung Galaxy S24 Ultra', description: '200MP kamera, Galaxy AI, S Pen dahil.', price: 54999, salePrice: 49990, categories: ['Elektronik'], tags: ['samsung', 'galaxy'], stock: 30 },
    { name: 'MacBook Air M3 13"', description: 'Apple M3 cip, 8GB RAM, 256GB SSD.', price: 42999, salePrice: 39999, categories: ['Elektronik'], tags: ['apple', 'macbook'], stock: 15 },
    { name: 'Sony WH-1000XM5 Kulaklik', description: 'Gurultu engelleme, 30 saat pil.', price: 8999, salePrice: 7499, categories: ['Elektronik'], tags: ['sony', 'kulaklik'], stock: 40 },
    { name: 'iPad Air M2 11"', description: 'M2 cip, Liquid Retina ekran.', price: 24999, categories: ['Elektronik'], tags: ['apple', 'ipad'], stock: 20 },
    { name: 'Samsung 65" QLED 4K TV', description: 'Quantum Dot, Smart TV, Dolby Atmos.', price: 32999, salePrice: 27999, categories: ['Elektronik'], tags: ['samsung', 'tv'], stock: 10 },
    { name: 'Apple Watch Series 9', description: 'Cift dokunma, saglik izleme.', price: 14999, salePrice: 12999, categories: ['Elektronik'], tags: ['apple', 'watch'], stock: 35 },
    { name: 'Dyson V15 Detect Supurge', description: 'Lazer toz algilama, LCD ekran.', price: 19999, salePrice: 16999, categories: ['Elektronik'], tags: ['dyson', 'supurge'], stock: 18 },
    { name: 'JBL Charge 5 Hoparlor', description: 'IP67 su gecirmez, 20 saat pil.', price: 3999, salePrice: 3299, categories: ['Elektronik'], tags: ['jbl', 'hoparlor'], stock: 50 },
    { name: 'Logitech MX Master 3S', description: 'Sessiz tiklama, MagSpeed scroll.', price: 2999, categories: ['Elektronik'], tags: ['logitech', 'mouse'], stock: 45 },
    { name: 'AirPods Pro 2. Nesil', description: 'Aktif gurultu engelleme, USB-C sarj.', price: 9499, salePrice: 8499, categories: ['Elektronik'], tags: ['apple', 'airpods'], stock: 55 },
    { name: 'Xiaomi Robot Supurge X10+', description: 'Lazer navigasyon, otomatik bosaltma.', price: 14999, salePrice: 11999, categories: ['Elektronik'], tags: ['xiaomi', 'robot supurge'], stock: 20 },
    { name: 'MSI Katana Gaming Laptop', description: 'i7-13620H, RTX 4060, 16GB RAM.', price: 34999, salePrice: 29999, categories: ['Elektronik'], tags: ['msi', 'gaming'], stock: 12 },
    { name: 'Samsung Galaxy Buds FE', description: 'ANC, 6 saat pil, IPX2.', price: 2999, salePrice: 2499, categories: ['Elektronik'], tags: ['samsung', 'kulaklik'], stock: 60 },
    { name: 'Philips Hue Starter Kit', description: 'Akilli ampul 3lu set, Bridge dahil.', price: 3499, salePrice: 2999, categories: ['Elektronik'], tags: ['philips', 'akilli ev'], stock: 25 },
  ],
  'Kadın': [
    { name: 'Kadin Trencokot', description: 'Klasik kesim, su itici kumas, kemer detayli.', price: 2499, salePrice: 1899, categories: ['Kadın', 'Moda & Giyim'], tags: ['trencokot', 'kadin'], stock: 35 },
    { name: 'Midi Cicek Desenli Elbise', description: 'A kesim, midi boy, yazlik kumas.', price: 1299, salePrice: 899, categories: ['Kadın', 'Moda & Giyim'], tags: ['elbise', 'midi'], stock: 45 },
    { name: 'High-Waist Skinny Jean', description: 'Yuksek bel, skinny fit, koyu mavi.', price: 999, salePrice: 749, categories: ['Kadın', 'Moda & Giyim'], tags: ['jean', 'skinny'], stock: 55 },
    { name: 'Saten Gomlek Bluz', description: 'Saten kumas, dusuk omuz, ofis sik.', price: 799, salePrice: 599, categories: ['Kadın', 'Moda & Giyim'], tags: ['bluz', 'saten'], stock: 40 },
    { name: 'Kadin Deri Biker Ceket', description: 'Suni deri, fermuarli, slim kesim.', price: 1999, salePrice: 1499, categories: ['Kadın', 'Moda & Giyim'], tags: ['ceket', 'deri'], stock: 25 },
    { name: 'Pilise Etek Midi', description: 'Piliseli kumas, elastik bel, 4 renk.', price: 699, salePrice: 499, categories: ['Kadın', 'Moda & Giyim'], tags: ['etek', 'pilise'], stock: 50 },
    { name: 'Oversized Kazak', description: 'Orgu kazak, yuvarlak yaka, rahat kesim.', price: 899, salePrice: 699, categories: ['Kadın', 'Moda & Giyim'], tags: ['kazak', 'orgu'], stock: 60 },
    { name: 'Abiye Uzun Elbise', description: 'Pul payetli, balik model, ozel gun.', price: 3499, salePrice: 2799, categories: ['Kadın', 'Moda & Giyim'], tags: ['abiye', 'elbise'], stock: 15 },
    { name: 'Kadin Esofman Takimi', description: 'Pamuklu, jogger pantolon + sweatshirt.', price: 1299, salePrice: 999, categories: ['Kadın', 'Moda & Giyim'], tags: ['esofman', 'kadin'], stock: 70 },
    { name: 'Crop Top 3lu Set', description: 'Pamuk, siyah-beyaz-bej, basic.', price: 499, salePrice: 349, categories: ['Kadın', 'Moda & Giyim'], tags: ['crop top', 'basic'], stock: 80 },
  ],
  'Erkek': [
    { name: 'Slim Fit Pamuk Gomlek', description: 'Premium pamuk, slim fit, dugmeli yaka.', price: 899, salePrice: 599, categories: ['Erkek', 'Moda & Giyim'], tags: ['gomlek', 'slim fit'], stock: 80 },
    { name: 'Erkek Deri Ceket', description: 'Hakiki kuzu derisi, siyah, slim kesim.', price: 4999, salePrice: 3999, categories: ['Erkek', 'Moda & Giyim'], tags: ['deri ceket', 'erkek'], stock: 20 },
    { name: 'Chino Pantolon', description: 'Strec kumas, slim fit, 4 renk.', price: 799, salePrice: 549, categories: ['Erkek', 'Moda & Giyim'], tags: ['pantolon', 'chino'], stock: 60 },
    { name: 'V-Yaka Tisort 3lu', description: 'Pamuklu jersey, siyah-beyaz-gri set.', price: 599, salePrice: 399, categories: ['Erkek', 'Moda & Giyim'], tags: ['tisort', 'basic'], stock: 120 },
    { name: 'Oversize Hoodie', description: 'Organik pamuk, kanguru cep, unisex.', price: 699, salePrice: 499, categories: ['Erkek', 'Moda & Giyim'], tags: ['hoodie', 'oversize'], stock: 100 },
    { name: 'Takim Elbise 2 Parca', description: 'Slim fit, ceket + pantolon, lacivert.', price: 3999, salePrice: 2999, categories: ['Erkek', 'Moda & Giyim'], tags: ['takim elbise'], stock: 15 },
    { name: 'Erkek Esofman Alti', description: 'Jogger kesim, pamuklu, elastik bel.', price: 499, salePrice: 349, categories: ['Erkek', 'Moda & Giyim'], tags: ['esofman', 'jogger'], stock: 90 },
    { name: 'Polo Yaka Tisort', description: 'Pique kumas, regular fit, nakisli logo.', price: 599, salePrice: 449, categories: ['Erkek', 'Moda & Giyim'], tags: ['polo', 'tisort'], stock: 75 },
    { name: 'Erkek Mont Parka', description: 'Su gecirmez, kapusonlu, kislik.', price: 2999, salePrice: 2299, categories: ['Erkek', 'Moda & Giyim'], tags: ['mont', 'parka'], stock: 30 },
    { name: 'Erkek Boxer 5li Set', description: 'Pamuklu, elastik bel, karisik renk.', price: 399, salePrice: 299, categories: ['Erkek', 'Moda & Giyim'], tags: ['boxer', 'ic giyim'], stock: 150 },
  ],
  'Anne & Çocuk': [
    { name: 'Bebek Arabasi Travel Sistem', description: 'Oto koltugu dahil, 3in1, katlanir.', price: 7999, salePrice: 5999, categories: ['Anne & Çocuk'], tags: ['bebek arabasi'], stock: 15 },
    { name: 'Mama Sandalyesi Katlanir', description: 'Yukseklik ayarli, yikanabilir kilif.', price: 2499, salePrice: 1899, categories: ['Anne & Çocuk'], tags: ['mama sandalyesi'], stock: 25 },
    { name: 'Bebek Tulumu 0-6 Ay', description: 'Organik pamuk, citcitli, sevimli desenler.', price: 349, salePrice: 249, categories: ['Anne & Çocuk'], tags: ['bebek giyim'], stock: 80 },
    { name: 'Cocuk Pijama Takimi', description: 'Pamuklu, karikatur desenli, 2-8 yas.', price: 399, salePrice: 299, categories: ['Anne & Çocuk'], tags: ['pijama', 'cocuk'], stock: 60 },
    { name: 'LEGO Classic Kutu 790 Parca', description: 'Yaratici tuglalar, 4+ yas, egitici.', price: 899, salePrice: 749, categories: ['Anne & Çocuk'], tags: ['lego', 'oyuncak'], stock: 40 },
    { name: 'Bebek Bezi Mega Paket', description: 'Ultra emici, hipoalerjenik, 120 adet.', price: 649, salePrice: 549, categories: ['Anne & Çocuk', 'Süpermarket'], tags: ['bebek bezi'], stock: 100 },
    { name: 'Biberon Anti-Kolik Set', description: '3lu set, anti-kolik valf, BPA free.', price: 599, salePrice: 449, categories: ['Anne & Çocuk'], tags: ['biberon'], stock: 50 },
    { name: 'Cocuk Okul Cantasi', description: 'Ergonomik sirt, yansitici serit, 30L.', price: 699, salePrice: 549, categories: ['Anne & Çocuk'], tags: ['okul cantasi'], stock: 45 },
    { name: 'Bebek Bakim Seti 10 Parca', description: 'Tirnak makasi, termometre, firca vb.', price: 449, salePrice: 349, categories: ['Anne & Çocuk'], tags: ['bebek bakim'], stock: 55 },
    { name: 'Tahta Puzzle Seti 6li', description: 'Egitici ahsap puzzle, hayvanlar, 2+ yas.', price: 299, salePrice: 229, categories: ['Anne & Çocuk'], tags: ['puzzle', 'egitici'], stock: 70 },
  ],
  'Ev & Yaşam': [
    { name: 'Karaca Hatir Hups Kahve Makinesi', description: 'Sut kopurtme, 5 fincan kapasite.', price: 1999, salePrice: 1599, categories: ['Ev & Yaşam'], tags: ['kahve makinesi'], stock: 45 },
    { name: 'Pamuk Nevresim Takimi Cift', description: '200 iplik, %100 pamuk, 4 parca.', price: 2499, salePrice: 1899, categories: ['Ev & Yaşam'], tags: ['nevresim'], stock: 30 },
    { name: 'Philips Air Fryer XXL', description: 'Yagsiz fritoz, 7.3L, dijital ekran.', price: 4999, salePrice: 3999, categories: ['Ev & Yaşam'], tags: ['airfryer'], stock: 20 },
    { name: 'Iskandinav Koltuk Ortusu', description: 'Waffle dokuma, pamuk-polyester, bej.', price: 799, salePrice: 599, categories: ['Ev & Yaşam'], tags: ['dekorasyon'], stock: 40 },
    { name: 'Dekoratif Mum Seti 3lu', description: 'Soya mumu, vanilya kokusu, cam kavanoz.', price: 349, salePrice: 279, categories: ['Ev & Yaşam'], tags: ['mum', 'dekorasyon'], stock: 65 },
    { name: 'Paslanmaz Tencere Seti 7li', description: 'Induksiyon uyumlu, cam kapak.', price: 3999, salePrice: 2999, categories: ['Ev & Yaşam'], tags: ['tencere', 'mutfak'], stock: 20 },
    { name: 'Bambu Banyo Raf Seti', description: '3 katli, duvar montajli, dogal bambu.', price: 899, salePrice: 699, categories: ['Ev & Yaşam'], tags: ['banyo', 'raf'], stock: 35 },
    { name: 'LED Avize Modern', description: 'Uzaktan kumandali, 3 renk, 60cm.', price: 2999, salePrice: 2299, categories: ['Ev & Yaşam'], tags: ['avize'], stock: 15 },
    { name: 'Masa Lambasi Ahsap', description: 'E27 duy, sari isik, dogal ahsap ayak.', price: 599, salePrice: 449, categories: ['Ev & Yaşam'], tags: ['lamba'], stock: 50 },
    { name: 'Yemek Takimi 24 Parca', description: 'Porselen, 6 kisilik, mikro dalga uyumlu.', price: 1999, salePrice: 1499, categories: ['Ev & Yaşam'], tags: ['yemek takimi'], stock: 25 },
  ],
  'Süpermarket': [
    { name: 'Filiz Basmati Pirinc 1kg', description: 'Uzun taneli, mis gibi koku.', price: 89, categories: ['Süpermarket'], tags: ['pirinc'], stock: 200 },
    { name: 'Organik Zeytinyagi 1L', description: 'Soguk sikim, erken hasat.', price: 349, salePrice: 299, categories: ['Süpermarket'], tags: ['zeytinyagi'], stock: 80 },
    { name: 'Turk Kahvesi 500g', description: 'Orta kavrulmus, taze cekilmis.', price: 199, salePrice: 169, categories: ['Süpermarket'], tags: ['kahve'], stock: 100 },
    { name: 'Dogal Cicek Bali 850g', description: 'Suzme bal, cam kavanoz, Macahel.', price: 449, salePrice: 379, categories: ['Süpermarket'], tags: ['bal'], stock: 50 },
    { name: 'Protein Bar Karisik 12li', description: '20g protein, dusuk seker.', price: 399, salePrice: 329, categories: ['Süpermarket', 'Spor & Outdoor'], tags: ['protein'], stock: 120 },
    { name: 'Taze Cilek 500g', description: 'Organik, taze toplanmis.', price: 79, categories: ['Süpermarket'], tags: ['meyve'], stock: 150 },
    { name: 'Antep Fistigi Ic 250g', description: 'Kavrulmus, tuzsuz.', price: 249, categories: ['Süpermarket'], tags: ['kuruyemis'], stock: 80 },
    { name: 'Granola Musli 500g', description: 'Yulaf, kuru meyve, bal, ceviz.', price: 149, salePrice: 119, categories: ['Süpermarket'], tags: ['granola'], stock: 90 },
    { name: 'Sut 6li Paket 1L', description: 'Tam yagli, pastorize, UHT.', price: 179, categories: ['Süpermarket'], tags: ['sut'], stock: 200 },
    { name: 'Karisik Baharat Seti 8li', description: 'Kimyon, kekik, pul biber vb.', price: 199, salePrice: 159, categories: ['Süpermarket'], tags: ['baharat'], stock: 60 },
  ],
  'Kozmetik': [
    { name: 'MAC Ruby Woo Ruj', description: 'Mat bitisli, yogun pigment.', price: 899, salePrice: 749, categories: ['Kozmetik'], tags: ['ruj'], stock: 70 },
    { name: 'La Roche-Posay Effaclar Duo+', description: 'Akne karsiti, niacinamide.', price: 659, salePrice: 549, categories: ['Kozmetik'], tags: ['cilt bakim'], stock: 90 },
    { name: 'Estee Lauder Double Wear', description: '24 saat kalici fondoten.', price: 1899, salePrice: 1599, categories: ['Kozmetik'], tags: ['fondoten'], stock: 40 },
    { name: 'Dior Sauvage EDP 100ml', description: 'Maskulen, taze notalar.', price: 4999, salePrice: 4199, categories: ['Kozmetik'], tags: ['parfum'], stock: 25 },
    { name: 'The Ordinary Niacinamide 10%', description: 'Gozenek kucultucü serum 30ml.', price: 249, categories: ['Kozmetik'], tags: ['serum'], stock: 150 },
    { name: 'Maybelline Sky High Maskara', description: 'Uzatici ve kivirici etki.', price: 349, salePrice: 279, categories: ['Kozmetik'], tags: ['maskara'], stock: 80 },
    { name: 'Bioderma Sensibio H2O 500ml', description: 'Misel su, hassas ciltler icin.', price: 399, salePrice: 329, categories: ['Kozmetik'], tags: ['misel su'], stock: 100 },
    { name: 'Chanel No.5 EDP 100ml', description: 'Efsanevi kadin parfumu.', price: 6999, salePrice: 5999, categories: ['Kozmetik'], tags: ['parfum'], stock: 15 },
    { name: 'Cerave Nemlendirici 340ml', description: 'Seramid icerikli, tum cilt tipleri.', price: 499, salePrice: 399, categories: ['Kozmetik'], tags: ['nemlendirici'], stock: 110 },
    { name: 'Garnier Micellar Sampuan', description: 'Miseller teknoloji, tum sac tipleri.', price: 149, salePrice: 119, categories: ['Kozmetik'], tags: ['sampuan'], stock: 90 },
  ],
  'Ayakkabı & Çanta': [
    { name: 'Nike Air Force 1 07', description: 'Klasik beyaz sneaker, deri ust.', price: 3499, salePrice: 2999, categories: ['Ayakkabı & Çanta'], tags: ['nike', 'sneaker'], stock: 45 },
    { name: 'Adidas Stan Smith', description: 'Ikonik beyaz-yesil, deri, unisex.', price: 2999, salePrice: 2499, categories: ['Ayakkabı & Çanta'], tags: ['adidas'], stock: 40 },
    { name: 'Kadin Deri Omuz Cantasi', description: 'Hakiki deri, ayarli kayis, siyah.', price: 2499, salePrice: 1899, categories: ['Ayakkabı & Çanta', 'Kadın'], tags: ['canta'], stock: 25 },
    { name: 'Erkek Oxford Ayakkabi', description: 'Hakiki deri, klasik, kahverengi.', price: 1999, salePrice: 1499, categories: ['Ayakkabı & Çanta', 'Erkek'], tags: ['oxford'], stock: 30 },
    { name: 'Sirt Cantasi Laptop 15.6"', description: 'Su gecirmez, USB portu, 30L.', price: 899, salePrice: 699, categories: ['Ayakkabı & Çanta'], tags: ['sirt cantasi'], stock: 55 },
    { name: 'Kadin Topuklu Stiletto', description: '10cm topuk, sivri burun, suet.', price: 1299, salePrice: 899, categories: ['Ayakkabı & Çanta', 'Kadın'], tags: ['topuklu'], stock: 35 },
    { name: 'New Balance 574 Unisex', description: 'Retro tasarim, suet-mesh.', price: 2799, salePrice: 2299, categories: ['Ayakkabı & Çanta'], tags: ['new balance'], stock: 50 },
    { name: 'Valiz Seti 3lu', description: 'ABS kasa, TSA kilit, 360 teker.', price: 3999, salePrice: 2999, categories: ['Ayakkabı & Çanta'], tags: ['valiz'], stock: 20 },
    { name: 'Kadin El Cantasi Clutch', description: 'Abiye clutch, zincir askili.', price: 799, salePrice: 599, categories: ['Ayakkabı & Çanta', 'Kadın'], tags: ['clutch'], stock: 40 },
    { name: 'Erkek Loafer Ayakkabi', description: 'Suet, toka detayli, lacivert.', price: 1499, salePrice: 1199, categories: ['Ayakkabı & Çanta', 'Erkek'], tags: ['loafer'], stock: 30 },
  ],
  'Saat & Aksesuar': [
    { name: 'Casio G-Shock GA-2100', description: 'Karbon koruma, 200m su dayanimi.', price: 3499, salePrice: 2999, categories: ['Saat & Aksesuar'], tags: ['casio'], stock: 30 },
    { name: 'Daniel Wellington Classic 40mm', description: 'Minimalist, deri kayis, rose gold.', price: 2999, salePrice: 2499, categories: ['Saat & Aksesuar'], tags: ['saat'], stock: 25 },
    { name: 'Ray-Ban Aviator Gunes Gozlugu', description: 'Pilot model, cam lens, altin cerceve.', price: 3299, salePrice: 2799, categories: ['Saat & Aksesuar'], tags: ['gozluk'], stock: 35 },
    { name: 'Gumus Zincir Kolye 925 Ayar', description: '60cm, 3mm, italyan gumus.', price: 899, salePrice: 699, categories: ['Saat & Aksesuar'], tags: ['kolye'], stock: 50 },
    { name: 'Deri Kemer Otomatik Toka', description: 'Hakiki deri, otomatik toka, siyah.', price: 599, salePrice: 449, categories: ['Saat & Aksesuar', 'Erkek'], tags: ['kemer'], stock: 60 },
    { name: 'Fossil Erkek Saat Chronograph', description: 'Paslanmaz celik, kronograf.', price: 4999, salePrice: 3999, categories: ['Saat & Aksesuar'], tags: ['fossil'], stock: 20 },
    { name: 'Ipek Esarp 90x90cm', description: '%100 ipek, dijital baski.', price: 1299, salePrice: 999, categories: ['Saat & Aksesuar', 'Kadın'], tags: ['esarp'], stock: 40 },
    { name: 'Erkek Cuzdan Hakiki Deri', description: 'RFID koruma, 8 kart bolmesi.', price: 799, salePrice: 599, categories: ['Saat & Aksesuar', 'Erkek'], tags: ['cuzdan'], stock: 55 },
    { name: 'Pandora Charm Bileklik', description: 'Gumus zincir, 3 charm dahil.', price: 2499, salePrice: 1999, categories: ['Saat & Aksesuar', 'Kadın'], tags: ['bileklik'], stock: 30 },
    { name: 'Sapka Fedora Yun', description: '%100 yun kece, klasik fedora.', price: 499, salePrice: 399, categories: ['Saat & Aksesuar'], tags: ['sapka'], stock: 35 },
  ],
  'Spor & Outdoor': [
    { name: 'Nike Air Max 270 React', description: 'Max Air yastiklama, mesh ust.', price: 3999, salePrice: 2999, categories: ['Spor & Outdoor'], tags: ['nike'], stock: 40 },
    { name: 'Adidas Ultraboost 23', description: 'Boost teknolojisi, Primeknit ust.', price: 4499, salePrice: 3499, categories: ['Spor & Outdoor'], tags: ['adidas'], stock: 35 },
    { name: 'Yoga Mati 6mm TPE', description: 'Kaymaz yuzey, tasima kayisli.', price: 599, salePrice: 449, categories: ['Spor & Outdoor'], tags: ['yoga'], stock: 70 },
    { name: '20kg Ayarlanabilir Dumbbell', description: 'Kaucuk kaplama, ergonomik.', price: 2499, salePrice: 1999, categories: ['Spor & Outdoor'], tags: ['dumbbell'], stock: 25 },
    { name: '4 Mevsim Kamp Cadiri 4 Kisilik', description: 'Su gecirmez, UV korumali.', price: 3999, salePrice: 2999, categories: ['Spor & Outdoor'], tags: ['cadir'], stock: 20 },
    { name: 'North Face Termal Mont', description: 'ThermoBall yalitim, DryVent.', price: 5999, salePrice: 4499, categories: ['Spor & Outdoor'], tags: ['mont'], stock: 30 },
    { name: 'Garmin Forerunner 265 GPS', description: 'AMOLED ekran, GPS, nabiz.', price: 12999, salePrice: 10999, categories: ['Spor & Outdoor'], tags: ['garmin'], stock: 15 },
    { name: 'Direnc Bandi Seti 5li', description: '5 farkli direnc, cantali set.', price: 299, salePrice: 199, categories: ['Spor & Outdoor'], tags: ['fitness'], stock: 100 },
    { name: 'Trekking Ayakkabi Gore-Tex', description: 'Su gecirmez, vibram taban.', price: 3499, salePrice: 2799, categories: ['Spor & Outdoor'], tags: ['trekking'], stock: 25 },
    { name: 'Bisiklet Kask Yetiskin', description: 'In-mold teknoloji, hafif.', price: 899, salePrice: 699, categories: ['Spor & Outdoor'], tags: ['bisiklet'], stock: 40 },
  ],
};

// ==================== KONUM VERILERI ====================
const LOCATIONS: Array<{ city: string; district: string; lat: number; lng: number }> = [
  { city: 'İstanbul', district: 'Kadıköy', lat: 40.9828, lng: 29.0290 },
  { city: 'İstanbul', district: 'Beşiktaş', lat: 41.0422, lng: 29.0070 },
  { city: 'İstanbul', district: 'Şişli', lat: 41.0602, lng: 28.9877 },
  { city: 'İstanbul', district: 'Bakırköy', lat: 40.9819, lng: 28.8772 },
  { city: 'İstanbul', district: 'Ataşehir', lat: 40.9923, lng: 29.1244 },
  { city: 'İstanbul', district: 'Üsküdar', lat: 41.0227, lng: 29.0155 },
  { city: 'İstanbul', district: 'Maltepe', lat: 40.9344, lng: 29.1302 },
  { city: 'İstanbul', district: 'Beylikdüzü', lat: 41.0027, lng: 28.6416 },
  { city: 'İstanbul', district: 'Başakşehir', lat: 41.0944, lng: 28.7944 },
  { city: 'İstanbul', district: 'Pendik', lat: 40.8760, lng: 29.2517 },
  { city: 'İstanbul', district: 'Sarıyer', lat: 41.1662, lng: 29.0490 },
  { city: 'İstanbul', district: 'Fatih', lat: 41.0186, lng: 28.9395 },
  { city: 'Ankara', district: 'Çankaya', lat: 39.9032, lng: 32.8597 },
  { city: 'Ankara', district: 'Yenimahalle', lat: 39.9681, lng: 32.8106 },
  { city: 'İzmir', district: 'Bornova', lat: 38.4667, lng: 27.2167 },
  { city: 'İzmir', district: 'Karşıyaka', lat: 38.4594, lng: 27.1094 },
  { city: 'Bursa', district: 'Nilüfer', lat: 40.2157, lng: 28.9544 },
  { city: 'Antalya', district: 'Muratpaşa', lat: 36.8841, lng: 30.7056 },
  { city: 'Antalya', district: 'Konyaaltı', lat: 36.8696, lng: 30.6350 },
  { city: 'Konya', district: 'Selçuklu', lat: 37.8868, lng: 32.4689 },
  { city: 'Gaziantep', district: 'Şehitkamil', lat: 37.0628, lng: 37.3806 },
  { city: 'Trabzon', district: 'Ortahisar', lat: 41.0027, lng: 39.7168 },
];

// ==================== YARDIMCI ====================

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function jitter(val: number, range: number): number {
  return val + (Math.random() - 0.5) * 2 * range;
}

let accessToken = '';
let refreshTokenStr = '';
let tokenExpiry = 0;

async function getAccessToken(): Promise<string> {
  // Token hala gecerliyse kullan (60 sn marjla)
  if (accessToken && Date.now() < tokenExpiry - 60000) return accessToken;
  console.log('\n[Token yenileniyor...]');

  // Ilk cagri: env'den al
  if (!refreshTokenStr) {
    refreshTokenStr = process.env.REFRESH_TOKEN || '';
    if (!refreshTokenStr) {
      throw new Error('REFRESH_TOKEN env degiskeni gerekli!\nKullanim: REFRESH_TOKEN="..." npx tsx src/seed-massive.ts');
    }
  }

  // Refresh token ile yeni access token al
  const res = await fetch(`${API}/auth/refresh-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: refreshTokenStr }),
  });

  if (!res.ok) {
    // Refresh token da expired olabilir, login dene
    const loginRes = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'zeynep.yilmaz@test.com', password: 'Test1234' }),
    });
    if (!loginRes.ok) throw new Error('Token yenileme ve login basarisiz');
    const loginData = await loginRes.json();
    const ld = loginData.data || loginData;
    accessToken = ld.tokens?.accessToken || ld.accessToken || '';
    refreshTokenStr = ld.tokens?.refreshToken || ld.refreshToken || refreshTokenStr;
    tokenExpiry = Date.now() + 720000; // 12 dk (token 15dk, 3dk marj)
    return accessToken;
  }

  const data = await res.json();
  const d = data.data || data;
  accessToken = d.tokens?.accessToken || d.accessToken || '';
  refreshTokenStr = d.tokens?.refreshToken || d.refreshToken || refreshTokenStr;
  tokenExpiry = Date.now() + 720000; // 12 dk (token 15dk, 3dk marj) (token 15 dk, 1 dk marj)
  return accessToken;
}

// ==================== ANA SEED ====================

async function main() {
  console.log('='.repeat(60));
  console.log('  KAPSAMLI SEED: 100 Magaza + 1000 Urun');
  console.log('='.repeat(60));

  await getAccessToken();
  console.log('Token alindi.\n');

  // Mevcut magazalari kontrol et
  let existingStores: any[] = [];
  try {
    const storesRes = await fetch(`${API}/stores/search?limit=500`);
    const storesData = await storesRes.json();
    existingStores = storesData.data || [];
  } catch { /* empty */ }
  const existingNames = new Set(existingStores.map((s: any) => s.name));
  console.log(`Mevcut magaza: ${existingStores.length}\n`);

  // ==================== MAGAZALAR ====================
  console.log('--- MAGAZALAR OLUSTURULUYOR ---');
  const createdStoreTokens: Map<string, string> = new Map(); // storeName -> ownerToken
  let storeCount = 0;

  for (let i = 0; i < STORE_TEMPLATES.length; i++) {
    const tmpl = STORE_TEMPLATES[i];
    if (existingNames.has(tmpl.name)) {
      process.stdout.write('.');
      continue;
    }

    const email = `store${i}_${Date.now()}@beacon.test`;
    const password = 'Store1234!';

    try {
      // 1) Kullanici olustur
      const regRes = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: tmpl.name.replace(/[^a-zA-Z0-9 ]/g, '').split(' ')[0] || 'Store',
          surname: 'Owner',
          email,
          password,
          role: 'store_owner',
        }),
      });

      if (!regRes.ok) { process.stdout.write('x'); continue; }

      const regData = await regRes.json();
      const d = regData.data || regData;
      const ownerToken = d.tokens?.accessToken || d.accessToken || '';
      if (!ownerToken) { process.stdout.write('x'); continue; }

      // 2) Magaza olustur
      const loc = randomPick(LOCATIONS);
      const storeRes = await fetch(`${API}/stores/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ownerToken}` },
        body: JSON.stringify({
          name: tmpl.name,
          description: tmpl.description,
          storeType: tmpl.storeType,
          categories: tmpl.categories,
          latitude: jitter(loc.lat, 0.015),
          longitude: jitter(loc.lng, 0.015),
          address: { city: loc.city, district: loc.district, street: `${tmpl.name} Cad. No:${Math.floor(Math.random() * 100) + 1}` },
          contactInfo: { phone: `+90 5${String(Math.floor(Math.random() * 100)).padStart(2, '0')} ${String(Math.floor(Math.random() * 10000000)).padStart(7, '0')}`, email },
          openingHours: [
            { days: 'Pazartesi-Cuma', hours: '09:00 - 18:00' },
            { days: 'Cumartesi', hours: '10:00 - 16:00' },
            { days: 'Pazar', hours: 'Kapali' },
          ],
        }),
      });

      if (storeRes.ok) {
        createdStoreTokens.set(tmpl.name, ownerToken);
        storeCount++;
        process.stdout.write('+');
      } else {
        process.stdout.write('x');
      }
    } catch {
      process.stdout.write('x');
    }
  }

  console.log(`\nYeni magaza: ${storeCount}\n`);

  // Tum magazalari getir
  let allStores: any[] = [];
  try {
    const allRes = await fetch(`${API}/stores/search?limit=500`);
    const allData = await allRes.json();
    allStores = allData.data || [];
  } catch { /* empty */ }
  console.log(`Toplam magaza: ${allStores.length}\n`);

  // ==================== URUNLER ====================
  console.log('--- URUNLER OLUSTURULUYOR ---');

  // Kategori -> magaza eslemesi
  const categoryToStores: Record<string, any[]> = {};
  for (const store of allStores) {
    const cats = store.categories || [];
    for (const cat of cats) {
      if (!categoryToStores[cat]) categoryToStores[cat] = [];
      categoryToStores[cat].push(store);
    }
  }

  let productCount = 0;
  const TARGET = 1000;

  // Tum kategorilerdeki sablonlari tekrarla
  const allTemplates: Array<{ tmpl: ProductTemplate; category: string }> = [];
  for (const [cat, templates] of Object.entries(PRODUCT_CATALOG)) {
    for (const tmpl of templates) {
      allTemplates.push({ tmpl, category: cat });
    }
  }

  while (productCount < TARGET) {
    for (const { tmpl, category } of allTemplates) {
      if (productCount >= TARGET) break;

      const stores = categoryToStores[category] || [];
      if (stores.length === 0) continue;

      const store = randomPick(stores);

      // Fiyat varyasyonu (%85-%115)
      const mult = 0.85 + Math.random() * 0.30;
      const price = Math.round(tmpl.price * mult);
      const salePrice = tmpl.salePrice ? Math.round(tmpl.salePrice * mult) : undefined;

      // Isim varyasyonu
      const suffixes = ['', '', '', ' - Yeni Sezon', ' (Orijinal)', ' - Premium', ' Ozel Seri'];
      const suffix = randomPick(suffixes);

      try {
        const currentToken = await getAccessToken();
        const prodRes = await fetch(`${API}/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentToken}` },
          body: JSON.stringify({
            name: tmpl.name + suffix,
            description: tmpl.description,
            price,
            salePrice: salePrice || undefined,
            categories: tmpl.categories,
            tags: tmpl.tags,
            thumbnail: `https://picsum.photos/seed/${tmpl.tags[0] || 'prod'}${productCount}/400/400`,
            stockQuantity: tmpl.stock + Math.floor(Math.random() * 50),
            storeId: store.id,
          }),
        });

        if (prodRes.ok) {
          productCount++;
          if (productCount % 50 === 0) {
            process.stdout.write(` [${productCount}/${TARGET}] `);
          } else {
            process.stdout.write('.');
          }
        } else {
          process.stdout.write('x');
        }
      } catch {
        process.stdout.write('x');
      }
    }
  }

  console.log(`\n\n${'='.repeat(60)}`);
  console.log('  SEED TAMAMLANDI!');
  console.log(`${'='.repeat(60)}`);
  console.log(`  Yeni magazalar:  ${storeCount}`);
  console.log(`  Yeni urunler:    ${productCount}`);
  console.log(`  Toplam magaza:   ${allStores.length}`);
  console.log(`${'='.repeat(60)}`);
}

main().catch(console.error);
