/**
 * ─── AnchorTool ──────────────────────────────────────────────
 *
 * Kat planı görselini haritaya hizalamak için "anchor point" seçme aracı.
 *
 * KULLANIM:
 *   1. Sol panele kat planı görseli yüklenir (URL veya dosya)
 *   2. Kullanıcı görselde bir nokta tıklar → kırmızı pin bırakır
 *   3. Sağ paneldeki haritada aynı noktanın karşılığını tıklar → mavi pin bırakır
 *   4. Bu işlem 3 kez tekrarlanır (3 nokta = affine dönüşüm için yeterli)
 *   5. Sonuç JSON olarak gösterilir ve kopyalanabilir
 *
 * ÇIKTI:
 *   {
 *     "image": [[x1,y1], [x2,y2], [x3,y3]],   ← piksel koordinatları
 *     "geo":   [[lon1,lat1], [lon2,lat2], [lon3,lat3]]  ← harita koordinatları
 *   }
 *
 * Bu veri daha sonra kat planı görselini haritaya ImageLayer olarak
 * yerleştirmek için affine transform hesaplamada kullanılır.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import * as atlas from 'azure-maps-control';
import 'azure-maps-control/dist/atlas.min.css';

const AZURE_KEY = import.meta.env.VITE_AZURE_MAPS_KEY || '';

/** Bir anchor noktası: görsel (piksel) + harita (geo) koordinatı */
interface AnchorPoint {
  image: [number, number] | null;  // [x, y] piksel
  geo: [number, number] | null;    // [lng, lat]
}

// Toplam 3 anchor noktası gerekli
const TOTAL_POINTS = 3;

// Nokta renkleri
const POINT_COLORS = ['#ef4444', '#3b82f6', '#10b981'];
const POINT_LABELS = ['1. Nokta', '2. Nokta', '3. Nokta'];

export default function AnchorTool() {
  // ─── State ───
  const [imageUrl, setImageUrl] = useState('');           // Kat planı görsel URL'si
  const [imageLoaded, setImageLoaded] = useState(false);  // Görsel yüklendi mi
  const [anchors, setAnchors] = useState<AnchorPoint[]>(  // 3 anchor noktası
    Array.from({ length: TOTAL_POINTS }, () => ({ image: null, geo: null })),
  );
  const [activeStep, setActiveStep] = useState<'image' | 'geo'>('image'); // Şu an ne seçiliyor
  const [activeIndex, setActiveIndex] = useState(0);      // Kaçıncı nokta seçiliyor (0,1,2)
  const [copied, setCopied] = useState(false);

  // ─── Refs ───
  const canvasRef = useRef<HTMLCanvasElement>(null);       // Görsel canvas'ı
  const mapContainerRef = useRef<HTMLDivElement>(null);    // Harita DOM
  const mapRef = useRef<atlas.Map | null>(null);           // Azure Maps instance
  const imageRef = useRef<HTMLImageElement | null>(null);   // Yüklenen görsel
  const mapMarkersRef = useRef<atlas.HtmlMarker[]>([]);    // Harita marker'ları

  // ─── Tamamlanan nokta sayısı ───
  const completedCount = anchors.filter(a => a.image && a.geo).length;
  const isComplete = completedCount === TOTAL_POINTS;

  // ─── Sonuç JSON ───
  const resultJson = isComplete ? JSON.stringify({
    image: anchors.map(a => a.image),
    geo: anchors.map(a => a.geo),
  }, null, 2) : '';

  // ════════════════════════════════════════════════
  // GÖRSEL TARAFLI İŞLEMLER
  // ════════════════════════════════════════════════

  /** Görseli canvas'a çiz + mevcut noktaları işaretle */
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas boyutunu görsele göre ayarla
    const maxW = canvas.parentElement?.clientWidth || 600;
    const scale = Math.min(maxW / img.naturalWidth, 1);
    canvas.width = img.naturalWidth * scale;
    canvas.height = img.naturalHeight * scale;

    // Görseli çiz
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Mevcut anchor noktalarını çiz
    anchors.forEach((anchor, i) => {
      if (!anchor.image) return;
      const [x, y] = anchor.image;
      // Pikseli scale'e göre dönüştür
      const sx = x * scale;
      const sy = y * scale;

      // Dış halka
      ctx.beginPath();
      ctx.arc(sx, sy, 14, 0, Math.PI * 2);
      ctx.fillStyle = POINT_COLORS[i] + '30';
      ctx.fill();

      // İç daire
      ctx.beginPath();
      ctx.arc(sx, sy, 8, 0, Math.PI * 2);
      ctx.fillStyle = POINT_COLORS[i];
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Numara
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(i + 1), sx, sy);
    });

    // Aktif nokta göstergesi
    if (!isComplete && activeStep === 'image') {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(8, 8, 180, 28);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(`📍 ${POINT_LABELS[activeIndex]} — görselde tıkla`, 14, 14);
    }
  }, [anchors, activeStep, activeIndex, isComplete]);

  /** Görsel yüklendiğinde canvas'ı çiz */
  useEffect(() => {
    if (imageLoaded) drawCanvas();
  }, [imageLoaded, drawCanvas]);

  /** Görsele tıklama — anchor noktası ekle */
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeStep !== 'image' || isComplete) return;

    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    // Tıklama koordinatını piksel koordinatına dönüştür
    const rect = canvas.getBoundingClientRect();
    const maxW = canvas.parentElement?.clientWidth || 600;
    const scale = Math.min(maxW / img.naturalWidth, 1);

    // Gerçek piksel koordinatı (scale'den bağımsız)
    const px = Math.round((e.clientX - rect.left) / scale);
    const py = Math.round((e.clientY - rect.top) / scale);

    // Anchor'ı güncelle
    setAnchors(prev => {
      const next = [...prev];
      next[activeIndex] = { ...next[activeIndex], image: [px, py] };
      return next;
    });

    // Harita tarafına geç
    setActiveStep('geo');
    drawCanvas();
  };

  /** Görsel URL'si değiştiğinde yükle */
  const loadImage = (url: string) => {
    setImageUrl(url);
    setImageLoaded(false);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);
    };
    img.onerror = () => { setImageLoaded(false); };
    img.src = url;
  };

  // ════════════════════════════════════════════════
  // HARİTA TARAFLI İŞLEMLER
  // ════════════════════════════════════════════════

  /** Haritayı başlat */
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new atlas.Map(mapContainerRef.current, {
      center: [28.99, 41.06],  // İstanbul merkez
      zoom: 15,
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

      // Harita tıklama — geo anchor noktası ekle
      map.events.add('click', (e: atlas.MapMouseEvent) => {
        if (!e.position) return;

        // activeStep state'ine erişmek için closure kullanamayız
        // Bu yüzden DOM'dan okuyan bir trick kullanıyoruz
        const stepEl = document.getElementById('anchor-active-step');
        const idxEl = document.getElementById('anchor-active-index');
        if (!stepEl || !idxEl) return;

        const step = stepEl.dataset.value;
        const idx = Number(idxEl.dataset.value);

        if (step !== 'geo') return;

        const [lng, lat] = e.position;

        // Marker ekle
        const marker = new atlas.HtmlMarker({
          position: [lng, lat],
          htmlContent: `<div style="
            width:20px; height:20px; border-radius:50%;
            background:${POINT_COLORS[idx]};
            border:3px solid #fff;
            box-shadow:0 2px 8px rgba(0,0,0,0.4);
            display:flex; align-items:center; justify-content:center;
            color:#fff; font-size:10px; font-weight:bold;
          ">${idx + 1}</div>`,
          anchor: 'center',
        });
        // Eski marker varsa kaldır
        if (mapMarkersRef.current[idx]) {
          map.markers.remove(mapMarkersRef.current[idx]);
        }
        map.markers.add(marker);
        mapMarkersRef.current[idx] = marker;

        // Anchor'ı güncelle — React state dışından, custom event ile
        window.dispatchEvent(new CustomEvent('anchor-geo-set', {
          detail: { index: idx, lng, lat },
        }));
      });
    });

    mapRef.current = map;

    return () => { map.dispose(); mapRef.current = null; };
  }, []);

  /** Custom event dinleyici — harita tıklamasından gelen geo koordinatı */
  useEffect(() => {
    const handler = (e: Event) => {
      const { index, lng, lat } = (e as CustomEvent).detail;
      setAnchors(prev => {
        const next = [...prev];
        next[index] = { ...next[index], geo: [lng, lat] };
        return next;
      });
      // Sonraki noktaya geç
      if (index < TOTAL_POINTS - 1) {
        setActiveIndex(index + 1);
        setActiveStep('image');
      } else {
        // Tüm noktalar tamamlandı
        setActiveStep('image'); // Reset
      }
    };
    window.addEventListener('anchor-geo-set', handler);
    return () => window.removeEventListener('anchor-geo-set', handler);
  }, []);

  /** Sıfırla */
  const handleReset = () => {
    setAnchors(Array.from({ length: TOTAL_POINTS }, () => ({ image: null, geo: null })));
    setActiveIndex(0);
    setActiveStep('image');
    setCopied(false);
    // Marker'ları temizle
    mapMarkersRef.current.forEach(m => {
      if (m && mapRef.current) mapRef.current.markers.remove(m);
    });
    mapMarkersRef.current = [];
    drawCanvas();
  };

  /** Kopyala */
  const handleCopy = () => {
    navigator.clipboard?.writeText(resultJson).then(() => setCopied(true));
    setTimeout(() => setCopied(false), 2000);
  };

  // ════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: '#f5f5f5' }}>

      {/* ── ÜST BAR ── */}
      <Paper elevation={2} sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0, zIndex: 10 }}>
        <Typography variant="subtitle1" fontWeight={700}>📍 Anchor Point Seçme Aracı</Typography>

        {/* Görsel URL girişi */}
        <TextField
          size="small"
          placeholder="Kat planı görsel URL'si yapıştırın..."
          value={imageUrl}
          onChange={e => loadImage(e.target.value)}
          sx={{ flex: 1, maxWidth: 400, '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.85rem' } }}
        />

        {/* Durum chip'leri */}
        {anchors.map((a, i) => (
          <Chip
            key={i}
            size="small"
            label={`${POINT_LABELS[i]}: ${a.image && a.geo ? '✓' : a.image ? 'harita bekliyor' : 'seçilmedi'}`}
            sx={{
              bgcolor: a.image && a.geo ? POINT_COLORS[i] + '20' : 'transparent',
              border: `1.5px solid ${POINT_COLORS[i]}`,
              color: POINT_COLORS[i],
              fontWeight: activeIndex === i ? 700 : 400,
              fontSize: '0.7rem',
            }}
          />
        ))}

        <Button size="small" startIcon={<RestartAltIcon />} onClick={handleReset} sx={{ textTransform: 'none' }}>
          Sıfırla
        </Button>
      </Paper>

      {/* ── ANA İÇERİK ── */}
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── SOL: Kat planı görseli ── */}
        <Box sx={{
          flex: 1, overflow: 'auto', p: 2,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          bgcolor: '#e8e8e8',
          border: activeStep === 'image' ? '3px solid #ef4444' : '3px solid transparent',
        }}>
          <Typography variant="caption" fontWeight={700} mb={1} color={activeStep === 'image' ? 'error' : 'text.secondary'}>
            {activeStep === 'image' ? `⬇️ Görselde ${POINT_LABELS[activeIndex]} seçin` : 'Görsel tarafı — bekleniyor'}
          </Typography>

          {imageLoaded ? (
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              style={{ cursor: activeStep === 'image' ? 'crosshair' : 'default', maxWidth: '100%', borderRadius: 8, boxShadow: '0 2px 12px rgba(0,0,0,0.15)' }}
            />
          ) : (
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.secondary' }}>
              <Typography variant="body2">Yukarıdan kat planı görsel URL'si girin</Typography>
            </Box>
          )}
        </Box>

        {/* ── SAĞ: Azure Maps ── */}
        <Box sx={{
          flex: 1, position: 'relative',
          border: activeStep === 'geo' ? '3px solid #3b82f6' : '3px solid transparent',
        }}>
          <Typography
            variant="caption" fontWeight={700}
            sx={{
              position: 'absolute', top: 8, left: 8, zIndex: 10,
              bgcolor: activeStep === 'geo' ? '#3b82f6' : 'rgba(0,0,0,0.5)',
              color: '#fff', px: 1.5, py: 0.5, borderRadius: 2,
            }}
          >
            {activeStep === 'geo' ? `⬇️ Haritada ${POINT_LABELS[activeIndex]} karşılığını seçin` : 'Harita tarafı — bekleniyor'}
          </Typography>

          <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
        </Box>
      </Box>

      {/* ── ALT: Sonuç JSON ── */}
      {isComplete && (
        <Paper elevation={3} sx={{ p: 2, m: 1, borderRadius: 2, flexShrink: 0 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
            <Box display="flex" alignItems="center" gap={1}>
              <CheckCircleIcon sx={{ color: '#10b981' }} />
              <Typography variant="subtitle2" fontWeight={700} color="success.main">
                3 anchor noktası tamamlandı!
              </Typography>
            </Box>
            <IconButton size="small" onClick={handleCopy}>
              <ContentCopyIcon sx={{ fontSize: 18 }} />
            </IconButton>
            {copied && <Chip label="Kopyalandı!" size="small" color="success" sx={{ fontSize: '0.7rem' }} />}
          </Box>
          <Box sx={{ bgcolor: '#1a1a2e', borderRadius: 2, p: 2, overflow: 'auto', maxHeight: 120 }}>
            <pre style={{ margin: 0, color: '#10b981', fontSize: '0.8rem', fontFamily: 'monospace' }}>
              {resultJson}
            </pre>
          </Box>
        </Paper>
      )}

      {/* Gizli state taşıyıcılar — harita click handler'ından erişim için */}
      <div id="anchor-active-step" data-value={activeStep} style={{ display: 'none' }} />
      <div id="anchor-active-index" data-value={activeIndex} style={{ display: 'none' }} />
    </Box>
  );
}
