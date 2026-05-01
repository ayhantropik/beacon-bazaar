import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Chip,
  HelperText,
} from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import type { RootStackScreenProps } from '../navigation/types';
import sellerService from '../services/api/seller.service';

type Props = RootStackScreenProps<'CreateProduct'>;

const PRIMARY = '#1a6b52';

const CATEGORIES = [
  'Elektronik', 'Kadın', 'Erkek', 'Ev & Mobilya', 'Süpermarket',
  'Kozmetik', 'Spor & Outdoor', 'Ayakkabı & Çanta', 'Hediyelik',
  'Oyuncak & Hobi', 'Kitap & Müzik', 'Yemek',
];

export default function CreateProductScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [stock, setStock] = useState('1');
  const [thumbnail, setThumbnail] = useState('');
  const [tags, setTags] = useState('');
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const toggleCat = (c: string) => {
    setSelectedCats((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    );
  };

  const validate = (): string | null => {
    if (!name.trim() || name.trim().length < 3) return 'Ürün adı en az 3 karakter olmalı';
    const p = parseFloat(price);
    if (!p || p <= 0) return 'Geçerli bir fiyat gir';
    if (salePrice) {
      const sp = parseFloat(salePrice);
      if (sp <= 0 || sp >= p) return 'İndirimli fiyat normal fiyattan küçük olmalı';
    }
    if (selectedCats.length === 0) return 'En az bir kategori seç';
    const s = parseInt(stock, 10);
    if (!Number.isFinite(s) || s < 0) return 'Stok 0 veya pozitif olmalı';
    return null;
  };

  const submit = async () => {
    const err = validate();
    if (err) {
      Alert.alert('Eksik bilgi', err);
      return;
    }
    setSubmitting(true);
    try {
      const payload: any = {
        name: name.trim(),
        description: description.trim() || undefined,
        price: parseFloat(price),
        salePrice: salePrice ? parseFloat(salePrice) : undefined,
        stockQuantity: parseInt(stock, 10),
        categories: selectedCats,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        thumbnail: thumbnail.trim() || undefined,
        currency: 'TRY',
      };
      await sellerService.createProduct(payload);
      Alert.alert('Eklendi', 'Ürün başarıyla eklendi', [
        { text: 'Tamam', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      const raw = e?.response?.data?.message;
      const msg = Array.isArray(raw) ? raw.join(', ') : (typeof raw === 'string' ? raw : '');
      Alert.alert('Hata', msg || 'Ürün eklenemedi');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.banner}>
          <Icon name="package-variant-plus" size={26} color={PRIMARY} />
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>Yeni Ürün</Text>
            <Text style={styles.bannerSub}>Fiyat ve stok bilgilerini doğru gir</Text>
          </View>
        </View>

        <Text style={styles.label}>Ürün Adı</Text>
        <TextInput
          mode="outlined"
          value={name}
          onChangeText={setName}
          placeholder="Örn. Doğal Zeytinyağı 1L"
          maxLength={120}
          style={styles.input}
        />

        <Text style={styles.label}>Açıklama (opsiyonel)</Text>
        <TextInput
          mode="outlined"
          value={description}
          onChangeText={setDescription}
          placeholder="Ürünü, özelliklerini, kullanımını açıkla"
          multiline
          numberOfLines={4}
          style={styles.input}
        />

        <View style={styles.row}>
          <View style={styles.flex}>
            <Text style={styles.label}>Fiyat (₺)</Text>
            <TextInput
              mode="outlined"
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
              left={<TextInput.Icon icon="cash" />}
              style={styles.input}
            />
          </View>
          <View style={styles.flex}>
            <Text style={styles.label}>İndirimli (opsiyonel)</Text>
            <TextInput
              mode="outlined"
              value={salePrice}
              onChangeText={setSalePrice}
              keyboardType="decimal-pad"
              left={<TextInput.Icon icon="tag" />}
              style={styles.input}
            />
          </View>
        </View>

        <Text style={styles.label}>Stok Adedi</Text>
        <TextInput
          mode="outlined"
          value={stock}
          onChangeText={setStock}
          keyboardType="numeric"
          left={<TextInput.Icon icon="warehouse" />}
          style={styles.input}
        />

        <Text style={styles.label}>Görsel URL (opsiyonel)</Text>
        <TextInput
          mode="outlined"
          value={thumbnail}
          onChangeText={setThumbnail}
          placeholder="https://..."
          autoCapitalize="none"
          style={styles.input}
        />
        <HelperText type="info" visible style={styles.helper}>
          Boş bırakırsan otomatik bir görsel atanır
        </HelperText>

        <Text style={styles.label}>Kategoriler</Text>
        <View style={styles.chipGrid}>
          {CATEGORIES.map((c) => (
            <Chip
              key={c}
              selected={selectedCats.includes(c)}
              onPress={() => toggleCat(c)}
              style={[
                styles.chip,
                selectedCats.includes(c) && styles.chipSelected,
              ]}
              textStyle={
                selectedCats.includes(c) ? styles.chipTextSelected : undefined
              }
            >
              {c}
            </Chip>
          ))}
        </View>

        <Text style={styles.label}>Etiketler (virgülle ayır)</Text>
        <TextInput
          mode="outlined"
          value={tags}
          onChangeText={setTags}
          placeholder="organik, doğal, bayan"
          style={styles.input}
        />

        <Button
          mode="contained"
          buttonColor={PRIMARY}
          onPress={submit}
          loading={submitting}
          disabled={submitting}
          icon="check"
          style={styles.submitBtn}
          contentStyle={{ paddingVertical: 4 }}
        >
          Ürünü Ekle
        </Button>

        <View style={{ height: 32 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  body: { padding: 16 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f0fdf4',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  bannerTitle: { fontSize: 15, fontWeight: '800', color: PRIMARY },
  bannerSub: { fontSize: 12, color: PRIMARY, marginTop: 2 },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#222',
    marginTop: 8,
    marginBottom: 6,
  },
  helper: { paddingLeft: 0, marginTop: -4 },
  input: { backgroundColor: '#fff', marginBottom: 4 },
  row: { flexDirection: 'row', gap: 8 },
  flex: { flex: 1 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb' },
  chipSelected: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  chipTextSelected: { color: '#fff', fontWeight: '700' },
  submitBtn: { borderRadius: 8, marginTop: 24 },
});
