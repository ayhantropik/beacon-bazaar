import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import DownloadIcon from '@mui/icons-material/Download';
import adminService from '@services/api/admin.service';

export default function AdminReportsPage() {
  const [tab, setTab] = useState(0);
  const [period, setPeriod] = useState('daily');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' as 'success' | 'error' });

  useEffect(() => {
    setLoading(true);
    const params: Record<string, any> = { period };
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;

    const fn = tab === 0 ? adminService.getSalesReport
      : tab === 1 ? adminService.getUserGrowthReport
      : adminService.getStorePerformanceReport;

    fn(params)
      .then((res) => setData(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tab, period, dateFrom, dateTo]);

  const handleExport = async (type: string) => {
    try {
      const blob = await adminService.exportData(type);
      const url = URL.createObjectURL(new Blob([blob]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_export_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setSnack({ open: true, msg: 'CSV indirildi', severity: 'success' });
    } catch {
      setSnack({ open: true, msg: 'Export başarısız', severity: 'error' });
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>Raporlar & Analitik</Typography>

      <Tabs value={tab} onChange={(_, v) => { setTab(v); }} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Satış Raporu" />
        <Tab label="Kullanıcı Büyümesi" />
        <Tab label="Mağaza Performansı" />
      </Tabs>

      {/* Filters */}
      <Box display="flex" gap={2} mb={3} flexWrap="wrap" alignItems="center">
        {tab !== 2 && (
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Periyot</InputLabel>
            <Select value={period} label="Periyot" onChange={(e) => setPeriod(e.target.value)}>
              <MenuItem value="daily">Günlük</MenuItem>
              <MenuItem value="weekly">Haftalık</MenuItem>
              <MenuItem value="monthly">Aylık</MenuItem>
            </Select>
          </FormControl>
        )}
        <TextField size="small" type="date" label="Başlangıç" InputLabelProps={{ shrink: true }} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <TextField size="small" type="date" label="Bitiş" InputLabelProps={{ shrink: true }} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        <Box flex={1} />
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={() => handleExport(tab === 0 ? 'orders' : tab === 1 ? 'users' : 'stores')}
        >
          CSV İndir
        </Button>
      </Box>

      {/* Data Table */}
      {loading ? (
        <Skeleton variant="rounded" height={300} />
      ) : tab === 0 ? (
        /* Sales Report */
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Dönem</TableCell>
                <TableCell align="center">Sipariş Sayısı</TableCell>
                <TableCell align="right">Gelir</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.length === 0 ? (
                <TableRow><TableCell colSpan={3} align="center"><Typography color="text.secondary" py={3}>Veri bulunamadı</Typography></TableCell></TableRow>
              ) : data.map((r, i) => (
                <TableRow key={i} hover>
                  <TableCell>{r.period ? new Date(r.period).toLocaleDateString('tr-TR') : '-'}</TableCell>
                  <TableCell align="center">{r.orderCount || r.ordercount || 0}</TableCell>
                  <TableCell align="right">
                    <Typography fontWeight={600}>{Number(r.revenue || 0).toLocaleString('tr-TR')} ₺</Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : tab === 1 ? (
        /* User Growth */
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Dönem</TableCell>
                <TableCell align="center">Yeni Kullanıcılar</TableCell>
                <TableCell align="center">Yeni Mağazalar</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.length === 0 ? (
                <TableRow><TableCell colSpan={3} align="center"><Typography color="text.secondary" py={3}>Veri bulunamadı</Typography></TableCell></TableRow>
              ) : data.map((r, i) => (
                <TableRow key={i} hover>
                  <TableCell>{r.period ? new Date(r.period).toLocaleDateString('tr-TR') : '-'}</TableCell>
                  <TableCell align="center">{r.newUsers || r.newusers || 0}</TableCell>
                  <TableCell align="center">{r.newStoreOwners || r.newstoreowners || 0}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        /* Store Performance */
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Mağaza</TableCell>
                <TableCell align="center">Puan</TableCell>
                <TableCell align="center">Değerlendirme</TableCell>
                <TableCell align="center">Takipçi</TableCell>
                <TableCell align="center">Ürün</TableCell>
                <TableCell align="center">Onaylı</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center"><Typography color="text.secondary" py={3}>Veri bulunamadı</Typography></TableCell></TableRow>
              ) : data.map((s, i) => (
                <TableRow key={i} hover>
                  <TableCell><Typography variant="body2" fontWeight={600}>{s.s_name || s.name || '-'}</Typography></TableCell>
                  <TableCell align="center">{Number(s.s_ratingAverage || s.ratingAverage || 0).toFixed(1)}</TableCell>
                  <TableCell align="center">{s.s_ratingCount || s.ratingCount || 0}</TableCell>
                  <TableCell align="center">{s.s_followersCount || s.followersCount || 0}</TableCell>
                  <TableCell align="center">{s.s_productsCount || s.productsCount || 0}</TableCell>
                  <TableCell align="center">{(s.s_isVerified || s.isVerified) ? '✓' : '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={snack.severity} variant="filled">{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
