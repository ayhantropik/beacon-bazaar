/**
 * ─── PolygonEditor ───────────────────────────────────────────
 *
 * Kat planı görseli üzerinde mağaza poligonlarını ELLE çizme aracı.
 *
 * AKIŞ:
 *   1. Kat planı görseli yüklenir (URL)
 *   2. Kullanıcı görselde tıklayarak poligon köşelerini belirler
 *   3. Mağaza adı ve kat bilgisi girilir
 *   4. Kaydet → JSON verisine eklenir
 *   5. Sağdaki Azure Maps'te affine transform ile gerçek konumda gösterilir
 *
 * HİÇBİR OTOMATİK TAHMİN YOKTUR.
 * Sadece kullanıcının çizdiği veri kullanılır.
 *
 * ÇIKTI:
 *   { name: "Zara", floor: 1, polygon: [[x,y],[x,y],...] }
 *
 * ERİŞİM: /polygon-editor
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Chip from '@mui/material/Chip';
import MenuItem from '@mui/material/MenuItem';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import UndoIcon from '@mui/icons-material/Undo';
import CheckIcon from '@mui/icons-material/Check';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import * as atlas from 'azure-maps-control';
import 'azure-maps-control/dist/atlas.min.css';
import { computeAffine, imageToGeo, type AnchorData, type AffineTransform } from '../data/affine';

const AZURE_KEY = import.meta.env.VITE_AZURE_MAPS_KEY || '';

// ─── Tipler ───

interface StorePolygon {
  name: string;
  floor: number;
  polygon: [number, number][];
  color: string;
}

// ─── Renk paleti ───

const COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#0ea5e9',
];

// ─── Varsayılan anchor (Cevahir AVM) ───

const DEFAULT_ANCHOR: AnchorData = {
  image: [[0, 0], [609, 0], [0, 707]],
  geo: [[28.99180, 41.06410], [28.99420, 41.06410], [28.99180, 41.06150]],
};

// ═══════════════════════════════════════════════════
// ANA BİLEŞEN
// ═══════════════════════════════════════════════════

export default function PolygonEditor() {
  // ─── State ───

  // Görsel — varsayılan olarak Forum İstanbul kat planı
  const [imageUrl, setImageUrl] = useState('');
  const [imageLoaded, setImageLoaded] = useState(false);

  // Çizim
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<[number, number][]>([]);
  const [storeName, setStoreName] = useState('');
  const [storeFloor, setStoreFloor] = useState(1);

  // Kaydedilen mağazalar
  const [stores, setStores] = useState<StorePolygon[]>([]);

  // Düzenleme
  const [editIndex, setEditIndex] = useState<number | null>(null);

  // Anchor
  const [anchorJson, setAnchorJson] = useState(JSON.stringify(DEFAULT_ANCHOR));
  const [transform, setTransform] = useState<AffineTransform | null>(null);

  // UI
  const [activeFloor, setActiveFloor] = useState(1);
  const [copied, setCopied] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  // ─── Refs ───
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const scaleRef = useRef(1);
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<atlas.Map | null>(null);

  // ─── Kat numaraları ───

  // ─── Varsayılan görseli yükle ───
  useEffect(() => { if (imageUrl && !imageLoaded) loadImage(imageUrl); }, []);

  // ─── Filtrelenmiş mağazalar (aktif kata göre) ───
  const floorStores = stores.filter(s => s.floor === activeFloor);

  // ═══════════════════════════════════════════════
  // GÖRSEL + CANVAS
  // ═══════════════════════════════════════════════

  /** Görseli yükle */
  const loadImage = (url: string) => {
    setImageUrl(url);
    setImageLoaded(false);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { imgRef.current = img; setImageLoaded(true); };
    img.onerror = () => setImageLoaded(false);
    img.src = url;
  };

  /** Canvas'ı çiz */
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Boyut hesapla
    const container = canvas.parentElement;
    const maxW = container ? container.clientWidth - 16 : 600;
    const maxH = container ? container.clientHeight - 16 : 500;
    const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1);
    scaleRef.current = scale;
    canvas.width = img.naturalWidth * scale;
    canvas.height = img.naturalHeight * scale;

    // Görseli çiz
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Kaydedilmiş mağaza poligonlarını çiz (aktif kat)
    floorStores.forEach((store) => {
      const color = store.color;
      const pts = store.polygon.map(([x, y]) => [x * scale, y * scale]);
      if (pts.length < 2) return;

      // Dolgu
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      pts.slice(1).forEach(p => ctx.lineTo(p[0], p[1]));
      ctx.closePath();
      ctx.fillStyle = color + '40';
      ctx.fill();

      // Kenarlık
      ctx.strokeStyle = editIndex === stores.indexOf(store) ? '#fff' : color;
      ctx.lineWidth = editIndex === stores.indexOf(store) ? 3 : 2;
      ctx.stroke();

      // İsim
      const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
      const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeText(store.name, cx, cy);
      ctx.fillText(store.name, cx, cy);
    });

    // Şu an çizilen poligon
    if (currentPoints.length > 0) {
      const pts = currentPoints.map(([x, y]) => [x * scale, y * scale]);

      // Çizgiler
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      pts.slice(1).forEach(p => ctx.lineTo(p[0], p[1]));
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Noktalar
      pts.forEach((p, j) => {
        ctx.beginPath();
        ctx.arc(p[0], p[1], 5, 0, Math.PI * 2);
        ctx.fillStyle = j === 0 ? '#10b981' : '#ef4444';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // İlk noktaya yaklaşma göstergesi (3+ nokta varsa)
      if (pts.length >= 3) {
        ctx.beginPath();
        ctx.arc(pts[0][0], pts[0][1], 12, 0, Math.PI * 2);
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Çizim modu göstergesi
    if (isDrawing) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(4, 4, 260, 24);
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(`✏️ Çizim modu — ${currentPoints.length} nokta (tıklayarak ekle)`, 10, 9);
    }
  }, [floorStores, currentPoints, isDrawing, editIndex, stores]);

  useEffect(() => { if (imageLoaded) drawCanvas(); }, [imageLoaded, drawCanvas]);

  /** Canvas tıklama — nokta ekle */
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current || !imgRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const scale = scaleRef.current;
    const px = Math.round((e.clientX - rect.left) / scale);
    const py = Math.round((e.clientY - rect.top) / scale);

    // İlk noktaya tıklama kontrolü (poligonu kapat)
    if (currentPoints.length >= 3) {
      const [fx, fy] = currentPoints[0];
      const dist = Math.sqrt(Math.pow((fx - px) * scale, 2) + Math.pow((fy - py) * scale, 2));
      if (dist < 15) {
        // Poligonu kapat — çizimi bitir
        finishDrawing();
        return;
      }
    }

    setCurrentPoints(prev => [...prev, [px, py]]);
  };

  /** Çizimi bitir — mağazayı kaydet */
  const finishDrawing = () => {
    if (currentPoints.length < 3) return;
    if (!storeName.trim()) {
      alert('Mağaza adı girin');
      return;
    }

    const newStore: StorePolygon = {
      name: storeName.trim(),
      floor: storeFloor,
      polygon: [...currentPoints],
      color: COLORS[stores.length % COLORS.length],
    };

    if (editIndex !== null) {
      // Düzenleme modu
      setStores(prev => prev.map((s, i) => i === editIndex ? newStore : s));
      setEditIndex(null);
    } else {
      setStores(prev => [...prev, newStore]);
    }

    setCurrentPoints([]);
    setStoreName('');
    setIsDrawing(false);
  };

  // ═══════════════════════════════════════════════
  // AZURE MAPS
  // ═══════════════════════════════════════════════

  /** Transform hesapla */
  useEffect(() => {
    try {
      const data = JSON.parse(anchorJson) as AnchorData;
      setTransform(computeAffine(data));
    } catch { setTransform(null); }
  }, [anchorJson]);

  /** Haritayı başlat */
  useEffect(() => {
    if (!mapDivRef.current || mapRef.current) return;
    const anchor = (() => { try { return JSON.parse(anchorJson); } catch { return DEFAULT_ANCHOR; } })();
    const map = new atlas.Map(mapDivRef.current, {
      center: anchor.geo[0],
      zoom: 17,
      style: 'satellite_road_labels',
      language: 'tr-TR',
      authOptions: { authType: atlas.AuthenticationType.subscriptionKey, subscriptionKey: AZURE_KEY },
      showFeedbackLink: false, showLogo: false,
    });
    map.events.add('ready', () => {
      map.controls.add(new atlas.control.ZoomControl(), { position: atlas.ControlPosition.TopRight });
      setMapReady(true);
    });
    mapRef.current = map;
    return () => { map.dispose(); mapRef.current = null; setMapReady(false); };
  }, []);

  /** Haritadaki poligonları güncelle */
  const updateMap = useCallback(() => {
    const map = mapRef.current;
    if (!map || !transform || !mapReady) return;

    // Temizle — önce layer'lar, sonra source (bing sistem source'larına dokunma)
    try {
      const fl = map.layers.getLayerById('sp-fill');
      if (fl) map.layers.remove(fl);
    } catch {}
    try {
      const ll = map.layers.getLayerById('sp-line');
      if (ll) map.layers.remove(ll);
    } catch {}
    try {
      const oldSrc = map.sources.getById('sp-source');
      if (oldSrc) map.sources.remove(oldSrc);
    } catch {}
    try { map.markers.clear(); } catch {}

    const src = new atlas.source.DataSource('sp-source');
    map.sources.add(src);

    floorStores.forEach(store => {
      // Piksel → geo
      const geoCoords = store.polygon.map(([x, y]) => imageToGeo(transform, x, y));
      geoCoords.push(geoCoords[0]); // kapat

      src.add(new atlas.data.Feature(
        new atlas.data.Polygon([geoCoords]),
        { name: store.name, fillColor: store.color + '55', strokeColor: store.color },
      ));

      // İsim etiketi
      const lngs = geoCoords.map(c => c[0]);
      const lats = geoCoords.map(c => c[1]);
      const cx = (Math.min(...lngs) + Math.max(...lngs)) / 2;
      const cy = (Math.min(...lats) + Math.max(...lats)) / 2;
      map.markers.add(new atlas.HtmlMarker({
        position: [cx, cy],
        htmlContent: `<div style="pointer-events:none;background:rgba(255,255,255,0.9);padding:2px 6px;border-radius:5px;font-size:9px;font-weight:700;white-space:nowrap;border:1px solid ${store.color};box-shadow:0 1px 3px rgba(0,0,0,0.2);">${store.name}</div>`,
        anchor: 'center',
      }));
    });

    map.layers.add(new atlas.layer.PolygonLayer(src, 'sp-fill', { fillColor: ['get', 'fillColor'], fillOpacity: 0.7 }));
    map.layers.add(new atlas.layer.LineLayer(src, 'sp-line', { strokeColor: ['get', 'strokeColor'], strokeWidth: 2 }));

    // Tıklama
    const layer = map.layers.getLayerById('sp-fill');
    if (layer) {
      map.events.add('click' as any, layer, (ev: any) => {
        if (!ev.shapes?.length) return;
        const props = ev.shapes[0].getProperties?.() || ev.shapes[0].properties;
        if (props?.name) {
          const popup = new atlas.Popup({
            position: ev.position, pixelOffset: [0, -8],
            content: `<div style="padding:8px 12px;font-family:sans-serif;font-weight:700;">${props.name}</div>`,
          });
          map.popups.add(popup);
          popup.open(map);
        }
      });
      map.events.add('mouseover' as any, layer, () => { map.getCanvasContainer().style.cursor = 'pointer'; });
      map.events.add('mouseout' as any, layer, () => { map.getCanvasContainer().style.cursor = ''; });
    }
  }, [floorStores, transform, mapReady]);

  useEffect(() => { updateMap(); }, [updateMap]);

  // ─── JSON çıktısı ───
  const exportJson = JSON.stringify(stores.map(s => ({
    name: s.name, floor: s.floor, polygon: s.polygon,
  })), null, 2);

  // ═══════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      {/* ── SOL: Çizim alanı ── */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid #ddd' }}>

        {/* Üst kontrol */}
        <Paper elevation={1} sx={{ p: 1, display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', flexShrink: 0 }}>
          <TextField size="small" placeholder="Kat planı görsel URL'si..." value={imageUrl}
            onChange={e => loadImage(e.target.value)} sx={{ flex: 1, minWidth: 200, '& .MuiOutlinedInput-root': { fontSize: '0.8rem' } }} />

          <TextField size="small" select label="Kat" value={activeFloor}
            onChange={e => { setActiveFloor(Number(e.target.value)); setIsDrawing(false); setCurrentPoints([]); }}
            sx={{ width: 80 }}>
            {[1,2,3,4,5,6].map(n => <MenuItem key={n} value={n}>{n}. Kat</MenuItem>)}
          </TextField>

          {!isDrawing ? (
            <Button size="small" variant="contained" startIcon={<AddIcon />}
              onClick={() => { setIsDrawing(true); setCurrentPoints([]); setEditIndex(null); }}
              disabled={!imageLoaded} sx={{ textTransform: 'none' }}>
              Mağaza Çiz
            </Button>
          ) : (
            <>
              <TextField size="small" placeholder="Mağaza adı *" value={storeName}
                onChange={e => setStoreName(e.target.value)}
                sx={{ width: 150, '& .MuiOutlinedInput-root': { fontSize: '0.8rem' } }} />
              <Chip label={`${currentPoints.length} nokta`} size="small" color="error" />
              <IconButton size="small" onClick={() => setCurrentPoints(prev => prev.slice(0, -1))} disabled={currentPoints.length === 0}>
                <UndoIcon sx={{ fontSize: 18 }} />
              </IconButton>
              <Button size="small" variant="contained" color="success" startIcon={<CheckIcon />}
                onClick={finishDrawing} disabled={currentPoints.length < 3 || !storeName.trim()}
                sx={{ textTransform: 'none' }}>
                Kaydet
              </Button>
              <Button size="small" variant="outlined" color="error"
                onClick={() => { setIsDrawing(false); setCurrentPoints([]); setEditIndex(null); }}
                sx={{ textTransform: 'none' }}>
                İptal
              </Button>
            </>
          )}
        </Paper>

        {/* Canvas */}
        <Box sx={{ flex: 1, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#e0e0e0', p: 1 }}>
          {imageLoaded ? (
            <canvas ref={canvasRef} onClick={handleCanvasClick}
              style={{ cursor: isDrawing ? 'crosshair' : 'default', borderRadius: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }} />
          ) : (
            <Typography color="text.secondary">Yukarıdan kat planı görsel URL'si girin</Typography>
          )}
        </Box>

        {/* Mağaza listesi */}
        <Paper elevation={1} sx={{ maxHeight: 200, overflowY: 'auto', flexShrink: 0 }}>
          <Box px={1.5} pt={1} display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="caption" fontWeight={700}>{activeFloor}. Kat — {floorStores.length} mağaza</Typography>
            <IconButton size="small" onClick={() => { navigator.clipboard?.writeText(exportJson); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
              <ContentCopyIcon sx={{ fontSize: 14 }} />
            </IconButton>
            {copied && <Chip label="JSON kopyalandı!" size="small" color="success" sx={{ fontSize: '0.6rem' }} />}
          </Box>
          <List dense sx={{ py: 0 }}>
            {floorStores.map((store) => {
              const globalIdx = stores.indexOf(store);
              return (
                <ListItem key={globalIdx} sx={{ py: 0.2 }}
                  secondaryAction={
                    <Box>
                      <IconButton size="small" onClick={() => {
                        setEditIndex(globalIdx);
                        setStoreName(store.name);
                        setStoreFloor(store.floor);
                        setCurrentPoints([...store.polygon]);
                        setIsDrawing(true);
                      }}><EditIcon sx={{ fontSize: 14 }} /></IconButton>
                      <IconButton size="small" onClick={() => setStores(prev => prev.filter((_, j) => j !== globalIdx))}>
                        <DeleteIcon sx={{ fontSize: 14 }} /></IconButton>
                    </Box>
                  }>
                  <Box sx={{ width: 10, height: 10, borderRadius: 1, bgcolor: store.color, mr: 1, flexShrink: 0 }} />
                  <ListItemText primary={store.name} secondary={`${store.polygon.length} köşe`}
                    primaryTypographyProps={{ fontSize: '0.78rem', fontWeight: 600 }}
                    secondaryTypographyProps={{ fontSize: '0.6rem' }} />
                </ListItem>
              );
            })}
          </List>
        </Paper>
      </Box>

      {/* ── SAĞ: Harita + Anchor ── */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* Anchor girişi */}
        <Paper elevation={1} sx={{ p: 1, flexShrink: 0 }}>
          <Typography variant="caption" fontWeight={700}>Anchor JSON (AnchorTool çıktısı):</Typography>
          <TextField size="small" fullWidth multiline rows={2} value={anchorJson}
            onChange={e => setAnchorJson(e.target.value)}
            sx={{ mt: 0.5, '& .MuiOutlinedInput-root': { fontSize: '0.7rem', fontFamily: 'monospace' } }} />
          {transform && <Chip label="✓ Transform hesaplandı" size="small" color="success" sx={{ mt: 0.5, fontSize: '0.65rem' }} />}
        </Paper>

        {/* Harita */}
        <Box sx={{ flex: 1 }}>
          <div ref={mapDivRef} style={{ width: '100%', height: '100%' }} />
        </Box>
      </Box>
    </Box>
  );
}
