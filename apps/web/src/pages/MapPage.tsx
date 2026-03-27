import { useEffect } from 'react';
import Box from '@mui/material/Box';
import { MapContainer, LocationSearch } from '@features/map/components';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { fetchNearbyStores } from '@store/slices/storeSlice';
import { setCenter } from '@store/slices/mapSlice';
import { useGeolocation } from '@hooks/useGeolocation';
import type { GeoPoint } from '@beacon-bazaar/shared';

export default function MapPage() {
  const dispatch = useAppDispatch();
  const { nearbyStores } = useAppSelector((state) => state.store);
  const { userLocation } = useAppSelector((state) => state.map);
  const { getLocation } = useGeolocation();

  useEffect(() => {
    getLocation();
  }, [getLocation]);

  useEffect(() => {
    if (userLocation) {
      dispatch(
        fetchNearbyStores({
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          radius: 5,
        }),
      );
    }
  }, [userLocation, dispatch]);

  const handleLocationSelect = (location: GeoPoint) => {
    dispatch(setCenter(location));
    dispatch(
      fetchNearbyStores({
        latitude: location.latitude,
        longitude: location.longitude,
        radius: 5,
      }),
    );
  };

  return (
    <Box sx={{ position: 'relative', mx: -3, mt: -3 }}>
      <Box sx={{ position: 'absolute', top: 16, left: 16, zIndex: 10 }}>
        <LocationSearch onLocationSelect={handleLocationSelect} />
      </Box>
      <MapContainer stores={nearbyStores} height="calc(100vh - 120px)" />
    </Box>
  );
}
