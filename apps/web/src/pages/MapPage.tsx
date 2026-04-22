import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { MapContainer } from '@features/map/components';
import MapProductSearch from '@features/map/components/MapProductSearch';
import type { ProductResult } from '@features/map/components/MapProductSearch';
import StoreProductsPanel from '@features/map/components/StoreProductsPanel';
import IndoorMapFull from '@features/indoor-map/components/IndoorMapFull';
import type { MapContainerHandle } from '@features/map/components/MapContainer';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { setUserLocation } from '@store/slices/mapSlice';
import type { GeoPoint } from '@beacon-bazaar/shared';
import apiClient from '@services/api/client';

interface StoreMapItem {
  id: string;
  name: string;
  slug: string;
  logo: string;
  latitude: number;
  longitude: number;
  categories: string[];
  ratingAverage: number;
  ratingCount: number;
  isVerified: boolean;
  contactInfo: Record<string, string>;
  location: GeoPoint;
  address?: { street?: string; district?: string; city?: string; country?: string };
}

export default function MapPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { userLocation } = useAppSelector((state) => state.map);
  const [searchParams] = useSearchParams();
  const [stores, setStores] = useState<StoreMapItem[]>([]);
  const [selectedStore, setSelectedStore] = useState<StoreMapItem | null>(null);
  const [highlightProductId, setHighlightProductId] = useState<string | null>(null);
  const [searchStoreIds, setSearchStoreIds] = useState<string[]>([]);
  const [searchMarker, setSearchMarker] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [indoorOpen, setIndoorOpen] = useState(false);
  const mapRef = useRef<MapContainerHandle>(null);
  const storeMapRef = useRef<Map<string, StoreMapItem>>(new Map());
  const boundsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchStoresForArea = useCallback((lat: number, lng: number, radius: number) => {
    // Fetch nearby stores for the given center
    apiClient.get(`/stores/nearby?latitude=${lat}&longitude=${lng}&radius=${radius}`)
      .then((res) => {
        const data = res.data?.data || res.data || [];
        const normalized = data
          .filter((s: StoreMapItem) => s.latitude && s.longitude)
          .map((s: StoreMapItem) => ({
            ...s,
            location: { latitude: s.latitude, longitude: s.longitude },
            rating: { average: s.ratingAverage, count: s.ratingCount },
          }));
        // Merge with existing stores to accumulate
        normalized.forEach((s: StoreMapItem) => storeMapRef.current.set(s.id, s));
        setStores(Array.from(storeMapRef.current.values()));
      })
      .catch(() => {});
  }, []);

  // Initial load
  useEffect(() => {
    apiClient.get('/stores/search?limit=100').then((res) => {
      const data = res.data?.data || res.data || [];
      const normalized = data
        .filter((s: StoreMapItem) => s.latitude && s.longitude)
        .map((s: StoreMapItem) => ({
          ...s,
          location: { latitude: s.latitude, longitude: s.longitude },
          rating: { average: s.ratingAverage, count: s.ratingCount },
        }));
      normalized.forEach((s: StoreMapItem) => storeMapRef.current.set(s.id, s));
      setStores(normalized);
    }).catch(() => {});
  }, []);

  const handleBoundsChange = useCallback((center: { latitude: number; longitude: number }, radius: number) => {
    if (boundsTimerRef.current) clearTimeout(boundsTimerRef.current);
    boundsTimerRef.current = setTimeout(() => {
      fetchStoresForArea(center.latitude, center.longitude, radius);
    }, 500);
  }, [fetchStoresForArea]);

  useEffect(() => {
    if (userLocation) return;
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        dispatch(setUserLocation(loc));
      },
      () => {},
      { enableHighAccuracy: true },
    );
  }, [userLocation, dispatch]);

  // Fly to lat/lng from query params (e.g. from gift picker map icon)
  const autoSelectedRef = useRef(false);
  useEffect(() => {
    const lat = parseFloat(searchParams.get('lat') || '');
    const lng = parseFloat(searchParams.get('lng') || '');
    if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
      const timer = setTimeout(() => {
        setSearchMarker({ lat, lng, name: searchParams.get('name') || 'Mağaza Konumu' });
        mapRef.current?.flyTo(lat, lng, 16);
        fetchStoresForArea(lat, lng, 2000);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchParams, fetchStoresForArea]);

  // Auto-select store and highlight product from query params
  useEffect(() => {
    if (autoSelectedRef.current) return;
    const storeId = searchParams.get('storeId');
    const productId = searchParams.get('productId');
    if (!storeId || stores.length === 0) return;

    const store = stores.find((s) => s.id === storeId);
    if (store) {
      autoSelectedRef.current = true;
      setSelectedStore(store);
      if (productId) setHighlightProductId(productId);
    } else {
      // Store not in list yet — create a minimal entry from query params
      const lat = parseFloat(searchParams.get('lat') || '');
      const lng = parseFloat(searchParams.get('lng') || '');
      const name = searchParams.get('name') || 'Mağaza';
      if (!isNaN(lat) && !isNaN(lng)) {
        autoSelectedRef.current = true;
        setSelectedStore({
          id: storeId,
          name,
          slug: '',
          logo: '',
          latitude: lat,
          longitude: lng,
          categories: [],
          ratingAverage: 0,
          ratingCount: 0,
          isVerified: false,
          contactInfo: {},
          location: { latitude: lat, longitude: lng },
        });
        if (productId) setHighlightProductId(productId);
      }
    }
  }, [searchParams, stores]);

  const handleLocationSelect = useCallback((location: GeoPoint, name?: string) => {
    setSearchMarker({ lat: location.latitude, lng: location.longitude, name: name || 'Arama Sonucu' });
    mapRef.current?.flyTo(location.latitude, location.longitude, 16);
  }, []);

  const handleStoreClick = useCallback((store: StoreMapItem) => {
    // AVM kontrolü — Cevahir AVM yakınındaysa indoor haritayı aç
    const CEVAHIR = { lat: 41.062778, lng: 28.993056 };
    const dist = Math.sqrt(
      Math.pow(store.latitude - CEVAHIR.lat, 2) + Math.pow(store.longitude - CEVAHIR.lng, 2)
    );
    if (dist < 0.005 || store.name.toLowerCase().includes('cevahir')) {
      setIndoorOpen(true);
      return;
    }

    setSelectedStore(store);
    setHighlightProductId(null);
    mapRef.current?.flyTo(store.latitude, store.longitude, 16);
  }, []);

  const handleProductSelect = useCallback((product: ProductResult) => {
    const storeData = product.store;
    if (!storeData) return;
    // Find the store in our list or create a minimal version
    const existing = stores.find((s) => s.id === storeData.id);
    if (existing) {
      setSelectedStore(existing);
    } else {
      setSelectedStore({
        id: storeData.id,
        name: storeData.name,
        slug: storeData.slug,
        logo: '',
        latitude: storeData.latitude,
        longitude: storeData.longitude,
        categories: [],
        ratingAverage: 0,
        ratingCount: 0,
        isVerified: false,
        contactInfo: {},
        location: { latitude: storeData.latitude, longitude: storeData.longitude },
      });
    }
    setHighlightProductId(product.id);
    mapRef.current?.flyTo(storeData.latitude, storeData.longitude, 16);
  }, [stores]);

  return (
    <Box sx={{ position: 'relative', mx: { xs: -2, md: -3 }, mb: -3, overflow: 'visible' }}>
      <Box sx={{
        position: 'absolute',
        top: 12,
        left: { xs: 10, md: 16 },
        zIndex: 1100,
        width: { xs: 'calc(100% - 20px)', sm: selectedStore ? 'calc(100% - 420px)' : 400 },
        maxWidth: { sm: 400 },
        transition: 'width 0.3s',
      }}>
        <MapProductSearch
          onLocationSelect={handleLocationSelect}
          onProductSelect={handleProductSelect}
          onSearchStoreIds={setSearchStoreIds}
        />
      </Box>
      {searchParams.get('from') === 'gift' && (
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          endIcon={<CardGiftcardIcon />}
          onClick={() => navigate(-1)}
          sx={{
            position: 'absolute',
            top: 12,
            right: { xs: 10, sm: selectedStore ? 396 : 16 },
            zIndex: 1100,
            bgcolor: '#fff',
            color: 'primary.main',
            fontWeight: 700,
            borderRadius: 3,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            textTransform: 'none',
            transition: 'right 0.3s',
            '&:hover': { bgcolor: '#f5f5f5' },
          }}
        >
          Hediye Listesine Dön
        </Button>
      )}
      <MapContainer
        ref={mapRef}
        stores={stores as any}
        onStoreClick={handleStoreClick as any}
        highlightedStoreIds={searchStoreIds}
        searchMarker={searchMarker}
        height="calc(100vh - 64px)"
        onBoundsChange={handleBoundsChange}
      />
      <IndoorMapFull externalOpen={indoorOpen} onExternalClose={() => setIndoorOpen(false)} />
      {selectedStore && (
        <StoreProductsPanel
          store={selectedStore}
          highlightProductId={highlightProductId}
          onClose={() => { setSelectedStore(null); setHighlightProductId(null); }}
        />
      )}
    </Box>
  );
}
