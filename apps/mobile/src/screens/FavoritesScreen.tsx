import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import type { RootStackScreenProps } from '../navigation/types';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { toggleFavorite } from '../store/slices/favoriteSlice';
import { addItem } from '../store/slices/cartSlice';
import ProductCard from '../components/ProductCard';
import apiClient from '../services/api/client';

const PRIMARY = '#1a6b52';

type Props = RootStackScreenProps<'Favorites'>;

interface Product {
  id: string;
  name: string;
  slug: string;
  thumbnail: string;
  price: number;
  salePrice?: number | null;
  currency: string;
  rating: { average: number; count: number };
  categories: string[];
}

export default function FavoritesScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const favoriteIds = useAppSelector((s) => s.favorites.ids);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const activeIds = Object.entries(favoriteIds)
    .filter(([, v]) => v)
    .map(([k]) => k);

  const fetchFavorites = useCallback(async () => {
    if (activeIds.length === 0) {
      setProducts([]);
      setIsLoading(false);
      return;
    }
    try {
      const res = await apiClient.get('/favorites');
      const data = res.data?.data || res.data || [];
      setProducts(Array.isArray(data) ? data : []);
    } catch {
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeIds.length]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const handlePress = (product: Product) => {
    navigation.navigate('ProductDetail', { productId: product.id });
  };

  const handleAddToCart = (product: Product) => {
    dispatch(
      addItem({
        id: product.id,
        productId: product.id,
        name: product.name,
        price: product.salePrice ?? product.price,
        quantity: 1,
        thumbnail: product.thumbnail,
      }),
    );
  };

  const handleFavorite = (product: Product) => {
    dispatch(toggleFavorite(product.id));
    setProducts((prev) => prev.filter((p) => p.id !== product.id));
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  if (products.length === 0) {
    return (
      <View style={styles.centered}>
        <Icon name="heart-outline" size={64} color="#ccc" />
        <Text variant="titleMedium" style={styles.emptyTitle}>
          Henüz favoriniz yok
        </Text>
        <Text variant="bodyMedium" style={styles.emptySubtitle}>
          Beğendiğiniz ürünleri favorilerinize ekleyin
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text variant="titleLarge" style={styles.header}>
        Favorilerim ({products.length})
      </Text>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={handlePress}
            onAddToCart={handleAddToCart}
            onFavorite={handleFavorite}
            isFavorite={true}
          />
        )}
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
  listContent: { paddingHorizontal: 12, paddingBottom: 16 },
  row: { justifyContent: 'space-between' },
});
