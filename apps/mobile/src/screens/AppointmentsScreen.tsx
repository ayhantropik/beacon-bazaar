import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Text,
  ActivityIndicator,
  Card,
  Button,
  Chip,
} from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { RootStackScreenProps } from '../navigation/types';
import appointmentService, { type Appointment } from '../services/api/appointment.service';
import EmptyState from '../components/EmptyState';
import {
  cancelAppointmentReminder,
  isReminderEnabled,
  scheduleAppointmentReminder,
} from '../services/notifications/AppointmentReminders';

type Props = RootStackScreenProps<'Appointments'>;

const PRIMARY = '#1a6b52';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Beklemede', color: '#d97706', bg: '#fef3c7' },
  confirmed: { label: 'Onaylı', color: '#16a34a', bg: '#dcfce7' },
  cancelled: { label: 'İptal', color: '#dc2626', bg: '#fee2e2' },
  completed: { label: 'Tamamlandı', color: '#475569', bg: '#f1f5f9' },
};

function fmtDate(d: string): string {
  const dt = new Date(d);
  return dt.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export default function AppointmentsScreen({ navigation }: Props) {
  const [items, setItems] = useState<Appointment[]>([]);
  const [reminders, setReminders] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await appointmentService.myList();
      const data: Appointment[] = res.data?.data || [];
      setItems(data);
      setError(null);
      // Mevcut hatırlatıcı durumlarını oku
      const map: Record<string, boolean> = {};
      await Promise.all(
        data.map(async (a) => {
          map[a.id] = await isReminderEnabled(a.id);
        }),
      );
      setReminders(map);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Randevular yüklenemedi');
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const toggleReminder = async (a: Appointment) => {
    const enabled = reminders[a.id];
    if (enabled) {
      await cancelAppointmentReminder(a.id);
      setReminders((m) => ({ ...m, [a.id]: false }));
    } else {
      const r = await scheduleAppointmentReminder({
        appointmentId: a.id,
        storeName: a.store?.name || 'Mağaza',
        date: a.date,
        startTime: a.startTime,
      });
      if (r.ok) {
        setReminders((m) => ({ ...m, [a.id]: true }));
      } else {
        Alert.alert('Hatırlatıcı kurulamadı', r.reason || 'Bilinmeyen hata');
      }
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const cancelAppt = (a: Appointment) => {
    Alert.alert(
      'Randevuyu iptal et',
      `${fmtDate(a.date)} ${a.startTime} randevusu iptal edilsin mi?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'İptal Et',
          style: 'destructive',
          onPress: async () => {
            try {
              await appointmentService.cancel(a.id);
              await cancelAppointmentReminder(a.id);
              load();
            } catch (e: any) {
              Alert.alert('Hata', e.response?.data?.message || 'İptal edilemedi');
            }
          },
        },
      ],
    );
  };

  if (loading && items.length === 0) {
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
          icon="calendar-blank"
          title="Henüz randevu yok"
          subtitle="Mağaza detay sayfasından randevu alabilirsin"
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => it.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
            />
          }
          renderItem={({ item }) => {
            const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
            const cancelable =
              item.status === 'pending' || item.status === 'confirmed';
            return (
              <Card style={styles.card}>
                <View style={styles.headRow}>
                  <View style={styles.headLeft}>
                    <Icon name="calendar-clock" size={18} color={PRIMARY} />
                    <Text style={styles.dateText}>{fmtDate(item.date)}</Text>
                    <Text style={styles.timeText}>
                      {item.startTime} – {item.endTime}
                    </Text>
                  </View>
                  <Chip
                    compact
                    style={{ backgroundColor: cfg.bg }}
                    textStyle={{ color: cfg.color, fontWeight: '700', fontSize: 11 }}
                  >
                    {cfg.label}
                  </Chip>
                </View>
                {item.store?.name && (
                  <View style={styles.row}>
                    <Icon name="storefront" size={14} color="#666" />
                    <Text style={styles.muted}>{item.store.name}</Text>
                  </View>
                )}
                {item.service && (
                  <View style={styles.row}>
                    <Icon name="briefcase-outline" size={14} color="#666" />
                    <Text style={styles.muted}>{item.service}</Text>
                  </View>
                )}
                {item.notes && (
                  <View style={styles.row}>
                    <Icon name="note-text-outline" size={14} color="#666" />
                    <Text style={styles.muted}>{item.notes}</Text>
                  </View>
                )}
                {cancelable && (
                  <View style={styles.actionRow}>
                    <Button
                      mode="text"
                      textColor={reminders[item.id] ? PRIMARY : '#666'}
                      icon={reminders[item.id] ? 'bell-ring' : 'bell-outline'}
                      onPress={() => toggleReminder(item)}
                      compact
                    >
                      {reminders[item.id] ? 'Hatırlatıcı Açık' : 'Hatırlatıcı Kur'}
                    </Button>
                    <Button
                      mode="text"
                      textColor="#dc2626"
                      icon="close"
                      onPress={() => cancelAppt(item)}
                      compact
                    >
                      İptal Et
                    </Button>
                  </View>
                )}
              </Card>
            );
          }}
        />
      )}
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
  list: { padding: 12 },
  card: { backgroundColor: '#fff', marginBottom: 12, padding: 14 },
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  dateText: { fontSize: 13, fontWeight: '700', color: '#222' },
  timeText: { fontSize: 13, color: PRIMARY, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  muted: { fontSize: 12, color: '#666' },
  cancelBtn: { alignSelf: 'flex-start', marginTop: 8 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, gap: 4 },
});
