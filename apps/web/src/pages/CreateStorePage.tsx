import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import Avatar from '@mui/material/Avatar';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import * as atlas from 'azure-maps-control';
import 'azure-maps-control/dist/atlas.min.css';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import StorefrontIcon from '@mui/icons-material/Storefront';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import ApartmentIcon from '@mui/icons-material/Apartment';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import Autocomplete from '@mui/material/Autocomplete';
import { TURKEY_CITIES, getDistricts } from '@utils/turkey-locations';
import { locationService } from '@services/api/location.service';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import BuildIcon from '@mui/icons-material/Build';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import EditLocationIcon from '@mui/icons-material/EditLocation';
import { useAppSelector } from '@store/hooks';
import apiClient from '@services/api/client';
import { productService } from '@services/api/product.service';

const STEPS = ['Mağaza Bilgileri', 'Kategori & Konum', 'İletişim & Saatler'];

const FALLBACK_CATEGORIES = [
  'Elektronik', 'Kozmetik', 'Moda & Giyim', 'Ayakkabı & Çanta',
  'Ev & Yaşam', 'Spor & Outdoor', 'Kitap & Kırtasiye', 'Oyuncak & Hobi',
  'Anne & Çocuk', 'Süpermarket', 'Saat & Aksesuar', 'Hediyelik',
];

const STORE_TYPES = [
  { value: 'shopping', label: 'Alışveriş', icon: <ShoppingBagIcon />, description: 'Ürün satışı (elektronik, giyim, market vb.)', color: '#0099cc' },
  { value: 'service', label: 'Profesyonel Hizmet', icon: <BuildIcon />, description: 'Temizlik, tadilat, eğitim, danışmanlık vb.', color: '#7b1fa2' },
  { value: 'automotive', label: 'Otomotiv', icon: <DirectionsCarIcon />, description: 'Araç alım-satım, galeri, yedek parça', color: '#1a237e' },
  { value: 'realestate', label: 'Emlak', icon: <ApartmentIcon />, description: 'Gayrimenkul, kiralık & satılık emlak', color: '#b71c1c' },
  { value: 'food', label: 'Yeme/İçme', icon: <RestaurantIcon />, description: 'Restoran, kafe, pastane, fast food vb.', color: '#e65100' },
  { value: 'producer', label: 'Üretici', icon: <PrecisionManufacturingIcon />, description: 'Üretici, imalatçı, kooperatif, çiftlik', color: '#2e7d32' },
] as const;

interface StoreForm {
  name: string;
  description: string;
  storeType: 'shopping' | 'service' | 'automotive' | 'realestate' | 'food' | 'producer';
  logo: string;
  coverImage: string;
  categories: string[];
  latitude: number | null;
  longitude: number | null;
  address: { city: string; district: string; street: string };
  contactInfo: { phone: string; email: string; website: string };
  openingHours: { weekdays: string; saturday: string; sunday: string };
}

export default function CreateStorePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isEditMode = location.pathname.includes('edit-store');
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [manualCoords, setManualCoords] = useState(false);
  const [loadingStore, setLoadingStore] = useState(isEditMode);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<atlas.Map | null>(null);
  const markerRef = useRef<atlas.HtmlMarker | null>(null);
  const [availableCategories, setAvailableCategories] = useState<string[]>(FALLBACK_CATEGORIES);

  useEffect(() => {
    productService.getCategories().then((res: any) => { if (res?.data?.length) setAvailableCategories(res.data); }).catch(() => {});
  }, []);

  const [form, setForm] = useState<StoreForm>({
    name: '',
    description: '',
    storeType: 'shopping',
    logo: '',
    coverImage: '',
    categories: [],
    latitude: null,
    longitude: null,
    address: { city: '', district: '', street: '' },
    contactInfo: { phone: '', email: user?.email || '', website: '' },
    openingHours: { weekdays: '09:00 - 18:00', saturday: '10:00 - 16:00', sunday: 'Kapalı' },
  });

  // Load existing store data in edit mode
  useEffect(() => {
    if (!isEditMode) return;
    (async () => {
      try {
        const res = await apiClient.get('/stores/my-store');
        const store = res.data?.data;
        if (!store) { navigate('/dashboard/create-store'); return; }

        const addr = store.address || {};
        const contact = store.contactInfo || {};
        const hours = store.openingHours || [];
        const weekdays = hours.find((h: any) => h.days?.includes('Cuma'))?.hours || '09:00 - 18:00';
        const saturday = hours.find((h: any) => h.days?.includes('Cumartesi'))?.hours || '10:00 - 16:00';
        const sunday = hours.find((h: any) => h.days?.includes('Pazar'))?.hours || 'Kapalı';

        setForm({
          name: store.name || '',
          description: store.description || '',
          storeType: store.storeType || 'shopping',
          logo: store.logo || '',
          coverImage: store.coverImage || '',
          categories: store.categories || [],
          latitude: store.latitude || null,
          longitude: store.longitude || null,
          address: { city: addr.city || '', district: addr.district || '', street: addr.street || '' },
          contactInfo: { phone: contact.phone || '', email: contact.email || user?.email || '', website: contact.website || '' },
          openingHours: { weekdays, saturday, sunday },
        });
      } catch {
        navigate('/dashboard/create-store');
      } finally {
        setLoadingStore(false);
      }
    })();
  }, [isEditMode]);

  // Initialize map when on step 1
  useEffect(() => {
    if (step !== 1 || !mapContainerRef.current || mapRef.current) return;

    const defaultLat = form.latitude || 41.0082;
    const defaultLng = form.longitude || 28.9784;

    const AZURE_KEY = import.meta.env.VITE_AZURE_MAPS_KEY || '';
    const map = new atlas.Map(mapContainerRef.current, {
      center: [defaultLng, defaultLat],
      zoom: 13,
      style: 'road',
      language: 'tr-TR',
      authOptions: { authType: atlas.AuthenticationType.subscriptionKey, subscriptionKey: AZURE_KEY },
      showFeedbackLink: false, showLogo: false,
    });

    map.events.add('ready', () => {
      map.controls.add([new atlas.control.ZoomControl()], { position: atlas.ControlPosition.TopRight });

      const marker = new atlas.HtmlMarker({
        position: [defaultLng, defaultLat],
        draggable: true,
        htmlContent: `<div style="width:36px;height:36px;border-radius:50% 50% 50% 0;background:#1a6b52;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;"><span style="transform:rotate(45deg);color:white;font-size:16px;">📍</span></div>`,
        anchor: 'bottom',
      });
      map.markers.add(marker);
      markerRef.current = marker;

      // Marker sürükleme
      map.events.add('dragend', marker, () => {
        const pos = marker.getOptions().position;
        if (pos) setForm((prev) => ({ ...prev, latitude: pos[1], longitude: pos[0] }));
      });

      // Haritaya tıklayınca marker'ı taşı
      map.events.add('click', (e: atlas.MapMouseEvent) => {
        if (e.position) {
          marker.setOptions({ position: e.position });
          setForm((prev) => ({ ...prev, latitude: e.position![1], longitude: e.position![0] }));
        }
      });

      // Mevcut konum varsa oraya git
      if (form.latitude && form.longitude) {
        map.setCamera({ center: [form.longitude, form.latitude], zoom: 15 });
        marker.setOptions({ position: [form.longitude, form.latitude] });
      }
    });

    mapRef.current = map;

    return () => {
      map.dispose();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [step]);

  // Update map marker when coordinates change from GPS or manual input
  useEffect(() => {
    if (mapRef.current && markerRef.current && form.latitude && form.longitude) {
      markerRef.current.setOptions({ position: [form.longitude, form.latitude] });
      mapRef.current.setCamera({ center: [form.longitude, form.latitude], zoom: 15 });
    }
  }, [form.latitude, form.longitude]);

  if (!isAuthenticated || user?.role !== 'store_owner') {
    navigate('/login');
    return null;
  }

  if (loadingStore) {
    return (
      <Box maxWidth={700} mx="auto" textAlign="center" py={8}>
        <Typography color="text.secondary">Mağaza bilgileri yükleniyor...</Typography>
      </Box>
    );
  }

  const updateForm = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateNested = (parent: 'address' | 'contactInfo' | 'openingHours', field: string, value: string) => {
    setForm((prev) => ({ ...prev, [parent]: { ...prev[parent], [field]: value } }));
  };

  const toggleCategory = (cat: string) => {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter((c) => c !== cat)
        : prev.categories.length < 5 ? [...prev.categories, cat] : prev.categories,
    }));
  };

  const detectLocation = () => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setForm((prev) => ({ ...prev, latitude, longitude }));

        // Reverse geocoding ile adresi doldur
        try {
          const res = await locationService.reverseGeocode(latitude, longitude);
          const data: any = res.data || {};
          const city = TURKEY_CITIES.find(
            (c) => c.toLocaleLowerCase('tr') === (data.city || '').toLocaleLowerCase('tr'),
          ) || data.city || '';
          const districts = city ? getDistricts(city) : [];
          const district = districts.find(
            (d) => d.toLocaleLowerCase('tr') === (data.district || '').toLocaleLowerCase('tr'),
          ) || data.district || '';

          setForm((prev) => ({
            ...prev,
            address: {
              ...prev.address,
              city,
              district,
              street: data.street || prev.address.street,
            },
          }));
        } catch { /* reverse geocode başarısız, sadece koordinat kaldı */ }
      },
      () => setError('Konum alınamadı'),
      { enableHighAccuracy: true },
    );
  };

  const canNext = () => {
    if (step === 0) return form.name.length >= 2 && form.description.length >= 10;
    if (step === 1) return form.categories.length > 0;
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        name: form.name,
        description: form.description,
        storeType: form.storeType,
        logo: form.logo || undefined,
        coverImage: form.coverImage || undefined,
        categories: form.categories,
        latitude: form.latitude || undefined,
        longitude: form.longitude || undefined,
        address: form.address,
        contactInfo: Object.fromEntries(
          Object.entries(form.contactInfo).filter(([, v]) => v),
        ),
        openingHours: [
          { days: 'Pazartesi-Cuma', hours: form.openingHours.weekdays },
          { days: 'Cumartesi', hours: form.openingHours.saturday },
          { days: 'Pazar', hours: form.openingHours.sunday },
        ],
      };

      if (isEditMode) {
        await apiClient.put('/stores/my-store', payload);
      } else {
        await apiClient.post('/stores/create', payload);
      }
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Mağaza oluşturulamadı');
    }
    setSubmitting(false);
  };

  return (
    <Box maxWidth={700} mx="auto">
      <Box textAlign="center" mb={4}>
        <Avatar sx={{ width: 64, height: 64, bgcolor: '#0099cc', mx: 'auto', mb: 2 }}>
          <StorefrontIcon sx={{ fontSize: 32 }} />
        </Avatar>
        <Typography variant="h4" fontWeight={700}>{isEditMode ? 'Mağazanızı Düzenleyin' : 'Mağazanızı Oluşturun'}</Typography>
        <Typography color="text.secondary" mt={1}>
          {isEditMode ? 'Mağaza bilgilerinizi güncelleyin' : 'Birkaç adımda mağazanızı açın ve ürünlerinizi satışa sunun'}
        </Typography>
      </Box>

      <Stepper activeStep={step} sx={{ mb: 4 }}>
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ p: 3, mb: 3 }}>
        {/* Step 0: Basic Info */}
        {step === 0 && (
          <Box>
            <Typography variant="h6" fontWeight={600} mb={1}>Faaliyet Alanı</Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Mağazanızın faaliyet alanını seçin
            </Typography>
            <ToggleButtonGroup
              value={form.storeType}
              exclusive
              onChange={(_, val) => val && updateForm('storeType', val)}
              sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap', '& .MuiToggleButtonGroup-grouped': { border: 'none' } }}
            >
              {STORE_TYPES.map((st) => (
                <ToggleButton
                  key={st.value}
                  value={st.value}
                  sx={{
                    flex: 1,
                    minWidth: 140,
                    flexDirection: 'column',
                    gap: 0.5,
                    py: 2,
                    px: 2,
                    borderRadius: '12px !important',
                    border: '2px solid !important',
                    borderColor: form.storeType === st.value ? `${st.color} !important` : 'divider !important',
                    bgcolor: form.storeType === st.value ? `${st.color}10` : 'transparent',
                    transition: 'all 0.2s',
                    '&:hover': { bgcolor: `${st.color}08` },
                    '&.Mui-selected': { bgcolor: `${st.color}12`, color: st.color },
                  }}
                >
                  <Box sx={{ color: form.storeType === st.value ? st.color : 'text.secondary', fontSize: 32, lineHeight: 1 }}>
                    {st.icon}
                  </Box>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ color: form.storeType === st.value ? st.color : 'text.primary' }}>
                    {st.label}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.3 }}>
                    {st.description}
                  </Typography>
                </ToggleButton>
              ))}
            </ToggleButtonGroup>

            <Typography variant="h6" fontWeight={600} mb={2}>Temel Bilgiler</Typography>
            <TextField
              label="Mağaza Adı"
              fullWidth
              value={form.name}
              onChange={(e) => updateForm('name', e.target.value)}
              helperText="Müşterilerinizin göreceği mağaza adı"
              sx={{ mb: 2 }}
            />
            <TextField
              label="Mağaza Açıklaması"
              fullWidth
              multiline
              rows={4}
              value={form.description}
              onChange={(e) => updateForm('description', e.target.value)}
              helperText="Mağazanızı ve sunduğunuz ürünleri kısaca tanıtın"
              inputProps={{ maxLength: 2000 }}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Logo URL (isteğe bağlı)"
              fullWidth
              value={form.logo}
              onChange={(e) => updateForm('logo', e.target.value)}
              placeholder="https://..."
              sx={{ mb: 2 }}
            />
            <TextField
              label="Kapak Görseli URL (isteğe bağlı)"
              fullWidth
              value={form.coverImage}
              onChange={(e) => updateForm('coverImage', e.target.value)}
              placeholder="https://..."
            />
          </Box>
        )}

        {/* Step 1: Categories & Location */}
        {step === 1 && (
          <Box>
            <Typography variant="h6" fontWeight={600} mb={1}>Kategoriler</Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Mağazanızla ilgili en fazla 5 kategori seçin
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1} mb={4}>
              {availableCategories.map((cat) => (
                <Chip
                  key={cat}
                  label={cat}
                  color={form.categories.includes(cat) ? 'primary' : 'default'}
                  variant={form.categories.includes(cat) ? 'filled' : 'outlined'}
                  onClick={() => toggleCategory(cat)}
                />
              ))}
            </Box>

            <Typography variant="h6" fontWeight={600} mb={1}>Konum</Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Haritaya tıklayarak veya işaretçiyi sürükleyerek mağaza konumunu belirleyin
            </Typography>

            {/* Map */}
            <Box
              ref={mapContainerRef}
              sx={{
                width: '100%',
                height: 300,
                borderRadius: 2,
                overflow: 'hidden',
                border: '1px solid',
                borderColor: 'divider',
                mb: 2,
              }}
            />

            {/* Location actions */}
            <Box display="flex" alignItems="center" gap={1} mb={2} flexWrap="wrap">
              <Button
                variant="outlined"
                startIcon={<MyLocationIcon />}
                onClick={detectLocation}
                size="small"
              >
                Mevcut Konumumu Kullan
              </Button>
              <FormControlLabel
                control={<Switch checked={manualCoords} onChange={(e) => setManualCoords(e.target.checked)} size="small" />}
                label={<Typography variant="body2">Manuel koordinat gir</Typography>}
              />
              {form.latitude && !manualCoords && (
                <Chip
                  icon={<EditLocationIcon />}
                  label={`${form.latitude.toFixed(5)}, ${form.longitude?.toFixed(5)}`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              )}
            </Box>

            {/* Manual coordinate inputs */}
            {manualCoords && (
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <TextField
                    label="Enlem (Latitude)"
                    fullWidth
                    type="number"
                    size="small"
                    value={form.latitude ?? ''}
                    onChange={(e) => updateForm('latitude', e.target.value ? parseFloat(e.target.value) : null)}
                    inputProps={{ step: 0.00001 }}
                    helperText="Örn: 41.00820"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Boylam (Longitude)"
                    fullWidth
                    type="number"
                    size="small"
                    value={form.longitude ?? ''}
                    onChange={(e) => updateForm('longitude', e.target.value ? parseFloat(e.target.value) : null)}
                    inputProps={{ step: 0.00001 }}
                    helperText="Örn: 28.97840"
                  />
                </Grid>
              </Grid>
            )}

            <Typography variant="subtitle2" fontWeight={600} mb={1}>Adres</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Autocomplete
                  size="small"
                  options={TURKEY_CITIES}
                  value={form.address.city || null}
                  onChange={(_, v) => {
                    setForm((prev) => ({
                      ...prev,
                      address: { ...prev.address, city: v || '', district: '' },
                    }));
                  }}
                  renderInput={(params) => <TextField {...params} label="Şehir" fullWidth />}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Autocomplete
                  size="small"
                  options={form.address.city ? getDistricts(form.address.city) : []}
                  value={form.address.district || null}
                  onChange={(_, v) => updateNested('address', 'district', v || '')}
                  disabled={!form.address.city}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="İlçe"
                      fullWidth
                      placeholder={!form.address.city ? 'Önce şehir seçin' : 'İlçe seç...'}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Sokak / Cadde"
                  fullWidth
                  size="small"
                  value={form.address.street}
                  onChange={(e) => updateNested('address', 'street', e.target.value)}
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Step 2: Contact & Hours */}
        {step === 2 && (
          <Box>
            <Typography variant="h6" fontWeight={600} mb={2}>İletişim Bilgileri</Typography>
            <Grid container spacing={2} mb={4}>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Telefon"
                  fullWidth
                  value={form.contactInfo.phone}
                  onChange={(e) => updateNested('contactInfo', 'phone', e.target.value)}
                  placeholder="+90 5XX XXX XXXX"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="E-posta"
                  fullWidth
                  value={form.contactInfo.email}
                  onChange={(e) => updateNested('contactInfo', 'email', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Web Sitesi (isteğe bağlı)"
                  fullWidth
                  value={form.contactInfo.website}
                  onChange={(e) => updateNested('contactInfo', 'website', e.target.value)}
                  placeholder="https://..."
                />
              </Grid>
            </Grid>

            <Typography variant="h6" fontWeight={600} mb={2}>Çalışma Saatleri</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Hafta içi"
                  fullWidth
                  value={form.openingHours.weekdays}
                  onChange={(e) => updateNested('openingHours', 'weekdays', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Cumartesi"
                  fullWidth
                  value={form.openingHours.saturday}
                  onChange={(e) => updateNested('openingHours', 'saturday', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Pazar"
                  fullWidth
                  value={form.openingHours.sunday}
                  onChange={(e) => updateNested('openingHours', 'sunday', e.target.value)}
                />
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>

      {/* Navigation Buttons */}
      <Box display="flex" justifyContent="space-between">
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0}
        >
          Geri
        </Button>

        {step < STEPS.length - 1 ? (
          <Button
            variant="contained"
            endIcon={<ArrowForwardIcon />}
            onClick={() => setStep((s) => s + 1)}
            disabled={!canNext()}
          >
            İleri
          </Button>
        ) : (
          <Button
            variant="contained"
            endIcon={<CheckCircleIcon />}
            onClick={handleSubmit}
            disabled={submitting || !canNext()}
            sx={{ bgcolor: '#0099cc', '&:hover': { bgcolor: '#007a99' } }}
          >
            {submitting ? (isEditMode ? 'Güncelleniyor...' : 'Oluşturuluyor...') : (isEditMode ? 'Mağazayı Güncelle' : 'Mağazayı Oluştur')}
          </Button>
        )}
      </Box>

      <Snackbar open={success} autoHideDuration={3000} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity="success" variant="filled" icon={<CheckCircleIcon />}>
          {isEditMode ? 'Mağazanız başarıyla güncellendi!' : 'Mağazanız başarıyla oluşturuldu!'} Dashboard'a yönlendiriliyorsunuz...
        </Alert>
      </Snackbar>
    </Box>
  );
}
