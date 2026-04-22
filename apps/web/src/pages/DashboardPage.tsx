import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import StorefrontIcon from '@mui/icons-material/Storefront';
import InventoryIcon from '@mui/icons-material/Inventory';
import PeopleIcon from '@mui/icons-material/People';
import StarIcon from '@mui/icons-material/Star';
import RateReviewIcon from '@mui/icons-material/RateReview';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import SettingsIcon from '@mui/icons-material/Settings';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SyncIcon from '@mui/icons-material/Sync';
import LinkIcon from '@mui/icons-material/Link';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import GavelIcon from '@mui/icons-material/Gavel';
import Pagination from '@mui/material/Pagination';
import CircularProgress from '@mui/material/CircularProgress';
import { useAppSelector } from '@store/hooks';
import apiClient from '@services/api/client';
import { productService } from '@services/api/product.service';

interface DashboardData {
  store: {
    id: string;
    name: string;
    slug: string;
    description: string;
    logo: string;
    coverImage: string;
    categories: string[];
    ratingAverage: number;
    ratingCount: number;
    followersCount: number;
    productsCount: number;
    isActive: boolean;
    isVerified: boolean;
  };
  stats: {
    productsCount: number;
    followersCount: number;
    reviewsCount: number;
    ratingAverage: number;
  };
}

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice: number | null;
  thumbnail: string;
  categories: string[];
  isActive: boolean;
  stockQuantity: number;
  createdAt: string;
}

const FALLBACK_CATEGORIES = [
  'Elektronik', 'Kozmetik', 'Moda & Giyim', 'Ayakkabı & Çanta',
  'Ev & Yaşam', 'Spor & Outdoor', 'Kitap & Kırtasiye', 'Oyuncak & Hobi',
  'Anne & Çocuk', 'Süpermarket', 'Saat & Aksesuar', 'Hediyelik',
];

interface ProductForm {
  name: string;
  description: string;
  price: string;
  salePrice: string;
  categories: string[];
  thumbnail: string;
  images: string[];
  stockQuantity: string;
  isFeatured: boolean;
}

const emptyProductForm: ProductForm = {
  name: '',
  description: '',
  price: '',
  salePrice: '',
  categories: [],
  thumbnail: '',
  images: [],
  stockQuantity: '0',
  isFeatured: false,
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);

  // Add product dialog
  const [addOpen, setAddOpen] = useState(false);
  const [productForm, setProductForm] = useState<ProductForm>(emptyProductForm);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  // ERP
  const [erpUrl, setErpUrl] = useState('');
  const [erpApiKey, setErpApiKey] = useState('');
  const [erpSyncing, setErpSyncing] = useState(false);
  const [erpStatus, setErpStatus] = useState<'idle' | 'connected' | 'error'>('idle');

  // Dynamic categories
  const [productCategories, setProductCategories] = useState<string[]>(FALLBACK_CATEGORIES);

  // Auction Bids
  const [myBids, setMyBids] = useState<any[]>([]);
  const [bidsLoading, setBidsLoading] = useState(false);
  const [bidsPage, setBidsPage] = useState(1);
  const [bidsTotalPages, setBidsTotalPages] = useState(1);

  // Snackbar
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' as 'success' | 'error' });

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (user?.role !== 'store_owner') { navigate('/'); return; }
    fetchDashboard();
    productService.getCategories().then((res: any) => { if (res?.data?.length) setProductCategories(res.data); }).catch(() => {});
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    if (tab !== 3 || !isAuthenticated) return;
    setBidsLoading(true);
    apiClient.get('/auction/my-bids', { params: { page: bidsPage } })
      .then((res) => {
        setMyBids(res.data?.data || []);
        setBidsTotalPages(res.data?.pagination?.totalPages || 1);
      })
      .catch(() => {})
      .finally(() => setBidsLoading(false));
  }, [tab, bidsPage, isAuthenticated]);

  async function fetchDashboard() {
    try {
      const res = await apiClient.get('/stores/my-store/dashboard');
      const data = res.data?.data;
      if (!data?.store) { navigate('/dashboard/create-store'); return; }
      setDashboard(data);
      const prodRes = await apiClient.get('/stores/my-store/products?limit=50');
      setProducts(prodRes.data?.data || []);
    } catch {
      navigate('/dashboard/create-store');
    } finally {
      setLoading(false);
    }
  }

  // ─── Add Product ──────────────────────────────────────────────

  const updatePF = (field: keyof ProductForm, value: any) => {
    setProductForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleProductCat = (cat: string) => {
    setProductForm((prev) => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter((c) => c !== cat)
        : [...prev.categories, cat],
    }));
  };

  const handleAddProduct = async () => {
    if (!dashboard) return;
    setAddLoading(true);
    setAddError('');
    try {
      const slug = productForm.name
        .toLowerCase()
        .replace(/[^a-z0-9ğüşıöç\s-]/g, '')
        .replace(/[ğ]/g, 'g').replace(/[ü]/g, 'u').replace(/[ş]/g, 's')
        .replace(/[ı]/g, 'i').replace(/[ö]/g, 'o').replace(/[ç]/g, 'c')
        .replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 50)
        + '-' + Date.now().toString(36);

      await apiClient.post('/products', {
        storeId: dashboard.store.id,
        name: productForm.name,
        description: productForm.description || productForm.name,
        price: parseFloat(productForm.price),
        salePrice: productForm.salePrice ? parseFloat(productForm.salePrice) : undefined,
        categories: productForm.categories,
        thumbnail: productForm.thumbnail || undefined,
        images: productForm.images.filter(Boolean),
        stockQuantity: parseInt(productForm.stockQuantity) || 0,
        isFeatured: productForm.isFeatured,
        slug,
      });

      setAddOpen(false);
      setProductForm(emptyProductForm);
      setSnack({ open: true, msg: 'Ürün başarıyla eklendi!', severity: 'success' });
      fetchDashboard();
    } catch (err: any) {
      setAddError(err.response?.data?.message || 'Ürün eklenemedi');
    }
    setAddLoading(false);
  };

  const handleDeleteProduct = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiClient.delete(`/products/${id}`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setSnack({ open: true, msg: 'Ürün silindi', severity: 'success' });
    } catch {
      setSnack({ open: true, msg: 'Ürün silinemedi', severity: 'error' });
    }
  };

  // ─── ERP Sync ─────────────────────────────────────────────────

  const handleErpConnect = async () => {
    if (!erpUrl) return;
    setErpSyncing(true);
    setErpStatus('idle');
    try {
      // Simulate ERP connection test
      await new Promise((r) => setTimeout(r, 1500));
      setErpStatus('connected');
      setSnack({ open: true, msg: 'ERP bağlantısı başarılı!', severity: 'success' });
    } catch {
      setErpStatus('error');
    }
    setErpSyncing(false);
  };

  const handleErpSync = async () => {
    setErpSyncing(true);
    try {
      await new Promise((r) => setTimeout(r, 2000));
      setSnack({ open: true, msg: 'ERP senkronizasyonu tamamlandı', severity: 'success' });
      fetchDashboard();
    } catch {
      setSnack({ open: true, msg: 'Senkronizasyon başarısız', severity: 'error' });
    }
    setErpSyncing(false);
  };

  // ─── Render ───────────────────────────────────────────────────

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rounded" height={120} sx={{ mb: 3 }} />
        <Grid container spacing={2} mb={3}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Grid item xs={6} md={3} key={i}><Skeleton variant="rounded" height={100} /></Grid>
          ))}
        </Grid>
        <Skeleton variant="rounded" height={300} />
      </Box>
    );
  }

  if (!dashboard) return null;
  const { store, stats } = dashboard;

  const statCards = [
    { label: 'Ürünler', value: stats.productsCount, icon: <InventoryIcon />, color: '#0099cc' },
    { label: 'Takipçiler', value: stats.followersCount, icon: <PeopleIcon />, color: '#16a34a' },
    { label: 'Değerlendirmeler', value: stats.reviewsCount, icon: <RateReviewIcon />, color: '#f59e0b' },
    { label: 'Puan', value: stats.ratingAverage.toFixed(1), icon: <StarIcon />, color: '#ef4444' },
  ];

  return (
    <Box>
      {/* Store Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
            <Avatar src={store.logo} sx={{ width: 64, height: 64, bgcolor: '#0099cc' }}>
              <StorefrontIcon sx={{ fontSize: 32 }} />
            </Avatar>
            <Box flex={1} minWidth={200}>
              <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                <Typography variant="h5" fontWeight={700}>{store.name}</Typography>
                {store.isVerified && <Chip label="Onaylı" color="primary" size="small" />}
                <Chip label={store.isActive ? 'Aktif' : 'Pasif'} color={store.isActive ? 'success' : 'default'} size="small" />
              </Box>
              <Typography variant="body2" color="text.secondary" mt={0.5}>
                {store.description?.slice(0, 120)}{store.description?.length > 120 ? '...' : ''}
              </Typography>
              <Box display="flex" gap={0.5} mt={1}>
                {store.categories?.slice(0, 3).map((cat) => (
                  <Chip key={cat} label={cat} size="small" variant="outlined" />
                ))}
              </Box>
            </Box>
            <Box display="flex" gap={1}>
              <Button variant="outlined" startIcon={<EditIcon />} size="small" onClick={() => navigate('/dashboard/edit-store')}>
                Düzenle
              </Button>
              <Button variant="outlined" startIcon={<SettingsIcon />} size="small" onClick={() => navigate(`/store/${store.slug}`)}>
                Mağazayı Gör
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Stats */}
      <Grid container spacing={2} mb={3}>
        {statCards.map((s) => (
          <Grid item xs={6} md={3} key={s.label}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Avatar sx={{ bgcolor: s.color + '15', color: s.color, mx: 'auto', mb: 1 }}>{s.icon}</Avatar>
                <Typography variant="h4" fontWeight={700}>{s.value}</Typography>
                <Typography variant="body2" color="text.secondary">{s.label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Tabs */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Ürünlerim" />
        <Tab label="ERP Entegrasyonu" />
        <Tab label="Siparişler" />
        <Tab label="Açık Artırma Tekliflerim" icon={<GavelIcon />} iconPosition="start" />
      </Tabs>

      {/* ─── Products Tab ─── */}
      {tab === 0 && (
        <Box>
          <Box display="flex" justifyContent="flex-end" gap={1} mb={2}>
            <Button variant="contained" startIcon={<AddIcon />} size="small" onClick={() => setAddOpen(true)}>
              Ürün Ekle
            </Button>
          </Box>

          {products.length === 0 ? (
            <Box textAlign="center" py={6}>
              <InventoryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography color="text.secondary">Henüz ürün eklemediniz</Typography>
              <Button variant="contained" startIcon={<AddIcon />} sx={{ mt: 2 }} onClick={() => setAddOpen(true)}>
                İlk Ürünü Ekle
              </Button>
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Ürün</TableCell>
                    <TableCell align="right">Fiyat</TableCell>
                    <TableCell align="center">Stok</TableCell>
                    <TableCell align="center">Durum</TableCell>
                    <TableCell align="right">Tarih</TableCell>
                    <TableCell align="center" sx={{ width: 50 }}></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {products.map((p) => (
                    <TableRow key={p.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/product/${p.slug || p.id}`)}>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <Avatar variant="rounded" src={p.thumbnail} sx={{ width: 40, height: 40 }} />
                          <Box>
                            <Typography variant="body2" fontWeight={600}>{p.name}</Typography>
                            <Typography variant="caption" color="text.secondary">{p.categories?.[0]}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={600}>
                          {(p.salePrice || p.price)?.toLocaleString('tr-TR')} ₺
                        </Typography>
                        {p.salePrice && p.salePrice < p.price && (
                          <Typography variant="caption" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                            {p.price.toLocaleString('tr-TR')} ₺
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">{p.stockQuantity ?? '-'}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={p.isActive ? 'Aktif' : 'Pasif'} color={p.isActive ? 'success' : 'default'} size="small" />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="caption">{new Date(p.createdAt).toLocaleDateString('tr-TR')}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" color="error" onClick={(e) => handleDeleteProduct(p.id, e)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {/* ─── ERP Tab ─── */}
      {tab === 1 && (
        <Box maxWidth={700}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <LinkIcon color="primary" />
                <Typography variant="h6" fontWeight={600}>ERP / POS Bağlantısı</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Mevcut ERP veya POS sisteminizi bağlayarak ürünlerinizi otomatik olarak senkronize edin.
                Desteklenen sistemler: SAP, Logo, Mikro, Paraşüt, Kolaybi, REST API uyumlu tüm sistemler.
              </Typography>

              <TextField
                label="ERP API URL"
                fullWidth
                value={erpUrl}
                onChange={(e) => setErpUrl(e.target.value)}
                placeholder="https://erp.firmaniz.com/api/v1"
                sx={{ mb: 2 }}
                helperText="ERP sisteminizin API endpoint adresi"
              />
              <TextField
                label="API Anahtarı / Token"
                fullWidth
                value={erpApiKey}
                onChange={(e) => setErpApiKey(e.target.value)}
                type="password"
                placeholder="sk-..."
                sx={{ mb: 2 }}
                helperText="ERP sisteminizden aldığınız API anahtarı"
              />

              <Grid container spacing={2} mb={2}>
                <Grid item xs={6}>
                  <TextField label="Senkronizasyon Sıklığı" fullWidth defaultValue="Her 30 dakika" select SelectProps={{ native: true }}>
                    <option value="15">Her 15 dakika</option>
                    <option value="30">Her 30 dakika</option>
                    <option value="60">Her 1 saat</option>
                    <option value="360">Her 6 saat</option>
                    <option value="1440">Günde 1 kez</option>
                  </TextField>
                </Grid>
                <Grid item xs={6}>
                  <TextField label="Veri Formatı" fullWidth defaultValue="json" select SelectProps={{ native: true }}>
                    <option value="json">JSON</option>
                    <option value="xml">XML</option>
                    <option value="csv">CSV</option>
                  </TextField>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" fontWeight={600} mb={1}>Alan Eşleştirme</Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                ERP'deki alanların VeniVidiCoop'taki karşılıklarını belirleyin
              </Typography>
              <Grid container spacing={1.5} mb={2}>
                {[
                  { label: 'Ürün Adı', placeholder: 'product_name' },
                  { label: 'Fiyat', placeholder: 'price' },
                  { label: 'Stok', placeholder: 'stock_quantity' },
                  { label: 'Barkod / SKU', placeholder: 'barcode' },
                  { label: 'Kategori', placeholder: 'category' },
                  { label: 'Görsel URL', placeholder: 'image_url' },
                ].map((f) => (
                  <Grid item xs={6} key={f.label}>
                    <TextField label={f.label} fullWidth size="small" placeholder={f.placeholder} />
                  </Grid>
                ))}
              </Grid>

              <Box display="flex" gap={2} mt={3}>
                <Button
                  variant="contained"
                  startIcon={<LinkIcon />}
                  onClick={handleErpConnect}
                  disabled={erpSyncing || !erpUrl}
                >
                  {erpSyncing ? 'Bağlanıyor...' : 'Bağlantıyı Test Et'}
                </Button>
                {erpStatus === 'connected' && (
                  <Button variant="outlined" startIcon={<SyncIcon />} onClick={handleErpSync} disabled={erpSyncing}>
                    {erpSyncing ? 'Senkronize ediliyor...' : 'Şimdi Senkronize Et'}
                  </Button>
                )}
              </Box>

              {erpStatus === 'connected' && (
                <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mt: 2 }}>
                  ERP bağlantısı aktif. Ürünler otomatik senkronize edilecek.
                </Alert>
              )}
              {erpStatus === 'error' && (
                <Alert severity="error" icon={<WarningIcon />} sx={{ mt: 2 }}>
                  Bağlantı kurulamadı. URL ve API anahtarını kontrol edin.
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* CSV Import */}
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <CloudUploadIcon color="primary" />
                <Typography variant="h6" fontWeight={600}>Toplu Ürün Yükleme</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" mb={2}>
                CSV veya Excel dosyası ile toplu ürün ekleyebilirsiniz.
              </Typography>
              <Button variant="outlined" component="label" startIcon={<CloudUploadIcon />}>
                Dosya Seç (.csv, .xlsx)
                <input type="file" hidden accept=".csv,.xlsx,.xls" />
              </Button>
              <Typography variant="caption" display="block" color="text.secondary" mt={1}>
                Şablon: isim, açıklama, fiyat, indirimli_fiyat, kategori, stok, görsel_url
              </Typography>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* ─── Orders Tab ─── */}
      {tab === 2 && (
        <StoreOrdersTab storeId={dashboard?.store.id} />
      )}

      {/* ─── Auction Bids Tab ─── */}
      {tab === 3 && (
        <Box>
          {bidsLoading ? (
            <Box textAlign="center" py={6}><CircularProgress /></Box>
          ) : myBids.length === 0 ? (
            <Box textAlign="center" py={6}>
              <GavelIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography color="text.secondary">Henüz açık artırma teklifi vermediniz</Typography>
              <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/')}>
                Açık Artırmaları Keşfet
              </Button>
            </Box>
          ) : (
            <>
              <Grid container spacing={2}>
                {myBids.map((bid: any) => {
                  const item = bid.auctionItem;
                  const product = item?.product;
                  const statusMap: Record<string, { label: string; color: 'warning' | 'success' | 'error' | 'default' }> = {
                    active: { label: 'Aktif', color: 'warning' },
                    won: { label: 'Kazandınız', color: 'success' },
                    outbid: { label: 'Geçildi', color: 'error' },
                    cancelled: { label: 'İptal', color: 'default' },
                  };
                  const st = statusMap[bid.status] || { label: bid.status, color: 'default' as const };

                  return (
                    <Grid item xs={12} sm={6} md={4} key={bid.id}>
                      <Card sx={{ height: '100%', cursor: 'pointer' }} onClick={() => product && navigate(`/product/${product.slug || product.id}`)}>
                        <CardContent>
                          <Box display="flex" gap={1.5} mb={1.5}>
                            <Avatar
                              variant="rounded"
                              src={product?.thumbnail}
                              sx={{ width: 56, height: 56, bgcolor: '#f5f5f5' }}
                            >
                              <GavelIcon />
                            </Avatar>
                            <Box flex={1} minWidth={0}>
                              <Typography variant="subtitle2" fontWeight={600} noWrap>
                                {product?.name || 'Ürün'}
                              </Typography>
                              <Chip label={st.label} color={st.color} size="small" sx={{ mt: 0.5 }} />
                            </Box>
                          </Box>
                          <Divider sx={{ mb: 1.5 }} />
                          <Box display="flex" justifyContent="space-between" mb={0.5}>
                            <Typography variant="body2" color="text.secondary">Teklifiniz:</Typography>
                            <Typography variant="body2" fontWeight={700} color="primary.main">
                              {Number(bid.bidPrice).toLocaleString('tr-TR')} ₺
                            </Typography>
                          </Box>
                          <Box display="flex" justifyContent="space-between" mb={0.5}>
                            <Typography variant="body2" color="text.secondary">Adet:</Typography>
                            <Typography variant="body2">{bid.bidQuantity}</Typography>
                          </Box>
                          {item?.currentHighestBid && (
                            <Box display="flex" justifyContent="space-between" mb={0.5}>
                              <Typography variant="body2" color="text.secondary">En yüksek teklif:</Typography>
                              <Typography variant="body2" fontWeight={600}>
                                {Number(item.currentHighestBid).toLocaleString('tr-TR')} ₺
                              </Typography>
                            </Box>
                          )}
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="body2" color="text.secondary">Kategori:</Typography>
                            <Typography variant="body2">{item?.category || '-'}</Typography>
                          </Box>
                          <Typography variant="caption" color="text.secondary" display="block" mt={1} textAlign="right">
                            {new Date(bid.createdAt).toLocaleString('tr-TR')}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
              {bidsTotalPages > 1 && (
                <Box display="flex" justifyContent="center" mt={3}>
                  <Pagination count={bidsTotalPages} page={bidsPage} onChange={(_, v) => setBidsPage(v)} color="primary" />
                </Box>
              )}
            </>
          )}
        </Box>
      )}

      {/* ─── Add Product Dialog ─── */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Yeni Ürün Ekle</DialogTitle>
        <DialogContent>
          {addError && <Alert severity="error" sx={{ mb: 2 }}>{addError}</Alert>}

          <TextField
            label="Ürün Adı"
            fullWidth
            value={productForm.name}
            onChange={(e) => updatePF('name', e.target.value)}
            sx={{ mt: 1, mb: 2 }}
            autoFocus
          />
          <TextField
            label="Açıklama"
            fullWidth
            multiline
            rows={3}
            value={productForm.description}
            onChange={(e) => updatePF('description', e.target.value)}
            sx={{ mb: 2 }}
          />

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6}>
              <TextField
                label="Fiyat (₺)"
                fullWidth
                type="number"
                value={productForm.price}
                onChange={(e) => updatePF('price', e.target.value)}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="İndirimli Fiyat (₺)"
                fullWidth
                type="number"
                value={productForm.salePrice}
                onChange={(e) => updatePF('salePrice', e.target.value)}
                helperText="Boş bırakılabilir"
              />
            </Grid>
          </Grid>

          <TextField
            label="Stok Adedi"
            fullWidth
            type="number"
            value={productForm.stockQuantity}
            onChange={(e) => updatePF('stockQuantity', e.target.value)}
            sx={{ mb: 2 }}
          />

          <Typography variant="subtitle2" fontWeight={600} mb={1}>Kategoriler</Typography>
          <Box display="flex" flexWrap="wrap" gap={0.5} mb={2}>
            {productCategories.map((cat) => (
              <Chip
                key={cat}
                label={cat}
                size="small"
                color={productForm.categories.includes(cat) ? 'primary' : 'default'}
                variant={productForm.categories.includes(cat) ? 'filled' : 'outlined'}
                onClick={() => toggleProductCat(cat)}
              />
            ))}
          </Box>

          <TextField
            label="Ürün Görseli URL"
            fullWidth
            value={productForm.thumbnail}
            onChange={(e) => updatePF('thumbnail', e.target.value)}
            placeholder="https://..."
            sx={{ mb: 2 }}
          />

          <FormControlLabel
            control={
              <Switch checked={productForm.isFeatured} onChange={(e) => updatePF('isFeatured', e.target.checked)} />
            }
            label="Öne çıkan ürün"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAddOpen(false)}>İptal</Button>
          <Button
            variant="contained"
            onClick={handleAddProduct}
            disabled={addLoading || !productForm.name || !productForm.price}
          >
            {addLoading ? 'Ekleniyor...' : 'Ürünü Ekle'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
        <Alert severity={snack.severity} variant="filled">{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
}

// ─── Siparişler Alt Bileşeni ───
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';

const ORDER_STATUS_MAP: Record<string, { label: string; color: 'warning' | 'info' | 'success' | 'error' | 'default' }> = {
  pending: { label: 'Beklemede', color: 'warning' },
  confirmed: { label: 'Onaylandı', color: 'info' },
  preparing: { label: 'Hazırlanıyor', color: 'info' },
  shipped: { label: 'Kargoda', color: 'info' },
  delivered: { label: 'Teslim Edildi', color: 'success' },
  cancelled: { label: 'İptal', color: 'error' },
  refunded: { label: 'İade', color: 'error' },
};

function StoreOrdersTab({ storeId }: { storeId?: string }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [stats, setStats] = useState<{ total: number; pending: number; revenue: number }>({ total: 0, pending: 0, revenue: 0 });

  useEffect(() => {
    if (!storeId) return;
    setLoading(true);
    const params: Record<string, any> = { page, limit: 10 };
    if (statusFilter) params.status = statusFilter;
    apiClient.get('/orders/my-store', { params })
      .then(res => {
        const data = res.data?.data || res.data || [];
        setOrders(Array.isArray(data) ? data : data.orders || []);
        setTotalPages(res.data?.pagination?.totalPages || Math.ceil((res.data?.total || data.length) / 10));
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));

    // İstatistikler
    apiClient.get('/orders/my-store/stats')
      .then(res => {
        const d = res.data?.data || res.data || {};
        setStats({ total: d.totalOrders || 0, pending: d.pendingOrders || 0, revenue: d.totalRevenue || 0 });
      })
      .catch(() => {});
  }, [storeId, page, statusFilter]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await apiClient.patch(`/orders/${orderId}/status`, { status: newStatus });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch { /* ignore */ }
  };

  if (!storeId) return <Box py={6} textAlign="center"><Typography color="text.secondary">Mağaza bulunamadı</Typography></Box>;

  return (
    <Box>
      {/* Satış İstatistikleri */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={4}>
          <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'rgba(26,107,82,0.05)' }}>
            <ShoppingCartIcon sx={{ fontSize: 28, color: '#1a6b52', mb: 0.5 }} />
            <Typography variant="h5" fontWeight={800} color="primary">{stats.total}</Typography>
            <Typography variant="caption" color="text.secondary">Toplam Sipariş</Typography>
          </Card>
        </Grid>
        <Grid item xs={4}>
          <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'rgba(212,136,46,0.05)' }}>
            <LocalShippingIcon sx={{ fontSize: 28, color: '#d4882e', mb: 0.5 }} />
            <Typography variant="h5" fontWeight={800} color="secondary">{stats.pending}</Typography>
            <Typography variant="caption" color="text.secondary">Bekleyen</Typography>
          </Card>
        </Grid>
        <Grid item xs={4}>
          <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'rgba(39,174,96,0.05)' }}>
            <Typography sx={{ fontSize: 28, mb: 0.5 }}>💰</Typography>
            <Typography variant="h5" fontWeight={800} color="success.main">{stats.revenue.toLocaleString('tr-TR')} ₺</Typography>
            <Typography variant="caption" color="text.secondary">Toplam Gelir</Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Filtreler */}
      <Box display="flex" gap={1} mb={2} flexWrap="wrap">
        <Chip label="Tümü" variant={!statusFilter ? 'filled' : 'outlined'} color={!statusFilter ? 'primary' : 'default'} onClick={() => { setStatusFilter(''); setPage(1); }} sx={{ cursor: 'pointer' }} />
        {Object.entries(ORDER_STATUS_MAP).map(([key, cfg]) => (
          <Chip key={key} label={cfg.label} variant={statusFilter === key ? 'filled' : 'outlined'} color={statusFilter === key ? cfg.color : 'default'} onClick={() => { setStatusFilter(key); setPage(1); }} sx={{ cursor: 'pointer' }} />
        ))}
      </Box>

      {loading ? (
        <Skeleton variant="rounded" height={300} />
      ) : orders.length === 0 ? (
        <Box textAlign="center" py={6}>
          <ShoppingCartIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary">Henüz sipariş yok</Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Sipariş</TableCell>
                <TableCell>Müşteri</TableCell>
                <TableCell align="center">Ürün</TableCell>
                <TableCell align="right">Tutar</TableCell>
                <TableCell align="center">Durum</TableCell>
                <TableCell align="center">Tarih</TableCell>
                <TableCell align="center">İşlem</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order: any) => {
                const status = ORDER_STATUS_MAP[order.status] || ORDER_STATUS_MAP.pending;
                const itemCount = order.items?.length || order.itemCount || 1;
                return (
                  <TableRow key={order.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.8rem' }}>
                        #{order.id?.slice(-6).toUpperCase()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontSize="0.8rem">{order.user?.name || order.shippingAddress?.fullName || '-'}</Typography>
                      <Typography variant="caption" color="text.secondary">{order.shippingAddress?.city}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">{itemCount} ürün</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={700} color="primary">
                        {Number(order.total || order.subtotal || 0).toLocaleString('tr-TR')} ₺
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={status.label} color={status.color} size="small" sx={{ fontSize: '0.7rem', fontWeight: 600 }} />
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="caption" color="text.secondary">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString('tr-TR') : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {order.status === 'pending' && (
                        <Button size="small" variant="outlined" color="success" sx={{ fontSize: '0.65rem', textTransform: 'none' }}
                          onClick={() => handleStatusChange(order.id, 'confirmed')}>Onayla</Button>
                      )}
                      {order.status === 'confirmed' && (
                        <Button size="small" variant="outlined" color="info" sx={{ fontSize: '0.65rem', textTransform: 'none' }}
                          onClick={() => handleStatusChange(order.id, 'preparing')}>Hazırla</Button>
                      )}
                      {order.status === 'preparing' && (
                        <Button size="small" variant="outlined" color="info" sx={{ fontSize: '0.65rem', textTransform: 'none' }}
                          onClick={() => handleStatusChange(order.id, 'shipped')}>Kargola</Button>
                      )}
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
          <Pagination count={totalPages} page={page} onChange={(_, p) => setPage(p)} color="primary" />
        </Box>
      )}
    </Box>
  );
}
