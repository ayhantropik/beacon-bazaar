import { useState, useMemo, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Pagination from '@mui/material/Pagination';
import Drawer from '@mui/material/Drawer';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Rating from '@mui/material/Rating';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import DeliveryDiningIcon from '@mui/icons-material/DeliveryDining';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TuneIcon from '@mui/icons-material/Tune';
import SortIcon from '@mui/icons-material/Sort';
import GridViewIcon from '@mui/icons-material/GridView';
import ViewListIcon from '@mui/icons-material/ViewList';
import VerifiedIcon from '@mui/icons-material/Verified';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import MapIcon from '@mui/icons-material/Map';
import CloseIcon from '@mui/icons-material/Close';
import NavigationIcon from '@mui/icons-material/Navigation';
import StarIcon from '@mui/icons-material/Star';
import TakeoutDiningIcon from '@mui/icons-material/TakeoutDining';
import StorefrontIcon from '@mui/icons-material/Storefront';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Menu from '@mui/material/Menu';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import CircularProgress from '@mui/material/CircularProgress';
import { UserPanel } from '@components/organisms/UserPanel';
import { locationService } from '@services/api/location.service';
import * as atlas from 'azure-maps-control';
import 'azure-maps-control/dist/atlas.min.css';

const AZURE_KEY = import.meta.env.VITE_AZURE_MAPS_KEY || '';

const CUISINE_TYPES = [
  'Tümü', 'Türk Mutfağı', 'Kebap', 'Pide & Lahmacun', 'Döner', 'Balık',
  'Pizza', 'Burger', 'Çiğ Köfte', 'Tatlı & Pasta', 'Kahvaltı', 'Ev Yemekleri', 'Dünya Mutfağı',
];

const CITIES = [
  'Tüm Türkiye', 'İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya',
  'Adana', 'Konya', 'Gaziantep', 'Kayseri', 'Samsun',
];

interface RestaurantListing {
  id: string;
  name: string;
  cuisineType: string;
  priceRange: 1 | 2 | 3 | 4;
  rating: number;
  reviewCount: number;
  deliveryTime: number;
  minOrder: number;
  hasDelivery: boolean;
  hasTakeaway: boolean;
  hasDineIn: boolean;
  city: string;
  district: string;
  latitude: number;
  longitude: number;
  images: string[];
  imageCount: number;
  isOpen: boolean;
  workingHours: string;
  menuHighlights: string[];
  seller: { name: string; type: 'restoran' | 'kafe'; verified: boolean };
  isFavorite: boolean;
  features: string[];
}

function generateRestaurantListings(): RestaurantListing[] {
  const listings: RestaurantListing[] = [
    { id: '1', name: 'Kebapçı Halil Usta', cuisineType: 'Kebap', priceRange: 2, rating: 4.7, reviewCount: 1240, deliveryTime: 35, minOrder: 150, hasDelivery: true, hasTakeaway: true, hasDineIn: true, city: 'Gaziantep', district: 'Şahinbey', latitude: 37.0662, longitude: 37.3833, images: ['https://picsum.photos/seed/kebapci/600/400'], imageCount: 15, isOpen: true, workingHours: '11:00 - 23:00', menuHighlights: ['Adana Kebap', 'Urfa Kebap', 'Patlıcan Kebap', 'Lahmacun'], seller: { name: 'Kebapçı Halil Usta', type: 'restoran', verified: true }, isFavorite: false, features: ['Bahçe', 'Otopark', 'Wifi'] },
    { id: '2', name: 'Karadeniz Pide Salonu', cuisineType: 'Pide & Lahmacun', priceRange: 2, rating: 4.5, reviewCount: 890, deliveryTime: 30, minOrder: 100, hasDelivery: true, hasTakeaway: true, hasDineIn: true, city: 'Samsun', district: 'İlkadım', latitude: 41.2867, longitude: 36.3300, images: ['https://picsum.photos/seed/pide/600/400'], imageCount: 10, isOpen: true, workingHours: '10:00 - 22:00', menuHighlights: ['Karadeniz Pidesi', 'Kuşbaşılı Pide', 'Kaşarlı Pide'], seller: { name: 'Karadeniz Pide Salonu', type: 'restoran', verified: true }, isFavorite: false, features: ['Aile Salonu', 'Teras'] },
    { id: '3', name: 'The House Cafe', cuisineType: 'Dünya Mutfağı', priceRange: 4, rating: 4.6, reviewCount: 2100, deliveryTime: 45, minOrder: 200, hasDelivery: true, hasTakeaway: true, hasDineIn: true, city: 'İstanbul', district: 'Beşiktaş', latitude: 41.0422, longitude: 29.0060, images: ['https://picsum.photos/seed/housecafe/600/400'], imageCount: 22, isOpen: true, workingHours: '09:00 - 00:00', menuHighlights: ['Truffle Burger', 'Avokado Toast', 'Risotto', 'Tiramisu'], seller: { name: 'The House Cafe', type: 'kafe', verified: true }, isFavorite: false, features: ['Boğaz Manzarası', 'Brunch', 'Kokteyl Bar'] },
    { id: '4', name: 'Balıkçı Kahraman', cuisineType: 'Balık', priceRange: 3, rating: 4.8, reviewCount: 670, deliveryTime: 50, minOrder: 250, hasDelivery: false, hasTakeaway: true, hasDineIn: true, city: 'İzmir', district: 'Alsancak', latitude: 38.4350, longitude: 27.1428, images: ['https://picsum.photos/seed/balikci/600/400'], imageCount: 18, isOpen: true, workingHours: '12:00 - 23:00', menuHighlights: ['Levrek Izgara', 'Çipura Buğulama', 'Karides Güveç', 'Meze Tabağı'], seller: { name: 'Balıkçı Kahraman', type: 'restoran', verified: true }, isFavorite: false, features: ['Deniz Manzarası', 'Canlı Müzik', 'Otopark'] },
    { id: '5', name: 'Burger Lab', cuisineType: 'Burger', priceRange: 2, rating: 4.3, reviewCount: 1560, deliveryTime: 25, minOrder: 80, hasDelivery: true, hasTakeaway: true, hasDineIn: true, city: 'Ankara', district: 'Çankaya', latitude: 39.9208, longitude: 32.8541, images: ['https://picsum.photos/seed/burgerlab/600/400'], imageCount: 12, isOpen: true, workingHours: '11:00 - 01:00', menuHighlights: ['Smash Burger', 'Cheese Burger', 'Crispy Chicken', 'Milkshake'], seller: { name: 'Burger Lab', type: 'restoran', verified: false }, isFavorite: false, features: ['Hızlı Servis', 'Paket Servis', 'Wifi'] },
    { id: '6', name: 'Dönerci Şahin', cuisineType: 'Döner', priceRange: 1, rating: 4.4, reviewCount: 3200, deliveryTime: 20, minOrder: 50, hasDelivery: true, hasTakeaway: true, hasDineIn: true, city: 'İstanbul', district: 'Kadıköy', latitude: 40.9828, longitude: 29.0290, images: ['https://picsum.photos/seed/donerci/600/400'], imageCount: 8, isOpen: true, workingHours: '10:00 - 23:00', menuHighlights: ['Et Döner', 'Tavuk Döner', 'İskender', 'Dürüm'], seller: { name: 'Dönerci Şahin', type: 'restoran', verified: true }, isFavorite: false, features: ['Hızlı Servis', 'Ekonomik'] },
    { id: '7', name: 'Çiğköfteci Ali Usta', cuisineType: 'Çiğ Köfte', priceRange: 1, rating: 4.2, reviewCount: 980, deliveryTime: 15, minOrder: 40, hasDelivery: true, hasTakeaway: true, hasDineIn: false, city: 'Ankara', district: 'Kızılay', latitude: 39.9199, longitude: 32.8543, images: ['https://picsum.photos/seed/cigkofte/600/400'], imageCount: 6, isOpen: true, workingHours: '10:00 - 22:00', menuHighlights: ['Çiğ Köfte Dürüm', 'Çiğ Köfte Porsiyon', 'Ayran', 'Şalgam'], seller: { name: 'Çiğköfteci Ali Usta', type: 'restoran', verified: false }, isFavorite: false, features: ['Vegan Seçenek', 'Hızlı Servis'] },
    { id: '8', name: 'Tatvan Kahvaltı Salonu', cuisineType: 'Kahvaltı', priceRange: 2, rating: 4.6, reviewCount: 1450, deliveryTime: 40, minOrder: 120, hasDelivery: false, hasTakeaway: false, hasDineIn: true, city: 'İstanbul', district: 'Beşiktaş', latitude: 41.0500, longitude: 29.0100, images: ['https://picsum.photos/seed/kahvalti/600/400'], imageCount: 14, isOpen: true, workingHours: '07:00 - 16:00', menuHighlights: ['Serpme Kahvaltı', 'Van Otlu Peynir', 'Menemen', 'Gözleme'], seller: { name: 'Tatvan Kahvaltı Salonu', type: 'restoran', verified: true }, isFavorite: false, features: ['Kahvaltı Uzmanı', 'Bahçe', 'Aile Dostu'] },
    { id: '9', name: 'Pizza Il Forno', cuisineType: 'Pizza', priceRange: 3, rating: 4.5, reviewCount: 780, deliveryTime: 30, minOrder: 100, hasDelivery: true, hasTakeaway: true, hasDineIn: true, city: 'Antalya', district: 'Muratpaşa', latitude: 36.8969, longitude: 30.7133, images: ['https://picsum.photos/seed/pizzaforno/600/400'], imageCount: 11, isOpen: true, workingHours: '12:00 - 00:00', menuHighlights: ['Margherita', 'Pepperoni', 'Calzone', 'Tiramisu'], seller: { name: 'Pizza Il Forno', type: 'restoran', verified: true }, isFavorite: false, features: ['İtalyan Fırın', 'Hamur Ustası', 'Teras'] },
    { id: '10', name: 'Hacıoğlu Ev Yemekleri', cuisineType: 'Ev Yemekleri', priceRange: 1, rating: 4.3, reviewCount: 560, deliveryTime: 25, minOrder: 60, hasDelivery: true, hasTakeaway: true, hasDineIn: true, city: 'Bursa', district: 'Osmangazi', latitude: 40.1885, longitude: 29.0610, images: ['https://picsum.photos/seed/evyemek/600/400'], imageCount: 7, isOpen: true, workingHours: '11:00 - 20:00', menuHighlights: ['Kuru Fasulye', 'İmam Bayıldı', 'Mantı', 'Komposto'], seller: { name: 'Hacıoğlu Ev Yemekleri', type: 'restoran', verified: false }, isFavorite: false, features: ['Ev Yapımı', 'Günlük Menü', 'Ekonomik'] },
    { id: '11', name: 'Pelit Pastanesi', cuisineType: 'Tatlı & Pasta', priceRange: 3, rating: 4.7, reviewCount: 2300, deliveryTime: 35, minOrder: 100, hasDelivery: true, hasTakeaway: true, hasDineIn: true, city: 'İstanbul', district: 'Şişli', latitude: 41.0602, longitude: 28.9877, images: ['https://picsum.photos/seed/pelit/600/400'], imageCount: 20, isOpen: true, workingHours: '08:00 - 22:00', menuHighlights: ['San Sebastian', 'Profiterol', 'Baklava', 'Künefe'], seller: { name: 'Pelit Pastanesi', type: 'kafe', verified: true }, isFavorite: false, features: ['Pastane', 'Tatlı Çeşitleri', 'Kahve'] },
    { id: '12', name: 'Adana Sofrası', cuisineType: 'Türk Mutfağı', priceRange: 2, rating: 4.4, reviewCount: 1100, deliveryTime: 40, minOrder: 120, hasDelivery: true, hasTakeaway: true, hasDineIn: true, city: 'Adana', district: 'Seyhan', latitude: 36.9914, longitude: 35.3308, images: ['https://picsum.photos/seed/adanasofra/600/400'], imageCount: 13, isOpen: false, workingHours: '11:00 - 22:00', menuHighlights: ['Adana Kebap', 'Beyti', 'Şırdan', 'Bici Bici'], seller: { name: 'Adana Sofrası', type: 'restoran', verified: true }, isFavorite: false, features: ['Odun Ateşi', 'Bahçe', 'Otopark', 'Aile Salonu'] },
  ];
  return listings;
}

const ITEMS_PER_PAGE = 12;

const priceRangeLabel = (range: number) => {
  return Array.from({ length: 4 }, (_, i) => (i < range ? '\u20BA' : '')).join('');
};

export default function YemekListingPage() {
  const [searchParams] = useSearchParams();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showFilters, setShowFilters] = useState(true);
  const [showUserPanel, setShowUserPanel] = useState(false);

  // Filter states
  const [cuisineType, setCuisineType] = useState(searchParams.get('cuisine') || 'Tümü');
  const [city, setCity] = useState('Tüm Türkiye');
  const [minRating, setMinRating] = useState<number>(0);
  const [maxPriceRange, setMaxPriceRange] = useState<number>(4);
  const [deliveryOnly, setDeliveryOnly] = useState(false);
  const [takeawayOnly, setTakeawayOnly] = useState(false);
  const [sortBy, setSortBy] = useState('rating');
  const [tab, setTab] = useState(0); // 0: Tümü, 1: Restoran, 2: Kafe, 3: Ev Yemekleri
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [mapOpen, setMapOpen] = useState(false);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [locLoading, setLocLoading] = useState(false);
  const [selectedListing, setSelectedListing] = useState<RestaurantListing | null>(null);
  const [detailListing, setDetailListing] = useState<RestaurantListing | null>(null);
  const [navAnchor, setNavAnchor] = useState<HTMLElement | null>(null);
  const [locationLabel, setLocationLabel] = useState('');
  const mapRef = useRef<HTMLDivElement>(null);

  // Sayfa yüklendiğinde konumu tespit edip mahalle adını göster
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        // Reverse geocoding ile mahalle/ilçe bilgisi al
        try {
          const res = await locationService.reverseGeocode(pos.coords.latitude, pos.coords.longitude);
          const data: any = res.data || {};
          const parts: string[] = [];
          if (data.neighbourhood) parts.push(data.neighbourhood);
          if (data.district) parts.push(data.district);
          if (data.city) parts.push(data.city);
          const label = parts.slice(0, 2).join(', ') || data.displayName?.split(',').slice(0, 2).join(',') || '';
          if (label) setLocationLabel(label);

          // Şehri de eşleştir
          const matchCity = CITIES.find(c => c === data.city);
          if (matchCity) setCity(matchCity);
        } catch {
          // Fallback: en yakın şehri bul
          const listings = generateRestaurantListings();
          const cities = [...new Set(listings.map(l => l.city))];
          let nearestCity = ''; let minDist = Infinity;
          for (const c of cities) {
            const r = listings.find(l => l.city === c);
            if (r) {
              const R = 6371;
              const dLa = (r.latitude - pos.coords.latitude) * Math.PI / 180;
              const dLo = (r.longitude - pos.coords.longitude) * Math.PI / 180;
              const a = Math.sin(dLa/2)**2 + Math.cos(pos.coords.latitude*Math.PI/180)*Math.cos(r.latitude*Math.PI/180)*Math.sin(dLo/2)**2;
              const d = R*2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
              if (d < minDist) { minDist = d; nearestCity = c; }
            }
          }
          if (nearestCity && minDist < 200) { setCity(nearestCity); setLocationLabel(nearestCity); }
        }
      },
      () => {},
      { enableHighAccuracy: true, timeout: 5000 },
    );
  }, []);

  const allListings = useMemo(() => generateRestaurantListings(), []);

  const filteredListings = useMemo(() => {
    let result = [...allListings];
    if (city !== 'Tüm Türkiye') result = result.filter(l => l.city === city);
    if (cuisineType !== 'Tümü') result = result.filter(l => l.cuisineType === cuisineType);
    if (query) {
      const q = query.toLowerCase();
      result = result.filter(l => l.name.toLowerCase().includes(q) || l.cuisineType.toLowerCase().includes(q) || l.menuHighlights.some(m => m.toLowerCase().includes(q)));
    }
    if (minRating > 0) result = result.filter(l => l.rating >= minRating);
    if (maxPriceRange < 4) result = result.filter(l => l.priceRange <= maxPriceRange);
    if (deliveryOnly) result = result.filter(l => l.hasDelivery);
    if (takeawayOnly) result = result.filter(l => l.hasTakeaway);
    if (tab === 1) result = result.filter(l => l.seller.type === 'restoran');
    if (tab === 2) result = result.filter(l => l.seller.type === 'kafe');
    if (tab === 3) result = result.filter(l => l.cuisineType === 'Ev Yemekleri');

    // Sort
    if (sortBy === 'rating') result.sort((a, b) => b.rating - a.rating);
    else if (sortBy === 'delivery_time') result.sort((a, b) => a.deliveryTime - b.deliveryTime);
    else if (sortBy === 'price_asc') result.sort((a, b) => a.priceRange - b.priceRange);
    else if (sortBy === 'price_desc') result.sort((a, b) => b.priceRange - a.priceRange);

    return result;
  }, [allListings, cuisineType, city, minRating, maxPriceRange, deliveryOnly, takeawayOnly, tab, query, sortBy]);

  const paginatedListings = filteredListings.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const totalPages = Math.ceil(filteredListings.length / ITEMS_PER_PAGE);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const calcDist = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const openMap = () => {
    setLocLoading(true);
    setMapOpen(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocLoading(false);
      },
      () => {
        setUserLoc({ lat: 41.0082, lng: 28.9784 });
        setLocLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const mapListings = useMemo(() => {
    if (!userLoc) return filteredListings;
    return [...filteredListings]
      .map(l => ({ ...l, _dist: calcDist(userLoc.lat, userLoc.lng, l.latitude, l.longitude) }))
      .sort((a, b) => a._dist - b._dist);
  }, [filteredListings, userLoc]);

  return (
    <Box>
      {/* Hero Banner */}
      <Box sx={{
        background: '#fff',
        borderRadius: 0,
        p: { xs: 3, md: 4 },
        mb: 3,
        ml: 'calc(-50vw + 50%)',
        mr: 'calc(-50vw + 50%)',
        width: '100vw',
        px: { xs: 3, md: 6 },
        color: '#2c1810',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <Box sx={{ position: 'absolute', top: -30, right: -30, opacity: 0.03, fontSize: 200, color: '#1a6b52' }}>
          <RestaurantIcon sx={{ fontSize: 'inherit' }} />
        </Box>
        <Typography variant="h4" fontWeight={800} mb={1}>
          VeniVidi Yemek
        </Typography>
        <Typography variant="body1" sx={{ color: '#6b5b4e', mb: 2 }}>
          En lezzetli restoranlar ve kafeler, bulundugun yere en yakin
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', maxWidth: 700 }}>
          <TextField
            size="small"
            placeholder="Restoran, mutfak veya yemek ara..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            sx={{
              flex: 1, minWidth: 200,
              '& .MuiOutlinedInput-root': {
                bgcolor: '#f5f5f5', borderRadius: 2,
                '& fieldset': { borderColor: '#e0e0e0' },
              },
            }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
            }}
          />
          <TextField
            select size="small" value={city} onChange={(e) => { setCity(e.target.value); setPage(1); }}
            sx={{
              minWidth: 180,
              '& .MuiOutlinedInput-root': {
                bgcolor: '#f5f5f5', borderRadius: 2,
                '& fieldset': { borderColor: '#e0e0e0' },
              },
            }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><LocationOnIcon sx={{ fontSize: 20, color: locationLabel ? '#e65100' : undefined }} /></InputAdornment>,
            }}
            helperText={locationLabel ? `📍 ${locationLabel}` : undefined}
            FormHelperTextProps={{ sx: { color: '#1a6b52', fontWeight: 600, fontSize: '0.7rem', ml: 0.5, mt: 0.3 } }}
          >
            {CITIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField>
        </Box>

        {/* Quick cuisine chips */}
        <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
          {['Kebap', 'Pizza', 'Burger', 'Döner', 'Kahvaltı', 'Balık'].map(b => (
            <Chip
              key={b} label={b} size="small"
              onClick={() => { setCuisineType(cuisineType === b ? 'Tümü' : b); setQuery(''); setCity('Tüm Türkiye'); setPage(1); }}
              sx={{
                bgcolor: cuisineType === b ? '#1a6b52' : '#f5f5f5',
                color: cuisineType === b ? '#fff' : '#2c1810',
                fontWeight: 600, fontSize: 12,
                '&:hover': { bgcolor: cuisineType === b ? '#0e4a38' : '#e8e8e8' },
              }}
            />
          ))}
        </Box>
      </Box>

      {/* Tabs & Sort Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Tabs value={tab} onChange={(_, v) => { setTab(v); setPage(1); }} sx={{ minHeight: 36, '& .MuiTab-root': { minHeight: 36, py: 0.5, textTransform: 'none', fontWeight: 600 } }}>
            <Tab label={`Tümü (${allListings.length})`} />
            <Tab label="Restoran" />
            <Tab label="Kafe" />
            <Tab label="Ev Yemekleri" />
          </Tabs>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
            {filteredListings.length} mekan
          </Typography>
          <Button
            size="small" variant={showFilters ? 'contained' : 'outlined'}
            startIcon={<TuneIcon />}
            onClick={() => setShowFilters(!showFilters)}
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Filtreler
          </Button>
          <TextField
            select size="small" value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            sx={{ minWidth: 180, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SortIcon sx={{ fontSize: 18 }} /></InputAdornment> }}
          >
            <MenuItem value="rating">Puan (Yuksek-Dusuk)</MenuItem>
            <MenuItem value="delivery_time">Teslimat Suresi</MenuItem>
            <MenuItem value="price_asc">Fiyat (Dusuk-Yuksek)</MenuItem>
            <MenuItem value="price_desc">Fiyat (Yuksek-Dusuk)</MenuItem>
          </TextField>
          <IconButton size="small" onClick={() => setViewMode('grid')} color={viewMode === 'grid' ? 'primary' : 'default'}>
            <GridViewIcon />
          </IconButton>
          <IconButton size="small" onClick={() => setViewMode('list')} color={viewMode === 'list' ? 'primary' : 'default'}>
            <ViewListIcon />
          </IconButton>
          <Button size="small" variant="outlined" startIcon={<MapIcon />} onClick={openMap} sx={{ ml: 0.5, textTransform: 'none', borderRadius: 2 }}>
            Haritada Gor
          </Button>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          <Button
            size="small"
            variant={showUserPanel ? 'contained' : 'outlined'}
            startIcon={<AccountCircleIcon />}
            onClick={() => setShowUserPanel(true)}
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Hesabim
          </Button>
        </Box>
      </Box>

      {/* User Panel Drawer */}
      <Drawer
        anchor="right"
        open={showUserPanel}
        onClose={() => setShowUserPanel(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 400 } } }}
      >
        <UserPanel context={"yemek" as any} onClose={() => setShowUserPanel(false)} />
      </Drawer>

      <Grid container spacing={2}>
        {/* Filters Sidebar */}
        {showFilters && (
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2, borderRadius: 2, position: 'sticky', top: 120 }}>
              <Typography variant="subtitle2" fontWeight={700} mb={1.5}>Detayli Arama</Typography>

              <TextField select fullWidth size="small" label="Mutfak Turu" value={cuisineType} onChange={(e) => setCuisineType(e.target.value)} sx={{ mb: 1.5 }}>
                {CUISINE_TYPES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </TextField>

              <Divider sx={{ my: 1.5 }} />
              <Typography variant="caption" fontWeight={600} color="text.secondary">Fiyat Aralığı</Typography>
              <Box display="flex" flexDirection="column" gap={0.5} mt={0.5} mb={1.5}>
                {[
                  { level: 1, label: '0 - 100 ₺', desc: 'Ekonomik' },
                  { level: 2, label: '100 - 250 ₺', desc: 'Orta' },
                  { level: 3, label: '250 - 500 ₺', desc: 'Üst Segment' },
                  { level: 4, label: '500 ₺ +', desc: 'Lüks' },
                ].map(({ level, label, desc }) => (
                  <Chip
                    key={level}
                    label={`${label}  ·  ${desc}`}
                    size="small"
                    onClick={() => { setMaxPriceRange(maxPriceRange === level ? 4 : level); setPage(1); }}
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.72rem',
                      justifyContent: 'flex-start',
                      bgcolor: maxPriceRange === level ? '#fff3e0' : 'transparent',
                      border: '1.5px solid',
                      borderColor: maxPriceRange === level ? '#e65100' : 'divider',
                      color: maxPriceRange === level ? '#e65100' : 'text.primary',
                      '&:hover': { bgcolor: '#fff3e0' },
                    }}
                  />
                ))}
              </Box>

              <Typography variant="caption" fontWeight={600} color="text.secondary">Minimum Puan</Typography>
              <Box mt={0.5} mb={1.5}>
                <Rating
                  value={minRating}
                  onChange={(_, val) => setMinRating(val || 0)}
                  precision={0.5}
                  size="medium"
                />
              </Box>

              <Divider sx={{ my: 1.5 }} />

              <FormControlLabel
                control={<Switch checked={deliveryOnly} onChange={(e) => setDeliveryOnly(e.target.checked)} size="small" />}
                label={<Typography variant="body2">Paket Servis</Typography>}
                sx={{ mb: 1 }}
              />

              <FormControlLabel
                control={<Switch checked={takeawayOnly} onChange={(e) => setTakeawayOnly(e.target.checked)} size="small" />}
                label={<Typography variant="body2">Gel Al</Typography>}
                sx={{ mb: 2 }}
              />

              <Button
                fullWidth variant="contained" size="medium"
                startIcon={<SearchIcon />}
                onClick={() => { setPage(1); }}
                sx={{ borderRadius: 2, textTransform: 'none', py: 1.2, fontWeight: 700, bgcolor: '#e65100', '&:hover': { bgcolor: '#bf360c' } }}
              >
                Ara
              </Button>
              <Button
                fullWidth variant="text" size="small"
                onClick={() => { setCuisineType('Tümü'); setCity('Tüm Türkiye'); setMinRating(0); setMaxPriceRange(4); setDeliveryOnly(false); setTakeawayOnly(false); setQuery(''); }}
                sx={{ borderRadius: 2, textTransform: 'none', mt: 0.5, fontSize: '0.75rem', color: 'text.secondary' }}
              >
                Filtreleri Temizle
              </Button>
            </Paper>
          </Grid>
        )}

        {/* Listing Cards */}
        <Grid item xs={12} md={showFilters ? 9 : 12}>
          {paginatedListings.length === 0 ? (
            <Box textAlign="center" py={8}>
              <RestaurantIcon sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">Aramaniza uygun restoran bulunamadi</Typography>
              <Typography variant="body2" color="text.secondary">Filtrelerinizi degistirmeyi deneyin</Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: viewMode === 'list' ? 1.5 : 0 }}>
              {viewMode === 'list' ? (
                // LIST VIEW
                paginatedListings.map((rest) => (
                  <Card key={rest.id} onClick={() => setDetailListing(rest)} sx={{
                    display: 'flex', cursor: 'pointer', transition: 'all 0.2s', borderRadius: 2, overflow: 'hidden',
                    border: '1px solid', borderColor: 'divider',
                    opacity: rest.isOpen ? 1 : 0.7,
                    '&:hover': { boxShadow: 4, borderColor: 'warning.light' },
                  }}>
                    {/* Image */}
                    <Box sx={{ position: 'relative', width: { xs: 140, sm: 220, md: 280 }, flexShrink: 0 }}>
                      <CardMedia
                        component="img" image={rest.images[0]} alt={rest.name}
                        sx={{ height: '100%', minHeight: 160, objectFit: 'cover' }}
                      />
                      <Box sx={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 0.5 }}>
                        {rest.seller.verified && (
                          <Chip icon={<VerifiedIcon sx={{ fontSize: 14 }} />} label="Onayli" size="small"
                            sx={{ bgcolor: 'rgba(230,81,0,0.9)', color: '#fff', height: 22, fontSize: 11, fontWeight: 600 }} />
                        )}
                        <Chip
                          label={rest.isOpen ? 'Acik' : 'Kapali'}
                          size="small"
                          sx={{
                            bgcolor: rest.isOpen ? 'rgba(46,125,50,0.9)' : 'rgba(198,40,40,0.9)',
                            color: '#fff', height: 22, fontSize: 11, fontWeight: 600,
                          }}
                        />
                      </Box>
                      <Box sx={{ position: 'absolute', bottom: 8, left: 8, display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: 'rgba(0,0,0,0.6)', color: '#fff', borderRadius: 1, px: 0.8, py: 0.3 }}>
                        <PhotoCameraIcon sx={{ fontSize: 14 }} />
                        <Typography variant="caption" fontWeight={600}>{rest.imageCount}</Typography>
                      </Box>
                      <IconButton
                        size="small"
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(rest.id); }}
                        sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(255,255,255,0.9)', '&:hover': { bgcolor: '#fff' } }}
                      >
                        {favorites.has(rest.id) ? <FavoriteIcon sx={{ fontSize: 18, color: 'error.main' }} /> : <FavoriteBorderIcon sx={{ fontSize: 18 }} />}
                      </IconButton>
                    </Box>

                    {/* Content */}
                    <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', py: 1.5, px: 2 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                        <Box>
                          <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.3 }}>{rest.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {rest.seller.type === 'restoran' ? 'Restoran' : 'Kafe'} &middot; {rest.cuisineType}
                          </Typography>
                        </Box>
                        <Box textAlign="right">
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <StarIcon sx={{ fontSize: 18, color: '#f57c00' }} />
                            <Typography variant="h6" fontWeight={800} color="#e65100" sx={{ lineHeight: 1.2 }}>
                              {rest.rating}
                            </Typography>
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            {rest.reviewCount} degerlendirme
                          </Typography>
                        </Box>
                      </Box>

                      {/* Specs */}
                      <Box sx={{ display: 'flex', gap: 2, mt: 1.5, flexWrap: 'wrap' }}>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <AccessTimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">{rest.deliveryTime} dk</Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <Typography variant="body2" fontWeight={700} color="#e65100">
                            {priceRangeLabel(rest.priceRange)}
                          </Typography>
                          <Typography variant="body2" color="grey.300">
                            {'\u20BA'.repeat(4 - rest.priceRange)}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">Min. {rest.minOrder} TL</Typography>
                        {rest.hasDelivery && (
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <DeliveryDiningIcon sx={{ fontSize: 16, color: 'success.main' }} />
                            <Typography variant="body2" color="success.main" fontWeight={600}>Paket</Typography>
                          </Box>
                        )}
                        {rest.hasTakeaway && (
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <TakeoutDiningIcon sx={{ fontSize: 16, color: 'info.main' }} />
                            <Typography variant="body2" color="info.main" fontWeight={600}>Gel Al</Typography>
                          </Box>
                        )}
                        {rest.hasDineIn && (
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <StorefrontIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">Restoranda</Typography>
                          </Box>
                        )}
                      </Box>

                      {/* Menu highlights & features */}
                      <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
                        {rest.menuHighlights.slice(0, 3).map(m => (
                          <Chip key={m} label={m} size="small" sx={{ height: 22, fontSize: 11, bgcolor: '#fff3e0', color: '#e65100' }} />
                        ))}
                        {rest.features.slice(0, 2).map(f => (
                          <Chip key={f} label={f} size="small" variant="outlined" sx={{ height: 22, fontSize: 11 }} />
                        ))}
                      </Box>

                      {/* Location & Working Hours */}
                      <Box sx={{ mt: 'auto', pt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <LocationOnIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">{rest.city}, {rest.district}</Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {rest.workingHours}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                ))
              ) : (
                // GRID VIEW
                <Grid container spacing={2}>
                  {paginatedListings.map((rest) => (
                    <Grid item xs={6} sm={4} md={showFilters ? 4 : 3} key={rest.id}>
                      <Card onClick={() => setDetailListing(rest)} sx={{
                        cursor: 'pointer', transition: 'all 0.2s', borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column',
                        border: '1px solid', borderColor: 'divider',
                        opacity: rest.isOpen ? 1 : 0.7,
                        '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' },
                      }}>
                        <Box sx={{ position: 'relative', paddingTop: '66%' }}>
                          <CardMedia component="img" image={rest.images[0]} alt={rest.name}
                            sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggleFavorite(rest.id); }}
                            sx={{ position: 'absolute', top: 6, right: 6, bgcolor: 'rgba(255,255,255,0.9)', p: 0.5 }}>
                            {favorites.has(rest.id) ? <FavoriteIcon sx={{ fontSize: 16, color: 'error.main' }} /> : <FavoriteBorderIcon sx={{ fontSize: 16 }} />}
                          </IconButton>
                          <Box sx={{ position: 'absolute', bottom: 6, left: 6, display: 'flex', gap: 0.5 }}>
                            <Chip label={rest.isOpen ? 'Acik' : 'Kapali'} size="small" sx={{ bgcolor: rest.isOpen ? 'rgba(46,125,50,0.9)' : 'rgba(198,40,40,0.9)', color: '#fff', height: 20, fontSize: 10 }} />
                            <Chip label={`${rest.imageCount} foto`} size="small" sx={{ bgcolor: 'rgba(0,0,0,0.6)', color: '#fff', height: 20, fontSize: 10 }} />
                          </Box>
                        </Box>
                        <CardContent sx={{ flex: 1, p: 1.5, display: 'flex', flexDirection: 'column' }}>
                          <Typography variant="subtitle2" fontWeight={700} noWrap>{rest.name}</Typography>
                          <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                            <StarIcon sx={{ fontSize: 16, color: '#f57c00' }} />
                            <Typography variant="body2" fontWeight={700} color="#e65100">{rest.rating}</Typography>
                            <Typography variant="caption" color="text.secondary">({rest.reviewCount})</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1, mt: 0.5, color: 'text.secondary', fontSize: 12, flexWrap: 'wrap' }}>
                            <Typography variant="caption">{rest.cuisineType}</Typography>
                            <Typography variant="caption">{rest.deliveryTime} dk</Typography>
                            <Typography variant="caption" fontWeight={700} color="#e65100">{priceRangeLabel(rest.priceRange)}</Typography>
                          </Box>
                          <Box sx={{ mt: 'auto', pt: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <LocationOnIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">{rest.city}</Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={3}>
              <Pagination count={totalPages} page={page} onChange={(_, p) => setPage(p)} color="primary" />
            </Box>
          )}
        </Grid>
      </Grid>

      {/* Detay Dialog */}
      <Dialog open={!!detailListing} onClose={() => setDetailListing(null)} maxWidth="md" fullWidth>
        {detailListing && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6" fontWeight={700}>{detailListing.name}</Typography>
              <IconButton onClick={() => setDetailListing(null)}><CloseIcon /></IconButton>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mb: 2, borderRadius: 2, overflow: 'hidden' }}>
                <CardMedia component="img" image={detailListing.images[0]} alt={detailListing.name} sx={{ height: 300, objectFit: 'cover' }} />
              </Box>
              <Box display="flex" alignItems="baseline" gap={2} mb={2}>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <StarIcon sx={{ fontSize: 24, color: '#f57c00' }} />
                  <Typography variant="h5" color="#e65100" fontWeight={800}>
                    {detailListing.rating}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ({detailListing.reviewCount} degerlendirme)
                  </Typography>
                </Box>
                <Chip label={detailListing.isOpen ? 'Acik' : 'Kapali'} size="small" color={detailListing.isOpen ? 'success' : 'error'} />
                <Typography variant="h6" fontWeight={700} color="#e65100">
                  {priceRangeLabel(detailListing.priceRange)}
                  <Typography component="span" color="grey.400">{'\u20BA'.repeat(4 - detailListing.priceRange)}</Typography>
                </Typography>
              </Box>
              <Grid container spacing={2} mb={2}>
                <Grid item xs={4} sm={3}><Typography variant="caption" color="text.secondary">Mutfak</Typography><Typography variant="body2" fontWeight={600}>{detailListing.cuisineType}</Typography></Grid>
                <Grid item xs={4} sm={3}><Typography variant="caption" color="text.secondary">Teslimat Suresi</Typography><Typography variant="body2" fontWeight={600}>{detailListing.deliveryTime} dk</Typography></Grid>
                <Grid item xs={4} sm={3}><Typography variant="caption" color="text.secondary">Min. Siparis</Typography><Typography variant="body2" fontWeight={600}>{detailListing.minOrder} TL</Typography></Grid>
                <Grid item xs={4} sm={3}><Typography variant="caption" color="text.secondary">Calisma Saatleri</Typography><Typography variant="body2" fontWeight={600}>{detailListing.workingHours}</Typography></Grid>
                <Grid item xs={4} sm={3}><Typography variant="caption" color="text.secondary">Paket Servis</Typography><Typography variant="body2" fontWeight={600}>{detailListing.hasDelivery ? 'Var' : 'Yok'}</Typography></Grid>
                <Grid item xs={4} sm={3}><Typography variant="caption" color="text.secondary">Gel Al</Typography><Typography variant="body2" fontWeight={600}>{detailListing.hasTakeaway ? 'Var' : 'Yok'}</Typography></Grid>
                <Grid item xs={4} sm={3}><Typography variant="caption" color="text.secondary">Restoranda Yemek</Typography><Typography variant="body2" fontWeight={600}>{detailListing.hasDineIn ? 'Var' : 'Yok'}</Typography></Grid>
                <Grid item xs={4} sm={3}><Typography variant="caption" color="text.secondary">Tur</Typography><Typography variant="body2" fontWeight={600}>{detailListing.seller.type === 'restoran' ? 'Restoran' : 'Kafe'}</Typography></Grid>
              </Grid>

              <Typography variant="subtitle2" fontWeight={700} mb={1}>Menu Onerileri</Typography>
              <Box display="flex" flexWrap="wrap" gap={0.5} mb={2}>
                {detailListing.menuHighlights.map(m => <Chip key={m} label={m} size="small" sx={{ bgcolor: '#fff3e0', color: '#e65100' }} />)}
              </Box>

              <Box display="flex" flexWrap="wrap" gap={0.5} mb={2}>
                {detailListing.features.map(f => <Chip key={f} label={f} size="small" variant="outlined" />)}
              </Box>

              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <LocationOnIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">{detailListing.district}, {detailListing.city}</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <AccountCircleIcon />
                <Box>
                  <Typography variant="subtitle2" fontWeight={600}>{detailListing.seller.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{detailListing.seller.type === 'restoran' ? 'Restoran' : 'Kafe'}</Typography>
                </Box>
                {detailListing.seller.verified && <VerifiedIcon color="warning" sx={{ fontSize: 16 }} />}
              </Box>
              <Box display="flex" gap={1}>
                <Button variant="contained" startIcon={<MapIcon />} sx={{ textTransform: 'none', bgcolor: '#e65100', '&:hover': { bgcolor: '#bf360c' } }}
                  onClick={() => { setDetailListing(null); openMap(); }}>
                  Haritada Goster
                </Button>
                <Button variant="outlined" sx={{ textTransform: 'none' }}
                  onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${detailListing.latitude},${detailListing.longitude}`, '_blank')}>
                  Yol Tarifi Al
                </Button>
              </Box>
            </DialogContent>
          </>
        )}
      </Dialog>

      {/* Harita Dialog */}
      <Dialog open={mapOpen} onClose={() => setMapOpen(false)} maxWidth="xl" fullWidth PaperProps={{ sx: { height: '85vh', borderRadius: 3 } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <MapIcon color="warning" />
            <Typography variant="h6" fontWeight={700}>Yakinindaki Restoranlar</Typography>
            {userLoc && <Chip size="small" label={`${mapListings.length} mekan`} color="warning" variant="outlined" />}
          </Box>
          <IconButton onClick={() => setMapOpen(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, display: 'flex', height: '100%' }}>
          {locLoading ? (
            <Box display="flex" alignItems="center" justifyContent="center" flex={1}>
              <CircularProgress color="warning" />
              <Typography ml={2} color="text.secondary">Konum aliniyor...</Typography>
            </Box>
          ) : (
            <Box display="flex" flex={1} overflow="hidden">
              {/* Harita */}
              <Box ref={mapRef} flex={1} position="relative" sx={{ minHeight: 400 }}>
                <MapDialogContent
                  listings={mapListings}
                  userLoc={userLoc}
                  onSelect={(l) => setSelectedListing(l)}
                  selectedId={selectedListing?.id}
                />
              </Box>
              {/* Sag panel */}
              <Box sx={{ width: { xs: '100%', md: 360 }, height: '100%', overflowY: 'auto', borderLeft: '1px solid', borderColor: 'divider', display: { xs: 'none', md: 'block' } }}>
                <Box p={1.5}>
                  <Typography variant="subtitle2" fontWeight={700} mb={1}>
                    {userLoc ? 'Yakindan Uzaga' : 'Restoranlar'}
                  </Typography>
                  {mapListings.map((listing) => {
                    const dist = userLoc ? calcDist(userLoc.lat, userLoc.lng, listing.latitude, listing.longitude) : null;
                    return (
                      <Card
                        key={listing.id}
                        onClick={() => setSelectedListing(listing)}
                        sx={{
                          display: 'flex',
                          mb: 1,
                          cursor: 'pointer',
                          border: selectedListing?.id === listing.id ? '2px solid' : '1px solid',
                          borderColor: selectedListing?.id === listing.id ? 'warning.main' : 'divider',
                          bgcolor: selectedListing?.id === listing.id ? 'rgba(230,81,0,0.04)' : 'transparent',
                          transition: 'all 0.15s',
                          '&:hover': { borderColor: 'warning.light' },
                        }}
                      >
                        <CardMedia component="img" image={listing.images[0]} alt={listing.name} sx={{ width: 90, height: 70, objectFit: 'cover' }} />
                        <CardContent sx={{ flex: 1, p: 1, '&:last-child': { pb: 1 } }}>
                          <Typography variant="caption" fontWeight={600} noWrap>{listing.name}</Typography>
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <StarIcon sx={{ fontSize: 12, color: '#f57c00' }} />
                            <Typography variant="body2" color="#e65100" fontWeight={700} sx={{ fontSize: '0.8rem' }}>
                              {listing.rating}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>{listing.deliveryTime} dk</Typography>
                          </Box>
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <LocationOnIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">{listing.district}, {listing.city}</Typography>
                            {dist != null && (
                              <Chip size="small" label={dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(1)} km`} sx={{ height: 18, fontSize: '0.6rem', ml: 'auto' }} />
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    );
                  })}
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Navigasyon Menusu */}
      <Menu anchorEl={navAnchor} open={Boolean(navAnchor)} onClose={() => setNavAnchor(null)}>
        {selectedListing && [
          <MenuItem key="g" onClick={() => { window.open(`https://www.google.com/maps/dir/?api=1&destination=${selectedListing.latitude},${selectedListing.longitude}`, '_blank'); setNavAnchor(null); }}>
            <ListItemIcon><NavigationIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Google Maps</ListItemText>
          </MenuItem>,
          <MenuItem key="y" onClick={() => { window.open(`https://yandex.com/maps/?rtext=~${selectedListing.latitude},${selectedListing.longitude}&rtt=auto`, '_blank'); setNavAnchor(null); }}>
            <ListItemIcon><NavigationIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Yandex Navigasyon</ListItemText>
          </MenuItem>,
        ]}
      </Menu>
    </Box>
  );
}

// Harita bileseni -- Azure Maps
function MapDialogContent({ listings, userLoc, onSelect, selectedId }: {
  listings: (RestaurantListing & { _dist?: number })[];
  userLoc: { lat: number; lng: number } | null;
  onSelect: (l: RestaurantListing) => void;
  selectedId?: string;
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<atlas.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;
    const map = new atlas.Map(mapContainerRef.current, {
      center: userLoc ? [userLoc.lng, userLoc.lat] : [32.8, 39.9],
      zoom: userLoc ? 13 : 6,
      style: 'satellite_road_labels',
      language: 'tr-TR',
      authOptions: { authType: atlas.AuthenticationType.subscriptionKey, subscriptionKey: AZURE_KEY },
      showFeedbackLink: false, showLogo: false,
    });
    mapInstanceRef.current = map;

    map.events.add('ready', () => {
      map.controls.add([
        new atlas.control.ZoomControl(),
        new atlas.control.StyleControl({ mapStyles: ['road', 'satellite', 'satellite_road_labels', 'grayscale_dark'] }),
      ], { position: atlas.ControlPosition.TopRight });

      // Kullanici konumu
      if (userLoc) {
        const userMarker = new atlas.HtmlMarker({
          position: [userLoc.lng, userLoc.lat],
          htmlContent: `<div style="position:relative;width:24px;height:24px;">
            <div style="position:absolute;inset:0;border-radius:50%;background:rgba(230,81,0,0.25);animation:pulse 2s ease-out infinite;"></div>
            <div style="position:absolute;top:4px;left:4px;width:16px;height:16px;border-radius:50%;background:#e65100;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>
          </div><style>@keyframes pulse{0%{transform:scale(1);opacity:1}100%{transform:scale(3);opacity:0}}</style>`,
          anchor: 'center',
        });
        map.markers.add(userMarker);
        map.setCamera({ center: [userLoc.lng, userLoc.lat], zoom: 13, type: 'fly', duration: 1500 });
      }

      // Restoran pinleri
      listings.forEach((l) => {
        const marker = new atlas.HtmlMarker({
          position: [l.longitude, l.latitude],
          htmlContent: `<div style="background:#e65100;color:#fff;padding:3px 10px;border-radius:10px;font-size:12px;font-weight:700;white-space:nowrap;border:2px solid #fff;box-shadow:0 2px 12px rgba(0,0,0,0.25);cursor:pointer;">\uD83C\uDF7D\uFE0F ${l.rating} \u2605</div>`,
          anchor: 'bottom',
        });
        map.events.add('click', marker, () => {
          onSelect(l);
          const popup = new atlas.Popup({
            position: [l.longitude, l.latitude],
            pixelOffset: [0, -20],
            content: `<div style="min-width:200px;font-family:'DM Sans',sans-serif;padding:8px 10px;">
              <img src="${l.images[0]}" style="width:100%;height:90px;object-fit:cover;border-radius:8px;margin-bottom:6px" />
              <div style="font-weight:700;font-size:13px;margin-bottom:2px">${l.name}</div>
              <div style="color:#e65100;font-weight:700;font-size:14px">${l.rating} \u2605 <span style="font-weight:400;font-size:11px;color:#999">(${l.reviewCount})</span></div>
              <div style="font-size:11px;color:#6b5b4e;margin-top:2px">\uD83D\uDCCD ${l.district}, ${l.city}</div>
              <div style="font-size:10px;color:#999;margin-top:2px">${l.cuisineType} \u00B7 ${l.deliveryTime} dk \u00B7 ${'\u20BA'.repeat(l.priceRange)}</div>
            </div>`,
          });
          map.popups.add(popup);
          popup.open(map);
        });
        map.markers.add(marker);
      });

      // Bounds
      if (listings.length > 0 && userLoc) {
        const positions: atlas.data.Position[] = listings.map(l => [l.longitude, l.latitude]);
        positions.push([userLoc.lng, userLoc.lat]);
        const bbox = atlas.data.BoundingBox.fromPositions(positions);
        setTimeout(() => map.setCamera({ bounds: bbox, padding: 50, maxZoom: 13, type: 'fly', duration: 1000 }), 1600);
      }
    });

    return () => { map.dispose(); mapInstanceRef.current = null; };
  }, [listings, userLoc]);

  useEffect(() => {
    if (!selectedId || !mapInstanceRef.current) return;
    const l = listings.find(li => li.id === selectedId);
    if (l) mapInstanceRef.current.setCamera({ center: [l.longitude, l.latitude], zoom: 15, type: 'fly', duration: 800 });
  }, [selectedId]);

  return <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />;
}
