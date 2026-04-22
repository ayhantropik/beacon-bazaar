/**
 * IndoorFloorPlan — İstanbul AVM'leri kat planı görüntüleyici
 * Azure Maps üzerinde PolygonLayer ile mağazalar, tıklanınca ürün paneli
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
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
import apiClient from '@services/api/client';
import StoreProductsPanel from './StoreProductsPanel';
import { ISTANBUL_MALLS, svgToGeo, type MallData } from '../data/istanbul-malls';

const AZURE_KEY = import.meta.env.VITE_AZURE_MAPS_KEY || '';
const STORE_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#ef4444', '#f59e0b', '#ec4899', '#6366f1', '#14b8a6', '#f97316', '#0ea5e9', '#84cc16', '#a855f7'];

interface PanelStore {
  id: string; name: string; slug: string; logo: string;
  categories: string[]; ratingAverage: number; ratingCount: number;
  isVerified: boolean; contactInfo: Record<string, string>; address?: any;
}

interface IndoorFloorPlanProps { onClose?: () => void; }

export default function IndoorFloorPlan({ onClose }: IndoorFloorPlanProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<atlas.Map | null>(null);
  const markersRef = useRef<atlas.HtmlMarker[]>([]);

  const [selectedMall, setSelectedMall] = useState<MallData | null>(null);
  const [panelStore, setPanelStore] = useState<PanelStore | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeFloor, setActiveFloor] = useState(0);
  const [svgLoading, setSvgLoading] = useState(false);
  const [selectedStoreName, setSelectedStoreName] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const searchStore = useCallback(async (storeName: string) => {
    setSelectedStoreName(storeName);
    try {
      const res = await apiClient.get(`/stores/search?q=${encodeURIComponent(storeName)}&limit=1`);
      const data = res.data?.data || res.data || [];
      if (data.length > 0) {
        const s = data[0];
        setPanelStore({ id: s.id, name: storeName, slug: s.slug, logo: s.logo || '', categories: s.categories || [], ratingAverage: s.ratingAverage || 0, ratingCount: s.ratingCount || 0, isVerified: s.isVerified || false, contactInfo: s.contactInfo || {}, address: s.address });
      } else { setPanelStore(null); }
    } catch { setPanelStore(null); }
  }, []);

  const initMap = useCallback(() => {
    if (!mapContainerRef.current || mapInstanceRef.current || !selectedMall) return;
    const map = new atlas.Map(mapContainerRef.current, {
      center: [selectedMall.center.lng, selectedMall.center.lat],
      zoom: 18, pitch: 0, style: 'satellite_road_labels', language: 'tr-TR',
      authOptions: { authType: atlas.AuthenticationType.subscriptionKey, subscriptionKey: AZURE_KEY },
      showFeedbackLink: false, showLogo: false,
    });
    map.events.add('ready', () => {
      map.controls.add([new atlas.control.ZoomControl()], { position: atlas.ControlPosition.TopRight });
    });
    mapInstanceRef.current = map;
  }, [selectedMall]);

  const renderFloor = useCallback((floor: number) => {
    const map = mapInstanceRef.current;
    if (!map || !selectedMall) return;

    markersRef.current.forEach(m => map.markers.remove(m));
    markersRef.current = [];
    setSvgLoading(true);

    const floorData = selectedMall.floors.find(f => f.level === floor);
    const stores = floorData?.stores || [];

    // Bina sınırı
    try {
      const bDs = new atlas.source.DataSource();
      map.sources.add(bDs);
      bDs.add(new atlas.data.Feature(new atlas.data.Polygon([selectedMall.buildingPolygon]), {}));
      map.layers.add(new atlas.layer.PolygonLayer(bDs, `bfill-${selectedMall.id}-${floor}`, { fillColor: 'rgba(26,107,82,0.1)' }));
      map.layers.add(new atlas.layer.LineLayer(bDs, `bline-${selectedMall.id}-${floor}`, { strokeColor: '#1a6b52', strokeWidth: 4 }));
    } catch { /* layer zaten var */ }

    // Mağaza poligonları
    const STORE_W = (selectedMall.bounds.east - selectedMall.bounds.west) / 12;
    const STORE_H = (selectedMall.bounds.north - selectedMall.bounds.south) / 14;

    try {
      const sDs = new atlas.source.DataSource();
      map.sources.add(sDs);

      stores.forEach((store, idx) => {
        const geo = svgToGeo(selectedMall, store.svgX, store.svgY);
        const halfW = STORE_W * 0.45;
        const halfH = STORE_H * 0.45;
        const color = STORE_COLORS[idx % STORE_COLORS.length];
        const isSelected = selectedStoreName === store.name;

        sDs.add(new atlas.data.Feature(
          new atlas.data.Polygon([[
            [geo.lng - halfW, geo.lat + halfH], [geo.lng + halfW, geo.lat + halfH],
            [geo.lng + halfW, geo.lat - halfH], [geo.lng - halfW, geo.lat - halfH],
            [geo.lng - halfW, geo.lat + halfH],
          ]]),
          { storeName: store.name, fillColor: isSelected ? color : color + '40', strokeColor: isSelected ? '#fff' : color },
        ));
      });

      const polyLayer = new atlas.layer.PolygonLayer(sDs, `sfill-${selectedMall.id}-${floor}`, { fillColor: ['get', 'fillColor'], fillOpacity: 0.7 });
      map.layers.add(polyLayer);
      map.layers.add(new atlas.layer.LineLayer(sDs, `sline-${selectedMall.id}-${floor}`, { strokeColor: ['get', 'strokeColor'], strokeWidth: 2 }));

      map.events.add('click', polyLayer, (e: atlas.MapMouseEvent) => {
        if (e.shapes?.length) { const p = (e.shapes[0] as atlas.Shape).getProperties(); if (p.storeName) searchStore(p.storeName); }
      });
      map.events.add('mouseover', polyLayer, () => { map.getCanvasContainer().style.cursor = 'pointer'; });
      map.events.add('mouseout', polyLayer, () => { map.getCanvasContainer().style.cursor = ''; });
    } catch { /* */ }

    // İsim etiketleri
    stores.forEach(store => {
      const geo = svgToGeo(selectedMall, store.svgX, store.svgY);
      const isSelected = selectedStoreName === store.name;
      const marker = new atlas.HtmlMarker({
        position: [geo.lng, geo.lat],
        htmlContent: `<div style="pointer-events:none;text-align:center;">
          <div style="background:${isSelected ? '#1a6b52' : 'rgba(255,255,255,0.92)'};color:${isSelected ? '#fff' : '#2c1810'};padding:2px 6px;border-radius:6px;font-size:9px;font-weight:700;white-space:nowrap;border:1.5px solid ${isSelected ? '#fff' : 'rgba(0,0,0,0.15)'};box-shadow:0 1px 4px rgba(0,0,0,0.2);max-width:90px;overflow:hidden;text-overflow:ellipsis;">
            ${store.name}
          </div>
        </div>`,
        anchor: 'center',
      });
      map.markers.add(marker);
      markersRef.current.push(marker);
    });

    map.setCamera({ bounds: [selectedMall.bounds.west - 0.0005, selectedMall.bounds.south - 0.0005, selectedMall.bounds.east + 0.0005, selectedMall.bounds.north + 0.0005], padding: 40, type: 'fly', duration: 800 });
    setSvgLoading(false);
  }, [selectedMall, searchStore, selectedStoreName]);

  useEffect(() => {
    if (!selectedMall || !isOpen) return;
    const t = setTimeout(() => { initMap(); setTimeout(() => renderFloor(activeFloor), 300); }, 100);
    return () => { clearTimeout(t); if (mapInstanceRef.current) { mapInstanceRef.current.dispose(); mapInstanceRef.current = null; } };
  }, [selectedMall, isOpen]);

  useEffect(() => { if (selectedMall && mapInstanceRef.current) renderFloor(activeFloor); }, [activeFloor]);
  useEffect(() => { if (selectedMall && mapInstanceRef.current && selectedStoreName) renderFloor(activeFloor); }, [selectedStoreName]);

  const handleClose = () => { setSelectedMall(null); setPanelStore(null); setSelectedStoreName(null); setIsOpen(false); if (mapInstanceRef.current) { mapInstanceRef.current.dispose(); mapInstanceRef.current = null; } onClose?.(); };

  const filteredMalls = searchQuery ? ISTANBUL_MALLS.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.address.toLowerCase().includes(searchQuery.toLowerCase())) : ISTANBUL_MALLS;
  const currentFloor = selectedMall?.floors.find(f => f.level === activeFloor);

  if (!isOpen) {
    return (
      <Box sx={{ position: 'absolute', bottom: 16, left: 16, zIndex: 1100 }}>
        <Button variant="contained" startIcon={<BusinessIcon />} onClick={() => setIsOpen(true)}
          sx={{ textTransform: 'none', borderRadius: 2, bgcolor: '#1a6b52', fontWeight: 700, boxShadow: '0 2px 12px rgba(0,0,0,0.2)', '&:hover': { bgcolor: '#0e4a38' } }}>
          AVM İç Harita ({ISTANBUL_MALLS.length})
        </Button>
      </Box>
    );
  }

  // AVM seçim listesi
  if (!selectedMall) {
    return (
      <Box sx={{ position: 'absolute', bottom: 16, left: 16, zIndex: 1100 }}>
        <Paper elevation={4} sx={{ borderRadius: 2, overflow: 'hidden', width: 360 }}>
          <Box sx={{ p: 1.5, background: 'linear-gradient(135deg, #1a6b52, #0e4a38)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="subtitle2" fontWeight={700}><BusinessIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />İstanbul AVM'leri ({ISTANBUL_MALLS.length})</Typography>
            <IconButton size="small" onClick={handleClose} sx={{ color: '#fff' }}><CloseIcon sx={{ fontSize: 16 }} /></IconButton>
          </Box>
          <Box px={1.5} pt={1.5} pb={0.5}>
            <TextField size="small" fullWidth placeholder="AVM ara..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18 }} /></InputAdornment> }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.85rem' } }} />
          </Box>
          <List dense sx={{ maxHeight: 400, overflowY: 'auto', p: 0.5 }}>
            {filteredMalls.map(mall => (
              <ListItem key={mall.id} component="div"
                onClick={() => { setSelectedMall(mall); setActiveFloor(mall.floors[0]?.level || 0); setPanelStore(null); setSelectedStoreName(null); }}
                sx={{ cursor: 'pointer', borderRadius: 1.5, mb: 0.3, '&:hover': { bgcolor: 'rgba(26,107,82,0.08)' } }}>
                <ListItemIcon sx={{ minWidth: 36 }}><BusinessIcon sx={{ color: '#1a6b52' }} fontSize="small" /></ListItemIcon>
                <ListItemText primary={mall.name}
                  secondary={<><Typography component="span" variant="caption" display="block" color="text.secondary">{mall.address}</Typography>
                    <Typography component="span" variant="caption" color="primary" fontWeight={600}>{mall.floors.length} kat · {mall.floors.reduce((s, f) => s + f.stores.length, 0)} mağaza</Typography></>}
                  primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }} />
              </ListItem>
            ))}
          </List>
        </Paper>
      </Box>
    );
  }

  // Kat planı görünümü
  return (
    <Box sx={{ position: 'absolute', inset: 0, zIndex: 1200, display: 'flex' }}>
      <Paper elevation={4} sx={{ width: { xs: '100%', md: 280 }, height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 0, flexShrink: 0, zIndex: 2 }}>
        <Box sx={{ p: 1.5, background: 'linear-gradient(135deg, #1a6b52, #0e4a38)', color: '#fff', flexShrink: 0 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={0.5}>
              <IconButton size="small" onClick={() => { setSelectedMall(null); setPanelStore(null); if (mapInstanceRef.current) { mapInstanceRef.current.dispose(); mapInstanceRef.current = null; } }} sx={{ color: '#fff', p: 0.3 }}>
                <ArrowBackIcon sx={{ fontSize: 16 }} />
              </IconButton>
              <Box>
                <Typography variant="subtitle2" fontWeight={700} lineHeight={1.2}>{selectedMall.name}</Typography>
                <Typography variant="caption" sx={{ opacity: 0.7, fontSize: '0.55rem' }}>{selectedMall.address}</Typography>
              </Box>
            </Box>
            <IconButton size="small" onClick={handleClose} sx={{ color: '#fff' }}><CloseIcon sx={{ fontSize: 16 }} /></IconButton>
          </Box>
        </Box>

        <Box sx={{ px: 1, py: 1, bgcolor: '#f8f9fa', borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
          <Box display="flex" alignItems="center" gap={0.4} flexWrap="wrap">
            <ElevatorIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
            {selectedMall.floors.map(floor => (
              <Chip key={floor.level} label={floor.name} size="small"
                variant={activeFloor === floor.level ? 'filled' : 'outlined'}
                color={activeFloor === floor.level ? 'primary' : 'default'}
                onClick={() => { setActiveFloor(floor.level); setPanelStore(null); setSelectedStoreName(null); }}
                sx={{ cursor: 'pointer', fontWeight: activeFloor === floor.level ? 700 : 400, fontSize: '0.65rem', height: 24 }} />
            ))}
          </Box>
        </Box>

        <Divider />
        <Box sx={{ overflowY: 'auto', flexGrow: 1, px: 0.5 }}>
          <Box px={1} pt={1}>
            <Typography variant="caption" fontWeight={600} color="text.secondary" display="flex" alignItems="center" gap={0.5} mb={0.5}>
              <StorefrontIcon sx={{ fontSize: 14 }} />
              {currentFloor?.name || `${activeFloor}. Kat`} — {currentFloor?.stores.length || 0} mağaza
            </Typography>
          </Box>
          <List dense sx={{ p: 0 }}>
            {currentFloor?.stores.map(store => {
              const isSelected = selectedStoreName === store.name;
              return (
                <ListItem key={store.name} component="div"
                  onClick={() => { searchStore(store.name); const geo = svgToGeo(selectedMall, store.svgX, store.svgY); mapInstanceRef.current?.setCamera({ center: [geo.lng, geo.lat], zoom: 19, type: 'fly', duration: 500 }); }}
                  sx={{ cursor: 'pointer', borderRadius: 1.5, mb: 0.2, border: isSelected ? '2px solid #1a6b52' : '1px solid transparent', bgcolor: isSelected ? 'rgba(26,107,82,0.06)' : 'transparent', '&:hover': { bgcolor: 'rgba(26,107,82,0.04)' } }}>
                  <ListItemIcon sx={{ minWidth: 22 }}>
                    <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#c0392b', border: '1px solid #fff', boxShadow: '0 0 0 1px #c0392b' }} />
                  </ListItemIcon>
                  <ListItemText primary={store.name} primaryTypographyProps={{ variant: 'body2', fontWeight: isSelected ? 700 : 500, fontSize: '0.76rem' }} />
                </ListItem>
              );
            })}
          </List>
        </Box>
      </Paper>

      <Box sx={{ flexGrow: 1, position: 'relative' }}>
        {svgLoading && <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 10 }}><CircularProgress /></Box>}
        <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
        <Box sx={{ position: 'absolute', top: 12, left: 12, bgcolor: '#1a6b52', color: '#fff', px: 2, py: 0.5, borderRadius: 2, fontWeight: 700, fontSize: '0.8rem', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
          {selectedMall.name} — {currentFloor?.name || `${activeFloor}. Kat`}
        </Box>
      </Box>

      {panelStore && <StoreProductsPanel store={panelStore} onClose={() => { setPanelStore(null); setSelectedStoreName(null); }} />}
    </Box>
  );
}
