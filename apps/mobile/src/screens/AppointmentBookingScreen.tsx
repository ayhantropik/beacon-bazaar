import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  ActivityIndicator,
} from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import type { RootStackScreenProps } from '../navigation/types';
import appointmentService, { type Slot } from '../services/api/appointment.service';
import apiClient from '../services/api/client';
import { scheduleAppointmentReminder } from '../services/notifications/AppointmentReminders';

type Props = RootStackScreenProps<'AppointmentBooking'>;

const PRIMARY = '#1a6b52';

const DAY_NAMES = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
const MONTH_NAMES = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

function fmtDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getNext14Days(): Date[] {
  const arr: Date[] = [];
  const now = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    d.setHours(0, 0, 0, 0);
    arr.push(d);
  }
  return arr;
}

export default function AppointmentBookingScreen({ route, navigation }: Props) {
  const { storeId } = route.params;
  const [storeName, setStoreName] = useState<string>('');
  const [storeRealId, setStoreRealId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [service, setService] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const days = useMemo(() => getNext14Days(), []);

  useEffect(() => {
    let mounted = true;
    apiClient
      .get(`/stores/${storeId}`)
      .then((r) => {
        if (!mounted) return;
        const s = r.data?.data;
        setStoreName(s?.name || 'Mağaza');
        setStoreRealId(s?.id || storeId);
      })
      .catch(() => null);
    return () => {
      mounted = false;
    };
  }, [storeId]);

  useEffect(() => {
    if (!storeRealId) return;
    let mounted = true;
    setLoadingSlots(true);
    setSelectedSlot(null);
    appointmentService
      .slots(storeRealId, fmtDate(selectedDate))
      .then((r) => {
        if (!mounted) return;
        setSlots(r.data?.data || []);
      })
      .catch(() => {
        if (mounted) setSlots([]);
      })
      .finally(() => {
        if (mounted) setLoadingSlots(false);
      });
    return () => {
      mounted = false;
    };
  }, [storeRealId, selectedDate]);

  const submit = async () => {
    if (!selectedSlot) {
      Alert.alert('Saat seçin', 'Lütfen müsait bir saat seçin');
      return;
    }
    setSubmitting(true);
    try {
      const res = await appointmentService.create({
        storeId: storeRealId,
        date: fmtDate(selectedDate),
        startTime: selectedSlot.start,
        endTime: selectedSlot.end,
        service: service.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      if (res.data?.success) {
        const apt = res.data?.data;
        // Yerel bildirim (1 saat önce + tam zamanda)
        let reminderMsg = '';
        if (apt?.id) {
          const r = await scheduleAppointmentReminder({
            appointmentId: apt.id,
            storeName: storeName || 'Mağaza',
            date: fmtDate(selectedDate),
            startTime: selectedSlot.start,
          });
          reminderMsg = r.ok
            ? '\n\n🔔 1 saat öncesinden ve randevu zamanında bildirim alacaksın.'
            : '\n\n⚠ Bildirim hatırlatıcısı kurulamadı (' + (r.reason || 'izin yok') + ').';
        }
        Alert.alert('Randevu Oluşturuldu', 'Randevunuz alındı.' + reminderMsg, [
          {
            text: 'Tamam',
            onPress: () => navigation.replace('Appointments'),
          },
        ]);
      }
    } catch (e: any) {
      const raw = e?.response?.data?.message;
      const msg = Array.isArray(raw) ? raw.join(', ') : (typeof raw === 'string' ? raw : '');
      Alert.alert('Hata', msg || 'Randevu oluşturulamadı');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {storeName ? (
        <View style={styles.storeBox}>
          <Icon name="storefront" size={20} color={PRIMARY} />
          <Text style={styles.storeName}>{storeName}</Text>
        </View>
      ) : null}

      <Text style={styles.label}>Tarih Seçin</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daysRow}>
        {days.map((d) => {
          const isSel = d.toDateString() === selectedDate.toDateString();
          return (
            <TouchableOpacity
              key={d.toISOString()}
              style={[styles.dayCard, isSel && styles.dayCardActive]}
              onPress={() => setSelectedDate(d)}
            >
              <Text style={[styles.dayName, isSel && styles.dayTextActive]}>
                {DAY_NAMES[d.getDay()]}
              </Text>
              <Text style={[styles.dayNum, isSel && styles.dayTextActive]}>
                {d.getDate()}
              </Text>
              <Text style={[styles.dayMonth, isSel && styles.dayTextActive]}>
                {MONTH_NAMES[d.getMonth()].slice(0, 3)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Text style={styles.label}>Saat Seçin</Text>
      {loadingSlots ? (
        <View style={styles.loadBox}>
          <ActivityIndicator color={PRIMARY} />
        </View>
      ) : slots.length === 0 ? (
        <Text style={styles.empty}>Bu tarihte uygun saat yok</Text>
      ) : (
        <View style={styles.slotsGrid}>
          {slots.map((s) => {
            const sel = selectedSlot?.start === s.start;
            return (
              <TouchableOpacity
                key={s.start}
                style={[
                  styles.slotChip,
                  !s.isAvailable && styles.slotDisabled,
                  sel && styles.slotActive,
                ]}
                onPress={() => s.isAvailable && setSelectedSlot(s)}
                disabled={!s.isAvailable}
              >
                <Text
                  style={[
                    styles.slotText,
                    !s.isAvailable && styles.slotTextDisabled,
                    sel && styles.slotTextActive,
                  ]}
                >
                  {s.start}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <Text style={styles.label}>Hizmet (opsiyonel)</Text>
      <TextInput
        mode="outlined"
        value={service}
        onChangeText={setService}
        placeholder="Örn. Saç bakımı, danışmanlık..."
        style={styles.input}
      />

      <Text style={styles.label}>Notlar (opsiyonel)</Text>
      <TextInput
        mode="outlined"
        value={notes}
        onChangeText={setNotes}
        placeholder="Eklemek istediğin bilgi"
        multiline
        numberOfLines={3}
        style={styles.input}
      />

      <Button
        mode="contained"
        buttonColor={PRIMARY}
        onPress={submit}
        loading={submitting}
        disabled={submitting || !selectedSlot}
        icon="calendar-check"
        style={styles.btn}
      >
        Randevuyu Oluştur
      </Button>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  storeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f0fdf4',
    padding: 12,
    margin: 12,
    borderRadius: 8,
  },
  storeName: { fontSize: 14, fontWeight: '700', color: PRIMARY },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#222',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  daysRow: { paddingHorizontal: 12 },
  dayCard: {
    width: 64,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  dayCardActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  dayName: { fontSize: 11, color: '#888', fontWeight: '600' },
  dayNum: { fontSize: 22, fontWeight: '800', color: '#222', marginVertical: 2 },
  dayMonth: { fontSize: 10, color: '#888' },
  dayTextActive: { color: '#fff' },
  loadBox: { padding: 24, alignItems: 'center' },
  empty: { textAlign: 'center', color: '#999', padding: 24 },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 8,
  },
  slotChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minWidth: 70,
    alignItems: 'center',
  },
  slotActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  slotDisabled: { backgroundColor: '#f5f5f5', borderColor: '#eee' },
  slotText: { fontSize: 13, color: '#333', fontWeight: '600' },
  slotTextActive: { color: '#fff' },
  slotTextDisabled: { color: '#bbb' },
  input: { marginHorizontal: 16, marginBottom: 4, backgroundColor: '#fff' },
  btn: {
    marginHorizontal: 16,
    marginTop: 24,
    borderRadius: 8,
    paddingVertical: 4,
  },
});
