import React, { useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Text, ActivityIndicator, Button } from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { RootStackScreenProps } from '../navigation/types';
import notificationService, { type NotificationItem } from '../services/api/notification.service';
import EmptyState from '../components/EmptyState';

type Props = RootStackScreenProps<'Notifications'>;

const PRIMARY = '#1a6b52';

const TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  order_update: { icon: 'package-variant', color: '#2563eb', bg: '#dbeafe' },
  order_shipped: { icon: 'truck-fast', color: '#16a34a', bg: '#dcfce7' },
  order_delivered: { icon: 'check-circle', color: '#16a34a', bg: '#dcfce7' },
  message: { icon: 'message-text', color: '#6366f1', bg: '#e0e7ff' },
  appointment: { icon: 'calendar-clock', color: '#d97706', bg: '#fef3c7' },
  auction_bid: { icon: 'gavel', color: '#dc2626', bg: '#fee2e2' },
  auction_won: { icon: 'trophy', color: '#16a34a', bg: '#dcfce7' },
  price_alert: { icon: 'tag', color: '#c0392b', bg: '#fef2f2' },
  promotion: { icon: 'sale', color: '#a855f7', bg: '#f3e8ff' },
  system: { icon: 'information', color: '#475569', bg: '#f1f5f9' },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'şimdi';
  if (m < 60) return `${m} dk önce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} sa önce`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} gün önce`;
  return new Date(iso).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
}

export default function NotificationsScreen({ navigation }: Props) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await notificationService.list();
      setItems(res.data?.data || []);
      setError(null);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Bildirimler yüklenemedi');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onItemPress = async (it: NotificationItem) => {
    if (!it.isRead) {
      try {
        await notificationService.markRead(it.id);
        setItems((prev) =>
          prev.map((x) => (x.id === it.id ? { ...x, isRead: true } : x)),
        );
      } catch {
        // ignore
      }
    }
    // Bildirim tipine göre yönlendir
    if (it.type.startsWith('order') && it.data?.orderId) {
      navigation.navigate('OrderDetail', { orderId: it.data.orderId });
    } else if (it.type === 'message' && it.data?.conversationId) {
      navigation.navigate('Chat', {
        conversationId: it.data.conversationId,
        title: it.data.storeName,
      });
    } else if (it.type === 'appointment') {
      navigation.navigate('Appointments');
    } else if (it.type.startsWith('auction') && it.data?.auctionId) {
      navigation.navigate('AuctionDetail', { auctionId: it.data.auctionId });
    } else if (it.type === 'price_alert' && it.data?.productSlug) {
      navigation.navigate('ProductDetail', { productId: it.data.productSlug });
    }
  };

  const markAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setItems((prev) => prev.map((x) => ({ ...x, isRead: true })));
    } catch {
      // ignore
    }
  };

  if (loading && items.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  const unreadCount = items.filter((i) => !i.isRead).length;

  return (
    <View style={styles.container}>
      {error && (
        <View style={styles.errorBanner}>
          <Icon name="alert-circle" size={14} color="#92400e" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {unreadCount > 0 && (
        <View style={styles.headerBar}>
          <Text style={styles.unreadText}>{unreadCount} okunmamış bildirim</Text>
          <Button
            mode="text"
            onPress={markAllRead}
            icon="check-all"
            textColor={PRIMARY}
            compact
          >
            Tümünü Okundu İşaretle
          </Button>
        </View>
      )}

      {items.length === 0 ? (
        <EmptyState
          icon="bell-outline"
          title="Bildirim yok"
          subtitle="Yeni bildirimler burada görünecek"
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
            const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.system;
            return (
              <TouchableOpacity
                style={[styles.row, !item.isRead && styles.rowUnread]}
                onPress={() => onItemPress(item)}
              >
                <View style={[styles.iconWrap, { backgroundColor: cfg.bg }]}>
                  <Icon name={cfg.icon as any} size={20} color={cfg.color} />
                </View>
                <View style={styles.info}>
                  <View style={styles.titleRow}>
                    <Text
                      numberOfLines={1}
                      style={[styles.title, !item.isRead && styles.titleUnread]}
                    >
                      {item.title}
                    </Text>
                    {!item.isRead && <View style={styles.unreadDot} />}
                  </View>
                  <Text numberOfLines={2} style={styles.body}>
                    {item.body}
                  </Text>
                  <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
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
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f0fdf4',
    borderBottomWidth: 1,
    borderBottomColor: '#dcfce7',
  },
  unreadText: { fontSize: 12, color: PRIMARY, fontWeight: '700' },
  list: { padding: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  rowUnread: { backgroundColor: '#f9fafb' },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { fontSize: 14, fontWeight: '600', color: '#222', flex: 1 },
  titleUnread: { fontWeight: '800' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#dc2626' },
  body: { fontSize: 12, color: '#666', marginTop: 4, lineHeight: 16 },
  time: { fontSize: 11, color: '#999', marginTop: 4 },
  sep: { height: 1, backgroundColor: '#f5f5f5', marginLeft: 72 },
});
