import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Linking,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Switch,
  Avatar,
  ActivityIndicator,
  Divider,
} from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import type { RootStackScreenProps } from '../navigation/types';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logout } from '../store/slices/authSlice';
import apiClient from '../services/api/client';

type Props = RootStackScreenProps<'Settings'>;

const PRIMARY = '#1a6b52';
const ACCENT = '#dc2626';

const PREF_KEY = '@user_prefs_v1';

interface Prefs {
  pushEnabled: boolean;
  marketingEmail: boolean;
  orderNotifications: boolean;
  messageNotifications: boolean;
}

const DEFAULT_PREFS: Prefs = {
  pushEnabled: true,
  marketingEmail: false,
  orderNotifications: true,
  messageNotifications: true,
};

export default function SettingsScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);

  const [name, setName] = useState(user?.name || '');
  const [surname, setSurname] = useState(user?.surname || '');
  const [phone, setPhone] = useState(user?.phone || '');

  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [savingProfile, setSavingProfile] = useState(false);

  // Şifre değiştirme
  const [pwOldVisible, setPwOldVisible] = useState(false);
  const [pwNewVisible, setPwNewVisible] = useState(false);
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [newPw2, setNewPw2] = useState('');
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(PREF_KEY).then((raw) => {
      if (!mounted) return;
      if (raw) {
        try {
          setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(raw) });
        } catch {
          // ignore
        }
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const persistPrefs = async (next: Prefs) => {
    setPrefs(next);
    try {
      await AsyncStorage.setItem(PREF_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const togglePush = async (v: boolean) => {
    if (v) {
      const { granted } = await Notifications.requestPermissionsAsync();
      if (!granted) {
        Alert.alert(
          'Bildirim İzni',
          'Bildirim izni verilmedi. Sistem ayarlarından açmanız gerekir.',
          [
            { text: 'Vazgeç' },
            { text: 'Ayarları Aç', onPress: () => Linking.openSettings() },
          ],
        );
        return;
      }
    }
    persistPrefs({ ...prefs, pushEnabled: v });
  };

  const saveProfile = async () => {
    if (!name.trim() || !surname.trim()) {
      Alert.alert('Eksik bilgi', 'Ad ve soyad gerekli');
      return;
    }
    setSavingProfile(true);
    try {
      await apiClient.put('/auth/profile', {
        name: name.trim(),
        surname: surname.trim(),
        phone: phone.trim() || undefined,
      });
      Alert.alert('Başarılı', 'Profilin güncellendi');
    } catch (e: any) {
      const raw = e?.response?.data?.message;
      Alert.alert(
        'Hata',
        Array.isArray(raw) ? raw.join(', ') : raw || 'Profil güncellenemedi',
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async () => {
    if (newPw.length < 6) {
      Alert.alert('Geçersiz', 'Yeni şifre en az 6 karakter olmalı');
      return;
    }
    if (newPw !== newPw2) {
      Alert.alert('Eşleşmiyor', 'Yeni şifre ile tekrarı eşleşmiyor');
      return;
    }
    setSavingPw(true);
    try {
      await apiClient.put('/auth/change-password', {
        currentPassword: oldPw,
        newPassword: newPw,
      });
      setOldPw('');
      setNewPw('');
      setNewPw2('');
      Alert.alert('Başarılı', 'Şifren güncellendi');
    } catch (e: any) {
      const raw = e?.response?.data?.message;
      Alert.alert(
        'Hata',
        Array.isArray(raw) ? raw.join(', ') : raw || 'Şifre değiştirilemedi',
      );
    } finally {
      setSavingPw(false);
    }
  };

  const confirmLogout = () => {
    Alert.alert('Çıkış Yap', 'Hesabından çıkış yapmak istediğine emin misin?', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Çıkış', style: 'destructive', onPress: () => dispatch(logout()) },
    ]);
  };

  const confirmDelete = () => {
    Alert.alert(
      'Hesabı Sil',
      'Hesabın ve tüm verilerin kalıcı olarak silinecek. Bu işlem geri alınamaz!',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () =>
            Alert.alert(
              'Bilgi',
              'Hesap silme talebi için lütfen destek@venividicoop.com adresine yaz.',
            ),
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profil bölümü */}
      <Section title="Profil" icon="account">
        <View style={styles.avatarRow}>
          <Avatar.Text
            size={64}
            label={`${name?.[0] || ''}${surname?.[0] || ''}`.toUpperCase()}
            style={{ backgroundColor: PRIMARY }}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.email}>{user?.email}</Text>
            <Text style={styles.role}>{user?.role === 'admin' ? 'Yönetici' : 'Üye'}</Text>
          </View>
        </View>
        <TextInput
          mode="outlined"
          label="Ad"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />
        <TextInput
          mode="outlined"
          label="Soyad"
          value={surname}
          onChangeText={setSurname}
          style={styles.input}
        />
        <TextInput
          mode="outlined"
          label="Telefon"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          style={styles.input}
        />
        <Button
          mode="contained"
          buttonColor={PRIMARY}
          loading={savingProfile}
          disabled={savingProfile}
          onPress={saveProfile}
          icon="content-save"
          style={styles.btn}
        >
          Profili Güncelle
        </Button>
      </Section>

      {/* Şifre */}
      <Section title="Şifre" icon="lock">
        <TextInput
          mode="outlined"
          label="Mevcut Şifre"
          value={oldPw}
          onChangeText={setOldPw}
          secureTextEntry={!pwOldVisible}
          right={
            <TextInput.Icon
              icon={pwOldVisible ? 'eye-off' : 'eye'}
              onPress={() => setPwOldVisible(!pwOldVisible)}
            />
          }
          style={styles.input}
        />
        <TextInput
          mode="outlined"
          label="Yeni Şifre"
          value={newPw}
          onChangeText={setNewPw}
          secureTextEntry={!pwNewVisible}
          right={
            <TextInput.Icon
              icon={pwNewVisible ? 'eye-off' : 'eye'}
              onPress={() => setPwNewVisible(!pwNewVisible)}
            />
          }
          style={styles.input}
        />
        <TextInput
          mode="outlined"
          label="Yeni Şifre (Tekrar)"
          value={newPw2}
          onChangeText={setNewPw2}
          secureTextEntry={!pwNewVisible}
          style={styles.input}
        />
        <Button
          mode="contained"
          buttonColor={PRIMARY}
          loading={savingPw}
          disabled={savingPw || !oldPw || !newPw || !newPw2}
          onPress={changePassword}
          icon="lock-reset"
          style={styles.btn}
        >
          Şifreyi Değiştir
        </Button>
      </Section>

      {/* Bildirim Tercihleri */}
      <Section title="Bildirim Tercihleri" icon="bell">
        <PrefRow
          title="Push Bildirimleri"
          subtitle="Telefonuna anlık bildirim gelir"
          value={prefs.pushEnabled}
          onChange={togglePush}
          icon="cellphone-message"
        />
        <Divider />
        <PrefRow
          title="Sipariş Bildirimleri"
          subtitle="Sipariş durum değişiklikleri"
          value={prefs.orderNotifications}
          onChange={(v) => persistPrefs({ ...prefs, orderNotifications: v })}
          icon="package-variant"
        />
        <Divider />
        <PrefRow
          title="Mesaj Bildirimleri"
          subtitle="Yeni mesaj geldiğinde"
          value={prefs.messageNotifications}
          onChange={(v) => persistPrefs({ ...prefs, messageNotifications: v })}
          icon="message-text"
        />
        <Divider />
        <PrefRow
          title="Pazarlama E-postaları"
          subtitle="İndirim, kampanya bildirimleri"
          value={prefs.marketingEmail}
          onChange={(v) => persistPrefs({ ...prefs, marketingEmail: v })}
          icon="email-outline"
        />
      </Section>

      {/* Hakkında */}
      <Section title="Uygulama" icon="information">
        <InfoRow icon="cellphone" label="Versiyon" value="1.0.0" />
        <Divider />
        <ActionRow
          icon="shield-account"
          label="Gizlilik Politikası"
          onPress={() =>
            Linking.openURL('https://venividicoop.com/privacy').catch(() => null)
          }
        />
        <Divider />
        <ActionRow
          icon="file-document-outline"
          label="Kullanım Şartları"
          onPress={() =>
            Linking.openURL('https://venividicoop.com/terms').catch(() => null)
          }
        />
        <Divider />
        <ActionRow
          icon="help-circle"
          label="Destek"
          onPress={() =>
            Linking.openURL('mailto:destek@venividicoop.com').catch(() => null)
          }
        />
      </Section>

      {/* Hesap Aksiyonları */}
      <View style={styles.dangerZone}>
        <Button
          mode="outlined"
          textColor={ACCENT}
          icon="logout"
          onPress={confirmLogout}
          style={[styles.btn, { borderColor: ACCENT }]}
        >
          Çıkış Yap
        </Button>
        <Button
          mode="text"
          textColor="#999"
          onPress={confirmDelete}
          style={{ marginTop: 8 }}
        >
          Hesabımı Sil
        </Button>
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Icon name={icon as any} size={18} color={PRIMARY} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function PrefRow({
  title,
  subtitle,
  value,
  onChange,
  icon,
}: {
  title: string;
  subtitle: string;
  value: boolean;
  onChange: (v: boolean) => void;
  icon: string;
}) {
  return (
    <View style={styles.prefRow}>
      <View style={styles.prefIcon}>
        <Icon name={icon as any} size={18} color="#666" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.prefTitle}>{title}</Text>
        <Text style={styles.prefSubtitle}>{subtitle}</Text>
      </View>
      <Switch value={value} onValueChange={onChange} color={PRIMARY} />
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.actionRow}>
      <Icon name={icon as any} size={18} color="#666" />
      <Text style={styles.actionLabel}>{label}</Text>
      <Text style={styles.actionValue}>{value}</Text>
    </View>
  );
}

function ActionRow({
  icon,
  label,
  onPress,
}: {
  icon: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.actionRow} onPress={onPress}>
      <Icon name={icon as any} size={18} color="#666" />
      <Text style={styles.actionLabel}>{label}</Text>
      <Icon name="chevron-right" size={18} color="#bbb" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  section: {
    backgroundColor: '#fff',
    marginTop: 12,
    marginHorizontal: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: PRIMARY },
  sectionBody: { padding: 16 },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  email: { fontSize: 14, fontWeight: '700', color: '#222' },
  role: { fontSize: 11, color: '#888', marginTop: 2 },
  input: { backgroundColor: '#fff', marginBottom: 8 },
  btn: { borderRadius: 8, marginTop: 8 },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  prefIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  prefTitle: { fontSize: 14, fontWeight: '600', color: '#222' },
  prefSubtitle: { fontSize: 11, color: '#999', marginTop: 2 },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  actionLabel: { flex: 1, fontSize: 14, color: '#222' },
  actionValue: { fontSize: 13, color: '#888' },
  dangerZone: { paddingHorizontal: 16, marginTop: 24 },
});
