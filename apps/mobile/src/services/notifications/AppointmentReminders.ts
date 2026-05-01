import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@appointment_reminders_v1';

interface ReminderMap {
  [appointmentId: string]: {
    /** notification IDs scheduled for this appointment (1 hour + at time) */
    ids: string[];
  };
}

// Foreground'da bildirimleri göster
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let permissionAsked = false;

async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (permissionAsked) return false;
  permissionAsked = true;
  const req = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: false,
      allowSound: true,
    },
  });
  return req.granted;
}

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('appointments', {
    name: 'Randevu Hatırlatmaları',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
  });
}

async function loadMap(): Promise<ReminderMap> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function saveMap(m: ReminderMap) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(m));
  } catch {
    // ignore
  }
}

export async function isReminderEnabled(appointmentId: string): Promise<boolean> {
  const m = await loadMap();
  const ids = m[appointmentId]?.ids || [];
  if (ids.length === 0) return false;
  // Halen scheduled mı?
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const idsSet = new Set(ids);
  return scheduled.some((s) => idsSet.has(s.identifier));
}

/** Randevu için 1 saat öncesinden ve tam zamanda 2 hatırlatıcı kurar */
export async function scheduleAppointmentReminder(opts: {
  appointmentId: string;
  storeName: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
}): Promise<{ ok: boolean; reason?: string }> {
  const granted = await ensurePermission();
  if (!granted) return { ok: false, reason: 'Bildirim izni reddedildi' };
  await ensureAndroidChannel();

  const [y, mo, d] = opts.date.split('-').map(Number);
  const [h, mi] = opts.startTime.split(':').map(Number);
  const target = new Date(y, mo - 1, d, h, mi, 0, 0);
  const now = Date.now();
  if (target.getTime() <= now) {
    return { ok: false, reason: 'Randevu geçmişte' };
  }

  // Önceki hatırlatmaları temizle
  await cancelAppointmentReminder(opts.appointmentId);

  const newIds: string[] = [];

  // 1 saat öncesi
  const oneHourBefore = new Date(target.getTime() - 60 * 60 * 1000);
  if (oneHourBefore.getTime() > now) {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Randevuna 1 saat kaldı',
        body: `${opts.storeName} mağazasındaki randevun ${opts.startTime}'da başlıyor.`,
        sound: 'default',
        data: { type: 'appointment_reminder', appointmentId: opts.appointmentId },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: oneHourBefore,
        channelId: 'appointments',
      } as any,
    });
    newIds.push(id);
  }

  // Tam zamanı
  const id2 = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Randevu zamanı geldi',
      body: `${opts.storeName} mağazasındaki randevun şimdi başlıyor.`,
      sound: 'default',
      data: { type: 'appointment_now', appointmentId: opts.appointmentId },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: target,
      channelId: 'appointments',
    } as any,
  });
  newIds.push(id2);

  const m = await loadMap();
  m[opts.appointmentId] = { ids: newIds };
  await saveMap(m);

  return { ok: true };
}

export async function cancelAppointmentReminder(appointmentId: string) {
  const m = await loadMap();
  const ids = m[appointmentId]?.ids || [];
  for (const id of ids) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch {
      // ignore
    }
  }
  delete m[appointmentId];
  await saveMap(m);
}
