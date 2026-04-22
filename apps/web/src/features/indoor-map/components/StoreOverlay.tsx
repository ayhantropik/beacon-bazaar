/**
 * ─── StoreOverlay ────────────────────────────────────────────
 *
 * Kat planı üzerindeki mağaza poligonlarını Azure Maps'e çizer.
 *
 * GİRDİ:
 *   Mağazalar piksel koordinatlı poligon olarak verilir:
 *   { name: "Zara", polygon: [[x1,y1], [x2,y2], [x3,y3], ...] }
 *
 *   Bu koordinatlar affine transform ile geo'ya dönüştürülür,
 *   sonra haritada PolygonLayer olarak çizilir.
 *
 * ÇIKTI:
 *   - Haritada renkli, tıklanabilir mağaza poligonları
 *   - Tıklanınca popup ile mağaza ismi
 *   - Hover'da cursor pointer
 *
 * DEMO: /store-overlay adresinden erişilebilir
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import * as atlas from 'azure-maps-control';
import 'azure-maps-control/dist/atlas.min.css';
import { computeAffine, imageToGeo, type AnchorData, type AffineTransform } from '../data/affine';

const AZURE_KEY = import.meta.env.VITE_AZURE_MAPS_KEY || '';

// ─────────────────────────────────────────────────
// VERİ FORMATI
// ─────────────────────────────────────────────────

/** Piksel koordinatlı mağaza poligonu */
interface StoreData {
  name: string;
  /** Poligon köşeleri — piksel [x, y] — kapalı ring olması GEREKMEZ */
  polygon: [number, number][];
}

// ─────────────────────────────────────────────────
// DUMMY VERİ
// ─────────────────────────────────────────────────

/** Anchor: kat planı görselinin 3 köşesi + haritadaki karşılıkları */
const ANCHOR: AnchorData = {
  image: [[0, 0], [609, 0], [0, 707]],
  geo: [[28.99180, 41.06410], [28.99420, 41.06410], [28.99180, 41.06150]],
};

/** Mağazalar — piksel koordinatlı poligonlar */
const STORES: StoreData[] = [
  {
    name: 'Zara',
    polygon: [[250, 100], [360, 100], [360, 180], [250, 180]],
  },
  {
    name: 'Koton',
    polygon: [[80, 220], [180, 220], [180, 310], [80, 310]],
  },
  {
    name: 'Starbucks',
    polygon: [[420, 310], [520, 310], [520, 390], [420, 390]],
  },
  {
    name: 'D&R',
    polygon: [[350, 420], [460, 420], [460, 500], [350, 500]],
  },
  {
    name: 'Watsons',
    polygon: [[300, 340], [400, 340], [400, 410], [300, 410]],
  },
  {
    name: 'Swarovski',
    polygon: [[260, 240], [360, 240], [360, 310], [260, 310]],
  },
  {
    name: 'Pandora',
    polygon: [[390, 220], [490, 220], [490, 300], [390, 300]],
  },
  {
    name: 'Flo',
    polygon: [[160, 350], [260, 350], [260, 430], [160, 430]],
  },
  {
    name: 'LC Waikiki',
    polygon: [[100, 100], [230, 100], [230, 200], [100, 200]],
  },
  {
    name: 'Boyner',
    polygon: [[400, 100], [550, 100], [550, 200], [400, 200]],
  },
];

/** Renk paleti — her mağaza sırayla renk alır */
const COLORS = [
  '#3b82f6', '#8b5cf6', '#f59e0b', '#a855f7',
  '#ec4899', '#f97316', '#10b981', '#ef4444',
  '#6366f1', '#14b8a6', '#0ea5e9', '#84cc16',
];

// ─────────────────────────────────────────────────
// ANA FONKSİYON: Piksel poligonları geo'ya dönüştür ve çiz
// ─────────────────────────────────────────────────

/**
 * Piksel koordinatlı mağaza poligonunu geo koordinata dönüştürür.
 *
 * @param transform  Affine transform katsayıları
 * @param store      Piksel koordinatlı mağaza
 * @returns          Geo koordinatlı poligon [lng, lat][]
 */
function storePixelToGeo(
  transform: AffineTransform,
  store: StoreData,
): [number, number][] {
  // Her köşeyi dönüştür
  const geoCoords = store.polygon.map(([x, y]) => imageToGeo(transform, x, y));

  // Poligonu kapat (ilk nokta = son nokta)
  const first = geoCoords[0];
  const last = geoCoords[geoCoords.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    geoCoords.push([...first] as [number, number]);
  }

  return geoCoords;
}

// ─────────────────────────────────────────────────
// BİLEŞEN
// ─────────────────────────────────────────────────

export default function StoreOverlay() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<atlas.Map | null>(null);
  const popupRef = useRef<atlas.Popup | null>(null);
  const [info, setInfo] = useState('Mağazaya tıklayın');

  // ── Haritayı başlat ve mağazaları çiz ──
  const initAndRender = useCallback(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // 1) Affine transform hesapla
    const transform = computeAffine(ANCHOR);

    // 2) Haritayı oluştur
    const map = new atlas.Map(mapContainerRef.current, {
      center: ANCHOR.geo[0],
      zoom: 17,
      style: 'satellite_road_labels',
      language: 'tr-TR',
      authOptions: {
        authType: atlas.AuthenticationType.subscriptionKey,
        subscriptionKey: AZURE_KEY,
      },
      showFeedbackLink: false,
      showLogo: false,
    });
    mapRef.current = map;

    map.events.add('ready', () => {
      // Zoom kontrolü
      map.controls.add(
        new atlas.control.ZoomControl(),
        { position: atlas.ControlPosition.TopRight },
      );

      // 3) DataSource oluştur — tüm mağazalar buraya eklenir
      const source = new atlas.source.DataSource();
      map.sources.add(source);

      // 4) Her mağazanın piksel poligonunu geo'ya dönüştür ve ekle
      STORES.forEach((store, i) => {
        const geoPolygon = storePixelToGeo(transform, store);
        const color = COLORS[i % COLORS.length];

        source.add(new atlas.data.Feature(
          new atlas.data.Polygon([geoPolygon]),
          {
            name: store.name,
            color,
          },
        ));
      });

      // 5) PolygonLayer — dolgu
      const fillLayer = new atlas.layer.PolygonLayer(source, 'stores-fill', {
        fillColor: ['get', 'color'],
        fillOpacity: 0.5,
      });
      map.layers.add(fillLayer);

      // 6) LineLayer — kenarlık
      map.layers.add(new atlas.layer.LineLayer(source, 'stores-line', {
        strokeColor: ['get', 'color'],
        strokeWidth: 2.5,
      }));

      // 7) Tıklama — popup göster
      const fillLayerObj = map.layers.getLayerById('stores-fill');
      if (fillLayerObj) {
        map.events.add('click' as any, fillLayerObj, (e: any) => {
          if (!e.shapes?.length) return;

          const props = e.shapes[0].getProperties?.()
            || e.shapes[0].properties;
          if (!props?.name) return;

          // Mevcut popup'ı kapat
          if (popupRef.current) popupRef.current.close();

          // Yeni popup oluştur
          const popup = new atlas.Popup({
            position: e.position,
            content: `
              <div style="
                padding: 10px 16px;
                font-family: 'DM Sans', sans-serif;
              ">
                <div style="
                  font-weight: 800;
                  font-size: 15px;
                  color: #2c1810;
                ">${props.name}</div>
                <div style="
                  font-size: 11px;
                  color: #6b5b4e;
                  margin-top: 4px;
                ">📍 Cevahir AVM · 1. Kat</div>
              </div>
            `,
            pixelOffset: [0, -10],
          });
          map.popups.add(popup);
          popup.open(map);
          popupRef.current = popup;

          setInfo(`Seçili: ${props.name}`);
        });

        // 8) Hover — cursor pointer
        map.events.add('mouseover' as any, fillLayerObj, () => {
          map.getCanvasContainer().style.cursor = 'pointer';
        });
        map.events.add('mouseout' as any, fillLayerObj, () => {
          map.getCanvasContainer().style.cursor = '';
        });
      }

      // 9) İsim etiketleri
      STORES.forEach((store) => {
        const geoPolygon = storePixelToGeo(transform, store);
        // Merkez hesapla
        const lngs = geoPolygon.map(c => c[0]);
        const lats = geoPolygon.map(c => c[1]);
        const cx = (Math.min(...lngs) + Math.max(...lngs)) / 2;
        const cy = (Math.min(...lats) + Math.max(...lats)) / 2;

        map.markers.add(new atlas.HtmlMarker({
          position: [cx, cy],
          htmlContent: `<div style="
            pointer-events: none;
            background: rgba(255,255,255,0.92);
            color: #2c1810;
            padding: 2px 6px;
            border-radius: 5px;
            font-size: 9px;
            font-weight: 700;
            white-space: nowrap;
            border: 1px solid rgba(0,0,0,0.1);
            box-shadow: 0 1px 3px rgba(0,0,0,0.15);
          ">${store.name}</div>`,
          anchor: 'center',
        }));
      });

      // 10) Kamerayı tüm mağazalara fit et
      const allCoords = STORES.flatMap(s => storePixelToGeo(transform, s));
      const allLng = allCoords.map(c => c[0]);
      const allLat = allCoords.map(c => c[1]);
      map.setCamera({
        bounds: [
          Math.min(...allLng) - 0.0005,
          Math.min(...allLat) - 0.0005,
          Math.max(...allLng) + 0.0005,
          Math.max(...allLat) + 0.0005,
        ],
        padding: 50,
        type: 'fly',
        duration: 1000,
      });
    });
  }, []);

  useEffect(() => {
    initAndRender();
    return () => {
      if (mapRef.current) { mapRef.current.dispose(); mapRef.current = null; }
    };
  }, [initAndRender]);

  // ── RENDER ──
  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Üst bar */}
      <Paper elevation={2} sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 2, zIndex: 10 }}>
        <Typography variant="subtitle1" fontWeight={700}>🏪 Mağaza Poligon Overlay</Typography>
        <Typography variant="body2" color="text.secondary">{info}</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
          {STORES.length} mağaza · piksel→geo affine dönüşüm
        </Typography>
      </Paper>

      {/* Harita */}
      <Box sx={{ flex: 1 }}>
        <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
      </Box>
    </Box>
  );
}
