import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Text, Chip, ActivityIndicator } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import type { RootStackScreenProps } from '../navigation/types';
import apiClient from '../services/api/client';

const PRIMARY = '#1a6b52';

type Props = RootStackScreenProps<'Orders'>;

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  itemCount: number;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: 'Beklemede', color: '#e67e22' },
  confirmed: { label: 'Onaylandı', color: '#3498db' },
  preparing: { label: 'Hazırlanıyor', color: '#9b59b6' },
  shipped: { label: 'Kargoda', color: '#00bcd4' },
  delivered: { label: 'Teslim Edildi', color: '#27ae60' },
  cancelled: { label: 'İptal Edildi', color: '#c0392b' },
};

export default function OrdersScreen({ navigation }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await apiClient.get('/orders');
      const data = res.data?.data || res.data || [];
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      setOrders([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders();
  }, [fetchOrders]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getStatusConfig = (status: string) =>
    STATUS_CONFIG[status] || { label: status, color: '#999' };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <View style={styles.centered}>
        <Icon name="package-variant" size={64} color="#ccc" />
        <Text variant="titleMedium" style={styles.emptyTitle}>
          Henüz siparişiniz yok
        </Text>
        <Text variant="bodyMedium" style={styles.emptySubtitle}>
          Alışverişe başlayarak ilk siparişinizi oluşturun
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text variant="titleLarge" style={styles.header}>
        Siparişlerim
      </Text>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[PRIMARY]} />
        }
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const sc = getStatusConfig(item.status);
          return (
            <TouchableOpacity
              style={styles.orderCard}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
            >
              <View style={styles.orderHeader}>
                <Text variant="labelLarge" style={styles.orderNumber}>
                  #{item.orderNumber}
                </Text>
                <Chip
                  compact
                  textStyle={{ color: '#fff', fontSize: 11, fontWeight: '600' }}
                  style={[styles.statusChip, { backgroundColor: sc.color }]}
                >
                  {sc.label}
                </Chip>
              </View>
              <View style={styles.orderInfo}>
                <Text variant="bodySmall" style={styles.orderDate}>
                  {formatDate(item.createdAt)}
                </Text>
                <Text variant="bodySmall" style={styles.orderItems}>
                  {item.itemCount} ürün
                </Text>
              </View>
              <View style={styles.orderFooter}>
                <Text variant="titleSmall" style={styles.orderTotal}>
                  {item.totalAmount.toLocaleString('tr-TR')} ₺
                </Text>
                <Icon name="chevron-right" size={20} color="#bbb" />
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyTitle: { fontWeight: '600', marginTop: 16, color: '#555' },
  emptySubtitle: { color: '#999', marginTop: 4 },
  header: { fontWeight: '700', padding: 16, paddingBottom: 8 },
  listContent: { paddingHorizontal: 16, paddingBottom: 16 },
  orderCard: {
    backgroundColor: '#fafafa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderNumber: { fontWeight: '700', color: '#333' },
  statusChip: { height: 26 },
  orderInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderDate: { color: '#888' },
  orderItems: { color: '#888' },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 8,
  },
  orderTotal: { fontWeight: '700', color: PRIMARY },
});
