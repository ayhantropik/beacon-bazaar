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
import ApartmentIcon from '@mui/icons-material/Apartment';
import BedIcon from '@mui/icons-material/Bed';
import SquareFootIcon from '@mui/icons-material/SquareFoot';
import StairsIcon from '@mui/icons-material/Stairs';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import TuneIcon from '@mui/icons-material/Tune';
import SortIcon from '@mui/icons-material/Sort';
import GridViewIcon from '@mui/icons-material/GridView';
import ViewListIcon from '@mui/icons-material/ViewList';
import VerifiedIcon from '@mui/icons-material/Verified';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import BathtubIcon from '@mui/icons-material/Bathtub';
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
import LocalParkingIcon from '@mui/icons-material/LocalParking';
import { locationService } from '@services/api/location.service';
import * as atlas from 'azure-maps-control';
import 'azure-maps-control/dist/atlas.min.css';

const AZURE_KEY = import.meta.env.VITE_AZURE_MAPS_KEY || '';

const PROPERTY_TYPES = ['Tümü', 'Daire', 'Residence', 'Müstakil Ev', 'Villa', 'Çiftlik Evi', 'Yazlık', 'Kooperatif'];
const ROOM_COUNTS = ['Tümü', '1+0', '1+1', '2+1', '3+1', '3+2', '4+1', '4+2', '5+1', '5+2', '6+'];
const HEATING_TYPES = ['Tümü', 'Doğalgaz (Kombi)', 'Merkezi', 'Yerden Isıtma', 'Klima', 'Soba', 'Güneş Enerjisi'];
const BUILDING_AGES = ['Tümü', '0 (Sıfır)', '1-5', '6-10', '11-15', '16-20', '21+'];
const FLOOR_OPTIONS = ['Tümü', 'Bahçe Katı', 'Giriş Kat', '1', '2', '3', '4', '5-10', '11-20', '20+', 'Çatı Katı'];

const CITIES = [
  'Tüm Türkiye', 'İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya',
  'Adana', 'Konya', 'Gaziantep', 'Kayseri', 'Trabzon', 'Muğla',
];

const DISTRICTS: Record<string, string[]> = {
  'İstanbul': ['Tümü', 'Kadıköy', 'Beşiktaş', 'Bakırköy', 'Sarıyer', 'Ataşehir', 'Üsküdar', 'Pendik', 'Beylikdüzü', 'Başakşehir', 'Maltepe'],
  'Ankara': ['Tümü', 'Çankaya', 'Yenimahalle', 'Keçiören', 'Etimesgut', 'Mamak'],
  'İzmir': ['Tümü', 'Bornova', 'Karşıyaka', 'Bayraklı', 'Çeşme', 'Urla', 'Konak'],
};

interface PropertyListing {
  id: string;
  title: string;
  type: string;
  listingType: 'sale' | 'rent';
  rooms: string;
  grossM2: number;
  netM2: number;
  floor: string;
  totalFloors: number;
  buildingAge: string;
  heating: string;
  bathrooms: number;
  hasParking: boolean;
  hasFurnished: boolean;
  price: number;
  dues: number | null;
  city: string;
  district: string;
  neighborhood: string;
  latitude: number;
  longitude: number;
  date: string;
  images: string[];
  imageCount: number;
  seller: { name: string; type: 'bireysel' | 'emlakci'; verified: boolean };
  isFavorite: boolean;
  features: string[];
}

function generatePropertyListings(): PropertyListing[] {
  return [
    { id: '1', title: '3+1 Deniz Manzaralı Lüks Daire', type: 'Daire', listingType: 'sale', rooms: '3+1', grossM2: 145, netM2: 130, floor: '8', totalFloors: 12, buildingAge: '0 (Sıfır)', heating: 'Doğalgaz (Kombi)', bathrooms: 2, hasParking: true, hasFurnished: false, price: 8500000, dues: 2500, city: 'İstanbul', district: 'Kadıköy', neighborhood: 'Caddebostan', latitude: 40.9635, longitude: 29.0586, date: '2026-04-02', images: ['https://picsum.photos/seed/flat1/600/400'], imageCount: 24, seller: { name: 'Kadıköy Emlak', type: 'emlakci', verified: true }, isFavorite: false, features: ['Deniz Manzarası', 'Asansör', 'Otopark', 'Güvenlik'] },
    { id: '2', title: 'Boğaz Manzaralı 4+2 Villa', type: 'Villa', listingType: 'sale', rooms: '4+2', grossM2: 320, netM2: 290, floor: 'Bahçe Katı', totalFloors: 3, buildingAge: '1-5', heating: 'Yerden Isıtma', bathrooms: 4, hasParking: true, hasFurnished: true, price: 32000000, dues: null, city: 'İstanbul', district: 'Sarıyer', neighborhood: 'İstinye', latitude: 41.1128, longitude: 29.0575, date: '2026-04-01', images: ['https://picsum.photos/seed/villa1/600/400'], imageCount: 35, seller: { name: 'Prestige Gayrimenkul', type: 'emlakci', verified: true }, isFavorite: false, features: ['Boğaz Manzarası', 'Özel Havuz', 'Bahçe', 'Akıllı Ev'] },
    { id: '3', title: '2+1 Yeni Yapılmış Metro Yakını', type: 'Daire', listingType: 'sale', rooms: '2+1', grossM2: 95, netM2: 85, floor: '4', totalFloors: 10, buildingAge: '0 (Sıfır)', heating: 'Doğalgaz (Kombi)', bathrooms: 1, hasParking: true, hasFurnished: false, price: 3200000, dues: 1800, city: 'İstanbul', district: 'Ataşehir', neighborhood: 'Küçükbakkalköy', latitude: 40.9923, longitude: 29.1244, date: '2026-04-02', images: ['https://picsum.photos/seed/flat2/600/400'], imageCount: 16, seller: { name: 'Ataşehir Konut', type: 'emlakci', verified: true }, isFavorite: false, features: ['Metro Yakını', 'Otopark', 'Site İçi', 'Havuz'] },
    { id: '4', title: '1+1 Yatırımlık Residence', type: 'Residence', listingType: 'sale', rooms: '1+1', grossM2: 65, netM2: 55, floor: '15', totalFloors: 30, buildingAge: '1-5', heating: 'Merkezi', bathrooms: 1, hasParking: true, hasFurnished: true, price: 4800000, dues: 4500, city: 'İstanbul', district: 'Başakşehir', neighborhood: 'Kayabaşı', latitude: 41.1092, longitude: 28.7829, date: '2026-03-31', images: ['https://picsum.photos/seed/residence1/600/400'], imageCount: 20, seller: { name: 'Mehmet K.', type: 'bireysel', verified: false }, isFavorite: false, features: ['Concierge', 'Fitness', 'Yüzme Havuzu', 'SPA'] },
    { id: '5', title: '3+1 Merkezi Konumda Kiralık', type: 'Daire', listingType: 'rent', rooms: '3+1', grossM2: 120, netM2: 110, floor: '3', totalFloors: 8, buildingAge: '6-10', heating: 'Doğalgaz (Kombi)', bathrooms: 2, hasParking: false, hasFurnished: false, price: 28000, dues: 2000, city: 'Ankara', district: 'Çankaya', neighborhood: 'Kızılay', latitude: 39.9208, longitude: 32.8541, date: '2026-04-02', images: ['https://picsum.photos/seed/rent1/600/400'], imageCount: 12, seller: { name: 'Çankaya Emlak', type: 'emlakci', verified: true }, isFavorite: false, features: ['Merkezi Konum', 'Asansör', 'Doğalgaz'] },
    { id: '6', title: '2+1 Eşyalı Kiralık Daire', type: 'Daire', listingType: 'rent', rooms: '2+1', grossM2: 90, netM2: 80, floor: '5', totalFloors: 7, buildingAge: '11-15', heating: 'Doğalgaz (Kombi)', bathrooms: 1, hasParking: false, hasFurnished: true, price: 18000, dues: 1500, city: 'İzmir', district: 'Bornova', neighborhood: 'Merkez', latitude: 38.4623, longitude: 27.2177, date: '2026-04-01', images: ['https://picsum.photos/seed/rent2/600/400'], imageCount: 15, seller: { name: 'Ayşe N.', type: 'bireysel', verified: false }, isFavorite: false, features: ['Eşyalı', 'Klimalı', 'Balkon'] },
    { id: '7', title: '5+2 Triplex Villa Satılık', type: 'Villa', listingType: 'sale', rooms: '5+2', grossM2: 400, netM2: 360, floor: 'Bahçe Katı', totalFloors: 3, buildingAge: '1-5', heating: 'Yerden Isıtma', bathrooms: 5, hasParking: true, hasFurnished: false, price: 18500000, dues: null, city: 'Antalya', district: 'Muratpaşa', neighborhood: 'Lara', latitude: 36.8569, longitude: 30.7633, date: '2026-03-30', images: ['https://picsum.photos/seed/villa2/600/400'], imageCount: 28, seller: { name: 'Antalya Premium Emlak', type: 'emlakci', verified: true }, isFavorite: false, features: ['Özel Havuz', 'Bahçe', 'Denize Yakın', 'BBQ Alanı'] },
    { id: '8', title: 'Müstakil 2 Katlı Bahçeli Ev', type: 'Müstakil Ev', listingType: 'sale', rooms: '4+1', grossM2: 220, netM2: 195, floor: 'Giriş Kat', totalFloors: 2, buildingAge: '11-15', heating: 'Doğalgaz (Kombi)', bathrooms: 2, hasParking: true, hasFurnished: false, price: 5600000, dues: null, city: 'Bursa', district: 'Nilüfer', neighborhood: 'Beşevler', latitude: 40.2227, longitude: 28.8706, date: '2026-03-29', images: ['https://picsum.photos/seed/house1/600/400'], imageCount: 18, seller: { name: 'Osman Y.', type: 'bireysel', verified: false }, isFavorite: false, features: ['Bahçe', 'Garaj', 'Müstakil'] },
    { id: '9', title: '3+1 Site İçinde Satılık Daire', type: 'Daire', listingType: 'sale', rooms: '3+1', grossM2: 140, netM2: 125, floor: '6', totalFloors: 15, buildingAge: '0 (Sıfır)', heating: 'Merkezi', bathrooms: 2, hasParking: true, hasFurnished: false, price: 5100000, dues: 3200, city: 'İstanbul', district: 'Beylikdüzü', neighborhood: 'Yakuplu', latitude: 41.0015, longitude: 28.6444, date: '2026-04-02', images: ['https://picsum.photos/seed/flat3/600/400'], imageCount: 22, seller: { name: 'Beylikdüzü Konut', type: 'emlakci', verified: true }, isFavorite: false, features: ['Site İçi', 'Havuz', 'Otopark', 'Güvenlik'] },
    { id: '10', title: '1+1 Stüdyo Kiralık', type: 'Daire', listingType: 'rent', rooms: '1+1', grossM2: 50, netM2: 42, floor: '2', totalFloors: 5, buildingAge: '6-10', heating: 'Klima', bathrooms: 1, hasParking: false, hasFurnished: true, price: 15000, dues: 800, city: 'İstanbul', district: 'Kadıköy', neighborhood: 'Moda', latitude: 40.9795, longitude: 29.0240, date: '2026-04-01', images: ['https://picsum.photos/seed/studio1/600/400'], imageCount: 10, seller: { name: 'Moda Gayrimenkul', type: 'emlakci', verified: true }, isFavorite: false, features: ['Eşyalı', 'Deniz Manzarası', 'Merkezi Konum'] },
    { id: '11', title: 'Çeşme Yazlık 2+1 Müstakil', type: 'Yazlık', listingType: 'sale', rooms: '2+1', grossM2: 110, netM2: 95, floor: 'Giriş Kat', totalFloors: 1, buildingAge: '6-10', heating: 'Klima', bathrooms: 1, hasParking: true, hasFurnished: true, price: 7200000, dues: null, city: 'İzmir', district: 'Çeşme', neighborhood: 'Alaçatı', latitude: 38.2833, longitude: 26.3733, date: '2026-03-28', images: ['https://picsum.photos/seed/yazlik1/600/400'], imageCount: 25, seller: { name: 'Ege Emlak', type: 'emlakci', verified: true }, isFavorite: false, features: ['Bahçe', 'Havuz', 'Denize Yakın', 'Taş Ev'] },
    { id: '12', title: '4+1 Panoramik Manzaralı Penthouse', type: 'Residence', listingType: 'sale', rooms: '4+1', grossM2: 250, netM2: 220, floor: 'Çatı Katı', totalFloors: 25, buildingAge: '1-5', heating: 'Yerden Isıtma', bathrooms: 3, hasParking: true, hasFurnished: true, price: 22000000, dues: 8000, city: 'İstanbul', district: 'Beşiktaş', neighborhood: 'Levent', latitude: 41.0822, longitude: 29.0108, date: '2026-04-02', images: ['https://picsum.photos/seed/penthouse1/600/400'], imageCount: 30, seller: { name: 'Levent Gayrimenkul', type: 'emlakci', verified: true }, isFavorite: false, features: ['Teras', 'Panoramik Manzara', 'Jakuzi', 'Akıllı Ev'] },
  ];
}

const ITEMS_PER_PAGE = 12;

export default function EmlakListingPage() {
  const [searchParams] = useSearchParams();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showFilters, setShowFilters] = useState(true);
  const [showUserPanel, setShowUserPanel] = useState(false);

  // Filter states
  const [propertyType, setPropertyType] = useState(searchParams.get('type') || 'Tümü');
  const [rooms, setRooms] = useState('Tümü');
  const [heating, setHeating] = useState('Tümü');
  const [buildingAge, setBuildingAge] = useState('Tümü');
  const [floorOption, setFloorOption] = useState('Tümü');
  const [city, setCity] = useState('Tüm Türkiye');
  const [district, setDistrict] = useState('Tümü');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minM2, setMinM2] = useState('');
  const [maxM2, setMaxM2] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [tab, setTab] = useState(0); // 0: Tümü, 1: Satılık, 2: Kiralık
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [mapOpen, setMapOpen] = useState(false);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [locLoading, setLocLoading] = useState(false);
  const [selectedListing, setSelectedListing] = useState<PropertyListing | null>(null);
  const [navAnchor, setNavAnchor] = useState<HTMLElement | null>(null);
  const [locationLabel, setLocationLabel] = useState('');

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
          const match = CITIES.find((c: string) => c === d.city);
          if (match) setCity(match);
        } catch { /* konum alınamadı */ }
      },
      () => {},
      { enableHighAccuracy: true, timeout: 5000 },
    );
  }, []);
  const [detailListing, setDetailListing] = useState<PropertyListing | null>(null);

  const allListings = useMemo(() => generatePropertyListings(), []);

  const filteredListings = useMemo(() => {
    let result = [...allListings];
    if (propertyType !== 'Tümü') result = result.filter(l => l.type === propertyType);
    if (rooms !== 'Tümü') result = result.filter(l => l.rooms === rooms);
    if (heating !== 'Tümü') result = result.filter(l => l.heating === heating);
    if (city !== 'Tüm Türkiye') result = result.filter(l => l.city === city);
    if (district !== 'Tümü') result = result.filter(l => l.district === district);
    if (minPrice) result = result.filter(l => l.price >= Number(minPrice));
    if (maxPrice) result = result.filter(l => l.price <= Number(maxPrice));
    if (minM2) result = result.filter(l => l.netM2 >= Number(minM2));
    if (maxM2) result = result.filter(l => l.netM2 <= Number(maxM2));
    if (tab === 1) result = result.filter(l => l.listingType === 'sale');
    if (tab === 2) result = result.filter(l => l.listingType === 'rent');
    if (query) result = result.filter(l => l.title.toLowerCase().includes(query.toLowerCase()) || l.neighborhood.toLowerCase().includes(query.toLowerCase()));

    if (sortBy === 'price_asc') result.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price_desc') result.sort((a, b) => b.price - a.price);
    else if (sortBy === 'm2') result.sort((a, b) => b.netM2 - a.netM2);
    else if (sortBy === 'age') result.sort((a, b) => a.buildingAge.localeCompare(b.buildingAge));
    else result.sort((a, b) => b.date.localeCompare(a.date));

    return result;
  }, [allListings, propertyType, rooms, heating, city, district, minPrice, maxPrice, minM2, maxM2, tab, query, sortBy]);

  const paginatedListings = filteredListings.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const totalPages = Math.ceil(filteredListings.length / ITEMS_PER_PAGE);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const formatPrice = (price: number, type: 'sale' | 'rent') => {
    const formatted = price.toLocaleString('tr-TR') + ' TL';
    return type === 'rent' ? formatted + '/ay' : formatted;
  };

  const availableDistricts = city !== 'Tüm Türkiye' && DISTRICTS[city] ? DISTRICTS[city] : ['Tümü'];

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
      (pos) => { setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocLoading(false); },
      () => { setUserLoc({ lat: 41.0082, lng: 28.9784 }); setLocLoading(false); },
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
        <Box sx={{ position: 'absolute', top: -30, right: -30, opacity: 0.06, fontSize: 200 }}>
          <ApartmentIcon sx={{ fontSize: 'inherit' }} />
        </Box>
        <Typography variant="h4" fontWeight={800} mb={1}>
          VeniVidi Emlak
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.8, mb: 2 }}>
          Hayalinizdeki evi bulun - satılık ve kiralık emlak ilanları
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', maxWidth: 700 }}>
          <TextField
            size="small"
            placeholder="Konum, mahalle veya anahtar kelime..."
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
            select size="small" value={city}
            onChange={(e) => { setCity(e.target.value); setDistrict('Tümü'); setPage(1); }}
            sx={{
              minWidth: 180,
              '& .MuiOutlinedInput-root': {
                bgcolor: '#f5f5f5', borderRadius: 2,
                '& fieldset': { borderColor: '#e0e0e0' },
              },
            }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><LocationOnIcon sx={{ fontSize: 20, color: locationLabel ? '#b71c1c' : undefined }} /></InputAdornment>,
            }}
            helperText={locationLabel ? `📍 ${locationLabel}` : undefined}
            FormHelperTextProps={{ sx: { color: '#1a6b52', fontWeight: 600, fontSize: '0.7rem', ml: 0.5, mt: 0.3 } }}
          >
            {CITIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField>
        </Box>

        {/* Quick type chips */}
        <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
          {['Daire', 'Villa', 'Residence', 'Müstakil Ev', 'Yazlık'].map(t => (
            <Chip
              key={t} label={t} size="small"
              onClick={() => { setPropertyType(propertyType === t ? 'Tümü' : t); setQuery(''); setCity('Tüm Türkiye'); setPage(1); }}
              sx={{
                bgcolor: propertyType === t ? '#1a6b52' : '#f5f5f5',
                color: propertyType === t ? '#fff' : '#2c1810',
                fontWeight: 600, fontSize: 12,
                '&:hover': { bgcolor: propertyType === t ? '#0e4a38' : '#e8e8e8' },
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
            <Tab label="Satılık" />
            <Tab label="Kiralık" />
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
            <MenuItem value="m2">Metrekare (Büyük-Küçük)</MenuItem>
            <MenuItem value="age">Bina Yaşı</MenuItem>
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
        <UserPanel context="emlak" onClose={() => setShowUserPanel(false)} />
      </Drawer>

      <Grid container spacing={2}>
        {/* Filters Sidebar */}
        {showFilters && (
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2, borderRadius: 2, position: 'sticky', top: 120 }}>
              <Typography variant="subtitle2" fontWeight={700} mb={1.5}>Detaylı Arama</Typography>

              <TextField select fullWidth size="small" label="Emlak Tipi" value={propertyType} onChange={(e) => setPropertyType(e.target.value)} sx={{ mb: 1.5 }}>
                {PROPERTY_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>

              <TextField select fullWidth size="small" label="Oda Sayısı" value={rooms} onChange={(e) => setRooms(e.target.value)} sx={{ mb: 1.5 }}>
                {ROOM_COUNTS.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
              </TextField>

              <TextField select fullWidth size="small" label="İl" value={city} onChange={(e) => { setCity(e.target.value); setDistrict('Tümü'); }} sx={{ mb: 1.5 }}>
                {CITIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </TextField>

              {availableDistricts.length > 1 && (
                <TextField select fullWidth size="small" label="İlçe" value={district} onChange={(e) => setDistrict(e.target.value)} sx={{ mb: 1.5 }}>
                  {availableDistricts.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                </TextField>
              )}

              <TextField select fullWidth size="small" label="Isınma Tipi" value={heating} onChange={(e) => setHeating(e.target.value)} sx={{ mb: 1.5 }}>
                {HEATING_TYPES.map(h => <MenuItem key={h} value={h}>{h}</MenuItem>)}
              </TextField>

              <TextField select fullWidth size="small" label="Bina Yaşı" value={buildingAge} onChange={(e) => setBuildingAge(e.target.value)} sx={{ mb: 1.5 }}>
                {BUILDING_AGES.map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}
              </TextField>

              <TextField select fullWidth size="small" label="Kat" value={floorOption} onChange={(e) => setFloorOption(e.target.value)} sx={{ mb: 1.5 }}>
                {FLOOR_OPTIONS.map(f => <MenuItem key={f} value={f}>{f}</MenuItem>)}
              </TextField>

              <Divider sx={{ my: 1.5 }} />
              <Typography variant="caption" fontWeight={600} color="text.secondary">Fiyat Aralığı (TL)</Typography>
              <Box display="flex" gap={1} mt={0.5} mb={1.5}>
                <TextField size="small" placeholder="Min" type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
                <TextField size="small" placeholder="Max" type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
              </Box>

              <Typography variant="caption" fontWeight={600} color="text.secondary">Net m² Aralığı</Typography>
              <Box display="flex" gap={1} mt={0.5} mb={1.5}>
                <TextField size="small" placeholder="Min" type="number" value={minM2} onChange={(e) => setMinM2(e.target.value)} />
                <TextField size="small" placeholder="Max" type="number" value={maxM2} onChange={(e) => setMaxM2(e.target.value)} />
              </Box>

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
                onClick={() => { setPropertyType('Tümü'); setRooms('Tümü'); setHeating('Tümü'); setBuildingAge('Tümü'); setFloorOption('Tümü'); setCity('Tüm Türkiye'); setDistrict('Tümü'); setMinPrice(''); setMaxPrice(''); setMinM2(''); setMaxM2(''); setQuery(''); }}
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
              <ApartmentIcon sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">Aramanıza uygun ilan bulunamadı</Typography>
              <Typography variant="body2" color="text.secondary">Filtrelerinizi değiştirmeyi deneyin</Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: viewMode === 'list' ? 1.5 : 0 }}>
              {viewMode === 'list' ? (
                paginatedListings.map((prop) => (
                  <Card key={prop.id} onClick={() => setDetailListing(prop)} sx={{
                    display: 'flex', cursor: 'pointer', transition: 'all 0.2s', borderRadius: 2, overflow: 'hidden',
                    border: '1px solid', borderColor: 'divider',
                    '&:hover': { boxShadow: 4, borderColor: 'primary.light' },
                  }}>
                    {/* Image */}
                    <Box sx={{ position: 'relative', width: { xs: 140, sm: 220, md: 280 }, flexShrink: 0 }}>
                      <CardMedia
                        component="img" image={prop.images[0]} alt={prop.title}
                        sx={{ height: '100%', minHeight: 180, objectFit: 'cover' }}
                      />
                      <Box sx={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 0.5 }}>
                        <Chip
                          label={prop.listingType === 'sale' ? 'Satılık' : 'Kiralık'} size="small"
                          sx={{
                            bgcolor: prop.listingType === 'sale' ? 'rgba(183,28,28,0.9)' : 'rgba(21,101,192,0.9)',
                            color: '#fff', height: 22, fontSize: 11, fontWeight: 700,
                          }}
                        />
                        {prop.seller.verified && (
                          <Chip icon={<VerifiedIcon sx={{ fontSize: 14 }} />} label="Güvenli" size="small"
                            sx={{ bgcolor: 'rgba(25,118,210,0.9)', color: '#fff', height: 22, fontSize: 11, fontWeight: 600 }} />
                        )}
                      </Box>
                      <Box sx={{ position: 'absolute', bottom: 8, left: 8, display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: 'rgba(0,0,0,0.6)', color: '#fff', borderRadius: 1, px: 0.8, py: 0.3 }}>
                        <PhotoCameraIcon sx={{ fontSize: 14 }} />
                        <Typography variant="caption" fontWeight={600}>{prop.imageCount}</Typography>
                      </Box>
                      <IconButton
                        size="small"
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(prop.id); }}
                        sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(255,255,255,0.9)', '&:hover': { bgcolor: '#fff' } }}
                      >
                        {favorites.has(prop.id) ? <FavoriteIcon sx={{ fontSize: 18, color: 'error.main' }} /> : <FavoriteBorderIcon sx={{ fontSize: 18 }} />}
                      </IconButton>
                    </Box>

                    {/* Content */}
                    <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', py: 1.5, px: 2 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                        <Box>
                          <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.3 }}>{prop.title}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {prop.seller.type === 'emlakci' ? prop.seller.name : `${prop.seller.name} (Bireysel)`}
                          </Typography>
                        </Box>
                        <Box textAlign="right">
                          <Typography variant="h6" fontWeight={800} color="#b71c1c" sx={{ lineHeight: 1.2 }}>
                            {formatPrice(prop.price, prop.listingType)}
                          </Typography>
                          {prop.dues && (
                            <Typography variant="caption" color="text.secondary">
                              Aidat: {prop.dues.toLocaleString('tr-TR')} TL
                            </Typography>
                          )}
                        </Box>
                      </Box>

                      {/* Specs */}
                      <Box sx={{ display: 'flex', gap: 2, mt: 1.5, flexWrap: 'wrap' }}>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <BedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">{prop.rooms}</Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <SquareFootIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">{prop.grossM2}m² / {prop.netM2}m² net</Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <StairsIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">{prop.floor}. Kat / {prop.totalFloors}</Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <CalendarMonthIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">{prop.buildingAge} yıl</Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <BathtubIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">{prop.bathrooms} banyo</Typography>
                        </Box>
                        {prop.hasParking && (
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <LocalParkingIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">Otopark</Typography>
                          </Box>
                        )}
                      </Box>

                      {/* Features */}
                      <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
                        {prop.features.slice(0, 4).map(f => (
                          <Chip key={f} label={f} size="small" variant="outlined" sx={{ height: 22, fontSize: 11 }} />
                        ))}
                        {prop.hasFurnished && (
                          <Chip label="Eşyalı" size="small" sx={{ height: 22, fontSize: 11, bgcolor: '#fff3e0', color: '#e65100', fontWeight: 600 }} />
                        )}
                      </Box>

                      {/* Location & Date */}
                      <Box sx={{ mt: 'auto', pt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <LocationOnIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">{prop.city}, {prop.district} / {prop.neighborhood}</Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(prop.date).toLocaleDateString('tr-TR')}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                ))
              ) : (
                // GRID VIEW
                <Grid container spacing={2}>
                  {paginatedListings.map((prop) => (
                    <Grid item xs={6} sm={4} md={showFilters ? 4 : 3} key={prop.id}>
                      <Card onClick={() => setDetailListing(prop)} sx={{
                        cursor: 'pointer', transition: 'all 0.2s', borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column',
                        border: '1px solid', borderColor: 'divider',
                        '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' },
                      }}>
                        <Box sx={{ position: 'relative', paddingTop: '66%' }}>
                          <CardMedia component="img" image={prop.images[0]} alt={prop.title}
                            sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                          <Box sx={{ position: 'absolute', top: 6, left: 6 }}>
                            <Chip
                              label={prop.listingType === 'sale' ? 'Satılık' : 'Kiralık'} size="small"
                              sx={{
                                bgcolor: prop.listingType === 'sale' ? 'rgba(183,28,28,0.9)' : 'rgba(21,101,192,0.9)',
                                color: '#fff', height: 20, fontSize: 10, fontWeight: 700,
                              }}
                            />
                          </Box>
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggleFavorite(prop.id); }}
                            sx={{ position: 'absolute', top: 6, right: 6, bgcolor: 'rgba(255,255,255,0.9)', p: 0.5 }}>
                            {favorites.has(prop.id) ? <FavoriteIcon sx={{ fontSize: 16, color: 'error.main' }} /> : <FavoriteBorderIcon sx={{ fontSize: 16 }} />}
                          </IconButton>
                          <Box sx={{ position: 'absolute', bottom: 6, left: 6, display: 'flex', gap: 0.5 }}>
                            <Chip label={`${prop.imageCount} fotoğraf`} size="small" sx={{ bgcolor: 'rgba(0,0,0,0.6)', color: '#fff', height: 20, fontSize: 10 }} />
                          </Box>
                        </Box>
                        <CardContent sx={{ flex: 1, p: 1.5, display: 'flex', flexDirection: 'column' }}>
                          <Typography variant="subtitle2" fontWeight={700} noWrap>{prop.title}</Typography>
                          <Typography variant="h6" fontWeight={800} color="#b71c1c" mt={0.5}>
                            {formatPrice(prop.price, prop.listingType)}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 0.5, color: 'text.secondary', fontSize: 12, flexWrap: 'wrap' }}>
                            <Typography variant="caption">{prop.rooms}</Typography>
                            <Typography variant="caption">{prop.netM2}m²</Typography>
                            <Typography variant="caption">{prop.type}</Typography>
                          </Box>
                          <Box sx={{ mt: 'auto', pt: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <LocationOnIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">{prop.city}, {prop.district}</Typography>
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
                  {formatPrice(detailListing.price, detailListing.listingType)}
                </Typography>
                {detailListing.dues && (
                  <Typography variant="body2" color="text.secondary">Aidat: {detailListing.dues.toLocaleString('tr-TR')} TL</Typography>
                )}
              </Box>
              <Grid container spacing={2} mb={2}>
                <Grid item xs={4} sm={3}><Typography variant="caption" color="text.secondary">Oda Sayısı</Typography><Typography variant="body2" fontWeight={600}>{detailListing.rooms}</Typography></Grid>
                <Grid item xs={4} sm={3}><Typography variant="caption" color="text.secondary">Brüt / Net</Typography><Typography variant="body2" fontWeight={600}>{detailListing.grossM2}m² / {detailListing.netM2}m²</Typography></Grid>
                <Grid item xs={4} sm={3}><Typography variant="caption" color="text.secondary">Kat</Typography><Typography variant="body2" fontWeight={600}>{detailListing.floor} / {detailListing.totalFloors}</Typography></Grid>
                <Grid item xs={4} sm={3}><Typography variant="caption" color="text.secondary">Bina Yaşı</Typography><Typography variant="body2" fontWeight={600}>{detailListing.buildingAge}</Typography></Grid>
                <Grid item xs={4} sm={3}><Typography variant="caption" color="text.secondary">Isınma</Typography><Typography variant="body2" fontWeight={600}>{detailListing.heating}</Typography></Grid>
                <Grid item xs={4} sm={3}><Typography variant="caption" color="text.secondary">Banyo</Typography><Typography variant="body2" fontWeight={600}>{detailListing.bathrooms}</Typography></Grid>
                <Grid item xs={4} sm={3}><Typography variant="caption" color="text.secondary">Otopark</Typography><Typography variant="body2" fontWeight={600}>{detailListing.hasParking ? 'Var' : 'Yok'}</Typography></Grid>
                <Grid item xs={4} sm={3}><Typography variant="caption" color="text.secondary">Eşya</Typography><Typography variant="body2" fontWeight={600}>{detailListing.hasFurnished ? 'Eşyalı' : 'Boş'}</Typography></Grid>
              </Grid>
              <Box display="flex" flexWrap="wrap" gap={0.5} mb={2}>
                {detailListing.features.map(f => <Chip key={f} label={f} size="small" variant="outlined" />)}
              </Box>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <LocationOnIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {detailListing.neighborhood}, {detailListing.district} / {detailListing.city}
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <AccountCircleIcon />
                <Box>
                  <Typography variant="subtitle2" fontWeight={600}>{detailListing.seller.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {detailListing.seller.type === 'emlakci' ? 'Emlak Ofisi' : 'Bireysel'}
                  </Typography>
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
            <Typography variant="h6" fontWeight={700}>Yakınındaki Emlak İlanları</Typography>
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
              <Box flex={1} position="relative" sx={{ minHeight: 400, '& .leaflet-container': { height: '100%', width: '100%' } }}>
                <EmlakMapContent
                  listings={mapListings}
                  userLoc={userLoc}
                  onSelect={(l) => setSelectedListing(l)}
                  selectedId={selectedListing?.id}
                  formatPrice={formatPrice}
                />
              </Box>
              <Box sx={{ width: { xs: '100%', md: 360 }, height: '100%', overflowY: 'auto', borderLeft: '1px solid', borderColor: 'divider', display: { xs: 'none', md: 'block' } }}>
                <Box p={1.5}>
                  <Typography variant="subtitle2" fontWeight={700} mb={1}>Yakından Uzağa</Typography>
                  {mapListings.map((listing) => {
                    const dist = userLoc ? calcDist(userLoc.lat, userLoc.lng, listing.latitude, listing.longitude) : null;
                    return (
                      <Card
                        key={listing.id}
                        onClick={() => setSelectedListing(listing)}
                        sx={{
                          display: 'flex', mb: 1, cursor: 'pointer',
                          border: selectedListing?.id === listing.id ? '2px solid' : '1px solid',
                          borderColor: selectedListing?.id === listing.id ? 'primary.main' : 'divider',
                          bgcolor: selectedListing?.id === listing.id ? 'rgba(26,107,82,0.04)' : 'transparent',
                          transition: 'all 0.15s', '&:hover': { borderColor: 'primary.light' },
                        }}
                      >
                        <CardMedia component="img" image={listing.images[0]} alt={listing.title} sx={{ width: 90, height: 70, objectFit: 'cover' }} />
                        <CardContent sx={{ flex: 1, p: 1, '&:last-child': { pb: 1 } }}>
                          <Typography variant="caption" fontWeight={600} noWrap>{listing.title}</Typography>
                          <Typography variant="body2" color="primary" fontWeight={700} sx={{ fontSize: '0.8rem' }}>
                            {formatPrice(listing.price, listing.listingType)}
                          </Typography>
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <LocationOnIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">{listing.neighborhood}, {listing.district}</Typography>
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
function EmlakMapContent({ listings, userLoc, onSelect, selectedId, formatPrice }: {
  listings: (PropertyListing & { _dist?: number })[];
  userLoc: { lat: number; lng: number } | null;
  onSelect: (l: PropertyListing) => void;
  selectedId?: string;
  formatPrice: (p: number, t: 'sale' | 'rent') => string;
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

      listings.forEach((l) => {
        const priceLabel = l.listingType === 'rent'
          ? `${(l.price / 1000).toFixed(0)}K/ay`
          : l.price >= 1000000 ? `${(l.price / 1000000).toFixed(1)}M` : `${(l.price / 1000).toFixed(0)}K`;
        const bgColor = l.listingType === 'rent' ? '#2980b9' : '#1a6b52';
        const emoji = l.type === 'Villa' ? '🏡' : l.type === 'Müstakil Ev' ? '🏠' : '🏢';
        const marker = new atlas.HtmlMarker({
          position: [l.longitude, l.latitude],
          htmlContent: `<div style="background:${bgColor};color:#fff;padding:3px 10px;border-radius:10px;font-size:12px;font-weight:700;white-space:nowrap;border:2px solid #fff;box-shadow:0 2px 12px rgba(0,0,0,0.25);cursor:pointer;">${emoji} ${priceLabel} ₺</div>`,
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
              <div style="color:${bgColor};font-weight:700;font-size:14px">${formatPrice(l.price, l.listingType)}</div>
              <div style="font-size:11px;color:#6b5b4e;margin-top:2px">📍 ${l.neighborhood}, ${l.district}</div>
              <div style="font-size:10px;color:#999;margin-top:2px">${l.rooms} · ${l.grossM2}m² · ${l.buildingAge}</div>
            </div>`,
          });
          map.popups.add(popup);
          popup.open(map);
        });
        map.markers.add(marker);
      });

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
