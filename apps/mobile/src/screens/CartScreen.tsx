import React from 'react';
import { View, StyleSheet, FlatList, Image } from 'react-native';
import { Text, Button, IconButton } from 'react-native-paper';
import type { MainTabScreenProps } from '../navigation/types';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { removeItem, updateQuantity, clearCart } from '../store/slices/cartSlice';

type Props = MainTabScreenProps<'Cart'>;

export default function CartScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const items = useAppSelector((s) => s.cart.items);
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <Text variant="headlineSmall" style={styles.emptyTitle}>Sepetiniz boş</Text>
        <Text variant="bodyMedium" style={styles.muted}>Ürünleri sepetinize ekleyin</Text>
        <Button mode="contained" onPress={() => navigation.navigate('Home')} style={styles.shopButton}>
          Alışverişe Başla
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="titleLarge" style={styles.title}>Sepetim ({items.length})</Text>
        <Button mode="text" textColor="#e53935" onPress={() => dispatch(clearCart())}>Temizle</Button>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Image source={{ uri: item.thumbnail || 'https://via.placeholder.com/60' }} style={styles.itemImage} />
            <View style={styles.itemInfo}>
              <Text variant="labelLarge" numberOfLines={1}>{item.name}</Text>
              <Text variant="labelMedium" style={styles.itemPrice}>{item.price.toLocaleString('tr-TR')} ₺</Text>
              <View style={styles.quantityRow}>
                <IconButton icon="minus" size={16} onPress={() => dispatch(updateQuantity({ id: item.id, quantity: item.quantity - 1 }))} />
                <Text>{item.quantity}</Text>
                <IconButton icon="plus" size={16} onPress={() => dispatch(updateQuantity({ id: item.id, quantity: item.quantity + 1 }))} />
              </View>
            </View>
            <View style={styles.itemRight}>
              <Text variant="labelLarge" style={styles.itemTotal}>{(item.price * item.quantity).toLocaleString('tr-TR')} ₺</Text>
              <IconButton icon="delete-outline" iconColor="#e53935" size={20} onPress={() => dispatch(removeItem(item.id))} />
            </View>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text variant="titleMedium">Toplam</Text>
          <Text variant="titleLarge" style={styles.totalPrice}>{total.toLocaleString('tr-TR')} ₺</Text>
        </View>
        <Button mode="contained" onPress={() => navigation.navigate('Checkout')} contentStyle={styles.checkoutContent}>
          Siparişi Tamamla
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyTitle: { fontWeight: '600', marginBottom: 8 },
  muted: { color: '#999', marginBottom: 24 },
  shopButton: { borderRadius: 8 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  title: { fontWeight: '700' },
  item: { flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', alignItems: 'center' },
  itemImage: { width: 60, height: 60, borderRadius: 8 },
  itemInfo: { flex: 1, marginLeft: 12 },
  itemPrice: { color: '#2563eb', fontWeight: '600', marginTop: 2 },
  quantityRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  itemRight: { alignItems: 'flex-end' },
  itemTotal: { fontWeight: '700' },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  totalPrice: { color: '#2563eb', fontWeight: '700' },
  checkoutContent: { paddingVertical: 8 },
});
