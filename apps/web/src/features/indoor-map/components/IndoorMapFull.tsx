/**
 * ─── IndoorMapFull ────────────────────────────────────────────
 *
 * TÜM PARÇALARI BİRLEŞTİREN ANA BİLEŞEN
 *
 * Ne yapar:
 *   1. Harita açılır (Azure Maps, uydu görünümü)
 *   2. AVM binasının dış sınırı çizilir
 *   3. Kat planı görseli haritaya hizalı yerleştirilir (ImageLayer)
 *   4. Mağazalar poligon olarak gösterilir (PolygonLayer)
 *   5. Mağazaya tıklanınca popup ile isim gösterilir
 *   6. Kat değiştirilebilir
 *
 * Kullanılan dosyalar:
 *   data/affine.ts    → computeAffine, imageToGeo (piksel↔geo dönüşüm)
 *   data/cevahir.ts   → AVM verileri (anchor, kat, mağaza poligonları)
 *
 * Erişim: /indoor-map-full
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Slider from '@mui/material/Slider';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import ElevatorIcon from '@mui/icons-material/Elevator';
import CloseIcon from '@mui/icons-material/Close';
import BusinessIcon from '@mui/icons-material/Business';
import * as atlas from 'azure-maps-control';
import 'azure-maps-control/dist/atlas.min.css';

// ─── Kendi modüllerimiz ───
import { computeAffine, imageToGeo, type AffineTransform } from '../data/affine';
import { ANCHOR, OUTLINE, CENTER, NAME, ADDRESS, FLOORS, type FloorStore } from '../data/cevahir';

const AZURE_KEY = import.meta.env.VITE_AZURE_MAPS_KEY || '';

// ═══════════════════════════════════════════════════
// YARDIMCI FONKSİYONLAR
// ═══════════════════════════════════════════════════

/**
 * Piksel poligonunu geo poligona dönüştürür.
 * Poligonu otomatik kapatır (ilk nokta = son nokta).
 */
function polygonToGeo(
  transform: AffineTransform,
  pixelPolygon: [number, number][],
): [number, number][] {
  const geo = pixelPolygon.map(([x, y]) => imageToGeo(transform, x, y));
  // Kapatma kontrolü
  const f = geo[0], l = geo[geo.length - 1];
  if (f[0] !== l[0] || f[1] !== l[1]) geo.push([...f] as [number, number]);
  return geo;
}

/** Poligonun merkez noktasını hesaplar */
function polygonCenter(coords: [number, number][]): [number, number] {
  const lngs = coords.map(c => c[0]);
  const lats = coords.map(c => c[1]);
  return [
    (Math.min(...lngs) + Math.max(...lngs)) / 2,
    (Math.min(...lats) + Math.max(...lats)) / 2,
  ];
}

// ═══════════════════════════════════════════════════
// ANA BİLEŞEN
// ═══════════════════════════════════════════════════

interface IndoorMapFullProps {
  /** Dışarıdan açılma kontrolü */
  externalOpen?: boolean;
  /** Dışarıdan kapatma callback */
  onExternalClose?: () => void;
}

export default function IndoorMapFull({ externalOpen, onExternalClose }: IndoorMapFullProps = {}) {
  // ─── State ───
  const [activeFloor, setActiveFloor] = useState(FLOORS[0].level);
  const [opacity, setOpacity] = useState(0.7);
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const isOpen = externalOpen || manualOpen;

  // ─── Refs ───
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<atlas.Map | null>(null);
  const transformRef = useRef<AffineTransform | null>(null);

  // Cleanup takibi — her renderFloor'da eski katmanlar silinir
  const cleanupRef = useRef<(() => void) | null>(null);

  // ─── Aktif kat verisi ───
  const floor = FLOORS.find(f => f.level === activeFloor) || FLOORS[0];

  // ═══════════════════════════════════════════════
  // ADIM 1: Transform hesapla (bir kez)
  // ═══════════════════════════════════════════════

  useEffect(() => {
    const anchor = floor.anchor || ANCHOR;
    transformRef.current = computeAffine(anchor);
  }, [floor]);

  // ═══════════════════════════════════════════════
  // ADIM 2: Haritayı başlat (bir kez)
  // ═══════════════════════════════════════════════

  useEffect(() => {
    if (!isOpen || !mapDivRef.current || mapRef.current) return;

    const map = new atlas.Map(mapDivRef.current, {
      center: CENTER,
      zoom: 18,
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
  }, [isOpen]);

  // ═══════════════════════════════════════════════
  // ADIM 3: Kat planını çiz
  //         (kat değiştiğinde veya mağaza seçildiğinde)
  // ═══════════════════════════════════════════════

  const renderFloor = useCallback(() => {
    const map = mapRef.current;
    const transform = transformRef.current;
    if (!map || !transform) return;

    // ── Önceki katmanları temizle ──
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }

    // Bu render'da oluşturulan her şeyi takip et
    const sources: atlas.source.DataSource[] = [];
    const layerIds: string[] = [];
    const markers: atlas.HtmlMarker[] = [];
    let imageLayer: atlas.layer.ImageLayer | null = null;

    const floorId = `f${floor.level}`;

    // ── PARÇA 1: Bina dış sınırı ──
    const outlineSrc = new atlas.source.DataSource();
    map.sources.add(outlineSrc);
    sources.push(outlineSrc);

    outlineSrc.add(new atlas.data.Feature(
      new atlas.data.Polygon([OUTLINE]), {},
    ));

    // Dolgu
    const bFill = `outline-fill-${floorId}`;
    map.layers.add(new atlas.layer.PolygonLayer(outlineSrc, bFill, {
      fillColor: 'rgba(26,107,82,0.08)',
    }));
    layerIds.push(bFill);

    // Çizgi
    const bLine = `outline-line-${floorId}`;
    map.layers.add(new atlas.layer.LineLayer(outlineSrc, bLine, {
      strokeColor: '#1a6b52',
      strokeWidth: 3,
    }));
    layerIds.push(bLine);

    // ── PARÇA 2: Kat planı görseli (ImageLayer) ──
    if (floor.imageUrl) {
      // Görselin 4 köşesini geo'ya çevir
      const W = floor.imageWidth;
      const H = floor.imageHeight;
      const topLeft = imageToGeo(transform, 0, 0);
      const topRight = imageToGeo(transform, W, 0);
      const bottomRight = imageToGeo(transform, W, H);
      const bottomLeft = imageToGeo(transform, 0, H);

      imageLayer = new atlas.layer.ImageLayer({
        url: floor.imageUrl,
        coordinates: [topLeft, topRight, bottomRight, bottomLeft],
        opacity,
      }, `image-${floorId}`);
      map.layers.add(imageLayer);
    }

    // ── PARÇA 3: Mağaza poligonları ──
    const storeSrc = new atlas.source.DataSource();
    map.sources.add(storeSrc);
    sources.push(storeSrc);

    floor.stores.forEach(store => {
      // Piksel poligonu → geo poligon
      const geoCoords = polygonToGeo(transform, store.polygon);
      const isSelected = selectedStore === store.name;

      storeSrc.add(new atlas.data.Feature(
        new atlas.data.Polygon([geoCoords]),
        {
          name: store.name,
          type: store.type,
          fillColor: isSelected ? store.color : store.color + '55',
          strokeColor: isSelected ? '#ffffff' : store.color,
          strokeWidth: isSelected ? 3 : 1.5,
        },
      ));
    });

    // Dolgu
    const sFill = `store-fill-${floorId}`;
    map.layers.add(new atlas.layer.PolygonLayer(storeSrc, sFill, {
      fillColor: ['get', 'fillColor'],
      fillOpacity: 0.7,
    }));
    layerIds.push(sFill);

    // Kenarlık
    const sLine = `store-line-${floorId}`;
    map.layers.add(new atlas.layer.LineLayer(storeSrc, sLine, {
      strokeColor: ['get', 'strokeColor'],
      strokeWidth: ['get', 'strokeWidth'],
    }));
    layerIds.push(sLine);

    // ── PARÇA 4: Tıklama → popup ──
    const layerObj = map.layers.getLayerById(sFill);
    if (layerObj) {
      map.events.add('click' as any, layerObj, (e: any) => {
        if (!e.shapes?.length) return;
        const props = e.shapes[0].getProperties?.() || e.shapes[0].properties;
        if (!props?.name) return;

        // Mağazayı seç
        setSelectedStore(props.name);

        // Popup göster
        const popup = new atlas.Popup({
          position: e.position,
          content: `
            <div style="padding:10px 14px; font-family:'DM Sans',sans-serif;">
              <div style="font-weight:800; font-size:14px; color:#2c1810;">
                ${props.name}
              </div>
              <div style="font-size:11px; color:#6b5b4e; margin-top:3px; text-transform:capitalize;">
                ${props.type} · ${NAME}
              </div>
            </div>
          `,
          pixelOffset: [0, -8],
        });
        map.popups.add(popup);
        popup.open(map);
      });

      // Hover cursor
      map.events.add('mouseover' as any, layerObj, () => {
        map.getCanvasContainer().style.cursor = 'pointer';
      });
      map.events.add('mouseout' as any, layerObj, () => {
        map.getCanvasContainer().style.cursor = '';
      });
    }

    // ── PARÇA 5: Mağaza isim etiketleri ──
    floor.stores.forEach(store => {
      const geoCoords = polygonToGeo(transform, store.polygon);
      const [cx, cy] = polygonCenter(geoCoords);
      const isSelected = selectedStore === store.name;

      const marker = new atlas.HtmlMarker({
        position: [cx, cy],
        htmlContent: `<div style="
          pointer-events:none;
          background:${isSelected ? '#1a6b52' : 'rgba(255,255,255,0.92)'};
          color:${isSelected ? '#fff' : '#2c1810'};
          padding:2px 6px; border-radius:5px;
          font-size:9px; font-weight:700;
          white-space:nowrap;
          border:1px solid ${isSelected ? '#fff' : 'rgba(0,0,0,0.1)'};
          box-shadow:0 1px 3px rgba(0,0,0,0.15);
          max-width:80px; overflow:hidden; text-overflow:ellipsis;
        ">${store.name}</div>`,
        anchor: 'center',
      });
      map.markers.add(marker);
      markers.push(marker);
    });

    // ── Kamerayı bina sınırına fit et ──
    const oLngs = OUTLINE.map(c => c[0]);
    const oLats = OUTLINE.map(c => c[1]);
    map.setCamera({
      bounds: [
        Math.min(...oLngs) - 0.0003,
        Math.min(...oLats) - 0.0003,
        Math.max(...oLngs) + 0.0003,
        Math.max(...oLats) + 0.0003,
      ],
      padding: 40,
      type: 'fly',
      duration: 800,
    });

    // ── Cleanup kaydet ──
    cleanupRef.current = () => {
      layerIds.forEach(id => { try { map.layers.remove(id); } catch {} });
      sources.forEach(s => { try { map.sources.remove(s); } catch {} });
      markers.forEach(m => { try { map.markers.remove(m); } catch {} });
      if (imageLayer) { try { map.layers.remove(imageLayer); } catch {} }
      map.popups.clear();
    };
  }, [floor, opacity, selectedStore]);

  // ── Effect: Render tetikle ──
  useEffect(() => {
    if (!mapRef.current) return;
    const timer = setTimeout(renderFloor, 200);
    return () => clearTimeout(timer);
  }, [renderFloor]);

  // ── Sol panelden mağaza tıklama ──
  const handleStoreClick = (store: FloorStore) => {
    setSelectedStore(store.name);
    const transform = transformRef.current;
    if (!transform || !mapRef.current) return;
    const geo = polygonToGeo(transform, store.polygon);
    const [cx, cy] = polygonCenter(geo);
    mapRef.current.setCamera({
      center: [cx, cy], zoom: 20, type: 'fly', duration: 500,
    });
  };

  // ═══════════════════════════════════════════════
  const handleClose = () => {
    setManualOpen(false);
    onExternalClose?.();
    if (mapRef.current) { mapRef.current.dispose(); mapRef.current = null; }
  };

  // RENDER
  // ═══════════════════════════════════════════════

  // Kapalıyken — sadece buton
  if (!isOpen) {
    return (
      <Box sx={{ position: 'absolute', bottom: 16, left: 16, zIndex: 1100 }}>
        <Button
          variant="contained"
          startIcon={<BusinessIcon />}
          onClick={() => setManualOpen(true)}
          sx={{
            textTransform: 'none', borderRadius: 2,
            bgcolor: '#1a6b52', fontWeight: 700,
            boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
            '&:hover': { bgcolor: '#0e4a38' },
          }}
        >
          AVM İç Harita
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'absolute', inset: 0, zIndex: 1200, display: 'flex' }}>

      {/* ── SOL PANEL ── */}
      <Paper elevation={3} sx={{
        width: 280, flexShrink: 0,
        display: 'flex', flexDirection: 'column',
        borderRadius: 0,
      }}>
        {/* Başlık */}
        <Box sx={{ p: 2, background: 'linear-gradient(135deg,#1a6b52,#0e4a38)', color: '#fff' }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>{NAME}</Typography>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>{ADDRESS}</Typography>
            </Box>
            <IconButton size="small" onClick={handleClose} sx={{ color: '#fff' }}>
              <CloseIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
        </Box>

        {/* Kat seçici */}
        <Box sx={{ px: 1.5, py: 1, bgcolor: '#f9f9f9', borderBottom: '1px solid #eee' }}>
          <Box display="flex" alignItems="center" gap={0.5} flexWrap="wrap">
            <ElevatorIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            {FLOORS.map(f => (
              <Chip
                key={f.level}
                label={f.name}
                size="small"
                variant={activeFloor === f.level ? 'filled' : 'outlined'}
                color={activeFloor === f.level ? 'primary' : 'default'}
                onClick={() => { setActiveFloor(f.level); setSelectedStore(null); }}
                sx={{ cursor: 'pointer', fontWeight: activeFloor === f.level ? 700 : 400, fontSize: '0.65rem', height: 24 }}
              />
            ))}
          </Box>
        </Box>

        {/* Opasite */}
        {floor.imageUrl && (
          <Box sx={{ px: 2, py: 1, borderBottom: '1px solid #eee' }}>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="caption" color="text.secondary">Kat planı:</Typography>
              <Slider size="small" min={0} max={1} step={0.05} value={opacity}
                onChange={(_, v) => setOpacity(v as number)} sx={{ flex: 1 }} />
              <Typography variant="caption" fontWeight={600}>{Math.round(opacity * 100)}%</Typography>
            </Box>
          </Box>
        )}

        <Divider />

        {/* Mağaza listesi */}
        <Box sx={{ overflowY: 'auto', flexGrow: 1 }}>
          <Typography variant="caption" fontWeight={600} color="text.secondary" px={2} pt={1} display="block">
            {floor.name} — {floor.stores.length} mağaza
          </Typography>
          <List dense>
            {floor.stores.map(store => {
              const isSelected = selectedStore === store.name;
              return (
                <ListItem
                  key={store.name}
                  component="div"
                  onClick={() => handleStoreClick(store)}
                  sx={{
                    cursor: 'pointer', mx: 0.5, borderRadius: 1.5,
                    border: isSelected ? '2px solid #1a6b52' : '1px solid transparent',
                    bgcolor: isSelected ? 'rgba(26,107,82,0.06)' : 'transparent',
                    '&:hover': { bgcolor: 'rgba(26,107,82,0.04)' },
                  }}
                >
                  <Box sx={{
                    width: 10, height: 10, borderRadius: 1, mr: 1, flexShrink: 0,
                    bgcolor: store.color, border: '1px solid rgba(0,0,0,0.1)',
                  }} />
                  <ListItemText
                    primary={store.name}
                    secondary={store.type}
                    primaryTypographyProps={{ fontSize: '0.78rem', fontWeight: isSelected ? 700 : 500 }}
                    secondaryTypographyProps={{ fontSize: '0.6rem', textTransform: 'capitalize' }}
                  />
                </ListItem>
              );
            })}
          </List>
        </Box>
      </Paper>

      {/* ── HARİTA ── */}
      <Box sx={{ flexGrow: 1, position: 'relative' }}>
        <div ref={mapDivRef} style={{ width: '100%', height: '100%' }} />

        {/* Kat etiketi */}
        <Box sx={{
          position: 'absolute', top: 12, left: 12,
          bgcolor: '#1a6b52', color: '#fff',
          px: 2, py: 0.5, borderRadius: 2,
          fontWeight: 700, fontSize: '0.8rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}>
          {NAME} — {floor.name}
        </Box>

        {/* Seçili mağaza bilgisi */}
        {selectedStore && (
          <Paper sx={{
            position: 'absolute', bottom: 16, left: 16,
            p: 1.5, borderRadius: 2, display: 'flex',
            alignItems: 'center', gap: 1,
          }}>
            <Typography variant="body2" fontWeight={700}>{selectedStore}</Typography>
            <IconButton size="small" onClick={() => setSelectedStore(null)}>
              <CloseIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Paper>
        )}
      </Box>
    </Box>
  );
}
