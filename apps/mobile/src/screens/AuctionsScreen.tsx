import React, { useEffect, useState } from 'react';
import { View, FlatList, Image, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, Chip, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchTodayAuctions } from '../store/slices/auctionSlice';
import type { RootStackScreenProps } from '../navigation/types';
import EmptyState from '../components/EmptyState';

type Props = RootStackScreenProps<'Auctions'>;

const PRIMARY = '#1a6b52';
const ACCENT = '#c0392b';

function getCountdown(endsAt: string) {
  const end = new Date(endsAt).getTime();
  const now = Date.now();
  const diff = Math.max(0, end - now);
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);
  if (diff === 0) return 'Sona erdi';
  if (h > 0) return `${h}s ${m}d`;
  return `${m}d ${s}s`;
}

export default function AuctionsScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const { todayItems, loading } = useAppSelector((s) => s.auction);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    dispatch(fetchTodayAuctions());
  }, [dispatch]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('MyBids')}
          style={{ paddingHorizontal: 8 }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name="bookmark-multiple-outline" size={22} color={PRIMARY} />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  if (loading && todayItems.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  if (!loading && todayItems.length === 0) {
    return (
      <EmptyState
        icon="gavel"
        title="Bugün açık artırma yok"
        subtitle="Yarın tekrar kontrol edin"
      />
    );
  }

  return (
    <FlatList
      data={todayItems}
      keyExtractor={(it) => it.id}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={() => dispatch(fetchTodayAuctions())} />
      }
      renderItem={({ item }) => {
        const current = parseFloat(item.currentHighestBid || item.startingPrice);
        const countdown = getCountdown(item.endsAt);
        return (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('AuctionDetail', { auctionId: item.id })}
          >
            <Image
              source={{
                uri: item.product.thumbnail || `https://picsum.photos/seed/${item.product.slug}/300/300`,
              }}
              style={styles.image}
            />
            <View style={styles.info}>
              <Text variant="labelLarge" numberOfLines={2} style={styles.name}>
                {item.product.name}
              </Text>
              <Chip compact style={styles.chip} textStyle={styles.chipText}>
                {item.category}
              </Chip>
              <View style={styles.row}>
                <Icon name="cash" size={14} color={PRIMARY} />
                <Text style={styles.price}>{current.toLocaleString('tr-TR')} ₺</Text>
              </View>
              <View style={styles.row}>
                <Icon name="account-multiple" size={14} color="#666" />
                <Text style={styles.meta}>{item.totalBids} teklif</Text>
              </View>
              <View style={styles.row}>
                <Icon name="clock-outline" size={14} color={ACCENT} />
                <Text style={[styles.meta, { color: ACCENT, fontWeight: '700' }]}>{countdown}</Text>
              </View>
            </View>
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 12 },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  image: { width: 110, height: 110 },
  info: { flex: 1, padding: 10 },
  name: { fontWeight: '600', marginBottom: 4 },
  chip: { alignSelf: 'flex-start', marginBottom: 4 },
  chipText: { fontSize: 10, lineHeight: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  price: { fontSize: 14, fontWeight: '700', color: PRIMARY },
  meta: { fontSize: 12, color: '#666' },
});
