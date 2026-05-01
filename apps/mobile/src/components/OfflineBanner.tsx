import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';

export default function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  const translateY = useRef(new Animated.Value(-60)).current;

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      const isOffline =
        state.isConnected === false || state.isInternetReachable === false;
      setOffline(isOffline);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: offline ? 0 : -60,
      useNativeDriver: true,
      friction: 8,
    }).start();
  }, [offline, translateY]);

  return (
    <Animated.View
      style={[styles.banner, { transform: [{ translateY }] }]}
      pointerEvents={offline ? 'auto' : 'none'}
    >
      <Icon name="wifi-off" size={16} color="#fff" />
      <Text style={styles.text}>İnternet bağlantısı yok</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 50,
    paddingBottom: 8,
    backgroundColor: '#dc2626',
    zIndex: 9999,
  },
  text: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
