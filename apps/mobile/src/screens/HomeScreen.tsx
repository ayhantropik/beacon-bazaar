import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Image, TouchableOpacity, ScrollView } from 'react-native';
import { Text, Searchbar, Card, Chip, ActivityIndicator } from 'react-native-paper';
import type { MainTabScreenProps } from '../navigation/types';
import apiClient from '../services/api/client';

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

const CATEGORIES = ['Elektronik', 'Giyim', 'Gıda', 'Kitap', 'Spor', 'Kozmetik'];

export default function HomeScreen({ navigation }: Props) {
  const [search, setSearch] = useState('');
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [storesRes, productsRes] = await Promise.all([
          apiClient.get('/stores/search?limit=6'),
          apiClient.get('/products/featured'),
        ]);
        setStores(storesRes.data?.data || []);
        setProducts(productsRes.data?.data || []);
      } catch {
        // API bağlantısı bekleniyor
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleSearch = () => {
    if (search.trim()) {
      navigation.navigate('Search', { query: search });
    }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Search */}
      <Searchbar
        placeholder="Ne aramıştınız?"
        value={search}
        onChangeText={setSearch}
        onSubmitEditing={handleSearch}
        style={styles.searchbar}
      />

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

      {/* Stores */}
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
            <Image source={{ uri: item.coverImage || 'https://via.placeholder.com/160x100' }} style={styles.storeImage} />
            <View style={styles.storeInfo}>
              <Text variant="labelLarge" numberOfLines={1}>{item.name}</Text>
              <Text variant="bodySmall" style={styles.muted}>
                {'★'.repeat(Math.round(item.ratingAverage))} {item.ratingAverage.toFixed(1)}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Products */}
      <Text variant="titleMedium" style={styles.sectionTitle}>Öne Çıkan Ürünler</Text>
      <View style={styles.productGrid}>
        {products.slice(0, 6).map((product) => {
          const hasDiscount = product.salePrice && product.salePrice < product.price;
          return (
            <TouchableOpacity
              key={product.id}
              style={styles.productCard}
              onPress={() => navigation.navigate('ProductDetail', { productId: product.slug })}
            >
              <Image source={{ uri: product.thumbnail || 'https://via.placeholder.com/150' }} style={styles.productImage} />
              <Text variant="labelMedium" numberOfLines={1} style={styles.productName}>{product.name}</Text>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchbar: { margin: 16, elevation: 2 },
  sectionTitle: { fontWeight: '700', marginHorizontal: 16, marginTop: 16, marginBottom: 8 },
  chipRow: { paddingHorizontal: 12, marginBottom: 8 },
  chip: { marginHorizontal: 4 },
  horizontalList: { paddingHorizontal: 12 },
  storeCard: { width: 160, marginHorizontal: 4, borderRadius: 12, overflow: 'hidden', backgroundColor: '#f9f9f9' },
  storeImage: { width: 160, height: 100 },
  storeInfo: { padding: 8 },
  muted: { color: '#999', marginTop: 2 },
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, paddingBottom: 24 },
  productCard: { width: '48%', margin: '1%', backgroundColor: '#f9f9f9', borderRadius: 12, overflow: 'hidden' },
  productImage: { width: '100%', height: 140 },
  productName: { marginHorizontal: 8, marginTop: 8 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingBottom: 8, marginTop: 4 },
  price: { color: '#2563eb', fontWeight: '700' },
  oldPrice: { color: '#999', textDecorationLine: 'line-through' },
});
