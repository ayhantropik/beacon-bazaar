/**
 * ─── FloorOverlay ────────────────────────────────────────────
 *
 * Kat planı görselini Azure Maps üzerine yerleştirir.
 *
 * AKIŞ:
 *   1. Kat planı görseli yüklenir (URL)
 *   2. Görselin piksel boyutları okunur (naturalWidth, naturalHeight)
 *   3. Affine transform ile 4 köşenin geo koordinatları hesaplanır:
 *        sol-üst (0, 0)           → [lon1, lat1]
 *        sağ-üst (width, 0)      → [lon2, lat2]
 *        sağ-alt (width, height)  → [lon3, lat3]
 *        sol-alt (0, height)      → [lon4, lat4]
 *   4. atlas.layer.ImageLayer ile görsel haritaya yerleştirilir
 *   5. Mağazalar tıklanabilir PolygonLayer olarak üste eklenir
 *
 * GİRDİLER:
 *   - imageUrl: Kat planı görsel URL'si
 *   - anchorData: 3 anchor noktası { image, geo }
 *   - stores: Mağaza listesi { name, imageX, imageY }
 *
 * Bu bileşen kendi başına çalışan, bağımsız bir demo'dur.
 * /floor-overlay adresinden erişilebilir.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Slider from '@mui/material/Slider';
import Button from '@mui/material/Button';
import * as atlas from 'azure-maps-control';
import 'azure-maps-control/dist/atlas.min.css';

import {
  computeAffine,
  imageToGeo,
  transformStores,
  type AnchorData,
  type AffineTransform,
} from '../data/affine';

const AZURE_KEY = import.meta.env.VITE_AZURE_MAPS_KEY || '';

// ─────────────────────────────────────────────────
// DUMMY VERİ: Cevahir AVM kat planı
// Bu veriler AnchorTool ile üretilmiş gibi simüle edilir
// ─────────────────────────────────────────────────

/**
 * Dummy anchor verisi.
 * Gerçek kullanımda AnchorTool'dan çıkan JSON buraya yapıştırılır.
 *
 * Görselin 3 köşesi ve haritadaki karşılıkları:
 *   Sol-üst piksel (0, 0)       → harita (28.99180, 41.06410)
 *   Sağ-üst piksel (609, 0)     → harita (28.99420, 41.06410)
 *   Sol-alt piksel (0, 707)     → harita (28.99180, 41.06150)
 */
const DUMMY_ANCHOR: AnchorData = {
  image: [[0, 0], [609, 0], [0, 707]],
  geo: [[28.99180, 41.06410], [28.99420, 41.06410], [28.99180, 41.06150]],
};

/** Dummy mağazalar — görsel (piksel) koordinatlarıyla */
const DUMMY_STORES = [
  { name: 'Koton', imageX: 120, imageY: 200, type: 'giyim', color: '#3b82f6' },
  { name: 'Zara', imageX: 300, imageY: 150, type: 'giyim', color: '#8b5cf6' },
  { name: 'Starbucks', imageX: 450, imageY: 350, type: 'kafe', color: '#f59e0b' },
  { name: 'Pandora', imageX: 400, imageY: 280, type: 'aksesuar', color: '#f97316' },
  { name: 'D&R', imageX: 350, imageY: 420, type: 'kitap', color: '#a855f7' },
  { name: 'Watsons', imageX: 280, imageY: 380, type: 'kozmetik', color: '#ec4899' },
  { name: 'Swarovski', imageX: 250, imageY: 250, type: 'aksesuar', color: '#f97316' },
  { name: 'Flo', imageX: 180, imageY: 350, type: 'giyim', color: '#3b82f6' },
];

/** Dummy kat planı görseli — gerçekte AVM'nin kat planı resmi olacak */
const DUMMY_IMAGE = 'https://www.forumistanbul.com.tr/media/image/katv5123.jpg';

// ─────────────────────────────────────────────────
// BİLEŞEN
// ─────────────────────────────────────────────────

export default function FloorOverlay() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<atlas.Map | null>(null);
  const imageLayerRef = useRef<atlas.layer.ImageLayer | null>(null);

  const [opacity, setOpacity] = useState(0.75);
  const [showStores, setShowStores] = useState(true);
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [transform, setTransform] = useState<AffineTransform | null>(null);

  // ─── Adım 1: Transform hesapla ───
  useEffect(() => {
    try {
      const t = computeAffine(DUMMY_ANCHOR);
      setTransform(t);
      console.log('Affine transform hesaplandı:', t);

      // Test: 4 köşeyi dönüştür
      console.log('Sol-üst (0,0):', imageToGeo(t, 0, 0));
      console.log('Sağ-üst (609,0):', imageToGeo(t, 609, 0));
      console.log('Sağ-alt (609,707):', imageToGeo(t, 609, 707));
      console.log('Sol-alt (0,707):', imageToGeo(t, 0, 707));
    } catch (err) {
      console.error('Transform hesaplama hatası:', err);
    }
  }, []);

  // ─── Adım 2: Haritayı başlat ───
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new atlas.Map(mapContainerRef.current, {
      center: DUMMY_ANCHOR.geo[0], // İlk anchor noktası
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

    map.events.add('ready', () => {
      map.controls.add(
        new atlas.control.ZoomControl(),
        { position: atlas.ControlPosition.TopRight },
      );
    });

    mapRef.current = map;
    return () => { map.dispose(); mapRef.current = null; };
  }, []);

  // ─── Adım 3: Image overlay + mağaza poligonları çiz ───
  const renderOverlay = useCallback(() => {
    const map = mapRef.current;
    if (!map || !transform) return;

    // ── 3a: Görselin 4 köşesinin geo koordinatlarını hesapla ──
    //
    //   Görsel:                    Harita:
    //   (0,0)───────(W,0)         [lon1,lat1]───[lon2,lat2]
    //     │                │           │                │
    //     │    KAT PLANI   │    →      │    OVERLAY     │
    //     │                │           │                │
    //   (0,H)───────(W,H)         [lon4,lat4]───[lon3,lat3]
    //
    //   W = görselin piksel genişliği (609)
    //   H = görselin piksel yüksekliği (707)

    const W = 609;  // Dummy görsel boyutu
    const H = 707;

    const topLeft = imageToGeo(transform, 0, 0);      // sol-üst
    const topRight = imageToGeo(transform, W, 0);      // sağ-üst
    const bottomRight = imageToGeo(transform, W, H);   // sağ-alt
    const bottomLeft = imageToGeo(transform, 0, H);    // sol-alt

    console.log('Image Layer köşeleri:');
    console.log('  Sol-üst:', topLeft);
    console.log('  Sağ-üst:', topRight);
    console.log('  Sağ-alt:', bottomRight);
    console.log('  Sol-alt:', bottomLeft);

    // ── 3b: Eski image layer varsa kaldır ──
    if (imageLayerRef.current) {
      try { map.layers.remove(imageLayerRef.current); } catch {}
    }

    // ── 3c: ImageLayer oluştur ve haritaya ekle ──
    //
    //   atlas.layer.ImageLayer parametreleri:
    //     url: Görsel URL'si
    //     coordinates: 4 köşe [sol-üst, sağ-üst, sağ-alt, sol-alt]
    //                  Her biri [longitude, latitude] formatında
    //     opacity: 0-1 arası saydamlık
    //
    const imageLayer = new atlas.layer.ImageLayer({
      url: DUMMY_IMAGE,
      coordinates: [topLeft, topRight, bottomRight, bottomLeft],
      opacity,
    }, 'floor-plan-overlay');

    map.layers.add(imageLayer);
    imageLayerRef.current = imageLayer;

    // ── 3d: Mağaza poligonları (opsiyonel, showStores = true ise) ──
    if (showStores) {
      // transformStores: piksel koordinatlı mağazaları geo koordinatlı poligonlara dönüştürür
      const geoStores = transformStores(transform, DUMMY_STORES, 50, 40);

      const storeSource = new atlas.source.DataSource();
      map.sources.add(storeSource);

      geoStores.forEach(store => {
        storeSource.add(new atlas.data.Feature(
          new atlas.data.Polygon([store.coordinates]),
          {
            storeName: store.name,
            fillColor: selectedStore === store.name ? store.color : store.color + '60',
            strokeColor: selectedStore === store.name ? '#fff' : store.color,
          },
        ));
      });

      // Poligon dolgu
      const fillId = 'store-poly-fill';
      map.layers.add(new atlas.layer.PolygonLayer(storeSource, fillId, {
        fillColor: ['get', 'fillColor'],
        fillOpacity: 0.7,
      }));

      // Poligon kenarlık
      map.layers.add(new atlas.layer.LineLayer(storeSource, 'store-poly-line', {
        strokeColor: ['get', 'strokeColor'],
        strokeWidth: 2,
      }));

      // Tıklama
      const layer = map.layers.getLayerById(fillId);
      if (layer) {
        map.events.add('click' as any, layer, (e: any) => {
          if (e.shapes?.length) {
            const props = e.shapes[0].getProperties?.() || e.shapes[0].properties;
            if (props?.storeName) setSelectedStore(props.storeName);
          }
        });
        map.events.add('mouseover' as any, layer, () => {
          map.getCanvasContainer().style.cursor = 'pointer';
        });
        map.events.add('mouseout' as any, layer, () => {
          map.getCanvasContainer().style.cursor = '';
        });
      }

      // İsim etiketleri
      geoStores.forEach(store => {
        const xs = store.coordinates.map(c => c[0]);
        const ys = store.coordinates.map(c => c[1]);
        const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
        const cy = (Math.min(...ys) + Math.max(...ys)) / 2;

        map.markers.add(new atlas.HtmlMarker({
          position: [cx, cy],
          htmlContent: `<div style="
            pointer-events:none; background:rgba(255,255,255,0.9);
            padding:1px 5px; border-radius:4px; font-size:8px;
            font-weight:700; white-space:nowrap; box-shadow:0 1px 3px rgba(0,0,0,0.2);
          ">${store.name}</div>`,
          anchor: 'center',
        }));
      });
    }

    // Kamerayı overlay'e fit et
    map.setCamera({
      bounds: [topLeft[0] - 0.001, bottomLeft[1] - 0.001, topRight[0] + 0.001, topLeft[1] + 0.001],
      padding: 50,
      type: 'fly',
      duration: 1000,
    });
  }, [transform, opacity, showStores, selectedStore]);

  // Transform hazır olduğunda ve harita ready olduğunda render
  useEffect(() => {
    if (!transform || !mapRef.current) return;
    // Haritanın tamamen yüklenmesini bekle
    const timer = setTimeout(() => renderOverlay(), 500);
    return () => clearTimeout(timer);
  }, [transform, renderOverlay]);

  // ════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>

      {/* ── Kontrol paneli ── */}
      <Paper elevation={2} sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0, zIndex: 10 }}>
        <Typography variant="subtitle2" fontWeight={700}>🗺️ Floor Plan Overlay Demo</Typography>

        {/* Opasite slider */}
        <Box display="flex" alignItems="center" gap={1} sx={{ minWidth: 200 }}>
          <Typography variant="caption" color="text.secondary">Opasite:</Typography>
          <Slider
            size="small" min={0} max={1} step={0.05}
            value={opacity}
            onChange={(_, v) => setOpacity(v as number)}
            sx={{ flex: 1 }}
          />
          <Typography variant="caption" fontWeight={600}>{Math.round(opacity * 100)}%</Typography>
        </Box>

        {/* Mağaza göster/gizle */}
        <Chip
          label={showStores ? 'Mağazalar: Açık' : 'Mağazalar: Kapalı'}
          color={showStores ? 'primary' : 'default'}
          size="small"
          onClick={() => setShowStores(!showStores)}
          sx={{ cursor: 'pointer' }}
        />

        {/* Seçili mağaza */}
        {selectedStore && (
          <Chip
            label={`Seçili: ${selectedStore}`}
            color="success" size="small"
            onDelete={() => setSelectedStore(null)}
          />
        )}

        <Button size="small" variant="outlined" onClick={renderOverlay} sx={{ textTransform: 'none' }}>
          Yeniden Çiz
        </Button>
      </Paper>

      {/* ── Harita ── */}
      <Box sx={{ flex: 1, position: 'relative' }}>
        <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

        {/* Bilgi kutusu */}
        <Paper sx={{
          position: 'absolute', bottom: 16, left: 16,
          p: 1.5, borderRadius: 2, maxWidth: 300,
          bgcolor: 'rgba(255,255,255,0.95)',
        }}>
          <Typography variant="caption" fontWeight={700} display="block" mb={0.5}>
            Nasıl çalışır:
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" lineHeight={1.4}>
            1. AnchorTool ile 3 nokta seçilir<br/>
            2. Affine transform hesaplanır<br/>
            3. Görselin 4 köşesi geo koordinata çevrilir<br/>
            4. ImageLayer ile haritaya yerleştirilir<br/>
            5. Mağazalar piksel→geo dönüşümüyle PolygonLayer olarak eklenir
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
}
