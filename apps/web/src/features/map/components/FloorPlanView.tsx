import { useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import CloseIcon from '@mui/icons-material/Close';
import ElevatorIcon from '@mui/icons-material/Elevator';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import BusinessIcon from '@mui/icons-material/Business';

// Mağaza tip renkleri
const TYPE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  giyim:      { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' },
  elektronik: { bg: '#ede9fe', border: '#8b5cf6', text: '#5b21b6' },
  market:     { bg: '#d1fae5', border: '#10b981', text: '#065f46' },
  restoran:   { bg: '#fee2e2', border: '#ef4444', text: '#991b1b' },
  kafe:       { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
  sinema:     { bg: '#e0e7ff', border: '#6366f1', text: '#3730a3' },
  spor:       { bg: '#ffedd5', border: '#f97316', text: '#9a3412' },
  kozmetik:   { bg: '#fce7f3', border: '#ec4899', text: '#9d174d' },
  otopark:    { bg: '#f3f4f6', border: '#9ca3af', text: '#374151' },
  oyun:       { bg: '#e0e7ff', border: '#818cf8', text: '#4338ca' },
  lüks:       { bg: '#fef9c3', border: '#ca8a04', text: '#854d0e' },
  ayakkabi:   { bg: '#ccfbf1', border: '#14b8a6', text: '#115e59' },
  default:    { bg: '#f0fdf4', border: '#22c55e', text: '#166534' },
};

const TYPE_ICONS: Record<string, string> = {
  giyim: '👕', elektronik: '📱', market: '🛒', restoran: '🍽️',
  kafe: '☕', sinema: '🎬', spor: '💪', kozmetik: '💄',
  otopark: '🅿️', oyun: '🎮', lüks: '💎', ayakkabi: '👟', default: '🏪',
};

interface IndoorStore {
  name: string;
  type: string;
  offsetLat: number;
  offsetLng: number;
}

interface Floor {
  level: number;
  name: string;
  stores: IndoorStore[];
}

interface FloorPlanViewProps {
  venueName: string;
  floors: Floor[];
  activeFloor: number;
  onFloorChange: (level: number) => void;
  onStoreClick: (store: IndoorStore) => void;
  onClose: () => void;
  selectedStore: string | null;
}

// Her mağazanın kat planı üzerindeki konumunu hesapla
// offsetLat/Lng'yi grid pozisyonuna dönüştür
function layoutStores(stores: IndoorStore[], width: number, height: number) {
  const padding = 12;
  const usableW = width - padding * 2;
  const usableH = height - padding * 2;

  // Mağazaları grid'e yerleştir
  const count = stores.length;
  const cols = Math.ceil(Math.sqrt(count * (usableW / usableH)));
  const rows = Math.ceil(count / cols);
  const cellW = usableW / cols;
  const cellH = usableH / rows;
  const gap = 4;

  return stores.map((store, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    return {
      store,
      x: padding + col * cellW + gap / 2,
      y: padding + row * cellH + gap / 2,
      w: cellW - gap,
      h: cellH - gap,
    };
  });
}

export default function FloorPlanView({
  venueName, floors, activeFloor, onFloorChange, onStoreClick, onClose, selectedStore,
}: FloorPlanViewProps) {
  const [zoom, setZoom] = useState(1);
  const currentFloor = floors.find(f => f.level === activeFloor);
  const PLAN_W = 560;
  const PLAN_H = 380;

  if (!currentFloor) return null;

  const layoutItems = layoutStores(currentFloor.stores, PLAN_W, PLAN_H);

  return (
    <Paper
      elevation={8}
      sx={{
        position: 'absolute',
        top: 10,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1200,
        borderRadius: 3,
        overflow: 'hidden',
        width: { xs: 'calc(100% - 20px)', md: 620 },
        maxHeight: 'calc(100vh - 120px)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Başlık */}
      <Box sx={{
        p: 1.5,
        background: 'linear-gradient(135deg, #1a6b52, #0e4a38)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <Box display="flex" alignItems="center" gap={1}>
          <BusinessIcon fontSize="small" />
          <Box>
            <Typography variant="subtitle2" fontWeight={700} lineHeight={1.2}>{venueName}</Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>Kat Planı</Typography>
          </Box>
        </Box>
        <Box display="flex" alignItems="center" gap={0.5}>
          <IconButton size="small" onClick={() => setZoom(z => Math.min(z + 0.2, 2))} sx={{ color: '#fff' }}>
            <ZoomInIcon sx={{ fontSize: 18 }} />
          </IconButton>
          <IconButton size="small" onClick={() => setZoom(z => Math.max(z - 0.2, 0.6))} sx={{ color: '#fff' }}>
            <ZoomOutIcon sx={{ fontSize: 18 }} />
          </IconButton>
          <IconButton size="small" onClick={onClose} sx={{ color: '#fff', ml: 0.5 }}>
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      </Box>

      {/* Kat Seçici */}
      <Box sx={{ px: 1.5, py: 1, bgcolor: '#f8f9fa', borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
        <Box display="flex" alignItems="center" gap={0.5} flexWrap="wrap">
          <ElevatorIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
          {floors.map((floor) => (
            <Chip
              key={floor.level}
              label={floor.name}
              size="small"
              variant={activeFloor === floor.level ? 'filled' : 'outlined'}
              color={activeFloor === floor.level ? 'primary' : 'default'}
              onClick={() => onFloorChange(floor.level)}
              sx={{ cursor: 'pointer', fontWeight: activeFloor === floor.level ? 700 : 400, fontSize: '0.72rem' }}
            />
          ))}
        </Box>
      </Box>

      {/* Kat Planı SVG */}
      <Box sx={{ overflow: 'auto', flexGrow: 1, bgcolor: '#fafbfc', p: 1 }}>
        <svg
          viewBox={`0 0 ${PLAN_W} ${PLAN_H}`}
          width={PLAN_W * zoom}
          height={PLAN_H * zoom}
          style={{ display: 'block', margin: '0 auto' }}
        >
          {/* Bina dış çerçeve */}
          <rect x="2" y="2" width={PLAN_W - 4} height={PLAN_H - 4} rx="12" ry="12"
            fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />

          {/* Merkez koridor */}
          <rect x={PLAN_W / 2 - 20} y="8" width="40" height={PLAN_H - 16} rx="4"
            fill="#e2e8f0" stroke="none" />

          {/* Giriş ok */}
          <polygon points={`${PLAN_W / 2},${PLAN_H - 4} ${PLAN_W / 2 - 12},${PLAN_H - 18} ${PLAN_W / 2 + 12},${PLAN_H - 18}`}
            fill="#1a6b52" />
          <text x={PLAN_W / 2} y={PLAN_H - 22} textAnchor="middle" fontSize="8" fill="#1a6b52" fontWeight="700">
            GİRİŞ
          </text>

          {/* Asansör/merdiven */}
          <rect x={PLAN_W / 2 - 10} y={PLAN_H / 2 - 15} width="20" height="30" rx="3"
            fill="#94a3b8" stroke="#64748b" strokeWidth="1" />
          <text x={PLAN_W / 2} y={PLAN_H / 2 + 3} textAnchor="middle" fontSize="7" fill="#fff" fontWeight="600">
            🛗
          </text>

          {/* Mağaza blokları */}
          {layoutItems.map(({ store, x, y, w, h }) => {
            const colors = TYPE_COLORS[store.type] || TYPE_COLORS.default;
            const icon = TYPE_ICONS[store.type] || TYPE_ICONS.default;
            const isSelected = selectedStore === store.name;
            const fontSize = store.name.length > 14 ? 7.5 : store.name.length > 10 ? 8.5 : 9.5;

            return (
              <g
                key={store.name}
                onClick={() => onStoreClick(store)}
                style={{ cursor: 'pointer' }}
              >
                {/* Seçili glow */}
                {isSelected && (
                  <rect x={x - 3} y={y - 3} width={w + 6} height={h + 6} rx="10"
                    fill="none" stroke={colors.border} strokeWidth="2" opacity="0.5">
                    <animate attributeName="opacity" values="0.3;0.8;0.3" dur="1.5s" repeatCount="indefinite" />
                  </rect>
                )}
                {/* Mağaza kutusu */}
                <rect
                  x={x} y={y} width={w} height={h} rx="8"
                  fill={isSelected ? colors.border + '20' : colors.bg}
                  stroke={colors.border}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                  opacity={store.type === 'otopark' ? 0.5 : 1}
                />
                {/* İkon */}
                <text x={x + w / 2} y={y + h / 2 - 5} textAnchor="middle" fontSize="16">
                  {icon}
                </text>
                {/* Mağaza adı */}
                <text
                  x={x + w / 2} y={y + h / 2 + 10}
                  textAnchor="middle"
                  fontSize={fontSize}
                  fontWeight="600"
                  fill={colors.text}
                  fontFamily="'DM Sans', sans-serif"
                >
                  {store.name.length > 18 ? store.name.slice(0, 16) + '...' : store.name}
                </text>
                {/* Hover efekti */}
                <rect
                  x={x} y={y} width={w} height={h} rx="8"
                  fill="transparent" stroke="transparent"
                >
                  <set attributeName="fill" to={colors.border + '10'} begin="mouseover" end="mouseout" />
                </rect>
              </g>
            );
          })}

          {/* Kat etiketi */}
          <rect x="8" y="8" width="80" height="22" rx="6" fill="#1a6b52" />
          <text x="48" y="23" textAnchor="middle" fontSize="10" fill="#fff" fontWeight="700" fontFamily="'DM Sans', sans-serif">
            {currentFloor.name}
          </text>

          {/* Mağaza sayısı */}
          <rect x={PLAN_W - 88} y="8" width="80" height="22" rx="6" fill="#fff" stroke="#cbd5e1" />
          <text x={PLAN_W - 48} y="23" textAnchor="middle" fontSize="9" fill="#64748b" fontWeight="600" fontFamily="'DM Sans', sans-serif">
            {currentFloor.stores.length} mağaza
          </text>
        </svg>
      </Box>

      {/* Alt bilgi — kategori lejantı */}
      <Box sx={{ px: 1.5, py: 1, bgcolor: '#f8f9fa', borderTop: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
        <Box display="flex" flexWrap="wrap" gap={0.5}>
          {Array.from(new Set(currentFloor.stores.map(s => s.type))).map(type => {
            const colors = TYPE_COLORS[type] || TYPE_COLORS.default;
            const icon = TYPE_ICONS[type] || TYPE_ICONS.default;
            return (
              <Tooltip key={type} title={type.charAt(0).toUpperCase() + type.slice(1)}>
                <Chip
                  size="small"
                  label={`${icon} ${type}`}
                  sx={{
                    bgcolor: colors.bg,
                    color: colors.text,
                    border: `1px solid ${colors.border}`,
                    fontSize: '0.65rem',
                    height: 22,
                    fontWeight: 600,
                    textTransform: 'capitalize',
                  }}
                />
              </Tooltip>
            );
          })}
        </Box>
      </Box>
    </Paper>
  );
}
