import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Rating from '@mui/material/Rating';
import IconButton from '@mui/material/IconButton';
import Skeleton from '@mui/material/Skeleton';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import LinearProgress from '@mui/material/LinearProgress';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteFilledIcon from '@mui/icons-material/Favorite';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import StorefrontIcon from '@mui/icons-material/Storefront';
import VerifiedIcon from '@mui/icons-material/Verified';
import HistoryIcon from '@mui/icons-material/History';
import GavelIcon from '@mui/icons-material/Gavel';
import TimerIcon from '@mui/icons-material/Timer';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SearchBar from '@components/molecules/SearchBar';
import { useNavigate } from 'react-router-dom';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { setUserLocation } from '@store/slices/mapSlice';
import { addItem } from '@store/slices/cartSlice';
import { toggleFavorite } from '@store/slices/favoriteSlice';
import apiClient from '@services/api/client';

import { getRecentSearches, saveRecentSearch } from '@utils/recent-searches';

interface StoreData {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo: string;
  coverImage: string;
  categories: string[];
  ratingAverage: number;
  ratingCount: number;
  isVerified: boolean;
  followersCount: number;
  productsCount: number;
}

interface ProductData {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  salePrice: number | null;
  currency: string;
  categories: string[];
  thumbnail: string;
  ratingAverage: number;
  ratingCount: number;
  store?: { id: string; name: string; slug: string; latitude: number; longitude: number };
  _dist?: number;
}

interface AuctionItem {
  id: string;
  productId: string;
  startingPrice: number;
  currentHighestBid: number | null;
  totalBids: number;
  quantity: number;
  category: string;
  endsAt: string;
  status: string;
  product: {
    id: string;
    name: string;
    slug: string;
    thumbnail: string;
    price: number;
    categories: string[];
  };
}

function useCountdown(endsAt: string | null) {
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    if (!endsAt) return;
    const tick = () => {
      const diff = new Date(endsAt).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft('Süre doldu'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h}sa ${m}dk ${s}sn`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [endsAt]);
  return timeLeft;
}

// Açık artırma geri sayım — başlama veya bitiş saatine göre
// Açık artırma saatleri: 12:00 - 24:00
// Açık artırma 23:00'da biter (endsAt API'den gelir)

function AuctionCountdownBadge({ endsAt, hasItems }: { endsAt: string | null; hasItems: boolean }) {
  const [label, setLabel] = useState('');
  const [isStartCountdown, setIsStartCountdown] = useState(false);

  useEffect(() => {
    const tick = () => {
      const now = new Date();

      const hour = now.getHours();
      const isAuctionTime = hour >= 12 && hour < 24; // 12:00 - 24:00 arası

      if (endsAt && hasItems && isAuctionTime) {
        // Açık artırma devam ediyor — bitiş geri sayımı
        const diff = new Date(endsAt).getTime() - now.getTime();
        if (diff > 0) {
          const h = Math.floor(diff / 3600000);
          const m = Math.floor((diff % 3600000) / 60000);
          const s = Math.floor((diff % 60000) / 1000);
          setLabel(`${h}sa ${m}dk ${s}sn`);
          setIsStartCountdown(false);
          return;
        }
      }

      // Süre doldu veya henüz başlamamış — sonraki 12:00'a geri sayım
      const nextStart = new Date(now);
      nextStart.setHours(12, 0, 0, 0);
      if (now.getTime() >= nextStart.getTime()) {
        nextStart.setDate(nextStart.getDate() + 1);
      }
      const diff = nextStart.getTime() - now.getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setLabel(`${h}sa ${m}dk ${s}sn`);
      setIsStartCountdown(true);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [endsAt, hasItems]);

  if (!label) return null;

  return (
    <Box sx={{
      display: 'inline-flex', alignItems: 'center', gap: 0.8,
      border: '1.5px solid', borderColor: isStartCountdown ? '#d4882e' : '#c0392b',
      borderRadius: '10px', px: 1.5, py: 0.4,
      bgcolor: isStartCountdown ? 'rgba(212,136,46,0.06)' : 'rgba(192,57,43,0.06)',
    }}>
      <TimerIcon sx={{ fontSize: 16, color: isStartCountdown ? '#d4882e' : '#c0392b' }} />
      <Box>
        <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary', lineHeight: 1, display: 'block' }}>
          {isStartCountdown ? 'Sonraki açık artırma 12:00' : 'Kalan süre'}
        </Typography>
        <Typography variant="body2" sx={{
          fontWeight: 800, fontSize: '0.85rem', lineHeight: 1.2,
          fontFamily: "'DM Sans', monospace",
          color: isStartCountdown ? '#d4882e' : '#c0392b',
          letterSpacing: '0.05em',
        }}>
          {label}
        </Typography>
      </Box>
    </Box>
  );
}

const CATEGORY_COLORS: Record<string, string> = {
  'Kadın': '#E91E63', 'Erkek': '#1565C0', 'Anne & Çocuk': '#EC407A',
  'Ev & Yaşam': '#8D6E63', 'Süpermarket': '#4CAF50', 'Kozmetik': '#00BCD4',
  'Ayakkabı & Çanta': '#FF7043', 'Elektronik': '#2196F3',
  'Saat & Aksesuar': '#FF9800', 'Spor & Outdoor': '#9C27B0',
};

export default function HomePage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const userLocation = useAppSelector((state) => state.map.userLocation);
  const [stores, setStores] = useState<StoreData[]>([]);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState('Ürün sepete eklendi!');
  const [snackSeverity, setSnackSeverity] = useState<'success' | 'error' | 'info'>('success');
  const [recentSearches, setRecentSearches] = useState<string[]>(getRecentSearches());
  const [activeSearch, setActiveSearch] = useState<string | null>(null);
  const [searchingStores, setSearchingStores] = useState(false);
  const [storesHeading, setStoresHeading] = useState('Yakınındaki Ürünler');
  const [searchedProducts, setSearchedProducts] = useState<ProductData[]>([]);
  const [defaultCarouselProducts, setDefaultCarouselProducts] = useState<ProductData[]>([]);
  const [auctionItems, setAuctionItems] = useState<AuctionItem[]>([]);
  const [auctionEndsAt, setAuctionEndsAt] = useState<string | null>(null);
  const [auctionLoading, setAuctionLoading] = useState(true);
  const [bidDialogOpen, setBidDialogOpen] = useState(false);
  const [selectedAuction, setSelectedAuction] = useState<AuctionItem | null>(null);
  const [bidPrice, setBidPrice] = useState('');
  const [bidQuantity, setBidQuantity] = useState(1);
  const [bidLoading, setBidLoading] = useState(false);
  const favoriteIds = useAppSelector((state) => state.favorites.ids);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  const auctionCountdown = useCountdown(auctionEndsAt);

  const [productsHeading] = useState('Popüler Ürünler');

  // Mesafe hesaplama yardımcısı
  const calcDistanceKm = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const [storesRes, productsRes] = await Promise.all([
          apiClient.get('/stores/search?limit=12'),
          apiClient.get('/products/search?sortBy=popular&limit=48&includeStore=true'),
        ]);
        setStores(storesRes.data?.data || storesRes.data || []);
        setProducts(productsRes.data?.data || productsRes.data || []);
      } catch (err) {
        console.log('API bağlantısı bekleniyor...', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();

    // Açık artırma verisi
    async function fetchAuction() {
      try {
        const res = await apiClient.get('/auction/today');
        setAuctionItems(res.data?.data || []);
        setAuctionEndsAt(res.data?.endsAt || null);
      } catch { /* auction henüz hazır değil */ }
      finally { setAuctionLoading(false); }
    }
    fetchAuction();

    // Konum alınırsa yakındaki mağazalarla güncelle + son aramalara göre ürün getir
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        dispatch(setUserLocation({ latitude, longitude }));
        try {
          const nearbyRes = await apiClient.get(`/stores/nearby?latitude=${latitude}&longitude=${longitude}&radius=50`);
          const nearbyStores = nearbyRes.data?.data || nearbyRes.data || [];
          if (nearbyStores.length > 0) {
            setStores(nearbyStores.slice(0, 12));
            // Son aramalara göre yakındaki mağazaların ürünlerini carousel için getir
            const recentForCarousel = getRecentSearches();
            if (recentForCarousel.length > 0) {
              try {
                const queries = recentForCarousel.slice(0, 5);
                const searchProms = queries.map(q =>
                  apiClient.get(`/products/search?q=${encodeURIComponent(q)}&limit=30&includeStore=true`)
                );
                const searchResults = await Promise.all(searchProms);

                // Her arama için ürünleri mesafeye göre sıralı hazırla
                const seenProdIds = new Set<string>();
                const buckets: ProductData[][] = searchResults.map(res => {
                  const items = res.data?.data || res.data || [];
                  const unique: ProductData[] = [];
                  for (const p of items) {
                    if (seenProdIds.has(p.id)) continue;
                    seenProdIds.add(p.id);
                    const sLat = p.store?.latitude;
                    const sLng = p.store?.longitude;
                    const dist = (sLat && sLng) ? calcDistanceKm(latitude, longitude, sLat, sLng) : 99999;
                    unique.push({ ...p, _dist: dist });
                  }
                  unique.sort((a, b) => (a._dist ?? 99999) - (b._dist ?? 99999));
                  return unique;
                });

                // Her aramadan 2 ürün, eksik kalanları en çok ürünü olandan dağıt
                const BASE_PER_QUERY = 2;
                const totalSlots = queries.length * BASE_PER_QUERY;
                const picked: ProductData[] = [];
                const usedPerBucket = buckets.map(() => 0);

                // İlk tur: her bucket'tan 2 ürün al
                for (let i = 0; i < buckets.length; i++) {
                  const take = Math.min(BASE_PER_QUERY, buckets[i].length);
                  for (let j = 0; j < take; j++) {
                    picked.push(buckets[i][j]);
                  }
                  usedPerBucket[i] = take;
                }

                // Kalan slotları en çok ürünü olan bucket'lardan dağıt
                let remaining = totalSlots - picked.length;
                while (remaining > 0) {
                  // En çok kalan ürünü olan bucket'ı bul
                  let bestIdx = -1;
                  let bestAvail = 0;
                  for (let i = 0; i < buckets.length; i++) {
                    const avail = buckets[i].length - usedPerBucket[i];
                    if (avail > bestAvail) { bestAvail = avail; bestIdx = i; }
                  }
                  if (bestIdx === -1 || bestAvail === 0) break;
                  picked.push(buckets[bestIdx][usedPerBucket[bestIdx]]);
                  usedPerBucket[bestIdx]++;
                  remaining--;
                }

                if (picked.length > 0) {
                  setDefaultCarouselProducts(picked);
                  setStoresHeading('Son Aramalarınız · Yakınınızdaki Ürünler');
                }
              } catch { /* carousel ürünleri yüklenemedi */ }
            }
          }
        } catch { /* konum bazlı arama başarısız, mevcut liste kalır */ }

      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  const handleSearch = (query: string) => {
    saveRecentSearch(query);
    setRecentSearches(getRecentSearches());
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleRecentSearchClick = async (query: string) => {
    if (searchingStores) return;
    setActiveSearch(query);
    setSearchingStores(true);
    setStoresHeading(`"${query}" Sonuçları`);
    try {
      const productsRes = await apiClient.get(`/products/search?q=${encodeURIComponent(query)}&limit=20`);
      const results = productsRes.data?.data || productsRes.data || [];
      setSearchedProducts(results);
    } catch {
      setSearchedProducts([]);
    } finally {
      setSearchingStores(false);
    }
  };

  const handleOpenBid = (item: AuctionItem) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setSelectedAuction(item);
    setBidPrice(String(Math.round(Number(item.currentHighestBid || item.startingPrice) * 1.05)));
    setBidQuantity(1);
    setBidDialogOpen(true);
  };

  const handlePlaceBid = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!selectedAuction || !bidPrice) return;
    setBidLoading(true);
    try {
      await apiClient.post('/auction/bid', {
        auctionItemId: selectedAuction.id,
        bidPrice: Number(bidPrice),
        bidQuantity,
      });
      setSnackMsg('Teklifiniz başarıyla gönderildi!');
      setSnackSeverity('success');
      setSnackOpen(true);
      setBidDialogOpen(false);
      // Listeyi güncelle
      const res = await apiClient.get('/auction/today');
      setAuctionItems(res.data?.data || []);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Teklif gönderilemedi. Giriş yapmanız gerekebilir.';
      setSnackMsg(msg);
      setSnackSeverity('error');
      setSnackOpen(true);
      setBidDialogOpen(false);
    } finally {
      setBidLoading(false);
    }
  };

  const handleLocationClick = () => {
    navigator.geolocation.getCurrentPosition((pos) => {
      dispatch(
        setUserLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }),
      );
      navigate('/map');
    });
  };

  const heroRef = useRef<HTMLDivElement>(null);

  // 150 benzersiz görsel — her biri farklı Unsplash fotoğrafı
  // Ürün görselleri — popüler, net Unsplash fotoğrafları
  const FLOATING_ITEMS = [
    // Ürünler (70 adet)
    '1523275335684-37898b6baf30', // saat
    '1505740420928-5e560c06d30e', // kulaklık
    '1526170375885-4d8ecf77b99f', // kamera
    '1572635196237-14b3f281503f', // gözlük
    '1560343090-f0409e92791a',    // ayakkabı
    '1585386959984-a4155224a1ad', // parfüm
    '1491553895911-0055eca6402d', // sneaker
    '1542291026-7eec264c27ff',    // kırmızı ayakkabı
    '1548036328-c9fa89d128fa',    // sırt çantası
    '1524678606370-a47ad25cb82a', // beyaz kulaklık
    '1579586337278-3befd40fd17a', // akıllı saat
    '1553062407-98eeb64c6a62',    // deri çanta
    '1600185365926-3a2ce3cdb9eb', // sneaker beyaz
    '1556906781-9a412961c28c',    // spor ayakkabı
    '1586495777744-4413f21062fa', // airpods
    '1564466809058-bf4114d55352', // cüzdan
    '1618354691373-d851c5c3a990', // nike ayakkabı
    '1606107557195-0e29a4b5b4aa', // koşu ayakkabısı
    '1544947950-fa07a98d237f',    // kitap
    '1496181133206-80ce9b88a853', // laptop
    '1593642632559-0c6d3fc62b89', // gamepad
    '1550009158-9ebf69173e03',    // elektronik
    '1581235720704-06d3acfcb36f', // araba oyuncak
    '1545127398-14699f92334b',    // tencere
    '1616486338812-3dadae4b4ace', // masa lambası
    '1555982105-d25af4182e4e',    // mum
    '1596462502278-27bfdc403348', // makyaj
    '1518611012118-696072aa579a', // yoga matı
    '1571019613454-1cb2f99b2d8b', // dumbbell
    '1511499767150-a48a237f0083', // güneş gözlüğü
    '1560769629-975ec94e6a86',    // renkli ayakkabı
    '1517336714731-489689fd1ca8', // macbook
    '1558171813-4c088753af8f',    // gitar
    '1560472355-536de3962603',    // elbise
    '1543076447-215ad9ba6923',    // gömlek
    '1591047139829-d91aecb6caea', // ceket
    '1618932260643-eee4a2f652a6', // iphone
    '1519861531473-9200262188bf', // basketbol topu
    '1509281373149-e957c6296406', // çiçek
    '1607082350899-7e105aa886ae', // hediye kutusu
    '1583394838336-acd977736f90', // kulaklık siyah
    '1598532163257-ae3c6b2524b6', // bilezik
    '1612817288484-6f916006741a', // kozmetik set
    '1631729371254-42c2892f0e6e', // ruj
    '1602143407151-7111542de6e8', // su şişesi
    '1516035069371-29a1b244cc32', // kahve fincanı
    '1588872657578-7efd1f1555ed', // tişört
    '1585559604959-6388fe69c92a', // lego
    '1585366119957-e9730b6d0f60', // termos
    '1571781926291-c477ebfd024b', // oje
    '1526947425960-945c6e72858f', // mouse
    '1587829741301-dc798b83add3', // tv
    '1585771724684-38269d6639fd', // peluş
    '1601049541289-9b1b7bbbfe19', // altın kolye
    '1557804506-669a67965ba0',    // koltuk
    '1555041469-a586c61ea9bc',    // kanepe
    '1563170351-be82bc888aa4',    // robot süpürge
    '1574169208507-84376144848b', // kedi mama
    '1562157873-818bc0726f68',    // tişört askı
    '1584917865442-de89df76afd3', // yastık
    '1533090161767-e6ffed986c88', // çanta
    '1611930022073-b7a4ba5fcccd', // cilt bakım
    '1625772452859-1c03d5bf1137', // telefon
    '1556742049-0cfed4f6a45d',    // alışveriş poşeti
    '1606925797300-0b35e9d1794e', // boya
    '1611078489935-0cb964de46d6', // makyaj paleti
    '1513475382585-d06e58bcb0e0', // çay
    '1588508065123-287b28e013da', // monitör
    '1586023492125-27b2c045efd7', // sandalye
    '1566576912321-d58ddd7a6088', // kadın çanta
    // Üreticiler / İşçiler (30 adet — üreten, taşıyan, el emeği)
    '1605000797499-95a51c5269ae', // el sanatı yapan
    '1586528116311-ad8dd3c8310d', // kargo kutusu taşıyan
    '1581092160607-ee22621dd758', // fabrika işçisi
    '1587925358603-c2eea5305bbc', // tarlada çiftçi
    '1500937386664-56d1dfef3854', // hamur yoğuran fırıncı
    '1556911220-bff31c812dba',    // yemek hazırlayan aşçı
    '1595246135406-803418233494', // ahşap işleyen marangoz
    '1621905252507-b35492cc74b4', // kumaş kesen terzi
    '1589939705384-5185137a7f0f', // seramik şekillendiren
    '1537368910025-700350fe46c7', // çömlekçi tezgahta
    '1542838132-92c53300491e',    // kaynak yapan işçi
    '1603575448878-868a20723f5d', // depo rafları düzenleyen
    '1559234938-b60fff04894d',    // pasta süsleyen
    '1577219491135-ce391730fb2c', // mutfakta pişiren
    '1473621038790-b778b4750efe', // dokuma tezgahında çalışan
    '1556760544-74068565f05c',    // motor tamir eden
    '1541167760496-1628856ab772', // paket teslim eden kurye
    '1580618672591-eb180b1a973f', // çiçek düzenleyen
    '1530268729831-4b0b9e170218', // arıcı bal toplayan
    '1579154204601-01588f351e67', // toprak eken bahçıvan
    '1604881991720-f91add269bed', // tahta rendeleme
    '1592621385612-4d7129426394', // inşaatta çalışan
    '1556745753-b2904692b3cd',    // et kesen kasap
    '1504328345606-18bbc8c9d7d1', // fabrikada üretim hattı işçisi
    '1464226184884-fa280b87c399', // tarlada buğday biçen çiftçi
    '1581578731548-c64695cc6952', // duvar boyayan
    '1602928298849-325cec8771c0', // ağ atan balıkçı
    '1512621776951-a57141f2eefd',  // hasat toplayan
    '1558642452-9d2a7deb7f62',    // metal işleyen demirci
    '1500595046743-cd271d694d30', // serada çalışan çiftçi
  ].map(id => `https://images.unsplash.com/photo-${id}?w=200&h=200&fit=crop&q=70`);

  // Sütun başına görsel sayısı ve görsel havuzu
  const COL_COUNT = 8;
  // Her sütuna farklı görseller ata
  const perCol = Math.ceil(FLOATING_ITEMS.length / COL_COUNT);
  const imageCols = Array.from({ length: COL_COUNT }, (_, c) =>
    FLOATING_ITEMS.slice(c * perCol, (c + 1) * perCol),
  );

  // Her karedeki görseli periyodik olarak değiştir
  const [swapTick, setSwapTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setSwapTick(t => t + 1), 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box>
      {/* Hero */}
      <Box
        ref={heroRef}
        sx={{
          textAlign: 'center',
          py: { xs: 4, md: 6 },
          background: 'linear-gradient(135deg, #1a6b52 0%, #1d7a5c 40%, #d4882e 100%)',
          borderRadius: 0,
          mb: 4,
          px: 2,
          // Container padding'ini aşarak tam ekran genişliğine uzat
          ml: 'calc(-50vw + 50%)',
          mr: 'calc(-50vw + 50%)',
          width: '100vw',
          position: 'relative',
          overflow: 'visible',
          minHeight: { xs: 213, md: 280 },
        }}
      >
        {/* Sabit sütun grid — dikey kayma + küp dönüşü + görsel değişimi */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            pointerEvents: 'none',
            overflow: 'hidden',
            display: 'flex',
            gap: '8px',
          }}
        >
          {imageCols.map((colItems, colIdx) => {
            const isUp = colIdx % 2 === 0;
            const duration = 40 + (colIdx % COL_COUNT) * 6; // daha yavaş
            return (
              <Box
                key={colIdx}
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  height: 'max-content',
                  animation: `heroSlideY${isUp ? 'Up' : 'Down'} ${duration}s linear infinite`,
                  '@keyframes heroSlideYUp': {
                    '0%': { transform: 'translateY(0)' },
                    '100%': { transform: 'translateY(-50%)' },
                  },
                  '@keyframes heroSlideYDown': {
                    '0%': { transform: 'translateY(-50%)' },
                    '100%': { transform: 'translateY(0)' },
                  },
                }}
              >
                {/* Dikey döngü için 2x tekrar — ilk ve ikinci yarı aynı sıra */}
                {[...colItems, ...colItems].map((_, i) => {
                  const pool = colItems;
                  const localIdx = i % pool.length;
                  const srcIdx = (localIdx + swapTick + colIdx * 3) % pool.length;
                  const src = pool[srcIdx];
                  const cubeDur = 6 + ((colIdx * 3 + i * 7) % 8);
                  const cubeDelay = ((colIdx * 5 + i * 3) % 10) * -1;
                  const axis = (colIdx + i) % 3;
                  const animName = `heroCube${axis}`;
                  return (
                    <Box
                      key={`${colIdx}-${i}`}
                      sx={{
                        width: '100%',
                        aspectRatio: '1',
                        flexShrink: 0,
                        perspective: '600px',
                      }}
                    >
                      <Box
                        sx={{
                          width: '100%',
                          height: '100%',
                          borderRadius: '10px',
                          overflow: 'hidden',
                          opacity: 0.3,
                          border: '2px solid rgba(255,255,255,0.35)',
                          boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
                          animation: `${animName} ${cubeDur}s ease-in-out ${cubeDelay}s infinite`,
                          transformStyle: 'preserve-3d',
                          transition: 'background-image 0.8s ease',
                          '@keyframes heroCube0': {
                            '0%, 100%': { transform: 'rotateX(0deg) rotateY(0deg)' },
                            '25%': { transform: 'rotateX(8deg) rotateY(12deg)' },
                            '50%': { transform: 'rotateX(-6deg) rotateY(-10deg)' },
                            '75%': { transform: 'rotateX(10deg) rotateY(-8deg)' },
                          },
                          '@keyframes heroCube1': {
                            '0%, 100%': { transform: 'rotateY(0deg) rotateX(0deg)' },
                            '25%': { transform: 'rotateY(-12deg) rotateX(6deg)' },
                            '50%': { transform: 'rotateY(10deg) rotateX(-8deg)' },
                            '75%': { transform: 'rotateY(-8deg) rotateX(10deg)' },
                          },
                          '@keyframes heroCube2': {
                            '0%, 100%': { transform: 'rotateX(0deg) rotateY(0deg) rotateZ(0deg)' },
                            '25%': { transform: 'rotateX(10deg) rotateY(8deg) rotateZ(3deg)' },
                            '50%': { transform: 'rotateX(-8deg) rotateY(-12deg) rotateZ(-2deg)' },
                            '75%': { transform: 'rotateX(6deg) rotateY(10deg) rotateZ(4deg)' },
                          },
                        }}
                      >
                        <img
                          src={src}
                          alt=""
                          loading="lazy"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transition: 'opacity 0.6s ease',
                          }}
                        />
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            );
          })}
        </Box>

        {/* Content (above floating items) */}
        <Box sx={{ position: 'relative', zIndex: 10 }}>
          <Typography
            variant="h3"
            sx={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontWeight: 800,
              color: '#fff',
              textShadow: '0 2px 12px rgba(0,0,0,0.2)',
              letterSpacing: '-0.02em',
              mb: 1,
            }}
          >
            Ürünleri Keşfet
          </Typography>
          <Typography
            variant="h6"
            mb={4}
            sx={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 500,
              color: 'rgba(255,255,255,0.9)',
              textShadow: '0 1px 4px rgba(0,0,0,0.15)',
              letterSpacing: '0.01em',
            }}
          >
            Üreticiden tüketiciye, aradığın her şey bir adım uzağında
          </Typography>
          <Box maxWidth={600} mx="auto">
            <SearchBar onSearch={handleSearch} onLocationClick={handleLocationClick} placeholder="Ne aramıştınız?" />
          </Box>
        </Box>
      </Box>

      {/* Mağazalar */}
      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 2 }}>
        <Box sx={{ bgcolor: '#1a6b52', color: '#fff', px: 2, py: 0.5, borderRadius: '6px 14px 14px 6px', display: 'inline-block' }}>
          <Typography variant="subtitle1" fontWeight={700}>{storesHeading}</Typography>
        </Box>
        {searchingStores && <CircularProgress size={20} sx={{ ml: 1 }} />}
        {activeSearch && (
          <Chip
            label="Tümünü Göster"
            size="small"
            variant="outlined"
            onClick={async () => {
              setActiveSearch(null);
              setSearchedProducts([]);
              setStoresHeading(defaultCarouselProducts.length > 0 ? 'Son Aramalarınız · Yakınınızdaki Ürünler' : 'Yakınındaki Mağazalar');
              setSearchingStores(true);
              try {
                const lat = userLocation?.latitude;
                const lng = userLocation?.longitude;
                if (lat && lng) {
                  const res = await apiClient.get(`/stores/nearby?latitude=${lat}&longitude=${lng}&radius=50`);
                  const data = res.data?.data || res.data || [];
                  setStores(data.length > 0 ? data.slice(0, 12) : []);
                  if (data.length === 0) {
                    const fallback = await apiClient.get('/stores/search?limit=12');
                    setStores(fallback.data?.data || fallback.data || []);
                  }
                } else {
                  const res = await apiClient.get('/stores/search?limit=12');
                  setStores(res.data?.data || res.data || []);
                }
              } catch {
                try {
                  const res = await apiClient.get('/stores/search?limit=12');
                  setStores(res.data?.data || res.data || []);
                } catch { /* ignore */ }
              } finally {
                setSearchingStores(false);
              }
            }}
            sx={{ fontSize: '0.7rem', cursor: 'pointer' }}
          />
        )}
      </Box>
      {recentSearches.length > 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
          <HistoryIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
          <Typography variant="caption" color="text.secondary" fontWeight={600}>Son aramalar:</Typography>
          {recentSearches.map((term) => (
            <Chip
              key={term}
              label={term}
              size="small"
              variant={activeSearch === term ? 'filled' : 'outlined'}
              color={activeSearch === term ? 'primary' : 'default'}
              onClick={() => handleRecentSearchClick(term)}
              sx={{
                fontSize: '0.72rem',
                cursor: 'pointer',
                '&:hover': { bgcolor: activeSearch === term ? undefined : 'rgba(0,153,204,0.08)', borderColor: '#0099cc' },
              }}
            />
          ))}
        </Box>
      )}
      {!loading && !searchingStores && searchedProducts.length === 0 && activeSearch && (
        <Box sx={{ textAlign: 'center', py: 3, mb: 3 }}>
          <Typography variant="body2" color="text.secondary">
            "{activeSearch}" için sonuç bulunamadı.
          </Typography>
        </Box>
      )}
      <Box
        sx={{
          mb: 5,
          overflow: 'hidden',
          position: 'relative',
          display: (!loading && !searchingStores && activeSearch && searchedProducts.length === 0) ? 'none' : ((!loading && !activeSearch && defaultCarouselProducts.length === 0 && stores.length === 0) ? 'none' : 'block'),
          '&::before, &::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            bottom: 0,
            width: 40,
            zIndex: 1,
            pointerEvents: 'none',
          },
          '&::before': { left: 0, background: 'linear-gradient(to right, #f8fafc, transparent)' },
          '&::after': { right: 0, background: 'linear-gradient(to left, #f8fafc, transparent)' },
          '@keyframes scrollStores': {
            '0%': { transform: 'translateX(0)' },
            '100%': { transform: 'translateX(-50%)' },
          },
        }}
      >
        <Box
          key={activeSearch || 'default'}
          sx={{
            display: 'flex',
            gap: 2,
            animation: (activeSearch ? searchedProducts.length : (defaultCarouselProducts.length || stores.length)) > 3 ? 'scrollStores 30s linear infinite' : 'none',
            width: 'max-content',
            '&:hover': { animationPlayState: 'paused' },
          }}
        >
          {(loading || searchingStores)
            ? Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} variant="rounded" width={180} height={260} sx={{ flexShrink: 0, borderRadius: 2 }} />
              ))
            : (() => {
                const displayProducts = activeSearch ? searchedProducts : defaultCarouselProducts;
                if (displayProducts.length > 0) {
                  return (displayProducts.length > 3 ? [...displayProducts.slice(0, 12), ...displayProducts.slice(0, 12)] : displayProducts.slice(0, 12)).map((product, pIdx) => {
                  const hasDiscount = product.salePrice && product.salePrice < product.price;
                  return (
                    <Card
                      key={`${product.id}-${pIdx}`}
                      sx={{
                        flexShrink: 0,
                        width: 180,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': { transform: 'translateY(-3px)', boxShadow: 3 },
                      }}
                      onClick={() => navigate(`/product/${product.slug}`)}
                    >
                      <Box sx={{ position: 'relative', paddingTop: '100%', overflow: 'hidden' }}>
                        <CardMedia
                          component="img"
                          image={product.thumbnail || 'https://via.placeholder.com/300x300'}
                          alt={product.name}
                          sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        {hasDiscount && (
                          <Chip
                            label={`%${Math.round(((product.price - product.salePrice!) / product.price) * 100)}`}
                            color="error"
                            size="small"
                            sx={{ position: 'absolute', top: 4, right: 4, height: 20, fontSize: '0.65rem' }}
                          />
                        )}
                      </Box>
                      <CardContent sx={{ p: 1, pb: 0.5, '&:last-child': { pb: 0.5 } }}>
                        <Typography variant="body2" fontWeight={600} noWrap sx={{ fontSize: '0.75rem' }}>
                          {product.name}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={0.3} mt={0.3}>
                          <Rating value={product.ratingAverage} precision={0.5} size="small" readOnly sx={{ fontSize: '0.75rem' }} />
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                            ({product.ratingCount})
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="baseline" gap={0.5} mt={0.3}>
                          <Typography variant="body2" color="primary" fontWeight={700} sx={{ fontSize: '0.85rem' }}>
                            {(hasDiscount ? product.salePrice : product.price)?.toLocaleString('tr-TR')} ₺
                          </Typography>
                          {hasDiscount && (
                            <Typography variant="caption" color="text.secondary" sx={{ textDecoration: 'line-through', fontSize: '0.6rem' }}>
                              {product.price.toLocaleString('tr-TR')} ₺
                            </Typography>
                          )}
                        </Box>
                        {product._dist != null && product._dist < 99999 && (
                          <Typography variant="caption" color="success.main" sx={{ fontSize: '0.55rem', display: 'block', mt: 0.2 }}>
                            📍 {product._dist < 1 ? `${Math.round(product._dist * 1000)} m` : `${product._dist.toFixed(1)} km`}
                            {product.store?.name && ` · ${product.store.name}`}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  );
                });
                }
                // Fallback: yakındaki mağazaların ürünleri henüz yüklenmediyse, mağaza kartları göster
                return (stores.length > 3 ? [...stores.slice(0, 10), ...stores.slice(0, 10)] : stores.slice(0, 10)).map((store, sIdx) => {
                const STORE_IMAGES: Record<string, string> = {
                  'Elektronik': 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=300&h=300&fit=crop',
                  'Oyuncak & Hobi': 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=300&h=300&fit=crop',
                  'Anne & Çocuk': 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=300&h=300&fit=crop',
                  'Eğitici': 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=300&h=300&fit=crop',
                  'Kitap & Kırtasiye': 'https://images.unsplash.com/photo-1524578271613-d550eacf6090?w=300&h=300&fit=crop',
                  'Kozmetik': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300&h=300&fit=crop',
                  'Moda & Giyim': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&h=300&fit=crop',
                  'Ev & Yaşam': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300&h=300&fit=crop',
                  'Spor & Outdoor': 'https://images.unsplash.com/photo-1461896836934-bd45ba7a7e4b?w=300&h=300&fit=crop',
                  'Hediyelik': 'https://images.unsplash.com/photo-1549465220-1a8b9238f168?w=300&h=300&fit=crop',
                  'Saat & Aksesuar': 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=300&h=300&fit=crop',
                  'Süpermarket': 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=300&h=300&fit=crop',
                };
                const FALLBACK_IMAGES = [
                  'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=300&h=300&fit=crop',
                  'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=300&h=300&fit=crop',
                  'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=300&h=300&fit=crop',
                  'https://images.unsplash.com/photo-1528698827591-e19cef791f48?w=300&h=300&fit=crop',
                  'https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?w=300&h=300&fit=crop',
                  'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=300&h=300&fit=crop',
                ];
                const catImg = store.categories?.length
                  ? (STORE_IMAGES[store.categories[0]] || STORE_IMAGES[store.categories[1]])
                  : null;
                const storeImg = catImg || FALLBACK_IMAGES[sIdx % FALLBACK_IMAGES.length];
                return (
                  <Card
                    key={`${store.id}-${sIdx}`}
                    sx={{
                      display: 'flex',
                      flexShrink: 0,
                      width: 320,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 },
                    }}
                    onClick={() => navigate(`/store/${store.slug}`)}
                  >
                    <CardMedia
                      component="img"
                      sx={{ width: 100, objectFit: 'cover' }}
                      image={storeImg}
                      alt={store.name}
                    />
                    <CardContent sx={{ flex: 1, py: 1.5 }}>
                      <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                        <Avatar src={store.logo} sx={{ width: 28, height: 28 }}>
                          <StorefrontIcon fontSize="small" />
                        </Avatar>
                        <Typography variant="subtitle2" fontWeight={600} noWrap>
                          {store.name}
                        </Typography>
                        {store.isVerified && <VerifiedIcon color="primary" sx={{ fontSize: 16 }} />}
                      </Box>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <Rating value={store.ratingAverage} precision={0.5} size="small" readOnly />
                        <Typography variant="caption" color="text.secondary">
                          ({store.ratingCount})
                        </Typography>
                      </Box>
                      <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.5}>
                        {store.categories.slice(0, 2).map((cat: string) => (
                          <Chip key={cat} label={cat} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 22 }} />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                );
              });
              })()}
        </Box>
      </Box>

      {/* Açık Artırma */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
        <Box sx={{ bgcolor: '#c0392b', color: '#fff', px: 2, py: 0.5, borderRadius: '6px 14px 14px 6px', display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
          <GavelIcon sx={{ fontSize: 18 }} />
          <Typography variant="subtitle1" fontWeight={700}>Günün Açık Artırması</Typography>
        </Box>
        <AuctionCountdownBadge endsAt={auctionEndsAt} hasItems={auctionItems.length > 0} />
        <Typography variant="caption" color="text.secondary">
          Her gün 10 ürün, 5 farklı kategori
        </Typography>
      </Box>
      <Grid container spacing={1.5} mb={5}>
        {auctionLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <Grid item xs={6} sm={4} md={2.4} key={i}>
                <Skeleton variant="rounded" height={280} />
              </Grid>
            ))
          : auctionItems.map((item) => {
              const product = item.product;
              if (!product) return null;
              const highBid = item.currentHighestBid ? Number(item.currentHighestBid) : null;
              const startPrice = Number(item.startingPrice);
              const progress = highBid ? Math.min((highBid / (Number(product.price) * 0.9)) * 100, 100) : 0;
              return (
                <Grid item xs={6} sm={4} md={2.4} key={item.id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      border: '1px solid',
                      borderColor: 'divider',
                      '&:hover': { transform: 'translateY(-4px)', boxShadow: 4, borderColor: 'error.main' },
                    }}
                    onClick={() => handleOpenBid(item)}
                  >
                    <Box sx={{ position: 'relative', paddingTop: '100%', overflow: 'hidden' }}>
                      <CardMedia
                        component="img"
                        image={product.thumbnail || 'https://via.placeholder.com/300x300'}
                        alt={product.name}
                        sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <Chip
                        label={item.category}
                        size="small"
                        sx={{
                          position: 'absolute', top: 4, left: 4, height: 20, fontSize: '0.6rem',
                          bgcolor: CATEGORY_COLORS[item.category] || '#666', color: '#fff',
                        }}
                      />
                      <Chip
                        label={`${item.quantity} adet`}
                        size="small"
                        sx={{
                          position: 'absolute', top: 4, right: 4, height: 20, fontSize: '0.6rem',
                          bgcolor: 'rgba(0,0,0,0.6)', color: '#fff',
                        }}
                      />
                    </Box>
                    <CardContent sx={{ flexGrow: 1, p: 1, pb: 0, '&:last-child': { pb: 0.5 } }}>
                      <Typography variant="body2" fontWeight={600} noWrap sx={{ fontSize: '0.75rem', lineHeight: 1.3 }}>
                        {product.name}
                      </Typography>
                      <Box sx={{ mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                          Başlangıç: {startPrice.toLocaleString('tr-TR')} ₺
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="baseline" gap={0.5} mt={0.3}>
                        <TrendingUpIcon sx={{ fontSize: 14, color: highBid ? 'success.main' : 'text.disabled' }} />
                        <Typography variant="body2" fontWeight={700} color={highBid ? 'success.main' : 'text.secondary'} sx={{ fontSize: '0.85rem' }}>
                          {highBid ? `${highBid.toLocaleString('tr-TR')} ₺` : 'Teklif yok'}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={progress}
                        color="error"
                        sx={{ mt: 0.5, height: 3, borderRadius: 1 }}
                      />
                      <Box display="flex" justifyContent="space-between" mt={0.3}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.55rem' }}>
                          {item.totalBids} teklif
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.55rem' }}>
                          Piyasa: {Number(product.price).toLocaleString('tr-TR')} ₺
                        </Typography>
                      </Box>
                    </CardContent>
                    <CardActions disableSpacing sx={{ pt: 0, px: 0.5, pb: 0.5, minHeight: 0 }}>
                      <Button
                        size="small"
                        variant="contained"
                        color="error"
                        fullWidth
                        startIcon={<GavelIcon sx={{ fontSize: 14 }} />}
                        sx={{ fontSize: '0.7rem', py: 0.3, textTransform: 'none' }}
                        onClick={(e) => { e.stopPropagation(); handleOpenBid(item); }}
                      >
                        Teklif Ver
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
      </Grid>

      {/* Ürünler */}
      <Box sx={{ bgcolor: '#1a6b52', color: '#fff', px: 2, py: 0.5, borderRadius: '6px 14px 14px 6px', mb: 2, display: 'inline-block' }}>
        <Typography variant="subtitle1" fontWeight={700}>{productsHeading}</Typography>
      </Box>
      <Grid container spacing={1.5} mb={4}>
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Grid item xs={4} sm={3} md={2} key={i}>
                <Skeleton variant="rounded" height={180} />
              </Grid>
            ))
          : products.slice(0, 6).map((product) => {
              const hasDiscount = product.salePrice && product.salePrice < product.price;
              const discountPercent = hasDiscount ? Math.round(((product.price - product.salePrice!) / product.price) * 100) : 0;
              const favCount = Math.floor(product.ratingCount * 0.6);
              return (
                <Grid item xs={6} sm={4} md={2} key={product.id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      cursor: 'pointer',
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      transition: 'all 0.2s',
                      '&:hover': { transform: 'translateY(-4px)', boxShadow: 4, borderColor: 'primary.light' },
                    }}
                    onClick={() => navigate(`/product/${product.slug}`)}
                  >
                    {/* Görsel */}
                    <Box sx={{ position: 'relative', paddingTop: '110%', overflow: 'hidden', bgcolor: '#f8f8f8' }}>
                      <CardMedia
                        component="img"
                        image={product.thumbnail || 'https://via.placeholder.com/300x300'}
                        alt={product.name}
                        sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      {/* Avantajlı Ürün badge */}
                      {hasDiscount && (
                        <Box sx={{
                          position: 'absolute', top: 6, left: -4,
                          bgcolor: '#c0392b', color: '#fff',
                          px: 1, py: 0.2, fontSize: '0.6rem', fontWeight: 700,
                          borderRadius: '0 6px 6px 0',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                        }}>
                          %{discountPercent} İndirim
                        </Box>
                      )}
                      {/* Favori butonu */}
                      <IconButton
                        size="small"
                        sx={{
                          position: 'absolute', top: 4, right: 4,
                          bgcolor: 'rgba(255,255,255,0.9)',
                          '&:hover': { bgcolor: '#fff' },
                          width: 28, height: 28,
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isAuthenticated) dispatch(toggleFavorite(product.id));
                          else navigate('/login');
                        }}
                      >
                        {favoriteIds[product.id]
                          ? <FavoriteFilledIcon sx={{ fontSize: 16, color: '#c0392b' }} />
                          : <FavoriteBorderIcon sx={{ fontSize: 16, color: '#999' }} />}
                      </IconButton>
                    </Box>

                    {/* Bilgiler */}
                    <CardContent sx={{ flexGrow: 1, p: 1.2, pb: 0, '&:last-child': { pb: 1 } }}>
                      {/* Ürün adı — 2 satır */}
                      <Typography variant="body2" fontWeight={500} sx={{
                        fontSize: '0.78rem', lineHeight: 1.35,
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        color: '#2c1810', mb: 0.5,
                      }}>
                        {product.name}
                      </Typography>

                      {/* Favori sayısı */}
                      {favCount > 10 && (
                        <Box display="flex" alignItems="center" gap={0.3} mb={0.3}>
                          <FavoriteFilledIcon sx={{ fontSize: 11, color: '#c0392b' }} />
                          <Typography variant="caption" sx={{ fontSize: '0.6rem', color: '#c0392b', fontWeight: 600 }}>
                            {favCount} kişi favoriledi!
                          </Typography>
                        </Box>
                      )}

                      {/* Puan */}
                      <Box display="flex" alignItems="center" gap={0.3} mb={0.5}>
                        <Typography variant="caption" fontWeight={700} sx={{ fontSize: '0.7rem' }}>
                          {product.ratingAverage.toFixed(1)}
                        </Typography>
                        <Rating value={product.ratingAverage} precision={0.5} size="small" readOnly sx={{ fontSize: '0.7rem' }} />
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                          ({product.ratingCount})
                        </Typography>
                      </Box>

                      {/* Fiyat */}
                      {hasDiscount ? (
                        <Box>
                          <Box sx={{
                            display: 'inline-flex', alignItems: 'center', gap: 0.3,
                            bgcolor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 1, px: 0.8, py: 0.15, mb: 0.3,
                          }}>
                            <Typography variant="caption" sx={{ fontSize: '0.6rem', color: '#c0392b', fontWeight: 700 }}>
                              🏷️ Sepette %{discountPercent} İndirim
                            </Typography>
                          </Box>
                          <Box display="flex" alignItems="baseline" gap={0.5}>
                            <Typography variant="body2" sx={{ color: '#c0392b', fontWeight: 800, fontSize: '0.9rem' }}>
                              {Number(product.salePrice).toLocaleString('tr-TR')} TL
                            </Typography>
                          </Box>
                          <Typography variant="caption" sx={{ textDecoration: 'line-through', color: '#999', fontSize: '0.7rem' }}>
                            {product.price.toLocaleString('tr-TR')} TL
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" sx={{ color: '#1a6b52', fontWeight: 800, fontSize: '0.9rem' }}>
                          {product.price.toLocaleString('tr-TR')} TL
                        </Typography>
                      )}
                    </CardContent>

                    {/* Sepete ekle */}
                    <Box sx={{ px: 1, pb: 1 }}>
                      <Button
                        fullWidth size="small" variant="contained"
                        startIcon={<AddShoppingCartIcon sx={{ fontSize: 14 }} />}
                        sx={{
                          textTransform: 'none', fontSize: '0.7rem', py: 0.5, borderRadius: 1.5,
                          bgcolor: '#1a6b52', '&:hover': { bgcolor: '#0e4a38' },
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          const price = hasDiscount ? Number(product.salePrice) : Number(product.price);
                          dispatch(addItem({ id: product.id, productId: product.id, storeId: '', name: product.name, thumbnail: product.thumbnail, price, quantity: 1 }));
                          setSnackMsg('Ürün sepete eklendi!'); setSnackSeverity('success'); setSnackOpen(true);
                        }}
                      >
                        Sepete Ekle
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              );
            })}
      </Grid>

      {/* Teklif Dialog */}
      <Dialog open={bidDialogOpen} onClose={() => setBidDialogOpen(false)} maxWidth="sm" fullWidth>
        {selectedAuction && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <GavelIcon color="error" />
              Teklif Ver
            </DialogTitle>
            <DialogContent>
              <Box display="flex" gap={2} mb={2}>
                <CardMedia
                  component="img"
                  image={selectedAuction.product?.thumbnail || 'https://via.placeholder.com/120'}
                  alt={selectedAuction.product?.name}
                  sx={{ width: 120, height: 120, borderRadius: 1, objectFit: 'cover' }}
                />
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>
                    {selectedAuction.product?.name}
                  </Typography>
                  <Chip label={selectedAuction.category} size="small" sx={{ mt: 0.5, bgcolor: CATEGORY_COLORS[selectedAuction.category] || '#666', color: '#fff' }} />
                  <Typography variant="body2" color="text.secondary" mt={1}>
                    Stok: {selectedAuction.quantity} adet
                  </Typography>
                  <Typography variant="body2" mt={0.5}>
                    Başlangıç: <strong>{Number(selectedAuction.startingPrice).toLocaleString('tr-TR')} ₺</strong>
                  </Typography>
                  {selectedAuction.currentHighestBid && (
                    <Typography variant="body2" color="success.main" fontWeight={700} mt={0.5}>
                      En yüksek teklif: {Number(selectedAuction.currentHighestBid).toLocaleString('tr-TR')} ₺
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary">
                    Toplam {selectedAuction.totalBids} teklif verildi
                  </Typography>
                </Box>
              </Box>
              <Box display="flex" gap={2}>
                <TextField
                  label="Teklif Fiyatı (₺)"
                  type="number"
                  value={bidPrice}
                  onChange={(e) => setBidPrice(e.target.value)}
                  fullWidth
                  size="small"
                  helperText={`Min: ${Number(selectedAuction.startingPrice).toLocaleString('tr-TR')} ₺`}
                />
                <TextField
                  label="Adet"
                  select
                  value={bidQuantity}
                  onChange={(e) => setBidQuantity(Number(e.target.value))}
                  sx={{ minWidth: 100 }}
                  size="small"
                >
                  {Array.from({ length: selectedAuction.quantity }, (_, i) => i + 1).map((n) => (
                    <MenuItem key={n} value={n}>{n} adet</MenuItem>
                  ))}
                </TextField>
              </Box>
              {auctionCountdown && (
                <Box display="flex" alignItems="center" gap={0.5} mt={1.5}>
                  <TimerIcon sx={{ fontSize: 16, color: 'error.main' }} />
                  <Typography variant="caption" color="error.main" fontWeight={600}>
                    Kalan süre: {auctionCountdown}
                  </Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={() => setBidDialogOpen(false)} disabled={bidLoading}>
                Vazgeç
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={handlePlaceBid}
                disabled={bidLoading || !bidPrice}
                startIcon={bidLoading ? <CircularProgress size={16} /> : <GavelIcon />}
              >
                {bidLoading ? 'Gönderiliyor...' : 'Teklif Gönder'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Snackbar
        open={snackOpen}
        autoHideDuration={4000}
        onClose={() => setSnackOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ zIndex: 9999 }}
      >
        <Alert onClose={() => setSnackOpen(false)} severity={snackSeverity} variant="filled" sx={{ width: '100%', fontSize: '1rem' }}>
          {snackMsg}
        </Alert>
      </Snackbar>

      {/* Fiyat Geçmişi Popover */}
      {/* ─── Üreticiden Gelenler ─── */}
      <Box sx={{ bgcolor: '#d4882e', color: '#fff', px: 2, py: 0.5, borderRadius: '6px 14px 14px 6px', mb: 2, mt: 2, display: 'inline-block' }}>
        <Typography variant="subtitle1" fontWeight={700}>🏭 Üreticiden Gelenler</Typography>
      </Box>
      <Grid container spacing={1.5} mb={4}>
        {products.filter(p => p.store?.name).slice(0, 12).map((product) => {
          const hasDiscount = product.salePrice && product.salePrice < product.price;
          return (
            <Grid item xs={6} sm={4} md={2} key={`producer-${product.id}`}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', cursor: 'pointer', borderRadius: 2, border: '1px solid', borderColor: 'divider', transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 8px 25px rgba(0,0,0,0.12)' }, '&:hover .prod-img': { transform: 'scale(1.08)' } }}
                onClick={() => navigate(`/product/${product.slug}`)}>
                <Box sx={{ position: 'relative', paddingTop: '100%', overflow: 'hidden', bgcolor: '#f8f8f8', borderRadius: '8px 8px 0 0' }}>
                  <CardMedia className="prod-img" component="img" image={product.thumbnail || ''} alt={product.name}
                    sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }} />
                  <Box sx={{ position: 'absolute', top: 6, left: -4, bgcolor: '#d4882e', color: '#fff', px: 1, py: 0.2, fontSize: '0.55rem', fontWeight: 700, borderRadius: '0 6px 6px 0' }}>
                    Üreticiden
                  </Box>
                </Box>
                <CardContent sx={{ flexGrow: 1, p: 1.2, '&:last-child': { pb: 1 } }}>
                  <Typography variant="body2" fontWeight={500} sx={{ fontSize: '0.75rem', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', mb: 0.3 }}>
                    {product.name}
                  </Typography>
                  {product.store?.name && (
                    <Typography variant="caption" sx={{ fontSize: '0.6rem', color: '#d4882e', fontWeight: 600 }}>
                      🏭 {product.store.name}
                    </Typography>
                  )}
                  <Typography variant="body2" sx={{ color: '#1a6b52', fontWeight: 800, fontSize: '0.85rem', mt: 0.3 }}>
                    {(hasDiscount ? product.salePrice : product.price)?.toLocaleString('tr-TR')} TL
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* ─── İndirimdeki Ürünler ─── */}
      <Box sx={{ bgcolor: '#c0392b', color: '#fff', px: 2, py: 0.5, borderRadius: '6px 14px 14px 6px', mb: 2, display: 'inline-block' }}>
        <Typography variant="subtitle1" fontWeight={700}>🏷️ İndirimdeki Ürünler</Typography>
      </Box>
      <Grid container spacing={1.5} mb={4}>
        {products.filter(p => p.salePrice && p.salePrice < p.price).slice(0, 12).map((product) => {
          const discountPercent = Math.round(((product.price - product.salePrice!) / product.price) * 100);
          return (
            <Grid item xs={6} sm={4} md={2} key={`discount-${product.id}`}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', cursor: 'pointer', borderRadius: 2, border: '1px solid', borderColor: '#fecaca', transition: 'all 0.3s ease', bgcolor: '#fffbfb', '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 8px 25px rgba(0,0,0,0.12)' }, '&:hover .prod-img': { transform: 'scale(1.08)' } }}
                onClick={() => navigate(`/product/${product.slug}`)}>
                <Box sx={{ position: 'relative', paddingTop: '100%', overflow: 'hidden', borderRadius: '8px 8px 0 0' }}>
                  <CardMedia className="prod-img" component="img" image={product.thumbnail || ''} alt={product.name}
                    sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }} />
                  <Box sx={{ position: 'absolute', top: 6, left: -4, bgcolor: '#c0392b', color: '#fff', px: 1, py: 0.3, fontSize: '0.7rem', fontWeight: 800, borderRadius: '0 8px 8px 0', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>
                    %{discountPercent}
                  </Box>
                  <IconButton size="small" sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'rgba(255,255,255,0.9)', width: 26, height: 26 }}
                    onClick={(e) => { e.stopPropagation(); if (isAuthenticated) dispatch(toggleFavorite(product.id)); else navigate('/login'); }}>
                    {favoriteIds[product.id] ? <FavoriteFilledIcon sx={{ fontSize: 14, color: '#c0392b' }} /> : <FavoriteBorderIcon sx={{ fontSize: 14 }} />}
                  </IconButton>
                </Box>
                <CardContent sx={{ flexGrow: 1, p: 1.2, '&:last-child': { pb: 1 } }}>
                  <Typography variant="body2" fontWeight={500} sx={{ fontSize: '0.75rem', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', mb: 0.3 }}>
                    {product.name}
                  </Typography>
                  <Box sx={{ display: 'inline-flex', bgcolor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 1, px: 0.6, py: 0.1, mb: 0.3 }}>
                    <Typography variant="caption" sx={{ fontSize: '0.55rem', color: '#c0392b', fontWeight: 700 }}>
                      Sepette %{discountPercent} İndirim
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="baseline" gap={0.5}>
                    <Typography variant="body2" sx={{ color: '#c0392b', fontWeight: 800, fontSize: '0.9rem' }}>
                      {Number(product.salePrice).toLocaleString('tr-TR')} TL
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ textDecoration: 'line-through', color: '#999', fontSize: '0.65rem' }}>
                    {product.price.toLocaleString('tr-TR')} TL
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* ─── Toptan Satışlar ─── */}
      <Box sx={{ bgcolor: '#2980b9', color: '#fff', px: 2, py: 0.5, borderRadius: '6px 14px 14px 6px', mb: 2, display: 'inline-block' }}>
        <Typography variant="subtitle1" fontWeight={700}>📦 Toptan Satışlar</Typography>
      </Box>
      <Grid container spacing={1.5} mb={4}>
        {products.filter(p => Number(p.price) > 500).slice(0, 12).map((product) => {
          const wholesalePrice = Math.round(Number(product.price) * 0.7);
          return (
            <Grid item xs={6} sm={4} md={2} key={`wholesale-${product.id}`}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', cursor: 'pointer', borderRadius: 2, border: '1.5px solid #93c5fd', transition: 'all 0.3s ease', bgcolor: '#f0f9ff', '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 8px 25px rgba(0,0,0,0.12)' }, '&:hover .prod-img': { transform: 'scale(1.08)' } }}
                onClick={() => navigate(`/product/${product.slug}`)}>
                <Box sx={{ position: 'relative', paddingTop: '100%', overflow: 'hidden', borderRadius: '8px 8px 0 0' }}>
                  <CardMedia className="prod-img" component="img" image={product.thumbnail || ''} alt={product.name}
                    sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }} />
                  <Box sx={{ position: 'absolute', top: 6, left: -4, bgcolor: '#2980b9', color: '#fff', px: 1, py: 0.2, fontSize: '0.55rem', fontWeight: 700, borderRadius: '0 6px 6px 0' }}>
                    Toptan
                  </Box>
                  <Box sx={{ position: 'absolute', bottom: 4, right: 4, bgcolor: 'rgba(0,0,0,0.65)', color: '#fff', px: 0.8, py: 0.2, borderRadius: 1, fontSize: '0.55rem', fontWeight: 600 }}>
                    Min. 10 adet
                  </Box>
                </Box>
                <CardContent sx={{ flexGrow: 1, p: 1.2, '&:last-child': { pb: 1 } }}>
                  <Typography variant="body2" fontWeight={500} sx={{ fontSize: '0.75rem', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', mb: 0.3 }}>
                    {product.name}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={0.3} mb={0.3}>
                    <Rating value={product.ratingAverage} precision={0.5} size="small" readOnly sx={{ fontSize: '0.65rem' }} />
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.55rem' }}>({product.ratingCount})</Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', textDecoration: 'line-through' }}>
                    Perakende: {product.price.toLocaleString('tr-TR')} TL
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#2980b9', fontWeight: 800, fontSize: '0.9rem' }}>
                    Toptan: {wholesalePrice.toLocaleString('tr-TR')} TL
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.55rem', color: '#059669', fontWeight: 600 }}>
                    %{30} tasarruf
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Snackbar open={snackOpen} autoHideDuration={3000} onClose={() => setSnackOpen(false)}>
        <Alert onClose={() => setSnackOpen(false)} severity={snackSeverity} variant="filled">{snackMsg}</Alert>
      </Snackbar>
    </Box>
  );
}
