import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Chip from '@mui/material/Chip';
import Pagination from '@mui/material/Pagination';
import Skeleton from '@mui/material/Skeleton';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VerifiedIcon from '@mui/icons-material/Verified';
import StorefrontIcon from '@mui/icons-material/Storefront';
import StarIcon from '@mui/icons-material/Star';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import PaymentIcon from '@mui/icons-material/Payment';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import AddIcon from '@mui/icons-material/Add';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LockResetIcon from '@mui/icons-material/LockReset';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';
import adminService from '@services/api/admin.service';
import apiClient from '@services/api/client';
import { locationService } from '@services/api/location.service';
import { TURKEY_CITIES, getDistricts } from '@utils/turkey-locations';

const formatCurrency = (v: number) => v > 0 ? v.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' ₺' : '-';

const STORE_TYPE_LABELS: Record<string, string> = {
  shopping: 'Mağaza',
  automotive: 'Otomotiv',
  realestate: 'Emlak',
  food: 'Yeme/İçme',
  producer: 'Üretici',
};

const SUB_STATUS_CONFIG: Record<string, { label: string; color: 'success' | 'error' | 'warning' | 'default' }> = {
  active: { label: 'Aktif', color: 'success' },
  overdue: { label: 'Gecikmiş', color: 'error' },
  suspended: { label: 'Askıda', color: 'warning' },
  none: { label: 'Abonelik Yok', color: 'default' },
};

export default function AdminStoresPage() {
  const navigate = useNavigate();
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [verifiedFilter, setVerifiedFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [subFilter, setSubFilter] = useState('');
  const [salesPeriod, setSalesPeriod] = useState<'monthly' | 'yearly' | 'total'>('monthly');
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' as 'success' | 'error' });
  const [paymentDialog, setPaymentDialog] = useState<{ open: boolean; storeId: string; storeName: string; months: number }>({ open: false, storeId: '', storeName: '', months: 1 });

  // Mağaza Ekle dialog state
  const [createDialog, setCreateDialog] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '', description: '', storeType: 'shopping' as 'shopping' | 'automotive' | 'realestate' | 'food' | 'producer',
    categories: [] as string[], city: '', district: '', street: '',
    phone: '', email: '', latitude: '', longitude: '',
    ownerEmail: '', ownerPassword: '', isVerified: true, isActive: true,
  });
  const [creating, setCreating] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string; verifyUrl?: string } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setSnack({ open: true, msg: 'Tarayıcınız konum servisini desteklemiyor', severity: 'error' });
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await locationService.reverseGeocode(pos.coords.latitude, pos.coords.longitude);
          const data: any = res.data || {};
          const city = TURKEY_CITIES.find(
            (c) => c.toLocaleLowerCase('tr') === (data.city || '').toLocaleLowerCase('tr'),
          ) || data.city || '';
          const districts = city ? getDistricts(city) : [];
          const district = districts.find(
            (d) => d.toLocaleLowerCase('tr') === (data.district || '').toLocaleLowerCase('tr'),
          ) || data.district || '';

          setCreateForm((f) => ({
            ...f,
            latitude: String(pos.coords.latitude),
            longitude: String(pos.coords.longitude),
            city,
            district,
            street: data.street || f.street,
          }));
          setSnack({ open: true, msg: 'Konum bilgileri dolduruldu', severity: 'success' });
        } catch {
          setSnack({ open: true, msg: 'Adres bilgileri alınamadı', severity: 'error' });
        } finally {
          setLocationLoading(false);
        }
      },
      (err) => {
        setLocationLoading(false);
        setSnack({
          open: true,
          msg: err.code === 1 ? 'Konum izni reddedildi' : 'Konum alınamadı',
          severity: 'error',
        });
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };
  const [availableCategories, setAvailableCategories] = useState<string[]>([
    'Elektronik', 'Kozmetik', 'Moda & Giyim', 'Ayakkabı & Çanta',
    'Ev & Yaşam', 'Spor & Outdoor', 'Kitap & Kırtasiye', 'Oyuncak & Hobi',
    'Anne & Çocuk', 'Süpermarket', 'Saat & Aksesuar', 'Hediyelik',
    'Kadın', 'Erkek',
  ]);

  useEffect(() => {
    adminService.getCategories().then((res: any) => {
      if (res?.data?.length) setAvailableCategories(res.data);
    }).catch(() => {});
  }, []);

  const fetchStores = useCallback(() => {
    setLoading(true);
    const params: Record<string, any> = { page, limit: 20 };
    if (search) params.search = search;
    if (verifiedFilter) params.isVerified = verifiedFilter;
    if (activeFilter) params.isActive = activeFilter;
    if (subFilter) params.subscriptionStatus = subFilter;
    adminService.getStores(params)
      .then((res: any) => { setStores(res.data || []); setTotalPages(res.pagination?.totalPages || 1); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, search, verifiedFilter, activeFilter, subFilter]);

  useEffect(() => { fetchStores(); }, [fetchStores]);

  const handleVerify = async (id: string, current: boolean) => {
    try {
      await adminService.verifyStore(id, !current);
      setSnack({ open: true, msg: !current ? 'Mağaza onaylandı' : 'Onay kaldırıldı', severity: 'success' });
      fetchStores();
    } catch {
      setSnack({ open: true, msg: 'İşlem başarısız', severity: 'error' });
    }
  };

  const handleStatusToggle = async (id: string, current: boolean) => {
    try {
      await adminService.updateStoreStatus(id, !current);
      setSnack({ open: true, msg: !current ? 'Mağaza aktifleştirildi' : 'Mağaza deaktif edildi', severity: 'success' });
      fetchStores();
    } catch {
      setSnack({ open: true, msg: 'İşlem başarısız', severity: 'error' });
    }
  };

  const handleRecordPayment = async () => {
    try {
      await adminService.recordPayment(paymentDialog.storeId, paymentDialog.months);
      setSnack({ open: true, msg: `${paymentDialog.months} aylık ödeme kaydedildi`, severity: 'success' });
      setPaymentDialog({ open: false, storeId: '', storeName: '', months: 1 });
      fetchStores();
    } catch {
      setSnack({ open: true, msg: 'Ödeme kaydı başarısız', severity: 'error' });
    }
  };

  const handleSendReminder = async (storeId: string) => {
    try {
      await adminService.sendReminder(storeId);
      setSnack({ open: true, msg: 'Hatırlatma gönderildi', severity: 'success' });
    } catch {
      setSnack({ open: true, msg: 'Hatırlatma gönderilemedi', severity: 'error' });
    }
  };

  const handleCreateStore = async () => {
    if (!createForm.name || createForm.name.length < 2) {
      setSnack({ open: true, msg: 'Mağaza adı en az 2 karakter olmalı', severity: 'error' });
      return;
    }
    if (!createForm.ownerEmail) {
      setSnack({ open: true, msg: 'Mağaza sahibi e-posta adresi zorunludur', severity: 'error' });
      return;
    }
    if (!createForm.ownerPassword || createForm.ownerPassword.length < 6) {
      setSnack({ open: true, msg: 'Giriş şifresi en az 6 karakter olmalı', severity: 'error' });
      return;
    }
    setCreating(true);
    try {
      const createRes = await adminService.createStore({
        name: createForm.name,
        description: createForm.description || ' ',
        storeType: createForm.storeType,
        categories: createForm.categories,
        latitude: createForm.latitude ? Number(createForm.latitude) : undefined,
        longitude: createForm.longitude ? Number(createForm.longitude) : undefined,
        address: {
          city: createForm.city || undefined,
          district: createForm.district || undefined,
          street: createForm.street || undefined,
        },
        contactInfo: {
          phone: createForm.phone || undefined,
          email: createForm.email || undefined,
        },
        ownerEmail: createForm.ownerEmail || undefined,
        ownerPassword: createForm.ownerPassword || undefined,
        isVerified: createForm.isVerified,
        isActive: createForm.isActive,
      });
      // Giriş bilgilerini göster
      if (createForm.ownerEmail) {
        setCreatedCredentials({
          email: createForm.ownerEmail,
          password: createForm.ownerPassword || '(mevcut şifre)',
          verifyUrl: createRes?.verifyUrl || undefined,
        });
      }
      // Kullanıcı onay bekliyor — uyar
      setSnack({ open: true, msg: 'Mağaza oluşturuldu! Üyelik onay e-postası gönderildi. Onaylanana kadar hesap deaktif.', severity: 'success' });
      setSnack({ open: true, msg: 'Mağaza başarıyla oluşturuldu', severity: 'success' });
      setCreateDialog(false);
      setCreateForm({
        name: '', description: '', storeType: 'shopping' as const,
        categories: [], city: '', district: '', street: '',
        phone: '', email: '', latitude: '', longitude: '',
        ownerEmail: '', ownerPassword: '', isVerified: true, isActive: true,
      });
      fetchStores();
    } catch (e: any) {
      setSnack({ open: true, msg: e.response?.data?.message || 'Mağaza oluşturulamadı', severity: 'error' });
    } finally {
      setCreating(false);
    }
  };

  const handleResetPassword = async (userId: string, _email?: string) => {
    const newPass = 'VVC' + Math.random().toString(36).slice(2, 8);
    try {
      await apiClient.patch(`/admin/users/${userId}/reset-password`, { password: newPass });
      setSnack({ open: true, msg: `Şifre sıfırlandı: ${newPass} — kopyalayın!`, severity: 'success' });
      // Clipboard'a kopyala
      navigator.clipboard?.writeText(newPass).catch(() => {});
    } catch {
      setSnack({ open: true, msg: 'Şifre sıfırlanamadı', severity: 'error' });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard?.writeText(text).then(() => {
      setSnack({ open: true, msg: 'Kopyalandı!', severity: 'success' });
    });
  };

  const handleInitSubscriptions = async () => {
    try {
      await adminService.initAllSubscriptions();
      setSnack({ open: true, msg: 'Tüm mağazalara abonelik atandı', severity: 'success' });
      fetchStores();
    } catch {
      setSnack({ open: true, msg: 'İşlem başarısız', severity: 'error' });
    }
  };

  const getSubStatus = (store: any) => {
    if (!store.subscription) return 'none';
    if (store.subscription.isOverdue) return 'overdue';
    return store.subscription.subscriptionStatus || 'none';
  };

  const formatDate = (d: string | null) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('tr-TR');
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>Mağaza Yönetimi</Typography>
        <Box display="flex" gap={1}>
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => setCreateDialog(true)}>
            Mağaza Ekle
          </Button>
          <Button variant="outlined" size="small" onClick={handleInitSubscriptions}>
            Tüm Mağazalara Abonelik Ata
          </Button>
        </Box>
      </Box>

      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        <TextField size="small" placeholder="Mağaza adı ara..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} sx={{ minWidth: 250 }} />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Onay</InputLabel>
          <Select value={verifiedFilter} label="Onay" onChange={(e) => { setVerifiedFilter(e.target.value); setPage(1); }}>
            <MenuItem value="">Tümü</MenuItem>
            <MenuItem value="true">Onaylı</MenuItem>
            <MenuItem value="false">Onaysız</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Durum</InputLabel>
          <Select value={activeFilter} label="Durum" onChange={(e) => { setActiveFilter(e.target.value); setPage(1); }}>
            <MenuItem value="">Tümü</MenuItem>
            <MenuItem value="true">Aktif</MenuItem>
            <MenuItem value="false">Pasif</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Aidat Durumu</InputLabel>
          <Select value={subFilter} label="Aidat Durumu" onChange={(e) => { setSubFilter(e.target.value); setPage(1); }}>
            <MenuItem value="">Tümü</MenuItem>
            <MenuItem value="active">Aktif</MenuItem>
            <MenuItem value="overdue">Gecikmiş</MenuItem>
            <MenuItem value="suspended">Askıda</MenuItem>
            <MenuItem value="none">Abonelik Yok</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Sales Period Toggle */}
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <Typography variant="body2" color="text.secondary" fontWeight={500}>Satış Dönemi:</Typography>
        <ToggleButtonGroup
          value={salesPeriod}
          exclusive
          onChange={(_, v) => v && setSalesPeriod(v)}
          size="small"
        >
          <ToggleButton value="monthly" sx={{ px: 1.5, py: 0.3, fontSize: 12 }}>Aylık</ToggleButton>
          <ToggleButton value="yearly" sx={{ px: 1.5, py: 0.3, fontSize: 12 }}>Yıllık</ToggleButton>
          <ToggleButton value="total" sx={{ px: 1.5, py: 0.3, fontSize: 12 }}>Toplam</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {loading ? (
        <Skeleton variant="rounded" height={400} />
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Mağaza</TableCell>
                <TableCell>Sahip / Giriş Bilgileri</TableCell>
                <TableCell align="center">Tür</TableCell>
                <TableCell align="center">Puan</TableCell>
                <TableCell align="center">Satış Adet</TableCell>
                <TableCell align="center">Satış Tutar</TableCell>
                <TableCell align="center">Aidat</TableCell>
                <TableCell align="center">Onay</TableCell>
                <TableCell align="center">Durum</TableCell>
                <TableCell align="center" sx={{ width: 120 }}>İşlemler</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {stores.length === 0 ? (
                <TableRow><TableCell colSpan={10} align="center"><Typography color="text.secondary" py={3}>Mağaza bulunamadı</Typography></TableCell></TableRow>
              ) : stores.map((s) => {
                const subStatus = getSubStatus(s);
                const subCfg = SUB_STATUS_CONFIG[subStatus] || SUB_STATUS_CONFIG.none;
                return (
                  <TableRow key={s.id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Avatar src={s.logo} variant="rounded" sx={{ width: 36, height: 36, bgcolor: '#e3f2fd' }}>
                          <StorefrontIcon sx={{ fontSize: 20 }} />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>{s.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{(s.categories as string[])?.slice(0, 2).join(', ')}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{s.owner ? `${s.owner.name} ${s.owner.surname || ''}` : '-'}</Typography>
                      {s.owner?.email && (
                        <Box display="flex" alignItems="center" gap={0.3}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>{s.owner.email}</Typography>
                          <IconButton size="small" sx={{ p: 0.2 }} onClick={() => copyToClipboard(s.owner.email)}>
                            <ContentCopyIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                          </IconButton>
                        </Box>
                      )}
                      {s.owner?.phone && (
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', display: 'block' }}>📱 {s.owner.phone}</Typography>
                      )}
                      {s.owner?.id && (
                        <Tooltip title="Şifre sıfırla (yeni şifre oluştur ve kopyala)">
                          <Button size="small" startIcon={<LockResetIcon sx={{ fontSize: 12 }} />}
                            onClick={() => handleResetPassword(s.owner.id, s.owner.email)}
                            sx={{ textTransform: 'none', fontSize: '0.6rem', py: 0, px: 0.5, mt: 0.3, minHeight: 0, color: 'warning.main' }}>
                            Şifre Sıfırla
                          </Button>
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={STORE_TYPE_LABELS[s.storeType] || 'Mağaza'} size="small" variant="outlined" sx={{ fontSize: 11 }} />
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" alignItems="center" justifyContent="center" gap={0.3}>
                        <StarIcon sx={{ fontSize: 16, color: '#f59e0b' }} />
                        <Typography variant="body2">{(s.ratingAverage || 0).toFixed(1)}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" fontWeight={600}>
                        {salesPeriod === 'monthly' ? (s.sales?.monthlyOrders || 0)
                          : salesPeriod === 'yearly' ? (s.sales?.yearlyOrders || 0)
                          : (s.sales?.totalOrders || 0)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" fontWeight={500} color={
                        (salesPeriod === 'monthly' ? s.sales?.monthlySales : salesPeriod === 'yearly' ? s.sales?.yearlySales : s.sales?.totalSales) > 0
                          ? 'success.main' : 'text.secondary'
                      }>
                        {formatCurrency(
                          salesPeriod === 'monthly' ? (s.sales?.monthlySales || 0)
                            : salesPeriod === 'yearly' ? (s.sales?.yearlySales || 0)
                            : (s.sales?.totalSales || 0)
                        )}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title={
                        s.subscription?.paidUntil
                          ? `Ödeme: ${formatDate(s.subscription.paidUntil)}${s.subscription.daysRemaining != null ? (Number(s.subscription.daysRemaining) < 0 ? ` (${Math.abs(s.subscription.daysRemaining)} gün gecikmiş)` : ` (${s.subscription.daysRemaining} gün kaldı)`) : ''}`
                          : 'Abonelik bilgisi yok'
                      }>
                        <Chip
                          label={subCfg.label}
                          color={subCfg.color}
                          size="small"
                          sx={{ fontSize: 11, fontWeight: 600 }}
                        />
                      </Tooltip>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title={s.isVerified ? 'Onayı kaldır' : 'Onayla'}>
                        <IconButton size="small" color={s.isVerified ? 'primary' : 'default'} onClick={() => handleVerify(s.id, s.isVerified)}>
                          <VerifiedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="center">
                      <Switch checked={s.isActive} size="small" onChange={() => handleStatusToggle(s.id, s.isActive)} />
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" gap={0.5} justifyContent="center">
                        <Tooltip title="Ödeme Kaydet">
                          <IconButton size="small" color="success" onClick={() => setPaymentDialog({ open: true, storeId: s.id, storeName: s.name, months: 1 })}>
                            <PaymentIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {subStatus === 'overdue' && (
                          <Tooltip title="Hatırlatma Gönder">
                            <IconButton size="small" color="warning" onClick={() => handleSendReminder(s.id)}>
                              <NotificationsActiveIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Detay">
                          <IconButton size="small" onClick={() => navigate(`/admin/stores/${s.id}`)}>
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={2}>
          <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" />
        </Box>
      )}

      {/* Mağaza Ekle Dialog */}
      <Dialog open={createDialog} onClose={() => !creating && setCreateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Yeni Mağaza Ekle</DialogTitle>
        <DialogContent dividers>
          <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={2} pt={1}>
            <TextField
              label="Mağaza Adı *"
              value={createForm.name}
              onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
              size="small"
              fullWidth
              required
              sx={{ gridColumn: { sm: '1 / -1' } }}
            />
            <TextField
              label="Açıklama"
              value={createForm.description}
              onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
              size="small"
              fullWidth
              multiline
              rows={2}
              sx={{ gridColumn: { sm: '1 / -1' } }}
            />
            <FormControl size="small" fullWidth>
              <InputLabel>Mağaza Türü</InputLabel>
              <Select
                value={createForm.storeType}
                label="Mağaza Türü"
                onChange={(e) => setCreateForm((f) => ({ ...f, storeType: e.target.value as any }))}
              >
                <MenuItem value="shopping">Mağaza</MenuItem>
                <MenuItem value="automotive">Otomotiv</MenuItem>
                <MenuItem value="realestate">Emlak</MenuItem>
                <MenuItem value="food">Yeme/İçme</MenuItem>
                <MenuItem value="producer">Üretici</MenuItem>
              </Select>
            </FormControl>
            <Autocomplete
              multiple
              size="small"
              options={availableCategories}
              value={createForm.categories}
              onChange={(_, v) => setCreateForm((f) => ({ ...f, categories: v }))}
              renderInput={(params) => <TextField {...params} label="Kategoriler" placeholder="Seç..." />}
            />
            <Box sx={{ gridColumn: { sm: '1 / -1' }, mt: 1, mb: -1 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={locationLoading ? <CircularProgress size={14} /> : <MyLocationIcon />}
                onClick={handleUseMyLocation}
                disabled={locationLoading}
                sx={{ borderRadius: 2, textTransform: 'none' }}
              >
                {locationLoading ? 'Konum alınıyor...' : 'Mevcut Konumu Kullan'}
              </Button>
            </Box>
            <Autocomplete
              size="small"
              options={TURKEY_CITIES}
              value={createForm.city || null}
              onChange={(_, v) => setCreateForm((f) => ({ ...f, city: v || '', district: '' }))}
              renderInput={(params) => <TextField {...params} label="Şehir" />}
            />
            <Autocomplete
              size="small"
              options={createForm.city ? getDistricts(createForm.city) : []}
              value={createForm.district || null}
              onChange={(_, v) => setCreateForm((f) => ({ ...f, district: v || '' }))}
              disabled={!createForm.city}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="İlçe"
                  placeholder={!createForm.city ? 'Önce şehir seçin' : 'İlçe seç...'}
                />
              )}
            />
            <TextField
              label="Adres (Sokak/Cadde)"
              value={createForm.street}
              onChange={(e) => setCreateForm((f) => ({ ...f, street: e.target.value }))}
              size="small"
              fullWidth
              sx={{ gridColumn: { sm: '1 / -1' } }}
            />
            <TextField
              label="Enlem (lat)"
              value={createForm.latitude}
              onChange={(e) => setCreateForm((f) => ({ ...f, latitude: e.target.value }))}
              size="small"
              fullWidth
              type="number"
              inputProps={{ step: 0.000001 }}
            />
            <TextField
              label="Boylam (lng)"
              value={createForm.longitude}
              onChange={(e) => setCreateForm((f) => ({ ...f, longitude: e.target.value }))}
              size="small"
              fullWidth
              type="number"
              inputProps={{ step: 0.000001 }}
            />
            <TextField
              label="Telefon"
              value={createForm.phone}
              onChange={(e) => setCreateForm((f) => ({ ...f, phone: e.target.value }))}
              size="small"
              fullWidth
            />
            <TextField
              label="E-posta"
              value={createForm.email}
              onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
              size="small"
              fullWidth
              type="email"
            />
            <TextField
              label="Mağaza Sahibi E-posta *"
              value={createForm.ownerEmail}
              onChange={(e) => setCreateForm((f) => ({ ...f, ownerEmail: e.target.value }))}
              size="small"
              fullWidth
              type="email"
              required
              helperText="Bu e-posta ile giriş yapılacak"
            />
            <TextField
              label="Giriş Şifresi *"
              value={createForm.ownerPassword}
              onChange={(e) => setCreateForm((f) => ({ ...f, ownerPassword: e.target.value }))}
              size="small"
              fullWidth
              required
              helperText="En az 6 karakter"
            />
            <Box display="flex" gap={2} sx={{ gridColumn: { sm: '1 / -1' } }}>
              <Box display="flex" alignItems="center" gap={1}>
                <Switch
                  checked={createForm.isVerified}
                  onChange={(e) => setCreateForm((f) => ({ ...f, isVerified: e.target.checked }))}
                  size="small"
                />
                <Typography variant="body2">Onaylı</Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <Switch
                  checked={createForm.isActive}
                  onChange={(e) => setCreateForm((f) => ({ ...f, isActive: e.target.checked }))}
                  size="small"
                />
                <Typography variant="body2">Aktif</Typography>
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog(false)} disabled={creating}>İptal</Button>
          <Button variant="contained" onClick={handleCreateStore} disabled={creating || !createForm.name || !createForm.ownerEmail || !createForm.ownerPassword}>
            {creating ? 'Oluşturuluyor...' : 'Mağaza Oluştur'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Giriş Bilgileri Dialog */}
      <Dialog open={!!createdCredentials} onClose={() => setCreatedCredentials(null)} maxWidth="xs" fullWidth>
        <DialogTitle>✅ Mağaza Oluşturuldu — Giriş Bilgileri</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>Bu bilgileri kaydedin, şifre bir daha gösterilmeyecek!</Alert>
          <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 2, fontFamily: 'monospace' }}>
            <Typography variant="body2" fontWeight={600} mb={1}>E-posta:</Typography>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <Typography variant="body1" fontWeight={700}>{createdCredentials?.email}</Typography>
              <IconButton size="small" onClick={() => copyToClipboard(createdCredentials?.email || '')}>
                <ContentCopyIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Box>
            <Typography variant="body2" fontWeight={600} mb={1}>Şifre:</Typography>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <Typography variant="body1" fontWeight={700}>{createdCredentials?.password}</Typography>
              <IconButton size="small" onClick={() => copyToClipboard(createdCredentials?.password || '')}>
                <ContentCopyIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Box>
            {createdCredentials?.verifyUrl && (
              <>
                <Typography variant="body2" fontWeight={600} mb={1} color="warning.main">⚠️ Onay Linki (hesap onaylanana kadar deaktif):</Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="caption" sx={{ wordBreak: 'break-all', color: '#1a6b52' }}>{createdCredentials.verifyUrl}</Typography>
                  <IconButton size="small" onClick={() => copyToClipboard(createdCredentials?.verifyUrl || '')}>
                    <ContentCopyIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Box>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setCreatedCredentials(null)}>Tamam</Button>
        </DialogActions>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={paymentDialog.open} onClose={() => setPaymentDialog((p) => ({ ...p, open: false }))} maxWidth="xs" fullWidth>
        <DialogTitle>Ödeme Kaydet — {paymentDialog.storeName}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>Ay Sayısı</InputLabel>
            <Select
              value={paymentDialog.months}
              label="Ay Sayısı"
              onChange={(e) => setPaymentDialog((p) => ({ ...p, months: Number(e.target.value) }))}
            >
              {[1, 2, 3, 6, 12].map((m) => (
                <MenuItem key={m} value={m}>{m} Ay</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialog((p) => ({ ...p, open: false }))}>İptal</Button>
          <Button variant="contained" onClick={handleRecordPayment}>Kaydet</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={snack.severity} variant="filled">{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
