import { useState, useEffect, useRef } from 'react';
import Paper from '@mui/material/Paper';
import InputBase from '@mui/material/InputBase';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import SearchIcon from '@mui/icons-material/Search';
import SortIcon from '@mui/icons-material/Sort';
import NearMeIcon from '@mui/icons-material/NearMe';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import HistoryIcon from '@mui/icons-material/History';
import CloseIcon from '@mui/icons-material/Close';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Chip from '@mui/material/Chip';
import { useDebounce } from '@hooks/useDebounce';
import { useSearchHistory } from '@hooks/useSearchHistory';
import { locationService } from '@services/api/location.service';
import apiClient from '@services/api/client';
import type { GeoPoint } from '@beacon-bazaar/shared';

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

interface MapProductSearchProps {
  onLocationSelect: (location: GeoPoint, name: string) => void;
  onProductSelect: (product: ProductResult) => void;
  onSearchStoreIds?: (storeIds: string[]) => void;
}

interface LocationResult {
  latitude: number;
  longitude: number;
  displayName: string;
  address: string;
  type: string;
}

export interface ProductResult {
  id: string;
  name: string;
  price: number;
  salePrice: number | null;
  thumbnail: string;
  store: {
    id: string;
    name: string;
    slug: string;
    latitude: number;
    longitude: number;
  };
}

export default function MapProductSearch({ onLocationSelect, onProductSelect, onSearchStoreIds }: MapProductSearchProps) {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState(0); // 0=location, 1=product
  const [locationResults, setLocationResults] = useState<LocationResult[]>([]);
  const [productResults, setProductResults] = useState<ProductResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'distance' | 'price_asc' | 'price_desc'>('distance');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const debouncedQuery = useDebounce(query, 400);
  const containerRef = useRef<HTMLDivElement>(null);
  const { history, add: addHistory, remove: removeHistory, clear: clearHistory } = useSearchHistory();

  // Get user location on mount
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => { /* Location not available */ },
      { timeout: 5000, enableHighAccuracy: false },
    );
  }, []);

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setLocationResults([]);
      setProductResults([]);
      setIsOpen(false);
      onSearchStoreIds?.([]);
      return;
    }
    setLoading(true);

    const locationPromise = locationService
      .search(debouncedQuery)
      .then((res) => res.data || [])
      .catch(() => []);

    const productPromise = apiClient
      .get(`/products/search?q=${encodeURIComponent(debouncedQuery)}&limit=20&includeStore=true`)
      .then((res) => {
        const data = res.data?.data || res.data || [];
        return data.filter((p: ProductResult) => p.store?.latitude && p.store?.longitude);
      })
      .catch(() => []);

    Promise.all([locationPromise, productPromise])
      .then(([locs, prods]) => {
        setLocationResults(locs);
        setProductResults(prods);
        setIsOpen(locs.length > 0 || prods.length > 0);
        if (prods.length > 0 && locs.length === 0) setTab(1);
        else if (locs.length > 0 && prods.length === 0) setTab(0);
        // Report unique store IDs from product results
        const storeIds = [...new Set(prods.map((p: ProductResult) => p.store?.id).filter(Boolean))] as string[];
        onSearchStoreIds?.(storeIds);
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowHistory(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute distances and sort products
  const sortedProducts = [...productResults].map((p) => {
    const dist = userLocation && p.store?.latitude && p.store?.longitude
      ? haversineDistance(userLocation.lat, userLocation.lng, p.store.latitude, p.store.longitude)
      : null;
    return { ...p, distance: dist };
  }).sort((a, b) => {
    if (sortBy === 'distance') {
      if (a.distance === null && b.distance === null) return 0;
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      return a.distance - b.distance;
    }
    const priceA = a.salePrice ?? a.price;
    const priceB = b.salePrice ?? b.price;
    return sortBy === 'price_asc' ? priceA - priceB : priceB - priceA;
  });

  const handleLocationClick = (result: LocationResult) => {
    const label = result.displayName.split(',')[0];
    addHistory(label);
    onLocationSelect({ latitude: result.latitude, longitude: result.longitude }, result.displayName);
    setQuery(label);
    setIsOpen(false);
    setShowHistory(false);
  };

  const handleProductClick = (product: ProductResult) => {
    addHistory(product.name);
    onProductSelect(product);
    setQuery(product.name);
    setIsOpen(false);
    setShowHistory(false);
  };

  const handleHistoryClick = (item: string) => {
    setQuery(item);
    addHistory(item);
    setShowHistory(false);
  };

  return (
    <Box ref={containerRef} sx={{ position: 'relative', width: '100%', maxWidth: 400 }}>
      <Paper sx={{ p: '2px 4px', display: 'flex', alignItems: 'center', borderRadius: 2, boxShadow: 3 }}>
        <IconButton size="small" sx={{ p: '8px' }}>
          <SearchIcon />
        </IconButton>
        <InputBase
          sx={{ ml: 1, flex: 1, fontSize: 14 }}
          placeholder="Yer veya ürün ara..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (locationResults.length > 0 || productResults.length > 0) {
              setIsOpen(true);
            } else if (query.length < 2 && history.length > 0) {
              setShowHistory(true);
            }
          }}
        />
        {loading && <CircularProgress size={18} sx={{ mr: 1 }} />}
      </Paper>

      {showHistory && !isOpen && history.length > 0 && (
        <Paper
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            mt: 0.5,
            zIndex: 1000,
            boxShadow: 4,
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1.5, py: 0.5, bgcolor: 'grey.50' }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              Son Aramalar
            </Typography>
            <IconButton size="small" onClick={() => { clearHistory(); setShowHistory(false); }}>
              <DeleteSweepIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
          <List dense disablePadding>
            {history.map((item) => (
              <ListItem
                key={item}
                sx={{
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' },
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  pr: 1,
                }}
                onClick={() => handleHistoryClick(item)}
                secondaryAction={
                  <IconButton
                    edge="end"
                    size="small"
                    onClick={(e) => { e.stopPropagation(); removeHistory(item); }}
                  >
                    <CloseIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                }
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <HistoryIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                </ListItemIcon>
                <ListItemText
                  primary={<Typography variant="body2">{item}</Typography>}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {isOpen && (locationResults.length > 0 || productResults.length > 0) && (
        <Paper
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            mt: 0.5,
            maxHeight: 400,
            overflow: 'hidden',
            zIndex: 1000,
            boxShadow: 4,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant="fullWidth"
            sx={{ minHeight: 36, '& .MuiTab-root': { minHeight: 36, fontSize: 12, py: 0 } }}
          >
            <Tab label={`Konum (${locationResults.length})`} disabled={locationResults.length === 0} />
            <Tab label={`Ürün (${productResults.length})`} disabled={productResults.length === 0} />
          </Tabs>

          <Box sx={{ overflow: 'auto', maxHeight: 340 }}>
            {tab === 0 && (
              <List dense disablePadding>
                {locationResults.map((result, idx) => {
                  const parts = result.displayName.split(',');
                  return (
                    <ListItem
                      key={idx}
                      onClick={() => handleLocationClick(result)}
                      sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' }, borderBottom: '1px solid', borderColor: 'divider' }}
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <LocationOnIcon color="error" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary={<Typography variant="body2" fontWeight={500}>{parts[0]?.trim()}</Typography>}
                        secondary={<Typography variant="caption" color="text.secondary">{parts.slice(1, 3).join(',').trim()}</Typography>}
                      />
                    </ListItem>
                  );
                })}
              </List>
            )}

            {tab === 1 && (
              <>
                {productResults.length > 1 && (
                  <Box sx={{ px: 1.5, py: 1, display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
                    <SortIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>Sırala:</Typography>
                    <ToggleButtonGroup
                      value={sortBy}
                      exclusive
                      onChange={(_, v) => v && setSortBy(v)}
                      size="small"
                      sx={{ '& .MuiToggleButton-root': { py: 0.25, px: 1, fontSize: 11, textTransform: 'none' } }}
                    >
                      <ToggleButton value="distance">
                        <NearMeIcon sx={{ fontSize: 14, mr: 0.5 }} />
                        Yakınlık
                      </ToggleButton>
                      <ToggleButton value="price_asc">
                        <AttachMoneyIcon sx={{ fontSize: 14, mr: 0.3 }} />
                        Ucuz
                      </ToggleButton>
                      <ToggleButton value="price_desc">
                        <AttachMoneyIcon sx={{ fontSize: 14, mr: 0.3 }} />
                        Pahalı
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </Box>
                )}
                <List dense disablePadding>
                  {sortedProducts.map((product) => (
                    <ListItem
                      key={product.id}
                      onClick={() => handleProductClick(product)}
                      sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' }, borderBottom: '1px solid', borderColor: 'divider', gap: 1 }}
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <ShoppingBagIcon color="primary" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary={<Typography variant="body2" fontWeight={500}>{product.name}</Typography>}
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                            <Typography variant="caption" color="text.secondary">
                              {product.store?.name} &middot;{' '}
                              {product.salePrice
                                ? <>{Number(product.salePrice).toFixed(2)} ₺</>
                                : <>{Number(product.price).toFixed(2)} ₺</>
                              }
                            </Typography>
                            {product.distance !== null && (
                              <Chip
                                icon={<NearMeIcon sx={{ fontSize: '12px !important' }} />}
                                label={formatDistance(product.distance)}
                                size="small"
                                variant="outlined"
                                color={product.distance < 5 ? 'success' : product.distance < 15 ? 'warning' : 'default'}
                                sx={{ height: 18, fontSize: 10, '& .MuiChip-label': { px: 0.5 }, '& .MuiChip-icon': { ml: 0.3 } }}
                              />
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </>
            )}
          </Box>
        </Paper>
      )}
    </Box>
  );
}
