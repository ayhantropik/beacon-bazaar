import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { Text, Button, IconButton, Chip, ActivityIndicator, Snackbar } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAppDispatch } from '../store/hooks';
import { addItem } from '../store/slices/cartSlice';
import apiClient from '../services/api/client';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetail'>;

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  salePrice: number | null;
  thumbnail: string;
  images: string[];
  categories: string[];
  ratingAverage: number;
  ratingCount: number;
  stockQuantity: number;
  storeId: string;
  store?: { name: string; slug: string; isVerified: boolean };
}

export default function ProductDetailScreen({ route, navigation }: Props) {
  const { productId } = route.params;
  const dispatch = useAppDispatch();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [snackVisible, setSnackVisible] = useState(false);

  useEffect(() => {
    async function fetch() {
      try {
        const res = await apiClient.get(`/products/${productId}`);
        setProduct(res.data?.data || res.data);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [productId]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  if (!product) return <View style={styles.center}><Text>Ürün bulunamadı</Text></View>;

  const hasDiscount = product.salePrice && product.salePrice < product.price;
  const currentPrice = hasDiscount ? Number(product.salePrice) : Number(product.price);

  const handleAddToCart = () => {
    dispatch(addItem({
      id: product.id,
      productId: product.id,
      storeId: product.storeId,
      name: product.name,
      thumbnail: product.thumbnail,
      price: currentPrice,
      quantity,
    }));
    setSnackVisible(true);
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <Image source={{ uri: product.thumbnail || 'https://via.placeholder.com/400' }} style={styles.image} />

        <View style={styles.content}>
          <View style={styles.chipRow}>
            {product.categories?.map((cat) => (
              <Chip key={cat} mode="outlined" compact style={styles.chip}>{cat}</Chip>
            ))}
          </View>

          <Text variant="headlineSmall" style={styles.name}>{product.name}</Text>

          <View style={styles.ratingRow}>
            <Text style={styles.stars}>{'★'.repeat(Math.round(product.ratingAverage))}</Text>
            <Text variant="bodySmall" style={styles.muted}>({product.ratingCount} değerlendirme)</Text>
          </View>

          <View style={styles.priceRow}>
            <Text variant="headlineMedium" style={styles.price}>{currentPrice.toLocaleString('tr-TR')} ₺</Text>
            {hasDiscount && (
              <Text variant="titleMedium" style={styles.oldPrice}>{product.price.toLocaleString('tr-TR')} ₺</Text>
            )}
          </View>

          {product.stockQuantity > 0 ? (
            <Text style={styles.inStock}>Stokta</Text>
          ) : (
            <Text style={styles.outOfStock}>Stokta yok</Text>
          )}

          <Text variant="bodyMedium" style={styles.description}>{product.description}</Text>

          {product.store && (
            <View style={styles.storeCard}>
              <Text variant="labelLarge">{product.store.name}</Text>
              <Button mode="text" compact onPress={() => navigation.navigate('StoreDetail', { storeId: product.store!.slug })}>
                Mağazaya Git
              </Button>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.quantityRow}>
          <IconButton icon="minus" size={20} onPress={() => setQuantity((q) => Math.max(1, q - 1))} />
          <Text variant="titleMedium">{quantity}</Text>
          <IconButton icon="plus" size={20} onPress={() => setQuantity((q) => q + 1)} />
        </View>
        <Button
          mode="contained"
          icon="cart-plus"
          onPress={handleAddToCart}
          disabled={product.stockQuantity === 0}
          style={styles.addButton}
          contentStyle={styles.addButtonContent}
        >
          Sepete Ekle
        </Button>
      </View>

      <Snackbar visible={snackVisible} onDismiss={() => setSnackVisible(false)} duration={2000}>
        Ürün sepete eklendi!
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  image: { width: '100%', height: 320 },
  content: { padding: 16 },
  chipRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  chip: { height: 28 },
  name: { fontWeight: '700', marginBottom: 8 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  stars: { color: '#f59e0b' },
  muted: { color: '#999' },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 12, marginBottom: 8 },
  price: { color: '#2563eb', fontWeight: '800' },
  oldPrice: { color: '#999', textDecorationLine: 'line-through' },
  inStock: { color: '#16a34a', fontWeight: '600', marginBottom: 12 },
  outOfStock: { color: '#e53935', fontWeight: '600', marginBottom: 12 },
  description: { color: '#555', lineHeight: 22, marginBottom: 16 },
  storeCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9f9f9', borderRadius: 12, padding: 12 },
  bottomBar: { flexDirection: 'row', alignItems: 'center', padding: 12, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  quantityRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, marginRight: 12 },
  addButton: { flex: 1, borderRadius: 8 },
  addButtonContent: { paddingVertical: 6 },
});
