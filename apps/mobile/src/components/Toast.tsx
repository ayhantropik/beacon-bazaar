import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Props {
  visible: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  onHide: () => void;
}

const CONFIG: Record<ToastType, { bg: string; icon: string }> = {
  success: { bg: '#16a34a', icon: 'check-circle' },
  error: { bg: '#dc2626', icon: 'alert-circle' },
  info: { bg: '#2563eb', icon: 'information' },
  warning: { bg: '#d97706', icon: 'alert' },
};

export default function Toast({
  visible,
  message,
  type = 'info',
  duration = 2500,
  onHide,
}: Props) {
  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, friction: 7 }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
      const t = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -80,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
        ]).start(() => onHide());
      }, duration);
      return () => clearTimeout(t);
    }
  }, [visible, duration, onHide, translateY, opacity]);

  if (!visible) return null;

  const cfg = CONFIG[type];

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: cfg.bg, transform: [{ translateY }], opacity },
      ]}
      pointerEvents="none"
    >
      <Icon name={cfg.icon as any} size={20} color="#fff" />
      <Text style={styles.text} numberOfLines={2}>
        {message}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    zIndex: 10000,
  },
  text: { color: '#fff', flex: 1, fontSize: 13, fontWeight: '600' },
});
