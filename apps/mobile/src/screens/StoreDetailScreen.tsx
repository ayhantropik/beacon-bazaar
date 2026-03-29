import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Image, TouchableOpacity, ScrollView } from 'react-native';
import { Text, Button, Chip, ActivityIndicator, Avatar } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import apiClient from '../services/api/client';

type Props = NativeStackScreenProps<RootStackParamList, 'StoreDetail'>;

interface Store {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo: string;
  coverImage: string;
  categories: string[];
  ratingAverage: number;
  ratingCount: number;
  isVerified: boolean;
  followersCount: number;
  productsCount: number;
  address: string;
}

interface ProductItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice: number | null;
  thumbnail: string;
  ratingAverage: number;
}

export default function StoreDetailScreen({ route, navigation }: Props) {
  const { storeId } = route.params;
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStore() {
      try {
        const res = await apiClient.get(`/stores/${storeId}`);
        const data = res.data?.data || res.data;
        setStore(data);
        const prodRes = await apiClient.get(`/stores/${data.id}/products`);
        setProducts(prodRes.data?.data || []);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchStore();
  }, [storeId]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  if (!store) return <View style={styles.center}><Text>Mağaza bulunamadı</Text></View>;

  return (
    <ScrollView style={styles.container}>
      {/* Cover */}
      <Image
        source={{ uri: store.coverImage || 'https://via.placeholder.com/400x200' }}
        style={styles.cover}
      />

      {/* Store Info */}
      <View style={styles.infoSection}>
        <View style={styles.headerRow}>
          <Avatar.Image size={64} source={{ uri: store.logo || 'https://via.placeholder.com/64' }} />
          <View style={styles.headerText}>
            <View style={styles.nameRow}>
              <Text variant="titleLarge" style={styles.name}>{store.name}</Text>
              {store.isVerified && <Text style={styles.verified}>✓</Text>}
            </View>
            <Text variant="bodySmall" style={styles.muted}>
              {'★'.repeat(Math.round(store.ratingAverage))} {store.ratingAverage.toFixed(1)} ({store.ratingCount})
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text variant="titleMedium" style={styles.statNum}>{store.followersCount}</Text>
            <Text variant="bodySmall" style={styles.muted}>Takipçi</Text>
          </View>
          <View style={styles.stat}>
            <Text variant="titleMedium" style={styles.statNum}>{store.productsCount}</Text>
            <Text variant="bodySmall" style={styles.muted}>Ürün</Text>
          </View>
          <View style={styles.stat}>
            <Text variant="titleMedium" style={styles.statNum}>{store.ratingAverage.toFixed(1)}</Text>
            <Text variant="bodySmall" style={styles.muted}>Puan</Text>
          </View>
        </View>

        <Button mode="contained" style={styles.followBtn}>Takip Et</Button>

        {store.categories?.length > 0 && (
          <View style={styles.chipRow}>
            {store.categories.map((cat) => (
              <Chip key={cat} mode="outlined" compact style={styles.chip}>{cat}</Chip>
            ))}
          </View>
        )}

        {store.description ? (
          <Text variant="bodyMedium" style={styles.desc}>{store.description}</Text>
        ) : null}

        {store.address ? (
          <Text variant="bodySmall" style={styles.address}>📍 {store.address}</Text>
        ) : null}
      </View>

      {/* Products */}
      <Text variant="titleMedium" style={styles.sectionTitle}>
        Ürünler ({products.length})
      </Text>

      {products.length === 0 ? (
        <Text style={styles.emptyText}>Henüz ürün eklenmemiş</Text>
      ) : (
        <View style={styles.productGrid}>
          {products.map((product) => {
            const hasDiscount = product.salePrice && product.salePrice < product.price;
            return (
              <TouchableOpacity
                key={product.id}
                style={styles.productCard}
                onPress={() => navigation.navigate('ProductDetail', { productId: product.slug })}
              >
                <Image
                  source={{ uri: product.thumbnail || 'https://via.placeholder.com/150' }}
                  style={styles.productImage}
                />
                <Text variant="labelMedium" numberOfLines={1} style={styles.productName}>
                  {product.name}
                </Text>
                <View style={styles.priceRow}>
                  <Text variant="labelLarge" style={styles.price}>
                    {(hasDiscount ? product.salePrice : product.price)?.toLocaleString('tr-TR')} ₺
                  </Text>
                  {hasDiscount && (
                    <Text variant="bodySmall" style={styles.oldPrice}>
                      {product.price.toLocaleString('tr-TR')} ₺
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
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
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontWeight: '700' },
  verified: { color: '#2563eb', fontSize: 18, fontWeight: '700' },
  muted: { color: '#999' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16, paddingVertical: 12, backgroundColor: '#f9f9f9', borderRadius: 12 },
  stat: { alignItems: 'center' },
  statNum: { fontWeight: '700' },
  followBtn: { borderRadius: 8, marginBottom: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  chip: { height: 28 },
  desc: { color: '#555', lineHeight: 22, marginBottom: 8 },
  address: { color: '#777', marginBottom: 8 },
  sectionTitle: { fontWeight: '700', marginHorizontal: 16, marginTop: 8, marginBottom: 8 },
  emptyText: { textAlign: 'center', color: '#999', paddingVertical: 24 },
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, paddingBottom: 24 },
  productCard: { width: '48%', margin: '1%', backgroundColor: '#f9f9f9', borderRadius: 12, overflow: 'hidden', marginBottom: 8 },
  productImage: { width: '100%', height: 140 },
  productName: { marginHorizontal: 8, marginTop: 8 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingBottom: 8, marginTop: 4 },
  price: { color: '#2563eb', fontWeight: '700' },
  oldPrice: { color: '#999', textDecorationLine: 'line-through' },
});
