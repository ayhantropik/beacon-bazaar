import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';

export default function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  const translateY = useRef(new Animated.Value(-60)).current;

  useEffect(() => {
    // iOS NetInfo zaman zaman yanlış offline raporluyor.
    // Çift teyit: state false → 5sn bekle → tekrar fetch ile sınama, hâlâ
    // başarısızsa banner göster. Pozitif state geldiğinde anında gizle.
    let pendingTimer: ReturnType<typeof setTimeout> | null = null;

    const clearPending = () => {
      if (pendingTimer) {
        clearTimeout(pendingTimer);
        pendingTimer = null;
      }
    };

    const unsub = NetInfo.addEventListener((state) => {
      if (state.isConnected === false) {
        clearPending();
        pendingTimer = setTimeout(async () => {
          try {
            const res = await fetch('https://www.gstatic.com/generate_204', {
              method: 'HEAD',
            });
            // 204 = network reachable, NetInfo yanlış raporladı
            if (res.status === 204 || res.ok) {
              setOffline(false);
              return;
            }
            setOffline(true);
          } catch {
            setOffline(true);
          }
        }, 5000);
      } else {
        clearPending();
        setOffline(false);
      }
    });
    return () => {
      clearPending();
      unsub();
    };
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
