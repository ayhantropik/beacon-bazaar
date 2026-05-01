import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Text, Searchbar, Chip } from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import type { MainTabScreenProps } from '../navigation/types';
import apiClient from '../services/api/client';
import AddToCartButton from '../components/AddToCartButton';
import { SkeletonProductCard, SkeletonStoreCard } from '../components/Skeleton';

type Props = MainTabScreenProps<'Home'>;

interface StoreItem {
  id: string;
  name: string;
  slug: string;
  logo: string;
  coverImage: string;
  ratingAverage: number;
  categories: string[];
  isVerified: boolean;
  distance?: number;
}

interface ProductItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice: number | null;
  thumbnail: string;
  ratingAverage: number;
  storeId?: string;
  store?: { name?: string };
}

interface NearbyProduct extends ProductItem {
  storeName?: string;
  storeDistance?: number;
}

const CATEGORIES = ['Kadın', 'Erkek', 'Elektronik', 'Ev & Mobilya', 'Kozmetik', 'Spor & Outdoor', 'Süpermarket', 'Hediyelik'];
const PRIMARY = '#1a6b52';

function ratingOutOf10(v: any): string | null {
  const n = typeof v === 'string' ? parseFloat(v) : v;
  if (!Number.isFinite(n) || n <= 0) return null;
  return (n * 2).toFixed(1);
}

function countdownText(endsAt: string): string {
  const diff = Math.max(0, new Date(endsAt).getTime() - Date.now());
  if (diff === 0) return 'Bitti';
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);
  if (h > 0) return `${h}s ${String(m).padStart(2, '0')}d`;
  if (m > 0) return `${m}d ${String(s).padStart(2, '0')}s`;
  return `${s}s`;
}

export default function HomeScreen({ navigation }: Props) {
  const [search, setSearch] = useState('');
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [nearbyProducts, setNearbyProducts] = useState<NearbyProduct[]>([]);
  const [auctions, setAuctions] = useState<any[]>([]);
  const [, setTick] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    let storeList: any[] = [];
    let coords: { lat: number; lng: number } | null = null;

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        coords = { lat: loc.coords.latitude, lng: loc.coords.longitude };
        const nr = await apiClient.get(
          `/stores/nearby?latitude=${coords.lat}&longitude=${coords.lng}&radius=50`,
        );
        storeList = nr.data?.data || [];
      }
    } catch {
      // konum reddedildi
    }

    if (storeList.length === 0) {
      try {
        const sr = await apiClient.get('/stores/search?limit=12');
        storeList = sr.data?.data || [];
      } catch {
        // ignore
      }
    }

    setStores(storeList.slice(0, 12));

    try {
      const productsRes = await apiClient.get('/products/featured');
      setProducts(productsRes.data?.data || []);
    } catch {
      // ignore
    }

    try {
      const auctionsRes = await apiClient.get('/auction/today');
      const items = auctionsRes.data?.data || [];
      const active = items
        .filter((a: any) => new Date(a.endsAt).getTime() > Date.now())
        .sort(
          (a: any, b: any) =>
            new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime(),
        );
      setAuctions(active.slice(0, 8));
    } catch {
      // ignore
    }

    if (coords && storeList.length > 0) {
      try {
        const storeIds: string[] = storeList.slice(0, 6).map((s: any) => s.id);
        const prodRes = await apiClient.get(
          `/products/search?storeIds=${storeIds.join(',')}&limit=12`,
        );
        const items = (prodRes.data?.data || []).map((p: any) => {
          const store = storeList.find((s: any) => s.id === p.storeId);
          return {
            ...p,
            storeName: store?.name,
            storeDistance: store?.distance,
          };
        });
        setNearbyProducts(items);
      } catch {
        // ignore
      }
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Geri sayım için saniyelik tick
  useEffect(() => {
    if (auctions.length === 0) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [auctions.length]);

  const handleSearch = () => {
    if (search.trim()) {
      navigation.navigate('Search', { query: search });
    }
  };

  if (loading) {
    return (
      <SafeAreaView edges={['top']} style={styles.safe}>
        <ScrollView style={styles.container}>
          <View style={styles.brandHeader}>
            <View style={styles.brandLogo}>
              <Text style={styles.brandLogoText}>VV</Text>
            </View>
            <View style={styles.brandTextWrap}>
              <Text style={styles.brandName}>VeniVidiCoop</Text>
              <Text style={styles.brandTagline}>Yükleniyor...</Text>
            </View>
          </View>
          <Searchbar
            placeholder="Ne aramıştınız?"
            value=""
            onChangeText={() => null}
            style={styles.searchbar}
            editable={false}
          />
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Yakınındaki Mağazalar
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalList}>
            <SkeletonStoreCard />
            <SkeletonStoreCard />
            <SkeletonStoreCard />
          </ScrollView>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Öne Çıkan Ürünler
          </Text>
          <View style={styles.productGrid}>
            <SkeletonProductCard />
            <SkeletonProductCard />
            <SkeletonProductCard />
            <SkeletonProductCard />
            <SkeletonProductCard />
            <SkeletonProductCard />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const producerProducts = products.filter((p) => p.storeId).slice(0, 10);
  const discountProducts = products.filter((p) => p.salePrice && p.salePrice < p.price).slice(0, 10);
  const wholesaleProducts = products.filter((p) => Number(p.price) > 500).slice(0, 10);

  const renderHorizontalProduct = (
    product: ProductItem & { storeName?: string; storeDistance?: number },
    badge: { text: string; color: string } | null,
    extra?: React.ReactNode,
  ) => {
    const hasDiscount = product.salePrice && product.salePrice < product.price;
    const displayPrice = hasDiscount ? product.salePrice! : product.price;
    return (
      <TouchableOpacity
        key={product.id}
        style={styles.hCard}
        onPress={() => navigation.navigate('ProductDetail', { productId: product.slug })}
      >
        <View style={styles.hImageWrap}>
          <Image
            source={{ uri: product.thumbnail || `https://picsum.photos/seed/${product.slug}/300/300` }}
            style={styles.hImage}
          />
          {badge && (
            <View style={[styles.badge, { backgroundColor: badge.color }]}>
              <Text style={styles.badgeText}>{badge.text}</Text>
            </View>
          )}
        </View>
        <Text numberOfLines={2} style={styles.hName}>{product.name}</Text>
        {extra}
        {(() => {
          const r = ratingOutOf10(product.ratingAverage);
          return r ? (
            <View style={styles.ratingRow}>
              <Icon name="star" size={11} color="#f59e0b" />
              <Text style={styles.ratingText}>{r}/10</Text>
            </View>
          ) : null;
        })()}
        <View style={styles.hPriceRow}>
          <View style={styles.hPriceCol}>
            <Text style={styles.hPrice}>
              {Number(displayPrice).toLocaleString('tr-TR')} ₺
            </Text>
            {hasDiscount && (
              <Text style={styles.hOldPrice}>
                {Number(product.price).toLocaleString('tr-TR')} ₺
              </Text>
            )}
          </View>
          <AddToCartButton product={product} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchAll(true)}
            tintColor={PRIMARY}
            colors={[PRIMARY]}
          />
        }
      >
        {/* Logo + Marka */}
        <View style={styles.brandHeader}>
          <View style={styles.brandLogo}>
            <Text style={styles.brandLogoText}>VV</Text>
          </View>
          <View style={styles.brandTextWrap}>
            <Text style={styles.brandName}>VeniVidiCoop</Text>
            <Text style={styles.brandTagline}>
              Üreticiden tüketiciye, aradığın her şey
            </Text>
          </View>
        </View>

        <Searchbar
          placeholder="Ne aramıştınız?"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={handleSearch}
          style={styles.searchbar}
        />

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.quickCard, { backgroundColor: '#fff5f3' }]}
            onPress={() => navigation.navigate('Auctions')}
          >
            <Icon name="gavel" size={28} color="#c0392b" />
            <Text style={styles.quickLabel}>Açık Artırma</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickCard, { backgroundColor: '#f0f7ff' }]}
            onPress={() => navigation.navigate('OtoListing')}
          >
            <Icon name="car" size={28} color="#2563eb" />
            <Text style={styles.quickLabel}>Oto</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickCard, { backgroundColor: '#f3fff5' }]}
            onPress={() => navigation.navigate('EmlakListing')}
          >
            <Icon name="home-city" size={28} color={PRIMARY} />
            <Text style={styles.quickLabel}>Emlak</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickCard, { backgroundColor: '#fff8e6' }]}
            onPress={() => navigation.navigate('YemekListing')}
          >
            <Icon name="silverware-fork-knife" size={28} color="#e67e22" />
            <Text style={styles.quickLabel}>Yemek</Text>
          </TouchableOpacity>
        </View>

        {/* Hediye Asistanı banner */}
        <TouchableOpacity
          style={styles.giftBanner}
          onPress={() => navigation.navigate('GiftPicker')}
          activeOpacity={0.85}
        >
          <View style={styles.giftIcon}>
            <Icon name="gift" size={26} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.giftTitle}>🎁 Hediye Asistanı</Text>
            <Text style={styles.giftSub}>
              Sevdiğine ne alacağını bilmiyor musun? Bize sor!
            </Text>
          </View>
          <Icon name="chevron-right" size={22} color="#92400e" />
        </TouchableOpacity>

        {/* Yakınınızdaki Ürünler — EN ÜSTTE */}
        {nearbyProducts.length > 0 && (
          <>
            <View style={[styles.sectionTag, { backgroundColor: '#16a085' }]}>
              <Text style={styles.sectionTagText}>📍 Son Aramalarınız · Yakınınızdaki Ürünler</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll}>
              {nearbyProducts.map((p) =>
                renderHorizontalProduct(
                  p,
                  null,
                  p.storeName ? (
                    <Text style={styles.storeBadge} numberOfLines={1}>
                      🏬 {p.storeName}
                      {p.storeDistance != null
                        ? p.storeDistance < 1
                          ? ` · ${Math.round(p.storeDistance * 1000)}m`
                          : ` · ${p.storeDistance.toFixed(1)}km`
                        : ''}
                    </Text>
                  ) : null,
                ),
              )}
            </ScrollView>
          </>
        )}

        {/* Açık Artırma — geri sayımlı */}
        {auctions.length > 0 && (
          <>
            <View style={styles.auctionHeader}>
              <View style={[styles.sectionTag, { backgroundColor: '#c0392b', marginTop: 0 }]}>
                <Text style={styles.sectionTagText}>🔨 Açık Artırma</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Auctions')}>
                <Text style={styles.seeAll}>Tümü →</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll}>
              {auctions.map((a: any) => {
                const current = parseFloat(a.currentHighestBid || a.startingPrice);
                const cd = countdownText(a.endsAt);
                return (
                  <TouchableOpacity
                    key={a.id}
                    style={styles.auctionCard}
                    onPress={() => navigation.navigate('AuctionDetail', { auctionId: a.id })}
                  >
                    <View style={styles.hImageWrap}>
                      <Image
                        source={{
                          uri: a.product?.thumbnail || `https://picsum.photos/seed/${a.product?.slug || a.id}/300/300`,
                        }}
                        style={styles.hImage}
                      />
                      <View style={styles.auctionBadge}>
                        <Icon name="clock-outline" size={11} color="#fff" />
                        <Text style={styles.auctionBadgeText}>{cd}</Text>
                      </View>
                    </View>
                    <Text numberOfLines={2} style={styles.hName}>
                      {a.product?.name || 'Ürün'}
                    </Text>
                    <Text style={styles.auctionMeta}>
                      {a.totalBids} teklif
                    </Text>
                    <Text style={styles.auctionPrice}>
                      {current.toLocaleString('tr-TR')} ₺
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </>
        )}

        {/* Categories */}
        <Text variant="titleMedium" style={styles.sectionTitle}>Kategoriler</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {CATEGORIES.map((cat) => (
            <Chip
              key={cat}
              mode="outlined"
              onPress={() => navigation.navigate('Search', { query: cat })}
              style={styles.chip}
            >
              {cat}
            </Chip>
          ))}
        </ScrollView>

        {/* Yakınındaki Mağazalar */}
        <Text variant="titleMedium" style={styles.sectionTitle}>Yakınındaki Mağazalar</Text>
        <FlatList
          horizontal
          data={stores}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => navigation.navigate('StoreDetail', { storeId: item.slug })}
              style={styles.storeCard}
            >
              <Image
                source={{ uri: item.coverImage || `https://picsum.photos/seed/${item.slug}/160/100` }}
                style={styles.storeImage}
              />
              <View style={styles.storeInfo}>
                <Text variant="labelLarge" numberOfLines={1}>{item.name}</Text>
                <View style={styles.metaRow}>
                  <Text variant="bodySmall" style={styles.muted}>
                    ★ {Number(item.ratingAverage || 0).toFixed(1)}
                  </Text>
                  {item.distance != null && (
                    <Text style={styles.distance}>
                      {item.distance < 1 ? `${Math.round(item.distance * 1000)}m` : `${item.distance.toFixed(1)}km`}
                    </Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )}
        />

        {/* Üreticiden Gelenler */}
        {producerProducts.length > 0 && (
          <>
            <View style={[styles.sectionTag, { backgroundColor: '#d4882e' }]}>
              <Text style={styles.sectionTagText}>🏭 Üreticiden Gelenler</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll}>
              {producerProducts.map((p) =>
                renderHorizontalProduct(p, { text: 'Üreticiden', color: '#d4882e' }),
              )}
            </ScrollView>
          </>
        )}

        {/* İndirimdeki Ürünler */}
        {discountProducts.length > 0 && (
          <>
            <View style={[styles.sectionTag, { backgroundColor: '#c0392b' }]}>
              <Text style={styles.sectionTagText}>🏷️ İndirimdeki Ürünler</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll}>
              {discountProducts.map((p) => {
                const pct = Math.round(((p.price - (p.salePrice || 0)) / p.price) * 100);
                return renderHorizontalProduct(p, { text: `%${pct}`, color: '#c0392b' });
              })}
            </ScrollView>
          </>
        )}

        {/* Toptan Satışlar */}
        {wholesaleProducts.length > 0 && (
          <>
            <View style={[styles.sectionTag, { backgroundColor: '#2980b9' }]}>
              <Text style={styles.sectionTagText}>📦 Toptan Satışlar</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll}>
              {wholesaleProducts.map((p) => {
                const wholesale = Math.round(Number(p.price) * 0.7);
                return (
                  <TouchableOpacity
                    key={`w-${p.id}`}
                    style={styles.hCard}
                    onPress={() => navigation.navigate('ProductDetail', { productId: p.slug })}
                  >
                    <View style={styles.hImageWrap}>
                      <Image
                        source={{ uri: p.thumbnail || `https://picsum.photos/seed/${p.slug}/300/300` }}
                        style={styles.hImage}
                      />
                      <View style={[styles.badge, { backgroundColor: '#2980b9' }]}>
                        <Text style={styles.badgeText}>Toptan</Text>
                      </View>
                      <View style={styles.minQty}>
                        <Text style={styles.minQtyText}>Min. 10</Text>
                      </View>
                    </View>
                    <Text numberOfLines={2} style={styles.hName}>{p.name}</Text>
                    <Text style={styles.retailPrice}>
                      Perakende: {Number(p.price).toLocaleString('tr-TR')} ₺
                    </Text>
                    <Text style={styles.wholesalePrice}>
                      Toptan: {wholesale.toLocaleString('tr-TR')} ₺
                    </Text>
                    <View style={styles.wholesaleFooter}>
                      <Text style={styles.savings}>%30 tasarruf</Text>
                      <AddToCartButton product={{ ...p, price: wholesale }} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </>
        )}

        {/* Öne Çıkan Ürünler (3 sütunlu grid) */}
        <Text variant="titleMedium" style={styles.sectionTitle}>Öne Çıkan Ürünler</Text>
        <View style={styles.productGrid}>
          {products.slice(0, 9).map((product) => {
            const hasDiscount = product.salePrice && product.salePrice < product.price;
            return (
              <TouchableOpacity
                key={product.id}
                style={styles.productCard}
                onPress={() => navigation.navigate('ProductDetail', { productId: product.slug })}
              >
                <Image
                  source={{ uri: product.thumbnail || `https://picsum.photos/seed/${product.slug}/300/300` }}
                  style={styles.productImage}
                />
                <Text variant="labelSmall" numberOfLines={2} style={styles.productName}>{product.name}</Text>
                {(() => {
                  const r = ratingOutOf10(product.ratingAverage);
                  return r ? (
                    <View style={styles.ratingRow}>
                      <Icon name="star" size={11} color="#f59e0b" />
                      <Text style={styles.ratingText}>{r}/10</Text>
                    </View>
                  ) : null;
                })()}
                <View style={styles.priceRow}>
                  <View style={styles.priceCol}>
                    <Text variant="labelLarge" style={styles.price}>
                      {Number(hasDiscount ? product.salePrice : product.price).toLocaleString('tr-TR')} ₺
                    </Text>
                    {hasDiscount && (
                      <Text variant="bodySmall" style={styles.oldPrice}>
                        {Number(product.price).toLocaleString('tr-TR')} ₺
                      </Text>
                    )}
                  </View>
                  <AddToCartButton product={product} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    gap: 10,
  },
  brandLogo: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandLogoText: { color: '#fff', fontWeight: '900', fontSize: 14, letterSpacing: 1 },
  brandTextWrap: { flex: 1 },
  brandName: { fontSize: 18, fontWeight: '800', color: PRIMARY, letterSpacing: 0.3 },
  brandTagline: { fontSize: 10, color: '#999', marginTop: 1 },
  searchbar: { marginHorizontal: 16, marginVertical: 8, elevation: 2 },
  sectionTitle: { fontWeight: '700', marginHorizontal: 16, marginTop: 16, marginBottom: 8 },
  sectionTag: {
    alignSelf: 'flex-start',
    marginLeft: 12,
    marginTop: 18,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 4,
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
  },
  sectionTagText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  chipRow: { paddingHorizontal: 12, marginBottom: 8 },
  chip: { marginHorizontal: 4 },
  horizontalList: { paddingHorizontal: 12 },
  hScroll: { paddingLeft: 12, marginBottom: 4 },
  storeCard: { width: 160, marginHorizontal: 4, borderRadius: 12, overflow: 'hidden', backgroundColor: '#f9f9f9' },
  storeImage: { width: 160, height: 100 },
  storeInfo: { padding: 8 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  muted: { color: '#999' },
  distance: { fontSize: 11, color: '#16a085', fontWeight: '600' },
  hCard: {
    width: 130,
    marginRight: 8,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
    overflow: 'hidden',
    paddingBottom: 8,
  },
  hImageWrap: { width: '100%', aspectRatio: 1, backgroundColor: '#f8f8f8', position: 'relative' },
  hImage: { width: '100%', height: '100%' },
  badge: {
    position: 'absolute',
    top: 6,
    left: 0,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  minQty: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
  },
  minQtyText: { color: '#fff', fontSize: 9, fontWeight: '600' },
  hName: { fontSize: 11, fontWeight: '500', marginHorizontal: 6, marginTop: 6, lineHeight: 14, minHeight: 28 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginHorizontal: 6, marginTop: 2 },
  ratingText: { fontSize: 10, color: '#666', fontWeight: '700' },
  storeBadge: { fontSize: 10, color: '#16a085', fontWeight: '600', marginHorizontal: 6, marginTop: 2 },
  hPriceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 6, marginTop: 4 },
  hPriceCol: { flex: 1 },
  hPrice: { color: PRIMARY, fontWeight: '800', fontSize: 13 },
  hOldPrice: { color: '#999', textDecorationLine: 'line-through', fontSize: 10 },
  retailPrice: { fontSize: 9, color: '#999', textDecorationLine: 'line-through', marginHorizontal: 6, marginTop: 4 },
  wholesalePrice: { fontSize: 13, fontWeight: '800', color: '#2980b9', marginHorizontal: 6 },
  savings: { fontSize: 9, color: '#059669', fontWeight: '600' },
  wholesaleFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 6, marginTop: 4 },
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8, paddingBottom: 24 },
  productCard: { width: '31.33%', margin: '1%', backgroundColor: '#f9f9f9', borderRadius: 10, overflow: 'hidden' },
  productImage: { width: '100%', aspectRatio: 1 },
  productName: { marginHorizontal: 6, marginTop: 6, fontSize: 11, minHeight: 28, lineHeight: 14 },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6, paddingBottom: 6, marginTop: 2 },
  priceCol: { flex: 1 },
  price: { color: '#2563eb', fontWeight: '700', fontSize: 12 },
  oldPrice: { color: '#999', textDecorationLine: 'line-through', fontSize: 10 },
  quickActions: { flexDirection: 'row', paddingHorizontal: 12, gap: 8, marginTop: 4 },
  quickCard: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12 },
  quickLabel: { fontSize: 11, fontWeight: '600', marginTop: 6, color: '#333' },
  giftBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff8e6',
    marginHorizontal: 12,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fde2bd',
  },
  giftIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#d4882e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  giftTitle: { fontSize: 14, fontWeight: '800', color: '#92400e' },
  giftSub: { fontSize: 11, color: '#92400e', marginTop: 2 },
  auctionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 10,
    paddingRight: 16,
  },
  seeAll: { color: '#c0392b', fontSize: 12, fontWeight: '700' },
  auctionCard: {
    width: 140,
    marginRight: 8,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fde2dd',
    overflow: 'hidden',
    paddingBottom: 8,
  },
  auctionBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: 'rgba(192,57,43,0.92)',
  },
  auctionBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  auctionMeta: { fontSize: 10, color: '#666', marginHorizontal: 6, marginTop: 2 },
  auctionPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#c0392b',
    marginHorizontal: 6,
    marginTop: 2,
  },
});
