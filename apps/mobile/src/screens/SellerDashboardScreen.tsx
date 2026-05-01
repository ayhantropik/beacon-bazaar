import React, { useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Text, ActivityIndicator, Button } from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { RootStackScreenProps } from '../navigation/types';
import sellerService, {
  type DashboardStats,
  type MyStore,
  type OrderStats,
} from '../services/api/seller.service';
import EmptyState from '../components/EmptyState';

type Props = RootStackScreenProps<'SellerDashboard'>;

const PRIMARY = '#1a6b52';

function formatNumber(n: any): string {
  const v = typeof n === 'string' ? parseFloat(n) : n;
  if (!Number.isFinite(v)) return '0';
  return Number(v).toLocaleString('tr-TR');
}

export default function SellerDashboardScreen({ navigation }: Props) {
  const [store, setStore] = useState<MyStore | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [orderStats, setOrderStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasStore, setHasStore] = useState(true);

  const load = useCallback(async () => {
    try {
      const dash = await sellerService.dashboard();
      const data = dash.data?.data;
      setStore(data?.store || null);
      setStats(data?.stats || null);
      setHasStore(!!data?.store);
      try {
        const os = await sellerService.myStoreOrderStats();
        setOrderStats(os.data?.data || null);
      } catch {
        setOrderStats(null);
      }
    } catch (e: any) {
      // 404 = mağaza yok
      if (e.response?.status === 404) setHasStore(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  if (!hasStore || !store) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="storefront-outline"
          title="Henüz mağazan yok"
          subtitle="Kendi mağazanı oluşturarak ürünlerini sat"
          actionLabel="Mağaza Oluştur"
          onAction={() => navigation.navigate('CreateStore')}
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load();
          }}
          tintColor={PRIMARY}
        />
      }
    >
      {/* Mağaza header */}
      <View style={styles.header}>
        <Image
          source={{
            uri:
              store.coverImage ||
              `https://picsum.photos/seed/${store.slug}/600/200`,
          }}
          style={styles.cover}
        />
        <View style={styles.headerOverlay} />
        <View style={styles.headerContent}>
          <Image
            source={{
              uri:
                store.logo || `https://picsum.photos/seed/${store.slug}-logo/120/120`,
            }}
            style={styles.logo}
          />
          <View style={{ flex: 1 }}>
            <View style={styles.nameRow}>
              <Text style={styles.storeName}>{store.name}</Text>
              {store.isVerified && (
                <Icon name="check-decagram" size={16} color="#fff" />
              )}
            </View>
            <Text style={styles.storeSlug}>@{store.slug}</Text>
          </View>
        </View>
      </View>

      {/* İstatistikler */}
      <View style={styles.statsGrid}>
        <StatCard
          icon="package-variant"
          label="Ürün"
          value={formatNumber(stats?.productsCount)}
          color="#2563eb"
          onPress={() => navigation.navigate('SellerProducts')}
        />
        <StatCard
          icon="account-multiple"
          label="Takipçi"
          value={formatNumber(stats?.followersCount)}
          color="#a855f7"
        />
        <StatCard
          icon="star"
          label="Puan"
          value={Number(stats?.ratingAverage || 0).toFixed(1)}
          color="#f59e0b"
        />
        <StatCard
          icon="message-text"
          label="Yorum"
          value={formatNumber(stats?.reviewsCount)}
          color="#16a34a"
        />
      </View>

      {/* Sipariş özeti */}
      {orderStats && (
        <>
          <Text style={styles.sectionTitle}>Sipariş Özeti</Text>
          <View style={styles.orderStatsBox}>
            <View style={styles.orderStat}>
              <Icon name="receipt" size={20} color={PRIMARY} />
              <Text style={styles.orderStatValue}>
                {formatNumber(orderStats.totalOrders)}
              </Text>
              <Text style={styles.orderStatLabel}>Toplam</Text>
            </View>
            <View style={styles.orderStatSep} />
            <View style={styles.orderStat}>
              <Icon name="clock-outline" size={20} color="#d97706" />
              <Text style={styles.orderStatValue}>
                {formatNumber(orderStats.pendingOrders)}
              </Text>
              <Text style={styles.orderStatLabel}>Bekleyen</Text>
            </View>
            <View style={styles.orderStatSep} />
            <View style={styles.orderStat}>
              <Icon name="cash-multiple" size={20} color="#16a34a" />
              <Text style={styles.orderStatValue}>
                {formatNumber(orderStats.totalRevenue)} ₺
              </Text>
              <Text style={styles.orderStatLabel}>Ciro</Text>
            </View>
          </View>
        </>
      )}

      {/* Hızlı erişim */}
      <Text style={styles.sectionTitle}>Yönetim</Text>
      <ActionTile
        icon="package-variant"
        label="Ürünlerim"
        sub="Ekle, düzenle, stok yönetimi"
        color="#2563eb"
        onPress={() => navigation.navigate('SellerProducts')}
      />
      <ActionTile
        icon="receipt"
        label="Siparişler"
        sub="Gelen siparişleri görüntüle ve yönet"
        color="#a855f7"
        onPress={() => navigation.navigate('SellerOrders')}
      />
      <ActionTile
        icon="storefront-edit"
        label="Mağaza Bilgileri"
        sub="Açıklama, logo, iletişim, çalışma saatleri"
        color="#d97706"
        onPress={() =>
          navigation.navigate('StoreDetail', { storeId: store.slug })
        }
      />

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
  onPress,
}: {
  icon: string;
  label: string;
  value: string;
  color: string;
  onPress?: () => void;
}) {
  const Wrapper: any = onPress ? TouchableOpacity : View;
  return (
    <Wrapper style={styles.statCard} onPress={onPress}>
      <View style={[styles.statIcon, { backgroundColor: color + '22' }]}>
        <Icon name={icon as any} size={18} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Wrapper>
  );
}

function ActionTile({
  icon,
  label,
  sub,
  color,
  onPress,
}: {
  icon: string;
  label: string;
  sub: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.tile} onPress={onPress}>
      <View style={[styles.tileIcon, { backgroundColor: color + '22' }]}>
        <Icon name={icon as any} size={22} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.tileLabel}>{label}</Text>
        <Text style={styles.tileSub}>{sub}</Text>
      </View>
      <Icon name="chevron-right" size={20} color="#bbb" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { position: 'relative', marginBottom: 16 },
  cover: { width: '100%', height: 140, backgroundColor: '#eee' },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  headerContent: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#fff',
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  storeName: { color: '#fff', fontSize: 18, fontWeight: '800' },
  storeSlug: { color: 'rgba(255,255,255,0.85)', fontSize: 11, marginTop: 2 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'flex-start',
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: { fontSize: 20, fontWeight: '800', color: '#222' },
  statLabel: { fontSize: 11, color: '#888', marginTop: 2 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: PRIMARY,
    marginHorizontal: 16,
    marginBottom: 8,
    marginTop: 8,
  },
  orderStatsBox: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 12,
    marginBottom: 16,
  },
  orderStat: { flex: 1, alignItems: 'center', gap: 4 },
  orderStatSep: { width: 1, backgroundColor: '#eee' },
  orderStatValue: { fontSize: 16, fontWeight: '800', color: '#222' },
  orderStatLabel: { fontSize: 10, color: '#888' },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginBottom: 8,
    padding: 14,
    borderRadius: 12,
  },
  tileIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tileLabel: { fontSize: 14, fontWeight: '700', color: '#222' },
  tileSub: { fontSize: 11, color: '#888', marginTop: 2 },
});
