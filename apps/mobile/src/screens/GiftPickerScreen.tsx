import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  TextInput as RNTextInput,
  FlatList,
  Alert,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Chip,
  ActivityIndicator,
  SegmentedButtons,
  IconButton,
} from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RootStackScreenProps } from '../navigation/types';
import apiClient from '../services/api/client';
import AddToCartButton from '../components/AddToCartButton';

type Props = RootStackScreenProps<'GiftPicker'>;

const PRIMARY = '#1a6b52';
const ACCENT = '#d4882e';
const STORAGE_KEY = '@gift_recipients_v1';

const INTERESTS = [
  'Teknoloji', 'Spor', 'Moda', 'Müzik', 'Kitap', 'Oyun',
  'Kozmetik', 'Yemek', 'Seyahat', 'Sanat', 'Doğa', 'Hediyelik',
  'Ev & Mobilya', 'Bebek & Çocuk', 'Evcil Hayvan',
];

const RELATIONS = [
  { value: 'partner', label: 'Sevgili / Eş' },
  { value: 'family', label: 'Aile' },
  { value: 'friend', label: 'Arkadaş' },
  { value: 'colleague', label: 'İş Arkadaşı' },
];

interface Suggestion {
  id: string;
  name: string;
  slug: string;
  thumbnail: string | null;
  price: string | number;
  salePrice: string | number | null;
  ratingAverage?: number;
  store?: { name?: string; slug?: string };
  storeId?: string;
}

interface SavedRecipient {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'unisex';
  relation: string;
  budget: number;
  interests: string[];
  createdAt: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  followUpQuestions?: string[];
}

function num(v: any): number {
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return Number.isFinite(n) ? n : 0;
}

async function loadRecipients(): Promise<SavedRecipient[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveRecipients(items: SavedRecipient[]) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

export default function GiftPickerScreen({ navigation }: Props) {
  const [mode, setMode] = useState<'quick' | 'chat' | 'saved'>('quick');

  // Form (Quick mode)
  const [name, setName] = useState('');
  const [age, setAge] = useState('30');
  const [gender, setGender] = useState<'male' | 'female' | 'unisex'>('female');
  const [relation, setRelation] = useState<string>('friend');
  const [budget, setBudget] = useState('500');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Suggestion[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Saved recipients
  const [recipients, setRecipients] = useState<SavedRecipient[]>([]);

  // Chat mode
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      role: 'assistant',
      content:
        'Merhaba! 🎁 Sana hediye önerileri sunabilmem için kişiyi tanıyalım. Kim için hediye arıyorsun? (yaş, cinsiyet, ilgi alanları, bütçe)',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadRecipients().then(setRecipients);
  }, []);

  const toggleInterest = (i: string) => {
    setSelectedInterests((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i],
    );
  };

  const fetchSuggestions = async () => {
    const ageNum = parseInt(age, 10);
    const budgetNum = parseFloat(budget);
    if (!ageNum || ageNum < 1 || ageNum > 120) {
      setError('Geçerli bir yaş girin');
      return;
    }
    if (!budgetNum || budgetNum <= 0) {
      setError('Geçerli bir bütçe girin');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.post('/products/gift-suggestions', {
        age: ageNum,
        gender,
        relation,
        budget: budgetNum,
        interests: selectedInterests,
      });
      setResults(res.data?.data?.suggestions || res.data?.data || []);
    } catch (e: any) {
      const raw = e?.response?.data?.message;
      setError(
        Array.isArray(raw) ? raw.join(', ') : (typeof raw === 'string' ? raw : 'Öneri alınamadı'),
      );
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const saveCurrentRecipient = async () => {
    if (!name.trim()) {
      Alert.alert('İsim gerekli', 'Lütfen alıcının adını gir');
      return;
    }
    const ageNum = parseInt(age, 10) || 0;
    const newR: SavedRecipient = {
      id: `r-${Date.now()}`,
      name: name.trim(),
      age: ageNum,
      gender,
      relation,
      budget: parseFloat(budget) || 0,
      interests: selectedInterests,
      createdAt: new Date().toISOString(),
    };
    const next = [newR, ...recipients];
    setRecipients(next);
    await saveRecipients(next);
    Alert.alert('Kaydedildi', `${newR.name} kayıtlı alıcılara eklendi.`);
  };

  const useRecipient = (r: SavedRecipient) => {
    setName(r.name);
    setAge(String(r.age));
    setGender(r.gender);
    setRelation(r.relation);
    setBudget(String(r.budget));
    setSelectedInterests(r.interests);
    setMode('quick');
  };

  const deleteRecipient = (id: string) => {
    Alert.alert('Sil', 'Bu alıcıyı sil?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          const next = recipients.filter((x) => x.id !== id);
          setRecipients(next);
          await saveRecipients(next);
        },
      },
    ]);
  };

  const reset = () => {
    setResults([]);
    setError(null);
  };

  const sendChat = async () => {
    const msg = chatInput.trim();
    if (!msg || chatLoading) return;
    setChatInput('');
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: msg,
    };
    const next = [...chatMessages, userMsg];
    setChatMessages(next);
    setChatLoading(true);
    setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 100);
    try {
      const apiMessages = next.map((m) => ({ role: m.role, content: m.content }));
      const res = await apiClient.post('/products/gift-ai/chat', {
        messages: apiMessages,
      });
      const data = res.data;
      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: data?.message || data?.data?.message || 'Anlayamadım, tekrar dener misin?',
        followUpQuestions: data?.followUpQuestions || data?.data?.followUpQuestions,
      };
      setChatMessages((prev) => [...prev, assistantMsg]);
      setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 100);

      // Eğer profil çıkarıldıysa öneri getir
      if (data?.profile || data?.data?.profile) {
        const p = data.profile || data.data.profile;
        try {
          const sug = await apiClient.post('/products/gift-suggestions', {
            age: p.age || 30,
            gender: p.gender || 'unisex',
            budget: p.budget || 500,
            interests: p.interests || [],
            relation: p.relation || 'friend',
          });
          const items = sug.data?.data?.suggestions || sug.data?.data || [];
          if (items.length > 0) {
            setResults(items);
            setMode('quick');
          }
        } catch {
          // ignore
        }
      }
    } catch (e: any) {
      const errorMsg: ChatMessage = {
        id: `e-${Date.now()}`,
        role: 'assistant',
        content: 'Üzgünüm, sohbet servisi şu anda yanıt vermiyor.',
      };
      setChatMessages((prev) => [...prev, errorMsg]);
    } finally {
      setChatLoading(false);
    }
  };

  const useFollowUp = (q: string) => {
    setChatInput(q);
  };

  // Sonuç ekranı
  if (results.length > 0) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.results}>
          <View style={styles.resultsHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.resultsTitle}>🎁 {results.length} Öneri</Text>
              {(name || selectedInterests.length > 0) && (
                <Text style={styles.muted}>
                  {name ? `${name} için · ` : ''}
                  {selectedInterests.join(' · ')}
                </Text>
              )}
            </View>
            <Button
              mode="outlined"
              onPress={reset}
              icon="refresh"
              compact
              textColor={PRIMARY}
            >
              Yeniden
            </Button>
          </View>

          {name.trim() && (
            <Button
              mode="outlined"
              icon="bookmark-plus"
              onPress={saveCurrentRecipient}
              textColor={ACCENT}
              style={{ borderColor: ACCENT, marginBottom: 12 }}
            >
              {name} için kaydet
            </Button>
          )}

          <View style={styles.grid}>
            {results.map((s) => {
              const price = num(s.price);
              const sale = s.salePrice == null ? null : num(s.salePrice);
              const hasDiscount = sale != null && sale < price;
              const displayPrice = hasDiscount ? sale! : price;
              return (
                <TouchableOpacity
                  key={s.id}
                  style={styles.card}
                  onPress={() =>
                    navigation.navigate('ProductDetail', { productId: s.slug })
                  }
                >
                  <Image
                    source={{
                      uri: s.thumbnail || `https://picsum.photos/seed/${s.slug}/300/300`,
                    }}
                    style={styles.cardImg}
                  />
                  <View style={styles.cardBody}>
                    <Text numberOfLines={2} style={styles.cardName}>
                      {s.name}
                    </Text>
                    {s.store?.name && (
                      <Text numberOfLines={1} style={styles.storeName}>
                        🏬 {s.store.name}
                      </Text>
                    )}
                    <View style={styles.priceRow}>
                      <View style={styles.priceCol}>
                        <Text style={[styles.price, hasDiscount && { color: '#dc2626' }]}>
                          {displayPrice.toLocaleString('tr-TR')} ₺
                        </Text>
                        {hasDiscount && (
                          <Text style={styles.oldPrice}>
                            {price.toLocaleString('tr-TR')} ₺
                          </Text>
                        )}
                      </View>
                      <AddToCartButton
                        product={{
                          id: s.id,
                          productId: s.id,
                          storeId: s.storeId || s.store?.slug || '',
                          name: s.name,
                          thumbnail: s.thumbnail || undefined,
                          price: displayPrice,
                        }}
                      />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={{ height: 32 }} />
        </View>
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Mode Switcher */}
      <View style={styles.modeBar}>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'quick' && styles.modeBtnActive]}
          onPress={() => setMode('quick')}
        >
          <Icon
            name="form-select"
            size={16}
            color={mode === 'quick' ? '#fff' : '#666'}
          />
          <Text style={[styles.modeText, mode === 'quick' && styles.modeTextActive]}>
            Hızlı Form
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'chat' && styles.modeBtnActive]}
          onPress={() => setMode('chat')}
        >
          <Icon
            name="robot"
            size={16}
            color={mode === 'chat' ? '#fff' : '#666'}
          />
          <Text style={[styles.modeText, mode === 'chat' && styles.modeTextActive]}>
            AI Sohbet
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'saved' && styles.modeBtnActive]}
          onPress={() => setMode('saved')}
        >
          <Icon
            name="bookmark-multiple"
            size={16}
            color={mode === 'saved' ? '#fff' : '#666'}
          />
          <Text style={[styles.modeText, mode === 'saved' && styles.modeTextActive]}>
            Kayıtlı ({recipients.length})
          </Text>
        </TouchableOpacity>
      </View>

      {mode === 'quick' && (
        <ScrollView style={{ flex: 1 }}>
          <View style={styles.formBox}>
            <View style={styles.banner}>
              <Icon name="gift" size={24} color={ACCENT} />
              <View style={{ flex: 1 }}>
                <Text style={styles.bannerTitle}>Hızlı Form</Text>
                <Text style={styles.bannerSub}>
                  Bilgileri gir, sana özel öneriler bulalım
                </Text>
              </View>
            </View>

            <Text style={styles.label}>İsim (kayıt için)</Text>
            <TextInput
              mode="outlined"
              value={name}
              onChangeText={setName}
              placeholder="Örn. Ayşe abla"
              style={styles.input}
              left={<TextInput.Icon icon="account" />}
            />

            <Text style={styles.label}>Hediye Alacağın Kişi</Text>
            <SegmentedButtons
              value={relation}
              onValueChange={setRelation}
              buttons={RELATIONS}
              style={styles.segmented}
            />

            <View style={styles.row}>
              <View style={styles.flex}>
                <Text style={styles.label}>Yaş</Text>
                <TextInput
                  mode="outlined"
                  value={age}
                  onChangeText={setAge}
                  keyboardType="numeric"
                  style={styles.input}
                  left={<TextInput.Icon icon="cake-variant" />}
                />
              </View>
              <View style={styles.flex}>
                <Text style={styles.label}>Bütçe (₺)</Text>
                <TextInput
                  mode="outlined"
                  value={budget}
                  onChangeText={setBudget}
                  keyboardType="numeric"
                  style={styles.input}
                  left={<TextInput.Icon icon="cash" />}
                />
              </View>
            </View>

            <Text style={styles.label}>Cinsiyet</Text>
            <SegmentedButtons
              value={gender}
              onValueChange={(v: any) => setGender(v)}
              buttons={[
                { value: 'female', label: 'Kadın', icon: 'gender-female' },
                { value: 'male', label: 'Erkek', icon: 'gender-male' },
                { value: 'unisex', label: 'Fark Etmez', icon: 'gender-male-female' },
              ]}
              style={styles.segmented}
            />

            <Text style={styles.label}>İlgi Alanları</Text>
            <Text style={styles.muted}>Birden fazla seçebilirsin</Text>
            <View style={styles.chipGrid}>
              {INTERESTS.map((i) => (
                <Chip
                  key={i}
                  selected={selectedInterests.includes(i)}
                  onPress={() => toggleInterest(i)}
                  style={[
                    styles.chip,
                    selectedInterests.includes(i) && styles.chipSelected,
                  ]}
                  textStyle={
                    selectedInterests.includes(i) ? styles.chipTextSelected : undefined
                  }
                >
                  {i}
                </Chip>
              ))}
            </View>

            {error && (
              <View style={styles.errorBox}>
                <Icon name="alert-circle" size={14} color="#dc2626" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Button
              mode="contained"
              buttonColor={PRIMARY}
              onPress={fetchSuggestions}
              loading={loading}
              disabled={loading}
              icon="auto-fix"
              style={styles.submitBtn}
              contentStyle={{ paddingVertical: 4 }}
            >
              Hediye Önerilerini Getir
            </Button>

            {name.trim() && (
              <Button
                mode="outlined"
                icon="bookmark-plus"
                onPress={saveCurrentRecipient}
                textColor={ACCENT}
                style={{ borderColor: ACCENT, marginTop: 8 }}
              >
                {name} için kaydet
              </Button>
            )}

            <View style={{ height: 32 }} />
          </View>
        </ScrollView>
      )}

      {mode === 'chat' && (
        <View style={{ flex: 1 }}>
          <ScrollView
            ref={chatScrollRef}
            style={styles.chatList}
            contentContainerStyle={{ padding: 12 }}
          >
            {chatMessages.map((m) => (
              <View
                key={m.id}
                style={[
                  styles.bubbleRow,
                  m.role === 'user' && styles.bubbleRowMine,
                ]}
              >
                {m.role === 'assistant' && (
                  <View style={styles.botAvatar}>
                    <Icon name="robot" size={14} color="#fff" />
                  </View>
                )}
                <View
                  style={[
                    styles.bubble,
                    m.role === 'user' ? styles.bubbleMine : styles.bubbleOther,
                  ]}
                >
                  <Text
                    style={[
                      styles.bubbleText,
                      m.role === 'user' && styles.bubbleTextMine,
                    ]}
                  >
                    {m.content}
                  </Text>
                  {m.followUpQuestions && m.followUpQuestions.length > 0 && (
                    <View style={styles.suggestRow}>
                      {m.followUpQuestions.map((q) => (
                        <TouchableOpacity
                          key={q}
                          style={styles.suggestChip}
                          onPress={() => useFollowUp(q)}
                        >
                          <Text style={styles.suggestChipText}>{q}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            ))}
            {chatLoading && (
              <View style={styles.bubbleRow}>
                <View style={styles.botAvatar}>
                  <Icon name="robot" size={14} color="#fff" />
                </View>
                <View style={[styles.bubble, styles.bubbleOther]}>
                  <ActivityIndicator size="small" color={PRIMARY} />
                </View>
              </View>
            )}
          </ScrollView>
          <View style={styles.chatInputBar}>
            <RNTextInput
              style={styles.chatInput}
              value={chatInput}
              onChangeText={setChatInput}
              placeholder="Mesajını yaz..."
              placeholderTextColor="#999"
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              onPress={sendChat}
              disabled={!chatInput.trim() || chatLoading}
              style={[
                styles.chatSendBtn,
                (!chatInput.trim() || chatLoading) && { backgroundColor: '#ccc' },
              ]}
            >
              <Icon name="send" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {mode === 'saved' && (
        <FlatList
          data={recipients}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{ padding: 12 }}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Icon name="bookmark-outline" size={48} color="#ccc" />
              <Text style={styles.muted}>Henüz kayıtlı alıcı yok</Text>
              <Text style={[styles.muted, { fontSize: 11, marginTop: 4 }]}>
                Form doldurup ismini gir, "kaydet" butonu ile listeye ekle
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.savedCard}>
              <View style={styles.savedAvatar}>
                <Text style={styles.savedAvatarText}>
                  {item.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.savedName}>{item.name}</Text>
                <Text style={styles.savedMeta}>
                  {item.age} yaş ·{' '}
                  {item.gender === 'female'
                    ? 'Kadın'
                    : item.gender === 'male'
                    ? 'Erkek'
                    : 'Unisex'}{' '}
                  · {item.budget.toLocaleString('tr-TR')} ₺
                </Text>
                {item.interests.length > 0 && (
                  <Text style={styles.savedInterests} numberOfLines={1}>
                    {item.interests.join(' · ')}
                  </Text>
                )}
              </View>
              <View style={{ flexDirection: 'row' }}>
                <IconButton
                  icon="auto-fix"
                  size={20}
                  iconColor={PRIMARY}
                  onPress={() => useRecipient(item)}
                />
                <IconButton
                  icon="trash-can-outline"
                  size={20}
                  iconColor="#dc2626"
                  onPress={() => deleteRecipient(item.id)}
                />
              </View>
            </View>
          )}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  modeBar: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#f5f5f5',
  },
  modeBtnActive: { backgroundColor: PRIMARY },
  modeText: { fontSize: 11, color: '#666', fontWeight: '700' },
  modeTextActive: { color: '#fff' },
  formBox: { padding: 16 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff8e6',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  bannerTitle: { fontSize: 15, fontWeight: '800', color: '#92400e' },
  bannerSub: { fontSize: 12, color: '#92400e', marginTop: 2 },
  label: { fontSize: 13, fontWeight: '700', color: '#222', marginTop: 16, marginBottom: 6 },
  muted: { fontSize: 11, color: '#888', marginBottom: 8, textAlign: 'center' },
  segmented: { marginBottom: 4 },
  row: { flexDirection: 'row', gap: 12 },
  flex: { flex: 1 },
  input: { backgroundColor: '#fff', marginBottom: 4 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb' },
  chipSelected: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  chipTextSelected: { color: '#fff', fontWeight: '700' },
  errorBox: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  errorText: { fontSize: 12, color: '#dc2626', flex: 1 },
  submitBtn: { borderRadius: 8, marginTop: 24 },
  results: { padding: 12 },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  resultsTitle: { fontSize: 16, fontWeight: '800', color: '#222' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  card: {
    width: '48%',
    margin: '1%',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 8,
  },
  cardImg: { width: '100%', aspectRatio: 1, backgroundColor: '#f5f5f5' },
  cardBody: { padding: 8 },
  cardName: { fontSize: 12, fontWeight: '600', color: '#222', minHeight: 32, lineHeight: 16 },
  storeName: { fontSize: 10, color: ACCENT, fontWeight: '600', marginTop: 4 },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  priceCol: { flex: 1 },
  price: { fontSize: 13, fontWeight: '800', color: PRIMARY },
  oldPrice: { fontSize: 10, color: '#999', textDecorationLine: 'line-through' },

  // Chat
  chatList: { flex: 1, backgroundColor: '#f7f7f7' },
  bubbleRow: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 6,
  },
  bubbleRowMine: { justifyContent: 'flex-end' },
  botAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: ACCENT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
  },
  bubbleMine: { backgroundColor: PRIMARY, borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: '#fff', borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 14, color: '#222', lineHeight: 20 },
  bubbleTextMine: { color: '#fff' },
  suggestRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  suggestChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#fff8e6',
    borderWidth: 1,
    borderColor: '#fde2bd',
  },
  suggestChipText: { fontSize: 11, color: '#92400e', fontWeight: '600' },
  chatInputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    fontSize: 14,
    color: '#222',
    maxHeight: 100,
  },
  chatSendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Saved recipients
  savedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
    gap: 10,
  },
  savedAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  savedAvatarText: { color: '#fff', fontWeight: '800', fontSize: 18 },
  savedName: { fontSize: 14, fontWeight: '700', color: '#222' },
  savedMeta: { fontSize: 11, color: '#888', marginTop: 2 },
  savedInterests: { fontSize: 11, color: ACCENT, fontWeight: '600', marginTop: 2 },
  emptyBox: { alignItems: 'center', padding: 48 },
});
