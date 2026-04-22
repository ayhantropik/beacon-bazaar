import React from 'react';
import {
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Card, Text, IconButton } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface ProductRating {
  average: number;
  count: number;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  thumbnail: string;
  price: number;
  salePrice?: number | null;
  currency: string;
  rating: ProductRating;
  categories: string[];
}

interface ProductCardProps {
  product: Product;
  onPress: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onFavorite: (product: Product) => void;
  isFavorite: boolean;
}

const PRIMARY = '#1a6b52';
const DISCOUNT = '#c0392b';

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onPress,
  onAddToCart,
  onFavorite,
  isFavorite,
}) => {
  const hasDiscount = product.salePrice != null && product.salePrice < product.price;
  const displayPrice = hasDiscount ? product.salePrice! : product.price;

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalf = rating - fullStars >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Icon key={i} name="star" size={14} color="#f39c12" />,
        );
      } else if (i === fullStars && hasHalf) {
        stars.push(
          <Icon key={i} name="star-half-full" size={14} color="#f39c12" />,
        );
      } else {
        stars.push(
          <Icon key={i} name="star-outline" size={14} color="#ccc" />,
        );
      }
    }
    return stars;
  };

  return (
    <Card style={styles.card} onPress={() => onPress(product)}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: product.thumbnail }}
          style={styles.image}
          resizeMode="cover"
        />
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={() => onFavorite(product)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={22}
            color={isFavorite ? DISCOUNT : '#fff'}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>

        <View style={styles.ratingRow}>
          {renderStars(product.rating.average)}
          <Text style={styles.ratingCount}>({product.rating.count})</Text>
        </View>

        <View style={styles.priceRow}>
          <View style={styles.priceContainer}>
            {hasDiscount && (
              <Text style={styles.originalPrice}>
                {product.price.toFixed(2)} {product.currency}
              </Text>
            )}
            <Text
              style={[
                styles.price,
                hasDiscount && styles.salePrice,
              ]}
            >
              {displayPrice.toFixed(2)} {product.currency}
            </Text>
          </View>

          <IconButton
            icon="cart-plus"
            iconColor={PRIMARY}
            size={20}
            style={styles.cartButton}
            onPress={() => onAddToCart(product)}
          />
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 4,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 2,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 16,
    padding: 4,
  },
  content: {
    padding: 8,
  },
  name: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
    lineHeight: 18,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  ratingCount: {
    fontSize: 11,
    color: '#888',
    marginLeft: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceContainer: {
    flex: 1,
  },
  originalPrice: {
    fontSize: 11,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
    color: PRIMARY,
  },
  salePrice: {
    color: DISCOUNT,
  },
  cartButton: {
    margin: 0,
  },
});

export default ProductCard;
