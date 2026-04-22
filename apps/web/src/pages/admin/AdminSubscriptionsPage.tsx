import { useEffect, useState, useCallback } from 'react';
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
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Pagination from '@mui/material/Pagination';
import Skeleton from '@mui/material/Skeleton';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import InputAdornment from '@mui/material/InputAdornment';
import Divider from '@mui/material/Divider';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import StorefrontIcon from '@mui/icons-material/Storefront';
import BuildIcon from '@mui/icons-material/Build';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import BlockIcon from '@mui/icons-material/Block';
import PaymentIcon from '@mui/icons-material/Payment';
import EditIcon from '@mui/icons-material/Edit';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PauseCircleIcon from '@mui/icons-material/PauseCircle';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import adminService from '@services/api/admin.service';

const statusLabels: Record<string, string> = {
  active: 'Aktif',
  suspended: 'Askıda',
  cancelled: 'İptal',
};
const statusColors: Record<string, 'success' | 'error' | 'default' | 'warning'> = {
  active: 'success',
  suspended: 'error',
  cancelled: 'default',
};

const tabStoreTypes = ['store', 'service'];

export default function AdminSubscriptionsPage() {
  const [tab, setTab] = useState(0);
  const storeType = tabStoreTypes[tab];

  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [overdueFilter, setOverdueFilter] = useState('');
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' as 'success' | 'error' });

  // Edit dialog
  const [editDialog, setEditDialog] = useState<{ open: boolean; sub: any | null }>({ open: false, sub: null });
  const [editForm, setEditForm] = useState({ planType: 'basic', monthlyFee: '', paidUntil: '', notes: '' });

  // Payment dialog
  const [payDialog, setPayDialog] = useState<{ open: boolean; storeId: string; storeName: string }>({ open: false, storeId: '', storeName: '' });
  const [payMonths, setPayMonths] = useState(1);

  // Suspend overdue dialog
  const [suspendDialog, setSuspendDialog] = useState(false);
  const [graceDays, setGraceDays] = useState(7);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, limit: 20, storeType };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (overdueFilter) params.overdue = overdueFilter;

      const [subsRes, statsRes] = await Promise.all([
        adminService.getSubscriptions(params),
        adminService.getSubscriptionStats(),
      ]);
      setSubscriptions(subsRes.data || []);
      setTotalPages(subsRes.pagination?.totalPages || 1);
      setStats(statsRes.data || {});
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, overdueFilter, storeType]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleTabChange = (_: any, newTab: number) => {
    setTab(newTab);
    setPage(1);
    setSearch('');
    setStatusFilter('');
    setOverdueFilter('');
  };

  const handleInitAll = async () => {
    try {
      const res = await adminService.initAllSubscriptions();
      setSnack({ open: true, msg: `${res.created || 0} mağaza için abonelik oluşturuldu`, severity: 'success' });
      fetchData();
    } catch {
      setSnack({ open: true, msg: 'İşlem başarısız', severity: 'error' });
    }
  };

  const handleSendReminder = async (storeId: string) => {
    try {
      await adminService.sendReminder(storeId);
      setSnack({ open: true, msg: 'Hatırlatma gönderildi', severity: 'success' });
      fetchData();
    } catch {
      setSnack({ open: true, msg: 'Hatırlatma gönderilemedi', severity: 'error' });
    }
  };

  const handleSuspend = async (storeId: string) => {
    try {
      await adminService.updateSubscription(storeId, { status: 'suspended' });
      setSnack({ open: true, msg: 'Askıya alındı', severity: 'success' });
      fetchData();
    } catch {
      setSnack({ open: true, msg: 'İşlem başarısız', severity: 'error' });
    }
  };

  const handleReactivate = async (storeId: string) => {
    try {
      await adminService.updateSubscription(storeId, { status: 'active' });
      setSnack({ open: true, msg: 'Aktifleştirildi', severity: 'success' });
      fetchData();
    } catch {
      setSnack({ open: true, msg: 'İşlem başarısız', severity: 'error' });
    }
  };

  const handleRecordPayment = async () => {
    try {
      await adminService.recordPayment(payDialog.storeId, payMonths);
      setSnack({ open: true, msg: `${payMonths} aylık ödeme kaydedildi`, severity: 'success' });
      setPayDialog({ open: false, storeId: '', storeName: '' });
      fetchData();
    } catch {
      setSnack({ open: true, msg: 'Ödeme kaydedilemedi', severity: 'error' });
    }
  };

  const handleEditSave = async () => {
    if (!editDialog.sub) return;
    try {
      await adminService.updateSubscription(editDialog.sub.storeId, {
        planType: editForm.planType,
        monthlyFee: Number(editForm.monthlyFee),
        paidUntil: editForm.paidUntil || undefined,
        notes: editForm.notes || undefined,
      });
      setSnack({ open: true, msg: 'Abonelik güncellendi', severity: 'success' });
      setEditDialog({ open: false, sub: null });
      fetchData();
    } catch {
      setSnack({ open: true, msg: 'Güncelleme başarısız', severity: 'error' });
    }
  };

  const handleSuspendOverdue = async () => {
    try {
      const res = await adminService.suspendOverdue(graceDays);
      setSnack({ open: true, msg: `${res.suspended || 0} kayıt askıya alındı`, severity: 'success' });
      setSuspendDialog(false);
      fetchData();
    } catch {
      setSnack({ open: true, msg: 'İşlem başarısız', severity: 'error' });
    }
  };

  const openEdit = (sub: any) => {
    setEditForm({
      planType: sub.planType || 'basic',
      monthlyFee: String(sub.monthlyFee || 0),
      paidUntil: sub.paidUntil ? sub.paidUntil.split('T')[0] : '',
      notes: sub.notes || '',
    });
    setEditDialog({ open: true, sub });
  };

  const formatDate = (d: string | null) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('tr-TR');
  };

  const entityLabel = storeType === 'service' ? 'Hizmet Sağlayıcı' : 'Mağaza';

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
        <Typography variant="h5" fontWeight={700}>Aidat Yönetimi</Typography>
        <Box display="flex" gap={1}>
          <Button variant="outlined" size="small" startIcon={<PlaylistAddCheckIcon />} onClick={handleInitAll}>
            Tüm Abonelikleri Ata
          </Button>
          <Button variant="contained" color="warning" size="small" startIcon={<BlockIcon />} onClick={() => setSuspendDialog(true)}>
            Gecikenleri Askıya Al
          </Button>
        </Box>
      </Box>

      {/* Tabs */}
      <Tabs
        value={tab}
        onChange={handleTabChange}
        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab icon={<StorefrontIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Mağazalar" />
        <Tab icon={<BuildIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Profesyonel Hizmetler" />
      </Tabs>

      {/* Stats Cards */}
      {!loading && (
        <Grid container spacing={2} mb={3}>
          {[
            { label: 'Toplam Abonelik', value: stats.total || 0, icon: <StorefrontIcon />, color: '#1976d2' },
            { label: 'Aktif', value: stats.active || 0, icon: <CheckCircleIcon />, color: '#2e7d32' },
            { label: 'Gecikmiş', value: stats.overdue || 0, icon: <WarningAmberIcon />, color: '#ed6c02' },
            { label: 'Askıda', value: stats.suspended || 0, icon: <PauseCircleIcon />, color: '#d32f2f' },
            { label: 'Aylık Gelir', value: `₺${Number(stats.monthlyRevenue || 0).toLocaleString('tr-TR')}`, icon: <TrendingUpIcon />, color: '#0288d1' },
            { label: 'Gecikmiş Tutar', value: `₺${Number(stats.overdueAmount || 0).toLocaleString('tr-TR')}`, icon: <AttachMoneyIcon />, color: '#f44336' },
          ].map((s) => (
            <Grid item xs={6} md={2} key={s.label}>
              <Card sx={{ borderRadius: 2, borderLeft: `4px solid ${s.color}` }}>
                <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box sx={{ color: s.color }}>{s.icon}</Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block" lineHeight={1.2}>{s.label}</Typography>
                      <Typography variant="h6" fontWeight={700} fontSize={18}>{s.value}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Filters */}
      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        <TextField size="small" placeholder={`${entityLabel} adı, sahip adı veya email...`} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} sx={{ minWidth: 280 }} />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Durum</InputLabel>
          <Select value={statusFilter} label="Durum" onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <MenuItem value="">Tümü</MenuItem>
            <MenuItem value="active">Aktif</MenuItem>
            <MenuItem value="suspended">Askıda</MenuItem>
            <MenuItem value="cancelled">İptal</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Ödeme</InputLabel>
          <Select value={overdueFilter} label="Ödeme" onChange={(e) => { setOverdueFilter(e.target.value); setPage(1); }}>
            <MenuItem value="">Tümü</MenuItem>
            <MenuItem value="true">Gecikmiş</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Table */}
      {loading ? (
        <Skeleton variant="rounded" height={400} />
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{entityLabel}</TableCell>
                <TableCell>Sahip</TableCell>
                <TableCell align="center">Plan</TableCell>
                <TableCell align="center">Aylık Aidat</TableCell>
                <TableCell align="center">Ödeme Tarihi</TableCell>
                <TableCell align="center">Kalan Gün</TableCell>
                <TableCell align="center">Durum</TableCell>
                <TableCell align="center" sx={{ width: 180 }}>İşlemler</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {subscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography color="text.secondary" py={3}>
                      {storeType === 'service'
                        ? 'Profesyonel hizmet abonelik kaydı bulunamadı.'
                        : 'Mağaza abonelik kaydı bulunamadı. "Tüm Abonelikleri Ata" butonunu kullanın.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : subscriptions.map((sub) => {
                const isOverdue = sub.isOverdue;
                const daysRemaining = parseInt(sub.daysRemaining || '0');
                return (
                  <TableRow key={sub.storeId} hover sx={{ bgcolor: isOverdue ? 'rgba(237,108,2,0.06)' : undefined }}>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Avatar src={sub.storeLogo} variant="rounded" sx={{ width: 32, height: 32, bgcolor: storeType === 'service' ? '#f3e5f5' : '#e3f2fd' }}>
                          {storeType === 'service' ? <BuildIcon sx={{ fontSize: 18 }} /> : <StorefrontIcon sx={{ fontSize: 18 }} />}
                        </Avatar>
                        <Typography variant="body2" fontWeight={600}>{sub.storeName}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{sub.ownerName} {sub.ownerSurname}</Typography>
                      <Typography variant="caption" color="text.secondary">{sub.ownerEmail}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={sub.planType === 'premium' ? 'Premium' : sub.planType === 'pro' ? 'Pro' : 'Basic'} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" fontWeight={600}>₺{Number(sub.monthlyFee || 0).toLocaleString('tr-TR')}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">{formatDate(sub.paidUntil)}</Typography>
                      {sub.lastPaymentDate && (
                        <Typography variant="caption" color="text.secondary" display="block">Son: {formatDate(sub.lastPaymentDate)}</Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {sub.status === 'suspended' ? (
                        <Chip label="Askıda" size="small" color="error" />
                      ) : isOverdue ? (
                        <Chip label={`${Math.abs(daysRemaining)} gün gecikmiş`} size="small" color="warning" icon={<WarningAmberIcon />} />
                      ) : (
                        <Typography variant="body2" color={daysRemaining <= 7 ? 'warning.main' : 'text.primary'} fontWeight={daysRemaining <= 7 ? 700 : 400}>
                          {daysRemaining} gün
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={statusLabels[sub.status] || sub.status} color={statusColors[sub.status] || 'default'} size="small" />
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" justifyContent="center" gap={0.5}>
                        <Tooltip title="Ödeme Kaydet">
                          <IconButton size="small" color="success" onClick={() => setPayDialog({ open: true, storeId: sub.storeId, storeName: sub.storeName })}>
                            <PaymentIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Hatırlatma Gönder">
                          <IconButton size="small" color="warning" onClick={() => handleSendReminder(sub.storeId)}>
                            <NotificationsActiveIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {sub.status === 'active' ? (
                          <Tooltip title="Askıya Al">
                            <IconButton size="small" color="error" onClick={() => handleSuspend(sub.storeId)}>
                              <BlockIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Tooltip title="Aktifleştir">
                            <IconButton size="small" color="primary" onClick={() => handleReactivate(sub.storeId)}>
                              <CheckCircleIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Düzenle">
                          <IconButton size="small" onClick={() => openEdit(sub)}>
                            <EditIcon fontSize="small" />
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

      {/* Payment Dialog */}
      <Dialog open={payDialog.open} onClose={() => setPayDialog({ open: false, storeId: '', storeName: '' })}>
        <DialogTitle>Ödeme Kaydet</DialogTitle>
        <DialogContent>
          <Typography variant="body2" mb={2}>
            <strong>{payDialog.storeName}</strong> için ödeme kaydı oluşturun.
          </Typography>
          <TextField
            label="Kaç Aylık Ödeme"
            type="number"
            fullWidth
            value={payMonths}
            onChange={(e) => setPayMonths(Math.max(1, Number(e.target.value)))}
            inputProps={{ min: 1, max: 12 }}
            InputProps={{ endAdornment: <InputAdornment position="end">ay</InputAdornment> }}
            helperText="Ödeme süresi mevcut bitiş tarihinin üzerine eklenir"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPayDialog({ open: false, storeId: '', storeName: '' })}>İptal</Button>
          <Button variant="contained" color="success" startIcon={<PaymentIcon />} onClick={handleRecordPayment}>Ödemeyi Kaydet</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, sub: null })} maxWidth="sm" fullWidth>
        <DialogTitle>Abonelik Düzenle — {editDialog.sub?.storeName}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <FormControl fullWidth>
              <InputLabel>Plan</InputLabel>
              <Select value={editForm.planType} label="Plan" onChange={(e) => setEditForm((f) => ({ ...f, planType: e.target.value }))}>
                <MenuItem value="basic">Basic</MenuItem>
                <MenuItem value="pro">Pro</MenuItem>
                <MenuItem value="premium">Premium</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Aylık Aidat (₺)"
              type="number"
              fullWidth
              value={editForm.monthlyFee}
              onChange={(e) => setEditForm((f) => ({ ...f, monthlyFee: e.target.value }))}
              InputProps={{ endAdornment: <InputAdornment position="end">₺</InputAdornment> }}
            />
            <TextField
              label="Ödeme Bitiş Tarihi"
              type="date"
              fullWidth
              value={editForm.paidUntil}
              onChange={(e) => setEditForm((f) => ({ ...f, paidUntil: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Notlar"
              fullWidth
              multiline
              rows={2}
              value={editForm.notes}
              onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ open: false, sub: null })}>İptal</Button>
          <Button variant="contained" onClick={handleEditSave}>Kaydet</Button>
        </DialogActions>
      </Dialog>

      {/* Suspend Overdue Dialog */}
      <Dialog open={suspendDialog} onClose={() => setSuspendDialog(false)}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningAmberIcon color="warning" /> Gecikmiş Aidatları Toplu Askıya Al
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" mb={2}>
            Belirlenen süreyi aşan tüm gecikmiş kayıtlar askıya alınacak ve sahiplerine bildirim gönderilecektir.
          </Typography>
          <Divider sx={{ my: 1 }} />
          <TextField
            label="Tolerans Süresi (Gün)"
            type="number"
            fullWidth
            value={graceDays}
            onChange={(e) => setGraceDays(Math.max(0, Number(e.target.value)))}
            helperText="Ödeme bitiş tarihinden sonra kaç gün tolerans tanınsın?"
            InputProps={{ endAdornment: <InputAdornment position="end">gün</InputAdornment> }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSuspendDialog(false)}>İptal</Button>
          <Button variant="contained" color="warning" startIcon={<BlockIcon />} onClick={handleSuspendOverdue}>
            Askıya Al
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={snack.severity} variant="filled">{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
