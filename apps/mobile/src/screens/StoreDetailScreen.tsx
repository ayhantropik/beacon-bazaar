import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Text,
  Button,
  Chip,
  ActivityIndicator,
  Avatar,
  Divider,
  TextInput,
} from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import apiClient from '../services/api/client';
import AddToCartButton from '../components/AddToCartButton';
import messageService from '../services/api/message.service';

type Props = NativeStackScreenProps<RootStackParamList, 'StoreDetail'>;

const PRIMARY = '#1a6b52';
const ACCENT = '#2563eb';

interface AddressObj {
  city?: string;
  district?: string;
  street?: string;
}

interface ContactInfo {
  phone?: string;
  email?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
}

interface OpeningHour {
  day: string;
  open: string;
  close: string;
  closed?: boolean;
}

interface Store {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  coverImage: string | null;
  categories: string[];
  ratingAverage: number | null;
  ratingCount: number;
  isVerified: boolean;
  followersCount: number;
  productsCount: number;
  address: AddressObj | string | null;
  openingHours?: OpeningHour[];
  contactInfo?: ContactInfo;
  latitude?: number;
  longitude?: number;
  ownerId?: string;
}

interface ProductItem {
  id: string;
  name: string;
  slug: string;
  price: string | number;
  salePrice: string | number | null;
  thumbnail: string | null;
  ratingAverage: number;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user?: { name?: string };
}

const DAYS = [
  { key: 'monday', label: 'Pazartesi' },
  { key: 'tuesday', label: 'Salı' },
  { key: 'wednesday', label: 'Çarşamba' },
  { key: 'thursday', label: 'Perşembe' },
  { key: 'friday', label: 'Cuma' },
  { key: 'saturday', label: 'Cumartesi' },
  { key: 'sunday', label: 'Pazar' },
];

function fmtAddress(a: AddressObj | string | null | undefined): string {
  if (!a) return '';
  if (typeof a === 'string') return a;
  return [a.street, a.district, a.city].filter(Boolean).join(', ');
}

function num(v: any): number {
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return Number.isFinite(n) ? n : 0;
}

export default function StoreDetailScreen({ route, navigation }: Props) {
  const { storeId } = route.params;
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'reviews' | 'info'>('products');
  const [askModalOpen, setAskModalOpen] = useState(false);
  const [askText, setAskText] = useState('');
  const [askSubmitting, setAskSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function fetchAll() {
      try {
        const res = await apiClient.get(`/stores/${storeId}`);
        const data: Store = res.data?.data || res.data;
        if (!mounted) return;
        setStore(data);

        const [prodRes, reviewRes] = await Promise.allSettled([
          apiClient.get(`/stores/${data.id}/products`),
          apiClient.get(`/stores/${data.id}/reviews`),
        ]);
        if (!mounted) return;
        if (prodRes.status === 'fulfilled') {
          setProducts(prodRes.value.data?.data || []);
        }
        if (reviewRes.status === 'fulfilled') {
          setReviews(reviewRes.value.data?.data || []);
        }
      } catch (e) {
        // sessiz hata
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchAll();
    return () => {
      mounted = false;
    };
  }, [storeId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }
  if (!store) {
    return (
      <View style={styles.center}>
        <Text>Mağaza bulunamadı</Text>
      </View>
    );
  }

  const rating = num(store.ratingAverage);
  const addressStr = fmtAddress(store.address);

  const handleAskQuestion = () => {
    if (!store?.ownerId) {
      Alert.alert('Hata', 'Mağaza sahibi bilgisi bulunamadı');
      return;
    }
    setAskText('');
    setAskModalOpen(true);
  };

  const sendAskQuestion = async () => {
    const msg = askText.trim();
    if (!msg || !store?.ownerId) return;
    setAskSubmitting(true);
    try {
      const res = await messageService.start({
        sellerUserId: store.ownerId,
        listingType: 'product',
        listingTitle: store.name,
        message: msg,
      });
      const conv = res.data?.data;
      setAskModalOpen(false);
      setAskText('');
      if (conv?.id) {
        // Modal'in kapanma animasyonunu bekle, sonra navigate
        setTimeout(() => {
          navigation.navigate('Chat', {
            conversationId: conv.id,
            title: store.name,
          });
        }, 250);
      } else {
        Alert.alert('Mesaj gönderildi', 'Mağaza yanıtladığında bildirim alacaksın.');
      }
    } catch (e: any) {
      const raw = e?.response?.data?.message;
      const msg = Array.isArray(raw) ? raw.join(', ') : (typeof raw === 'string' ? raw : '');
      Alert.alert('Hata', msg || 'Mesaj gönderilemedi');
    } finally {
      setAskSubmitting(false);
    }
  };

  const handleBookAppointment = () => {
    if (!store) return;
    navigation.navigate('AppointmentBooking', { storeId: store.id });
  };

  const callPhone = (phone: string) => Linking.openURL(`tel:${phone}`);
  const sendEmail = (email: string) => Linking.openURL(`mailto:${email}`);
  const openWeb = (url: string) => Linking.openURL(url.startsWith('http') ? url : `https://${url}`);

  // Yorumlar puan kırılımı
  const ratingBreakdown = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => Math.round(r.rating) === star).length;
    const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
    return { star, count, pct };
  });

  return (
    <ScrollView style={styles.container}>
      <Image
        source={{
          uri: store.coverImage || `https://picsum.photos/seed/${store.slug}/600/300`,
        }}
        style={styles.cover}
      />

      <View style={styles.infoSection}>
        <View style={styles.headerRow}>
          <Avatar.Image
            size={64}
            source={{
              uri: store.logo || `https://picsum.photos/seed/${store.slug}-logo/120/120`,
            }}
          />
          <View style={styles.headerText}>
            <View style={styles.nameRow}>
              <Text variant="titleLarge" style={styles.name}>
                {store.name}
              </Text>
              {store.isVerified && (
                <Icon name="check-decagram" size={18} color={ACCENT} />
              )}
            </View>
            <View style={styles.ratingRow}>
              <Icon name="star" size={13} color="#f59e0b" />
              <Text style={styles.muted}>
                {(rating * 2).toFixed(1)}/10 ({store.ratingCount || 0} değerlendirme)
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{store.followersCount || 0}</Text>
            <Text style={styles.statLabel}>Takipçi</Text>
          </View>
          <View style={styles.statSep} />
          <View style={styles.stat}>
            <Text style={styles.statNum}>{store.productsCount ?? products.length}</Text>
            <Text style={styles.statLabel}>Ürün</Text>
          </View>
          <View style={styles.statSep} />
          <View style={styles.stat}>
            <Text style={styles.statNum}>{(rating * 2).toFixed(1)}</Text>
            <Text style={styles.statLabel}>Puan</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <Button
            mode={following ? 'outlined' : 'contained'}
            buttonColor={following ? undefined : PRIMARY}
            onPress={() => setFollowing(!following)}
            style={styles.flexBtn}
            icon={following ? 'check' : 'plus'}
            compact
          >
            {following ? 'Takipte' : 'Takip Et'}
          </Button>
          <Button
            mode="outlined"
            onPress={handleAskQuestion}
            style={styles.flexBtn}
            icon="message-text-outline"
            compact
          >
            Soru Sor
          </Button>
          <Button
            mode="outlined"
            onPress={handleBookAppointment}
            style={styles.flexBtn}
            icon="calendar-clock"
            compact
          >
            Randevu
          </Button>
        </View>

        {store.categories?.length > 0 && (
          <View style={styles.chipRow}>
            {store.categories.map((cat) => (
              <Chip key={cat} mode="outlined" compact style={styles.chip}>
                {cat}
              </Chip>
            ))}
          </View>
        )}
      </View>

      {/* Sekme barı */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'products' && styles.tabBtnActive]}
          onPress={() => setActiveTab('products')}
        >
          <Text style={[styles.tabText, activeTab === 'products' && styles.tabTextActive]}>
            Ürünler ({products.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'reviews' && styles.tabBtnActive]}
          onPress={() => setActiveTab('reviews')}
        >
          <Text style={[styles.tabText, activeTab === 'reviews' && styles.tabTextActive]}>
            Yorumlar ({reviews.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'info' && styles.tabBtnActive]}
          onPress={() => setActiveTab('info')}
        >
          <Text style={[styles.tabText, activeTab === 'info' && styles.tabTextActive]}>
            Bilgi
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'products' && (
        <View style={styles.tabContent}>
          {products.length === 0 ? (
            <Text style={styles.emptyText}>Henüz ürün eklenmemiş</Text>
          ) : (
            <View style={styles.productGrid}>
              {products.map((product) => {
                const price = num(product.price);
                const salePrice =
                  product.salePrice == null ? null : num(product.salePrice);
                const hasDiscount = salePrice != null && salePrice < price;
                const display = hasDiscount ? salePrice! : price;
                return (
                  <TouchableOpacity
                    key={product.id}
                    style={styles.productCard}
                    onPress={() =>
                      navigation.navigate('ProductDetail', { productId: product.slug })
                    }
                  >
                    <Image
                      source={{
                        uri:
                          product.thumbnail ||
                          `https://picsum.photos/seed/${product.slug}/300/300`,
                      }}
                      style={styles.productImage}
                    />
                    <Text variant="labelSmall" numberOfLines={2} style={styles.productName}>
                      {product.name}
                    </Text>
                    <View style={styles.priceRow}>
                      <View style={styles.priceCol}>
                        <Text style={styles.price}>
                          {display.toLocaleString('tr-TR')} ₺
                        </Text>
                        {hasDiscount && (
                          <Text style={styles.oldPrice}>
                            {price.toLocaleString('tr-TR')} ₺
                          </Text>
                        )}
                      </View>
                      <AddToCartButton product={{ ...product, storeId: store.id }} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      )}

      {activeTab === 'reviews' && (
        <View style={styles.tabContent}>
          {reviews.length === 0 ? (
            <View style={styles.emptyBox}>
              <Icon name="message-text-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>Henüz yorum yok</Text>
            </View>
          ) : (
            <>
              <View style={styles.breakdownBox}>
                <View style={styles.breakdownLeft}>
                  <Text style={styles.breakdownAvg}>
                    {(rating * 2).toFixed(1)}
                  </Text>
                  <Text style={styles.breakdownTotal}>10 üzerinden</Text>
                  <Text style={styles.breakdownCount}>{reviews.length} yorum</Text>
                </View>
                <View style={styles.breakdownBars}>
                  {ratingBreakdown.map((row) => (
                    <View key={row.star} style={styles.breakdownRow}>
                      <Text style={styles.breakdownStar}>{row.star}★</Text>
                      <View style={styles.breakdownBarBg}>
                        <View
                          style={[styles.breakdownBarFill, { width: `${row.pct}%` }]}
                        />
                      </View>
                      <Text style={styles.breakdownNum}>{row.count}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <Divider style={{ marginVertical: 12 }} />

              {reviews.map((rev) => (
                <View key={rev.id} style={styles.reviewItem}>
                  <View style={styles.reviewHead}>
                    <Avatar.Text
                      size={32}
                      label={(rev.user?.name || '?').charAt(0).toUpperCase()}
                    />
                    <View style={styles.reviewHeadText}>
                      <Text style={styles.reviewName}>
                        {rev.user?.name || 'Kullanıcı'}
                      </Text>
                      <View style={styles.reviewStars}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Icon
                            key={s}
                            name={s <= rev.rating ? 'star' : 'star-outline'}
                            size={12}
                            color="#f59e0b"
                          />
                        ))}
                        <Text style={styles.reviewDate}>
                          {' · '}
                          {new Date(rev.createdAt).toLocaleDateString('tr-TR')}
                        </Text>
                      </View>
                    </View>
                  </View>
                  {rev.comment && <Text style={styles.reviewComment}>{rev.comment}</Text>}
                </View>
              ))}
            </>
          )}
        </View>
      )}

      {activeTab === 'info' && (
        <View style={styles.tabContent}>
          {store.description ? (
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Hakkında</Text>
              <Text style={styles.infoText}>{store.description}</Text>
            </View>
          ) : null}

          {addressStr ? (
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Adres</Text>
              <View style={styles.infoRowIcon}>
                <Icon name="map-marker" size={16} color={PRIMARY} />
                <Text style={styles.infoText}>{addressStr}</Text>
              </View>
            </View>
          ) : null}

          {store.openingHours && store.openingHours.length > 0 ? (
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Çalışma Saatleri</Text>
              {DAYS.map((d) => {
                const oh = store.openingHours?.find(
                  (h: any) => h.day === d.key || h.day === d.label,
                );
                return (
                  <View key={d.key} style={styles.hoursRow}>
                    <Text style={styles.hoursDay}>{d.label}</Text>
                    <Text style={styles.hoursValue}>
                      {!oh || oh.closed
                        ? 'Kapalı'
                        : `${oh.open || '-'} – ${oh.close || '-'}`}
                    </Text>
                  </View>
                );
              })}
            </View>
          ) : null}

          {store.contactInfo && Object.keys(store.contactInfo).length > 0 ? (
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>İletişim</Text>
              {store.contactInfo.phone && (
                <TouchableOpacity
                  style={styles.contactRow}
                  onPress={() => callPhone(store.contactInfo!.phone!)}
                >
                  <Icon name="phone" size={16} color={PRIMARY} />
                  <Text style={styles.contactText}>{store.contactInfo.phone}</Text>
                </TouchableOpacity>
              )}
              {store.contactInfo.email && (
                <TouchableOpacity
                  style={styles.contactRow}
                  onPress={() => sendEmail(store.contactInfo!.email!)}
                >
                  <Icon name="email" size={16} color={PRIMARY} />
                  <Text style={styles.contactText}>{store.contactInfo.email}</Text>
                </TouchableOpacity>
              )}
              {store.contactInfo.website && (
                <TouchableOpacity
                  style={styles.contactRow}
                  onPress={() => openWeb(store.contactInfo!.website!)}
                >
                  <Icon name="web" size={16} color={PRIMARY} />
                  <Text style={styles.contactText}>{store.contactInfo.website}</Text>
                </TouchableOpacity>
              )}
              {store.contactInfo.instagram && (
                <TouchableOpacity
                  style={styles.contactRow}
                  onPress={() =>
                    openWeb(`https://instagram.com/${store.contactInfo!.instagram!}`)
                  }
                >
                  <Icon name="instagram" size={16} color="#e1306c" />
                  <Text style={styles.contactText}>@{store.contactInfo.instagram}</Text>
                </TouchableOpacity>
              )}
              {store.contactInfo.facebook && (
                <TouchableOpacity
                  style={styles.contactRow}
                  onPress={() =>
                    openWeb(`https://facebook.com/${store.contactInfo!.facebook!}`)
                  }
                >
                  <Icon name="facebook" size={16} color="#1877f2" />
                  <Text style={styles.contactText}>{store.contactInfo.facebook}</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null}

          {!store.description &&
          !addressStr &&
          (!store.openingHours || store.openingHours.length === 0) &&
          (!store.contactInfo || Object.keys(store.contactInfo).length === 0) ? (
            <Text style={styles.emptyText}>Mağaza bilgisi henüz eklenmemiş</Text>
          ) : null}
        </View>
      )}

      <View style={{ height: 32 }} />

      {/* Soru Sor Modal */}
      <Modal
        visible={askModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setAskModalOpen(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity
            style={styles.modalDismiss}
            activeOpacity={1}
            onPress={() => setAskModalOpen(false)}
          />
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Icon name="message-text" size={20} color={PRIMARY} />
              <Text style={styles.modalTitle}>{store.name} mağazasına soru sor</Text>
              <TouchableOpacity onPress={() => setAskModalOpen(false)}>
                <Icon name="close" size={22} color="#666" />
              </TouchableOpacity>
            </View>
            <TextInput
              mode="outlined"
              placeholder="Sorunuzu yazın..."
              value={askText}
              onChangeText={setAskText}
              multiline
              numberOfLines={4}
              style={styles.modalInput}
              autoFocus
            />
            <Button
              mode="contained"
              buttonColor={PRIMARY}
              loading={askSubmitting}
              disabled={!askText.trim() || askSubmitting}
              onPress={sendAskQuestion}
              icon="send"
              style={styles.modalSendBtn}
            >
              Gönder
            </Button>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  cover: { width: '100%', height: 180 },
  infoSection: { padding: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  headerText: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  name: { fontWeight: '700', flexShrink: 1 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  muted: { color: '#999', fontSize: 12 },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    marginBottom: 16,
  },
  stat: { alignItems: 'center', flex: 1 },
  statNum: { fontSize: 16, fontWeight: '800', color: '#222' },
  statLabel: { fontSize: 11, color: '#888', marginTop: 2 },
  statSep: { width: 1, backgroundColor: '#e5e7eb' },
  actionsRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  flexBtn: { flex: 1, borderRadius: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {},
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabBtnActive: { borderBottomWidth: 2, borderBottomColor: PRIMARY },
  tabText: { fontSize: 13, color: '#666', fontWeight: '600' },
  tabTextActive: { color: PRIMARY, fontWeight: '700' },
  tabContent: { padding: 12 },
  emptyText: { textAlign: 'center', color: '#999', paddingVertical: 24 },
  emptyBox: { alignItems: 'center', padding: 24 },
  productGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  productCard: {
    width: '31.33%',
    margin: '1%',
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 8,
  },
  productImage: { width: '100%', aspectRatio: 1 },
  productName: {
    marginHorizontal: 6,
    marginTop: 6,
    fontSize: 11,
    minHeight: 28,
    lineHeight: 14,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    paddingBottom: 6,
    marginTop: 2,
  },
  priceCol: { flex: 1 },
  price: { color: PRIMARY, fontWeight: '800', fontSize: 12 },
  oldPrice: { color: '#999', textDecorationLine: 'line-through', fontSize: 10 },
  breakdownBox: { flexDirection: 'row', backgroundColor: '#f9fafb', padding: 16, borderRadius: 8 },
  breakdownLeft: { width: 90, alignItems: 'center', justifyContent: 'center' },
  breakdownAvg: { fontSize: 32, fontWeight: '800', color: PRIMARY },
  breakdownTotal: { fontSize: 10, color: '#888' },
  breakdownCount: { fontSize: 11, color: '#666', marginTop: 4 },
  breakdownBars: { flex: 1, marginLeft: 12, gap: 4 },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  breakdownStar: { fontSize: 11, fontWeight: '700', color: '#666', width: 24 },
  breakdownBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  breakdownBarFill: { height: '100%', backgroundColor: '#f59e0b', borderRadius: 3 },
  breakdownNum: { fontSize: 11, color: '#666', width: 20, textAlign: 'right' },
  reviewItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  reviewHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  reviewHeadText: { flex: 1 },
  reviewName: { fontSize: 13, fontWeight: '700', color: '#222' },
  reviewStars: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 },
  reviewDate: { fontSize: 10, color: '#888' },
  reviewComment: { fontSize: 13, color: '#444', lineHeight: 18, marginLeft: 42 },
  infoBox: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  infoLabel: { fontSize: 12, color: '#888', fontWeight: '700', marginBottom: 8 },
  infoText: { fontSize: 13, color: '#333', lineHeight: 20 },
  infoRowIcon: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  hoursDay: { fontSize: 13, color: '#444', fontWeight: '500' },
  hoursValue: { fontSize: 13, color: '#666' },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  contactText: { fontSize: 13, color: PRIMARY, fontWeight: '600' },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalDismiss: { flex: 1 },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  modalTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: '#222' },
  modalInput: { backgroundColor: '#fff', marginBottom: 12, minHeight: 100 },
  modalSendBtn: { borderRadius: 8 },
});
