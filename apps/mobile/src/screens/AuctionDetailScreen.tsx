import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, TextInput, ActivityIndicator, Chip, Divider } from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchAuctionById, placeBid, clearSelected } from '../store/slices/auctionSlice';
import type { RootStackScreenProps } from '../navigation/types';

type Props = RootStackScreenProps<'AuctionDetail'>;

const PRIMARY = '#1a6b52';
const ACCENT = '#c0392b';

function getCountdown(endsAt: string) {
  const end = new Date(endsAt).getTime();
  const now = Date.now();
  const diff = Math.max(0, end - now);
  if (diff === 0) return 'Sona erdi';
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function AuctionDetailScreen({ route, navigation }: Props) {
  const { auctionId } = route.params;
  const dispatch = useAppDispatch();
  const { selected } = useAppSelector((s) => s.auction);
  const [bidPrice, setBidPrice] = useState('');
  const [bidQty, setBidQty] = useState('1');
  const [submitting, setSubmitting] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    dispatch(fetchAuctionById(auctionId));
    return () => {
      dispatch(clearSelected());
    };
  }, [auctionId, dispatch]);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  if (!selected) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  const current = parseFloat(selected.currentHighestBid || selected.startingPrice);
  const minBid = current + 1;
  const countdown = getCountdown(selected.endsAt);
  const ended = new Date(selected.endsAt).getTime() <= Date.now();

  const onSubmit = async () => {
    const price = parseFloat(bidPrice);
    const qty = parseInt(bidQty, 10);
    if (!price || price < minBid) {
      Alert.alert('Geçersiz teklif', `En az ${minBid.toLocaleString('tr-TR')} ₺ teklif vermelisiniz.`);
      return;
    }
    if (!qty || qty < 1 || qty > selected.quantity) {
      Alert.alert('Geçersiz miktar', `1 ile ${selected.quantity} arasında miktar girin.`);
      return;
    }
    setSubmitting(true);
    const result = await dispatch(
      placeBid({ auctionItemId: selected.id, bidPrice: price, bidQuantity: qty }),
    );
    setSubmitting(false);
    if (placeBid.fulfilled.match(result)) {
      Alert.alert('Başarılı', 'Teklifiniz alındı.');
      setBidPrice('');
      dispatch(fetchAuctionById(auctionId));
    } else {
      Alert.alert('Hata', (result.payload as string) || 'Teklif gönderilemedi.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Image
        source={{
          uri: selected.product.thumbnail || `https://picsum.photos/seed/${selected.product.slug}/600/400`,
        }}
        style={styles.cover}
      />

      <View style={styles.body}>
        <Chip compact style={styles.cat} textStyle={styles.catText}>
          {selected.category}
        </Chip>

        <Text variant="headlineSmall" style={styles.name}>
          {selected.product.name}
        </Text>

        <View style={styles.countdownBox}>
          <Icon name="clock-outline" size={20} color={ACCENT} />
          <Text style={styles.countdown}>{countdown}</Text>
          <Text style={styles.countdownLabel}>kaldı</Text>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.statRow}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Başlangıç</Text>
            <Text style={styles.statValue}>
              {parseFloat(selected.startingPrice).toLocaleString('tr-TR')} ₺
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>En yüksek</Text>
            <Text style={[styles.statValue, { color: PRIMARY }]}>
              {current.toLocaleString('tr-TR')} ₺
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Teklif</Text>
            <Text style={styles.statValue}>{selected.totalBids}</Text>
          </View>
        </View>

        <Divider style={styles.divider} />

        <Text variant="titleMedium" style={styles.section}>
          Teklif Ver
        </Text>
        <Text style={styles.hint}>
          Minimum: {minBid.toLocaleString('tr-TR')} ₺ • Stok: {selected.quantity}
        </Text>

        <TextInput
          mode="outlined"
          label="Teklif tutarı (₺)"
          value={bidPrice}
          onChangeText={setBidPrice}
          keyboardType="numeric"
          disabled={ended}
          style={styles.input}
        />
        <TextInput
          mode="outlined"
          label="Miktar"
          value={bidQty}
          onChangeText={setBidQty}
          keyboardType="numeric"
          disabled={ended}
          style={styles.input}
        />

        <Button
          mode="contained"
          onPress={onSubmit}
          loading={submitting}
          disabled={ended || submitting}
          buttonColor={PRIMARY}
          style={styles.submit}
        >
          {ended ? 'Açık Artırma Bitti' : 'Teklif Ver'}
        </Button>

        <Divider style={styles.divider} />

        <Text variant="titleMedium" style={styles.section}>
          Açıklama
        </Text>
        <Text style={styles.desc}>
          {selected.product.description || 'Açıklama bulunmuyor.'}
        </Text>

        <Button
          mode="text"
          onPress={() => navigation.navigate('ProductDetail', { productId: selected.product.slug })}
          style={{ marginTop: 8 }}
        >
          Ürün Detayını Görüntüle
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  cover: { width: '100%', height: 280 },
  body: { padding: 16 },
  cat: { alignSelf: 'flex-start', marginBottom: 8 },
  catText: { fontSize: 11 },
  name: { fontWeight: '700', marginBottom: 12 },
  countdownBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff5f3',
    padding: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  countdown: { fontSize: 22, fontWeight: '800', color: ACCENT },
  countdownLabel: { fontSize: 12, color: ACCENT, marginLeft: 4 },
  divider: { marginVertical: 16 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 11, color: '#999', marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: '700', color: '#333' },
  section: { fontWeight: '700', marginBottom: 8 },
  hint: { fontSize: 12, color: '#666', marginBottom: 12 },
  input: { marginBottom: 12, backgroundColor: '#fff' },
  submit: { paddingVertical: 4, marginTop: 4 },
  desc: { fontSize: 14, color: '#444', lineHeight: 20 },
});
