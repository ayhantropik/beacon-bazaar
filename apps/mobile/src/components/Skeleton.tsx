import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, type ViewStyle } from 'react-native';

interface Props {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle | ViewStyle[];
}

export default function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = 4,
  style,
}: Props) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.9,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.base,
        { width: width as any, height, borderRadius, opacity },
        style as any,
      ]}
    />
  );
}

export function SkeletonProductCard() {
  return (
    <View style={styles.cardWrap}>
      <Skeleton height={120} borderRadius={8} />
      <Skeleton height={11} style={{ marginTop: 8 }} />
      <Skeleton height={11} width="70%" style={{ marginTop: 6 }} />
      <View style={styles.cardFooter}>
        <Skeleton height={14} width={60} />
        <Skeleton height={24} width={24} borderRadius={12} />
      </View>
    </View>
  );
}

export function SkeletonStoreCard() {
  return (
    <View style={styles.storeCard}>
      <Skeleton height={100} borderRadius={0} />
      <View style={{ padding: 8 }}>
        <Skeleton height={13} />
        <Skeleton height={11} width="60%" style={{ marginTop: 6 }} />
      </View>
    </View>
  );
}

export function SkeletonRow() {
  return (
    <View style={styles.row}>
      <Skeleton width={48} height={48} borderRadius={24} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Skeleton height={14} width="70%" />
        <Skeleton height={12} width="50%" style={{ marginTop: 6 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { backgroundColor: '#e5e7eb' },
  cardWrap: {
    width: '31.33%',
    margin: '1%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 6,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  storeCard: {
    width: 160,
    marginHorizontal: 4,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f9f9f9',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
  },
});
