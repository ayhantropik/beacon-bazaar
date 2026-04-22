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
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';
import Pagination from '@mui/material/Pagination';
import Skeleton from '@mui/material/Skeleton';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import BuildIcon from '@mui/icons-material/Build';
import VerifiedIcon from '@mui/icons-material/Verified';
import VisibilityIcon from '@mui/icons-material/Visibility';
import StarIcon from '@mui/icons-material/Star';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import adminService from '@services/api/admin.service';

const SERVICE_CATEGORIES = [
  'Temizlik', 'Tadilat & Tamirat', 'Tesisatçı & Elektrikçi', 'Nakliyat',
  'Dijital Hizmetler', 'Fotoğraf & Video', 'Eğitim & Özel Ders',
  'Sağlık & Güzellik', 'Danışmanlık', 'Evcil Hayvan', 'Otomotiv Servisi',
];

export default function AdminServicesPage() {
  const navigate = useNavigate();
  const [providers, setProviders] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [verifiedFilter, setVerifiedFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' as 'success' | 'error' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, limit: 20 };
      if (search) params.search = search;
      if (categoryFilter) params.category = categoryFilter;
      if (verifiedFilter) params.isVerified = verifiedFilter;
      if (activeFilter) params.isActive = activeFilter;

      const [provRes, statsRes] = await Promise.all([
        adminService.getServiceProviders(params),
        adminService.getServiceProviderStats(),
      ]);
      setProviders(provRes.data || []);
      setTotalPages(provRes.pagination?.totalPages || 1);
      setStats(statsRes.data || {});
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [page, search, categoryFilter, verifiedFilter, activeFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleVerify = async (id: string, current: boolean) => {
    try {
      await adminService.verifyStore(id, !current);
      setSnack({ open: true, msg: !current ? 'Hizmet sağlayıcı onaylandı' : 'Onay kaldırıldı', severity: 'success' });
      fetchData();
    } catch {
      setSnack({ open: true, msg: 'İşlem başarısız', severity: 'error' });
    }
  };

  const handleStatusToggle = async (id: string, current: boolean) => {
    try {
      await adminService.updateStoreStatus(id, !current);
      setSnack({ open: true, msg: !current ? 'Aktifleştirildi' : 'Deaktif edildi', severity: 'success' });
      fetchData();
    } catch {
      setSnack({ open: true, msg: 'İşlem başarısız', severity: 'error' });
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>Profesyonel Hizmetler</Typography>

      {/* Stats */}
      {!loading && (
        <Grid container spacing={2} mb={3}>
          {[
            { label: 'Toplam Hizmet Sağlayıcı', value: stats.total || 0, icon: <BuildIcon />, color: '#7b1fa2' },
            { label: 'Aktif', value: stats.active || 0, icon: <CheckCircleIcon />, color: '#2e7d32' },
            { label: 'Onaylı', value: stats.verified || 0, icon: <VerifiedIcon />, color: '#1976d2' },
            { label: 'Onay Bekleyen', value: stats.unverified || 0, icon: <PendingIcon />, color: '#ed6c02' },
            { label: 'Ort. Puan', value: Number(stats.avgRating || 0).toFixed(1), icon: <StarIcon />, color: '#f59e0b' },
          ].map((s) => (
            <Grid item xs={6} md={2.4} key={s.label}>
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

      {/* Top Categories */}
      {!loading && stats.topCategories?.length > 0 && (
        <Box mb={3}>
          <Typography variant="subtitle2" fontWeight={600} mb={1}>Popüler Hizmet Kategorileri</Typography>
          <Box display="flex" gap={1} flexWrap="wrap">
            {stats.topCategories.map((c: any) => (
              <Chip
                key={c.category}
                label={`${c.category} (${c.count})`}
                variant="outlined"
                size="small"
                onClick={() => { setCategoryFilter(c.category); setPage(1); }}
                color={categoryFilter === c.category ? 'primary' : 'default'}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Filters */}
      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        <TextField size="small" placeholder="Hizmet sağlayıcı ara..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} sx={{ minWidth: 250 }} />
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Kategori</InputLabel>
          <Select value={categoryFilter} label="Kategori" onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}>
            <MenuItem value="">Tümü</MenuItem>
            {SERVICE_CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Onay</InputLabel>
          <Select value={verifiedFilter} label="Onay" onChange={(e) => { setVerifiedFilter(e.target.value); setPage(1); }}>
            <MenuItem value="">Tümü</MenuItem>
            <MenuItem value="true">Onaylı</MenuItem>
            <MenuItem value="false">Onaysız</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Durum</InputLabel>
          <Select value={activeFilter} label="Durum" onChange={(e) => { setActiveFilter(e.target.value); setPage(1); }}>
            <MenuItem value="">Tümü</MenuItem>
            <MenuItem value="true">Aktif</MenuItem>
            <MenuItem value="false">Pasif</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Table */}
      {loading ? (
        <Skeleton variant="rounded" height={400} />
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Hizmet Sağlayıcı</TableCell>
                <TableCell>Sahip</TableCell>
                <TableCell>Kategoriler</TableCell>
                <TableCell align="center">Puan</TableCell>
                <TableCell align="center">Onay</TableCell>
                <TableCell align="center">Durum</TableCell>
                <TableCell align="center" sx={{ width: 60 }}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {providers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Box py={4} textAlign="center">
                      <BuildIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                      <Typography color="text.secondary">Henüz profesyonel hizmet sağlayıcı bulunmuyor</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Mağaza oluştururken "storeType" değeri "service" olan mağazalar burada listelenir
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : providers.map((p) => (
                <TableRow key={p.id} hover>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <Avatar src={p.logo} variant="rounded" sx={{ width: 36, height: 36, bgcolor: '#f3e5f5' }}>
                        <BuildIcon sx={{ fontSize: 20, color: '#7b1fa2' }} />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{p.name}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                          {p.description?.slice(0, 60)}{p.description?.length > 60 ? '...' : ''}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{p.owner ? `${p.owner.name} ${p.owner.surname || ''}` : '-'}</Typography>
                    <Typography variant="caption" color="text.secondary">{p.owner?.email}</Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" flexWrap="wrap" gap={0.5}>
                      {(p.categories as string[])?.slice(0, 3).map((c: string) => (
                        <Chip key={c} label={c} size="small" variant="outlined" sx={{ fontSize: 11 }} />
                      ))}
                      {(p.categories?.length || 0) > 3 && (
                        <Chip label={`+${p.categories.length - 3}`} size="small" sx={{ fontSize: 11 }} />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Box display="flex" alignItems="center" justifyContent="center" gap={0.3}>
                      <StarIcon sx={{ fontSize: 16, color: '#f59e0b' }} />
                      <Typography variant="body2">{(p.ratingAverage || 0).toFixed(1)}</Typography>
                      <Typography variant="caption" color="text.secondary">({p.ratingCount || 0})</Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title={p.isVerified ? 'Onayı kaldır' : 'Onayla'}>
                      <IconButton size="small" color={p.isVerified ? 'primary' : 'default'} onClick={() => handleVerify(p.id, p.isVerified)}>
                        <VerifiedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="center">
                    <Switch checked={p.isActive} size="small" onChange={() => handleStatusToggle(p.id, p.isActive)} />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" onClick={() => navigate(`/admin/stores/${p.id}`)}>
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={2}>
          <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" />
        </Box>
      )}

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={snack.severity} variant="filled">{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
