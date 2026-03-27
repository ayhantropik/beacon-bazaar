import { useEffect, useRef, useCallback, useState } from 'react';
import Box from '@mui/material/Box';
import { useAppSelector, useAppDispatch } from '@store/hooks';
import { setCenter, setZoom, selectMarker } from '@store/slices/mapSlice';
import type { GeoPoint, Store } from '@beacon-bazaar/shared';
import { env } from '@config/env';
import MapControls from './MapControls';
import StoreInfoPanel from './StoreInfoPanel';

interface MapContainerProps {
  stores?: Store[];
  onStoreClick?: (store: Store) => void;
  showControls?: boolean;
  height?: string;
}

export default function MapContainer({
  stores = [],
  onStoreClick,
  showControls = true,
  height = 'calc(100vh - 180px)',
}: MapContainerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const dispatch = useAppDispatch();
  const { center, zoom, userLocation, selectedMarkerId, mapStyle } = useAppSelector(
    (state) => state.map,
  );
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);

  const initMap = useCallback(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = new google.maps.Map(mapRef.current, {
      center: { lat: center.latitude, lng: center.longitude },
      zoom,
      styles: mapStyle === 'default' ? defaultMapStyles : [],
      mapTypeId: mapStyle === 'satellite' ? 'satellite' : mapStyle === 'terrain' ? 'terrain' : 'roadmap',
      disableDefaultUI: true,
      zoomControl: false,
      fullscreenControl: false,
      streetViewControl: false,
    });

    map.addListener('center_changed', () => {
      const newCenter = map.getCenter();
      if (newCenter) {
        dispatch(setCenter({ latitude: newCenter.lat(), longitude: newCenter.lng() }));
      }
    });

    map.addListener('zoom_changed', () => {
      dispatch(setZoom(map.getZoom() || 13));
    });

    mapInstanceRef.current = map;
  }, [center.latitude, center.longitude, zoom, mapStyle, dispatch]);

  useEffect(() => {
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${env.googleMapsApiKey}&libraries=places,geometry`;
      script.async = true;
      script.defer = true;
      script.onload = initMap;
      document.head.appendChild(script);
    } else {
      initMap();
    }
  }, [initMap]);

  // Update markers when stores change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    // Add store markers
    stores.forEach((store) => {
      const marker = new google.maps.Marker({
        position: { lat: store.location.latitude, lng: store.location.longitude },
        map,
        title: store.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: store.isVerified ? '#2563eb' : '#6b7280',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          scale: 10,
        },
      });

      marker.addListener('click', () => {
        dispatch(selectMarker(store.id));
        setSelectedStore(store);
        onStoreClick?.(store);
      });

      markersRef.current.push(marker);
    });
  }, [stores, dispatch, onStoreClick]);

  // Show user location marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !userLocation) return;

    new google.maps.Marker({
      position: { lat: userLocation.latitude, lng: userLocation.longitude },
      map,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: '#3b82f6',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 3,
        scale: 8,
      },
      zIndex: 999,
    });
  }, [userLocation]);

  return (
    <Box sx={{ position: 'relative', width: '100%', height, borderRadius: 3, overflow: 'hidden' }}>
      <Box ref={mapRef} sx={{ width: '100%', height: '100%' }} />
      {showControls && <MapControls map={mapInstanceRef.current} />}
      {selectedStore && (
        <StoreInfoPanel
          store={selectedStore}
          onClose={() => {
            setSelectedStore(null);
            dispatch(selectMarker(null));
          }}
        />
      )}
    </Box>
  );
}

const defaultMapStyles: google.maps.MapTypeStyle[] = [
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] },
];
