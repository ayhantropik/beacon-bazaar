import React, { useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import {
  Text,
  ActivityIndicator,
  Card,
  Chip,
} from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { RootStackScreenProps } from '../navigation/types';
import sellerService from '../services/api/seller.service';
import EmptyState from '../components/EmptyState';

type Props = RootStackScreenProps<'SellerOrders'>;

const PRIMARY = '#1a6b52';

interface SellerOrder {
  id: string;
  orderNumber?: string;
  status: string;
  totalAmount: number | string;
  itemCount?: number;
  customerName?: string;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Beklemede', color: '#d97706', bg: '#fef3c7' },
  confirmed: { label: 'Onaylandı', color: '#2563eb', bg: '#dbeafe' },
  preparing: { label: 'Hazırlanıyor', color: '#a855f7', bg: '#f3e8ff' },
  shipped: { label: 'Kargoda', color: '#0891b2', bg: '#cffafe' },
  delivered: { label: 'Teslim Edildi', color: '#16a34a', bg: '#dcfce7' },
  cancelled: { label: 'İptal', color: '#dc2626', bg: '#fee2e2' },
};

function num(v: any): number {
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return Number.isFinite(n) ? n : 0;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function SellerOrdersScreen({ navigation }: Props) {
  const [items, setItems] = useState<SellerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  const load = useCallback(async () => {
    try {
      const r = await sellerService.myStoreOrders();
      setItems(r.data?.data || []);
    } catch {
      // ignore
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

  const filtered = filter === 'all'
    ? items
    : items.filter((x) => x.status === filter);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  const filterOptions = [
    { key: 'all', label: 'Tümü' },
    { key: 'pending', label: 'Bekleyen' },
    { key: 'preparing', label: 'Hazırlanıyor' },
    { key: 'shipped', label: 'Kargoda' },
    { key: 'delivered', label: 'Teslim' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        {filterOptions.map((f) => (
          <Chip
            key={f.key}
            selected={filter === f.key}
            onPress={() => setFilter(f.key)}
            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
            textStyle={filter === f.key ? styles.filterTextActive : styles.filterText}
            compact
          >
            {f.label}
          </Chip>
        ))}
      </View>

      {filtered.length === 0 ? (
        <EmptyState
          icon="receipt-text-outline"
          title="Sipariş yok"
          subtitle={filter === 'all' ? 'Henüz sipariş gelmedi' : 'Bu durumda sipariş yok'}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(o) => o.id}
          contentContainerStyle={styles.list}
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
          renderItem={({ item }) => {
            const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
            return (
              <Card
                style={styles.card}
                onPress={() =>
                  navigation.navigate('OrderDetail', { orderId: item.id })
                }
              >
                <View style={styles.cardHead}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.orderId}>
                      #{item.orderNumber || item.id.slice(0, 8)}
                    </Text>
                    <Text style={styles.date}>{fmtDate(item.createdAt)}</Text>
                  </View>
                  <Chip
                    compact
                    style={{ backgroundColor: cfg.bg }}
                    textStyle={{
                      color: cfg.color,
                      fontWeight: '700',
                      fontSize: 11,
                    }}
                  >
                    {cfg.label}
                  </Chip>
                </View>
                {item.customerName && (
                  <View style={styles.row}>
                    <Icon name="account" size={14} color="#666" />
                    <Text style={styles.muted}>{item.customerName}</Text>
                  </View>
                )}
                {item.itemCount != null && (
                  <View style={styles.row}>
                    <Icon name="package-variant" size={14} color="#666" />
                    <Text style={styles.muted}>
                      {item.itemCount} ürün
                    </Text>
                  </View>
                )}
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Toplam</Text>
                  <Text style={styles.totalValue}>
                    {num(item.totalAmount).toLocaleString('tr-TR')} ₺
                  </Text>
                </View>
              </Card>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterChip: { backgroundColor: '#f5f5f5' },
  filterChipActive: { backgroundColor: PRIMARY },
  filterText: { fontSize: 11, color: '#666' },
  filterTextActive: { fontSize: 11, color: '#fff', fontWeight: '700' },
  list: { padding: 12 },
  card: { backgroundColor: '#fff', padding: 14, marginBottom: 8 },
  cardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderId: { fontSize: 14, fontWeight: '800', color: '#222' },
  date: { fontSize: 11, color: '#888', marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  muted: { fontSize: 12, color: '#666' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  totalLabel: { fontSize: 12, color: '#888' },
  totalValue: { fontSize: 16, fontWeight: '800', color: PRIMARY },
});
