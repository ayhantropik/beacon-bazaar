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
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import SpeedIcon from '@mui/icons-material/Speed';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
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

// Sahibinden.com tarzı oto ilan verileri
const BRANDS = [
  'Tümü', 'BMW', 'Mercedes', 'Audi', 'Volkswagen', 'Toyota', 'Honda',
  'Ford', 'Renault', 'Fiat', 'Hyundai', 'Kia', 'Volvo', 'Tesla', 'Peugeot',
];

const BODY_TYPES = ['Tümü', 'Sedan', 'Hatchback', 'SUV', 'Crossover', 'Station Wagon', 'Coupe', 'Cabrio', 'Minivan', 'Pick-up'];
const FUEL_TYPES = ['Tümü', 'Benzin', 'Dizel', 'Hybrid', 'Elektrik', 'LPG', 'Benzin & LPG'];
const GEAR_TYPES = ['Tümü', 'Otomatik', 'Manuel', 'Yarı Otomatik'];

const CITIES = [
  'Tüm Türkiye', 'İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya',
  'Adana', 'Konya', 'Gaziantep', 'Kayseri', 'Samsun',
];

interface CarListing {
  id: string;
  title: string;
  brand: string;
  model: string;
  year: number;
  km: number;
  fuel: string;
  gear: string;
  bodyType: string;
  color: string;
  price: number;
  city: string;
  district: string;
  latitude: number;
  longitude: number;
  date: string;
  images: string[];
  imageCount: number;
  seller: { name: string; type: 'bireysel' | 'galerici'; verified: boolean };
  isFavorite: boolean;
  hasTradeIn: boolean;
  features: string[];
}

// Demo ilanlar
function generateCarListings(): CarListing[] {
  const listings: CarListing[] = [
    { id: '1', title: 'BMW 320i M Sport', brand: 'BMW', model: '3 Serisi', year: 2023, km: 12000, fuel: 'Benzin', gear: 'Otomatik', bodyType: 'Sedan', color: 'Beyaz', price: 2850000, city: 'İstanbul', district: 'Kadıköy', latitude: 40.9828, longitude: 29.0290, date: '2026-04-02', images: ['https://picsum.photos/seed/bmw320i/600/400'], imageCount: 12, seller: { name: 'Premium Auto Gallery', type: 'galerici', verified: true }, isFavorite: false, hasTradeIn: true, features: ['Sunroof', 'Deri Koltuk', 'Navigasyon'] },
    { id: '2', title: 'Mercedes C200 AMG', brand: 'Mercedes', model: 'C Serisi', year: 2022, km: 28000, fuel: 'Benzin', gear: 'Otomatik', bodyType: 'Sedan', color: 'Siyah', price: 3200000, city: 'İstanbul', district: 'Beşiktaş', latitude: 41.0422, longitude: 29.0060, date: '2026-04-01', images: ['https://picsum.photos/seed/mercc200/600/400'], imageCount: 18, seller: { name: 'Star Motors', type: 'galerici', verified: true }, isFavorite: false, hasTradeIn: true, features: ['AMG Paket', 'Burmester', 'Head-up Display'] },
    { id: '3', title: 'Volkswagen Golf 1.5 TSI', brand: 'Volkswagen', model: 'Golf', year: 2024, km: 5000, fuel: 'Benzin', gear: 'Otomatik', bodyType: 'Hatchback', color: 'Gri', price: 1450000, city: 'Ankara', district: 'Çankaya', latitude: 39.9208, longitude: 32.8541, date: '2026-04-02', images: ['https://picsum.photos/seed/vwgolf/600/400'], imageCount: 8, seller: { name: 'Ahmet Y.', type: 'bireysel', verified: false }, isFavorite: false, hasTradeIn: false, features: ['Apple CarPlay', 'Geri Görüş Kamerası'] },
    { id: '4', title: 'Toyota Corolla 1.8 Hybrid', brand: 'Toyota', model: 'Corolla', year: 2023, km: 15000, fuel: 'Hybrid', gear: 'Otomatik', bodyType: 'Sedan', color: 'Beyaz', price: 1380000, city: 'İzmir', district: 'Bornova', latitude: 38.4623, longitude: 27.2177, date: '2026-03-30', images: ['https://picsum.photos/seed/corolla/600/400'], imageCount: 10, seller: { name: 'İzmir Toyota Plaza', type: 'galerici', verified: true }, isFavorite: false, hasTradeIn: true, features: ['Hybrid', 'Adaptif Cruise', 'LED Far'] },
    { id: '5', title: 'Audi A4 2.0 TDI Quattro', brand: 'Audi', model: 'A4', year: 2021, km: 45000, fuel: 'Dizel', gear: 'Otomatik', bodyType: 'Sedan', color: 'Lacivert', price: 2100000, city: 'İstanbul', district: 'Bakırköy', latitude: 40.9793, longitude: 28.8773, date: '2026-03-29', images: ['https://picsum.photos/seed/audia4/600/400'], imageCount: 15, seller: { name: 'Prestige Auto', type: 'galerici', verified: true }, isFavorite: false, hasTradeIn: true, features: ['Quattro', 'Matrix LED', 'Bang & Olufsen'] },
    { id: '6', title: 'Tesla Model 3 Long Range', brand: 'Tesla', model: 'Model 3', year: 2024, km: 3000, fuel: 'Elektrik', gear: 'Otomatik', bodyType: 'Sedan', color: 'Kırmızı', price: 2450000, city: 'İstanbul', district: 'Sarıyer', latitude: 41.1667, longitude: 29.0500, date: '2026-04-01', images: ['https://picsum.photos/seed/tesla3/600/400'], imageCount: 20, seller: { name: 'Murat K.', type: 'bireysel', verified: false }, isFavorite: false, hasTradeIn: false, features: ['Autopilot', 'Full Self-Driving', 'Premium Audio'] },
    { id: '7', title: 'Ford Focus 1.5 EcoBoost ST-Line', brand: 'Ford', model: 'Focus', year: 2022, km: 35000, fuel: 'Benzin', gear: 'Otomatik', bodyType: 'Hatchback', color: 'Mavi', price: 980000, city: 'Bursa', district: 'Nilüfer', latitude: 40.2127, longitude: 28.8706, date: '2026-03-28', images: ['https://picsum.photos/seed/focus/600/400'], imageCount: 9, seller: { name: 'Bursa Ford', type: 'galerici', verified: true }, isFavorite: false, hasTradeIn: true, features: ['ST-Line Paket', 'B&O Ses Sistemi'] },
    { id: '8', title: 'Hyundai Tucson 1.6 CRDI Elite', brand: 'Hyundai', model: 'Tucson', year: 2023, km: 18000, fuel: 'Dizel', gear: 'Otomatik', bodyType: 'SUV', color: 'Gümüş', price: 1750000, city: 'Antalya', district: 'Muratpaşa', latitude: 36.8969, longitude: 30.7133, date: '2026-04-02', images: ['https://picsum.photos/seed/tucson/600/400'], imageCount: 14, seller: { name: 'Antalya Hyundai', type: 'galerici', verified: true }, isFavorite: false, hasTradeIn: true, features: ['Panoramik Cam Tavan', 'Elektrikli Bagaj'] },
    { id: '9', title: 'Renault Clio 1.0 TCe Joy', brand: 'Renault', model: 'Clio', year: 2024, km: 8000, fuel: 'Benzin & LPG', gear: 'Manuel', bodyType: 'Hatchback', color: 'Beyaz', price: 720000, city: 'Konya', district: 'Selçuklu', latitude: 37.8713, longitude: 32.4846, date: '2026-03-27', images: ['https://picsum.photos/seed/clio/600/400'], imageCount: 6, seller: { name: 'Fatma A.', type: 'bireysel', verified: false }, isFavorite: false, hasTradeIn: false, features: ['LPG', 'Yol Bilgisayarı'] },
    { id: '10', title: 'Volvo XC60 T8 Inscription', brand: 'Volvo', model: 'XC60', year: 2022, km: 25000, fuel: 'Hybrid', gear: 'Otomatik', bodyType: 'SUV', color: 'Siyah', price: 3500000, city: 'İstanbul', district: 'Ataşehir', latitude: 40.9923, longitude: 29.1244, date: '2026-04-01', images: ['https://picsum.photos/seed/xc60/600/400'], imageCount: 22, seller: { name: 'Volvo Premium', type: 'galerici', verified: true }, isFavorite: false, hasTradeIn: true, features: ['Air Suspension', 'Bowers & Wilkins', '360 Kamera'] },
    { id: '11', title: 'Fiat Egea 1.4 Urban Plus', brand: 'Fiat', model: 'Egea', year: 2023, km: 22000, fuel: 'Benzin & LPG', gear: 'Manuel', bodyType: 'Sedan', color: 'Gri', price: 650000, city: 'Ankara', district: 'Yenimahalle', latitude: 39.9727, longitude: 32.8102, date: '2026-03-31', images: ['https://picsum.photos/seed/egea/600/400'], imageCount: 7, seller: { name: 'Hasan T.', type: 'bireysel', verified: false }, isFavorite: false, hasTradeIn: false, features: ['LPG', 'Cruise Control'] },
    { id: '12', title: 'Kia Sportage 1.6 T-GDI GT-Line', brand: 'Kia', model: 'Sportage', year: 2024, km: 6000, fuel: 'Benzin', gear: 'Otomatik', bodyType: 'SUV', color: 'Yeşil', price: 1900000, city: 'İstanbul', district: 'Pendik', latitude: 40.8802, longitude: 29.2335, date: '2026-04-02', images: ['https://picsum.photos/seed/sportage/600/400'], imageCount: 16, seller: { name: 'KIA Plaza Pendik', type: 'galerici', verified: true }, isFavorite: false, hasTradeIn: true, features: ['Panoramik Ekran', 'Ventilasyonlu Koltuk'] },
  ];
  return listings;
}

const ITEMS_PER_PAGE = 12;

export default function OtoListingPage() {
  const [searchParams] = useSearchParams();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showFilters, setShowFilters] = useState(true);
  const [showUserPanel, setShowUserPanel] = useState(false);

  // Filter states
  const [brand, setBrand] = useState(searchParams.get('brand') || 'Tümü');
  const [bodyType, setBodyType] = useState('Tümü');
  const [fuel, setFuel] = useState('Tümü');
  const [gear, setGear] = useState('Tümü');
  const [city, setCity] = useState('Tüm Türkiye');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minYear, setMinYear] = useState('');
  const [maxYear, setMaxYear] = useState('');
  const [maxKm, setMaxKm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [tab, setTab] = useState(0); // 0: Tümü, 1: Sıfır, 2: İkinci El
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [mapOpen, setMapOpen] = useState(false);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [locLoading, setLocLoading] = useState(false);
  const [selectedListing, setSelectedListing] = useState<CarListing | null>(null);
  const [detailListing, setDetailListing] = useState<CarListing | null>(null);
  const [navAnchor, setNavAnchor] = useState<HTMLElement | null>(null);
  const [locationLabel, setLocationLabel] = useState('');
  const mapRef = useRef<HTMLDivElement>(null);

  // Sayfa yüklendiğinde konumu tespit et
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        try {
          const res = await locationService.reverseGeocode(pos.coords.latitude, pos.coords.longitude);
          const d: any = res.data || {};
          const parts = [d.neighbourhood, d.district, d.city].filter(Boolean);
          setLocationLabel(parts.slice(0, 2).join(', '));
          const match = CITIES.find(c => c === d.city);
          if (match) setCity(match);
        } catch { /* konum alınamadı */ }
      },
      () => {},
      { enableHighAccuracy: true, timeout: 5000 },
    );
  }, []);

  const allListings = useMemo(() => generateCarListings(), []);

  const filteredListings = useMemo(() => {
    let result = [...allListings];
    if (brand !== 'Tümü') result = result.filter(l => l.brand === brand);
    if (bodyType !== 'Tümü') result = result.filter(l => l.bodyType === bodyType);
    if (fuel !== 'Tümü') result = result.filter(l => l.fuel === fuel);
    if (gear !== 'Tümü') result = result.filter(l => l.gear === gear);
    if (city !== 'Tüm Türkiye') result = result.filter(l => l.city === city);
    if (minPrice) result = result.filter(l => l.price >= Number(minPrice));
    if (maxPrice) result = result.filter(l => l.price <= Number(maxPrice));
    if (minYear) result = result.filter(l => l.year >= Number(minYear));
    if (maxYear) result = result.filter(l => l.year <= Number(maxYear));
    if (maxKm) result = result.filter(l => l.km <= Number(maxKm));
    if (tab === 1) result = result.filter(l => l.km < 100);
    if (tab === 2) result = result.filter(l => l.km >= 100);
    if (query) result = result.filter(l => l.title.toLowerCase().includes(query.toLowerCase()));

    // Sort
    if (sortBy === 'price_asc') result.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price_desc') result.sort((a, b) => b.price - a.price);
    else if (sortBy === 'year') result.sort((a, b) => b.year - a.year);
    else if (sortBy === 'km') result.sort((a, b) => a.km - b.km);
    else result.sort((a, b) => b.date.localeCompare(a.date));

    return result;
  }, [allListings, brand, bodyType, fuel, gear, city, minPrice, maxPrice, minYear, maxYear, maxKm, tab, query, sortBy]);

  const paginatedListings = filteredListings.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const totalPages = Math.ceil(filteredListings.length / ITEMS_PER_PAGE);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const formatPrice = (price: number) => price.toLocaleString('tr-TR') + ' TL';
  const formatKm = (km: number) => km.toLocaleString('tr-TR') + ' km';

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
        // Varsayılan: İstanbul merkez
        setUserLoc({ lat: 41.0082, lng: 28.9784 });
        setLocLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  // Haritada gösterilecek ilanlar — konuma yakın sıralı
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
        <Box sx={{ position: 'absolute', top: -30, right: -30, opacity: 0.06, fontSize: 200 }}>
          <DirectionsCarIcon sx={{ fontSize: 'inherit' }} />
        </Box>
        <Typography variant="h4" fontWeight={800} mb={1}>
          VeniVidi Oto
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.8, mb: 2 }}>
          Binlerce araç ilanı arasından hayalinizdeki otomobili bulun
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', maxWidth: 700 }}>
          <TextField
            size="small"
            placeholder="Marka, model veya anahtar kelime..."
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
              startAdornment: <InputAdornment position="start"><LocationOnIcon sx={{ fontSize: 20, color: locationLabel ? '#1a237e' : undefined }} /></InputAdornment>,
            }}
            helperText={locationLabel ? `📍 ${locationLabel}` : undefined}
            FormHelperTextProps={{ sx: { color: '#1a6b52', fontWeight: 600, fontSize: '0.7rem', ml: 0.5, mt: 0.3 } }}
          >
            {CITIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField>
        </Box>

        {/* Quick brand chips */}
        <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
          {['BMW', 'Mercedes', 'Audi', 'Tesla', 'Toyota', 'Volkswagen'].map(b => (
            <Chip
              key={b} label={b} size="small"
              onClick={() => { setBrand(brand === b ? 'Tümü' : b); setQuery(''); setCity('Tüm Türkiye'); setPage(1); }}
              sx={{
                bgcolor: brand === b ? '#1a6b52' : '#f5f5f5',
                color: brand === b ? '#fff' : '#2c1810',
                fontWeight: 600, fontSize: 12,
                '&:hover': { bgcolor: brand === b ? '#0e4a38' : '#e8e8e8' },
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
            <Tab label="Sıfır" />
            <Tab label="İkinci El" />
          </Tabs>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
            {filteredListings.length} ilan
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
            sx={{ minWidth: 160, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SortIcon sx={{ fontSize: 18 }} /></InputAdornment> }}
          >
            <MenuItem value="date">En Yeni İlan</MenuItem>
            <MenuItem value="price_asc">Fiyat (Düşük-Yüksek)</MenuItem>
            <MenuItem value="price_desc">Fiyat (Yüksek-Düşük)</MenuItem>
            <MenuItem value="year">Model Yılı</MenuItem>
            <MenuItem value="km">Kilometre</MenuItem>
          </TextField>
          <IconButton size="small" onClick={() => setViewMode('grid')} color={viewMode === 'grid' ? 'primary' : 'default'}>
            <GridViewIcon />
          </IconButton>
          <IconButton size="small" onClick={() => setViewMode('list')} color={viewMode === 'list' ? 'primary' : 'default'}>
            <ViewListIcon />
          </IconButton>
          <Button size="small" variant="outlined" startIcon={<MapIcon />} onClick={openMap} sx={{ ml: 0.5, textTransform: 'none', borderRadius: 2 }}>
            Haritada Gör
          </Button>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          <Button
            size="small"
            variant={showUserPanel ? 'contained' : 'outlined'}
            startIcon={<AccountCircleIcon />}
            onClick={() => setShowUserPanel(true)}
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Hesabım
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
        <UserPanel context="oto" onClose={() => setShowUserPanel(false)} />
      </Drawer>

      <Grid container spacing={2}>
        {/* Filters Sidebar */}
        {showFilters && (
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2, borderRadius: 2, position: 'sticky', top: 120 }}>
              <Typography variant="subtitle2" fontWeight={700} mb={1.5}>Detaylı Arama</Typography>

              <TextField select fullWidth size="small" label="Marka" value={brand} onChange={(e) => setBrand(e.target.value)} sx={{ mb: 1.5 }}>
                {BRANDS.map(b => <MenuItem key={b} value={b}>{b}</MenuItem>)}
              </TextField>

              <TextField select fullWidth size="small" label="Kasa Tipi" value={bodyType} onChange={(e) => setBodyType(e.target.value)} sx={{ mb: 1.5 }}>
                {BODY_TYPES.map(b => <MenuItem key={b} value={b}>{b}</MenuItem>)}
              </TextField>

              <TextField select fullWidth size="small" label="Yakıt" value={fuel} onChange={(e) => setFuel(e.target.value)} sx={{ mb: 1.5 }}>
                {FUEL_TYPES.map(f => <MenuItem key={f} value={f}>{f}</MenuItem>)}
              </TextField>

              <TextField select fullWidth size="small" label="Vites" value={gear} onChange={(e) => setGear(e.target.value)} sx={{ mb: 1.5 }}>
                {GEAR_TYPES.map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
              </TextField>

              <Divider sx={{ my: 1.5 }} />
              <Typography variant="caption" fontWeight={600} color="text.secondary">Fiyat Aralığı (TL)</Typography>
              <Box display="flex" gap={1} mt={0.5} mb={1.5}>
                <TextField size="small" placeholder="Min" type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
                <TextField size="small" placeholder="Max" type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
              </Box>

              <Typography variant="caption" fontWeight={600} color="text.secondary">Model Yılı</Typography>
              <Box display="flex" gap={1} mt={0.5} mb={1.5}>
                <TextField size="small" placeholder="Min" type="number" value={minYear} onChange={(e) => setMinYear(e.target.value)} />
                <TextField size="small" placeholder="Max" type="number" value={maxYear} onChange={(e) => setMaxYear(e.target.value)} />
              </Box>

              <TextField
                fullWidth size="small" label="Maks. Kilometre" type="number"
                value={maxKm} onChange={(e) => setMaxKm(e.target.value)} sx={{ mb: 2 }}
              />

              <Button
                fullWidth variant="contained" size="medium"
                startIcon={<SearchIcon />}
                onClick={() => { setPage(1); }}
                sx={{ borderRadius: 2, textTransform: 'none', py: 1.2, fontWeight: 700 }}
              >
                Ara
              </Button>
              <Button
                fullWidth variant="text" size="small"
                onClick={() => { setBrand('Tümü'); setBodyType('Tümü'); setFuel('Tümü'); setGear('Tümü'); setCity('Tüm Türkiye'); setMinPrice(''); setMaxPrice(''); setMinYear(''); setMaxYear(''); setMaxKm(''); setQuery(''); }}
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
              <DirectionsCarIcon sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">Aramanıza uygun ilan bulunamadı</Typography>
              <Typography variant="body2" color="text.secondary">Filtrelerinizi değiştirmeyi deneyin</Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: viewMode === 'list' ? 1.5 : 0 }}>
              {viewMode === 'list' ? (
                // LIST VIEW
                paginatedListings.map((car) => (
                  <Card key={car.id} onClick={() => setDetailListing(car)} sx={{
                    display: 'flex', cursor: 'pointer', transition: 'all 0.2s', borderRadius: 2, overflow: 'hidden',
                    border: '1px solid', borderColor: 'divider',
                    '&:hover': { boxShadow: 4, borderColor: 'primary.light' },
                  }}>
                    {/* Image */}
                    <Box sx={{ position: 'relative', width: { xs: 140, sm: 220, md: 280 }, flexShrink: 0 }}>
                      <CardMedia
                        component="img" image={car.images[0]} alt={car.title}
                        sx={{ height: '100%', minHeight: 160, objectFit: 'cover' }}
                      />
                      <Box sx={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 0.5 }}>
                        {car.seller.verified && (
                          <Chip icon={<VerifiedIcon sx={{ fontSize: 14 }} />} label="Güvenli" size="small"
                            sx={{ bgcolor: 'rgba(25,118,210,0.9)', color: '#fff', height: 22, fontSize: 11, fontWeight: 600 }} />
                        )}
                      </Box>
                      <Box sx={{ position: 'absolute', bottom: 8, left: 8, display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: 'rgba(0,0,0,0.6)', color: '#fff', borderRadius: 1, px: 0.8, py: 0.3 }}>
                        <PhotoCameraIcon sx={{ fontSize: 14 }} />
                        <Typography variant="caption" fontWeight={600}>{car.imageCount}</Typography>
                      </Box>
                      <IconButton
                        size="small"
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(car.id); }}
                        sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(255,255,255,0.9)', '&:hover': { bgcolor: '#fff' } }}
                      >
                        {favorites.has(car.id) ? <FavoriteIcon sx={{ fontSize: 18, color: 'error.main' }} /> : <FavoriteBorderIcon sx={{ fontSize: 18 }} />}
                      </IconButton>
                    </Box>

                    {/* Content */}
                    <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', py: 1.5, px: 2 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                        <Box>
                          <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.3 }}>{car.title}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {car.seller.type === 'galerici' ? car.seller.name : `${car.seller.name} (Bireysel)`}
                          </Typography>
                        </Box>
                        <Box textAlign="right">
                          <Typography variant="h6" fontWeight={800} color="#1a237e" sx={{ lineHeight: 1.2 }}>
                            {formatPrice(car.price)}
                          </Typography>
                          {car.hasTradeIn && (
                            <Chip label="Takas" size="small" sx={{ mt: 0.5, height: 20, fontSize: 10, fontWeight: 700, bgcolor: '#e8f5e9', color: '#2e7d32' }} />
                          )}
                        </Box>
                      </Box>

                      {/* Specs */}
                      <Box sx={{ display: 'flex', gap: 2, mt: 1.5, flexWrap: 'wrap' }}>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <CalendarMonthIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">{car.year}</Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <SpeedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">{formatKm(car.km)}</Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <LocalGasStationIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">{car.fuel}</Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">{car.gear}</Typography>
                        <Typography variant="body2" color="text.secondary">{car.color}</Typography>
                      </Box>

                      {/* Features */}
                      <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
                        {car.features.slice(0, 4).map(f => (
                          <Chip key={f} label={f} size="small" variant="outlined" sx={{ height: 22, fontSize: 11 }} />
                        ))}
                      </Box>

                      {/* Location & Date */}
                      <Box sx={{ mt: 'auto', pt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <LocationOnIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">{car.city}, {car.district}</Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(car.date).toLocaleDateString('tr-TR')}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                ))
              ) : (
                // GRID VIEW
                <Grid container spacing={2}>
                  {paginatedListings.map((car) => (
                    <Grid item xs={6} sm={4} md={showFilters ? 4 : 3} key={car.id}>
                      <Card onClick={() => setDetailListing(car)} sx={{
                        cursor: 'pointer', transition: 'all 0.2s', borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column',
                        border: '1px solid', borderColor: 'divider',
                        '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' },
                      }}>
                        <Box sx={{ position: 'relative', paddingTop: '66%' }}>
                          <CardMedia component="img" image={car.images[0]} alt={car.title}
                            sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggleFavorite(car.id); }}
                            sx={{ position: 'absolute', top: 6, right: 6, bgcolor: 'rgba(255,255,255,0.9)', p: 0.5 }}>
                            {favorites.has(car.id) ? <FavoriteIcon sx={{ fontSize: 16, color: 'error.main' }} /> : <FavoriteBorderIcon sx={{ fontSize: 16 }} />}
                          </IconButton>
                          <Box sx={{ position: 'absolute', bottom: 6, left: 6, display: 'flex', gap: 0.5 }}>
                            <Chip label={`${car.imageCount} fotoğraf`} size="small" sx={{ bgcolor: 'rgba(0,0,0,0.6)', color: '#fff', height: 20, fontSize: 10 }} />
                          </Box>
                        </Box>
                        <CardContent sx={{ flex: 1, p: 1.5, display: 'flex', flexDirection: 'column' }}>
                          <Typography variant="subtitle2" fontWeight={700} noWrap>{car.title}</Typography>
                          <Typography variant="h6" fontWeight={800} color="#1a237e" mt={0.5}>{formatPrice(car.price)}</Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 0.5, color: 'text.secondary', fontSize: 12, flexWrap: 'wrap' }}>
                            <Typography variant="caption">{car.year}</Typography>
                            <Typography variant="caption">{formatKm(car.km)}</Typography>
                            <Typography variant="caption">{car.fuel}</Typography>
                          </Box>
                          <Box sx={{ mt: 'auto', pt: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <LocationOnIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">{car.city}</Typography>
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

      {/* İlan Detay Dialog */}
      <Dialog open={!!detailListing} onClose={() => setDetailListing(null)} maxWidth="md" fullWidth>
        {detailListing && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6" fontWeight={700}>{detailListing.title}</Typography>
              <IconButton onClick={() => setDetailListing(null)}><CloseIcon /></IconButton>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mb: 2, borderRadius: 2, overflow: 'hidden' }}>
                <CardMedia component="img" image={detailListing.images[0]} alt={detailListing.title} sx={{ height: 300, objectFit: 'cover' }} />
              </Box>
              <Box display="flex" alignItems="baseline" gap={2} mb={2}>
                <Typography variant="h5" color="primary" fontWeight={800}>
                  {formatPrice(detailListing.price)}
                </Typography>
                <Chip label={detailListing.km < 100 ? 'Sıfır' : 'İkinci El'} size="small" color={detailListing.km < 100 ? 'success' : 'default'} />
              </Box>
              <Grid container spacing={2} mb={2}>
                <Grid item xs={4} sm={3}><Typography variant="caption" color="text.secondary">Marka / Model</Typography><Typography variant="body2" fontWeight={600}>{detailListing.brand} {detailListing.model}</Typography></Grid>
                <Grid item xs={4} sm={3}><Typography variant="caption" color="text.secondary">Yıl</Typography><Typography variant="body2" fontWeight={600}>{detailListing.year}</Typography></Grid>
                <Grid item xs={4} sm={3}><Typography variant="caption" color="text.secondary">Kilometre</Typography><Typography variant="body2" fontWeight={600}>{formatKm(detailListing.km)}</Typography></Grid>
                <Grid item xs={4} sm={3}><Typography variant="caption" color="text.secondary">Yakıt</Typography><Typography variant="body2" fontWeight={600}>{detailListing.fuel}</Typography></Grid>
                <Grid item xs={4} sm={3}><Typography variant="caption" color="text.secondary">Vites</Typography><Typography variant="body2" fontWeight={600}>{detailListing.gear}</Typography></Grid>
                <Grid item xs={4} sm={3}><Typography variant="caption" color="text.secondary">Kasa Tipi</Typography><Typography variant="body2" fontWeight={600}>{detailListing.bodyType}</Typography></Grid>
                <Grid item xs={4} sm={3}><Typography variant="caption" color="text.secondary">Renk</Typography><Typography variant="body2" fontWeight={600}>{detailListing.color}</Typography></Grid>
                <Grid item xs={4} sm={3}><Typography variant="caption" color="text.secondary">Takas</Typography><Typography variant="body2" fontWeight={600}>{detailListing.hasTradeIn ? 'Var' : 'Yok'}</Typography></Grid>
              </Grid>
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
                  <Typography variant="caption" color="text.secondary">{detailListing.seller.type === 'galerici' ? 'Galeri' : 'Bireysel'}</Typography>
                </Box>
                {detailListing.seller.verified && <VerifiedIcon color="primary" sx={{ fontSize: 16 }} />}
              </Box>
              <Box display="flex" gap={1}>
                <Button variant="contained" startIcon={<MapIcon />} sx={{ textTransform: 'none' }}
                  onClick={() => { setDetailListing(null); openMap(); }}>
                  Haritada Göster
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
            <MapIcon color="primary" />
            <Typography variant="h6" fontWeight={700}>Yakınındaki İlanlar</Typography>
            {userLoc && <Chip size="small" label={`${mapListings.length} ilan`} color="primary" variant="outlined" />}
          </Box>
          <IconButton onClick={() => setMapOpen(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, display: 'flex', height: '100%' }}>
          {locLoading ? (
            <Box display="flex" alignItems="center" justifyContent="center" flex={1}>
              <CircularProgress />
              <Typography ml={2} color="text.secondary">Konum alınıyor...</Typography>
            </Box>
          ) : (
            <Box display="flex" flex={1} overflow="hidden">
              {/* Harita */}
              <Box ref={mapRef} flex={1} position="relative" sx={{ minHeight: 400, '& .leaflet-container': { height: '100%', width: '100%', borderRadius: 0 } }}>
                <MapDialogContent
                  listings={mapListings}
                  userLoc={userLoc}
                  onSelect={(l) => setSelectedListing(l)}
                  selectedId={selectedListing?.id}
                />
              </Box>
              {/* Sağ panel — ilan listesi */}
              <Box sx={{ width: { xs: '100%', md: 360 }, height: '100%', overflowY: 'auto', borderLeft: '1px solid', borderColor: 'divider', display: { xs: 'none', md: 'block' } }}>
                <Box p={1.5}>
                  <Typography variant="subtitle2" fontWeight={700} mb={1}>
                    {userLoc ? 'Yakından Uzağa' : 'İlanlar'}
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
                          borderColor: selectedListing?.id === listing.id ? 'primary.main' : 'divider',
                          bgcolor: selectedListing?.id === listing.id ? 'rgba(26,107,82,0.04)' : 'transparent',
                          transition: 'all 0.15s',
                          '&:hover': { borderColor: 'primary.light' },
                        }}
                      >
                        <CardMedia component="img" image={listing.images[0]} alt={listing.title} sx={{ width: 90, height: 70, objectFit: 'cover' }} />
                        <CardContent sx={{ flex: 1, p: 1, '&:last-child': { pb: 1 } }}>
                          <Typography variant="caption" fontWeight={600} noWrap>{listing.title}</Typography>
                          <Typography variant="body2" color="primary" fontWeight={700} sx={{ fontSize: '0.8rem' }}>
                            {formatPrice(listing.price)}
                          </Typography>
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

      {/* Navigasyon Menüsü */}
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

// Harita bileşeni — Azure Maps
function MapDialogContent({ listings, userLoc, onSelect, selectedId }: {
  listings: (CarListing & { _dist?: number })[];
  userLoc: { lat: number; lng: number } | null;
  onSelect: (l: CarListing) => void;
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

      // Kullanıcı konumu
      if (userLoc) {
        const userMarker = new atlas.HtmlMarker({
          position: [userLoc.lng, userLoc.lat],
          htmlContent: `<div style="position:relative;width:24px;height:24px;">
            <div style="position:absolute;inset:0;border-radius:50%;background:rgba(26,107,82,0.25);animation:pulse 2s ease-out infinite;"></div>
            <div style="position:absolute;top:4px;left:4px;width:16px;height:16px;border-radius:50%;background:#1a6b52;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>
          </div><style>@keyframes pulse{0%{transform:scale(1);opacity:1}100%{transform:scale(3);opacity:0}}</style>`,
          anchor: 'center',
        });
        map.markers.add(userMarker);
        map.setCamera({ center: [userLoc.lng, userLoc.lat], zoom: 13, type: 'fly', duration: 1500 });
      }

      // İlan pinleri
      listings.forEach((l) => {
        const marker = new atlas.HtmlMarker({
          position: [l.longitude, l.latitude],
          htmlContent: `<div style="background:#1a6b52;color:#fff;padding:3px 10px;border-radius:10px;font-size:12px;font-weight:700;white-space:nowrap;border:2px solid #fff;box-shadow:0 2px 12px rgba(0,0,0,0.25);cursor:pointer;">🚗 ${(l.price / 1000000).toFixed(1)}M ₺</div>`,
          anchor: 'bottom',
        });
        map.events.add('click', marker, () => {
          onSelect(l);
          const popup = new atlas.Popup({
            position: [l.longitude, l.latitude],
            pixelOffset: [0, -20],
            content: `<div style="min-width:200px;font-family:'DM Sans',sans-serif;padding:8px 10px;">
              <img src="${l.images[0]}" style="width:100%;height:90px;object-fit:cover;border-radius:8px;margin-bottom:6px" />
              <div style="font-weight:700;font-size:13px;margin-bottom:2px">${l.title}</div>
              <div style="color:#1a6b52;font-weight:700;font-size:14px">${l.price.toLocaleString('tr-TR')} TL</div>
              <div style="font-size:11px;color:#6b5b4e;margin-top:2px">📍 ${l.district}, ${l.city}</div>
              <div style="font-size:10px;color:#999;margin-top:2px">${l.year} · ${l.km.toLocaleString('tr-TR')} km · ${l.fuel}</div>
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
