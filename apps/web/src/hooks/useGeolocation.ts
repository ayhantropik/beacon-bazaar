import { useState, useEffect, useCallback } from 'react';
import type { GeoPoint } from '@beacon-bazaar/shared';

interface GeolocationState {
  location: GeoPoint | null;
  error: string | null;
  isLoading: boolean;
}

export function useGeolocation(autoFetch = false) {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    error: null,
    isLoading: false,
  });

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({ ...prev, error: 'Tarayıcınız konum servislerini desteklemiyor' }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          location: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
          error: null,
          isLoading: false,
        });
      },
      (error) => {
        const messages: Record<number, string> = {
          1: 'Konum izni reddedildi',
          2: 'Konum bilgisi alınamadı',
          3: 'Konum isteği zaman aşımına uğradı',
        };
        setState({
          location: null,
          error: messages[error.code] || 'Konum alınamadı',
          isLoading: false,
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    );
  }, []);

  useEffect(() => {
    if (autoFetch) {
      getLocation();
    }
  }, [autoFetch, getLocation]);

  return { ...state, getLocation };
}
