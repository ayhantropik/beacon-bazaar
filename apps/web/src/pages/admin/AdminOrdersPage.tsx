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
import Chip from '@mui/material/Chip';
import Pagination from '@mui/material/Pagination';
import Skeleton from '@mui/material/Skeleton';
import IconButton from '@mui/material/IconButton';
import VisibilityIcon from '@mui/icons-material/Visibility';
import adminService from '@services/api/admin.service';

const statusLabels: Record<string, string> = {
  pending: 'Bekliyor', confirmed: 'Onaylandı', preparing: 'Hazırlanıyor',
  shipped: 'Kargoda', delivered: 'Teslim Edildi', cancelled: 'İptal', refunded: 'İade',
};
const statusColors: Record<string, 'warning' | 'info' | 'success' | 'error' | 'default'> = {
  pending: 'warning', confirmed: 'info', preparing: 'info',
  shipped: 'info', delivered: 'success', cancelled: 'error', refunded: 'error',
};

export default function AdminOrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchOrders = useCallback(() => {
    setLoading(true);
    const params: Record<string, any> = { page, limit: 20 };
    if (statusFilter) params.status = statusFilter;
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    adminService.getOrders(params)
      .then((res) => {
        const items = res.data || res.orders || [];
        setOrders(Array.isArray(items) ? items : []);
        setTotalPages(res.pagination?.totalPages || 1);
      })
      .catch((err) => {
        console.error('Admin orders error:', err?.response?.status, err?.response?.data || err.message);
        setOrders([]);
      })
      .finally(() => setLoading(false));
  }, [page, statusFilter, dateFrom, dateTo]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>Sipariş Yönetimi</Typography>

      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Durum</InputLabel>
          <Select value={statusFilter} label="Durum" onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <MenuItem value="">Tümü</MenuItem>
            {Object.entries(statusLabels).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField size="small" type="date" label="Başlangıç" InputLabelProps={{ shrink: true }} value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} />
        <TextField size="small" type="date" label="Bitiş" InputLabelProps={{ shrink: true }} value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} />
      </Box>

      {loading ? (
        <Skeleton variant="rounded" height={400} />
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Sipariş No</TableCell>
                <TableCell>Müşteri</TableCell>
                <TableCell align="right">Toplam</TableCell>
                <TableCell align="center">Durum</TableCell>
                <TableCell align="center">Ödeme</TableCell>
                <TableCell align="right">Tarih</TableCell>
                <TableCell align="center" sx={{ width: 60 }}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center"><Typography color="text.secondary" py={3}>Sipariş bulunamadı</Typography></TableCell></TableRow>
              ) : orders.map((o) => (
                <TableRow key={o.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600} fontFamily="monospace">
                      #{o.id.slice(0, 8).toUpperCase()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{o.user ? `${o.user.name} ${o.user.surname || ''}` : '-'}</Typography>
                    <Typography variant="caption" color="text.secondary">{o.user?.email}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={700}>{Number(o.total).toLocaleString('tr-TR')} ₺</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip label={statusLabels[o.status] || o.status} color={statusColors[o.status] || 'default'} size="small" />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={o.paymentStatus === 'paid' ? 'Ödendi' : o.paymentStatus === 'refunded' ? 'İade' : 'Bekliyor'}
                      color={o.paymentStatus === 'paid' ? 'success' : o.paymentStatus === 'refunded' ? 'error' : 'warning'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="caption">{new Date(o.createdAt).toLocaleDateString('tr-TR')}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" onClick={() => navigate(`/admin/orders/${o.id}`)}>
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
    </Box>
  );
}
