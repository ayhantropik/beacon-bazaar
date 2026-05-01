import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Modal,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Text,
  Button,
  TextInput,
  Switch,
  ActivityIndicator,
  Card,
  IconButton,
  Chip,
} from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Contacts from 'expo-contacts';
import addressService, { type Address } from '../services/api/address.service';
import EmptyState from '../components/EmptyState';
import {
  autofillFromApple,
  autofillFromFacebook,
  autofillFromGoogle,
  type AutofillData,
} from '../services/auth/SocialAutofill';

const PRIMARY = '#1a6b52';

interface FormState {
  id?: string;
  title: string;
  fullName: string;
  phone: string;
  city: string;
  district: string;
  street: string;
  zipCode: string;
  isDefault: boolean;
}

const emptyForm: FormState = {
  title: '',
  fullName: '',
  phone: '',
  city: '',
  district: '',
  street: '',
  zipCode: '',
  isDefault: false,
};

export default function AddressesScreen() {
  const [items, setItems] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gettingLoc, setGettingLoc] = useState(false);
  const [contactsModalOpen, setContactsModalOpen] = useState(false);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactsList, setContactsList] = useState<Contacts.Contact[]>([]);
  const [contactSearch, setContactSearch] = useState('');

  const openContactsPicker = async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'İzin gerekli',
        'Rehberden seçim yapabilmek için kişiler izni gerekli',
      );
      return;
    }
    setContactsLoading(true);
    setContactsModalOpen(true);
    try {
      const { data } = await Contacts.getContactsAsync({
        fields: [
          Contacts.Fields.Name,
          Contacts.Fields.PhoneNumbers,
          Contacts.Fields.Addresses,
        ],
        sort: Contacts.SortTypes.FirstName,
      });
      setContactsList(data || []);
    } catch {
      Alert.alert('Hata', 'Rehber okunamadı');
      setContactsModalOpen(false);
    } finally {
      setContactsLoading(false);
    }
  };

  const applyAutofill = (data: AutofillData | null) => {
    if (!data) return;
    setForm((f) => ({
      ...f,
      fullName: data.fullName || f.fullName,
      phone: data.phone || f.phone,
      city: data.city || f.city,
      district: data.district || f.district,
      street: data.street || f.street,
      zipCode: data.zipCode || f.zipCode,
    }));
  };

  const pickContact = (c: Contacts.Contact) => {
    const name = (c.name || '').trim();
    const phone = c.phoneNumbers?.[0]?.number || '';
    const addr = c.addresses?.[0];
    setForm((f) => ({
      ...f,
      fullName: name || f.fullName,
      phone: phone || f.phone,
      city: addr?.city || addr?.region || f.city,
      district:
        addr?.subregion ||
        addr?.region ||
        f.district,
      street: addr?.street || f.street,
      zipCode: addr?.postalCode || f.zipCode,
    }));
    setContactsModalOpen(false);
    setContactSearch('');
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
      const places = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      if (places[0]) {
        setForm((f) => ({
          ...f,
          city: places[0].city || places[0].region || f.city,
          district:
            places[0].district || places[0].subregion || f.district,
          street: [places[0].street, places[0].name]
            .filter(Boolean)
            .join(' ')
            .trim() || f.street,
          zipCode: places[0].postalCode || f.zipCode,
        }));
      }
    } catch {
      Alert.alert('Hata', 'Konum alınamadı');
    } finally {
      setGettingLoc(false);
    }
  };

  const load = async () => {
    try {
      const res = await addressService.list();
      setItems(res.data?.data || []);
      setError(null);
    } catch (e: any) {
      setError(
        e.response?.data?.message || 'Adresler yüklenemedi (sunucu henüz hazır değil)',
      );
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (a: Address) => {
    setForm({
      id: a.id,
      title: a.title || '',
      fullName: a.fullName || '',
      phone: a.phone || '',
      city: a.city || '',
      district: a.district || '',
      street: a.street || '',
      zipCode: a.zipCode || '',
      isDefault: !!a.isDefault,
    });
    setModalOpen(true);
  };

  const validate = (): string | null => {
    if (!form.title.trim()) return 'Başlık gerekli (Ev, İş vs.)';
    if (!form.fullName.trim()) return 'Ad Soyad gerekli';
    if (!form.phone.trim()) return 'Telefon gerekli';
    if (!form.city.trim()) return 'Şehir gerekli';
    if (!form.district.trim()) return 'İlçe gerekli';
    if (!form.street.trim()) return 'Adres gerekli';
    return null;
  };

  const onSubmit = async () => {
    const err = validate();
    if (err) {
      Alert.alert('Eksik bilgi', err);
      return;
    }
    setSubmitting(true);
    try {
      if (form.id) {
        await addressService.update(form.id, form);
      } else {
        await addressService.create(form);
      }
      setModalOpen(false);
      setForm(emptyForm);
      await load();
    } catch (e: any) {
      Alert.alert('Hata', e.response?.data?.message || 'Adres kaydedilemedi');
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = (a: Address) => {
    Alert.alert(
      'Adresi sil',
      `"${a.title}" adresi silinsin mi?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await addressService.remove(a.id);
              await load();
            } catch (e: any) {
              Alert.alert('Hata', e.response?.data?.message || 'Silinemedi');
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error && (
        <View style={styles.errorBanner}>
          <Icon name="alert-circle" size={14} color="#92400e" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {items.length === 0 ? (
        <EmptyState
          icon="map-marker-plus"
          title="Henüz adresin yok"
          subtitle="Hızlı sipariş için adres ekle"
          actionLabel="Adres Ekle"
          onAction={openNew}
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => it.id}
          contentContainerStyle={styles.list}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load();
          }}
          renderItem={({ item }) => (
            <Card style={styles.card} onPress={() => openEdit(item)}>
              <View style={styles.cardHead}>
                <View style={styles.cardTitleRow}>
                  <Icon name="map-marker" size={18} color={PRIMARY} />
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  {item.isDefault && (
                    <Chip compact style={styles.defaultChip} textStyle={styles.defaultChipText}>
                      Varsayılan
                    </Chip>
                  )}
                </View>
                <View style={styles.cardActions}>
                  <IconButton icon="pencil" size={18} onPress={() => openEdit(item)} />
                  <IconButton icon="trash-can-outline" size={18} iconColor="#dc2626" onPress={() => onDelete(item)} />
                </View>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.name}>{item.fullName}</Text>
                <Text style={styles.line}>{item.phone}</Text>
                <Text style={styles.line}>{item.street}</Text>
                <Text style={styles.line}>
                  {item.district} / {item.city}
                  {item.zipCode ? ` · ${item.zipCode}` : ''}
                </Text>
              </View>
            </Card>
          )}
        />
      )}

      {items.length > 0 && (
        <View style={styles.fabRow}>
          <Button
            mode="contained"
            buttonColor={PRIMARY}
            icon="plus"
            onPress={openNew}
            style={styles.fabBtn}
          >
            Yeni Adres
          </Button>
        </View>
      )}

      {/* Form Modal */}
      <Modal
        visible={modalOpen}
        animationType="slide"
        onRequestClose={() => setModalOpen(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalRoot}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {form.id ? 'Adresi Düzenle' : 'Yeni Adres'}
            </Text>
            <TouchableOpacity onPress={() => setModalOpen(false)}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.formBody}>
            <Text style={styles.quickFillLabel}>Otomatik doldur:</Text>
            <View style={styles.quickFillRow}>
              <Button
                mode="outlined"
                icon="map-marker"
                onPress={useCurrentLocation}
                loading={gettingLoc}
                disabled={gettingLoc}
                textColor={PRIMARY}
                style={[styles.flex, { borderColor: PRIMARY }]}
                compact
              >
                Konumum
              </Button>
              <Button
                mode="outlined"
                icon="account-arrow-down"
                onPress={openContactsPicker}
                textColor="#2563eb"
                style={[styles.flex, { borderColor: '#2563eb' }]}
                compact
              >
                Rehber
              </Button>
            </View>

            <View style={styles.socialRow}>
              <TouchableOpacity
                style={[styles.socialBtn, { backgroundColor: '#000' }]}
                onPress={async () => applyAutofill(await autofillFromApple())}
              >
                <Icon name="apple" size={18} color="#fff" />
                <Text style={[styles.socialBtnText, { color: '#fff' }]}>Apple</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.socialBtn, { backgroundColor: '#fff' }]}
                onPress={async () => applyAutofill(await autofillFromGoogle())}
              >
                <Icon name="google" size={18} color="#ea4335" />
                <Text style={[styles.socialBtnText, { color: '#222' }]}>Google</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.socialBtn, { backgroundColor: '#1877f2', borderColor: '#1877f2' }]}
                onPress={async () => applyAutofill(await autofillFromFacebook())}
              >
                <Icon name="facebook" size={18} color="#fff" />
                <Text style={[styles.socialBtnText, { color: '#fff' }]}>Facebook</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              label="Başlık (Ev, İş vs.)"
              mode="outlined"
              value={form.title}
              onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
              style={styles.input}
              autoCapitalize="sentences"
            />
            <TextInput
              label="Ad Soyad"
              mode="outlined"
              value={form.fullName}
              onChangeText={(v) => setForm((f) => ({ ...f, fullName: v }))}
              style={styles.input}
              autoCapitalize="words"
              textContentType="name"
              autoComplete="name"
              importantForAutofill="yes"
            />
            <TextInput
              label="Telefon"
              mode="outlined"
              keyboardType="phone-pad"
              value={form.phone}
              onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))}
              style={styles.input}
              textContentType="telephoneNumber"
              autoComplete="tel"
              importantForAutofill="yes"
            />
            <View style={styles.row2}>
              <TextInput
                label="Şehir"
                mode="outlined"
                value={form.city}
                onChangeText={(v) => setForm((f) => ({ ...f, city: v }))}
                style={[styles.input, styles.flex]}
                autoCapitalize="words"
                textContentType="addressCity"
                autoComplete="postal-address-locality"
                importantForAutofill="yes"
              />
              <TextInput
                label="İlçe"
                mode="outlined"
                value={form.district}
                onChangeText={(v) => setForm((f) => ({ ...f, district: v }))}
                style={[styles.input, styles.flex]}
                autoCapitalize="words"
                textContentType="sublocality"
                autoComplete="postal-address-region"
                importantForAutofill="yes"
              />
            </View>
            <TextInput
              label="Adres (sokak, mahalle, no)"
              mode="outlined"
              multiline
              numberOfLines={3}
              value={form.street}
              onChangeText={(v) => setForm((f) => ({ ...f, street: v }))}
              style={styles.input}
              textContentType="fullStreetAddress"
              autoComplete="street-address"
              importantForAutofill="yes"
            />
            <TextInput
              label="Posta Kodu (opsiyonel)"
              mode="outlined"
              keyboardType="numeric"
              value={form.zipCode}
              onChangeText={(v) => setForm((f) => ({ ...f, zipCode: v }))}
              style={styles.input}
              textContentType="postalCode"
              autoComplete="postal-code"
              importantForAutofill="yes"
            />
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Varsayılan adres olsun</Text>
              <Switch
                value={form.isDefault}
                onValueChange={(v) => setForm((f) => ({ ...f, isDefault: v }))}
                color={PRIMARY}
              />
            </View>

            <Button
              mode="contained"
              buttonColor={PRIMARY}
              loading={submitting}
              disabled={submitting}
              onPress={onSubmit}
              style={styles.submitBtn}
            >
              {form.id ? 'Güncelle' : 'Kaydet'}
            </Button>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Contacts Picker Modal */}
      <Modal
        visible={contactsModalOpen}
        animationType="slide"
        onRequestClose={() => setContactsModalOpen(false)}
      >
        <View style={styles.contactsModalRoot}>
          <View style={styles.contactsHeader}>
            <Text style={styles.contactsTitle}>Rehberden Seç</Text>
            <TouchableOpacity onPress={() => setContactsModalOpen(false)}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          <TextInput
            mode="outlined"
            placeholder="Ara..."
            value={contactSearch}
            onChangeText={setContactSearch}
            style={styles.contactsSearch}
            left={<TextInput.Icon icon="magnify" />}
          />
          {contactsLoading ? (
            <View style={{ padding: 32, alignItems: 'center' }}>
              <ActivityIndicator color={PRIMARY} />
            </View>
          ) : (
            <FlatList
              data={contactsList.filter((c) =>
                contactSearch
                  ? (c.name || '')
                      .toLowerCase()
                      .includes(contactSearch.toLowerCase())
                  : true,
              )}
              keyExtractor={(c) => c.id || Math.random().toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.contactRow}
                  onPress={() => pickContact(item)}
                >
                  <View style={styles.contactAvatar}>
                    <Text style={styles.contactAvatarText}>
                      {(item.name || '?').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contactName}>{item.name || 'İsimsiz'}</Text>
                    <Text style={styles.contactSub} numberOfLines={1}>
                      {item.phoneNumbers?.[0]?.number ||
                        item.addresses?.[0]?.city ||
                        '—'}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={{ textAlign: 'center', padding: 24, color: '#999' }}>
                  Kişi bulunamadı
                </Text>
              }
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorBanner: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fef3c7',
    margin: 12,
    borderRadius: 8,
  },
  errorText: { fontSize: 12, color: '#92400e', flex: 1 },
  list: { padding: 12, paddingBottom: 80 },
  card: { marginBottom: 12, backgroundColor: '#fff' },
  cardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#222' },
  defaultChip: { backgroundColor: '#dcfce7', height: 24 },
  defaultChipText: { fontSize: 10, color: '#16a34a', fontWeight: '700', lineHeight: 14 },
  cardActions: { flexDirection: 'row' },
  cardBody: { paddingHorizontal: 12, paddingBottom: 12 },
  name: { fontSize: 13, color: '#222', fontWeight: '600', marginBottom: 4 },
  line: { fontSize: 12, color: '#666', lineHeight: 18 },
  fabRow: { padding: 12, borderTopWidth: 1, borderTopColor: '#eee', backgroundColor: '#fff' },
  fabBtn: { borderRadius: 8 },
  modalRoot: { flex: 1, backgroundColor: '#fff' },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 48,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#222' },
  formBody: { padding: 16 },
  input: { backgroundColor: '#fff', marginBottom: 12 },
  row2: { flexDirection: 'row', gap: 8 },
  flex: { flex: 1 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginBottom: 12,
  },
  switchLabel: { fontSize: 14, color: '#222' },
  submitBtn: { borderRadius: 8, paddingVertical: 4, marginTop: 8 },
  locButton: { borderRadius: 8, marginBottom: 16 },
  quickFillLabel: { fontSize: 11, color: '#888', fontWeight: '700', marginBottom: 6 },
  quickFillRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  socialRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  socialBtnText: { fontSize: 11, fontWeight: '700' },
  contactsModalRoot: { flex: 1, backgroundColor: '#fff' },
  contactsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 48,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  contactsTitle: { fontSize: 16, fontWeight: '700', color: '#222' },
  contactsSearch: { margin: 12, backgroundColor: '#fff' },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactAvatarText: { color: '#fff', fontWeight: '800' },
  contactName: { fontSize: 14, fontWeight: '700', color: '#222' },
  contactSub: { fontSize: 11, color: '#888', marginTop: 2 },
});
