import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Avatar, List, Divider, Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logout } from '../store/slices/authSlice';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<Nav>();
  const user = useAppSelector((s) => s.auth.user);

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Avatar.Text
          size={72}
          label={`${user?.name?.[0] || ''}${user?.surname?.[0] || ''}`}
          style={styles.avatar}
        />
        <Text variant="titleLarge" style={styles.name}>{user?.name} {user?.surname}</Text>
        <Text variant="bodyMedium" style={styles.email}>{user?.email}</Text>
      </View>

      <Divider />

      {/* Menu */}
      <List.Section>
        <List.Item
          title="Siparişlerim"
          left={(props) => <List.Icon {...props} icon="package-variant" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => navigation.navigate('Orders')}
        />
        <List.Item
          title="Favorilerim"
          left={(props) => <List.Icon {...props} icon="heart" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => navigation.navigate('Favorites')}
        />
        <List.Item
          title="Adreslerim"
          left={(props) => <List.Icon {...props} icon="map-marker" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
        />
        <List.Item
          title="Bildirimler"
          left={(props) => <List.Icon {...props} icon="bell" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
        />
      </List.Section>

      <Divider />

      <List.Section>
        <List.Item
          title="Ayarlar"
          left={(props) => <List.Icon {...props} icon="cog" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
        />
        <List.Item
          title="Yardım"
          left={(props) => <List.Icon {...props} icon="help-circle" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
        />
      </List.Section>

      <View style={styles.logoutContainer}>
        <Button mode="outlined" textColor="#c0392b" onPress={() => dispatch(logout())} style={styles.logoutButton}>
          Çıkış Yap
        </Button>
      </View>

      <Text variant="bodySmall" style={styles.version}>VeniVidiCoop v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { alignItems: 'center', paddingVertical: 32 },
  avatar: { backgroundColor: '#1a6b52', marginBottom: 12 },
  name: { fontWeight: '700' },
  email: { color: '#999', marginTop: 4 },
  logoutContainer: { padding: 16 },
  logoutButton: { borderColor: '#c0392b', borderRadius: 8 },
  version: { textAlign: 'center', color: '#ccc', paddingBottom: 24, marginTop: 8 },
});
