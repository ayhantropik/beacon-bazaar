import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import type { RootStackScreenProps } from '../navigation/types';
import messageService, { type MessageItem } from '../services/api/message.service';

type Props = RootStackScreenProps<'Chat'>;

const PRIMARY = '#1a6b52';
const POLL_INTERVAL = 5000;

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ChatScreen({ route, navigation }: Props) {
  const { conversationId, title } = route.params;
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (title) navigation.setOptions({ headerTitle: title });
  }, [title, navigation]);

  const load = useCallback(async () => {
    try {
      const res = await messageService.messages(conversationId, 1, 100);
      const list: MessageItem[] = res.data?.data || [];
      // Backend createdAt DESC dönüyor; FlatList inverted için ters; biz inverted kullanıyoruz, DESC iyi
      setMessages(list);
      setError(null);
      // Mark read
      messageService.markRead(conversationId).catch(() => null);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Mesajlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    load();
    // Poll yeni mesajlar için
    const id = setInterval(load, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [load]);

  const onSend = async () => {
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    // Optimistic
    const optimistic: MessageItem = {
      id: `tmp-${Date.now()}`,
      content,
      isRead: false,
      isMine: true,
      sender: { id: 'me' },
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [optimistic, ...prev]);
    setText('');
    try {
      await messageService.send(conversationId, content);
      load();
    } catch (e: any) {
      // Geri al
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setError(e.response?.data?.message || 'Mesaj gönderilemedi');
    } finally {
      setSending(false);
    }
  };

  if (loading && messages.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {error && (
        <View style={styles.errorBanner}>
          <Icon name="alert-circle" size={14} color="#92400e" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(it) => it.id}
        inverted
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={[styles.bubbleRow, item.isMine && styles.bubbleRowMine]}>
            <View
              style={[
                styles.bubble,
                item.isMine ? styles.bubbleMine : styles.bubbleOther,
              ]}
            >
              <Text style={[styles.bubbleText, item.isMine && styles.bubbleTextMine]}>
                {item.content}
              </Text>
              <Text style={[styles.bubbleTime, item.isMine && styles.bubbleTimeMine]}>
                {fmtTime(item.createdAt)}
                {item.isMine && (
                  <Text style={styles.readMark}>{item.isRead ? ' ✓✓' : ' ✓'}</Text>
                )}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="message-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>Konuşmaya başla</Text>
          </View>
        }
      />

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Mesaj yaz..."
          placeholderTextColor="#999"
          value={text}
          onChangeText={setText}
          multiline
          maxLength={2000}
        />
        <TouchableOpacity
          onPress={onSend}
          disabled={!text.trim() || sending}
          style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
        >
          <Icon name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7f7' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7f7f7' },
  errorBanner: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#fef3c7',
  },
  errorText: { fontSize: 11, color: '#92400e', flex: 1 },
  list: { padding: 12, gap: 6 },
  bubbleRow: { flexDirection: 'row', justifyContent: 'flex-start', marginVertical: 2 },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  bubbleMine: { backgroundColor: PRIMARY, borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: '#fff', borderBottomLeftRadius: 4, elevation: 1 },
  bubbleText: { fontSize: 14, color: '#222', lineHeight: 19 },
  bubbleTextMine: { color: '#fff' },
  bubbleTime: { fontSize: 9, color: '#999', alignSelf: 'flex-end', marginTop: 4 },
  bubbleTimeMine: { color: 'rgba(255,255,255,0.7)' },
  readMark: { fontSize: 10 },
  empty: { padding: 48, alignItems: 'center', transform: [{ scaleY: -1 }] },
  emptyText: { color: '#999', marginTop: 12 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    fontSize: 14,
    color: '#222',
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#ccc' },
});
