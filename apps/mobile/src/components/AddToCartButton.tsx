import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAppDispatch } from '../store/hooks';
import { addItem } from '../store/slices/cartSlice';

interface CartProductLike {
  id: string;
  productId?: string;
  storeId?: string;
  name: string;
  thumbnail?: string | null;
  price: number | string;
  salePrice?: number | string | null;
}

interface Props {
  product: CartProductLike;
  size?: 'sm' | 'md';
  style?: any;
}

function num(v: any): number {
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return Number.isFinite(n) ? n : 0;
}

export default function AddToCartButton({ product, size = 'sm', style }: Props) {
  const dispatch = useAppDispatch();

  const onPress = (e: any) => {
    e?.stopPropagation?.();
    const sale = product.salePrice == null ? null : num(product.salePrice);
    const price = num(product.price);
    const final = sale != null && sale < price ? sale : price;
    dispatch(
      addItem({
        id: product.id,
        productId: product.productId || product.id,
        storeId: product.storeId || '',
        name: product.name,
        thumbnail: product.thumbnail || '',
        price: final,
        quantity: 1,
      } as any),
    );
  };

  const dim = size === 'md' ? 32 : 24;
  const iconSize = size === 'md' ? 18 : 14;

  return (
    <TouchableOpacity
      onPress={onPress}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      style={[styles.btn, { width: dim, height: dim, borderRadius: dim / 2 }, style]}
      activeOpacity={0.7}
    >
      <Icon name="cart-plus" size={iconSize} color="#fff" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: '#1a6b52',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
});
