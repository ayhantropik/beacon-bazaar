import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Card, Text, Chip } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface StoreRating {
  average: number;
  count: number;
}

interface Store {
  id: string;
  name: string;
  logo: string;
  coverImage?: string;
  categories: string[];
  rating: StoreRating;
  isVerified: boolean;
  address: string;
}

interface StoreCardProps {
  store: Store;
  onPress: (store: Store) => void;
}

const PRIMARY = '#1a6b52';

const StoreCard: React.FC<StoreCardProps> = ({ store, onPress }) => {
  return (
    <Card style={styles.card} onPress={() => onPress(store)}>
      <View style={styles.row}>
        <Image
          source={{ uri: store.logo }}
          style={styles.logo}
          resizeMode="cover"
        />
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {store.name}
            </Text>
            {store.isVerified && (
              <Icon
                name="check-decagram"
                size={18}
                color={PRIMARY}
                style={styles.verifiedIcon}
              />
            )}
          </View>

          {store.categories.length > 0 && (
            <View style={styles.categoriesRow}>
              {store.categories.slice(0, 3).map((cat, index) => (
                <Chip
                  key={index}
                  style={styles.chip}
                  textStyle={styles.chipText}
                  compact
                >
                  {cat}
                </Chip>
              ))}
            </View>
          )}

          <View style={styles.ratingRow}>
            <Icon name="star" size={16} color="#f39c12" />
            <Text style={styles.ratingText}>
              {store.rating.average.toFixed(1)}
            </Text>
            <Text style={styles.ratingCount}>
              ({store.rating.count} degerlendirme)
            </Text>
          </View>

          <View style={styles.addressRow}>
            <Icon name="map-marker-outline" size={14} color="#888" />
            <Text style={styles.addressText} numberOfLines={1}>
              {store.address}
            </Text>
          </View>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 10,
    backgroundColor: '#fff',
    elevation: 2,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    padding: 12,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f0f0f0',
  },
  info: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    flexShrink: 1,
  },
  verifiedIcon: {
    marginLeft: 6,
  },
  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4,
    gap: 4,
  },
  chip: {
    height: 24,
    backgroundColor: '#e8f5e9',
  },
  chipText: {
    fontSize: 10,
    color: PRIMARY,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginLeft: 4,
  },
  ratingCount: {
    fontSize: 11,
    color: '#888',
    marginLeft: 4,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  addressText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    flex: 1,
  },
});

export default StoreCard;
