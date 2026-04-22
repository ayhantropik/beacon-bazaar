import { useState, useCallback, useMemo, Fragment } from 'react';
import FloorPlanView from './FloorPlanView';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import StorefrontIcon from '@mui/icons-material/Storefront';
import BusinessIcon from '@mui/icons-material/Business';
import CloseIcon from '@mui/icons-material/Close';
import ElevatorIcon from '@mui/icons-material/Elevator';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import LocalCafeIcon from '@mui/icons-material/LocalCafe';
import MovieIcon from '@mui/icons-material/Movie';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import LocalParkingIcon from '@mui/icons-material/LocalParking';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import SpaIcon from '@mui/icons-material/Spa';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { setIndoorEnabled, setActiveFloor } from '@store/slices/mapSlice';

// Mağaza tipi → ikon + renk
const STORE_ICONS: Record<string, { icon: string; color: string; category: string }> = {
  giyim: { icon: '👕', color: '#2563eb', category: 'Giyim' },
  elektronik: { icon: '📱', color: '#7c3aed', category: 'Elektronik' },
  market: { icon: '🛒', color: '#059669', category: 'Market' },
  restoran: { icon: '🍽️', color: '#dc2626', category: 'Yeme-İçme' },
  kafe: { icon: '☕', color: '#92400e', category: 'Kafe' },
  sinema: { icon: '🎬', color: '#1e1b4b', category: 'Eğlence' },
  spor: { icon: '💪', color: '#ea580c', category: 'Spor' },
  kozmetik: { icon: '💄', color: '#db2777', category: 'Kozmetik' },
  otopark: { icon: '🅿️', color: '#6b7280', category: 'Otopark' },
  oyun: { icon: '🎮', color: '#4f46e5', category: 'Eğlence' },
  lüks: { icon: '💎', color: '#b45309', category: 'Lüks' },
  ayakkabi: { icon: '👟', color: '#0891b2', category: 'Ayakkabı' },
  default: { icon: '🏪', color: '#1a6b52', category: 'Mağaza' },
};

interface IndoorStore {
  name: string;
  type: string;
  // AVM merkez noktasına göre ofset (metre cinsinden, harita üzerinde göreceli yerleşim)
  offsetLat: number;
  offsetLng: number;
}

interface Floor {
  level: number;
  name: string;
  stores: IndoorStore[];
}

interface IndoorVenue {
  id: string;
  name: string;
  address: string;
  city: string;
  location: { latitude: number; longitude: number };
  floors: Floor[];
}

// Gerçek koordinatlarla AVM verileri
const INDOOR_VENUES: IndoorVenue[] = [
  {
    id: 'forum-istanbul',
    name: 'Forum İstanbul AVM',
    address: 'Kocatepe Mah. Paşa Cad. No:2, Bayrampaşa',
    city: 'İstanbul',
    location: { latitude: 41.0397, longitude: 28.8895 },
    floors: [
      { level: -1, name: 'Otopark', stores: [
        { name: 'Otopark A', type: 'otopark', offsetLat: -0.0003, offsetLng: -0.0004 },
        { name: 'Otopark B', type: 'otopark', offsetLat: 0.0003, offsetLng: 0.0004 },
      ]},
      { level: 0, name: 'Zemin Kat', stores: [
        { name: 'Migros', type: 'market', offsetLat: -0.0004, offsetLng: -0.0006 },
        { name: 'LC Waikiki', type: 'giyim', offsetLat: -0.0002, offsetLng: -0.0003 },
        { name: 'Koton', type: 'giyim', offsetLat: 0.0001, offsetLng: -0.0001 },
        { name: 'Mavi', type: 'giyim', offsetLat: 0.0003, offsetLng: 0.0002 },
        { name: 'Starbucks', type: 'kafe', offsetLat: -0.0001, offsetLng: 0.0004 },
        { name: 'Burger King', type: 'restoran', offsetLat: 0.0002, offsetLng: 0.0006 },
        { name: 'Gratis', type: 'kozmetik', offsetLat: 0.0004, offsetLng: -0.0005 },
        { name: 'Deichmann', type: 'ayakkabi', offsetLat: -0.0003, offsetLng: 0.0001 },
      ]},
      { level: 1, name: '1. Kat', stores: [
        { name: 'Zara', type: 'giyim', offsetLat: -0.0003, offsetLng: -0.0004 },
        { name: 'H&M', type: 'giyim', offsetLat: -0.0001, offsetLng: -0.0002 },
        { name: 'Nike', type: 'ayakkabi', offsetLat: 0.0002, offsetLng: 0.0001 },
        { name: 'Adidas', type: 'ayakkabi', offsetLat: 0.0004, offsetLng: 0.0003 },
        { name: 'MediaMarkt', type: 'elektronik', offsetLat: -0.0002, offsetLng: 0.0005 },
        { name: 'Boyner', type: 'giyim', offsetLat: 0.0001, offsetLng: -0.0005 },
        { name: 'Sephora', type: 'kozmetik', offsetLat: 0.0003, offsetLng: -0.0002 },
      ]},
      { level: 2, name: '2. Kat', stores: [
        { name: 'Cinemaximum', type: 'sinema', offsetLat: -0.0002, offsetLng: -0.0003 },
        { name: 'Food Court', type: 'restoran', offsetLat: 0.0001, offsetLng: 0.0002 },
        { name: 'Bowling', type: 'oyun', offsetLat: 0.0003, offsetLng: -0.0001 },
        { name: 'Funloft', type: 'oyun', offsetLat: -0.0001, offsetLng: 0.0004 },
      ]},
    ],
  },
  {
    id: 'cevahir-avm',
    name: 'Cevahir AVM',
    address: 'Büyükdere Cad. No:22, Şişli',
    city: 'İstanbul',
    location: { latitude: 41.0636, longitude: 28.9897 },
    floors: [
      { level: -1, name: 'Otopark', stores: [
        { name: 'Otopark', type: 'otopark', offsetLat: 0, offsetLng: 0 },
      ]},
      { level: 0, name: 'Zemin Kat', stores: [
        { name: 'Mango', type: 'giyim', offsetLat: -0.0003, offsetLng: -0.0003 },
        { name: 'Bershka', type: 'giyim', offsetLat: 0.0001, offsetLng: -0.0001 },
        { name: 'Pull&Bear', type: 'giyim', offsetLat: 0.0003, offsetLng: 0.0002 },
        { name: 'Starbucks', type: 'kafe', offsetLat: -0.0001, offsetLng: 0.0004 },
        { name: 'Watsons', type: 'kozmetik', offsetLat: 0.0002, offsetLng: -0.0004 },
      ]},
      { level: 1, name: '1. Kat', stores: [
        { name: 'Vakko', type: 'lüks', offsetLat: -0.0002, offsetLng: -0.0002 },
        { name: 'Beymen', type: 'lüks', offsetLat: 0.0002, offsetLng: 0.0001 },
        { name: 'İpekyol', type: 'giyim', offsetLat: 0, offsetLng: 0.0004 },
        { name: 'Aker', type: 'giyim', offsetLat: -0.0003, offsetLng: 0.0002 },
      ]},
      { level: 2, name: '2. Kat', stores: [
        { name: 'Apple Store', type: 'elektronik', offsetLat: -0.0001, offsetLng: -0.0002 },
        { name: 'Samsung', type: 'elektronik', offsetLat: 0.0002, offsetLng: 0.0001 },
        { name: 'Teknosa', type: 'elektronik', offsetLat: 0, offsetLng: 0.0004 },
      ]},
      { level: 3, name: '3. Kat', stores: [
        { name: 'Mars Cinema', type: 'sinema', offsetLat: -0.0002, offsetLng: 0 },
        { name: 'Food Court', type: 'restoran', offsetLat: 0.0002, offsetLng: 0.0002 },
        { name: 'MAC Fitness', type: 'spor', offsetLat: 0, offsetLng: -0.0003 },
      ]},
    ],
  },
  {
    id: 'istinye-park',
    name: 'İstinye Park',
    address: 'İstinye Bayırı Cad. No:73, Sarıyer',
    city: 'İstanbul',
    location: { latitude: 41.1147, longitude: 29.0590 },
    floors: [
      { level: -1, name: 'Otopark', stores: [
        { name: 'Otopark', type: 'otopark', offsetLat: 0, offsetLng: 0 },
      ]},
      { level: 0, name: 'Zemin Kat', stores: [
        { name: 'Louis Vuitton', type: 'lüks', offsetLat: -0.0002, offsetLng: -0.0003 },
        { name: 'Gucci', type: 'lüks', offsetLat: 0.0001, offsetLng: -0.0001 },
        { name: 'Dior', type: 'lüks', offsetLat: 0.0003, offsetLng: 0.0002 },
        { name: 'Harvey Nichols', type: 'lüks', offsetLat: -0.0001, offsetLng: 0.0004 },
      ]},
      { level: 1, name: '1. Kat', stores: [
        { name: 'Zara', type: 'giyim', offsetLat: -0.0003, offsetLng: -0.0002 },
        { name: 'Massimo Dutti', type: 'giyim', offsetLat: 0.0002, offsetLng: 0.0001 },
        { name: 'COS', type: 'giyim', offsetLat: 0, offsetLng: 0.0004 },
        { name: 'Wagamama', type: 'restoran', offsetLat: 0.0003, offsetLng: -0.0003 },
      ]},
      { level: 2, name: '2. Kat', stores: [
        { name: 'Cinemaximum', type: 'sinema', offsetLat: -0.0001, offsetLng: -0.0002 },
        { name: 'Eataly', type: 'restoran', offsetLat: 0.0002, offsetLng: 0.0003 },
        { name: 'Starbucks Reserve', type: 'kafe', offsetLat: -0.0002, offsetLng: 0.0001 },
      ]},
    ],
  },
  {
    id: 'kentpark-ankara',
    name: 'Kentpark AVM',
    address: 'Mustafa Kemal Mah. Dumlupınar Bulvarı No:3, Çankaya',
    city: 'Ankara',
    location: { latitude: 39.9107, longitude: 32.7636 },
    floors: [
      { level: 0, name: 'Zemin Kat', stores: [
        { name: 'Migros', type: 'market', offsetLat: -0.0003, offsetLng: -0.0003 },
        { name: 'Koton', type: 'giyim', offsetLat: 0.0001, offsetLng: 0.0001 },
        { name: 'DeFacto', type: 'giyim', offsetLat: 0.0003, offsetLng: -0.0002 },
        { name: 'Kahve Dünyası', type: 'kafe', offsetLat: -0.0001, offsetLng: 0.0003 },
      ]},
      { level: 1, name: '1. Kat', stores: [
        { name: 'LC Waikiki', type: 'giyim', offsetLat: -0.0002, offsetLng: -0.0002 },
        { name: 'Mavi', type: 'giyim', offsetLat: 0.0002, offsetLng: 0.0001 },
        { name: 'Nike', type: 'ayakkabi', offsetLat: 0, offsetLng: 0.0004 },
        { name: 'Flormar', type: 'kozmetik', offsetLat: -0.0003, offsetLng: 0.0002 },
      ]},
      { level: 2, name: '2. Kat', stores: [
        { name: 'Cinemaximum', type: 'sinema', offsetLat: -0.0001, offsetLng: 0 },
        { name: 'Food Court', type: 'restoran', offsetLat: 0.0002, offsetLng: 0.0002 },
        { name: 'KFC', type: 'restoran', offsetLat: -0.0002, offsetLng: 0.0003 },
      ]},
    ],
  },
  {
    id: 'zorlu-center',
    name: 'Zorlu Center',
    address: 'Levazım Mah. Koru Sok. No:2, Beşiktaş',
    city: 'İstanbul',
    location: { latitude: 41.0672, longitude: 29.0165 },
    floors: [
      { level: -1, name: 'Alt Kat', stores: [
        { name: 'Otopark', type: 'otopark', offsetLat: 0, offsetLng: 0 },
      ]},
      { level: 0, name: 'Zemin Kat', stores: [
        { name: 'Apple Store', type: 'elektronik', offsetLat: -0.0002, offsetLng: -0.0003 },
        { name: 'Beymen', type: 'lüks', offsetLat: 0.0001, offsetLng: 0.0002 },
        { name: '%100 Café', type: 'kafe', offsetLat: 0.0003, offsetLng: -0.0001 },
        { name: 'Vakko', type: 'lüks', offsetLat: -0.0001, offsetLng: 0.0004 },
      ]},
      { level: 1, name: '1. Kat', stores: [
        { name: 'Zara', type: 'giyim', offsetLat: -0.0003, offsetLng: -0.0002 },
        { name: 'Massimo Dutti', type: 'giyim', offsetLat: 0.0002, offsetLng: 0.0001 },
        { name: 'The North Face', type: 'ayakkabi', offsetLat: 0, offsetLng: 0.0004 },
      ]},
      { level: 2, name: '2. Kat', stores: [
        { name: 'PSM (Performans Sanatları)', type: 'sinema', offsetLat: -0.0001, offsetLng: 0 },
        { name: 'Food Hall', type: 'restoran', offsetLat: 0.0002, offsetLng: 0.0003 },
      ]},
    ],
  },
  {
    id: 'akasya-avm',
    name: 'Akasya AVM',
    address: 'Acıbadem Mah. Çeçen Sok. No:25, Üsküdar',
    city: 'İstanbul',
    location: { latitude: 41.0035, longitude: 29.0455 },
    floors: [
      { level: 0, name: 'Zemin Kat', stores: [
        { name: 'Carrefour', type: 'market', offsetLat: -0.0003, offsetLng: -0.0004 },
        { name: 'Mango', type: 'giyim', offsetLat: 0.0001, offsetLng: 0.0002 },
        { name: 'Espresso Lab', type: 'kafe', offsetLat: 0.0003, offsetLng: -0.0001 },
      ]},
      { level: 1, name: '1. Kat', stores: [
        { name: 'H&M', type: 'giyim', offsetLat: -0.0002, offsetLng: -0.0002 },
        { name: 'Skechers', type: 'ayakkabi', offsetLat: 0.0002, offsetLng: 0.0003 },
        { name: 'Sephora', type: 'kozmetik', offsetLat: 0, offsetLng: -0.0003 },
      ]},
      { level: 2, name: '2. Kat', stores: [
        { name: 'Cinemaximum', type: 'sinema', offsetLat: -0.0001, offsetLng: 0 },
        { name: 'Food Court', type: 'restoran', offsetLat: 0.0002, offsetLng: 0.0002 },
      ]},
    ],
  },
  {
    id: 'optimum-izmir',
    name: 'Optimum AVM',
    address: 'Caher Dudayev Bulvarı No:124, Bayraklı',
    city: 'İzmir',
    location: { latitude: 38.4350, longitude: 27.1560 },
    floors: [
      { level: 0, name: 'Zemin Kat', stores: [
        { name: 'Migros', type: 'market', offsetLat: -0.0003, offsetLng: -0.0003 },
        { name: 'LC Waikiki', type: 'giyim', offsetLat: 0.0001, offsetLng: 0.0002 },
        { name: 'Burger King', type: 'restoran', offsetLat: 0.0003, offsetLng: -0.0001 },
      ]},
      { level: 1, name: '1. Kat', stores: [
        { name: 'MediaMarkt', type: 'elektronik', offsetLat: -0.0002, offsetLng: -0.0002 },
        { name: 'Nike', type: 'ayakkabi', offsetLat: 0.0002, offsetLng: 0.0001 },
        { name: 'Gratis', type: 'kozmetik', offsetLat: 0, offsetLng: 0.0004 },
      ]},
      { level: 2, name: '2. Kat', stores: [
        { name: 'Cinemaximum', type: 'sinema', offsetLat: 0, offsetLng: 0 },
        { name: 'Food Court', type: 'restoran', offsetLat: 0.0002, offsetLng: 0.0002 },
      ]},
    ],
  },
];

interface IndoorMapOverlayProps {
  onVenueSelect?: (venue: IndoorVenue) => void;
  onFlyTo?: (lat: number, lng: number, zoom?: number) => void;
  onShowStoreMarkers?: (markers: Array<{ lat: number; lng: number; name: string; icon: string; color: string; category: string }>) => void;
  onClearMarkers?: () => void;
  onStoreClick?: (storeName: string) => void;
}

export default function IndoorMapOverlay({ onVenueSelect, onFlyTo, onShowStoreMarkers, onClearMarkers, onStoreClick }: IndoorMapOverlayProps) {
  const dispatch = useAppDispatch();
  const { indoorEnabled, activeFloor } = useAppSelector((state) => state.map);
  const [expanded, setExpanded] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<IndoorVenue | null>(null);
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFloorPlan, setShowFloorPlan] = useState(false);

  const filteredVenues = useMemo(() => {
    if (!searchQuery.trim()) return INDOOR_VENUES;
    const q = searchQuery.toLowerCase();
    return INDOOR_VENUES.filter(v =>
      v.name.toLowerCase().includes(q) ||
      v.city.toLowerCase().includes(q) ||
      v.address.toLowerCase().includes(q) ||
      v.floors.some(f => f.stores.some(s => s.name.toLowerCase().includes(q)))
    );
  }, [searchQuery]);

  const updateMarkers = useCallback((venue: IndoorVenue, floorLevel: number) => {
    const floor = venue.floors.find(f => f.level === floorLevel);
    if (!floor || !onShowStoreMarkers) return;

    const markers = floor.stores.map(store => {
      const info = STORE_ICONS[store.type] || STORE_ICONS.default;
      return {
        lat: venue.location.latitude + store.offsetLat,
        lng: venue.location.longitude + store.offsetLng,
        name: store.name,
        icon: info.icon,
        color: info.color,
        category: info.category,
      };
    });
    onShowStoreMarkers(markers);
  }, [onShowStoreMarkers]);

  const handleVenueClick = (venue: IndoorVenue) => {
    setSelectedVenue(venue);
    setSelectedStore(null);
    setShowFloorPlan(true);
    dispatch(setIndoorEnabled(true));
    dispatch(setActiveFloor(0));
    onVenueSelect?.(venue);
    onFlyTo?.(venue.location.latitude, venue.location.longitude, 18);
    updateMarkers(venue, 0);
  };

  const handleFloorChange = (level: number) => {
    dispatch(setActiveFloor(level));
    if (selectedVenue) updateMarkers(selectedVenue, level);
    setSelectedStore(null);
  };

  const handleStoreClick = (store: IndoorStore) => {
    setSelectedStore(store.name);
    if (selectedVenue) {
      onFlyTo?.(
        selectedVenue.location.latitude + store.offsetLat,
        selectedVenue.location.longitude + store.offsetLng,
        20,
      );
    }
    // DB'den mağaza ara ve ürün panelini aç
    onStoreClick?.(store.name);
  };

  const handleClose = () => {
    setSelectedVenue(null);
    setSelectedStore(null);
    setShowFloorPlan(false);
    dispatch(setIndoorEnabled(false));
    onClearMarkers?.();
  };

  const getCategoryIcon = (type: string) => {
    switch (type) {
      case 'restoran': return <RestaurantIcon sx={{ fontSize: 16 }} />;
      case 'kafe': return <LocalCafeIcon sx={{ fontSize: 16 }} />;
      case 'sinema': case 'oyun': return <MovieIcon sx={{ fontSize: 16 }} />;
      case 'spor': return <FitnessCenterIcon sx={{ fontSize: 16 }} />;
      case 'otopark': return <LocalParkingIcon sx={{ fontSize: 16 }} />;
      case 'elektronik': return <PhoneAndroidIcon sx={{ fontSize: 16 }} />;
      case 'kozmetik': return <SpaIcon sx={{ fontSize: 16 }} />;
      case 'giyim': case 'ayakkabi': case 'lüks': return <ShoppingBagIcon sx={{ fontSize: 16 }} />;
      default: return <StorefrontIcon sx={{ fontSize: 16 }} />;
    }
  };

  // AVM seçilmemişken — AVM listesi
  if (!indoorEnabled && !selectedVenue) {
    return (
      <Box sx={{ position: 'absolute', bottom: 16, left: 16, zIndex: 1100 }}>
        <Tooltip title="AVM İç Haritası" placement="right">
          <Button
            variant="contained"
            startIcon={<BusinessIcon />}
            onClick={() => setExpanded(!expanded)}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              bgcolor: '#1a6b52',
              fontWeight: 700,
              boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
              '&:hover': { bgcolor: '#0e4a38' },
            }}
          >
            AVM İç Harita
          </Button>
        </Tooltip>
        <Collapse in={expanded}>
          <Paper elevation={4} sx={{ mt: 1, borderRadius: 2, overflow: 'hidden', maxWidth: 320 }}>
            <Box sx={{ p: 1.5, background: 'linear-gradient(135deg, #1a6b52, #0e4a38)', color: '#fff' }}>
              <Typography variant="subtitle2" fontWeight={700}>
                <BusinessIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                AVM Ara
              </Typography>
            </Box>
            <Box sx={{ px: 1.5, pt: 1.5, pb: 0.5 }}>
              <TextField
                size="small"
                fullWidth
                placeholder="AVM, mağaza veya şehir ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment>,
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.85rem' } }}
              />
            </Box>
            <List dense sx={{ maxHeight: 350, overflowY: 'auto', p: 0.5 }}>
              {filteredVenues.length === 0 && (
                <Box px={2} py={1.5}>
                  <Typography variant="caption" color="text.secondary">Sonuç bulunamadı</Typography>
                </Box>
              )}
              {filteredVenues.map((venue) => {
                const totalStores = venue.floors.reduce((sum, f) => sum + f.stores.filter(s => s.type !== 'otopark').length, 0);
                return (
                  <ListItem
                    key={venue.id}
                    component="div"
                    onClick={() => handleVenueClick(venue)}
                    sx={{
                      cursor: 'pointer',
                      borderRadius: 1.5,
                      mb: 0.3,
                      '&:hover': { bgcolor: 'rgba(26,107,82,0.08)' },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <BusinessIcon sx={{ color: '#1a6b52' }} fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={venue.name}
                      secondary={
                        <>
                          <Typography component="span" variant="caption" display="block" color="text.secondary">
                            {venue.address}, {venue.city}
                          </Typography>
                          <Typography component="span" variant="caption" color="primary" fontWeight={600}>
                            {venue.floors.length} kat · {totalStores} mağaza
                          </Typography>
                        </>
                      }
                      primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                    />
                  </ListItem>
                );
              })}
            </List>
          </Paper>
        </Collapse>
      </Box>
    );
  }

  // Indoor mode — kat planı + mağaza listesi
  const currentFloor = selectedVenue?.floors.find(f => f.level === activeFloor);

  return (
    <Fragment>
      {/* Kat planı overlay */}
      {showFloorPlan && selectedVenue && (
        <FloorPlanView
          venueName={selectedVenue.name}
          floors={selectedVenue.floors}
          activeFloor={activeFloor}
          onFloorChange={handleFloorChange}
          onStoreClick={handleStoreClick}
          onClose={() => setShowFloorPlan(false)}
          selectedStore={selectedStore}
        />
      )}
    <Box sx={{ position: 'absolute', bottom: 16, left: 16, zIndex: 1100, width: 320, maxHeight: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column' }}>
      <Paper elevation={6} sx={{ borderRadius: 2, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '100%' }}>
        {/* Başlık */}
        <Box sx={{ p: 1.5, background: 'linear-gradient(135deg, #1a6b52, #0e4a38)', color: '#fff', flexShrink: 0 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={1}>
              <BusinessIcon fontSize="small" />
              <Box>
                <Typography variant="subtitle2" fontWeight={700} lineHeight={1.2}>{selectedVenue?.name}</Typography>
                <Typography variant="caption" sx={{ opacity: 0.8, fontSize: '0.65rem' }}>
                  Bina İçi Harita
                </Typography>
              </Box>
            </Box>
            <Chip
              label={showFloorPlan ? 'Planı Gizle' : 'Kat Planı'}
              size="small"
              onClick={() => setShowFloorPlan(!showFloorPlan)}
              sx={{ bgcolor: showFloorPlan ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 600, fontSize: '0.65rem', height: 22, cursor: 'pointer', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
            />
            <IconButton size="small" onClick={handleClose} sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.15)', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }}>
              <CloseIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
        </Box>

        {/* Kat Seçici */}
        <Box sx={{ px: 1.5, pt: 1.5, pb: 1, flexShrink: 0, bgcolor: '#f8f9fa' }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600} display="flex" alignItems="center" gap={0.5} mb={0.5}>
            <ElevatorIcon sx={{ fontSize: 14 }} />
            Kat Seçimi
          </Typography>
          <Box display="flex" gap={0.5} flexWrap="wrap">
            {selectedVenue?.floors.map((floor) => (
              <Chip
                key={floor.level}
                label={floor.name}
                size="small"
                variant={activeFloor === floor.level ? 'filled' : 'outlined'}
                color={activeFloor === floor.level ? 'primary' : 'default'}
                onClick={() => handleFloorChange(floor.level)}
                sx={{
                  cursor: 'pointer',
                  fontWeight: activeFloor === floor.level ? 700 : 400,
                  fontSize: '0.72rem',
                  transition: 'all 0.15s',
                }}
              />
            ))}
          </Box>
        </Box>

        <Divider />

        {/* Mağaza Listesi */}
        <Box sx={{ overflowY: 'auto', flexGrow: 1 }}>
          {currentFloor && (
            <Box p={1}>
              <Typography variant="caption" color="text.secondary" fontWeight={600} display="flex" alignItems="center" gap={0.5} mb={0.5}>
                <StorefrontIcon sx={{ fontSize: 14 }} />
                {currentFloor.name} — {currentFloor.stores.length} mağaza
              </Typography>
              <List dense sx={{ p: 0 }}>
                {currentFloor.stores.map((store) => {
                  const info = STORE_ICONS[store.type] || STORE_ICONS.default;
                  const isSelected = selectedStore === store.name;
                  return (
                    <ListItem
                      key={store.name}
                      component="div"
                      onClick={() => handleStoreClick(store)}
                      sx={{
                        cursor: 'pointer',
                        borderRadius: 1.5,
                        mb: 0.3,
                        border: isSelected ? '2px solid' : '1px solid transparent',
                        borderColor: isSelected ? 'primary.main' : 'transparent',
                        bgcolor: isSelected ? 'rgba(26,107,82,0.06)' : 'transparent',
                        transition: 'all 0.15s',
                        '&:hover': { bgcolor: 'rgba(26,107,82,0.04)' },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <Box sx={{
                          width: 26, height: 26, borderRadius: '8px',
                          bgcolor: info.color + '15',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 14,
                        }}>
                          {info.icon}
                        </Box>
                      </ListItemIcon>
                      <ListItemText
                        primary={store.name}
                        secondary={info.category}
                        primaryTypographyProps={{ variant: 'body2', fontWeight: isSelected ? 700 : 500, fontSize: '0.8rem' }}
                        secondaryTypographyProps={{ variant: 'caption', fontSize: '0.65rem' }}
                      />
                      {getCategoryIcon(store.type)}
                    </ListItem>
                  );
                })}
              </List>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
    </Fragment>
  );
}
