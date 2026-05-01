import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Image,
  Animated,
  PanResponder,
  Dimensions,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { removeItem, updateQuantity, clearCart } from '../store/slices/cartSlice';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const CART_BG = '#a3e635';
const ACCENT = '#dc2626';
const PRIMARY = '#1a6b52';

const W = 56;
const H = 92;
const MARGIN = 8;
const BOTTOM_TAB = 60;
const SLIDE_INTERVAL = 2500;
const SLIDE_DURATION = 280;

export default function FloatingCart() {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const items = useAppSelector((s) => s.cart.items);

  const screen = Dimensions.get('window');
  const initX = screen.width - W - 12;
  const initY = screen.height - H - BOTTOM_TAB - 16;

  const pos = useRef(new Animated.ValueXY({ x: initX, y: initY })).current;
  const movedRef = useRef(false);

  const slideY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const [idx, setIdx] = useState(0);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (idx >= items.length) setIdx(0);
  }, [items.length, idx]);

  useEffect(() => {
    if (items.length <= 1 || expanded) return;
    const id = setInterval(() => {
      Animated.parallel([
        Animated.timing(slideY, { toValue: -22, duration: SLIDE_DURATION, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: SLIDE_DURATION, useNativeDriver: true }),
      ]).start(() => {
        setIdx((i) => (i + 1) % items.length);
        slideY.setValue(22);
        Animated.parallel([
          Animated.timing(slideY, { toValue: 0, duration: SLIDE_DURATION, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: SLIDE_DURATION, useNativeDriver: true }),
        ]).start();
      });
    }, SLIDE_INTERVAL);
    return () => clearInterval(id);
  }, [items.length, expanded, slideY, opacity]);

  const expandedRef = useRef(false);
  useEffect(() => {
    expandedRef.current = expanded;
  }, [expanded]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        movedRef.current = false;
        // @ts-ignore
        pos.setOffset({ x: pos.x._value, y: pos.y._value });
        pos.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (_, g) => {
        if (Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4) movedRef.current = true;
        Animated.event([null, { dx: pos.x, dy: pos.y }], { useNativeDriver: false })(_, g);
      },
      onPanResponderRelease: () => {
        pos.flattenOffset();
        // @ts-ignore
        const x = pos.x._value;
        // @ts-ignore
        const y = pos.y._value;
        const minX = MARGIN;
        const maxX = screen.width - W - MARGIN;
        const minY = MARGIN + 40;
        const maxY = screen.height - H - BOTTOM_TAB - MARGIN;
        const cx = Math.min(maxX, Math.max(minX, x));
        const cy = Math.min(maxY, Math.max(minY, y));
        Animated.spring(pos, {
          toValue: { x: cx, y: cy },
          useNativeDriver: false,
          friction: 7,
        }).start();
        // Tap (hareketsiz dokunma) → paneli aç
        if (!movedRef.current && !expandedRef.current) {
          setExpanded(true);
        }
      },
    }),
  ).current;

  if (items.length === 0) return null;

  const totalCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const current = items[Math.min(idx, items.length - 1)];

  const goToCart = () => {
    setExpanded(false);
    navigation.navigate('Main', { screen: 'Cart' } as any);
  };

  return (
    <>
      <Animated.View
        {...panResponder.panHandlers}
        style={[styles.container, { transform: pos.getTranslateTransform() }]}
      >
        <View style={styles.inner}>
          <View style={styles.iconRow}>
            <Icon name="cart" size={14} color="#111" />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{totalCount}</Text>
            </View>
          </View>

          <Text style={styles.totalText} numberOfLines={1}>
            {totalPrice.toLocaleString('tr-TR')} ₺
          </Text>

          <Animated.View
            style={[
              styles.slideArea,
              { opacity, transform: [{ translateY: slideY }] },
            ]}
          >
            {current?.thumbnail ? (
              <Image source={{ uri: current.thumbnail }} style={styles.thumbnail} />
            ) : (
              <View style={styles.thumbnailPlaceholder} />
            )}
            <Text style={styles.itemName} numberOfLines={1}>
              {current?.name || ''}
            </Text>
          </Animated.View>
        </View>
      </Animated.View>

      {/* Açılan ürün listesi paneli */}
      <Modal
        visible={expanded}
        transparent
        animationType="fade"
        onRequestClose={() => setExpanded(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setExpanded(false)}>
          <Pressable style={styles.panel} onPress={(e) => e.stopPropagation()}>
            <View style={styles.panelHeader}>
              <Icon name="cart" size={20} color={PRIMARY} />
              <Text style={styles.panelTitle}>Sepetim ({totalCount})</Text>
              <View style={styles.flex} />
              <TouchableOpacity onPress={() => setExpanded(false)}>
                <Icon name="close" size={22} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.panelList}>
              {items.map((item) => (
                <View key={item.id} style={styles.row}>
                  <Image
                    source={{
                      uri: item.thumbnail || `https://picsum.photos/seed/${item.id}/80/80`,
                    }}
                    style={styles.rowImage}
                  />
                  <View style={styles.rowInfo}>
                    <Text numberOfLines={2} style={styles.rowName}>
                      {item.name}
                    </Text>
                    <Text style={styles.rowPrice}>
                      {(item.price * item.quantity).toLocaleString('tr-TR')} ₺
                    </Text>
                  </View>
                  <View style={styles.qtyBox}>
                    <TouchableOpacity
                      onPress={() =>
                        dispatch(
                          updateQuantity({ id: item.id, quantity: item.quantity - 1 }),
                        )
                      }
                      style={styles.qtyBtn}
                    >
                      <Icon name="minus" size={14} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{item.quantity}</Text>
                    <TouchableOpacity
                      onPress={() =>
                        dispatch(
                          updateQuantity({ id: item.id, quantity: item.quantity + 1 }),
                        )
                      }
                      style={styles.qtyBtn}
                    >
                      <Icon name="plus" size={14} color="#333" />
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    onPress={() => dispatch(removeItem(item.id))}
                    style={styles.deleteBtn}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Icon name="trash-can-outline" size={18} color={ACCENT} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            <View style={styles.panelFooter}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Toplam</Text>
                <Text style={styles.totalValue}>
                  {totalPrice.toLocaleString('tr-TR')} ₺
                </Text>
              </View>
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.clearBtn}
                  onPress={() => {
                    dispatch(clearCart());
                    setExpanded(false);
                  }}
                >
                  <Icon name="trash-can-outline" size={16} color={ACCENT} />
                  <Text style={styles.clearText}>Temizle</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.goCartBtn} onPress={goToCart}>
                  <Text style={styles.goCartText}>Sepete Git</Text>
                  <Icon name="chevron-right" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: W,
    backgroundColor: CART_BG,
    borderRadius: 10,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    zIndex: 999,
    overflow: 'hidden',
  },
  inner: { paddingVertical: 6, paddingHorizontal: 4, alignItems: 'center' },
  iconRow: { width: 24, height: 18, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: ACCENT,
    paddingHorizontal: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: { color: '#fff', fontSize: 8, fontWeight: '800', lineHeight: 10 },
  totalText: { fontSize: 10, fontWeight: '800', color: '#111', marginTop: 2 },
  slideArea: { alignItems: 'center', marginTop: 2 },
  thumbnail: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#fff' },
  thumbnailPlaceholder: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#fff' },
  itemName: { fontSize: 7, color: '#111', marginTop: 2, fontWeight: '600', maxWidth: W - 8 },

  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  panel: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '75%',
    minHeight: 280,
    paddingBottom: 12,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  panelTitle: { fontSize: 16, fontWeight: '700', color: '#222' },
  flex: { flex: 1 },
  panelList: { paddingHorizontal: 12, paddingTop: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  rowImage: { width: 50, height: 50, borderRadius: 8, backgroundColor: '#eee' },
  rowInfo: { flex: 1 },
  rowName: { fontSize: 12, color: '#222', fontWeight: '500', lineHeight: 16 },
  rowPrice: { fontSize: 13, fontWeight: '800', color: PRIMARY, marginTop: 4 },
  qtyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 14,
    paddingHorizontal: 4,
  },
  qtyBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: { fontSize: 12, fontWeight: '700', color: '#333', marginHorizontal: 6 },
  deleteBtn: { padding: 4 },

  panelFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
    paddingHorizontal: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  totalLabel: { fontSize: 14, color: '#666', fontWeight: '600' },
  totalValue: { fontSize: 18, fontWeight: '800', color: PRIMARY },
  actionRow: { flexDirection: 'row', gap: 8 },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: ACCENT,
    borderRadius: 8,
  },
  clearText: { color: ACCENT, fontWeight: '700', fontSize: 12 },
  goCartBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY,
    borderRadius: 8,
    paddingVertical: 12,
    gap: 4,
  },
  goCartText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});
