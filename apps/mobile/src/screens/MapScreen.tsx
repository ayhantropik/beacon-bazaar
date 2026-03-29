import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Dimensions, Platform, Linking } from 'react-native';
import { Card, Text, Button, Searchbar, Chip, ActivityIndicator, Avatar } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { fetchNearbyStores } from '../store/slices/storeSlice';
import apiClient from '../services/api/client';

interface NearbyPlace {
  latitude: number;
  longitude: number;
  address: string;
  displayName: string;
  type: string;
}

export default function MapScreen() {
  const dispatch = useAppDispatch();
  const { nearbyStores, loading } = useAppSelector((s) => s.store);
  const [searchQuery, setSearchQuery] = useState('');
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [activeTab, setActiveTab] = useState<'stores' | 'places'>('stores');

  // Default Istanbul coordinates - replace with real geolocation when library is configured
  const defaultLat = 41.0082;
  const defaultLng = 28.9784;

  useEffect(() => {
    dispatch(fetchNearbyStores({ latitude: defaultLat, longitude: defaultLng, radius: 5 }));
  }, [dispatch]);

  const searchPlaces = async () => {
    if (!searchQuery.trim()) return;
    setLoadingPlaces(true);
    try {
      const res = await apiClient.get('/locations/search', { params: { query: searchQuery } });
      setPlaces(res.data?.data || []);
    } catch {
      // ignore
    } finally {
      setLoadingPlaces(false);
    }
  };

  const fetchNearby = async () => {
    setLoadingPlaces(true);
    try {
      const res = await apiClient.get('/locations/nearby', {
        params: { latitude: defaultLat, longitude: defaultLng, radius: 5 },
      });
      setPlaces(res.data?.data || []);
      setActiveTab('places');
    } catch {
      // ignore
    } finally {
      setLoadingPlaces(false);
    }
  };

  const openInMaps = (lat: number, lng: number, name: string) => {
    const url = Platform.select({
      ios: `maps:0,0?q=${name}@${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}(${name})`,
    });
    if (url) Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <Searchbar
        placeholder="Konum veya adres ara..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        onSubmitEditing={searchPlaces}
        style={styles.searchbar}
      />

      {/* Tabs */}
      <View style={styles.tabs}>
        <Chip
          selected={activeTab === 'stores'}
          onPress={() => setActiveTab('stores')}
          style={styles.tab}
          selectedColor="#2563eb"
        >
          Mağazalar ({nearbyStores.length})
        </Chip>
        <Chip
          selected={activeTab === 'places'}
          onPress={fetchNearby}
          style={styles.tab}
          selectedColor="#2563eb"
        >
          Yakın Yerler
        </Chip>
      </View>

      {/* Content */}
      {loading || loadingPlaces ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      ) : activeTab === 'stores' ? (
        nearbyStores.length === 0 ? (
          <View style={styles.center}>
            <MaterialCommunityIcons name="store-off" size={64} color="#9ca3af" />
            <Text style={styles.emptyText}>Yakınızda mağaza bulunamadı</Text>
            <Button mode="contained" onPress={() => dispatch(fetchNearbyStores({ latitude: defaultLat, longitude: defaultLng, radius: 10 }))}>
              Arama Alanını Genişlet
            </Button>
          </View>
        ) : (
          <FlatList
            data={nearbyStores}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <Card style={styles.card} onPress={() => openInMaps(
                item.location?.latitude || defaultLat,
                item.location?.longitude || defaultLng,
                item.name,
              )}>
                <Card.Title
                  title={item.name}
                  subtitle={item.categories?.join(', ')}
                  left={(props) => (
                    <Avatar.Image {...props} size={40} source={{ uri: item.logo || 'https://via.placeholder.com/40' }} />
                  )}
                  right={() => (
                    item.isVerified ? (
                      <MaterialCommunityIcons name="check-decagram" size={20} color="#2563eb" style={{ marginRight: 16 }} />
                    ) : null
                  )}
                />
                {item.address && (
                  <Card.Content>
                    <View style={styles.addressRow}>
                      <MaterialCommunityIcons name="map-marker" size={16} color="#6b7280" />
                      <Text style={styles.addressText}>{item.address}</Text>
                    </View>
                  </Card.Content>
                )}
                <Card.Actions>
                  <Button
                    mode="outlined"
                    onPress={() => openInMaps(
                      item.location?.latitude || defaultLat,
                      item.location?.longitude || defaultLng,
                      item.name,
                    )}
                    icon="directions"
                    compact
                  >
                    Yol Tarifi
                  </Button>
                  <Button mode="text" compact>
                    Mağazaya Git
                  </Button>
                </Card.Actions>
              </Card>
            )}
          />
        )
      ) : (
        places.length === 0 ? (
          <View style={styles.center}>
            <MaterialCommunityIcons name="map-search" size={64} color="#9ca3af" />
            <Text style={styles.emptyText}>Yakında yer bulunamadı</Text>
          </View>
        ) : (
          <FlatList
            data={places}
            keyExtractor={(_, i) => String(i)}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <Card style={styles.card} onPress={() => openInMaps(item.latitude, item.longitude, item.displayName)}>
                <Card.Title
                  title={item.displayName?.split(',')[0] || 'Bilinmeyen Yer'}
                  subtitle={item.address || item.type}
                  left={(props) => (
                    <Avatar.Icon {...props} size={40} icon="map-marker" style={{ backgroundColor: '#e5e7eb' }} />
                  )}
                />
                <Card.Actions>
                  <Button
                    mode="outlined"
                    onPress={() => openInMaps(item.latitude, item.longitude, item.displayName)}
                    icon="directions"
                    compact
                  >
                    Yol Tarifi
                  </Button>
                </Card.Actions>
              </Card>
            )}
          />
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  searchbar: { margin: 16, elevation: 2 },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  tab: { flex: 1 },
  list: { padding: 16, paddingTop: 0 },
  card: { marginBottom: 12, borderRadius: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  loadingText: { marginTop: 12, color: '#6b7280' },
  emptyText: { fontSize: 16, color: '#6b7280', marginTop: 12, marginBottom: 16, textAlign: 'center' },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addressText: { fontSize: 13, color: '#6b7280', flex: 1 },
});
