import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import {
  Text,
  Chip,
  Card,
  Button,
  Divider,
  ActivityIndicator,
} from 'react-native-paper';
import type { RootStackScreenProps } from '../navigation/types';
import apiClient from '../services/api/client';

const PRIMARY = '#1a6b52';
const ERROR = '#c0392b';

type Props = RootStackScreenProps<'OrderDetail'>;

interface OrderItem {
  id: string;
  name: string;
  thumbnail?: string;
  quantity: number;
  price: number;
}

interface OrderAddress {
  fullName: string;
  phone: string;
  city: string;
  district: string;
  address: string;
  postalCode: string;
}

interface OrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  items: OrderItem[];
  shippingAddress: OrderAddress;
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  paymentMethod: string;
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

export default function OrderDetailScreen({ route, navigation }: Props) {
  const { orderId } = route.params;
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

  const fetchOrder = useCallback(async () => {
    try {
      const res = await apiClient.get(`/orders/${orderId}`);
      setOrder(res.data?.data || res.data);
    } catch {
      Alert.alert('Hata', 'Sipariş bilgileri yüklenemedi');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  }, [orderId, navigation]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleCancel = () => {
    Alert.alert(
      'Sipariş İptali',
      'Siparişinizi iptal etmek istediğinize emin misiniz?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'İptal Et',
          style: 'destructive',
          onPress: async () => {
            setIsCancelling(true);
            try {
              await apiClient.patch(`/orders/${orderId}/cancel`);
              setOrder((prev) => (prev ? { ...prev, status: 'cancelled' } : null));
            } catch {
              Alert.alert('Hata', 'Sipariş iptal edilemedi');
            } finally {
              setIsCancelling(false);
            }
          },
        },
      ],
    );
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusConfig = (status: string) =>
    STATUS_CONFIG[status] || { label: status, color: '#999' };

  const canCancel = order?.status === 'pending' || order?.status === 'confirmed';

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  if (!order) return null;

  const sc = getStatusConfig(order.status);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text variant="titleLarge" style={styles.orderNumber}>
            Sipariş #{order.orderNumber}
          </Text>
          <Text variant="bodySmall" style={styles.date}>
            {formatDate(order.createdAt)}
          </Text>
        </View>
        <Chip
          compact
          textStyle={{ color: '#fff', fontSize: 12, fontWeight: '600' }}
          style={[styles.statusChip, { backgroundColor: sc.color }]}
        >
          {sc.label}
        </Chip>
      </View>

      <Text variant="titleMedium" style={styles.sectionTitle}>Ürünler</Text>
      <Card style={styles.card}>
        <Card.Content>
          {order.items.map((item, idx) => (
            <View key={item.id}>
              {idx > 0 && <Divider style={styles.itemDivider} />}
              <View style={styles.itemRow}>
                <Image
                  source={{ uri: item.thumbnail || 'https://via.placeholder.com/48' }}
                  style={styles.thumbnail}
                />
                <View style={styles.itemInfo}>
                  <Text variant="bodyMedium" numberOfLines={2} style={styles.itemName}>
                    {item.name}
                  </Text>
                  <Text variant="bodySmall" style={styles.itemQty}>
                    {item.quantity} adet
                  </Text>
                </View>
                <Text variant="labelLarge" style={styles.itemPrice}>
                  {(item.price * item.quantity).toLocaleString('tr-TR')} ₺
                </Text>
              </View>
            </View>
          ))}
        </Card.Content>
      </Card>

      <Text variant="titleMedium" style={styles.sectionTitle}>Teslimat Adresi</Text>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="labelLarge" style={styles.addressName}>
            {order.shippingAddress.fullName}
          </Text>
          <Text variant="bodyMedium" style={styles.addressText}>
            {order.shippingAddress.address}
          </Text>
          <Text variant="bodyMedium" style={styles.addressText}>
            {order.shippingAddress.district}, {order.shippingAddress.city}{' '}
            {order.shippingAddress.postalCode}
          </Text>
          <Text variant="bodySmall" style={styles.addressPhone}>
            {order.shippingAddress.phone}
          </Text>
        </Card.Content>
      </Card>

      <Text variant="titleMedium" style={styles.sectionTitle}>Ödeme Özeti</Text>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.priceRow}>
            <Text>Ara Toplam</Text>
            <Text>{order.subtotal.toLocaleString('tr-TR')} ₺</Text>
          </View>
          <View style={styles.priceRow}>
            <Text>Kargo</Text>
            <Text>
              {order.deliveryFee === 0
                ? 'Ücretsiz'
                : `${order.deliveryFee.toLocaleString('tr-TR')} ₺`}
            </Text>
          </View>
          <Divider style={styles.priceDivider} />
          <View style={styles.priceRow}>
            <Text variant="titleMedium" style={{ fontWeight: '700' }}>Toplam</Text>
            <Text variant="titleMedium" style={styles.totalPrice}>
              {order.totalAmount.toLocaleString('tr-TR')} ₺
            </Text>
          </View>
        </Card.Content>
      </Card>

      {canCancel && (
        <Button
          mode="outlined"
          onPress={handleCancel}
          loading={isCancelling}
          disabled={isCancelling}
          style={styles.cancelButton}
          textColor={ERROR}
        >
          Siparişi İptal Et
        </Button>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, paddingBottom: 32 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  orderNumber: { fontWeight: '700' },
  date: { color: '#888', marginTop: 4 },
  statusChip: { height: 28 },
  sectionTitle: { fontWeight: '600', marginBottom: 8, color: '#333' },
  card: { marginBottom: 16, backgroundColor: '#fafafa' },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  itemDivider: { marginVertical: 4 },
  thumbnail: { width: 48, height: 48, borderRadius: 8 },
  itemInfo: { flex: 1, marginLeft: 12 },
  itemName: { color: '#333' },
  itemQty: { color: '#888', marginTop: 2 },
  itemPrice: { fontWeight: '700', color: '#333' },
  addressName: { fontWeight: '600', marginBottom: 4 },
  addressText: { color: '#555', lineHeight: 20 },
  addressPhone: { color: '#888', marginTop: 6 },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  priceDivider: { marginVertical: 8 },
  totalPrice: { fontWeight: '700', color: PRIMARY },
  cancelButton: {
    marginTop: 8,
    borderColor: ERROR,
    borderRadius: 8,
  },
});
