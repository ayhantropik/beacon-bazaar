import { useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from 'react';
import Box from '@mui/material/Box';
import * as atlas from 'azure-maps-control';
import 'azure-maps-control/dist/atlas.min.css';
import { useAppSelector, useAppDispatch } from '@store/hooks';
import { setCenter, setZoom } from '@store/slices/mapSlice';
import type { Store } from '@beacon-bazaar/shared';
import MapControls from './MapControls';
import apiClient from '@services/api/client';

const AZURE_MAPS_KEY = import.meta.env.VITE_AZURE_MAPS_KEY || '';

// Azure Maps stil eşlemeleri
const STYLE_MAP: Record<string, string> = {
  default: 'road',
  satellite: 'satellite',
  hybrid: 'satellite_road_labels',
  terrain: 'road',
  dark: 'grayscale_dark',
};

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface MapContainerProps {
  stores?: Store[];
  onStoreClick?: (store: Store) => void;
  highlightedStoreIds?: string[];
  searchMarker?: { lat: number; lng: number; name: string } | null;
  showControls?: boolean;
  height?: string;
  onBoundsChange?: (center: { latitude: number; longitude: number }, radius: number) => void;
}

export interface MapContainerHandle {
  flyTo: (lat: number, lng: number, zoom?: number) => void;
  showIndoorMarkers: (markers: Array<{ lat: number; lng: number; name: string; icon: string; color: string; category: string }>) => void;
  clearIndoorMarkers: () => void;
}

const productCache = new Map<string, { name: string; price: number; salePrice: number | null; thumbnail: string }[]>();

export default forwardRef<MapContainerHandle, MapContainerProps>(function MapContainer(
  { stores = [], onStoreClick, highlightedStoreIds = [], searchMarker, showControls = true, height = 'calc(100vh - 180px)', onBoundsChange },
  ref,
) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<atlas.Map | null>(null);
  const markersRef = useRef<atlas.HtmlMarker[]>([]);
  const userMarkerRef = useRef<atlas.HtmlMarker | null>(null);
  const searchMarkerObjRef = useRef<atlas.HtmlMarker | null>(null);
  const popupRef = useRef<atlas.Popup | null>(null);
  const indoorMarkersRef = useRef<atlas.HtmlMarker[]>([]);
  const hasInitialFit = useRef(false);
  const onStoreClickRef = useRef(onStoreClick);
  onStoreClickRef.current = onStoreClick;
  const storesRef = useRef(stores);
  storesRef.current = stores;
  const onBoundsChangeRef = useRef(onBoundsChange);
  onBoundsChangeRef.current = onBoundsChange;
  const dispatch = useAppDispatch();
  const { center, zoom, userLocation, mapStyle } = useAppSelector((state) => state.map);

  useImperativeHandle(ref, () => ({
    flyTo: (lat: number, lng: number, z = 16) => {
      mapInstanceRef.current?.setCamera({
        center: [lng, lat],
        zoom: z,
        type: 'fly',
        duration: 1500,
      });
    },
    showIndoorMarkers: (markers) => {
      const map = mapInstanceRef.current;
      if (!map) return;
      // Eski indoor marker'ları temizle
      indoorMarkersRef.current.forEach(m => map.markers.remove(m));
      indoorMarkersRef.current = [];

      markers.forEach(m => {
        const marker = new atlas.HtmlMarker({
          position: [m.lng, m.lat],
          htmlContent: `<div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;">
            <div style="background:${m.color};color:#fff;width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;border:2px solid #fff;box-shadow:0 2px 12px rgba(0,0,0,0.3);">${m.icon}</div>
            <div style="background:#fff;color:#333;font-size:10px;font-weight:700;padding:1px 6px;border-radius:6px;margin-top:2px;box-shadow:0 1px 4px rgba(0,0,0,0.2);white-space:nowrap;max-width:120px;overflow:hidden;text-overflow:ellipsis;">${m.name}</div>
          </div>`,
          anchor: 'bottom',
        });
        map.events.add('click', marker, () => {
          const popup = new atlas.Popup({
            position: [m.lng, m.lat],
            pixelOffset: [0, -50],
            content: `<div style="padding:10px;font-family:'DM Sans',sans-serif;min-width:140px;">
              <div style="font-size:20px;text-align:center;margin-bottom:4px;">${m.icon}</div>
              <div style="font-weight:700;font-size:14px;text-align:center;">${m.name}</div>
              <div style="font-size:11px;color:#6b5b4e;text-align:center;margin-top:2px;">${m.category}</div>
            </div>`,
          });
          map.popups.add(popup);
          popup.open(map);
        });
        map.markers.add(marker);
        indoorMarkersRef.current.push(marker);
      });
    },
    clearIndoorMarkers: () => {
      const map = mapInstanceRef.current;
      if (!map) return;
      indoorMarkersRef.current.forEach(m => map.markers.remove(m));
      indoorMarkersRef.current = [];
    },
  }));

  const handleStyleChange = useCallback((styleId: string) => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const azureStyle = STYLE_MAP[styleId] || 'road';
    map.setStyle({ style: azureStyle });
  }, []);

  const fetchStoreProducts = useCallback((storeId: string, storeName: string, position: atlas.data.Position) => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const cached = productCache.get(storeId);
    if (cached) { showProductPopup(map, storeName, cached, position); return; }

    apiClient.get(`/stores/${storeId}/products?limit=5`)
      .then((res) => {
        const data = res.data?.data || res.data || [];
        const products = data.map((p: any) => ({ name: p.name, price: p.price, salePrice: p.salePrice, thumbnail: p.thumbnail }));
        productCache.set(storeId, products);
        showProductPopup(map, storeName, products, position);
      })
      .catch(() => {});
  }, []);

  const showProductPopup = (map: atlas.Map, storeName: string, products: { name: string; price: number; salePrice: number | null; thumbnail: string }[], position: atlas.data.Position) => {
    if (popupRef.current) { popupRef.current.close(); }
    if (products.length === 0) return;

    const productItems = products.slice(0, 4).map((p) => {
      const price = p.salePrice
        ? `<span style="text-decoration:line-through;color:#999;font-size:10px;">${Number(p.price).toFixed(0)}₺</span> <b style="color:#c0392b;">${Number(p.salePrice).toFixed(0)}₺</b>`
        : `<b>${Number(p.price).toFixed(0)}₺</b>`;
      return `<div style="display:flex;align-items:center;gap:6px;padding:3px 0;border-bottom:1px solid #f0f0f0;">
        <img src="${p.thumbnail}" onerror="this.style.display='none'" style="width:32px;height:32px;border-radius:4px;object-fit:cover;flex-shrink:0;background:#f5f5f5;"/>
        <div style="flex:1;min-width:0;">
          <div style="font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${p.name}</div>
          <div style="font-size:11px;">${price}</div>
        </div>
      </div>`;
    }).join('');

    const html = `<div style="font-family:'DM Sans',sans-serif;min-width:180px;max-width:220px;padding:8px 10px;">
      <div style="font-weight:700;font-size:13px;margin-bottom:4px;color:#2c1810;">🏪 ${storeName}</div>
      <div style="font-size:10px;color:#6b5b4e;margin-bottom:4px;">Ürünler</div>
      ${productItems}
      ${products.length > 4 ? `<div style="font-size:10px;color:#1a6b52;text-align:center;padding:4px 0;">+${products.length - 4} ürün daha...</div>` : ''}
    </div>`;

    const popup = new atlas.Popup({
      content: html,
      position,
      pixelOffset: [0, -40],
      closeButton: false,
    });
    map.popups.add(popup);
    popup.open(map);
    popupRef.current = popup;
  };

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = new atlas.Map(mapRef.current, {
      center: [center.longitude, center.latitude],
      zoom,
      style: STYLE_MAP[mapStyle] || 'satellite_road_labels',
      language: 'tr-TR',
      authOptions: {
        authType: atlas.AuthenticationType.subscriptionKey,
        subscriptionKey: AZURE_MAPS_KEY,
      },
      showFeedbackLink: false,
      showLogo: false,
    });

    map.events.add('ready', () => {
      // Zoom kontrolleri
      map.controls.add([
        new atlas.control.ZoomControl(),
        new atlas.control.CompassControl(),
        new atlas.control.StyleControl({ mapStyles: ['road', 'satellite', 'satellite_road_labels', 'grayscale_dark'] }),
      ], { position: atlas.ControlPosition.TopRight });
    });

    map.events.add('moveend', () => {
      const cam = map.getCamera();
      const c = cam.center;
      if (c) {
        dispatch(setCenter({ latitude: c[1], longitude: c[0] }));
        const bounds = cam.bounds;
        if (bounds) {
          const ne = atlas.data.BoundingBox.getNorthEast(bounds);
          const sw = atlas.data.BoundingBox.getSouthWest(bounds);
          const diagKm = haversineDistance(ne[1], ne[0], sw[1], sw[0]);
          const radius = Math.min(Math.ceil(diagKm / 2), 50);
          onBoundsChangeRef.current?.({ latitude: c[1], longitude: c[0] }, radius);
        }
      }
    });

    map.events.add('zoomend', () => {
      const cam = map.getCamera();
      if (cam.zoom != null) dispatch(setZoom(cam.zoom));
    });

    mapInstanceRef.current = map;
    return () => { map.dispose(); mapInstanceRef.current = null; hasInitialFit.current = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Eski marker'ları kaldır
    markersRef.current.forEach((m) => map.markers.remove(m));
    markersRef.current = [];
    const highlightSet = new Set(highlightedStoreIds);

    stores.forEach((store) => {
      const lat = store.location?.latitude || (store as any).latitude;
      const lng = store.location?.longitude || (store as any).longitude;
      if (!lat || !lng) return;

      const isHighlighted = highlightSet.has(store.id);
      const isVerified = store.isVerified;
      const color = isHighlighted ? '#d4882e' : isVerified ? '#1a6b52' : '#6b7280';
      const size = isHighlighted ? 44 : 36;
      const emoji = isHighlighted ? '🛍️' : '🏪';
      const emojiSize = isHighlighted ? 18 : 14;
      const pulse = isHighlighted ? `<div style="position:absolute;top:-4px;left:-4px;width:${size + 8}px;height:${size + 8}px;border-radius:50%;background:rgba(212,136,46,0.25);animation:pulse-ring 1.5s infinite;"></div>` : '';

      const markerHtml = `<div style="position:relative;width:${size}px;height:${size}px;cursor:pointer;">${pulse}<div style="width:${size}px;height:${size}px;border-radius:50% 50% 50% 0;background:${color};border:3px solid white;box-shadow:0 2px ${isHighlighted ? '12' : '8'}px rgba(0,0,0,${isHighlighted ? '0.4' : '0.3'});transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;"><span style="transform:rotate(45deg);color:white;font-size:${emojiSize}px;font-weight:bold;">${emoji}</span></div></div>`;

      const marker = new atlas.HtmlMarker({
        position: [lng, lat],
        htmlContent: markerHtml,
        anchor: 'bottom',
      });

      map.events.add('click', marker, () => {
        if (popupRef.current) popupRef.current.close();
        // Store popup
        const popupHtml = `<div style="min-width:180px;font-family:'DM Sans',sans-serif;padding:8px 10px;">
          <div style="display:flex;align-items:center;gap:4px;margin-bottom:4px;">
            <strong style="font-size:14px;">${store.name}</strong>
            ${isVerified ? '<span style="color:#1a6b52;font-size:13px;">✓</span>' : ''}
          </div>
          <div style="font-size:12px;color:#6b5b4e;">⭐ ${(store as any).ratingAverage || 0} (${(store as any).ratingCount || 0})</div>
          <div style="font-size:11px;color:#888;">${store.categories?.slice(0, 3).join(' · ') || ''}</div>
        </div>`;

        const popup = new atlas.Popup({
          content: popupHtml,
          position: [lng, lat],
          pixelOffset: [0, -size],
        });
        map.popups.add(popup);
        popup.open(map);
        popupRef.current = popup;
        onStoreClickRef.current?.(store);
      });

      // Hover: ürün popup'ı
      let hoverTimer: ReturnType<typeof setTimeout>;
      map.events.add('mouseover', marker, () => {
        hoverTimer = setTimeout(() => {
          fetchStoreProducts(store.id, store.name, [lng, lat]);
        }, 300);
      });
      map.events.add('mouseout', marker, () => {
        clearTimeout(hoverTimer);
        setTimeout(() => {
          if (popupRef.current) { popupRef.current.close(); popupRef.current = null; }
        }, 300);
      });

      map.markers.add(marker);
      markersRef.current.push(marker);
    });

    // İlk yükleme: kameraya fit
    if (!hasInitialFit.current && stores.length > 0) {
      hasInitialFit.current = true;
      if (userLocation) {
        map.setCamera({
          center: [userLocation.longitude, userLocation.latitude],
          zoom: 14,
          type: 'fly',
          duration: 1000,
        });
      } else {
        const validStores = stores.filter((s) => {
          const lat2 = s.location?.latitude || (s as any).latitude;
          const lng2 = s.location?.longitude || (s as any).longitude;
          return lat2 && lng2;
        });
        if (validStores.length > 0) {
          const positions = validStores.map((s) => {
            const lat2 = s.location?.latitude || (s as any).latitude;
            const lng2 = s.location?.longitude || (s as any).longitude;
            return [lng2, lat2] as atlas.data.Position;
          });
          const bbox = atlas.data.BoundingBox.fromPositions(positions);
          map.setCamera({
            bounds: bbox,
            padding: 60,
            maxZoom: 14,
            type: 'fly',
            duration: 1000,
          });
        }
      }
    }
  }, [stores, userLocation, highlightedStoreIds, fetchStoreProducts]);

  // Search marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (searchMarkerObjRef.current) { map.markers.remove(searchMarkerObjRef.current); searchMarkerObjRef.current = null; }
    if (!searchMarker) return;

    const searchHtml = `<div style="display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 3px 6px rgba(0,0,0,0.4));">
      <div style="position:absolute;bottom:0;width:16px;height:16px;border-radius:50%;background:rgba(192,57,43,0.3);animation:searchPulse 2s ease-out infinite;"></div>
      <svg viewBox="0 0 24 36" width="36" height="48" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="#c0392b"/>
        <circle cx="12" cy="11" r="5" fill="white"/>
      </svg>
      <div style="background:white;color:#c0392b;font-size:11px;font-weight:700;padding:2px 8px;border-radius:10px;white-space:nowrap;margin-top:2px;box-shadow:0 1px 4px rgba(0,0,0,0.3);max-width:180px;overflow:hidden;text-overflow:ellipsis;">${searchMarker.name}</div>
    </div>`;

    const marker = new atlas.HtmlMarker({
      position: [searchMarker.lng, searchMarker.lat],
      htmlContent: searchHtml,
      anchor: 'bottom',
    });
    map.markers.add(marker);
    searchMarkerObjRef.current = marker;

    return () => {
      if (searchMarkerObjRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.markers.remove(searchMarkerObjRef.current);
        searchMarkerObjRef.current = null;
      }
    };
  }, [searchMarker]);

  // User location marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !userLocation) return;
    if (userMarkerRef.current) map.markers.remove(userMarkerRef.current);

    const userHtml = `<div style="position:relative;width:24px;height:24px;">
      <div style="position:absolute;inset:0;border-radius:50%;background:rgba(26,107,82,0.2);animation:pulse-ring 2s ease-out infinite;"></div>
      <div style="position:absolute;top:4px;left:4px;width:16px;height:16px;border-radius:50%;background:#1a6b52;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>
    </div>`;

    const marker = new atlas.HtmlMarker({
      position: [userLocation.longitude, userLocation.latitude],
      htmlContent: userHtml,
      anchor: 'center',
    });
    map.markers.add(marker);
    userMarkerRef.current = marker;

    if (!hasInitialFit.current) {
      hasInitialFit.current = true;
      map.setCamera({
        center: [userLocation.longitude, userLocation.latitude],
        zoom: 14,
        type: 'fly',
        duration: 1000,
      });
    }
  }, [userLocation]);

  return (
    <Box sx={{ position: 'relative', width: '100%', height, borderRadius: 3, overflow: 'hidden' }}>
      <style>{`
        @keyframes pulse-ring { 0% { transform: scale(0.8); opacity: 1; } 100% { transform: scale(1.6); opacity: 0; } }
        @keyframes searchPulse { 0% { width: 16px; height: 16px; opacity: 1; } 100% { width: 60px; height: 60px; opacity: 0; margin-left: -22px; margin-bottom: -22px; } }
        .atlas-map { font-family: 'DM Sans', sans-serif !important; }
      `}</style>
      <Box ref={mapRef} sx={{ width: '100%', height: '100%' }} />
      {showControls && <MapControls map={mapInstanceRef.current as any} onStyleChange={handleStyleChange} />}
    </Box>
  );
});
