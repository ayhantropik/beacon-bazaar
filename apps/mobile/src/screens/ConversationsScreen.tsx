import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Text, Avatar, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { RootStackScreenProps } from '../navigation/types';
import messageService, { type ConversationItem } from '../services/api/message.service';
import EmptyState from '../components/EmptyState';

type Props = RootStackScreenProps<'Conversations'>;

const PRIMARY = '#1a6b52';
const ACCENT = '#dc2626';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'şimdi';
  if (m < 60) return `${m}d`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}s`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}g`;
  return new Date(iso).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
}

export default function ConversationsScreen({ navigation }: Props) {
  const [items, setItems] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await messageService.list();
      setItems(res.data?.data || []);
      setError(null);
    } catch (e: any) {
      setError(
        e.response?.data?.message ||
          'Mesajlar yüklenemedi (sunucu mesajlaşma henüz aktif olmayabilir)',
      );
      setItems([]);
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
          icon="message-text-outline"
          title="Henüz mesaj yok"
          subtitle="Mağazalardan ürünler hakkında soru sorabilirsin"
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => it.id}
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
            const fullName = [item.otherUser.name, item.otherUser.surname]
              .filter(Boolean)
              .join(' ');
            return (
              <TouchableOpacity
                style={styles.row}
                onPress={() =>
                  navigation.navigate('Chat', {
                    conversationId: item.id,
                    title: fullName || 'Kullanıcı',
                  })
                }
              >
                {item.otherUser.avatar ? (
                  <Avatar.Image size={48} source={{ uri: item.otherUser.avatar }} />
                ) : (
                  <Avatar.Text
                    size={48}
                    label={(fullName || '?').charAt(0).toUpperCase()}
                  />
                )}
                <View style={styles.info}>
                  <View style={styles.line1}>
                    <Text numberOfLines={1} style={styles.name}>
                      {fullName || 'Kullanıcı'}
                    </Text>
                    <Text style={styles.time}>
                      {timeAgo(item.lastMessageAt || item.createdAt)}
                    </Text>
                  </View>
                  {item.listingTitle && (
                    <Text numberOfLines={1} style={styles.listing}>
                      📦 {item.listingTitle}
                    </Text>
                  )}
                  <View style={styles.line2}>
                    <Text
                      numberOfLines={1}
                      style={[styles.preview, item.unreadCount > 0 && styles.unreadPreview]}
                    >
                      {item.lastMessage || 'Mesaj yok'}
                    </Text>
                    {item.unreadCount > 0 && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{item.unreadCount}</Text>
                      </View>
                    )}
                  </View>
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  info: { flex: 1 },
  line1: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 15, fontWeight: '700', color: '#222', flex: 1 },
  time: { fontSize: 11, color: '#999', marginLeft: 6 },
  listing: { fontSize: 11, color: PRIMARY, fontWeight: '600', marginTop: 2 },
  line2: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  preview: { fontSize: 13, color: '#666', flex: 1 },
  unreadPreview: { color: '#222', fontWeight: '700' },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: ACCENT,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  sep: { height: 1, backgroundColor: '#f5f5f5', marginLeft: 76 },
});
