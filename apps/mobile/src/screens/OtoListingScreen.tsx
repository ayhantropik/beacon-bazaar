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

type Props = RootStackScreenProps<'OtoListing'>;

interface CarListing {
  id: string;
  title: string;
  brand: string;
  year: number;
  km: number;
  fuel: string;
  gear: string;
  bodyType: string;
  price: number;
  city: string;
  district: string;
  thumbnail: string;
  isNew: boolean;
  seller: { name: string; verified: boolean };
}

const ACCENT = '#2563eb';

const CARS: CarListing[] = [
  { id: '1', title: 'BMW 320i M Sport', brand: 'BMW', year: 2023, km: 12000, fuel: 'Benzin', gear: 'Otomatik', bodyType: 'Sedan', price: 2850000, city: 'İstanbul', district: 'Kadıköy', thumbnail: 'https://picsum.photos/seed/bmw320i/600/400', isNew: false, seller: { name: 'Premium Auto', verified: true } },
  { id: '2', title: 'Mercedes C200 AMG', brand: 'Mercedes', year: 2022, km: 28000, fuel: 'Benzin', gear: 'Otomatik', bodyType: 'Sedan', price: 3200000, city: 'İstanbul', district: 'Beşiktaş', thumbnail: 'https://picsum.photos/seed/mercc200/600/400', isNew: false, seller: { name: 'Star Motors', verified: true } },
  { id: '3', title: 'Volkswagen Golf 1.5 TSI', brand: 'Volkswagen', year: 2024, km: 5000, fuel: 'Benzin', gear: 'Otomatik', bodyType: 'Hatchback', price: 1450000, city: 'Ankara', district: 'Çankaya', thumbnail: 'https://picsum.photos/seed/vwgolf/600/400', isNew: true, seller: { name: 'Ahmet Y.', verified: false } },
  { id: '4', title: 'Toyota Corolla 1.8 Hybrid', brand: 'Toyota', year: 2023, km: 15000, fuel: 'Hybrid', gear: 'Otomatik', bodyType: 'Sedan', price: 1380000, city: 'İzmir', district: 'Bornova', thumbnail: 'https://picsum.photos/seed/corolla/600/400', isNew: false, seller: { name: 'İzmir Toyota', verified: true } },
  { id: '5', title: 'Audi A4 2.0 TDI Quattro', brand: 'Audi', year: 2021, km: 45000, fuel: 'Dizel', gear: 'Otomatik', bodyType: 'Sedan', price: 2100000, city: 'İstanbul', district: 'Bakırköy', thumbnail: 'https://picsum.photos/seed/audia4/600/400', isNew: false, seller: { name: 'Prestige Auto', verified: true } },
  { id: '6', title: 'Tesla Model 3 Long Range', brand: 'Tesla', year: 2024, km: 3000, fuel: 'Elektrik', gear: 'Otomatik', bodyType: 'Sedan', price: 2450000, city: 'İstanbul', district: 'Sarıyer', thumbnail: 'https://picsum.photos/seed/tesla3/600/400', isNew: true, seller: { name: 'Murat K.', verified: false } },
  { id: '7', title: 'Hyundai Tucson Elite', brand: 'Hyundai', year: 2023, km: 18000, fuel: 'Dizel', gear: 'Otomatik', bodyType: 'SUV', price: 1750000, city: 'Antalya', district: 'Muratpaşa', thumbnail: 'https://picsum.photos/seed/tucson/600/400', isNew: false, seller: { name: 'Antalya Hyundai', verified: true } },
  { id: '8', title: 'Volvo XC60 T8 Inscription', brand: 'Volvo', year: 2022, km: 25000, fuel: 'Hybrid', gear: 'Otomatik', bodyType: 'SUV', price: 3500000, city: 'İstanbul', district: 'Ataşehir', thumbnail: 'https://picsum.photos/seed/xc60/600/400', isNew: false, seller: { name: 'Volvo Premium', verified: true } },
  { id: '9', title: 'Renault Clio 1.0 TCe', brand: 'Renault', year: 2024, km: 8000, fuel: 'Benzin & LPG', gear: 'Manuel', bodyType: 'Hatchback', price: 720000, city: 'Konya', district: 'Selçuklu', thumbnail: 'https://picsum.photos/seed/clio/600/400', isNew: true, seller: { name: 'Fatma A.', verified: false } },
  { id: '10', title: 'Kia Sportage GT-Line', brand: 'Kia', year: 2024, km: 6000, fuel: 'Benzin', gear: 'Otomatik', bodyType: 'SUV', price: 1900000, city: 'İstanbul', district: 'Pendik', thumbnail: 'https://picsum.photos/seed/sportage/600/400', isNew: true, seller: { name: 'KIA Plaza', verified: true } },
];

const TABS = [
  { key: 'all', label: 'Tümü' },
  { key: 'new', label: 'Sıfır' },
  { key: 'used', label: 'İkinci El' },
];

const FUEL_FILTERS = ['Tümü', 'Benzin', 'Dizel', 'Hybrid', 'Elektrik'];

export default function OtoListingScreen({ navigation }: Props) {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<string>('all');
  const [fuel, setFuel] = useState<string>('Tümü');

  const filtered = useMemo(() => {
    return CARS.filter((c) => {
      if (tab === 'new' && !c.isNew) return false;
      if (tab === 'used' && c.isNew) return false;
      if (fuel !== 'Tümü' && c.fuel !== fuel) return false;
      const q = search.trim().toLowerCase();
      if (q && !c.title.toLowerCase().includes(q) && !c.brand.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [tab, fuel, search]);

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Marka, model ara..."
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
        {FUEL_FILTERS.map((f) => (
          <Chip
            key={f}
            mode={fuel === f ? 'flat' : 'outlined'}
            selected={fuel === f}
            onPress={() => setFuel(f)}
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
            <View style={styles.body}>
              <View style={styles.headerRow}>
                <Text numberOfLines={1} style={styles.title}>
                  {item.title}
                </Text>
                {item.isNew && (
                  <View style={styles.newBadge}>
                    <Text style={styles.newText}>SIFIR</Text>
                  </View>
                )}
              </View>
              <View style={styles.specsRow}>
                <View style={styles.specItem}>
                  <Icon name="calendar" size={11} color="#666" />
                  <Text style={styles.specText}>{item.year}</Text>
                </View>
                <View style={styles.specItem}>
                  <Icon name="speedometer" size={11} color="#666" />
                  <Text style={styles.specText}>{item.km.toLocaleString('tr-TR')} km</Text>
                </View>
                <View style={styles.specItem}>
                  <Icon name="gas-station" size={11} color="#666" />
                  <Text style={styles.specText}>{item.fuel}</Text>
                </View>
                <View style={styles.specItem}>
                  <Icon name="car-shift-pattern" size={11} color="#666" />
                  <Text style={styles.specText}>{item.gear}</Text>
                </View>
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
                </Text>
              </View>
              <View style={styles.sellerRow}>
                <Icon
                  name={item.seller.verified ? 'check-decagram' : 'account'}
                  size={11}
                  color={item.seller.verified ? ACCENT : '#999'}
                />
                <Text style={styles.sellerText}>{item.seller.name}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="car-off" size={48} color="#ccc" />
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
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  image: { width: '100%', height: 180 },
  body: { padding: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  title: { flex: 1, fontSize: 15, fontWeight: '700', color: '#222' },
  newBadge: { backgroundColor: '#dcfce7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  newText: { fontSize: 9, fontWeight: '800', color: '#16a34a' },
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
  price: { fontSize: 17, fontWeight: '800', color: ACCENT },
  sellerRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sellerText: { fontSize: 11, color: '#666' },
  empty: { alignItems: 'center', padding: 48 },
  emptyText: { color: '#999', marginTop: 12 },
});
