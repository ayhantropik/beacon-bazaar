import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import { Text, Searchbar, Chip, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import AddToCartButton from '../components/AddToCartButton';
import type { MainTabScreenProps } from '../navigation/types';
import apiClient from '../services/api/client';

type Props = MainTabScreenProps<'Search'>;

interface ProductItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice: number | null;
  thumbnail: string;
  categories: string[];
  ratingAverage: number;
}

export default function SearchScreen({ navigation, route }: Props) {
  const [query, setQuery] = useState(route.params?.query || '');
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(false);

  const doSearch = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const res = await apiClient.get('/products/search', { params: { q, limit: 20 } });
      setProducts(res.data?.data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (query) doSearch(query);
  }, []);

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <Searchbar
        placeholder="Ürün ara..."
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={() => doSearch(query)}
        style={styles.searchbar}
      />

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" /></View>
      ) : products.length === 0 ? (
        <View style={styles.center}>
          <Text variant="bodyLarge" style={styles.muted}>
            {query ? 'Sonuç bulunamadı' : 'Aramak istediğiniz ürünü yazın'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={products}
          numColumns={2}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const hasDiscount = item.salePrice && item.salePrice < item.price;
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('ProductDetail', { productId: item.slug })}
              >
                <Image source={{ uri: item.thumbnail || 'https://picsum.photos/150' }} style={styles.image} />
                <Text variant="labelMedium" numberOfLines={1} style={styles.name}>{item.name}</Text>
                <View style={styles.priceRow}>
                  <Text variant="labelLarge" style={styles.price}>
                    {Number(hasDiscount ? item.salePrice : item.price).toLocaleString('tr-TR')} ₺
                  </Text>
                  <AddToCartButton product={item} />
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchbar: { margin: 16, elevation: 2 },
  muted: { color: '#999' },
  list: { paddingHorizontal: 12 },
  card: { width: '48%', margin: '1%', backgroundColor: '#f9f9f9', borderRadius: 12, overflow: 'hidden', marginBottom: 8 },
  image: { width: '100%', height: 140 },
  name: { marginHorizontal: 8, marginTop: 8 },
  price: { color: '#2563eb', fontWeight: '700', flex: 1 },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingBottom: 8, marginTop: 4 },
});
