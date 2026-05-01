import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Platform,
  Linking,
  TouchableOpacity,
  Animated,
  Image,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Card, Text, Button, Searchbar, Chip, ActivityIndicator, Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { fetchNearbyStores } from '../store/slices/storeSlice';
import apiClient from '../services/api/client';
import type { RootStackParamList } from '../navigation/types';
import AzureMap, { type MapMarker, type MapStyleId } from '../components/AzureMap';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface NearbyPlace {
  latitude: number;
  longitude: number;
  address: string | null;
  displayName: string;
  type: string;
}

const PRIMARY = '#1a6b52';
const ACCENT = '#2563eb';

const DEFAULT_LAT = 41.0082;
const DEFAULT_LNG = 28.9784;

// Kategori → açık pastel renk (uydu üzerinde de okunabilir)
const CATEGORY_COLORS: Record<string, string> = {
  Elektronik: '#60a5fa',
  'Kadın': '#f472b6',
  'Erkek': '#818cf8',
  'Ev & Mobilya': '#c084fc',
  'Süpermarket': '#4ade80',
  'Kozmetik': '#fb7185',
  'Ayakkabı & Çanta': '#a78bfa',
  'Spor & Outdoor': '#fb923c',
  'Yemek': '#fbbf24',
  'Restoran': '#fbbf24',
  'Cafe': '#facc15',
  'Hediyelik': '#22d3ee',
  'Oyuncak & Hobi': '#2dd4bf',
  'Kitap & Müzik': '#d8b4fe',
  'Giyim': '#f9a8d4',
  'Kitap & Kırtasiye': '#34d399',
  'Moda & Giyim': '#f472b6',
};

const PIN_DEFAULT = '#34d399';

function colorForStore(s: any): string {
  const cats: string[] = s.categories || [];
  for (const c of cats) {
    if (CATEGORY_COLORS[c]) return CATEGORY_COLORS[c];
  }
  return PIN_DEFAULT;
}

function formatAddress(addr: any): string {
  if (!addr) return '';
  if (typeof addr === 'string') return addr;
  return [addr.street, addr.district, addr.city].filter(Boolean).join(', ');
}

function getStoreCoords(s: any): { lat: number; lng: number } | null {
  if (typeof s.latitude === 'number' && typeof s.longitude === 'number') {
    return { lat: s.latitude, lng: s.longitude };
  }
  if (s.location?.coordinates && Array.isArray(s.location.coordinates)) {
    return { lat: s.location.coordinates[1], lng: s.location.coordinates[0] };
  }
  return null;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function formatDistance(km: number | null | undefined): string | null {
  if (km == null || !Number.isFinite(km)) return null;
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
}

export default function MapScreen() {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<Nav>();
  const { nearbyStores, isLoading: loading } = useAppSelector((s) => s.store);
  const [searchQuery, setSearchQuery] = useState('');
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [activeTab, setActiveTab] = useState<'stores' | 'places'>('stores');
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: DEFAULT_LAT,
    lng: DEFAULT_LNG,
  });
  const [hasLocation, setHasLocation] = useState(false);
  const [radius, setRadius] = useState<number>(5);
  const [mapStyle, setMapStyle] = useState<MapStyleId>('satellite_road_labels');
  const [styleMenuOpen, setStyleMenuOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<any | null>(null);
  const [productMatchStoreIds, setProductMatchStoreIds] = useState<string[] | null>(null);
  const [productSearchInfo, setProductSearchInfo] = useState<string | null>(null);
  const [storeMatches, setStoreMatches] = useState<any[]>([]);
  const [productStoreList, setProductStoreList] = useState<any[]>([]);
  const [productResults, setProductResults] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<'distance' | 'price'>('distance');
  const [storeProducts, setStoreProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const screenW = Dimensions.get('window').width;
  const panelW = Math.min(280, screenW * 0.78);
  const slideAnim = useRef(new Animated.Value(panelW)).current;

  const hasSearchResults =
    !!productMatchStoreIds || storeMatches.length > 0 || places.length > 0;
  const sideOpen = !!selectedStore || (hasSearchResults && !!searchQuery.trim());

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: sideOpen ? 0 : panelW,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [sideOpen, panelW, slideAnim]);

  const openStorePanel = async (slugOrId: string) => {
    let store: any =
      nearbyStores.find((s: any) => s.slug === slugOrId || s.id === slugOrId) ||
      productStoreList.find((s: any) => s.slug === slugOrId || s.id === slugOrId) ||
      storeMatches.find((s: any) => s.slug === slugOrId || s.id === slugOrId);
    if (!store) {
      // Son çare: doğrudan API'den çek
      try {
        const r = await apiClient.get(`/stores/${slugOrId}`);
        store = r.data?.data;
      } catch {
        return;
      }
    }
    if (!store) return;
    setSelectedStore(store);
    setStoreProducts([]);
    setProductsLoading(true);
    try {
      const res = await apiClient.get(`/stores/${store.id}/products`, {
        params: { limit: 12 },
      });
      setStoreProducts(res.data?.data || []);
    } catch {
      setStoreProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          const lat = loc.coords.latitude;
          const lng = loc.coords.longitude;
          setCoords({ lat, lng });
          setHasLocation(true);
          dispatch(fetchNearbyStores({ latitude: lat, longitude: lng, radius }));
        } else {
          dispatch(fetchNearbyStores({ latitude: DEFAULT_LAT, longitude: DEFAULT_LNG, radius }));
        }
      } catch {
        dispatch(fetchNearbyStores({ latitude: DEFAULT_LAT, longitude: DEFAULT_LNG, radius }));
      }
    })();
  }, []);

  const refreshNearby = (newRadius?: number) => {
    const r = newRadius ?? radius;
    setRadius(r);
    dispatch(fetchNearbyStores({ latitude: coords.lat, longitude: coords.lng, radius: r }));
  };

  const searchPlaces = async () => {
    const q = searchQuery.trim();
    if (!q) {
      setProductMatchStoreIds(null);
      setProductSearchInfo(null);
      setStoreMatches([]);
      setPlaces([]);
      return;
    }
    setLoadingPlaces(true);
    try {
      // Paralel arama: ürün, mağaza adı, yer/adres
      const [prodRes, storeRes, locRes] = await Promise.allSettled([
        apiClient.get('/products/search', { params: { q, limit: 100 } }),
        apiClient.get('/stores/search', { params: { q, limit: 50 } }),
        apiClient.get('/locations/search', { params: { query: q } }),
      ]);

      // Ürün → storeIds
      let productStoreIds: string[] = [];
      let productList: any[] = [];
      if (prodRes.status === 'fulfilled') {
        productList = prodRes.value.data?.data || [];
        productStoreIds = Array.from(
          new Set(productList.map((p: any) => p.storeId).filter(Boolean)),
        ) as string[];
      }
      setProductResults(productList);

      // Mağaza adı eşleşmeleri
      const storeNameMatches =
        storeRes.status === 'fulfilled' ? storeRes.value.data?.data || [] : [];

      // Yer/adres eşleşmeleri
      const locationMatches =
        locRes.status === 'fulfilled' ? locRes.value.data?.data || [] : [];

      setProductMatchStoreIds(productStoreIds.length > 0 ? productStoreIds : null);
      setStoreMatches(storeNameMatches);
      setPlaces(locationMatches);

      // Ürün eşleşen mağazaların full bilgilerini doğrudan çek
      if (productStoreIds.length > 0) {
        const fetched = await Promise.all(
          productStoreIds.slice(0, 50).map((id) =>
            apiClient
              .get(`/stores/${id}`)
              .then((r) => r.data?.data)
              .catch(() => null),
          ),
        );
        setProductStoreList(fetched.filter(Boolean));
      } else {
        setProductStoreList([]);
      }

      // Bilgi mesajı
      const parts: string[] = [];
      if (productStoreIds.length > 0) parts.push(`${productStoreIds.length} ürün satıcısı`);
      if (storeNameMatches.length > 0) parts.push(`${storeNameMatches.length} mağaza`);
      if (locationMatches.length > 0) parts.push(`${locationMatches.length} yer`);
      setProductSearchInfo(
        parts.length > 0 ? `"${q}" için ${parts.join(' · ')}` : `"${q}" için sonuç bulunamadı`,
      );

      // Aktif tab seçimi: ürün varsa Ürün, yoksa Konum
      if (productStoreIds.length > 0) {
        setActiveTab('stores');
        // Eksik mağazaları doldur
        const known = new Set(nearbyStores.map((s: any) => s.id));
        const missing = productStoreIds.filter((id) => !known.has(id));
        if (missing.length > 0) {
          dispatch(
            fetchNearbyStores({
              latitude: coords.lat,
              longitude: coords.lng,
              radius: 100,
            }),
          );
        }
      } else if (storeNameMatches.length > 0 || locationMatches.length > 0) {
        setActiveTab('places');
        // Haritayı ilk sonuca odakla
        const first = storeNameMatches[0] || locationMatches[0];
        const lat = first?.latitude ?? first?.location?.coordinates?.[1];
        const lng = first?.longitude ?? first?.location?.coordinates?.[0];
        if (lat && lng) setCoords({ lat, lng });
      }
    } finally {
      setLoadingPlaces(false);
    }
  };

  const clearProductFilter = () => {
    setProductMatchStoreIds(null);
    setProductSearchInfo(null);
    setStoreMatches([]);
    setPlaces([]);
    setProductStoreList([]);
    setProductResults([]);
    setSearchQuery('');
  };

  const filteredStores = useMemo(() => {
    if (!productMatchStoreIds) return nearbyStores;
    if (productStoreList.length > 0) {
      const ids = new Set(productStoreList.map((s: any) => s.id));
      const extras = (nearbyStores as any[]).filter(
        (s) => productMatchStoreIds.includes(s.id) && !ids.has(s.id),
      );
      return [...productStoreList, ...extras];
    }
    const matchSet = new Set(productMatchStoreIds);
    return (nearbyStores as any[]).filter((s) => matchSet.has(s.id));
  }, [nearbyStores, productMatchStoreIds, productStoreList]);

  // Mağaza başına en düşük ürün fiyatı
  const minPriceByStore = useMemo(() => {
    const m = new Map<string, number>();
    productResults.forEach((p: any) => {
      const sid = p.storeId;
      if (!sid) return;
      const sale = p.salePrice == null ? null : parseFloat(p.salePrice);
      const price = parseFloat(p.price);
      const eff = sale != null && Number.isFinite(sale) && sale < price ? sale : price;
      if (!Number.isFinite(eff)) return;
      const cur = m.get(sid);
      if (cur == null || eff < cur) m.set(sid, eff);
    });
    return m;
  }, [productResults]);

  const sortedFilteredStores = useMemo(() => {
    const arr = [...filteredStores];
    if (sortBy === 'distance') {
      arr.sort((a: any, b: any) => {
        const ca = getStoreCoords(a);
        const cb = getStoreCoords(b);
        const da =
          a.distance != null
            ? Number(a.distance)
            : ca
            ? haversineKm(coords.lat, coords.lng, ca.lat, ca.lng)
            : Infinity;
        const db =
          b.distance != null
            ? Number(b.distance)
            : cb
            ? haversineKm(coords.lat, coords.lng, cb.lat, cb.lng)
            : Infinity;
        return da - db;
      });
    } else {
      arr.sort((a: any, b: any) => {
        const pa = minPriceByStore.get(a.id) ?? Infinity;
        const pb = minPriceByStore.get(b.id) ?? Infinity;
        return pa - pb;
      });
    }
    return arr;
  }, [filteredStores, sortBy, minPriceByStore, coords]);

  const fetchNearby = async () => {
    setLoadingPlaces(true);
    try {
      const res = await apiClient.get('/locations/nearby', {
        params: { latitude: coords.lat, longitude: coords.lng, radius },
      });
      setPlaces(res.data?.data || []);
      setActiveTab('places');
    } catch {
      // ignore
    } finally {
      setLoadingPlaces(false);
    }
  };

  const openInMaps = (lat: number, lng: number, name: string) => {
    const url = Platform.select({
      ios: `maps:0,0?q=${encodeURIComponent(name)}@${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}(${encodeURIComponent(name)})`,
    });
    if (url) Linking.openURL(url);
  };


  const markers: MapMarker[] = useMemo(() => {
    if (activeTab === 'stores') {
      return filteredStores
        .map((s: any) => {
          const c = getStoreCoords(s);
          if (!c) return null;
          return {
            id: s.slug || s.id,
            latitude: c.lat,
            longitude: c.lng,
            title: s.name,
            subtitle: s.categories?.join(', '),
            color: colorForStore(s),
          };
        })
        .filter(Boolean) as MapMarker[];
    }
    // Konum tab → mağaza adı eşleşmeleri + yer eşleşmeleri birlikte
    const storeMs = storeMatches
      .map((s: any) => {
        const c = getStoreCoords(s);
        if (!c) return null;
        return {
          id: `store-${s.slug || s.id}`,
          latitude: c.lat,
          longitude: c.lng,
          title: s.name,
          subtitle: s.categories?.join(', '),
          color: colorForStore(s),
        };
      })
      .filter(Boolean) as MapMarker[];
    const placeMs: MapMarker[] = places.map((p, i) => ({
      id: `place-${i}`,
      latitude: p.latitude,
      longitude: p.longitude,
      title: p.displayName?.split(',')[0] || 'Yer',
      subtitle: typeof p.address === 'string' ? p.address : p.type,
      color: '#7dd3fc',
    }));
    return [...storeMs, ...placeMs];
  }, [activeTab, filteredStores, storeMatches, places]);

  const handleMarkerPress = (id: string) => {
    // store-* prefix: konum tab'ındaki mağaza match
    if (id.startsWith('store-')) {
      const slug = id.slice('store-'.length);
      const m = storeMatches.find((s: any) => (s.slug || s.id) === slug);
      if (m) {
        // Geçici olarak nearbyStores'a benzer şekilde panel aç
        setSelectedStore(m);
        setStoreProducts([]);
        setProductsLoading(true);
        apiClient
          .get(`/stores/${m.id}/products`, { params: { limit: 12 } })
          .then((res) => setStoreProducts(res.data?.data || []))
          .catch(() => setStoreProducts([]))
          .finally(() => setProductsLoading(false));
      }
      return;
    }
    if (id.startsWith('place-')) return;
    // Aksi halde Ürün sekmesi: yakındaki mağaza paneli
    if (activeTab === 'stores') {
      openStorePanel(id);
    }
  };

  const num = (v: any) => {
    const n = typeof v === 'string' ? parseFloat(v) : v;
    return Number.isFinite(n) ? n : 0;
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <Searchbar
        placeholder="Ürün, mağaza veya adres ara..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        onSubmitEditing={searchPlaces}
        style={styles.searchbar}
        onClearIconPress={clearProductFilter}
      />

      {productSearchInfo && (
        <View style={styles.productInfo}>
          <MaterialCommunityIcons name="package-variant" size={14} color="#fff" />
          <Text style={styles.productInfoText}>{productSearchInfo}</Text>
          <TouchableOpacity onPress={clearProductFilter} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
            <MaterialCommunityIcons name="close-circle" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.tabs}>
        <Chip
          selected={activeTab === 'stores'}
          onPress={() => setActiveTab('stores')}
          style={styles.tab}
          selectedColor={ACCENT}
          icon="package-variant"
        >
          Ürün ({filteredStores.length})
        </Chip>
        <Chip
          selected={activeTab === 'places'}
          onPress={() => {
            setActiveTab('places');
            // Eğer henüz yer araması yapılmadıysa konum bazlı yer önerileri çek
            if (places.length === 0 && storeMatches.length === 0 && !searchQuery.trim()) {
              fetchNearby();
            }
          }}
          style={styles.tab}
          selectedColor={ACCENT}
          icon="map-marker-multiple"
        >
          Konum ({storeMatches.length + places.length})
        </Chip>
      </View>

      <View style={styles.modeToggle}>
        <TouchableOpacity
          style={[styles.modeBtn, viewMode === 'map' && styles.modeBtnActive]}
          onPress={() => setViewMode('map')}
        >
          <MaterialCommunityIcons
            name="map"
            size={16}
            color={viewMode === 'map' ? '#fff' : '#666'}
          />
          <Text style={[styles.modeText, viewMode === 'map' && styles.modeTextActive]}>Harita</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeBtn, viewMode === 'list' && styles.modeBtnActive]}
          onPress={() => setViewMode('list')}
        >
          <MaterialCommunityIcons
            name="format-list-bulleted"
            size={16}
            color={viewMode === 'list' ? '#fff' : '#666'}
          />
          <Text style={[styles.modeText, viewMode === 'list' && styles.modeTextActive]}>Liste</Text>
        </TouchableOpacity>
        <View style={styles.spacer} />
        <View style={styles.radiusBox}>
          {[2, 5, 10, 25].map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.radiusBtn, radius === r && styles.radiusBtnActive]}
              onPress={() => refreshNearby(r)}
            >
              <Text style={[styles.radiusText, radius === r && styles.radiusTextActive]}>
                {r}km
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading || loadingPlaces ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={PRIMARY} />
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      ) : viewMode === 'map' ? (
        <View style={styles.mapWrap}>
          <AzureMap
            center={{ latitude: coords.lat, longitude: coords.lng }}
            zoom={13}
            userLocation={hasLocation ? { latitude: coords.lat, longitude: coords.lng } : null}
            markers={markers}
            mapStyle={mapStyle}
            onMarkerPress={handleMarkerPress}
          />

          {/* Stil Seçici */}
          <View style={styles.styleControl}>
            <TouchableOpacity
              style={styles.styleBtn}
              onPress={() => setStyleMenuOpen((v) => !v)}
            >
              <MaterialCommunityIcons name="layers-outline" size={20} color="#333" />
            </TouchableOpacity>
            {styleMenuOpen && (
              <View style={styles.styleMenu}>
                {(
                  [
                    { id: 'road', label: 'Yol', icon: 'road' },
                    { id: 'satellite', label: 'Uydu', icon: 'satellite-variant' },
                    { id: 'satellite_road_labels', label: 'Hibrit', icon: 'map-search' },
                    { id: 'road_shaded_relief', label: 'Arazi', icon: 'image-filter-hdr' },
                    { id: 'grayscale_light', label: 'Açık Gri', icon: 'palette-outline' },
                    { id: 'grayscale_dark', label: 'Koyu Gri', icon: 'palette' },
                    { id: 'night', label: 'Gece', icon: 'weather-night' },
                  ] as { id: MapStyleId; label: string; icon: string }[]
                ).map((opt) => (
                  <TouchableOpacity
                    key={opt.id}
                    style={[
                      styles.styleOption,
                      mapStyle === opt.id && styles.styleOptionActive,
                    ]}
                    onPress={() => {
                      setMapStyle(opt.id);
                      setStyleMenuOpen(false);
                    }}
                  >
                    <MaterialCommunityIcons
                      name={opt.icon as any}
                      size={16}
                      color={mapStyle === opt.id ? PRIMARY : '#666'}
                    />
                    <Text
                      style={[
                        styles.styleOptionText,
                        mapStyle === opt.id && styles.styleOptionTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          {hasLocation && (
            <TouchableOpacity
              style={styles.fab}
              onPress={() => setCoords({ lat: coords.lat, lng: coords.lng })}
            >
              <MaterialCommunityIcons name="crosshairs-gps" size={22} color={PRIMARY} />
            </TouchableOpacity>
          )}
          <View style={styles.markerInfo}>
            <Text style={styles.markerInfoText}>
              {markers.length > 0
                ? `Haritada ${markers.length} ${activeTab === 'stores' ? 'mağaza' : 'yer'} işaretli`
                : 'Bu bölgede sonuç yok'}
            </Text>
          </View>

          {/* Sağ Panel: Mağaza ürünleri veya arama sonuçları */}
          <Animated.View
            style={[
              styles.panel,
              { width: panelW, transform: [{ translateX: slideAnim }] },
            ]}
            pointerEvents={sideOpen ? 'auto' : 'none'}
          >
            {!selectedStore && hasSearchResults && (
              <View style={styles.searchPanel}>
                <View style={styles.panelHeader}>
                  <MaterialCommunityIcons name="magnify" size={20} color={PRIMARY} />
                  <View style={styles.panelHeaderText}>
                    <Text style={styles.panelTitle} numberOfLines={1}>
                      "{searchQuery}"
                    </Text>
                    <Text style={styles.panelSubtitle}>{markers.length} sonuç</Text>
                  </View>
                  <TouchableOpacity
                    onPress={clearProductFilter}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <MaterialCommunityIcons name="close" size={20} color="#666" />
                  </TouchableOpacity>
                </View>

                <View style={styles.searchTabs}>
                  <TouchableOpacity
                    style={[
                      styles.searchTab,
                      activeTab === 'stores' && styles.searchTabActive,
                    ]}
                    onPress={() => setActiveTab('stores')}
                  >
                    <Text
                      style={[
                        styles.searchTabText,
                        activeTab === 'stores' && styles.searchTabTextActive,
                      ]}
                    >
                      Ürün ({filteredStores.length})
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.searchTab,
                      activeTab === 'places' && styles.searchTabActive,
                    ]}
                    onPress={() => setActiveTab('places')}
                  >
                    <Text
                      style={[
                        styles.searchTabText,
                        activeTab === 'places' && styles.searchTabTextActive,
                      ]}
                    >
                      Konum ({storeMatches.length + places.length})
                    </Text>
                  </TouchableOpacity>
                </View>

                {activeTab === 'stores' && filteredStores.length > 0 && (
                  <View style={styles.sortRow}>
                    <Text style={styles.sortLabel}>Sırala:</Text>
                    <TouchableOpacity
                      style={[styles.sortBtn, sortBy === 'distance' && styles.sortBtnActive]}
                      onPress={() => setSortBy('distance')}
                    >
                      <MaterialCommunityIcons
                        name="map-marker-distance"
                        size={11}
                        color={sortBy === 'distance' ? '#fff' : '#666'}
                      />
                      <Text
                        style={[
                          styles.sortBtnText,
                          sortBy === 'distance' && styles.sortBtnTextActive,
                        ]}
                      >
                        Mesafe
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.sortBtn, sortBy === 'price' && styles.sortBtnActive]}
                      onPress={() => setSortBy('price')}
                    >
                      <MaterialCommunityIcons
                        name="cash"
                        size={11}
                        color={sortBy === 'price' ? '#fff' : '#666'}
                      />
                      <Text
                        style={[
                          styles.sortBtnText,
                          sortBy === 'price' && styles.sortBtnTextActive,
                        ]}
                      >
                        Fiyat ↑
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                <ScrollView style={styles.searchList} showsVerticalScrollIndicator={false}>
                  {activeTab === 'stores' &&
                    sortedFilteredStores.map((s: any) => {
                      const c = getStoreCoords(s);
                      const distKm =
                        s.distance != null
                          ? Number(s.distance)
                          : c
                          ? haversineKm(coords.lat, coords.lng, c.lat, c.lng)
                          : null;
                      const distStr = formatDistance(distKm);
                      const minPrice = minPriceByStore.get(s.id);
                      return (
                        <TouchableOpacity
                          key={s.id}
                          style={styles.searchItem}
                          onPress={() => {
                            if (c) {
                              setCoords({ lat: c.lat, lng: c.lng });
                            }
                            openStorePanel(s.slug || s.id);
                          }}
                        >
                          <Image
                            source={{
                              uri:
                                s.logo ||
                                `https://picsum.photos/seed/${s.slug}/80/80`,
                            }}
                            style={styles.searchItemImg}
                          />
                          <View style={styles.searchItemInfo}>
                            <Text numberOfLines={1} style={styles.searchItemTitle}>
                              {s.name}
                            </Text>
                            <Text numberOfLines={1} style={styles.searchItemSub}>
                              {s.categories?.join(', ') || 'Mağaza'}
                            </Text>
                            <View style={styles.searchItemMetaRow}>
                              {distStr && (
                                <View style={styles.searchItemDistRow}>
                                  <MaterialCommunityIcons name="walk" size={11} color={PRIMARY} />
                                  <Text style={styles.searchItemDist}>{distStr}</Text>
                                </View>
                              )}
                              {minPrice != null && Number.isFinite(minPrice) && (
                                <Text style={styles.searchItemPrice}>
                                  {minPrice.toLocaleString('tr-TR')} ₺ den başlayan
                                </Text>
                              )}
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })}

                  {activeTab === 'places' &&
                    storeMatches.map((s: any) => {
                      const c = getStoreCoords(s);
                      const distKm =
                        s.distance != null
                          ? Number(s.distance)
                          : c
                          ? haversineKm(coords.lat, coords.lng, c.lat, c.lng)
                          : null;
                      const distStr = formatDistance(distKm);
                      return (
                        <TouchableOpacity
                          key={`sm-${s.id}`}
                          style={styles.searchItem}
                          onPress={() => {
                            if (c) setCoords({ lat: c.lat, lng: c.lng });
                            navigation.navigate('StoreDetail', {
                              storeId: s.slug || s.id,
                            });
                          }}
                        >
                          <View
                            style={[
                              styles.searchItemIconWrap,
                              { backgroundColor: '#e0f2fe' },
                            ]}
                          >
                            <MaterialCommunityIcons
                              name="storefront"
                              size={18}
                              color={ACCENT}
                            />
                          </View>
                          <View style={styles.searchItemInfo}>
                            <Text numberOfLines={1} style={styles.searchItemTitle}>
                              {s.name}
                            </Text>
                            <Text numberOfLines={1} style={styles.searchItemSub}>
                              Mağaza · {s.categories?.[0] || ''}
                            </Text>
                            {distStr && (
                              <View style={styles.searchItemDistRow}>
                                <MaterialCommunityIcons name="walk" size={11} color={PRIMARY} />
                                <Text style={styles.searchItemDist}>{distStr}</Text>
                              </View>
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })}

                  {activeTab === 'places' &&
                    places.map((p, i) => {
                      const distKm = haversineKm(coords.lat, coords.lng, p.latitude, p.longitude);
                      const distStr = formatDistance(distKm);
                      return (
                        <TouchableOpacity
                          key={`p-${i}`}
                          style={styles.searchItem}
                          onPress={() => {
                            setCoords({ lat: p.latitude, lng: p.longitude });
                          }}
                        >
                          <View
                            style={[
                              styles.searchItemIconWrap,
                              { backgroundColor: '#f1f5f9' },
                            ]}
                          >
                            <MaterialCommunityIcons
                              name="map-marker"
                              size={18}
                              color="#64748b"
                            />
                          </View>
                          <View style={styles.searchItemInfo}>
                            <Text numberOfLines={1} style={styles.searchItemTitle}>
                              {p.displayName?.split(',')[0] || 'Yer'}
                            </Text>
                            <Text numberOfLines={1} style={styles.searchItemSub}>
                              {typeof p.address === 'string' ? p.address : p.type}
                            </Text>
                            {distStr && (
                              <View style={styles.searchItemDistRow}>
                                <MaterialCommunityIcons name="walk" size={11} color={PRIMARY} />
                                <Text style={styles.searchItemDist}>{distStr}</Text>
                              </View>
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                </ScrollView>
              </View>
            )}

            {selectedStore && (
              <>
                <TouchableOpacity
                  style={styles.panelHeader}
                  activeOpacity={0.7}
                  onPress={() =>
                    navigation.navigate('StoreDetail', {
                      storeId: selectedStore.slug || selectedStore.id,
                    })
                  }
                >
                  <Avatar.Image
                    size={42}
                    source={{
                      uri:
                        selectedStore.logo ||
                        `https://picsum.photos/seed/${selectedStore.slug}-logo/120/120`,
                    }}
                  />
                  <View style={styles.panelHeaderText}>
                    <Text numberOfLines={1} style={styles.panelTitle}>
                      {selectedStore.name}
                    </Text>
                    <View style={styles.panelMeta}>
                      <Text style={styles.panelStar}>
                        ★ {num(selectedStore.ratingAverage).toFixed(1)}
                      </Text>
                      {selectedStore.distance != null && (
                        <Text style={styles.panelDistance}>
                          {selectedStore.distance < 1
                            ? `${Math.round(selectedStore.distance * 1000)}m`
                            : `${selectedStore.distance.toFixed(1)}km`}
                        </Text>
                      )}
                    </View>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color="#999" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.panelClose}
                  onPress={() => setSelectedStore(null)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialCommunityIcons name="close" size={18} color="#666" />
                </TouchableOpacity>

                {productsLoading ? (
                  <View style={styles.panelCenter}>
                    <ActivityIndicator color={PRIMARY} />
                  </View>
                ) : storeProducts.length === 0 ? (
                  <View style={styles.panelCenter}>
                    <Text style={styles.panelEmpty}>Ürün bulunamadı</Text>
                  </View>
                ) : (
                  <FlatList
                    data={storeProducts}
                    keyExtractor={(it) => it.id}
                    contentContainerStyle={styles.panelList}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => {
                      const price = num(item.price);
                      const sale = item.salePrice == null ? null : num(item.salePrice);
                      const hasDiscount = sale != null && sale < price;
                      const display = hasDiscount ? sale! : price;
                      return (
                        <TouchableOpacity
                          style={styles.panelProduct}
                          onPress={() =>
                            navigation.navigate('ProductDetail', { productId: item.slug })
                          }
                        >
                          <Image
                            source={{
                              uri:
                                item.thumbnail ||
                                `https://picsum.photos/seed/${item.slug}/120/120`,
                            }}
                            style={styles.panelProductImage}
                          />
                          <View style={styles.panelProductInfo}>
                            <Text numberOfLines={2} style={styles.panelProductName}>
                              {item.name}
                            </Text>
                            <View style={styles.panelPriceRow}>
                              <Text style={styles.panelPrice}>
                                {display.toLocaleString('tr-TR')} ₺
                              </Text>
                              {hasDiscount && (
                                <Text style={styles.panelOldPrice}>
                                  {price.toLocaleString('tr-TR')} ₺
                                </Text>
                              )}
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    }}
                  />
                )}

                <Button
                  mode="contained"
                  buttonColor={PRIMARY}
                  style={styles.panelGoBtn}
                  onPress={() =>
                    navigation.navigate('StoreDetail', {
                      storeId: selectedStore.slug || selectedStore.id,
                    })
                  }
                >
                  Mağazaya Git
                </Button>
              </>
            )}
          </Animated.View>
        </View>
      ) : activeTab === 'stores' ? (
        filteredStores.length === 0 ? (
          <View style={styles.center}>
            <MaterialCommunityIcons name="store-off" size={64} color="#9ca3af" />
            <Text style={styles.emptyText}>Yakınızda mağaza bulunamadı</Text>
            <Button mode="contained" onPress={() => refreshNearby(25)} buttonColor={PRIMARY}>
              Arama Alanını 25km'ye Genişlet
            </Button>
          </View>
        ) : (
          <FlatList
            data={filteredStores}
            keyExtractor={(item: any) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }: { item: any }) => {
              const c = getStoreCoords(item);
              const addrStr = formatAddress(item.address);
              return (
                <Card
                  style={styles.card}
                  onPress={() => navigation.navigate('StoreDetail', { storeId: item.slug })}
                >
                  <Card.Title
                    title={item.name}
                    subtitle={item.categories?.join(', ')}
                    left={(props) => (
                      <Avatar.Image
                        {...props}
                        size={40}
                        source={{ uri: item.logo || `https://picsum.photos/seed/${item.slug}/80/80` }}
                      />
                    )}
                    right={() =>
                      item.isVerified ? (
                        <MaterialCommunityIcons
                          name="check-decagram"
                          size={20}
                          color={ACCENT}
                          style={{ marginRight: 16 }}
                        />
                      ) : null
                    }
                  />
                  {(addrStr || item.distance != null) && (
                    <Card.Content>
                      {addrStr ? (
                        <View style={styles.addressRow}>
                          <MaterialCommunityIcons name="map-marker" size={16} color="#6b7280" />
                          <Text style={styles.addressText}>{addrStr}</Text>
                        </View>
                      ) : null}
                      {item.distance != null ? (
                        <View style={styles.addressRow}>
                          <MaterialCommunityIcons name="walk" size={16} color={PRIMARY} />
                          <Text style={[styles.addressText, { color: PRIMARY, fontWeight: '600' }]}>
                            {item.distance < 1
                              ? `${Math.round(item.distance * 1000)}m uzaklıkta`
                              : `${item.distance.toFixed(1)}km uzaklıkta`}
                          </Text>
                        </View>
                      ) : null}
                    </Card.Content>
                  )}
                  <Card.Actions>
                    <Button
                      mode="outlined"
                      onPress={() =>
                        c && openInMaps(c.lat, c.lng, item.name)
                      }
                      icon="directions"
                      compact
                      disabled={!c}
                    >
                      Yol Tarifi
                    </Button>
                    <Button
                      mode="text"
                      compact
                      onPress={() => navigation.navigate('StoreDetail', { storeId: item.slug })}
                    >
                      Mağazaya Git
                    </Button>
                  </Card.Actions>
                </Card>
              );
            }}
          />
        )
      ) : storeMatches.length === 0 && places.length === 0 ? (
        <View style={styles.center}>
          <MaterialCommunityIcons name="map-search" size={64} color="#9ca3af" />
          <Text style={styles.emptyText}>Sonuç bulunamadı</Text>
        </View>
      ) : (
        <FlatList
          data={[
            ...storeMatches.map((s: any) => ({ kind: 'store' as const, item: s })),
            ...places.map((p: any) => ({ kind: 'place' as const, item: p })),
          ]}
          keyExtractor={(it, i) => `${it.kind}-${i}`}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            if (item.kind === 'store') {
              const s = item.item;
              const c = getStoreCoords(s);
              return (
                <Card
                  style={styles.card}
                  onPress={() => navigation.navigate('StoreDetail', { storeId: s.slug || s.id })}
                >
                  <Card.Title
                    title={s.name}
                    subtitle={`Mağaza · ${s.categories?.join(', ') || ''}`}
                    left={(props) => (
                      <Avatar.Image
                        {...props}
                        size={40}
                        source={{ uri: s.logo || `https://picsum.photos/seed/${s.slug}/80/80` }}
                      />
                    )}
                  />
                  <Card.Actions>
                    <Button
                      mode="outlined"
                      onPress={() => c && openInMaps(c.lat, c.lng, s.name)}
                      icon="directions"
                      compact
                      disabled={!c}
                    >
                      Yol Tarifi
                    </Button>
                    <Button
                      mode="text"
                      compact
                      onPress={() => navigation.navigate('StoreDetail', { storeId: s.slug || s.id })}
                    >
                      Mağazaya Git
                    </Button>
                  </Card.Actions>
                </Card>
              );
            }
            const p = item.item;
            return (
              <Card
                style={styles.card}
                onPress={() => openInMaps(p.latitude, p.longitude, p.displayName)}
              >
                <Card.Title
                  title={p.displayName?.split(',')[0] || 'Bilinmeyen Yer'}
                  subtitle={typeof p.address === 'string' ? p.address : p.type}
                  left={(props) => (
                    <Avatar.Icon
                      {...props}
                      size={40}
                      icon="map-marker"
                      style={{ backgroundColor: '#e5e7eb' }}
                    />
                  )}
                />
                <Card.Actions>
                  <Button
                    mode="outlined"
                    onPress={() => openInMaps(p.latitude, p.longitude, p.displayName)}
                    icon="directions"
                    compact
                  >
                    Yol Tarifi
                  </Button>
                </Card.Actions>
              </Card>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  searchbar: { margin: 12, marginBottom: 8, elevation: 2 },
  productInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: PRIMARY,
    marginHorizontal: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  productInfoText: { flex: 1, color: '#fff', fontSize: 12, fontWeight: '600' },
  tabs: { flexDirection: 'row', paddingHorizontal: 12, gap: 8, marginBottom: 8 },
  tab: { flex: 1 },
  modeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 8,
    gap: 6,
  },
  modeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  modeBtnActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  modeText: { fontSize: 12, color: '#666', fontWeight: '600' },
  modeTextActive: { color: '#fff' },
  spacer: { flex: 1 },
  radiusBox: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  radiusBtn: { paddingVertical: 5, paddingHorizontal: 8 },
  radiusBtnActive: { backgroundColor: ACCENT },
  radiusText: { fontSize: 11, color: '#666', fontWeight: '600' },
  radiusTextActive: { color: '#fff' },
  mapWrap: { flex: 1, position: 'relative' },
  fab: {
    position: 'absolute',
    bottom: 56,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  markerInfo: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    elevation: 2,
  },
  markerInfoText: { fontSize: 12, color: '#333', textAlign: 'center', fontWeight: '600' },
  panel: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: -4, height: 0 },
    shadowRadius: 8,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    paddingRight: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  panelHeaderText: { flex: 1 },
  panelTitle: { fontWeight: '700', fontSize: 14, color: '#222' },
  panelMeta: { flexDirection: 'row', gap: 8, marginTop: 2 },
  panelStar: { fontSize: 11, color: '#f39c12', fontWeight: '600' },
  panelDistance: { fontSize: 11, color: PRIMARY, fontWeight: '600' },
  panelClose: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  panelCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  panelEmpty: { color: '#999', fontSize: 12 },
  panelList: { padding: 8, paddingBottom: 80 },
  panelProduct: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#fafafa',
    borderRadius: 8,
    padding: 6,
    marginBottom: 6,
  },
  panelProductImage: { width: 48, height: 48, borderRadius: 6, backgroundColor: '#eee' },
  panelProductInfo: { flex: 1, justifyContent: 'space-between' },
  panelProductName: { fontSize: 11, color: '#222', fontWeight: '500', lineHeight: 14 },
  panelPriceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  panelPrice: { fontSize: 12, fontWeight: '800', color: PRIMARY },
  panelOldPrice: { fontSize: 9, color: '#999', textDecorationLine: 'line-through' },
  panelGoBtn: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    borderRadius: 8,
  },
  panelSubtitle: { fontSize: 11, color: '#999', marginTop: 1 },
  searchPanel: { flex: 1 },
  searchTabs: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingTop: 8,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 8,
  },
  searchTab: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  searchTabActive: { backgroundColor: PRIMARY },
  searchTabText: { fontSize: 11, color: '#666', fontWeight: '700' },
  searchTabTextActive: { color: '#fff' },
  searchList: { flex: 1 },
  searchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f7f7f7',
  },
  searchItemImg: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#eee' },
  searchItemIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchItemInfo: { flex: 1 },
  searchItemTitle: { fontSize: 12, fontWeight: '700', color: '#222' },
  searchItemSub: { fontSize: 10, color: '#888', marginTop: 1 },
  searchItemDist: { fontSize: 10, color: PRIMARY, fontWeight: '700' },
  searchItemDistRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  searchItemMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2, flexWrap: 'wrap' },
  searchItemPrice: { fontSize: 10, color: '#c0392b', fontWeight: '700' },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#fafafa',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sortLabel: { fontSize: 10, color: '#888', fontWeight: '600' },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sortBtnActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  sortBtnText: { fontSize: 10, color: '#666', fontWeight: '700' },
  sortBtnTextActive: { color: '#fff' },
  styleControl: { position: 'absolute', top: 12, right: 12 },
  styleBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  styleMenu: {
    position: 'absolute',
    top: 48,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 4,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    minWidth: 140,
  },
  styleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  styleOptionActive: { backgroundColor: '#f0fdf4' },
  styleOptionText: { fontSize: 12, color: '#333', fontWeight: '500' },
  styleOptionTextActive: { color: PRIMARY, fontWeight: '700' },
  list: { padding: 16, paddingTop: 0 },
  card: { marginBottom: 12, borderRadius: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  loadingText: { marginTop: 12, color: '#6b7280' },
  emptyText: { fontSize: 16, color: '#6b7280', marginTop: 12, marginBottom: 16, textAlign: 'center' },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addressText: { fontSize: 13, color: '#6b7280', flex: 1 },
});
