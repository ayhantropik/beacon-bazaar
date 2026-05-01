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
import * as Location from 'expo-location';
import type { RootStackScreenProps } from '../navigation/types';
import sellerService from '../services/api/seller.service';

type Props = RootStackScreenProps<'CreateStore'>;

const PRIMARY = '#1a6b52';

const CATEGORIES = [
  'Elektronik', 'Moda', 'Ev & Mobilya', 'Süpermarket',
  'Kozmetik', 'Spor & Outdoor', 'Kitap & Kırtasiye',
  'Ayakkabı & Çanta', 'Yemek', 'Restoran', 'Cafe',
  'Hediyelik', 'Oyuncak & Hobi', 'Pet Shop',
];

export default function CreateStoreScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [street, setStreet] = useState('');
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gettingLoc, setGettingLoc] = useState(false);

  const toggleCat = (c: string) => {
    setSelectedCats((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    );
  };

  const useCurrentLocation = async () => {
    setGettingLoc(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('İzin gerekli', 'Konum izni reddedildi');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      // Reverse geocode (varsa)
      try {
        const places = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        if (places[0]) {
          if (places[0].city) setCity(places[0].city);
          if (places[0].district || places[0].subregion) {
            setDistrict(places[0].district || places[0].subregion!);
          }
          if (places[0].street) setStreet(places[0].street);
        }
      } catch {
        // ignore
      }
    } catch {
      Alert.alert('Hata', 'Konum alınamadı');
    } finally {
      setGettingLoc(false);
    }
  };

  const validate = (): string | null => {
    if (!name.trim() || name.trim().length < 3) {
      return 'Mağaza adı en az 3 karakter olmalı';
    }
    if (!description.trim() || description.trim().length < 10) {
      return 'Açıklama en az 10 karakter olmalı';
    }
    if (selectedCats.length === 0) {
      return 'En az bir kategori seç';
    }
    if (!city.trim() || !district.trim()) {
      return 'Şehir ve ilçe gerekli';
    }
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
        description: description.trim(),
        categories: selectedCats,
        address: {
          city: city.trim(),
          district: district.trim(),
          street: street.trim() || undefined,
        },
        contactInfo: {
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
        },
      };
      if (coords) {
        payload.latitude = coords.lat;
        payload.longitude = coords.lng;
      }
      await sellerService.createStore(payload);
      Alert.alert(
        'Mağaza Oluşturuldu',
        'Mağazan başarıyla oluşturuldu. Onay süreci tamamlandığında satış yapabilirsin.',
        [
          {
            text: 'Tamam',
            onPress: () => navigation.replace('SellerDashboard'),
          },
        ],
      );
    } catch (e: any) {
      const raw = e?.response?.data?.message;
      const msg = Array.isArray(raw) ? raw.join(', ') : (typeof raw === 'string' ? raw : '');
      Alert.alert('Hata', msg || 'Mağaza oluşturulamadı');
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
          <Icon name="storefront" size={28} color="#92400e" />
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>Mağaza Oluştur</Text>
            <Text style={styles.bannerSub}>
              Bilgileri doldur, mağazan dakikalar içinde aktif olsun
            </Text>
          </View>
        </View>

        <Text style={styles.label}>Mağaza Adı</Text>
        <TextInput
          mode="outlined"
          value={name}
          onChangeText={setName}
          placeholder="Örn. Yeni Lezzet Mağazası"
          maxLength={60}
          style={styles.input}
        />
        <HelperText type="info" visible style={styles.helper}>
          {name.length}/60 karakter
        </HelperText>

        <Text style={styles.label}>Açıklama</Text>
        <TextInput
          mode="outlined"
          value={description}
          onChangeText={setDescription}
          placeholder="Mağazanı, ürünlerini, vizyonunu birkaç cümleyle anlat"
          multiline
          numberOfLines={4}
          maxLength={500}
          style={styles.input}
        />
        <HelperText type="info" visible style={styles.helper}>
          {description.length}/500 karakter
        </HelperText>

        <Text style={styles.label}>Kategoriler</Text>
        <Text style={styles.muted}>Birden fazla seçebilirsin</Text>
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

        <Text style={styles.label}>Adres</Text>
        <View style={styles.row}>
          <TextInput
            mode="outlined"
            label="Şehir"
            value={city}
            onChangeText={setCity}
            style={[styles.input, styles.flex]}
          />
          <TextInput
            mode="outlined"
            label="İlçe"
            value={district}
            onChangeText={setDistrict}
            style={[styles.input, styles.flex]}
          />
        </View>
        <TextInput
          mode="outlined"
          label="Açık Adres (opsiyonel)"
          value={street}
          onChangeText={setStreet}
          multiline
          style={styles.input}
        />

        <Button
          mode="outlined"
          icon="map-marker"
          onPress={useCurrentLocation}
          loading={gettingLoc}
          textColor={PRIMARY}
          style={[styles.input, { borderColor: PRIMARY }]}
        >
          {coords ? '✓ Konum alındı' : 'Mevcut Konumu Kullan'}
        </Button>

        <Text style={styles.label}>İletişim</Text>
        <TextInput
          mode="outlined"
          label="Telefon (opsiyonel)"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          left={<TextInput.Icon icon="phone" />}
          style={styles.input}
        />
        <TextInput
          mode="outlined"
          label="E-posta (opsiyonel)"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          left={<TextInput.Icon icon="email" />}
          style={styles.input}
        />

        <Button
          mode="contained"
          buttonColor={PRIMARY}
          onPress={submit}
          loading={submitting}
          disabled={submitting}
          icon="storefront-plus"
          style={styles.submitBtn}
          contentStyle={{ paddingVertical: 4 }}
        >
          Mağazayı Oluştur
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
    backgroundColor: '#fff8e6',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  bannerTitle: { fontSize: 15, fontWeight: '800', color: '#92400e' },
  bannerSub: { fontSize: 12, color: '#92400e', marginTop: 2 },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#222',
    marginTop: 12,
    marginBottom: 6,
  },
  muted: { fontSize: 11, color: '#888', marginBottom: 8 },
  helper: { paddingLeft: 0, marginTop: -4, marginBottom: 4 },
  input: { backgroundColor: '#fff', marginBottom: 8 },
  row: { flexDirection: 'row', gap: 8 },
  flex: { flex: 1 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  chip: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb' },
  chipSelected: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  chipTextSelected: { color: '#fff', fontWeight: '700' },
  submitBtn: { borderRadius: 8, marginTop: 24 },
});
