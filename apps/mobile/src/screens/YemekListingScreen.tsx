import React, { useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Text, Searchbar, Chip } from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import type { RootStackScreenProps } from '../navigation/types';

type Props = RootStackScreenProps<'YemekListing'>;

interface RestaurantListing {
  id: string;
  name: string;
  cuisine: string;
  type: 'restoran' | 'kafe' | 'ev_yemegi';
  city: string;
  district: string;
  rating: number;
  reviewCount: number;
  priceRange: 1 | 2 | 3 | 4;
  thumbnail: string;
  delivery: boolean;
  takeaway: boolean;
  minOrder: number;
  deliveryTime: number;
}

const ACCENT = '#e67e22';

const RESTAURANTS: RestaurantListing[] = [
  { id: '1', name: 'Lezzet Sarayı', cuisine: 'Türk Mutfağı', type: 'restoran', city: 'İstanbul', district: 'Beşiktaş', rating: 4.7, reviewCount: 1240, priceRange: 3, thumbnail: 'https://picsum.photos/seed/turkish/600/400', delivery: true, takeaway: true, minOrder: 150, deliveryTime: 35 },
  { id: '2', name: 'Pizza Bella', cuisine: 'İtalyan', type: 'restoran', city: 'İstanbul', district: 'Şişli', rating: 4.5, reviewCount: 890, priceRange: 2, thumbnail: 'https://picsum.photos/seed/pizza/600/400', delivery: true, takeaway: true, minOrder: 120, deliveryTime: 30 },
  { id: '3', name: 'Sushi Zen', cuisine: 'Japon', type: 'restoran', city: 'İstanbul', district: 'Nişantaşı', rating: 4.8, reviewCount: 654, priceRange: 4, thumbnail: 'https://picsum.photos/seed/sushi/600/400', delivery: true, takeaway: false, minOrder: 250, deliveryTime: 45 },
  { id: '4', name: 'Çay Bahçesi', cuisine: 'Kafe', type: 'kafe', city: 'İzmir', district: 'Karşıyaka', rating: 4.3, reviewCount: 412, priceRange: 1, thumbnail: 'https://picsum.photos/seed/teagarden/600/400', delivery: false, takeaway: true, minOrder: 50, deliveryTime: 20 },
  { id: '5', name: 'Burger House', cuisine: 'Amerikan', type: 'restoran', city: 'Ankara', district: 'Çankaya', rating: 4.4, reviewCount: 1876, priceRange: 2, thumbnail: 'https://picsum.photos/seed/burger/600/400', delivery: true, takeaway: true, minOrder: 100, deliveryTime: 25 },
  { id: '6', name: 'Anne Eli Yemekleri', cuisine: 'Ev Yemeği', type: 'ev_yemegi', city: 'İstanbul', district: 'Üsküdar', rating: 4.9, reviewCount: 320, priceRange: 2, thumbnail: 'https://picsum.photos/seed/homefood/600/400', delivery: true, takeaway: true, minOrder: 180, deliveryTime: 50 },
  { id: '7', name: 'Kahve Dünyası', cuisine: 'Kafe', type: 'kafe', city: 'İstanbul', district: 'Kadıköy', rating: 4.2, reviewCount: 2100, priceRange: 2, thumbnail: 'https://picsum.photos/seed/coffeshop/600/400', delivery: true, takeaway: true, minOrder: 60, deliveryTime: 25 },
  { id: '8', name: 'Şark Köşesi', cuisine: 'Ortadoğu', type: 'restoran', city: 'Gaziantep', district: 'Şahinbey', rating: 4.6, reviewCount: 567, priceRange: 2, thumbnail: 'https://picsum.photos/seed/middle-east/600/400', delivery: true, takeaway: true, minOrder: 100, deliveryTime: 30 },
  { id: '9', name: 'Vegan Garden', cuisine: 'Vegan', type: 'restoran', city: 'İstanbul', district: 'Beyoğlu', rating: 4.5, reviewCount: 234, priceRange: 3, thumbnail: 'https://picsum.photos/seed/vegan/600/400', delivery: true, takeaway: true, minOrder: 150, deliveryTime: 35 },
  { id: '10', name: 'Babaannenin Mutfağı', cuisine: 'Ev Yemeği', type: 'ev_yemegi', city: 'Ankara', district: 'Yenimahalle', rating: 4.8, reviewCount: 145, priceRange: 1, thumbnail: 'https://picsum.photos/seed/grandma/600/400', delivery: true, takeaway: false, minOrder: 90, deliveryTime: 40 },
];

const TABS = [
  { key: 'all', label: 'Tümü' },
  { key: 'restoran', label: 'Restoran' },
  { key: 'kafe', label: 'Kafe' },
  { key: 'ev_yemegi', label: 'Ev Yemeği' },
];

const CUISINE_FILTERS = ['Tümü', 'Türk Mutfağı', 'İtalyan', 'Amerikan', 'Japon', 'Vegan', 'Ev Yemeği'];

function priceSymbols(level: number) {
  return '₺'.repeat(level);
}

export default function YemekListingScreen({ navigation }: Props) {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<string>('all');
  const [cuisine, setCuisine] = useState<string>('Tümü');

  const filtered = useMemo(() => {
    return RESTAURANTS.filter((r) => {
      if (tab !== 'all' && r.type !== tab) return false;
      if (cuisine !== 'Tümü' && r.cuisine !== cuisine) return false;
      const q = search.trim().toLowerCase();
      if (q && !r.name.toLowerCase().includes(q) && !r.cuisine.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [tab, cuisine, search]);

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Restoran, mutfak ara..."
        value={search}
        onChangeText={setSearch}
        style={styles.searchbar}
      />

      <View style={styles.tabsRow}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipRow}
        contentContainerStyle={styles.chipRowContent}
      >
        {CUISINE_FILTERS.map((c) => (
          <Chip
            key={c}
            mode={cuisine === c ? 'flat' : 'outlined'}
            selected={cuisine === c}
            onPress={() => setCuisine(c)}
            style={styles.chip}
            compact
          >
            {c}
          </Chip>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(it) => it.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} activeOpacity={0.85}>
            <Image source={{ uri: item.thumbnail }} style={styles.image} />
            <View style={styles.body}>
              <View style={styles.headerRow}>
                <Text numberOfLines={1} style={styles.name}>
                  {item.name}
                </Text>
                <View style={styles.ratingBox}>
                  <Icon name="star" size={11} color="#f59e0b" />
                  <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
                </View>
              </View>
              <Text style={styles.cuisine}>
                {item.cuisine} · {priceSymbols(item.priceRange)}
              </Text>
              <View style={styles.locRow}>
                <Icon name="map-marker" size={12} color="#888" />
                <Text style={styles.locText}>
                  {item.city} · {item.district}
                </Text>
                <Text style={styles.dotSep}>•</Text>
                <Text style={styles.reviewText}>{item.reviewCount} değ.</Text>
              </View>
              <View style={styles.featuresRow}>
                {item.delivery && (
                  <View style={[styles.featChip, { backgroundColor: '#dcfce7' }]}>
                    <Icon name="truck-fast" size={10} color="#16a34a" />
                    <Text style={[styles.featText, { color: '#16a34a' }]}>
                      {item.deliveryTime}dk
                    </Text>
                  </View>
                )}
                {item.takeaway && (
                  <View style={[styles.featChip, { backgroundColor: '#fef3c7' }]}>
                    <Icon name="bag-personal" size={10} color="#d97706" />
                    <Text style={[styles.featText, { color: '#d97706' }]}>Paket Al</Text>
                  </View>
                )}
                <View style={[styles.featChip, { backgroundColor: '#f1f5f9' }]}>
                  <Icon name="cash" size={10} color="#475569" />
                  <Text style={[styles.featText, { color: '#475569' }]}>
                    Min {item.minOrder} ₺
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="silverware-fork-knife" size={48} color="#ccc" />
            <Text style={styles.emptyText}>Sonuç bulunamadı</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  searchbar: { margin: 12, marginBottom: 8, elevation: 2 },
  tabsRow: { flexDirection: 'row', paddingHorizontal: 12, gap: 6, marginBottom: 8 },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tabBtnActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  tabText: { fontSize: 11, color: '#666', fontWeight: '700' },
  tabTextActive: { color: '#fff' },
  chipRow: { paddingHorizontal: 12, marginBottom: 8, maxHeight: 40 },
  chipRowContent: { gap: 6 },
  chip: { marginRight: 4 },
  list: { padding: 12, paddingTop: 4 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  image: { width: '100%', height: 160 },
  body: { padding: 12 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  name: { flex: 1, fontSize: 15, fontWeight: '700', color: '#222', marginRight: 6 },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#fffbeb',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ratingText: { fontSize: 11, fontWeight: '800', color: '#92400e' },
  cuisine: { fontSize: 12, color: '#666', fontWeight: '500', marginBottom: 6 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  locText: { fontSize: 11, color: '#888' },
  dotSep: { fontSize: 11, color: '#ccc', marginHorizontal: 2 },
  reviewText: { fontSize: 11, color: '#888' },
  featuresRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  featChip: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4 },
  featText: { fontSize: 10, fontWeight: '700' },
  empty: { alignItems: 'center', padding: 48 },
  emptyText: { color: '#999', marginTop: 12 },
});
