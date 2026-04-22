/**
 * ─── IndoorMap ───────────────────────────────────────────────
 *
 * İstanbul AVM iç harita bileşeni.
 *
 * AKIŞ:
 * 1. "AVM İç Harita" butonuna tıkla → AVM listesi açılır
 * 2. AVM seç → Tam ekran harita + sol panel açılır
 * 3. Haritada:
 *    - Bina dış sınırı kalın yeşil çizgiyle çizilir
 *    - Mağazalar renkli dikdörtgen poligonlarla gösterilir
 *    - Mağaza isimleri etiket olarak gösterilir
 * 4. Mağazaya tıkla (poligon veya listeden):
 *    - Harita o mağazaya zoom yapar
 *    - Sağda ürün paneli açılır
 * 5. Kat değiştir → Poligonlar ve etiketler güncellenir
 *
 * TEKNOLOJİ:
 * - Azure Maps: atlas.Map, atlas.source.DataSource, atlas.layer.PolygonLayer
 * - Saf JavaScript: DOM manipülasyonu yok, sadece Azure Maps API
 * - React: useState, useEffect, useRef, useCallback
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import CloseIcon from '@mui/icons-material/Close';
import BusinessIcon from '@mui/icons-material/Business';
import ElevatorIcon from '@mui/icons-material/Elevator';
import StorefrontIcon from '@mui/icons-material/Storefront';
import SearchIcon from '@mui/icons-material/Search';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import * as atlas from 'azure-maps-control';
import 'azure-maps-control/dist/atlas.min.css';

import { MALLS, type Mall, type StorePolygon } from '../data/malls';
import StorePanel from './StorePanel';

const AZURE_KEY = import.meta.env.VITE_AZURE_MAPS_KEY || '';

// ─────────────────────────────────────────────────────────────
// ANA BİLEŞEN
// ─────────────────────────────────────────────────────────────

export default function IndoorMap() {
  // ─── State ───
  const [isOpen, setIsOpen] = useState(false);           // Bileşen açık mı
  const [selectedMall, setSelectedMall] = useState<Mall | null>(null);  // Seçili AVM
  const [activeFloor, setActiveFloor] = useState(0);     // Aktif kat
  const [selectedStore, setSelectedStore] = useState<StorePolygon | null>(null); // Tıklanan mağaza
  const [searchQuery, setSearchQuery] = useState('');    // AVM arama

  // ─── Refs ───
  const mapContainerRef = useRef<HTMLDivElement>(null);  // Harita DOM elementi
  const mapRef = useRef<atlas.Map | null>(null);         // Azure Maps instance
  const layerCleanupRef = useRef<(() => void) | null>(null); // Temizleme fonksiyonu

  // ─── Haritayı başlat ───
  const initMap = useCallback(() => {
    if (!mapContainerRef.current || mapRef.current || !selectedMall) return;

    // Azure Maps haritası oluştur
    const map = new atlas.Map(mapContainerRef.current, {
      center: selectedMall.center,              // AVM merkezi [lng, lat]
      zoom: 18,                                 // Bina seviyesi zoom
      style: 'satellite_road_labels',           // Uydu + etiket (hibrit)
      language: 'tr-TR',
      authOptions: {
        authType: atlas.AuthenticationType.subscriptionKey,
        subscriptionKey: AZURE_KEY,
      },
      showFeedbackLink: false,
      showLogo: false,
    });

    // Harita hazır olduğunda kontrolleri ekle
    map.events.add('ready', () => {
      map.controls.add(
        new atlas.control.ZoomControl(),
        { position: atlas.ControlPosition.TopRight },
      );
    });

    mapRef.current = map;
  }, [selectedMall]);

  /**
   * ─── Kat planını haritaya çiz ───
   *
   * Bu fonksiyon 3 katman oluşturur:
   * 1. Bina dış sınırı (PolygonLayer + LineLayer)
   * 2. Mağaza poligonları (PolygonLayer + LineLayer + click event)
   * 3. Mağaza isim etiketleri (HtmlMarker)
   */
  const renderFloor = useCallback((floorLevel: number) => {
    const map = mapRef.current;
    if (!map || !selectedMall) return;

    // ── Önceki katmanları temizle ──
    if (layerCleanupRef.current) {
      layerCleanupRef.current();
      layerCleanupRef.current = null;
    }

    // Bu render'da oluşturulan kaynakları takip et (cleanup için)
    const sources: atlas.source.DataSource[] = [];
    const layers: string[] = [];
    const markers: atlas.HtmlMarker[] = [];

    // Aktif kat verisini bul
    const floor = selectedMall.floors.find(f => f.level === floorLevel);
    if (!floor) return;

    const floorId = `${selectedMall.id}-${floorLevel}`; // Benzersiz ID

    // ── KATMAN 1: Bina dış sınırı ──
    const buildingSource = new atlas.source.DataSource();
    map.sources.add(buildingSource);
    sources.push(buildingSource);

    // Bina poligonunu ekle
    buildingSource.add(new atlas.data.Feature(
      new atlas.data.Polygon([selectedMall.outline]),
      {},
    ));

    // Yarı saydam dolgu
    const buildingFill = `bldg-fill-${floorId}`;
    map.layers.add(new atlas.layer.PolygonLayer(buildingSource, buildingFill, {
      fillColor: 'rgba(26, 107, 82, 0.10)',  // Hafif yeşil
    }));
    layers.push(buildingFill);

    // Kalın dış çizgi
    const buildingLine = `bldg-line-${floorId}`;
    map.layers.add(new atlas.layer.LineLayer(buildingSource, buildingLine, {
      strokeColor: '#1a6b52',
      strokeWidth: 4,
    }));
    layers.push(buildingLine);

    // ── KATMAN 2: Mağaza poligonları ──
    const storeSource = new atlas.source.DataSource();
    map.sources.add(storeSource);
    sources.push(storeSource);

    // Her mağazayı DataSource'a ekle
    floor.stores.forEach((store) => {
      const isSelected = selectedStore?.name === store.name;

      storeSource.add(new atlas.data.Feature(
        new atlas.data.Polygon([store.coordinates]),
        {
          // Bu property'ler katmandan okunabilir
          storeName: store.name,
          storeType: store.type,
          // Seçili mağaza koyu, diğerleri yarı saydam
          fillColor: isSelected ? store.color : store.color + '50',
          strokeColor: isSelected ? '#ffffff' : store.color,
        },
      ));
    });

    // Mağaza dolgu katmanı — data-driven renk
    const storeFill = `store-fill-${floorId}`;
    map.layers.add(new atlas.layer.PolygonLayer(storeSource, storeFill, {
      fillColor: ['get', 'fillColor'],  // Her feature'ın kendi rengi
      fillOpacity: 0.75,
    }));
    layers.push(storeFill);

    // Mağaza kenarlık çizgisi
    const storeLine = `store-line-${floorId}`;
    map.layers.add(new atlas.layer.LineLayer(storeSource, storeLine, {
      strokeColor: ['get', 'strokeColor'],
      strokeWidth: 2,
    }));
    layers.push(storeLine);

    // ── Poligon tıklama olayı ──
    // PolygonLayer referansını al ve event ekle
    const polyLayerObj = map.layers.getLayerById(storeFill);
    if (polyLayerObj) {
      const clickHandler = (e: any) => {
        if (!e.shapes || e.shapes.length === 0) return;
        const shape = e.shapes[0];
        const props = typeof shape.getProperties === 'function' ? shape.getProperties() : shape.properties;
        if (props?.storeName) {
          const store = floor.stores.find(s => s.name === props.storeName);
          if (store) setSelectedStore(store);
        }
      };
      map.events.add('click' as any, polyLayerObj, clickHandler);
      map.events.add('mouseover' as any, polyLayerObj, () => { map.getCanvasContainer().style.cursor = 'pointer'; });
      map.events.add('mouseout' as any, polyLayerObj, () => { map.getCanvasContainer().style.cursor = ''; });
    }

    // ── KATMAN 3: Mağaza isim etiketleri ──
    floor.stores.forEach((store) => {
      // Poligonun merkez noktasını hesapla
      const xs = store.coordinates.map(c => c[0]);
      const ys = store.coordinates.map(c => c[1]);
      const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
      const cy = (Math.min(...ys) + Math.max(...ys)) / 2;

      const isSelected = selectedStore?.name === store.name;

      const marker = new atlas.HtmlMarker({
        position: [cx, cy],
        htmlContent: `
          <div style="
            pointer-events: none;
            background: ${isSelected ? '#1a6b52' : 'rgba(255,255,255,0.92)'};
            color: ${isSelected ? '#fff' : '#2c1810'};
            padding: 2px 6px;
            border-radius: 6px;
            font-size: 9px;
            font-weight: 700;
            white-space: nowrap;
            border: 1.5px solid ${isSelected ? '#fff' : 'rgba(0,0,0,0.12)'};
            box-shadow: 0 1px 4px rgba(0,0,0,0.2);
            max-width: 80px;
            overflow: hidden;
            text-overflow: ellipsis;
          ">${store.name}</div>
        `,
        anchor: 'center',
      });
      map.markers.add(marker);
      markers.push(marker);
    });

    // ── Kamerayı bina sınırına fit et ──
    const b = selectedMall.outline;
    const lngs = b.map(c => c[0]);
    const lats = b.map(c => c[1]);
    map.setCamera({
      bounds: [
        Math.min(...lngs) - 0.0005,
        Math.min(...lats) - 0.0005,
        Math.max(...lngs) + 0.0005,
        Math.max(...lats) + 0.0005,
      ],
      padding: 40,
      type: 'fly',
      duration: 800,
    });

    // ── Cleanup fonksiyonunu kaydet ──
    // Bir sonraki renderFloor çağrısında veya unmount'ta çağrılır
    layerCleanupRef.current = () => {
      try {
        // Katmanları kaldır
        layers.forEach(id => { try { map.layers.remove(id); } catch {} });
        // Kaynakları kaldır
        sources.forEach(s => { try { map.sources.remove(s); } catch {} });
        // Marker'ları kaldır
        markers.forEach(m => { try { map.markers.remove(m); } catch {} });
        // Event listener'lar layer kaldırılınca otomatik temizlenir
      } catch {}
    };
  }, [selectedMall, selectedStore]);

  // ─── Effect: Haritayı başlat ───
  useEffect(() => {
    if (!selectedMall || !isOpen) return;
    // DOM render'ı bekle, sonra haritayı başlat
    const timer = setTimeout(() => {
      initMap();
      // Harita ready olduktan sonra kat planını çiz
      setTimeout(() => renderFloor(activeFloor), 300);
    }, 100);
    return () => {
      clearTimeout(timer);
      // Haritayı dispose et
      if (mapRef.current) {
        mapRef.current.dispose();
        mapRef.current = null;
      }
      layerCleanupRef.current = null;
    };
  }, [selectedMall, isOpen]);

  // ─── Effect: Kat değiştiğinde yeniden çiz ───
  useEffect(() => {
    if (selectedMall && mapRef.current) renderFloor(activeFloor);
  }, [activeFloor]);

  // ─── Effect: Seçili mağaza değiştiğinde yeniden çiz (highlight) ───
  useEffect(() => {
    if (selectedMall && mapRef.current) renderFloor(activeFloor);
  }, [selectedStore]);

  // ─── Mağaza listesinden tıklama ───
  const handleStoreClick = (store: StorePolygon) => {
    setSelectedStore(store);
    // Mağazanın merkez koordinatına zoom yap
    const xs = store.coordinates.map(c => c[0]);
    const ys = store.coordinates.map(c => c[1]);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    mapRef.current?.setCamera({
      center: [cx, cy],
      zoom: 20,
      type: 'fly',
      duration: 500,
    });
  };

  // ─── Kapat ───
  const handleClose = () => {
    setSelectedMall(null);
    setSelectedStore(null);
    setIsOpen(false);
    if (mapRef.current) { mapRef.current.dispose(); mapRef.current = null; }
  };

  // ─── Filtrelenmiş AVM listesi ───
  const filteredMalls = searchQuery
    ? MALLS.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : MALLS;

  // Aktif katın verileri
  const currentFloor = selectedMall?.floors.find(f => f.level === activeFloor);

  // ═══════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════

  // ── Durum 1: Kapalı — sadece buton ──
  if (!isOpen) {
    return (
      <Box sx={{ position: 'absolute', bottom: 16, left: 16, zIndex: 1100 }}>
        <Button
          variant="contained"
          startIcon={<BusinessIcon />}
          onClick={() => setIsOpen(true)}
          sx={{
            textTransform: 'none', borderRadius: 2,
            bgcolor: '#1a6b52', fontWeight: 700,
            boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
            '&:hover': { bgcolor: '#0e4a38' },
          }}
        >
          AVM İç Harita ({MALLS.length})
        </Button>
      </Box>
    );
  }

  // ── Durum 2: AVM seçilmemiş — liste ──
  if (!selectedMall) {
    return (
      <Box sx={{ position: 'absolute', bottom: 16, left: 16, zIndex: 1100 }}>
        <Paper elevation={4} sx={{ borderRadius: 2, overflow: 'hidden', width: 360 }}>
          {/* Başlık */}
          <Box sx={{ p: 1.5, background: 'linear-gradient(135deg, #1a6b52, #0e4a38)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="subtitle2" fontWeight={700}>
              <BusinessIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
              İstanbul AVM'leri ({MALLS.length})
            </Typography>
            <IconButton size="small" onClick={handleClose} sx={{ color: '#fff' }}>
              <CloseIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>

          {/* Arama */}
          <Box px={1.5} pt={1.5} pb={0.5}>
            <TextField
              size="small" fullWidth
              placeholder="AVM ara..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18 }} /></InputAdornment>,
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.85rem' } }}
            />
          </Box>

          {/* AVM listesi */}
          <List dense sx={{ maxHeight: 400, overflowY: 'auto', p: 0.5 }}>
            {filteredMalls.map(mall => (
              <ListItem
                key={mall.id}
                component="div"
                onClick={() => {
                  setSelectedMall(mall);
                  setActiveFloor(mall.floors[0]?.level || 0);
                  setSelectedStore(null);
                }}
                sx={{
                  cursor: 'pointer', borderRadius: 1.5, mb: 0.3,
                  '&:hover': { bgcolor: 'rgba(26,107,82,0.08)' },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <BusinessIcon sx={{ color: '#1a6b52' }} fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={mall.name}
                  secondary={
                    <>
                      <Typography component="span" variant="caption" display="block" color="text.secondary">
                        {mall.address}
                      </Typography>
                      <Typography component="span" variant="caption" color="primary" fontWeight={600}>
                        {mall.floors.length} kat · {mall.floors.reduce((s, f) => s + f.stores.length, 0)} mağaza
                      </Typography>
                    </>
                  }
                  primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      </Box>
    );
  }

  // ── Durum 3: AVM seçildi — Tam ekran harita + sol panel ──
  return (
    <Box sx={{ position: 'absolute', inset: 0, zIndex: 1200, display: 'flex' }}>

      {/* ── SOL PANEL ── */}
      <Paper elevation={4} sx={{
        width: { xs: '100%', md: 280 },
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 0,
        flexShrink: 0,
        zIndex: 2,
      }}>
        {/* Başlık */}
        <Box sx={{ p: 1.5, background: 'linear-gradient(135deg, #1a6b52, #0e4a38)', color: '#fff', flexShrink: 0 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={0.5}>
              {/* Geri butonu — AVM listesine dön */}
              <IconButton
                size="small"
                onClick={() => {
                  setSelectedMall(null);
                  setSelectedStore(null);
                  if (mapRef.current) { mapRef.current.dispose(); mapRef.current = null; }
                }}
                sx={{ color: '#fff', p: 0.3 }}
              >
                <ArrowBackIcon sx={{ fontSize: 16 }} />
              </IconButton>
              <Box>
                <Typography variant="subtitle2" fontWeight={700} lineHeight={1.2}>{selectedMall.name}</Typography>
                <Typography variant="caption" sx={{ opacity: 0.7, fontSize: '0.55rem' }}>{selectedMall.address}</Typography>
              </Box>
            </Box>
            <IconButton size="small" onClick={handleClose} sx={{ color: '#fff' }}>
              <CloseIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
        </Box>

        {/* Kat seçici */}
        <Box sx={{ px: 1, py: 1, bgcolor: '#f8f9fa', borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
          <Box display="flex" alignItems="center" gap={0.4} flexWrap="wrap">
            <ElevatorIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
            {selectedMall.floors.map(floor => (
              <Chip
                key={floor.level}
                label={floor.name}
                size="small"
                variant={activeFloor === floor.level ? 'filled' : 'outlined'}
                color={activeFloor === floor.level ? 'primary' : 'default'}
                onClick={() => {
                  setActiveFloor(floor.level);
                  setSelectedStore(null);
                }}
                sx={{
                  cursor: 'pointer',
                  fontWeight: activeFloor === floor.level ? 700 : 400,
                  fontSize: '0.65rem',
                  height: 24,
                }}
              />
            ))}
          </Box>
        </Box>

        <Divider />

        {/* Mağaza listesi */}
        <Box sx={{ overflowY: 'auto', flexGrow: 1, px: 0.5 }}>
          <Box px={1} pt={1}>
            <Typography variant="caption" fontWeight={600} color="text.secondary" display="flex" alignItems="center" gap={0.5} mb={0.5}>
              <StorefrontIcon sx={{ fontSize: 14 }} />
              {currentFloor?.name} — {currentFloor?.stores.length || 0} mağaza
            </Typography>
          </Box>
          <List dense sx={{ p: 0 }}>
            {currentFloor?.stores.map(store => {
              const isSelected = selectedStore?.name === store.name;
              return (
                <ListItem
                  key={store.name}
                  component="div"
                  onClick={() => handleStoreClick(store)}
                  sx={{
                    cursor: 'pointer', borderRadius: 1.5, mb: 0.2,
                    border: isSelected ? '2px solid #1a6b52' : '1px solid transparent',
                    bgcolor: isSelected ? 'rgba(26,107,82,0.06)' : 'transparent',
                    '&:hover': { bgcolor: 'rgba(26,107,82,0.04)' },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 22 }}>
                    <Box sx={{
                      width: 10, height: 10, borderRadius: 1,
                      bgcolor: store.color, border: '1px solid rgba(0,0,0,0.1)',
                    }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={store.name}
                    secondary={store.type}
                    primaryTypographyProps={{
                      variant: 'body2',
                      fontWeight: isSelected ? 700 : 500,
                      fontSize: '0.76rem',
                    }}
                    secondaryTypographyProps={{
                      variant: 'caption',
                      fontSize: '0.6rem',
                      textTransform: 'capitalize',
                    }}
                  />
                </ListItem>
              );
            })}
          </List>
        </Box>
      </Paper>

      {/* ── HARİTA ── */}
      <Box sx={{ flexGrow: 1, position: 'relative' }}>
        <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

        {/* Kat bilgisi overlay */}
        <Box sx={{
          position: 'absolute', top: 12, left: 12,
          bgcolor: '#1a6b52', color: '#fff',
          px: 2, py: 0.5, borderRadius: 2,
          fontWeight: 700, fontSize: '0.8rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}>
          {selectedMall.name} — {currentFloor?.name}
        </Box>
      </Box>

      {/* ── ÜRÜN PANELİ (sağ kenar) ── */}
      {selectedStore && (
        <StorePanel
          storeName={selectedStore.name}
          storeType={selectedStore.type}
          onClose={() => setSelectedStore(null)}
        />
      )}
    </Box>
  );
}
