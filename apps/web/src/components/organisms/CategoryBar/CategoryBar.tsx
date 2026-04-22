import { useEffect, useState, useRef, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import WomanIcon from '@mui/icons-material/Woman';
import ManIcon from '@mui/icons-material/Man';
import ChildCareIcon from '@mui/icons-material/ChildCare';
import WeekendIcon from '@mui/icons-material/Weekend';
import LocalGroceryStoreIcon from '@mui/icons-material/LocalGroceryStore';
import SpaIcon from '@mui/icons-material/Spa';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import WatchIcon from '@mui/icons-material/Watch';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import BuildIcon from '@mui/icons-material/Build';
import PetsIcon from '@mui/icons-material/Pets';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import DevicesIcon from '@mui/icons-material/Devices';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import SchoolIcon from '@mui/icons-material/School';
import HomeRepairServiceIcon from '@mui/icons-material/HomeRepairService';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import apiClient from '@services/api/client';

const FALLBACK_CATEGORIES = [
  'Kadın', 'Erkek', 'Anne & Çocuk', 'Ev & Yaşam', 'Süpermarket',
  'Kozmetik', 'Ayakkabı & Çanta', 'Elektronik', 'Saat & Aksesuar',
  'Spor & Outdoor',
];

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  'Kadın': WomanIcon,
  'Erkek': ManIcon,
  'Anne & Çocuk': ChildCareIcon,
  'Ev & Yaşam': WeekendIcon,
  'Ev & Mobilya': WeekendIcon,
  'Süpermarket': LocalGroceryStoreIcon,
  'Kozmetik': SpaIcon,
  'Ayakkabı & Çanta': ShoppingBagIcon,
  'Elektronik': PhoneAndroidIcon,
  'Saat & Aksesuar': WatchIcon,
  'Spor & Outdoor': FitnessCenterIcon,
  'Kitap & Kırtasiye': MenuBookIcon,
  'Hediyelik': CardGiftcardIcon,
  'Moda & Giyim': ShoppingBagIcon,
  'Oyuncak & Hobi': CardGiftcardIcon,
  'Profesyonel Hizmetler': BuildIcon,
  'Evcil Hayvan': PetsIcon,
  'Pet Shop': PetsIcon,
  'Otomotiv': DirectionsCarIcon,
  'Sağlık': HealthAndSafetyIcon,
  'Teknoloji': DevicesIcon,
  'Temizlik & Bakım': CleaningServicesIcon,
  'Fotoğraf & Video': CameraAltIcon,
  'Eğitim': SchoolIcon,
  'Tadilat & Dekorasyon': HomeRepairServiceIcon,
};

// Subcategory groups per main category
interface SubGroup {
  title: string;
  items: string[];
}

const SUBCATEGORIES: Record<string, SubGroup[]> = {
  'Kadın': [
    { title: 'Giyim', items: ['Elbise', 'Tişört', 'Gömlek', 'Kot Pantolon', 'Kot Ceket', 'Trençkot', 'Bluz', 'Etek'] },
    { title: 'Aksesuar & Çanta', items: ['Çanta', 'Saat', 'Takı', 'Cüzdan', 'Atkı', 'Şal', 'Güneş Gözlüğü'] },
    { title: 'Kozmetik', items: ['Parfüm', 'Göz Makyajı', 'Cilt Bakım', 'Saç Bakımı', 'Makyaj', 'Oje'] },
    { title: 'Ayakkabı', items: ['Topuklu Ayakkabı', 'Sneaker', 'Günlük Ayakkabı', 'Babet', 'Sandalet', 'Çizme'] },
    { title: 'İç Giyim & Pijama', items: ['Pijama Takımı', 'Gecelik', 'Sütyen', 'İç Çamaşırı Takımları', 'Çorap'] },
    { title: 'Spor Giyim', items: ['Sweatshirt', 'Spor Tişört', 'Spor Sütyeni', 'Tayt', 'Eşofman'] },
    { title: 'Çanta Modelleri', items: ['Omuz Çantası', 'Sırt Çantası', 'El Çantası', 'Clutch', 'Plaj Çantası'] },
  ],
  'Erkek': [
    { title: 'Giyim', items: ['Tişört', 'Gömlek', 'Pantolon', 'Kot Pantolon', 'Ceket', 'Mont', 'Takım Elbise'] },
    { title: 'Ayakkabı', items: ['Sneaker', 'Klasik Ayakkabı', 'Bot', 'Günlük Ayakkabı', 'Sandalet', 'Loafer'] },
    { title: 'Aksesuar', items: ['Saat', 'Cüzdan', 'Kemer', 'Güneş Gözlüğü', 'Kravat', 'Papyon', 'Şapka'] },
    { title: 'Spor Giyim', items: ['Eşofman', 'Sweatshirt', 'Spor Tişört', 'Şort', 'Rüzgarlık'] },
    { title: 'İç Giyim', items: ['Boxer', 'Atlet', 'Pijama Takımı', 'Çorap', 'Termal İçlik'] },
  ],
  'Anne & Çocuk': [
    { title: 'Bebek Bakım', items: ['Bebek Bezi', 'Biberon', 'Mama Sandalyesi', 'Bebek Arabası', 'Bebek Banyosu', 'Emzik', 'Mama Önlüğü'] },
    { title: 'Çocuk Giyim', items: ['Tişört', 'Pantolon', 'Elbise', 'Mont', 'Pijama', 'Okul Kıyafeti'] },
    { title: 'Oyuncak & Eğitim', items: ['Eğitici Oyuncak', 'Peluş', 'Lego', 'Puzzle', 'Araba', 'Bebek', 'Slime'] },
    { title: 'Anne Ürünleri', items: ['Hamile Giyim', 'Emzirme Ürünleri', 'Anne Bakım', 'Süt Pompası', 'Hamile Yastığı'] },
    { title: 'Çocuk Güvenliği', items: ['Oto Koltuğu', 'Koruma Bariyeri', 'Bebek Telsizi', 'Çocuk Kilidi', 'Gece Lambası'] },
  ],
  'Ev & Yaşam': [
    { title: 'Mobilya', items: ['Koltuk', 'Yatak', 'Masa', 'Sandalye', 'Dolap', 'TV Ünitesi', 'Kitaplık'] },
    { title: 'Ev Tekstili', items: ['Nevresim', 'Yastık', 'Havlu', 'Perde', 'Halı', 'Battaniye', 'Örtü'] },
    { title: 'Mutfak Gereçleri', items: ['Tencere Seti', 'Bıçak Seti', 'Tabak', 'Bardak', 'Kahve Makinesi', 'Çaydanlık'] },
    { title: 'Dekorasyon', items: ['Tablo', 'Vazo', 'Mum', 'Ayna', 'Saat', 'Çiçek', 'Biblo'] },
    { title: 'Bahçe & Balkon', items: ['Saksı', 'Bahçe Mobilyası', 'Mangal', 'Aydınlatma', 'Çim Biçme Makinesi', 'Sulama'] },
    { title: 'Banyo', items: ['Banyo Dolabı', 'Duşakabin', 'Banyo Aksesuar', 'Çamaşır Sepeti', 'Banyo Paspası'] },
    { title: 'Aydınlatma', items: ['Avize', 'Abajur', 'LED Şerit', 'Spot Lamba', 'Gece Lambası'] },
  ],
  'Ev & Mobilya': [
    { title: 'Mobilya', items: ['Koltuk', 'Yatak', 'Masa', 'Sandalye', 'Dolap', 'TV Ünitesi', 'Kitaplık'] },
    { title: 'Ev Tekstili', items: ['Nevresim', 'Yastık', 'Havlu', 'Perde', 'Halı'] },
    { title: 'Mutfak', items: ['Tencere Seti', 'Bıçak Seti', 'Tabak', 'Bardak', 'Kahve Makinesi'] },
    { title: 'Dekorasyon', items: ['Tablo', 'Vazo', 'Mum', 'Ayna', 'Saat'] },
  ],
  'Süpermarket': [
    { title: 'Temel Gıda', items: ['Kahvaltılık', 'Makarna & Bakliyat', 'Pirinç', 'Un', 'Yağ', 'Şeker', 'Tuz'] },
    { title: 'Atıştırmalık', items: ['Çikolata', 'Bisküvi', 'Cips', 'Kuruyemiş', 'Kek', 'Gofret'] },
    { title: 'İçecek', items: ['Su', 'Meyve Suyu', 'Gazlı İçecek', 'Çay', 'Kahve', 'Süt', 'Ayran'] },
    { title: 'Temizlik', items: ['Deterjan', 'Yumuşatıcı', 'Bulaşık Deterjanı', 'Çamaşır Suyu', 'Islak Mendil', 'Çöp Poşeti'] },
    { title: 'Kişisel Bakım', items: ['Şampuan', 'Duş Jeli', 'Diş Macunu', 'Deodorant', 'Sabun', 'Tıraş Bıçağı'] },
    { title: 'Donmuş Gıda', items: ['Dondurma', 'Donmuş Sebze', 'Pizza', 'Nugget', 'Patates'] },
  ],
  'Kozmetik': [
    { title: 'Makyaj', items: ['Fondöten', 'Ruj', 'Rimel', 'Göz Farı', 'Allık', 'Kapatıcı', 'Pudra', 'Eyeliner'] },
    { title: 'Cilt Bakım', items: ['Nemlendirici', 'Temizleyici', 'Serum', 'Güneş Kremi', 'Maske', 'Tonik', 'Peeling'] },
    { title: 'Saç Bakım', items: ['Şampuan', 'Saç Kremi', 'Saç Boyası', 'Saç Spreyi', 'Saç Maskesi', 'Saç Fırçası'] },
    { title: 'Parfüm', items: ['Kadın Parfüm', 'Erkek Parfüm', 'Unisex Parfüm', 'Deodorant', 'Vücut Spreyi'] },
    { title: 'Güzellik Aletleri', items: ['Saç Düzleştirici', 'Saç Kurutma', 'Maşa', 'Epilatör', 'Yüz Temizleme Cihazı'] },
    { title: 'Tırnak Bakım', items: ['Oje', 'Protez Tırnak', 'Tırnak Bakım Seti', 'Kalıcı Oje', 'Tırnak Süsleme'] },
  ],
  'Ayakkabı & Çanta': [
    { title: 'Kadın Ayakkabı', items: ['Topuklu', 'Sneaker', 'Babet', 'Sandalet', 'Bot', 'Çizme', 'Terlik'] },
    { title: 'Erkek Ayakkabı', items: ['Sneaker', 'Klasik', 'Bot', 'Günlük', 'Spor', 'Loafer', 'Terlik'] },
    { title: 'Çocuk Ayakkabı', items: ['Spor Ayakkabı', 'Sandalet', 'Bot', 'Ev Ayakkabısı', 'Okul Ayakkabısı'] },
    { title: 'Çanta', items: ['Omuz Çantası', 'Sırt Çantası', 'El Çantası', 'Valiz', 'Bel Çantası', 'Laptop Çantası'] },
    { title: 'Cüzdan & Aksesuar', items: ['Cüzdan', 'Kartlık', 'Pasaportluk', 'Anahtarlık', 'Ayakkabı Bakım'] },
  ],
  'Elektronik': [
    { title: 'Telefon & Tablet', items: ['Akıllı Telefon', 'Tablet', 'Telefon Kılıfı', 'Şarj Aleti', 'Ekran Koruyucu', 'Powerbank'] },
    { title: 'Bilgisayar', items: ['Laptop', 'Masaüstü PC', 'Monitör', 'Klavye', 'Mouse', 'Webcam', 'SSD/HDD'] },
    { title: 'Ses & Görüntü', items: ['Kulaklık', 'Hoparlör', 'Televizyon', 'Soundbar', 'Projeksiyon', 'Mikrofon'] },
    { title: 'Akıllı Ev', items: ['Akıllı Saat', 'Robot Süpürge', 'Akıllı Ampul', 'Güvenlik Kamerası', 'Akıllı Priz', 'Akıllı Kilit'] },
    { title: 'Fotoğraf & Kamera', items: ['DSLR Kamera', 'Aksiyon Kamerası', 'Drone', 'Tripod', 'Kamera Çantası', 'Lens'] },
    { title: 'Oyun & Konsol', items: ['PlayStation', 'Xbox', 'Nintendo Switch', 'Oyun Kolları', 'Gaming Kulaklık', 'Gaming Mouse'] },
  ],
  'Saat & Aksesuar': [
    { title: 'Saat', items: ['Kadın Saat', 'Erkek Saat', 'Akıllı Saat', 'Çocuk Saat', 'Spor Saat', 'Lüks Saat'] },
    { title: 'Takı', items: ['Kolye', 'Bileklik', 'Küpe', 'Yüzük', 'Broş', 'Set Takı', 'Altın Takı'] },
    { title: 'Güneş Gözlüğü', items: ['Kadın Güneş Gözlüğü', 'Erkek Güneş Gözlüğü', 'Unisex', 'Polarize', 'Spor Gözlük'] },
    { title: 'Şapka & Bere', items: ['Kasket', 'Fötr Şapka', 'Bere', 'Bandana', 'Hasır Şapka'] },
  ],
  'Spor & Outdoor': [
    { title: 'Spor Giyim', items: ['Eşofman', 'Tişört', 'Tayt', 'Şort', 'Sweatshirt', 'Yağmurluk'] },
    { title: 'Spor Ayakkabı', items: ['Koşu Ayakkabısı', 'Fitness', 'Basketbol', 'Futbol Krampon', 'Yürüyüş Botu', 'Trekking'] },
    { title: 'Fitness & Egzersiz', items: ['Dumbbell', 'Yoga Matı', 'Direnç Bandı', 'Atlama İpi', 'Kettlebell', 'Pilates Topu'] },
    { title: 'Outdoor & Kamp', items: ['Çadır', 'Uyku Tulumu', 'Matara', 'Kamp Sandalyesi', 'El Feneri', 'Kamp Ocağı'] },
    { title: 'Bisiklet', items: ['Dağ Bisikleti', 'Şehir Bisikleti', 'Bisiklet Kaskı', 'Bisiklet Işığı', 'Bisiklet Kilidi'] },
    { title: 'Su Sporları', items: ['Yüzme Gözlüğü', 'Mayo', 'Şnorkel Seti', 'Sörf Tahtası', 'Dalış Ekipmanı'] },
  ],
  'Kitap & Kırtasiye': [
    { title: 'Kitap', items: ['Roman', 'Kişisel Gelişim', 'Çocuk Kitabı', 'Tarih', 'Bilim', 'Felsefe', 'Şiir'] },
    { title: 'Kırtasiye', items: ['Defter', 'Kalem', 'Silgi', 'Boya Seti', 'Okul Çantası', 'Kalem Kutusu'] },
    { title: 'Ofis Malzemeleri', items: ['Dosya', 'Hesap Makinesi', 'Zımba', 'Bant', 'Klasör', 'Etiket Yazıcı'] },
    { title: 'Hobi & Sanat', items: ['Resim Tuvali', 'Yağlı Boya', 'Sulu Boya', 'Çizim Defteri', 'Kaligrafi Seti'] },
  ],
  'Hediyelik': [
    { title: 'Hediye Fikirleri', items: ['Kişiye Özel', 'Doğum Günü', 'Sevgiliye', 'Anneler Günü', 'Babalar Günü', 'Yılbaşı'] },
    { title: 'Dekoratif Hediye', items: ['Anahtarlık', 'Kupa', 'Yastık', 'Çerçeve', 'Magnet', 'Biblo'] },
    { title: 'Çiçek & Gıda', items: ['Çiçek Buketi', 'Çikolata Kutusu', 'Meyve Sepeti', 'Hediye Kutusu', 'Balon'] },
    { title: 'Deneyim Hediyeleri', items: ['Hediye Çeki', 'Spa Paketi', 'Yemek Deneyimi', 'Macera Paketi', 'Konser Bileti'] },
  ],
  'Moda & Giyim': [
    { title: 'Kadın Giyim', items: ['Elbise', 'Bluz', 'Pantolon', 'Etek', 'Ceket', 'Trençkot', 'Hırka'] },
    { title: 'Erkek Giyim', items: ['Gömlek', 'Tişört', 'Pantolon', 'Ceket', 'Mont', 'Takım Elbise'] },
    { title: 'Çocuk Giyim', items: ['Kız Çocuk', 'Erkek Çocuk', 'Bebek Giyim', 'Okul Kıyafeti'] },
    { title: 'Spor Giyim', items: ['Eşofman', 'Spor Tişört', 'Tayt', 'Sweatshirt', 'Şort'] },
    { title: 'Tesettür', items: ['Eşarp', 'Ferace', 'Tunik', 'Tesettür Elbise', 'Bone'] },
  ],
  'Oyuncak & Hobi': [
    { title: 'Oyuncak', items: ['Eğitici Oyuncak', 'Peluş Oyuncak', 'Lego & Yapı', 'Puzzle', 'Araba & Araç', 'Bebek'] },
    { title: 'Hobi', items: ['Maket', 'Model Araba', 'Koleksiyon', 'El İşi Seti', 'Bulmaca'] },
    { title: 'Masa & Kart Oyunları', items: ['Satranç', 'Tavla', 'Monopoly', 'Risk', 'Kart Oyunları', 'Jenga'] },
    { title: 'Müzik Aletleri', items: ['Gitar', 'Piyano', 'Bateri', 'Keman', 'Ukulele', 'Bağlama'] },
    { title: 'Drone & RC', items: ['Drone', 'RC Araba', 'RC Helikopter', 'RC Tekne', 'Yedek Parça'] },
  ],
  // ─── Armut İlhamlı Hizmet Kategorileri ──────────────────────
  'Profesyonel Hizmetler': [
    { title: 'Temizlik', items: ['Ev Temizliği', 'Ofis Temizliği', 'Cam Temizliği', 'Halı Yıkama', 'Koltuk Yıkama', 'Derin Temizlik'] },
    { title: 'Tadilat & Tamirat', items: ['Boya Badana', 'Fayans Döşeme', 'Parke Döşeme', 'Alçı & Sıva', 'Duvar Kağıdı', 'Cam Balkon'] },
    { title: 'Tesisatçı & Elektrikçi', items: ['Su Tesisatı', 'Elektrik Tamiri', 'Doğalgaz Tesisatı', 'Kombi Servisi', 'Klima Montaj'] },
    { title: 'Nakliyat', items: ['Evden Eve Nakliyat', 'Ofis Taşıma', 'Eşya Depolama', 'Şehirlerarası Nakliye', 'Parça Eşya Taşıma'] },
    { title: 'Dijital Hizmetler', items: ['Web Tasarım', 'Grafik Tasarım', 'SEO', 'Sosyal Medya Yönetimi', 'Mobil Uygulama', 'Logo Tasarım'] },
    { title: 'Fotoğraf & Video', items: ['Düğün Fotoğrafçısı', 'Ürün Çekimi', 'Video Çekimi', 'Drone Çekimi', 'Tanıtım Filmi'] },
    { title: 'Eğitim & Özel Ders', items: ['Matematik', 'İngilizce', 'Fizik', 'Yazılım Kursu', 'Müzik Dersi', 'Direksiyon Dersi'] },
    { title: 'Sağlık & Güzellik', items: ['Diyetisyen', 'Psikolog', 'Fizyoterapist', 'Kuaför', 'Masaj', 'Personal Trainer'] },
    { title: 'Danışmanlık', items: ['Hukuk Danışmanlığı', 'Mali Müşavir', 'Sigorta Danışmanı', 'Gayrimenkul Danışmanı', 'İş Danışmanlığı'] },
  ],
  'Evcil Hayvan': [
    { title: 'Kedi', items: ['Kedi Maması', 'Kedi Kumu', 'Kedi Yatağı', 'Kedi Oyuncağı', 'Kedi Tırmalaması', 'Kedi Taşıma'] },
    { title: 'Köpek', items: ['Köpek Maması', 'Köpek Yatağı', 'Tasma & Kayış', 'Köpek Oyuncağı', 'Köpek Giysi', 'Köpek Kulübesi'] },
    { title: 'Kuş & Balık', items: ['Kuş Yemi', 'Kuş Kafesi', 'Akvaryum', 'Balık Yemi', 'Akvaryum Filtre', 'Akvaryum Bitki'] },
    { title: 'Bakım & Sağlık', items: ['Veteriner Ürünleri', 'Pire & Kene', 'Şampuan', 'Tırnak Makası', 'Diş Bakımı', 'Vitamin'] },
    { title: 'Pet Hizmetleri', items: ['Pet Kuaförü', 'Köpek Eğitimi', 'Pet Otel', 'Evde Bakım', 'Veteriner'] },
  ],
  'Pet Shop': [
    { title: 'Kedi', items: ['Kedi Maması', 'Kedi Kumu', 'Kedi Yatağı', 'Kedi Oyuncağı', 'Kedi Tırmalaması'] },
    { title: 'Köpek', items: ['Köpek Maması', 'Köpek Yatağı', 'Tasma & Kayış', 'Köpek Oyuncağı', 'Köpek Giysi'] },
    { title: 'Kuş & Balık', items: ['Kuş Yemi', 'Kuş Kafesi', 'Akvaryum', 'Balık Yemi', 'Akvaryum Filtre'] },
    { title: 'Bakım', items: ['Şampuan', 'Tırnak Makası', 'Fırça', 'Pire & Kene', 'Vitamin'] },
  ],
  'Otomotiv': [
    { title: 'Araç Bakım', items: ['Motor Yağı', 'Antifriz', 'Fren Hidroliği', 'Cam Suyu', 'Araba Parfümü', 'Pasta Cila'] },
    { title: 'Yedek Parça', items: ['Fren Balatası', 'Yağ Filtresi', 'Hava Filtresi', 'Bujiler', 'Akü', 'Silecek'] },
    { title: 'Aksesuar', items: ['Araç Kamerası', 'Telefon Tutucu', 'Oto Koltuk Kılıfı', 'Paspas', 'Bagaj Organizer'] },
    { title: 'Lastik & Jant', items: ['Yazlık Lastik', 'Kışlık Lastik', 'Alaşım Jant', 'Jant Kapağı', 'Lastik Tamiri'] },
    { title: 'Araç Temizlik', items: ['Oto Yıkama', 'Detaylı Temizlik', 'Oto Kuaför', 'Seramik Kaplama', 'PPF Kaplama'] },
    { title: 'Oto Servis', items: ['Oto Tamir', 'Boyasız Göçük', 'Cam Filmi', 'Ekspertiz', 'Klima Bakımı', 'Oto Elektrik'] },
  ],
  'Sağlık': [
    { title: 'Medikal Ürünler', items: ['Tansiyon Aleti', 'Şeker Ölçer', 'Ateş Ölçer', 'Oksimetre', 'Nebülizör'] },
    { title: 'Vitamin & Takviye', items: ['Multivitamin', 'D Vitamini', 'Omega-3', 'Protein Tozu', 'Probiyotik', 'Kolajen'] },
    { title: 'Kişisel Sağlık', items: ['Maske', 'Eldiven', 'Dezenfektan', 'Yara Bandı', 'İlk Yardım Çantası'] },
    { title: 'Ortopedik', items: ['Ortopedik Yastık', 'Bel Desteği', 'Diz Desteği', 'Bilek Bandajı', 'Boyunluk'] },
    { title: 'Sağlık Hizmetleri', items: ['Evde Hemşire', 'Fizyoterapist', 'Diyetisyen', 'Psikolog', 'Yaşlı Bakım'] },
  ],
  'Teknoloji': [
    { title: 'Bilgisayar & Yazılım', items: ['Laptop', 'Masaüstü PC', 'Yazılım Lisansı', 'Antivirus', 'Office Paketi'] },
    { title: 'Ağ & Bağlantı', items: ['Router', 'Modem', 'WiFi Extender', 'Switch', 'Ethernet Kablo'] },
    { title: 'Yazıcı & Tarayıcı', items: ['Lazer Yazıcı', 'Mürekkepli Yazıcı', 'Tarayıcı', 'Toner', 'Kartuş'] },
    { title: 'Depolama', items: ['SSD', 'HDD', 'USB Bellek', 'Hafıza Kartı', 'NAS', 'Harici Disk'] },
    { title: 'Akıllı Cihazlar', items: ['Akıllı Saat', 'Fitness Bilekliği', 'VR Gözlük', 'E-Kitap Okuyucu', 'Akıllı Gözlük'] },
  ],
  'Tadilat & Dekorasyon': [
    { title: 'İç Mekan Tadilat', items: ['Boya Badana', 'Alçıpan', 'Kartonpiyer', 'Asma Tavan', 'Duvar Kağıdı'] },
    { title: 'Zemin', items: ['Parke Döşeme', 'Laminat', 'Seramik', 'Fayans', 'Epoksi Zemin', 'Halıfleks'] },
    { title: 'Mutfak & Banyo', items: ['Mutfak Dolabı', 'Mutfak Tezgahı', 'Banyo Tadilat', 'Duşakabin', 'Küvet'] },
    { title: 'Kapı & Pencere', items: ['İç Kapı', 'Çelik Kapı', 'PVC Pencere', 'Cam Balkon', 'Pimapen', 'Sineklik'] },
    { title: 'Dış Cephe', items: ['Dış Cephe Boya', 'Mantolama', 'Çatı Tadilat', 'Çelik Konstrüksiyon'] },
    { title: 'Dekorasyon', items: ['İç Mimar', 'Ev Dekorasyon', 'Ofis Dekorasyon', 'Aydınlatma Tasarım', 'Peyzaj'] },
  ],
};

const VISIBLE_ITEMS_COUNT = 5;

export default function CategoryBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [categories, setCategories] = useState<string[]>(FALLBACK_CATEGORIES);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const megaMenuRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeCategory = searchParams.get('category') || '';

  useEffect(() => {
    apiClient.get('/products/categories').then((res) => {
      const data: string[] = res.data?.data || [];
      if (data.length > 0) setCategories(data.map((c: string) => c.replace(/\s+/g, ' ').trim()));
    }).catch(() => {});
  }, []);

  const handleCategoryClick = useCallback((cat: string) => {
    navigate(`/search?category=${encodeURIComponent(cat)}`);
    setMegaMenuOpen(false);
  }, [navigate]);

  const handleSubClick = useCallback((mainCat: string, sub: string) => {
    navigate(`/search?category=${encodeURIComponent(mainCat)}&q=${encodeURIComponent(sub)}`);
    setMegaMenuOpen(false);
  }, [navigate]);

  const handleMenuEnter = useCallback(() => {
    if (closeTimerRef.current) { clearTimeout(closeTimerRef.current); closeTimerRef.current = null; }
    setMegaMenuOpen(true);
  }, []);

  const handleMenuLeave = useCallback(() => {
    closeTimerRef.current = setTimeout(() => setMegaMenuOpen(false), 200);
  }, []);

  const flashRef = useRef<HTMLDivElement>(null);

  const toggleGroup = useCallback((key: string) => {
    setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const triggerFlash = useCallback(() => {
    const el = flashRef.current;
    if (!el) return;
    el.style.opacity = '1';
    requestAnimationFrame(() => {
      setTimeout(() => { el.style.opacity = '0'; }, 80);
    });
  }, []);

  // Hide on map page
  if (location.pathname === '/map') return null;

  const activeSubs = SUBCATEGORIES[hoveredCategory || categories[0]] || [];

  return (
    <>
      {/* Full-screen flash overlay */}
      <Box
        ref={flashRef}
        sx={{
          position: 'fixed',
          inset: 0,
          bgcolor: 'rgba(0,0,0,0.18)',
          zIndex: 9999,
          pointerEvents: 'none',
          opacity: 0,
          transition: 'opacity 0.15s ease-out',
        }}
      />
      <Box
        sx={{
          bgcolor: 'white',
          borderBottom: '1px solid',
          borderColor: 'divider',
          position: 'sticky',
          top: 64,
          zIndex: 1099,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            px: { xs: 1, md: 2 },
            height: 44,
            maxWidth: 1536,
            mx: 'auto',
          }}
        >
          {/* Kategoriler hamburger button */}
          <Box
            onMouseEnter={handleMenuEnter}
            onMouseLeave={handleMenuLeave}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              cursor: 'pointer',
              flexShrink: 0,
              mr: 1.5,
              px: 1,
              py: 0.5,
              borderRadius: 1,
              bgcolor: megaMenuOpen ? 'grey.100' : 'transparent',
              '&:hover': { bgcolor: 'grey.100' },
            }}
          >
            <MenuIcon sx={{ fontSize: 20, color: 'text.primary' }} />
            <Typography variant="body2" fontWeight={600} noWrap sx={{ color: 'text.primary' }}>
              Kategoriler
            </Typography>
            <Chip
              label="Yeni"
              size="small"
              sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: 'secondary.main', color: 'white', ml: 0.5 }}
            />
          </Box>

          {/* Horizontal scrollable categories */}
          <Box
            ref={scrollRef}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: { xs: 0.5, md: 1.5 },
              overflowX: 'auto',
              flexGrow: 1,
              scrollbarWidth: 'none',
              '&::-webkit-scrollbar': { display: 'none' },
              maskImage: 'linear-gradient(to right, transparent 0%, black 1%, black 95%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 1%, black 95%, transparent 100%)',
              pl: 0.5,
            }}
          >
            {categories.map((cat) => (
              <Typography
                key={cat}
                variant="body2"
                noWrap
                onClick={() => handleCategoryClick(cat)}
                sx={{
                  cursor: 'pointer',
                  flexShrink: 0,
                  px: 1,
                  py: 0.5,
                  fontSize: 13,
                  fontWeight: activeCategory === cat ? 700 : 500,
                  color: activeCategory === cat ? 'secondary.dark' : 'text.primary',
                  borderBottom: activeCategory === cat ? '2px solid' : '2px solid transparent',
                  borderColor: activeCategory === cat ? 'secondary.dark' : 'transparent',
                  transition: 'all 0.15s',
                  '&:hover': { color: 'secondary.dark' },
                }}
              >
                {cat}
              </Typography>
            ))}

            <Typography
              component="span"
              variant="body2"
              noWrap
              onClick={() => navigate('/search?sortBy=discount')}
              sx={{
                cursor: 'pointer', flexShrink: 0, px: 1, py: 0.5, fontSize: 13,
                fontWeight: 500, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 0.5,
                '&:hover': { color: 'secondary.dark' },
              }}
            >
              Flaş Ürünler
              <Chip label="Yeni" size="small" color="error" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700 }} />
            </Typography>

            <Typography
              component="span"
              variant="body2"
              noWrap
              onClick={() => navigate('/search?sortBy=popular')}
              sx={{
                cursor: 'pointer', flexShrink: 0, px: 1, py: 0.5, fontSize: 13,
                fontWeight: 500, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 0.5,
                '&:hover': { color: 'secondary.dark' },
              }}
            >
              Çok Satanlar
              <Chip label="Yeni" size="small" color="error" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700 }} />
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Mega Menu Dropdown */}
      {megaMenuOpen && (
        <Paper
          ref={megaMenuRef}
          elevation={8}
          onMouseEnter={handleMenuEnter}
          onMouseLeave={handleMenuLeave}
          sx={{
            position: 'fixed',
            top: 108,
            left: 0,
            right: 0,
            zIndex: 1300,
            display: 'flex',
            maxHeight: '50vh',
            borderRadius: 0,
            borderTop: '2px solid',
            borderColor: 'secondary.main',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          }}
        >
          {/* Left sidebar - main categories */}
          <Box
            sx={{
              width: 240,
              minWidth: 240,
              borderRight: '1px solid',
              borderColor: 'divider',
              overflowY: 'auto',
              bgcolor: '#fafafa',
              py: 1,
            }}
          >
            {categories.map((cat) => {
              const IconComp = CATEGORY_ICONS[cat] || ShoppingBagIcon;
              const isHovered = hoveredCategory === cat;
              return (
                <Box
                  key={cat}
                  onMouseEnter={() => { setHoveredCategory(cat); setExpandedGroups({}); triggerFlash(); }}
                  onClick={() => handleCategoryClick(cat)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    px: 2,
                    py: 1.2,
                    cursor: 'pointer',
                    bgcolor: isHovered ? 'white' : 'transparent',
                    borderLeft: isHovered ? '3px solid' : '3px solid transparent',
                    borderColor: isHovered ? 'secondary.main' : 'transparent',
                    color: isHovered ? 'secondary.dark' : 'text.primary',
                    transition: 'all 0.1s',
                    '&:hover': {
                      bgcolor: 'white',
                      borderLeftColor: 'secondary.main',
                      color: 'secondary.dark',
                    },
                  }}
                >
                  <IconComp sx={{ fontSize: 22, opacity: 0.8 }} />
                  <Typography
                    variant="body2"
                    fontWeight={isHovered ? 700 : 500}
                    fontSize={13}
                    sx={{ flexGrow: 1 }}
                    noWrap
                  >
                    {cat}
                  </Typography>
                  <ChevronRightIcon sx={{ fontSize: 18, opacity: 0.5 }} />
                </Box>
              );
            })}
          </Box>

          {/* Right content - subcategories */}
          <Box
            sx={{
              flexGrow: 1,
              p: 3,
              overflowY: 'auto',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 3,
              alignContent: 'start',
            }}
          >
            {activeSubs.map((group) => {
              const groupKey = `${hoveredCategory}-${group.title}`;
              const isExpanded = expandedGroups[groupKey];
              const visibleItems = isExpanded ? group.items : group.items.slice(0, VISIBLE_ITEMS_COUNT);
              const hasMore = group.items.length > VISIBLE_ITEMS_COUNT;

              return (
                <Box key={group.title}>
                  {/* Group title */}
                  <Typography
                    onClick={() => handleCategoryClick(hoveredCategory || categories[0])}
                    sx={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: 'secondary.dark',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.3,
                      mb: 1,
                      '&:hover': { textDecoration: 'underline' },
                    }}
                  >
                    {group.title}
                    <ChevronRightIcon sx={{ fontSize: 18 }} />
                  </Typography>

                  {/* Sub items */}
                  {visibleItems.map((item) => (
                    <Typography
                      key={item}
                      onClick={() => handleSubClick(hoveredCategory || categories[0], item)}
                      sx={{
                        fontSize: 13,
                        color: 'text.primary',
                        py: 0.4,
                        cursor: 'pointer',
                        '&:hover': { color: 'secondary.dark' },
                      }}
                    >
                      {item}
                    </Typography>
                  ))}

                  {/* Show more */}
                  {hasMore && (
                    <Typography
                      onClick={() => toggleGroup(groupKey)}
                      sx={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: 'text.primary',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.3,
                        mt: 0.5,
                        textDecoration: 'underline',
                        '&:hover': { color: 'secondary.dark' },
                      }}
                    >
                      {isExpanded ? 'Daha Az Gör' : 'Daha Fazla Gör'}
                      <ExpandMoreIcon sx={{ fontSize: 18, transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                    </Typography>
                  )}
                </Box>
              );
            })}

            {activeSubs.length === 0 && (
              <Box sx={{ gridColumn: '1 / -1', py: 4, textAlign: 'center' }}>
                <Typography color="text.secondary" fontSize={14}>
                  Bu kategoride alt kategori bulunmuyor
                </Typography>
              </Box>
            )}
          </Box>
        </Paper>
      )}

      {/* Backdrop */}
      {megaMenuOpen && (
        <Box
          onClick={() => setMegaMenuOpen(false)}
          sx={{
            position: 'fixed',
            top: 108,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(0,0,0,0.3)',
            zIndex: 1299,
          }}
        />
      )}
    </>
  );
}
