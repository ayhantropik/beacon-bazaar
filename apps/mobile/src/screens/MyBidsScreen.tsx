import React, { useEffect } from 'react';
import { View, FlatList, Image, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, Chip, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchMyBids } from '../store/slices/auctionSlice';
import type { RootStackScreenProps } from '../navigation/types';
import EmptyState from '../components/EmptyState';

type Props = RootStackScreenProps<'MyBids'>;

const PRIMARY = '#1a6b52';
const ACCENT = '#c0392b';
const WIN = '#27ae60';

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  active: { label: 'Aktif', color: '#3498db' },
  won: { label: 'Kazanıldı', color: WIN },
  lost: { label: 'Kaybedildi', color: '#95a5a6' },
  outbid: { label: 'Geçildi', color: ACCENT },
};

function isWinning(bidPrice: string, currentHighest: string | null) {
  const p = parseFloat(bidPrice);
  const c = parseFloat(currentHighest || '0');
  return p >= c;
}

function getCountdown(endsAt: string) {
  const diff = Math.max(0, new Date(endsAt).getTime() - Date.now());
  if (diff === 0) return 'Bitti';
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  if (h > 0) return `${h}s ${m}d kaldı`;
  return `${m}d kaldı`;
}

export default function MyBidsScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const { myBids, loading } = useAppSelector((s) => s.auction);

  useEffect(() => {
    dispatch(fetchMyBids(1));
  }, [dispatch]);

  if (loading && myBids.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  if (!loading && myBids.length === 0) {
    return (
      <EmptyState
        icon="gavel"
        title="Henüz teklif vermediniz"
        subtitle="Açık artırma sayfasından teklif vererek başlayın"
        actionLabel="Açık Artırmalara Git"
        onAction={() => navigation.replace('Auctions')}
      />
    );
  }

  return (
    <FlatList
      data={myBids}
      keyExtractor={(it) => it.id}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={() => dispatch(fetchMyBids(1))} />
      }
      renderItem={({ item }) => {
        const ai = item.auctionItem;
        const product = ai?.product || {};
        const winning = isWinning(item.bidPrice, ai?.currentHighestBid);
        const ended = ai?.endsAt && new Date(ai.endsAt).getTime() <= Date.now();
        const status = item.status as string;
        const tag = STATUS_LABEL[status] || { label: status, color: '#999' };
        return (
          <TouchableOpacity
            style={styles.card}
            onPress={() => ai && navigation.navigate('AuctionDetail', { auctionId: ai.id })}
            disabled={!ai}
          >
            <Image
              source={{
                uri:
                  product.thumbnail ||
                  `https://picsum.photos/seed/${product.slug || item.id}/200/200`,
              }}
              style={styles.image}
            />
            <View style={styles.info}>
              <Text variant="labelLarge" numberOfLines={2} style={styles.name}>
                {product.name || 'Ürün'}
              </Text>
              <View style={styles.tagRow}>
                <Chip
                  compact
                  style={[styles.tag, { backgroundColor: tag.color + '22' }]}
                  textStyle={[styles.tagText, { color: tag.color }]}
                >
                  {tag.label}
                </Chip>
                {!ended && (
                  <Chip
                    compact
                    style={[
                      styles.tag,
                      { backgroundColor: winning ? WIN + '22' : ACCENT + '22' },
                    ]}
                    textStyle={[
                      styles.tagText,
                      { color: winning ? WIN : ACCENT },
                    ]}
                  >
                    {winning ? 'Önde' : 'Geride'}
                  </Chip>
                )}
              </View>
              <View style={styles.row}>
                <Icon name="cash" size={14} color={PRIMARY} />
                <Text style={styles.bid}>
                  {parseFloat(item.bidPrice).toLocaleString('tr-TR')} ₺
                </Text>
                <Text style={styles.qty}>x{item.bidQuantity}</Text>
              </View>
              {ai && (
                <View style={styles.row}>
                  <Icon name="trophy-outline" size={14} color="#666" />
                  <Text style={styles.meta}>
                    En yüksek:{' '}
                    {parseFloat(ai.currentHighestBid || ai.startingPrice).toLocaleString('tr-TR')} ₺
                  </Text>
                </View>
              )}
              {ai && (
                <View style={styles.row}>
                  <Icon
                    name="clock-outline"
                    size={14}
                    color={ended ? '#999' : ACCENT}
                  />
                  <Text style={[styles.meta, { color: ended ? '#999' : ACCENT }]}>
                    {getCountdown(ai.endsAt)}
                  </Text>
                </View>
              )}
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
  image: { width: 110, height: 130 },
  info: { flex: 1, padding: 10 },
  name: { fontWeight: '600', marginBottom: 6 },
  tagRow: { flexDirection: 'row', gap: 6, marginBottom: 4 },
  tag: { alignSelf: 'flex-start' },
  tagText: { fontSize: 10, lineHeight: 14, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  bid: { fontSize: 14, fontWeight: '700', color: PRIMARY },
  qty: { fontSize: 12, color: '#666', marginLeft: 4 },
  meta: { fontSize: 12, color: '#666' },
});
