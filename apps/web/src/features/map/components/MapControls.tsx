import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
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
  map: google.maps.Map | null;
}

export default function MapControls({ map }: MapControlsProps) {
  const dispatch = useAppDispatch();
  const { showHeatmap, mapStyle, isLocationLoading } = useAppSelector((state) => state.map);

  const handleZoomIn = () => {
    if (map) map.setZoom((map.getZoom() || 13) + 1);
  };

  const handleZoomOut = () => {
    if (map) map.setZoom((map.getZoom() || 13) - 1);
  };

  const handleMyLocation = () => {
    if (!navigator.geolocation) return;
    dispatch(setLocationLoading(true));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const location = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        dispatch(setUserLocation(location));
        if (map) {
          map.panTo({ lat: location.latitude, lng: location.longitude });
          map.setZoom(15);
        }
      },
      () => dispatch(setLocationError('Konum alınamadı')),
      { enableHighAccuracy: true },
    );
  };

  const cycleMapStyle = () => {
    const styles: Array<'default' | 'satellite' | 'terrain'> = ['default', 'satellite', 'terrain'];
    const currentIdx = styles.indexOf(mapStyle);
    dispatch(setMapStyle(styles[(currentIdx + 1) % styles.length]));
  };

  return (
    <Box sx={{ position: 'absolute', top: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Paper elevation={2} sx={{ borderRadius: 2 }}>
        <Box display="flex" flexDirection="column">
          <IconButton onClick={handleZoomIn} size="small"><AddIcon /></IconButton>
          <IconButton onClick={handleZoomOut} size="small"><RemoveIcon /></IconButton>
        </Box>
      </Paper>

      <Tooltip title="Konumum" placement="left">
        <Paper elevation={2} sx={{ borderRadius: 2 }}>
          <IconButton onClick={handleMyLocation} color={isLocationLoading ? 'primary' : 'default'} size="small">
            <MyLocationIcon />
          </IconButton>
        </Paper>
      </Tooltip>

      <Tooltip title="Harita stili" placement="left">
        <Paper elevation={2} sx={{ borderRadius: 2 }}>
          <IconButton onClick={cycleMapStyle} size="small"><LayersIcon /></IconButton>
        </Paper>
      </Tooltip>

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
