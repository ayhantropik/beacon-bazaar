import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Divider from '@mui/material/Divider';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import adminService from '@services/api/admin.service';

const statusLabels: Record<string, string> = {
  pending: 'Bekliyor', confirmed: 'Onaylandı', preparing: 'Hazırlanıyor',
  shipped: 'Kargoda', delivered: 'Teslim Edildi', cancelled: 'İptal', refunded: 'İade',
};
const statusColors: Record<string, 'warning' | 'info' | 'success' | 'error' | 'default'> = {
  pending: 'warning', confirmed: 'info', preparing: 'info',
  shipped: 'info', delivered: 'success', cancelled: 'error', refunded: 'error',
};

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState('');
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' as 'success' | 'error' });

  useEffect(() => {
    if (!id) return;
    adminService.getOrder(id)
      .then((res) => { setOrder(res.data); setNewStatus(res.data?.status || ''); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleStatusUpdate = async () => {
    if (!id || !newStatus) return;
    try {
      await adminService.updateOrderStatus(id, newStatus);
      setOrder((o: any) => ({ ...o, status: newStatus }));
      setSnack({ open: true, msg: 'Sipariş durumu güncellendi', severity: 'success' });
    } catch {
      setSnack({ open: true, msg: 'Durum güncellenemedi', severity: 'error' });
    }
  };

  if (loading) return <Box><Skeleton variant="rounded" height={200} /><Skeleton variant="rounded" height={300} sx={{ mt: 2 }} /></Box>;
  if (!order) return <Typography color="error">Sipariş bulunamadı</Typography>;

  const items = (order.items as any[]) || [];
  const addr = order.shippingAddress || {};

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/admin/orders')} sx={{ mb: 2 }}>Geri</Button>

      <Grid container spacing={2} mb={3}>
        {/* Order Summary */}
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box>
                  <Typography variant="h6" fontWeight={700}>Sipariş #{order.id.slice(0, 8).toUpperCase()}</Typography>
                  <Typography variant="caption" color="text.secondary">{new Date(order.createdAt).toLocaleString('tr-TR')}</Typography>
                </Box>
                <Box display="flex" gap={1}>
                  <Chip label={statusLabels[order.status] || order.status} color={statusColors[order.status] || 'default'} />
                  <Chip
                    label={order.paymentStatus === 'paid' ? 'Ödendi' : 'Bekliyor'}
                    color={order.paymentStatus === 'paid' ? 'success' : 'warning'}
                    variant="outlined"
                  />
                </Box>
              </Box>

              <Divider sx={{ mb: 2 }} />

              {/* Items */}
              <Typography variant="subtitle2" fontWeight={600} mb={1}>Ürünler</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Ürün</TableCell>
                    <TableCell align="center">Adet</TableCell>
                    <TableCell align="right">Fiyat</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell>{item.name || item.productName || `Ürün ${i + 1}`}</TableCell>
                      <TableCell align="center">{item.quantity || 1}</TableCell>
                      <TableCell align="right">{Number(item.price || 0).toLocaleString('tr-TR')} ₺</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Divider sx={{ my: 2 }} />

              <Box display="flex" justifyContent="flex-end" gap={3}>
                <Box textAlign="right">
                  <Typography variant="body2" color="text.secondary">Ara Toplam: {Number(order.subtotal || 0).toLocaleString('tr-TR')} ₺</Typography>
                  <Typography variant="body2" color="text.secondary">Kargo: {Number(order.deliveryFee || 0).toLocaleString('tr-TR')} ₺</Typography>
                  {Number(order.discount) > 0 && (
                    <Typography variant="body2" color="error.main">İndirim: -{Number(order.discount).toLocaleString('tr-TR')} ₺</Typography>
                  )}
                  <Typography variant="h6" fontWeight={700} mt={0.5}>{Number(order.total).toLocaleString('tr-TR')} ₺</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} md={4}>
          {/* Customer */}
          <Card sx={{ borderRadius: 3, mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" fontWeight={600} mb={1}>Müşteri</Typography>
              <Typography variant="body2">{order.user ? `${order.user.name} ${order.user.surname || ''}` : '-'}</Typography>
              <Typography variant="caption" color="text.secondary">{order.user?.email}</Typography>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card sx={{ borderRadius: 3, mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" fontWeight={600} mb={1}>Teslimat Adresi</Typography>
              <Typography variant="body2">
                {addr.fullAddress || addr.street || addr.line1 || 'Adres bilgisi yok'}
              </Typography>
              {addr.city && <Typography variant="caption" color="text.secondary">{addr.district}, {addr.city}</Typography>}
            </CardContent>
          </Card>

          {/* Status Update */}
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="subtitle2" fontWeight={600} mb={1.5}>Durum Güncelle</Typography>
              <FormControl fullWidth size="small" sx={{ mb: 1.5 }}>
                <InputLabel>Yeni Durum</InputLabel>
                <Select value={newStatus} label="Yeni Durum" onChange={(e) => setNewStatus(e.target.value)}>
                  {Object.entries(statusLabels).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
                </Select>
              </FormControl>
              <Button variant="contained" fullWidth size="small" onClick={handleStatusUpdate} disabled={newStatus === order.status}>
                Güncelle
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={snack.severity} variant="filled">{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
