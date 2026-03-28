import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as yup from 'yup';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';
import PersonIcon from '@mui/icons-material/Person';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import FavoriteIcon from '@mui/icons-material/Favorite';
import SettingsIcon from '@mui/icons-material/Settings';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import EditIcon from '@mui/icons-material/Edit';
import Input from '@components/atoms/Input';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { logout } from '@store/slices/authSlice';
import apiClient from '@services/api/client';

const profileSchema = yup.object({
  name: yup.string().required('Ad gerekli'),
  surname: yup.string().required('Soyad gerekli'),
  email: yup.string().email('Geçerli e-posta girin').required('E-posta gerekli'),
  phone: yup.string(),
});

const passwordSchema = yup.object({
  currentPassword: yup.string().required('Mevcut şifre gerekli'),
  newPassword: yup.string().min(6, 'En az 6 karakter').required('Yeni şifre gerekli'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('newPassword')], 'Şifreler eşleşmiyor')
    .required('Şifre tekrarı gerekli'),
});

export default function ProfilePage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((s) => s.auth);
  const [tab, setTab] = useState(0);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const profileFormik = useFormik({
    initialValues: {
      name: user?.name || '',
      surname: user?.surname || '',
      email: user?.email || '',
      phone: user?.phone || '',
    },
    validationSchema: profileSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      try {
        await apiClient.put('/auth/profile', values);
        setSuccess('Profil güncellendi');
        setError('');
      } catch {
        setError('Profil güncellenemedi');
        setSuccess('');
      }
    },
  });

  const passwordFormik = useFormik({
    initialValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
    validationSchema: passwordSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        await apiClient.put('/auth/change-password', {
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        });
        setSuccess('Şifre değiştirildi');
        setError('');
        resetForm();
      } catch {
        setError('Şifre değiştirilemedi');
        setSuccess('');
      }
    },
  });

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/');
  };

  if (!isAuthenticated) {
    return (
      <Box textAlign="center" py={8}>
        <Typography variant="h5" fontWeight={600} mb={2}>
          Profilinizi görmek için giriş yapın
        </Typography>
        <Button variant="contained" size="large" onClick={() => navigate('/login')}>
          Giriş Yap
        </Button>
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {/* Sidebar */}
      <Grid item xs={12} md={3}>
        <Card sx={{ p: 3, textAlign: 'center', mb: 2 }}>
          <Avatar
            src={user?.avatar}
            sx={{ width: 80, height: 80, mx: 'auto', mb: 1.5, bgcolor: 'primary.main', fontSize: 32 }}
          >
            {user?.name?.[0]}{user?.surname?.[0]}
          </Avatar>
          <Typography variant="h6" fontWeight={600}>
            {user?.name} {user?.surname}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user?.email}
          </Typography>
        </Card>

        <Card>
          <List disablePadding>
            <ListItemButton selected={tab === 0} onClick={() => setTab(0)}>
              <ListItemIcon><PersonIcon /></ListItemIcon>
              <ListItemText primary="Hesap Bilgileri" />
            </ListItemButton>
            <ListItemButton onClick={() => navigate('/orders')}>
              <ListItemIcon><ShoppingBagIcon /></ListItemIcon>
              <ListItemText primary="Siparişlerim" />
            </ListItemButton>
            <ListItemButton selected={tab === 1} onClick={() => setTab(1)}>
              <ListItemIcon><LocationOnIcon /></ListItemIcon>
              <ListItemText primary="Adreslerim" />
            </ListItemButton>
            <ListItemButton selected={tab === 2} onClick={() => setTab(2)}>
              <ListItemIcon><FavoriteIcon /></ListItemIcon>
              <ListItemText primary="Favorilerim" />
            </ListItemButton>
            <ListItemButton selected={tab === 3} onClick={() => setTab(3)}>
              <ListItemIcon><SettingsIcon /></ListItemIcon>
              <ListItemText primary="Şifre Değiştir" />
            </ListItemButton>
            <Divider />
            <ListItem disablePadding>
              <ListItemButton onClick={handleLogout}>
                <ListItemIcon><ExitToAppIcon color="error" /></ListItemIcon>
                <ListItemText primary="Çıkış Yap" sx={{ color: 'error.main' }} />
              </ListItemButton>
            </ListItem>
          </List>
        </Card>
      </Grid>

      {/* Content */}
      <Grid item xs={12} md={9}>
        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

        {/* Tab 0: Profile Info */}
        {tab === 0 && (
          <Card sx={{ p: 3 }} component="form" onSubmit={profileFormik.handleSubmit}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
              <Typography variant="h6" fontWeight={600}>Hesap Bilgileri</Typography>
              <Button type="submit" variant="contained" startIcon={<EditIcon />} size="small">
                Kaydet
              </Button>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Input
                  name="name"
                  label="Ad"
                  value={profileFormik.values.name}
                  onChange={profileFormik.handleChange}
                  onBlur={profileFormik.handleBlur}
                  errorMessage={profileFormik.touched.name ? profileFormik.errors.name : undefined}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Input
                  name="surname"
                  label="Soyad"
                  value={profileFormik.values.surname}
                  onChange={profileFormik.handleChange}
                  onBlur={profileFormik.handleBlur}
                  errorMessage={profileFormik.touched.surname ? profileFormik.errors.surname : undefined}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Input
                  name="email"
                  label="E-posta"
                  value={profileFormik.values.email}
                  onChange={profileFormik.handleChange}
                  onBlur={profileFormik.handleBlur}
                  errorMessage={profileFormik.touched.email ? profileFormik.errors.email : undefined}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Input
                  name="phone"
                  label="Telefon"
                  value={profileFormik.values.phone}
                  onChange={profileFormik.handleChange}
                  onBlur={profileFormik.handleBlur}
                  errorMessage={profileFormik.touched.phone ? profileFormik.errors.phone : undefined}
                />
              </Grid>
            </Grid>
          </Card>
        )}

        {/* Tab 1: Addresses */}
        {tab === 1 && (
          <Card sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
              <Typography variant="h6" fontWeight={600}>Adreslerim</Typography>
              <Button variant="outlined" size="small">Yeni Adres Ekle</Button>
            </Box>
            {(!user?.addresses || user.addresses.length === 0) ? (
              <Box textAlign="center" py={4}>
                <LocationOnIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                <Typography color="text.secondary">Henüz adres eklenmemiş</Typography>
              </Box>
            ) : (
              user.addresses.map((addr) => (
                <Card key={addr.id} variant="outlined" sx={{ p: 2, mb: 1.5 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {addr.title} {addr.isDefault && '(Varsayılan)'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {addr.fullName} - {addr.phone}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {addr.street} {addr.buildingNo}, {addr.neighborhood}, {addr.district}/{addr.city}
                      </Typography>
                    </Box>
                    <Button size="small">Düzenle</Button>
                  </Box>
                </Card>
              ))
            )}
          </Card>
        )}

        {/* Tab 2: Favorites */}
        {tab === 2 && (
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} mb={3}>Favorilerim</Typography>
            <Box textAlign="center" py={4}>
              <FavoriteIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
              <Typography color="text.secondary">Henüz favori ürün eklenmemiş</Typography>
              <Button variant="outlined" sx={{ mt: 2 }} onClick={() => navigate('/')}>
                Ürünleri Keşfet
              </Button>
            </Box>
          </Card>
        )}

        {/* Tab 3: Change Password */}
        {tab === 3 && (
          <Card sx={{ p: 3 }} component="form" onSubmit={passwordFormik.handleSubmit}>
            <Typography variant="h6" fontWeight={600} mb={3}>Şifre Değiştir</Typography>
            <Grid container spacing={2} maxWidth={400}>
              <Grid item xs={12}>
                <Input
                  name="currentPassword"
                  label="Mevcut Şifre"
                  type="password"
                  value={passwordFormik.values.currentPassword}
                  onChange={passwordFormik.handleChange}
                  onBlur={passwordFormik.handleBlur}
                  errorMessage={passwordFormik.touched.currentPassword ? passwordFormik.errors.currentPassword : undefined}
                />
              </Grid>
              <Grid item xs={12}>
                <Input
                  name="newPassword"
                  label="Yeni Şifre"
                  type="password"
                  value={passwordFormik.values.newPassword}
                  onChange={passwordFormik.handleChange}
                  onBlur={passwordFormik.handleBlur}
                  errorMessage={passwordFormik.touched.newPassword ? passwordFormik.errors.newPassword : undefined}
                />
              </Grid>
              <Grid item xs={12}>
                <Input
                  name="confirmPassword"
                  label="Yeni Şifre Tekrarı"
                  type="password"
                  value={passwordFormik.values.confirmPassword}
                  onChange={passwordFormik.handleChange}
                  onBlur={passwordFormik.handleBlur}
                  errorMessage={passwordFormik.touched.confirmPassword ? passwordFormik.errors.confirmPassword : undefined}
                />
              </Grid>
              <Grid item xs={12}>
                <Button type="submit" variant="contained">Şifreyi Değiştir</Button>
              </Grid>
            </Grid>
          </Card>
        )}
      </Grid>
    </Grid>
  );
}
