import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Skeleton from '@mui/material/Skeleton';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import PeopleIcon from '@mui/icons-material/People';
import StorefrontIcon from '@mui/icons-material/Storefront';
import InventoryIcon from '@mui/icons-material/Inventory';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AddBusinessIcon from '@mui/icons-material/AddBusiness';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import DiscountIcon from '@mui/icons-material/Discount';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import TodayIcon from '@mui/icons-material/Today';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LinearProgress from '@mui/material/LinearProgress';
import adminService from '@services/api/admin.service';

interface DashboardStats {
  counts: { users: number; stores: number; products: number; orders: number };
  totalRevenue: number;
  totalSubtotal: number;
  totalDeliveryFee: number;
  totalDiscount: number;
  totalCommission: number;
  commissionRate: number;
  paidOrdersCount: number;
  avgOrderValue: number;
  statusDistribution: { status: string; count: string }[];
  todayOrders: number;
  todayRevenue: number;
  monthOrders: number;
  monthRevenue: number;
  orderTrend: { date: string; count: string; revenue: string }[];
  recentOrders: { id: string; total: number; status: string; userName: string; createdAt: string }[];
  recentUsers: { id: string; name: string; surname: string; email: string; role: string; createdAt: string }[];
  recentStores: { id: string; name: string; isVerified: boolean; createdAt: string }[];
}

const statusColors: Record<string, 'warning' | 'info' | 'success' | 'error' | 'default'> = {
  pending: 'warning',
  confirmed: 'info',
  preparing: 'info',
  shipped: 'info',
  delivered: 'success',
  cancelled: 'error',
  refunded: 'error',
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getDashboard()
      .then((res) => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Box>
        <Skeleton variant="text" width={300} height={40} sx={{ mb: 2 }} />
        <Grid container spacing={2} mb={3}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Grid item xs={6} md={3} key={i}><Skeleton variant="rounded" height={120} /></Grid>
          ))}
        </Grid>
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}><Skeleton variant="rounded" height={300} /></Grid>
          <Grid item xs={12} md={4}><Skeleton variant="rounded" height={300} /></Grid>
        </Grid>
      </Box>
    );
  }

  if (!stats) return <Typography color="error">Veriler yüklenemedi</Typography>;

  const statCards = [
    { label: 'Toplam Kullanıcı', value: stats.counts.users, icon: <PeopleIcon />, color: '#0099cc', bg: '#e3f2fd' },
    { label: 'Toplam Mağaza', value: stats.counts.stores, icon: <StorefrontIcon />, color: '#16a34a', bg: '#e8f5e9' },
    { label: 'Toplam Ürün', value: stats.counts.products, icon: <InventoryIcon />, color: '#f59e0b', bg: '#fff8e1' },
    { label: 'Toplam Sipariş', value: stats.counts.orders, icon: <ShoppingCartIcon />, color: '#ef4444', bg: '#fce4ec' },
  ];

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>Genel Bakış</Typography>

      {/* Stat Cards */}
      <Grid container spacing={2} mb={3}>
        {statCards.map((s) => (
          <Grid item xs={6} md={3} key={s.label}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2.5 }}>
                <Avatar sx={{ bgcolor: s.bg, color: s.color, width: 52, height: 52 }}>{s.icon}</Avatar>
                <Box>
                  <Typography variant="h4" fontWeight={700}>{s.value.toLocaleString('tr-TR')}</Typography>
                  <Typography variant="body2" color="text.secondary">{s.label}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Financial Summary Cards */}
      <Grid container spacing={2} mb={3}>
        {/* Toplam Gelir */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <TrendingUpIcon color="success" fontSize="small" />
                <Typography variant="subtitle2" fontWeight={600} color="text.secondary">Toplam Gelir</Typography>
              </Box>
              <Typography variant="h4" fontWeight={800} color="success.main">
                {stats.totalRevenue.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺
              </Typography>
              <Typography variant="caption" color="text.secondary">{stats.paidOrdersCount} ödenen sipariş</Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Toplam Komisyon */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <AccountBalanceIcon sx={{ color: '#7c3aed' }} fontSize="small" />
                <Typography variant="subtitle2" fontWeight={600} color="text.secondary">Platform Komisyonu</Typography>
              </Box>
              <Typography variant="h4" fontWeight={800} sx={{ color: '#7c3aed' }}>
                {stats.totalCommission.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺
              </Typography>
              <Typography variant="caption" color="text.secondary">%{(stats.commissionRate * 100).toFixed(0)} komisyon oranı</Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Toplam Kargo */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <LocalShippingIcon color="info" fontSize="small" />
                <Typography variant="subtitle2" fontWeight={600} color="text.secondary">Toplam Kargo Bedeli</Typography>
              </Box>
              <Typography variant="h4" fontWeight={800} color="info.main">
                {stats.totalDeliveryFee.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Ort: {stats.paidOrdersCount > 0 ? (stats.totalDeliveryFee / stats.paidOrdersCount).toLocaleString('tr-TR', { maximumFractionDigits: 0 }) : 0} ₺/sipariş
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Toplam İndirim */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <DiscountIcon color="warning" fontSize="small" />
                <Typography variant="subtitle2" fontWeight={600} color="text.secondary">Toplam İndirim</Typography>
              </Box>
              <Typography variant="h4" fontWeight={800} color="warning.main">
                {stats.totalDiscount.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Ort sipariş: {stats.avgOrderValue.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Period Stats & Order Trend */}
      <Grid container spacing={2} mb={3}>
        {/* Bugün & Bu Ay */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              {/* Bugün */}
              <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                <TodayIcon color="primary" fontSize="small" />
                <Typography variant="subtitle2" fontWeight={600}>Bugün</Typography>
              </Box>
              <Box display="flex" gap={3} mb={2}>
                <Box>
                  <Typography variant="h5" fontWeight={700}>{stats.todayOrders}</Typography>
                  <Typography variant="caption" color="text.secondary">sipariş</Typography>
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight={700} color="success.main">
                    {stats.todayRevenue.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺
                  </Typography>
                  <Typography variant="caption" color="text.secondary">gelir</Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 1.5 }} />

              {/* Bu Ay */}
              <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                <CalendarMonthIcon color="secondary" fontSize="small" />
                <Typography variant="subtitle2" fontWeight={600}>Bu Ay</Typography>
              </Box>
              <Box display="flex" gap={3} mb={2}>
                <Box>
                  <Typography variant="h5" fontWeight={700}>{stats.monthOrders}</Typography>
                  <Typography variant="caption" color="text.secondary">sipariş</Typography>
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight={700} color="success.main">
                    {stats.monthRevenue.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺
                  </Typography>
                  <Typography variant="caption" color="text.secondary">gelir</Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 1.5 }} />

              {/* Sipariş Durumu Dağılımı */}
              <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                <ReceiptLongIcon fontSize="small" color="action" />
                <Typography variant="subtitle2" fontWeight={600}>Sipariş Durumları</Typography>
              </Box>
              {stats.statusDistribution?.map((s) => {
                const total = stats.counts.orders || 1;
                const pct = (Number(s.count) / total) * 100;
                const statusLabels: Record<string, string> = {
                  pending: 'Bekleyen', confirmed: 'Onaylı', preparing: 'Hazırlanıyor',
                  shipped: 'Kargoda', delivered: 'Teslim', cancelled: 'İptal', refunded: 'İade',
                };
                const statusColor: Record<string, string> = {
                  pending: '#f59e0b', confirmed: '#3b82f6', preparing: '#6366f1',
                  shipped: '#0ea5e9', delivered: '#16a34a', cancelled: '#ef4444', refunded: '#6b7280',
                };
                return (
                  <Box key={s.status} sx={{ mb: 1 }}>
                    <Box display="flex" justifyContent="space-between" mb={0.3}>
                      <Typography variant="caption">{statusLabels[s.status] || s.status}</Typography>
                      <Typography variant="caption" fontWeight={600}>{s.count} ({pct.toFixed(0)}%)</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={pct}
                      sx={{ height: 6, borderRadius: 3, bgcolor: 'grey.200', '& .MuiLinearProgress-bar': { bgcolor: statusColor[s.status] || '#9ca3af', borderRadius: 3 } }}
                    />
                  </Box>
                );
              })}
            </CardContent>
          </Card>
        </Grid>

        {/* Order Trend */}
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>Son 7 Gün Sipariş Trendi</Typography>
              {stats.orderTrend.length === 0 ? (
                <Typography color="text.secondary">Veri bulunamadı</Typography>
              ) : (
                <Box display="flex" gap={1} flexWrap="wrap">
                  {stats.orderTrend.map((t) => (
                    <Card key={t.date} variant="outlined" sx={{ p: 1.5, minWidth: 100, textAlign: 'center', borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(t.date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}
                      </Typography>
                      <Typography variant="h6" fontWeight={700}>{t.count}</Typography>
                      <Typography variant="caption" color="success.main">
                        {Number(t.revenue).toLocaleString('tr-TR')} ₺
                      </Typography>
                    </Card>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Activity */}
      <Grid container spacing={2}>
        {/* Recent Orders */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={1}>Son Siparişler</Typography>
              <Divider sx={{ mb: 1 }} />
              <List dense disablePadding>
                {stats.recentOrders.map((o) => (
                  <ListItem key={o.id} disablePadding sx={{ py: 0.5 }}>
                    <ListItemText
                      primary={
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="body2" fontWeight={600}>{o.userName}</Typography>
                          <Chip label={o.status} size="small" color={statusColors[o.status] || 'default'} />
                        </Box>
                      }
                      secondary={`${Number(o.total).toLocaleString('tr-TR')} ₺ · ${new Date(o.createdAt).toLocaleDateString('tr-TR')}`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Users */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={1}>Yeni Kullanıcılar</Typography>
              <Divider sx={{ mb: 1 }} />
              <List dense disablePadding>
                {stats.recentUsers.map((u) => (
                  <ListItem key={u.id} disablePadding sx={{ py: 0.5 }}>
                    <ListItemAvatar sx={{ minWidth: 36 }}>
                      <Avatar sx={{ width: 28, height: 28, fontSize: 12 }}><PersonAddIcon sx={{ fontSize: 16 }} /></Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={`${u.name} ${u.surname}`}
                      secondary={`${u.email} · ${u.role}`}
                      primaryTypographyProps={{ fontSize: 13, fontWeight: 600 }}
                      secondaryTypographyProps={{ fontSize: 11 }}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Stores */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={1}>Yeni Mağazalar</Typography>
              <Divider sx={{ mb: 1 }} />
              <List dense disablePadding>
                {stats.recentStores.map((s) => (
                  <ListItem key={s.id} disablePadding sx={{ py: 0.5 }}>
                    <ListItemAvatar sx={{ minWidth: 36 }}>
                      <Avatar sx={{ width: 28, height: 28, fontSize: 12 }}><AddBusinessIcon sx={{ fontSize: 16 }} /></Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <Typography variant="body2" fontWeight={600}>{s.name}</Typography>
                          {s.isVerified && <Chip label="Onaylı" size="small" color="primary" sx={{ height: 18, fontSize: 10 }} />}
                        </Box>
                      }
                      secondary={new Date(s.createdAt).toLocaleDateString('tr-TR')}
                      secondaryTypographyProps={{ fontSize: 11 }}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
