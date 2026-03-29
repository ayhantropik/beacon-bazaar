import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import Divider from '@mui/material/Divider';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import apiClient from '@services/api/client';
import { useAppSelector } from '@store/hooks';

interface OrderItem {
  productId: string;
  name: string;
  thumbnail: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  items: OrderItem[];
  status: string;
  total: number;
  subtotal: number;
  deliveryFee: number;
  trackingNumber: string | null;
  createdAt: string;
}

const STATUS_MAP: Record<string, { label: string; color: 'default' | 'warning' | 'info' | 'success' | 'error'; icon: React.ReactNode }> = {
  pending: { label: 'Onay Bekliyor', color: 'warning', icon: <HourglassEmptyIcon fontSize="small" /> },
  confirmed: { label: 'Onaylandı', color: 'info', icon: <CheckCircleIcon fontSize="small" /> },
  preparing: { label: 'Hazırlanıyor', color: 'info', icon: <ShoppingBagIcon fontSize="small" /> },
  shipped: { label: 'Kargoda', color: 'info', icon: <LocalShippingIcon fontSize="small" /> },
  delivered: { label: 'Teslim Edildi', color: 'success', icon: <CheckCircleIcon fontSize="small" /> },
  cancelled: { label: 'İptal Edildi', color: 'error', icon: <CancelIcon fontSize="small" /> },
  refunded: { label: 'İade Edildi', color: 'default', icon: <CancelIcon fontSize="small" /> },
};

export default function OrdersPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await apiClient.get('/orders');
        setOrders(res.data?.data || res.data || []);
      } catch (err) {
        console.log('Siparişler yüklenemedi', err);
      } finally {
        setLoading(false);
      }
    }
    if (isAuthenticated) fetchOrders();
    else setLoading(false);
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <Box textAlign="center" py={8}>
        <Typography variant="h5" fontWeight={600} mb={2}>
          Siparişlerinizi görmek için giriş yapın
        </Typography>
        <Button variant="contained" size="large" onClick={() => navigate('/login')}>
          Giriş Yap
        </Button>
      </Box>
    );
  }

  const filteredOrders = tab === 0
    ? orders
    : tab === 1
      ? orders.filter((o) => ['pending', 'confirmed', 'preparing', 'shipped'].includes(o.status))
      : orders.filter((o) => ['delivered'].includes(o.status));

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>
        Siparişlerim
      </Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label={`Tümü (${orders.length})`} />
        <Tab label="Aktif" />
        <Tab label="Tamamlanan" />
      </Tabs>

      {loading ? (
        Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} variant="rounded" height={120} sx={{ mb: 2 }} />
        ))
      ) : filteredOrders.length === 0 ? (
        <Box textAlign="center" py={8}>
          <ShoppingBagIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" mb={1}>
            Henüz siparişiniz yok
          </Typography>
          <Button variant="contained" onClick={() => navigate('/')}>
            Alışverişe Başla
          </Button>
        </Box>
      ) : (
        filteredOrders.map((order) => {
          const statusInfo = STATUS_MAP[order.status] || STATUS_MAP.pending;
          return (
            <Card key={order.id} sx={{ mb: 2, p: 2.5 }}>
              {/* Header */}
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Sipariş No: {order.id.slice(0, 8).toUpperCase()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(order.createdAt).toLocaleDateString('tr-TR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Typography>
                </Box>
                <Chip
                  icon={statusInfo.icon as React.ReactElement}
                  label={statusInfo.label}
                  color={statusInfo.color}
                  size="small"
                />
              </Box>

              <Divider sx={{ mb: 2 }} />

              {/* Items */}
              {order.items.map((item, idx) => (
                <Box key={idx} display="flex" gap={2} mb={1.5} alignItems="center">
                  <Box
                    component="img"
                    src={item.thumbnail || 'https://via.placeholder.com/56'}
                    sx={{ width: 56, height: 56, borderRadius: 1.5, objectFit: 'cover' }}
                  />
                  <Box flex={1}>
                    <Typography variant="body2" fontWeight={600}>
                      {item.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.quantity} adet x {item.price.toLocaleString('tr-TR')} ₺
                    </Typography>
                  </Box>
                  <Typography variant="body2" fontWeight={600}>
                    {(item.price * item.quantity).toLocaleString('tr-TR')} ₺
                  </Typography>
                </Box>
              ))}

              <Divider sx={{ my: 2 }} />

              {/* Footer */}
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  {order.trackingNumber && (
                    <Typography variant="caption" color="text.secondary">
                      Kargo Takip: {order.trackingNumber}
                    </Typography>
                  )}
                </Box>
                <Box display="flex" alignItems="center" gap={2}>
                  <Typography variant="subtitle1" fontWeight={700} color="primary">
                    {order.total.toLocaleString('tr-TR')} ₺
                  </Typography>
                  {order.status === 'pending' && (
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={async () => {
                        try {
                          await apiClient.put(`/orders/${order.id}/cancel`);
                          setOrders((prev) =>
                            prev.map((o) => (o.id === order.id ? { ...o, status: 'cancelled' } : o)),
                          );
                        } catch {
                          // ignore
                        }
                      }}
                    >
                      İptal Et
                    </Button>
                  )}
                  {order.status === 'delivered' && (
                    <Button variant="outlined" size="small">
                      Değerlendir
                    </Button>
                  )}
                </Box>
              </Box>
            </Card>
          );
        })
      )}
    </Box>
  );
}
