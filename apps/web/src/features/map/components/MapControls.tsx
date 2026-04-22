import { useState } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import LayersIcon from '@mui/icons-material/Layers';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import Tooltip from '@mui/material/Tooltip';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import {
  setUserLocation,
  setLocationLoading,
  setLocationError,
  toggleHeatmap,
  setMapStyle,
} from '@store/slices/mapSlice';

interface MapControlsProps {
  map: any;
  onStyleChange?: (style: string) => void;
}

const MAP_STYLES = [
  { id: 'default', label: 'Standart', icon: '🗺️' },
  { id: 'satellite', label: 'Uydu', icon: '🛰️' },
  { id: 'hybrid', label: 'Hibrit', icon: '🌍' },
  { id: 'terrain', label: 'Arazi', icon: '⛰️' },
  { id: 'dark', label: 'Karanlık', icon: '🌙' },
] as const;

export default function MapControls({ map, onStyleChange }: MapControlsProps) {
  const dispatch = useAppDispatch();
  const { showHeatmap, isLocationLoading, mapStyle } = useAppSelector((state) => state.map);
  const [showStyleMenu, setShowStyleMenu] = useState(false);

  const handleMyLocation = () => {
    if (!navigator.geolocation) return;
    dispatch(setLocationLoading(true));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const location = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        dispatch(setUserLocation(location));
        if (map) {
          if (map.setCamera) map.setCamera({ center: [location.longitude, location.latitude], zoom: 15, type: 'fly', duration: 1000 });
          else if (map.setView) map.setView([location.latitude, location.longitude], 15);
        }
      },
      () => dispatch(setLocationError('Konum alınamadı')),
      { enableHighAccuracy: true },
    );
  };

  const handleStyleSelect = (styleId: string) => {
    dispatch(setMapStyle(styleId as any));
    onStyleChange?.(styleId);
    setShowStyleMenu(false);
  };

  return (
    <Box sx={{ position: 'absolute', top: 160, right: 16, display: 'flex', flexDirection: 'column', gap: 1, zIndex: 1000 }}>
      <Tooltip title="Konumum" placement="left">
        <Paper elevation={2} sx={{ borderRadius: 2 }}>
          <IconButton onClick={handleMyLocation} color={isLocationLoading ? 'primary' : 'default'} size="small">
            <MyLocationIcon />
          </IconButton>
        </Paper>
      </Tooltip>

      <Box sx={{ position: 'relative' }}>
        <Tooltip title="Harita stili" placement="left">
          <Paper elevation={2} sx={{ borderRadius: 2 }}>
            <IconButton size="small" onClick={() => setShowStyleMenu((v) => !v)} color={mapStyle !== 'default' ? 'primary' : 'default'}>
              <LayersIcon />
            </IconButton>
          </Paper>
        </Tooltip>
        {showStyleMenu && (
          <Paper
            elevation={4}
            sx={{ position: 'absolute', right: '100%', top: 0, mr: 1, borderRadius: 2, overflow: 'hidden', width: 140 }}
          >
            {MAP_STYLES.map((style) => (
              <Box
                key={style.id}
                onClick={() => handleStyleSelect(style.id)}
                sx={{
                  px: 1.5,
                  py: 1,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  bgcolor: mapStyle === style.id ? 'primary.50' : 'transparent',
                  '&:hover': { bgcolor: 'action.hover' },
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  '&:last-child': { borderBottom: 'none' },
                }}
              >
                <Typography fontSize={16}>{style.icon}</Typography>
                <Typography variant="body2" fontWeight={mapStyle === style.id ? 600 : 400} fontSize={13}>
                  {style.label}
                </Typography>
              </Box>
            ))}
          </Paper>
        )}
      </Box>

      <Tooltip title="Yoğunluk haritası" placement="left">
        <Paper elevation={2} sx={{ borderRadius: 2 }}>
          <IconButton onClick={() => dispatch(toggleHeatmap())} color={showHeatmap ? 'error' : 'default'} size="small">
            <WhatshotIcon />
          </IconButton>
        </Paper>
      </Tooltip>
    </Box>
  );
}
