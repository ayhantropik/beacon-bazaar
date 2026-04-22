import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as yup from 'yup';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import Rating from '@mui/material/Rating';
import Skeleton from '@mui/material/Skeleton';
import IconButton from '@mui/material/IconButton';
import Snackbar from '@mui/material/Snackbar';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';
import PersonIcon from '@mui/icons-material/Person';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import GavelIcon from '@mui/icons-material/Gavel';
import StorefrontIcon from '@mui/icons-material/Storefront';
import Chip from '@mui/material/Chip';
import Pagination from '@mui/material/Pagination';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import FavoriteIcon from '@mui/icons-material/Favorite';
import SettingsIcon from '@mui/icons-material/Settings';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import EditIcon from '@mui/icons-material/Edit';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import DeleteIcon from '@mui/icons-material/Delete';
import Input from '@components/atoms/Input';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { logout } from '@store/slices/authSlice';
import { addItem } from '@store/slices/cartSlice';
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
  const [favorites, setFavorites] = useState<any[]>([]);
  const [favLoading, setFavLoading] = useState(false);
  const [snackOpen, setSnackOpen] = useState(false);
  const [myBids, setMyBids] = useState<any[]>([]);
  const [bidsLoading, setBidsLoading] = useState(false);
  const [bidsPage, setBidsPage] = useState(1);
  const [bidsTotalPages, setBidsTotalPages] = useState(1);
  const [followedStores, setFollowedStores] = useState<any[]>([]);
  const [followsLoading, setFollowsLoading] = useState(false);

  useEffect(() => {
    if (tab !== 4 || !isAuthenticated) return;
    setBidsLoading(true);
    apiClient.get('/auction/my-bids', { params: { page: bidsPage } }).then((res) => {
      setMyBids(res.data?.data || []);
      setBidsTotalPages(res.data?.pagination?.totalPages || 1);
    }).catch(() => {}).finally(() => setBidsLoading(false));
  }, [tab, bidsPage, isAuthenticated]);

  useEffect(() => {
    if (tab !== 2 || !isAuthenticated) return;
    setFavLoading(true);
    apiClient.get('/favorites').then((res) => {
      setFavorites(res.data?.data || res.data || []);
    }).catch(() => {}).finally(() => setFavLoading(false));
  }, [tab, isAuthenticated]);

  useEffect(() => {
    if (tab !== 5 || !isAuthenticated) return;
    setFollowsLoading(true);
    apiClient.get('/stores/my-follows').then((res) => {
      setFollowedStores(res.data?.data || []);
    }).catch(() => {}).finally(() => setFollowsLoading(false));
  }, [tab, isAuthenticated]);

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

  const { isLoading: authLoading } = useAppSelector((s) => s.auth);

  if (authLoading) {
    return (
      <Box textAlign="center" py={8}>
        <Skeleton variant="circular" width={80} height={80} sx={{ mx: 'auto', mb: 2 }} />
        <Skeleton variant="text" width={200} sx={{ mx: 'auto' }} />
        <Skeleton variant="text" width={160} sx={{ mx: 'auto' }} />
      </Box>
    );
  }

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
            <ListItemButton selected={tab === 5} onClick={() => setTab(5)}>
              <ListItemIcon><StorefrontIcon /></ListItemIcon>
              <ListItemText primary="Takip Ettiğim Mağazalar" />
            </ListItemButton>
            <ListItemButton selected={tab === 4} onClick={() => setTab(4)}>
              <ListItemIcon><GavelIcon /></ListItemIcon>
              <ListItemText primary="Açık Artırma Tekliflerim" />
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
          <Box>
            <Typography variant="h6" fontWeight={600} mb={3}>Favorilerim</Typography>
            {favLoading ? (
              <Grid container spacing={2}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <Grid item xs={6} sm={4} md={3} key={i}>
                    <Skeleton variant="rounded" height={260} />
                  </Grid>
                ))}
              </Grid>
            ) : favorites.length === 0 ? (
              <Card sx={{ p: 3 }}>
                <Box textAlign="center" py={4}>
                  <FavoriteIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                  <Typography color="text.secondary">Henüz favori ürün eklenmemiş</Typography>
                  <Button variant="outlined" sx={{ mt: 2 }} onClick={() => navigate('/')}>
                    Ürünleri Keşfet
                  </Button>
                </Box>
              </Card>
            ) : (
              <Grid container spacing={2}>
                {favorites.map((fav) => {
                  const product = fav.product || fav;
                  const hasDiscount = product.salePrice && product.salePrice < product.price;
                  return (
                    <Grid item xs={6} sm={4} md={3} key={fav.id || product.id}>
                      <Card
                        sx={{
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 },
                        }}
                        onClick={() => navigate(`/product/${product.slug}`)}
                      >
                        <Box sx={{ position: 'relative', paddingTop: '100%', overflow: 'hidden' }}>
                          <CardMedia
                            component="img"
                            image={product.thumbnail || 'https://via.placeholder.com/300x300'}
                            alt={product.name}
                            sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </Box>
                        <CardContent sx={{ flexGrow: 1, pb: 0 }}>
                          <Typography variant="subtitle2" fontWeight={600} noWrap>
                            {product.name}
                          </Typography>
                          {product.ratingAverage != null && (
                            <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                              <Rating value={product.ratingAverage} precision={0.5} size="small" readOnly />
                            </Box>
                          )}
                          <Box display="flex" alignItems="baseline" gap={1} mt={0.5}>
                            <Typography variant="subtitle1" color="primary" fontWeight={700}>
                              {(hasDiscount ? product.salePrice : product.price)?.toLocaleString('tr-TR')} ₺
                            </Typography>
                            {hasDiscount && (
                              <Typography variant="caption" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                                {product.price.toLocaleString('tr-TR')} ₺
                              </Typography>
                            )}
                          </Box>
                        </CardContent>
                        <CardActions disableSpacing sx={{ pt: 0 }}>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={(e) => {
                              e.stopPropagation();
                              apiClient.post(`/favorites/${product.id}/toggle`).then(() => {
                                setFavorites((prev) => prev.filter((f) => (f.product?.id || f.id) !== product.id));
                              }).catch(() => {});
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="primary"
                            sx={{ ml: 'auto' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              const price = hasDiscount ? Number(product.salePrice) : Number(product.price);
                              dispatch(addItem({
                                id: product.id,
                                productId: product.id,
                                storeId: '',
                                name: product.name,
                                thumbnail: product.thumbnail,
                                price,
                                quantity: 1,
                              }));
                              setSnackOpen(true);
                            }}
                          >
                            <AddShoppingCartIcon fontSize="small" />
                          </IconButton>
                        </CardActions>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </Box>
        )}

        {/* Tab 4: Auction Bids */}
        {tab === 4 && (
          <Box>
            <Typography variant="h6" fontWeight={600} mb={3}>Açık Artırma Tekliflerim</Typography>
            {bidsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} variant="rounded" height={100} sx={{ mb: 2 }} />
              ))
            ) : myBids.length === 0 ? (
              <Card sx={{ p: 3 }}>
                <Box textAlign="center" py={4}>
                  <GavelIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                  <Typography color="text.secondary">Henüz açık artırma teklifi vermediniz</Typography>
                  <Button variant="outlined" sx={{ mt: 2 }} onClick={() => navigate('/')}>
                    Açık Artırmaları Keşfet
                  </Button>
                </Box>
              </Card>
            ) : (
              <>
                {myBids.map((bid) => {
                  const item = bid.auctionItem;
                  const product = item?.product;
                  const statusMap: Record<string, { label: string; color: 'success' | 'warning' | 'error' | 'default' }> = {
                    active: { label: 'Aktif', color: 'success' },
                    won: { label: 'Kazandınız!', color: 'success' },
                    outbid: { label: 'Geçildi', color: 'warning' },
                    cancelled: { label: 'İptal', color: 'error' },
                  };
                  const st = statusMap[bid.status] || { label: bid.status, color: 'default' as const };
                  return (
                    <Card key={bid.id} sx={{ mb: 2, p: 2 }}>
                      <Box display="flex" gap={2} alignItems="center">
                        {product?.thumbnail && (
                          <Box
                            component="img"
                            src={product.thumbnail}
                            alt={product.name}
                            sx={{ width: 80, height: 80, borderRadius: 1, objectFit: 'cover', cursor: 'pointer' }}
                            onClick={() => product?.slug && navigate(`/product/${product.slug}`)}
                          />
                        )}
                        <Box flex={1}>
                          <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                            <Typography variant="subtitle1" fontWeight={600}>
                              {product?.name || 'Ürün'}
                            </Typography>
                            <Chip label={st.label} color={st.color} size="small" />
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            Kategori: {item?.category || '-'}
                          </Typography>
                          <Box display="flex" gap={3} mt={1}>
                            <Box>
                              <Typography variant="caption" color="text.secondary">Teklifiniz</Typography>
                              <Typography variant="subtitle2" color="primary" fontWeight={700}>
                                {Number(bid.bidPrice).toLocaleString('tr-TR')} ₺
                              </Typography>
                            </Box>
                            <Box>
                              <Typography variant="caption" color="text.secondary">Miktar</Typography>
                              <Typography variant="subtitle2">{bid.bidQuantity} adet</Typography>
                            </Box>
                            <Box>
                              <Typography variant="caption" color="text.secondary">En Yüksek Teklif</Typography>
                              <Typography variant="subtitle2" fontWeight={600}>
                                {item?.currentHighestBid ? `${Number(item.currentHighestBid).toLocaleString('tr-TR')} ₺` : '-'}
                              </Typography>
                            </Box>
                            <Box>
                              <Typography variant="caption" color="text.secondary">Tarih</Typography>
                              <Typography variant="subtitle2">
                                {new Date(bid.createdAt).toLocaleDateString('tr-TR')}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </Box>
                    </Card>
                  );
                })}
                {bidsTotalPages > 1 && (
                  <Box display="flex" justifyContent="center" mt={3}>
                    <Pagination
                      count={bidsTotalPages}
                      page={bidsPage}
                      onChange={(_, p) => setBidsPage(p)}
                      color="primary"
                    />
                  </Box>
                )}
              </>
            )}
          </Box>
        )}

        {/* Tab 5: Followed Stores */}
        {tab === 5 && (
          <Box>
            <Typography variant="h6" fontWeight={600} mb={3}>Takip Ettiğim Mağazalar</Typography>
            {followsLoading ? (
              <Grid container spacing={2}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <Grid item xs={6} sm={4} md={3} key={i}>
                    <Skeleton variant="rounded" height={180} />
                  </Grid>
                ))}
              </Grid>
            ) : followedStores.length === 0 ? (
              <Card sx={{ p: 3 }}>
                <Box textAlign="center" py={4}>
                  <StorefrontIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                  <Typography color="text.secondary">Henüz takip ettiğiniz mağaza yok</Typography>
                  <Button variant="outlined" sx={{ mt: 2 }} onClick={() => navigate('/')}>
                    Mağazaları Keşfet
                  </Button>
                </Box>
              </Card>
            ) : (
              <Grid container spacing={2}>
                {followedStores.map((store) => (
                  <Grid item xs={6} sm={4} md={3} key={store.id}>
                    <Card
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 },
                      }}
                      onClick={() => navigate(`/store/${store.slug}`)}
                    >
                      <Box sx={{ position: 'relative', paddingTop: '60%', overflow: 'hidden', bgcolor: 'grey.100' }}>
                        <CardMedia
                          component="img"
                          image={store.logo || store.coverImage || 'https://via.placeholder.com/300x180'}
                          alt={store.name}
                          sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </Box>
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle2" fontWeight={600} noWrap>
                          {store.name}
                        </Typography>
                        {store.categories?.length > 0 && (
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {store.categories.join(', ')}
                          </Typography>
                        )}
                        <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                          <Rating value={store.ratingAverage || 0} precision={0.5} size="small" readOnly />
                          <Typography variant="caption" color="text.secondary">
                            ({store.ratingCount || 0})
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
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

      <Snackbar open={snackOpen} autoHideDuration={2000} onClose={() => setSnackOpen(false)}>
        <Alert onClose={() => setSnackOpen(false)} severity="success" variant="filled">
          Ürün sepete eklendi!
        </Alert>
      </Snackbar>
    </Grid>
  );
}
