import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Text,
  Button,
  IconButton,
  Chip,
  ActivityIndicator,
  Snackbar,
  TextInput,
} from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAppDispatch } from '../store/hooks';
import { addItem } from '../store/slices/cartSlice';
import apiClient from '../services/api/client';
import messageService from '../services/api/message.service';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetail'>;

const PRIMARY = '#1a6b52';
const ACCENT = '#2563eb';
const DISCOUNT = '#c0392b';

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  shortDescription?: string | null;
  price: number | string;
  salePrice: number | string | null;
  currency: string;
  thumbnail: string | null;
  images: string[] | null;
  categories: string[];
  tags?: string[];
  ratingAverage: number | string | null;
  ratingCount: number;
  stockQuantity: number;
  storeId: string;
  store?: { name: string; slug: string; isVerified?: boolean };
}

interface PricePoint {
  id: string;
  price: string;
  salePrice: string | null;
  createdAt: string;
}

interface Question {
  id: string;
  question: string;
  answer?: string | null;
  createdAt: string;
  askedBy?: { name?: string };
}

function num(v: any): number {
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return Number.isFinite(n) ? n : 0;
}

function ratingTo10(v: any): string | null {
  const n = num(v);
  if (n <= 0) return null;
  return (n * 2).toFixed(1);
}

const SCREEN_W = Dimensions.get('window').width;

export default function ProductDetailScreen({ route, navigation }: Props) {
  const { productId } = route.params;
  const dispatch = useAppDispatch();

  const [product, setProduct] = useState<Product | null>(null);
  const [history, setHistory] = useState<PricePoint[]>([]);
  const [related, setRelated] = useState<Product[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [snackVisible, setSnackVisible] = useState(false);
  const [snackMsg, setSnackMsg] = useState('Ürün sepete eklendi!');
  const [imageIndex, setImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'desc' | 'history' | 'qa'>('desc');
  const [questionText, setQuestionText] = useState('');
  const [submittingQ, setSubmittingQ] = useState(false);

  const galleryRef = useRef<ScrollView>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await apiClient.get(`/products/${productId}`);
        const p: Product = res.data?.data || res.data;
        if (!mounted) return;
        setProduct(p);

        // Paralel fetch: price history, related, qa
        const cat = p.categories?.[0];
        const [hist, rel, qa] = await Promise.allSettled([
          apiClient.get(`/products/${p.id}/price-history`),
          cat
            ? apiClient.get(`/products/search`, {
                params: { category: cat, limit: 8 },
              })
            : Promise.reject(),
          apiClient.get(`/qa/listings/${p.id}/questions`),
        ]);

        if (mounted) {
          if (hist.status === 'fulfilled') {
            setHistory(hist.value.data?.data || []);
          }
          if (rel.status === 'fulfilled') {
            const items = (rel.value.data?.data || []).filter(
              (x: Product) => x.id !== p.id,
            );
            setRelated(items.slice(0, 8));
          }
          if (qa.status === 'fulfilled') {
            setQuestions(qa.value.data?.data || []);
          }
        }
      } catch {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [productId]);

  // Price history grafiği için (erken return'lerden ÖNCE — hook sıralaması)
  const priceSeries = useMemo(() => {
    return history
      .map((h) => {
        const sp = h.salePrice ? num(h.salePrice) : null;
        const p = num(h.price);
        return {
          date: new Date(h.createdAt),
          price: sp != null && sp < p ? sp : p,
        };
      })
      .filter((x) => Number.isFinite(x.price))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [history]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }
  if (!product) {
    return (
      <View style={styles.center}>
        <Text>Ürün bulunamadı</Text>
      </View>
    );
  }

  const price = num(product.price);
  const salePrice = product.salePrice == null ? null : num(product.salePrice);
  const hasDiscount = salePrice != null && salePrice < price;
  const currentPrice = hasDiscount ? salePrice! : price;
  const discountPct = hasDiscount ? Math.round(((price - salePrice!) / price) * 100) : 0;

  const galleryImages: string[] = (() => {
    const list: string[] = [];
    if (product.thumbnail) list.push(product.thumbnail);
    if (product.images && Array.isArray(product.images)) {
      product.images.forEach((img) => {
        if (img && !list.includes(img)) list.push(img);
      });
    }
    if (list.length === 0) {
      list.push(`https://picsum.photos/seed/${product.slug}/800/800`);
    }
    return list;
  })();

  const handleAddToCart = () => {
    dispatch(
      addItem({
        id: product.id,
        productId: product.id,
        storeId: product.storeId,
        name: product.name,
        thumbnail: galleryImages[0],
        price: currentPrice,
        quantity,
      } as any),
    );
    setSnackMsg('Ürün sepete eklendi!');
    setSnackVisible(true);
  };

  const submitQuestion = async () => {
    const q = questionText.trim();
    if (!q || submittingQ) return;
    setSubmittingQ(true);
    try {
      // Önce mağaza sahibini bul
      const storeRes = await apiClient.get(`/stores/${product.storeId}`);
      const storeData = storeRes.data?.data || storeRes.data;
      const ownerId = storeData?.ownerId;
      if (!ownerId) {
        setSnackMsg('Mağaza sahibi bulunamadı');
        setSnackVisible(true);
        return;
      }
      // Mağaza ile mesajlaşma başlat
      const res = await messageService.start({
        sellerUserId: ownerId,
        listingId: product.id,
        listingType: 'product',
        listingTitle: product.name,
        message: q,
      });
      const conv = res.data?.data;
      setQuestionText('');
      setSnackMsg('Mesajınız gönderildi');
      setSnackVisible(true);
      if (conv?.id) {
        setTimeout(() => {
          navigation.navigate('Chat', {
            conversationId: conv.id,
            title: storeData?.name || 'Mağaza',
          });
        }, 250);
      }
    } catch (e: any) {
      const raw = e?.response?.data?.message;
      const msg = Array.isArray(raw) ? raw.join(', ') : (typeof raw === 'string' ? raw : '');
      setSnackMsg(msg || 'Mesaj gönderilemedi');
      setSnackVisible(true);
    } finally {
      setSubmittingQ(false);
    }
  };

  const minPrice =
    priceSeries.length > 0 ? Math.min(...priceSeries.map((p) => p.price)) : 0;
  const maxPrice =
    priceSeries.length > 0 ? Math.max(...priceSeries.map((p) => p.price)) : 0;

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Görsel galeri */}
        <View style={styles.galleryWrap}>
          <ScrollView
            ref={galleryRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
              setImageIndex(idx);
            }}
          >
            {galleryImages.map((img, i) => (
              <Image key={i} source={{ uri: img }} style={styles.galleryImage} />
            ))}
          </ScrollView>

          {galleryImages.length > 1 && (
            <View style={styles.dots}>
              {galleryImages.map((_, i) => (
                <View
                  key={i}
                  style={[styles.dot, i === imageIndex && styles.dotActive]}
                />
              ))}
            </View>
          )}

          {hasDiscount && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>%{discountPct}</Text>
            </View>
          )}
        </View>

        <View style={styles.content}>
          <View style={styles.chipRow}>
            {product.categories?.map((cat) => (
              <Chip key={cat} mode="outlined" compact style={styles.chip}>
                {cat}
              </Chip>
            ))}
          </View>

          <Text variant="headlineSmall" style={styles.name}>
            {product.name}
          </Text>

          <View style={styles.ratingRow}>
            <Icon name="star" size={14} color="#f59e0b" />
            {ratingTo10(product.ratingAverage) ? (
              <Text style={styles.ratingText}>
                {ratingTo10(product.ratingAverage)}/10
              </Text>
            ) : (
              <Text style={styles.muted}>Henüz değerlendirme yok</Text>
            )}
            {product.ratingCount > 0 && (
              <Text style={styles.muted}>· {product.ratingCount} değerlendirme</Text>
            )}
          </View>

          <View style={styles.priceRow}>
            <Text variant="headlineMedium" style={[styles.price, hasDiscount && { color: DISCOUNT }]}>
              {currentPrice.toLocaleString('tr-TR')} ₺
            </Text>
            {hasDiscount && (
              <Text variant="titleMedium" style={styles.oldPrice}>
                {price.toLocaleString('tr-TR')} ₺
              </Text>
            )}
          </View>

          {product.stockQuantity > 0 ? (
            product.stockQuantity <= 5 ? (
              <View style={styles.stockRow}>
                <Icon name="alert" size={14} color="#dc2626" />
                <Text style={styles.lowStock}>Son {product.stockQuantity} adet</Text>
              </View>
            ) : (
              <View style={styles.stockRow}>
                <Icon name="check-circle" size={14} color="#16a34a" />
                <Text style={styles.inStock}>Stokta</Text>
              </View>
            )
          ) : (
            <View style={styles.stockRow}>
              <Icon name="close-circle" size={14} color="#999" />
              <Text style={styles.outOfStock}>Stokta yok</Text>
            </View>
          )}

          {/* Sekme barı */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'desc' && styles.tabBtnActive]}
              onPress={() => setActiveTab('desc')}
            >
              <Text
                style={[styles.tabText, activeTab === 'desc' && styles.tabTextActive]}
              >
                Açıklama
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'history' && styles.tabBtnActive]}
              onPress={() => setActiveTab('history')}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'history' && styles.tabTextActive,
                ]}
              >
                Fiyat Geçmişi
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'qa' && styles.tabBtnActive]}
              onPress={() => setActiveTab('qa')}
            >
              <Text
                style={[styles.tabText, activeTab === 'qa' && styles.tabTextActive]}
              >
                Soru & Cevap
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'desc' && (
            <View>
              {product.shortDescription && (
                <Text style={styles.shortDesc}>{product.shortDescription}</Text>
              )}
              <Text style={styles.description}>
                {product.description || 'Açıklama bulunmuyor.'}
              </Text>
              {product.tags && product.tags.length > 0 && (
                <View style={styles.tagsRow}>
                  {product.tags.map((t) => (
                    <Text key={t} style={styles.tag}>
                      #{t}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          )}

          {activeTab === 'history' && (
            <View style={styles.historyWrap}>
              {priceSeries.length === 0 ? (
                <Text style={styles.muted}>Fiyat geçmişi henüz yok</Text>
              ) : priceSeries.length === 1 ? (
                <View style={styles.singleHistory}>
                  <Text style={styles.historyLabel}>Mevcut Fiyat</Text>
                  <Text style={styles.historyValue}>
                    {priceSeries[0].price.toLocaleString('tr-TR')} ₺
                  </Text>
                </View>
              ) : (
                <View>
                  <View style={styles.chartLegend}>
                    <Text style={styles.legendItem}>
                      En Düşük: {minPrice.toLocaleString('tr-TR')} ₺
                    </Text>
                    <Text style={styles.legendItem}>
                      En Yüksek: {maxPrice.toLocaleString('tr-TR')} ₺
                    </Text>
                  </View>
                  <View style={styles.chart}>
                    {priceSeries.map((p, i) => {
                      const range = maxPrice - minPrice || 1;
                      const heightPct = ((p.price - minPrice) / range) * 100;
                      return (
                        <View key={i} style={styles.barCol}>
                          <View
                            style={[
                              styles.bar,
                              { height: `${20 + heightPct * 0.8}%` },
                              p.price === minPrice && { backgroundColor: '#16a34a' },
                              p.price === maxPrice && { backgroundColor: DISCOUNT },
                            ]}
                          />
                          <Text style={styles.barDate}>
                            {p.date.toLocaleDateString('tr-TR', {
                              day: '2-digit',
                              month: '2-digit',
                            })}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>
          )}

          {activeTab === 'qa' && (
            <View>
              <Text style={styles.qaInfo}>
                Bu ürün hakkındaki sorunuz mağazaya mesaj olarak iletilecek ve sohbet
                ekranı açılacaktır.
              </Text>
              <View style={styles.qaInputRow}>
                <TextInput
                  mode="outlined"
                  placeholder="Sorunuzu yazın..."
                  value={questionText}
                  onChangeText={setQuestionText}
                  style={styles.qaInput}
                  multiline
                  dense
                />
                <Button
                  mode="contained"
                  buttonColor={PRIMARY}
                  loading={submittingQ}
                  disabled={!questionText.trim() || submittingQ}
                  onPress={submitQuestion}
                  compact
                  icon="send"
                >
                  Gönder
                </Button>
              </View>
            </View>
          )}

          {/* Mağaza linki */}
          {product.store && (
            <TouchableOpacity
              style={styles.storeCard}
              onPress={() =>
                navigation.navigate('StoreDetail', { storeId: product.store!.slug })
              }
            >
              <View style={styles.storeIcon}>
                <Icon name="storefront" size={20} color="#fff" />
              </View>
              <View style={styles.storeInfo}>
                <Text style={styles.storeName}>{product.store.name}</Text>
                <Text style={styles.storeMeta}>Mağazayı Görüntüle</Text>
              </View>
              <Icon name="chevron-right" size={20} color="#999" />
            </TouchableOpacity>
          )}

          {/* Benzer ürünler */}
          {related.length > 0 && (
            <View style={{ marginTop: 16 }}>
              <Text style={styles.sectionTitle}>Benzer Ürünler</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {related.map((p) => {
                  const pPrice = num(p.price);
                  const pSale = p.salePrice == null ? null : num(p.salePrice);
                  const hasDisc = pSale != null && pSale < pPrice;
                  const display = hasDisc ? pSale! : pPrice;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={styles.relatedCard}
                      onPress={() =>
                        navigation.replace('ProductDetail', { productId: p.slug })
                      }
                    >
                      <Image
                        source={{
                          uri: p.thumbnail || `https://picsum.photos/seed/${p.slug}/200/200`,
                        }}
                        style={styles.relatedImg}
                      />
                      <Text numberOfLines={2} style={styles.relatedName}>
                        {p.name}
                      </Text>
                      <Text style={styles.relatedPrice}>
                        {display.toLocaleString('tr-TR')} ₺
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.quantityRow}>
          <IconButton
            icon="minus"
            size={20}
            onPress={() => setQuantity((q) => Math.max(1, q - 1))}
          />
          <Text variant="titleMedium">{quantity}</Text>
          <IconButton
            icon="plus"
            size={20}
            onPress={() => setQuantity((q) => q + 1)}
          />
        </View>
        <Button
          mode="contained"
          icon="cart-plus"
          onPress={handleAddToCart}
          disabled={product.stockQuantity === 0}
          buttonColor={PRIMARY}
          style={styles.addButton}
          contentStyle={styles.addButtonContent}
        >
          Sepete Ekle
        </Button>
      </View>

      <Snackbar
        visible={snackVisible}
        onDismiss={() => setSnackVisible(false)}
        duration={2000}
      >
        <Text style={{ color: '#fff' }}>{String(snackMsg || '')}</Text>
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  galleryWrap: { width: SCREEN_W, height: SCREEN_W, backgroundColor: '#f5f5f5' },
  galleryImage: { width: SCREEN_W, height: SCREEN_W },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive: { backgroundColor: '#fff', width: 18 },
  discountBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: DISCOUNT,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  discountText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  content: { padding: 16 },
  chipRow: { flexDirection: 'row', gap: 6, marginBottom: 8, flexWrap: 'wrap' },
  chip: {},
  name: { fontWeight: '700', marginBottom: 8 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  ratingText: { fontSize: 13, fontWeight: '700', color: '#222' },
  muted: { color: '#999', fontSize: 12 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 12, marginBottom: 8 },
  price: { color: PRIMARY, fontWeight: '800' },
  oldPrice: { color: '#999', textDecorationLine: 'line-through' },
  stockRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16 },
  inStock: { color: '#16a34a', fontWeight: '600' },
  lowStock: { color: '#dc2626', fontWeight: '700' },
  outOfStock: { color: '#999', fontWeight: '600' },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 12,
  },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  tabBtnActive: { borderBottomWidth: 2, borderBottomColor: PRIMARY },
  tabText: { fontSize: 13, color: '#666', fontWeight: '600' },
  tabTextActive: { color: PRIMARY, fontWeight: '700' },
  shortDesc: { fontSize: 14, color: '#222', fontWeight: '500', marginBottom: 8 },
  description: { color: '#555', lineHeight: 22, marginBottom: 12 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  tag: { fontSize: 11, color: ACCENT, backgroundColor: '#eff6ff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  historyWrap: { paddingVertical: 8 },
  singleHistory: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  historyLabel: { fontSize: 12, color: '#666', marginBottom: 4 },
  historyValue: { fontSize: 22, fontWeight: '800', color: PRIMARY },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  legendItem: { fontSize: 11, color: '#666', fontWeight: '600' },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 140,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 8,
    gap: 6,
  },
  barCol: { flex: 1, alignItems: 'center' },
  bar: {
    width: '70%',
    backgroundColor: ACCENT,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    minHeight: 8,
  },
  barDate: { fontSize: 9, color: '#888', marginTop: 4 },
  qaInputRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-end', marginBottom: 12 },
  qaInput: { flex: 1, backgroundColor: '#fff' },
  qaItem: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  qaQ: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 6 },
  qaQuestion: { flex: 1, fontSize: 13, color: '#222', fontWeight: '600', lineHeight: 18 },
  qaA: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, paddingLeft: 22 },
  qaAnswer: { flex: 1, fontSize: 13, color: '#444', lineHeight: 18 },
  qaWaiting: { fontSize: 11, color: '#999', fontStyle: 'italic', paddingLeft: 22 },
  storeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
  },
  storeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storeInfo: { flex: 1 },
  storeName: { fontWeight: '700', color: '#222' },
  storeMeta: { fontSize: 11, color: '#888' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#222', marginBottom: 8 },
  relatedCard: {
    width: 120,
    marginRight: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    overflow: 'hidden',
    paddingBottom: 8,
  },
  relatedImg: { width: '100%', aspectRatio: 1, backgroundColor: '#f5f5f5' },
  relatedName: { fontSize: 11, color: '#222', marginHorizontal: 6, marginTop: 6, lineHeight: 14, minHeight: 28 },
  relatedPrice: { fontSize: 12, fontWeight: '800', color: PRIMARY, marginHorizontal: 6, marginTop: 2 },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    marginRight: 12,
  },
  addButton: { flex: 1, borderRadius: 8 },
  addButtonContent: { paddingVertical: 6 },
});
