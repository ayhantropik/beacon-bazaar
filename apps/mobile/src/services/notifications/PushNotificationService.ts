import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import notificationService from '../api/notification.service';

// Foreground notification davranışı
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  } as any),
});

const PROJECT_ID = '34ebb994-5324-4855-ad14-6e6988078b3d';

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  // Expo Go SDK 53+ Android push'u kaldırdı; iOS sandbox kısıtlı.
  // Standalone build'lerde tam çalışır.
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#1a6b52',
      });
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      return null;
    }

    const projectId =
      (Constants.expoConfig as any)?.extra?.eas?.projectId || PROJECT_ID;
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    return tokenData?.data || null;
  } catch (err) {
    if (__DEV__) console.warn('Push token alınamadı:', err);
    return null;
  }
}

/**
 * Token'ı backend'e gönder. Login sonrası veya app açılışında çağrıla.
 */
export async function syncPushTokenWithBackend(): Promise<void> {
  const token = await registerForPushNotificationsAsync();
  if (!token) return;
  try {
    await notificationService.registerDevice(
      token,
      (Platform.OS as 'ios' | 'android') || 'web',
      {
        brand: Platform.OS,
        appVersion: (Constants.expoConfig as any)?.version || '1.0.0',
      },
    );
  } catch (err) {
    if (__DEV__) console.warn('register-device hatası:', err);
  }
}

export function addNotificationListeners(opts: {
  onReceive?: (n: Notifications.Notification) => void;
  onResponse?: (r: Notifications.NotificationResponse) => void;
}) {
  const receivedSub = opts.onReceive
    ? Notifications.addNotificationReceivedListener(opts.onReceive)
    : null;
  const responseSub = opts.onResponse
    ? Notifications.addNotificationResponseReceivedListener(opts.onResponse)
    : null;
  return () => {
    receivedSub?.remove();
    responseSub?.remove();
  };
}
