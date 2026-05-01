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

type Props = RootStackScreenProps<'EmlakListing'>;

interface PropertyListing {
  id: string;
  title: string;
  type: 'satilik' | 'kiralik';
  propertyType: string; // Daire, Müstakil Ev, Villa, Arsa, İşyeri
  rooms: string;
  m2: number;
  age: number;
  floor: string;
  city: string;
  district: string;
  price: number;
  thumbnail: string;
  seller: { name: string; verified: boolean };
}

const PRIMARY = '#1a6b52';

const PROPERTIES: PropertyListing[] = [
  { id: '1', title: 'Boğaz Manzaralı Lüks Daire', type: 'satilik', propertyType: 'Daire', rooms: '3+1', m2: 145, age: 2, floor: '8/12', city: 'İstanbul', district: 'Beşiktaş', price: 12500000, thumbnail: 'https://picsum.photos/seed/luxapt/600/400', seller: { name: 'Premium Emlak', verified: true } },
  { id: '2', title: 'Modern Villa Bahçeli', type: 'satilik', propertyType: 'Villa', rooms: '5+2', m2: 320, age: 5, floor: '2', city: 'İzmir', district: 'Çeşme', price: 18000000, thumbnail: 'https://picsum.photos/seed/villa/600/400', seller: { name: 'Ege Emlak', verified: true } },
  { id: '3', title: 'Merkezi Konumda Stüdyo', type: 'kiralik', propertyType: 'Daire', rooms: '1+1', m2: 55, age: 8, floor: '3/5', city: 'İstanbul', district: 'Şişli', price: 22000, thumbnail: 'https://picsum.photos/seed/studio/600/400', seller: { name: 'Şişli Emlak', verified: true } },
  { id: '4', title: 'Site İçi Rezidans Daire', type: 'satilik', propertyType: 'Daire', rooms: '2+1', m2: 110, age: 1, floor: '12/22', city: 'İstanbul', district: 'Ataşehir', price: 8500000, thumbnail: 'https://picsum.photos/seed/residence/600/400', seller: { name: 'Star Real Estate', verified: true } },
  { id: '5', title: 'Şehir Manzaralı 3+1', type: 'kiralik', propertyType: 'Daire', rooms: '3+1', m2: 130, age: 4, floor: '15/20', city: 'Ankara', district: 'Çankaya', price: 35000, thumbnail: 'https://picsum.photos/seed/cityview/600/400', seller: { name: 'Ankara Lokal', verified: false } },
  { id: '6', title: 'Doğa İçinde Müstakil Ev', type: 'satilik', propertyType: 'Müstakil Ev', rooms: '4+1', m2: 220, age: 10, floor: '2', city: 'Bursa', district: 'Mudanya', price: 6200000, thumbnail: 'https://picsum.photos/seed/cottage/600/400', seller: { name: 'Mudanya Emlak', verified: true } },
  { id: '7', title: 'Yatırımlık Arsa İmarlı', type: 'satilik', propertyType: 'Arsa', rooms: '-', m2: 850, age: 0, floor: '-', city: 'Antalya', district: 'Konyaaltı', price: 3800000, thumbnail: 'https://picsum.photos/seed/land/600/400', seller: { name: 'Akdeniz Emlak', verified: true } },
  { id: '8', title: 'Plaza\'da Kiralık Ofis', type: 'kiralik', propertyType: 'İşyeri', rooms: 'Açık Ofis', m2: 180, age: 3, floor: '7/15', city: 'İstanbul', district: 'Maslak', price: 75000, thumbnail: 'https://picsum.photos/seed/office/600/400', seller: { name: 'Plaza Properties', verified: true } },
  { id: '9', title: 'Sahile 100m Yazlık', type: 'satilik', propertyType: 'Villa', rooms: '4+1', m2: 180, age: 7, floor: '2', city: 'Muğla', district: 'Bodrum', price: 14500000, thumbnail: 'https://picsum.photos/seed/seasidehouse/600/400', seller: { name: 'Bodrum Premium', verified: true } },
  { id: '10', title: 'Aile Tipi Bahçe Katı', type: 'kiralik', propertyType: 'Daire', rooms: '4+1', m2: 165, age: 6, floor: 'Bahçe/4', city: 'İstanbul', district: 'Kadıköy', price: 42000, thumbnail: 'https://picsum.photos/seed/garden/600/400', seller: { name: 'Kadıköy Emlak', verified: false } },
];

const TABS = [
  { key: 'all', label: 'Tümü' },
  { key: 'satilik', label: 'Satılık' },
  { key: 'kiralik', label: 'Kiralık' },
];

const TYPE_FILTERS = ['Tümü', 'Daire', 'Villa', 'Müstakil Ev', 'Arsa', 'İşyeri'];

export default function EmlakListingScreen({ navigation }: Props) {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<string>('all');
  const [propType, setPropType] = useState<string>('Tümü');

  const filtered = useMemo(() => {
    return PROPERTIES.filter((p) => {
      if (tab !== 'all' && p.type !== tab) return false;
      if (propType !== 'Tümü' && p.propertyType !== propType) return false;
      const q = search.trim().toLowerCase();
      if (q && !p.title.toLowerCase().includes(q) && !p.district.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [tab, propType, search]);

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="İlçe, semt, başlık ara..."
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
        {TYPE_FILTERS.map((f) => (
          <Chip
            key={f}
            mode={propType === f ? 'flat' : 'outlined'}
            selected={propType === f}
            onPress={() => setPropType(f)}
            style={styles.chip}
            compact
          >
            {f}
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
            <View
              style={[
                styles.typeBadge,
                { backgroundColor: item.type === 'satilik' ? '#dcfce7' : '#fef3c7' },
              ]}
            >
              <Text
                style={[
                  styles.typeBadgeText,
                  { color: item.type === 'satilik' ? '#16a34a' : '#d97706' },
                ]}
              >
                {item.type === 'satilik' ? 'SATILIK' : 'KİRALIK'}
              </Text>
            </View>
            <View style={styles.body}>
              <Text numberOfLines={1} style={styles.title}>
                {item.title}
              </Text>
              <View style={styles.specsRow}>
                <View style={styles.specItem}>
                  <Icon name="floor-plan" size={11} color="#666" />
                  <Text style={styles.specText}>{item.rooms}</Text>
                </View>
                <View style={styles.specItem}>
                  <Icon name="ruler-square" size={11} color="#666" />
                  <Text style={styles.specText}>{item.m2} m²</Text>
                </View>
                <View style={styles.specItem}>
                  <Icon name="home-floor-1" size={11} color="#666" />
                  <Text style={styles.specText}>Kat {item.floor}</Text>
                </View>
                {item.age >= 0 && item.propertyType !== 'Arsa' && (
                  <View style={styles.specItem}>
                    <Icon name="calendar-clock" size={11} color="#666" />
                    <Text style={styles.specText}>{item.age} yıl</Text>
                  </View>
                )}
              </View>
              <View style={styles.footerRow}>
                <View style={styles.locRow}>
                  <Icon name="map-marker" size={12} color="#888" />
                  <Text style={styles.locText}>
                    {item.city} · {item.district}
                  </Text>
                </View>
                <Text style={styles.price}>
                  {item.price.toLocaleString('tr-TR')} ₺
                  {item.type === 'kiralik' ? '/ay' : ''}
                </Text>
              </View>
              <View style={styles.sellerRow}>
                <Icon
                  name={item.seller.verified ? 'check-decagram' : 'account'}
                  size={11}
                  color={item.seller.verified ? PRIMARY : '#999'}
                />
                <Text style={styles.sellerText}>{item.seller.name}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="home-off-outline" size={48} color="#ccc" />
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
  tabBtnActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  tabText: { fontSize: 12, color: '#666', fontWeight: '700' },
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
    position: 'relative',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  image: { width: '100%', height: 180 },
  typeBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  typeBadgeText: { fontSize: 10, fontWeight: '800' },
  body: { padding: 12 },
  title: { fontSize: 15, fontWeight: '700', color: '#222', marginBottom: 8 },
  specsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 8 },
  specItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  specText: { fontSize: 11, color: '#666', fontWeight: '500' },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  locText: { fontSize: 11, color: '#888' },
  price: { fontSize: 16, fontWeight: '800', color: PRIMARY },
  sellerRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sellerText: { fontSize: 11, color: '#666' },
  empty: { alignItems: 'center', padding: 48 },
  emptyText: { color: '#999', marginTop: 12 },
});
