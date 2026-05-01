import React, { useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Text, ActivityIndicator, Button, Chip, FAB } from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { RootStackScreenProps } from '../navigation/types';
import sellerService from '../services/api/seller.service';
import EmptyState from '../components/EmptyState';

type Props = RootStackScreenProps<'SellerProducts'>;

const PRIMARY = '#1a6b52';

interface SellerProduct {
  id: string;
  name: string;
  slug: string;
  thumbnail: string | null;
  price: string | number;
  salePrice: string | number | null;
  stockQuantity: number;
  isActive: boolean;
  ratingAverage?: number;
  ratingCount?: number;
}

function num(v: any): number {
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return Number.isFinite(n) ? n : 0;
}

export default function SellerProductsScreen({ navigation }: Props) {
  const [items, setItems] = useState<SellerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await sellerService.myStoreProducts();
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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {items.length === 0 ? (
        <EmptyState
          icon="package-variant"
          title="Henüz ürün eklenmemiş"
          subtitle="İlk ürününü ekle ve satışa başla"
          actionLabel="Ürün Ekle"
          onAction={() => navigation.navigate('CreateProduct')}
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(p) => p.id}
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
            const price = num(item.price);
            const sale = item.salePrice == null ? null : num(item.salePrice);
            const hasDiscount = sale != null && sale < price;
            return (
              <TouchableOpacity
                style={styles.card}
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
                  style={styles.thumb}
                />
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={2} style={styles.name}>
                    {item.name}
                  </Text>
                  <View style={styles.priceRow}>
                    {hasDiscount && (
                      <Text style={styles.oldPrice}>
                        {price.toLocaleString('tr-TR')} ₺
                      </Text>
                    )}
                    <Text style={styles.price}>
                      {(hasDiscount ? sale! : price).toLocaleString('tr-TR')} ₺
                    </Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Chip
                      compact
                      style={[
                        styles.stockChip,
                        item.stockQuantity === 0
                          ? styles.outOfStock
                          : item.stockQuantity <= 5
                          ? styles.lowStock
                          : styles.inStock,
                      ]}
                      textStyle={styles.stockChipText}
                    >
                      {item.stockQuantity === 0
                        ? 'Stokta yok'
                        : item.stockQuantity <= 5
                        ? `Az: ${item.stockQuantity}`
                        : `Stok: ${item.stockQuantity}`}
                    </Chip>
                    {!item.isActive && (
                      <Chip
                        compact
                        style={styles.inactiveChip}
                        textStyle={styles.stockChipText}
                      >
                        Pasif
                      </Chip>
                    )}
                  </View>
                </View>
                <Icon name="chevron-right" size={20} color="#bbb" />
              </TouchableOpacity>
            );
          }}
        />
      )}

      {items.length > 0 && (
        <FAB
          icon="plus"
          label="Ürün Ekle"
          color="#fff"
          onPress={() => navigation.navigate('CreateProduct')}
          style={styles.fab}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 12, paddingBottom: 80 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  thumb: { width: 64, height: 64, borderRadius: 8, backgroundColor: '#f5f5f5' },
  name: { fontSize: 13, fontWeight: '700', color: '#222', lineHeight: 17 },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 4,
  },
  price: { fontSize: 14, fontWeight: '800', color: PRIMARY },
  oldPrice: { fontSize: 11, color: '#999', textDecorationLine: 'line-through' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 },
  stockChip: { alignSelf: 'flex-start' },
  inStock: { backgroundColor: '#dcfce7' },
  lowStock: { backgroundColor: '#fef3c7' },
  outOfStock: { backgroundColor: '#fee2e2' },
  inactiveChip: { backgroundColor: '#e5e7eb' },
  stockChipText: { fontSize: 10, fontWeight: '700' },
  fab: { position: 'absolute', right: 16, bottom: 16, backgroundColor: PRIMARY },
});
