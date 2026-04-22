import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Divider from '@mui/material/Divider';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import StorefrontIcon from '@mui/icons-material/Storefront';
import VerifiedIcon from '@mui/icons-material/Verified';
import StarIcon from '@mui/icons-material/Star';
import InventoryIcon from '@mui/icons-material/Inventory';
import PeopleIcon from '@mui/icons-material/People';
import RateReviewIcon from '@mui/icons-material/RateReview';
import adminService from '@services/api/admin.service';

export default function AdminStoreDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' as 'success' | 'error' });

  useEffect(() => {
    if (!id) return;
    adminService.getStore(id)
      .then((res) => setStore(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleVerify = async () => {
    if (!id || !store) return;
    try {
      await adminService.verifyStore(id, !store.isVerified);
      setStore((s: any) => ({ ...s, isVerified: !s.isVerified }));
      setSnack({ open: true, msg: store.isVerified ? 'Onay kaldırıldı' : 'Mağaza onaylandı', severity: 'success' });
    } catch {
      setSnack({ open: true, msg: 'İşlem başarısız', severity: 'error' });
    }
  };

  const handleStatusToggle = async () => {
    if (!id || !store) return;
    try {
      await adminService.updateStoreStatus(id, !store.isActive);
      setStore((s: any) => ({ ...s, isActive: !s.isActive }));
      setSnack({ open: true, msg: store.isActive ? 'Mağaza deaktif edildi' : 'Mağaza aktifleştirildi', severity: 'success' });
    } catch {
      setSnack({ open: true, msg: 'İşlem başarısız', severity: 'error' });
    }
  };

  if (loading) return <Box><Skeleton variant="rounded" height={200} /><Skeleton variant="rounded" height={200} sx={{ mt: 2 }} /></Box>;
  if (!store) return <Typography color="error">Mağaza bulunamadı</Typography>;

  const statCards = [
    { label: 'Ürünler', value: store.productsCount || 0, icon: <InventoryIcon />, color: '#0099cc' },
    { label: 'Takipçiler', value: store.followersCount || 0, icon: <PeopleIcon />, color: '#16a34a' },
    { label: 'Değerlendirmeler', value: store.reviewsCount || 0, icon: <RateReviewIcon />, color: '#f59e0b' },
    { label: 'Puan', value: (store.ratingAverage || 0).toFixed(1), icon: <StarIcon />, color: '#ef4444' },
  ];

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/admin/stores')} sx={{ mb: 2 }}>Geri</Button>

      {/* Store Header */}
      <Card sx={{ borderRadius: 3, mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
            <Avatar src={store.logo} sx={{ width: 72, height: 72, bgcolor: '#0099cc' }}>
              <StorefrontIcon sx={{ fontSize: 36 }} />
            </Avatar>
            <Box flex={1} minWidth={200}>
              <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                <Typography variant="h5" fontWeight={700}>{store.name}</Typography>
                {store.isVerified && <Chip icon={<VerifiedIcon />} label="Onaylı" color="primary" size="small" />}
                <Chip label={store.isActive ? 'Aktif' : 'Pasif'} color={store.isActive ? 'success' : 'default'} size="small" />
              </Box>
              <Typography variant="body2" color="text.secondary" mt={0.5}>
                {store.description?.slice(0, 150)}{store.description?.length > 150 ? '...' : ''}
              </Typography>
              {store.owner && (
                <Typography variant="caption" color="text.secondary">
                  Sahip: {store.owner.name} ({store.owner.email})
                </Typography>
              )}
              <Box display="flex" gap={0.5} mt={1}>
                {(store.categories as string[])?.slice(0, 4).map((cat: string) => (
                  <Chip key={cat} label={cat} size="small" variant="outlined" />
                ))}
              </Box>
            </Box>
            <Box display="flex" gap={1}>
              <Button variant="outlined" color={store.isVerified ? 'warning' : 'primary'} onClick={handleVerify}>
                {store.isVerified ? 'Onayı Kaldır' : 'Onayla'}
              </Button>
              <Button variant="outlined" color={store.isActive ? 'error' : 'success'} onClick={handleStatusToggle}>
                {store.isActive ? 'Deaktif Et' : 'Aktifleştir'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Stats */}
      <Grid container spacing={2} mb={3}>
        {statCards.map((s) => (
          <Grid item xs={6} md={3} key={s.label}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Avatar sx={{ bgcolor: s.color + '15', color: s.color, mx: 'auto', mb: 1 }}>{s.icon}</Avatar>
                <Typography variant="h4" fontWeight={700}>{s.value}</Typography>
                <Typography variant="body2" color="text.secondary">{s.label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Details */}
      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} mb={2}>Detaylar</Typography>
          <Divider sx={{ mb: 2 }} />
          {[
            { label: 'ID', value: store.id },
            { label: 'Slug', value: store.slug },
            { label: 'Mağaza Tipi', value: store.storeType || '-' },
            { label: 'Kayıt Tarihi', value: new Date(store.createdAt).toLocaleString('tr-TR') },
          ].map((item) => (
            <Box key={item.label} display="flex" justifyContent="space-between" py={0.5}>
              <Typography variant="body2" color="text.secondary">{item.label}</Typography>
              <Typography variant="body2" fontWeight={500}>{item.value}</Typography>
            </Box>
          ))}
        </CardContent>
      </Card>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={snack.severity} variant="filled">{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
