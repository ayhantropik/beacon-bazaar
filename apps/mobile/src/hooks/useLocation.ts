import { useState, useCallback } from 'react';
import type { GeoPoint } from '@beacon-bazaar/shared';
import { useAppDispatch } from '../store/hooks';
import { setUserLocation, setLocationError, setLocationLoading } from '../store/slices/mapSlice';
import { locationService } from '../services/location/LocationService';

export function useLocation() {
  const dispatch = useAppDispatch();
  const [location, setLocation] = useState<GeoPoint | null>(null);

  const getLocation = useCallback(async () => {
    try {
      dispatch(setLocationLoading(true));
      const hasPermission = await locationService.requestPermissions();
      if (!hasPermission) {
        dispatch(setLocationError('Konum izni verilmedi'));
        return;
      }
      const currentLocation = await locationService.getCurrentLocation();
      setLocation(currentLocation);
      dispatch(setUserLocation(currentLocation));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Konum alınamadı';
      dispatch(setLocationError(message));
    }
  }, [dispatch]);

  return { location, getLocation };
}
