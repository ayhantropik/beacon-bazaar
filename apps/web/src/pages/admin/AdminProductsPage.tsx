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
import Avatar from '@mui/material/Avatar';
import Switch from '@mui/material/Switch';
import Pagination from '@mui/material/Pagination';
import Skeleton from '@mui/material/Skeleton';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import adminService from '@services/api/admin.service';
import { productService } from '@services/api/product.service';

export default function AdminProductsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [featuredFilter, setFeaturedFilter] = useState('');
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' as 'success' | 'error' });

  const fetchProducts = useCallback(() => {
    setLoading(true);
    const params: Record<string, any> = { page, limit: 20 };
    if (search) params.search = search;
    if (category) params.category = category;
    if (activeFilter) params.isActive = activeFilter;
    if (featuredFilter) params.isFeatured = featuredFilter;
    adminService.getProducts(params)
      .then((res) => {
        const items = res.data || res.products || [];
        setProducts(Array.isArray(items) ? items : []);
        setTotalPages(res.pagination?.totalPages || 1);
      })
      .catch((err) => {
        console.error('Admin products error:', err?.response?.status, err?.response?.data || err.message);
        setSnack({ open: true, msg: `Ürünler yüklenemedi: ${err?.response?.status || err.message}`, severity: 'error' });
        setProducts([]);
      })
      .finally(() => setLoading(false));
  }, [page, search, category, activeFilter, featuredFilter]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => {
    productService.getCategories().then((res: any) => { if (res?.data) setCategories(res.data); }).catch(() => {});
  }, []);

  const handleStatusToggle = async (id: string, current: boolean) => {
    try {
      await adminService.updateProductStatus(id, !current);
      setSnack({ open: true, msg: !current ? 'Ürün aktifleştirildi' : 'Ürün deaktif edildi', severity: 'success' });
      fetchProducts();
    } catch {
      setSnack({ open: true, msg: 'İşlem başarısız', severity: 'error' });
    }
  };

  const handleFeaturedToggle = async (id: string, current: boolean) => {
    try {
      await adminService.updateProductFeatured(id, !current);
      setSnack({ open: true, msg: !current ? 'Ürün öne çıkarıldı' : 'Öne çıkarmadan kaldırıldı', severity: 'success' });
      fetchProducts();
    } catch {
      setSnack({ open: true, msg: 'İşlem başarısız', severity: 'error' });
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>Ürün Yönetimi</Typography>

      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        <TextField size="small" placeholder="Ürün adı ara..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} sx={{ minWidth: 250 }} />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Kategori</InputLabel>
          <Select value={category} label="Kategori" onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
            <MenuItem value="">Tümü</MenuItem>
            {categories.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
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
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Öne Çıkan</InputLabel>
          <Select value={featuredFilter} label="Öne Çıkan" onChange={(e) => { setFeaturedFilter(e.target.value); setPage(1); }}>
            <MenuItem value="">Tümü</MenuItem>
            <MenuItem value="true">Evet</MenuItem>
            <MenuItem value="false">Hayır</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {loading ? (
        <Skeleton variant="rounded" height={400} />
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Ürün</TableCell>
                <TableCell>Mağaza</TableCell>
                <TableCell align="right">Fiyat</TableCell>
                <TableCell align="center">Stok</TableCell>
                <TableCell align="center">Aktif</TableCell>
                <TableCell align="center">Öne Çıkan</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center"><Typography color="text.secondary" py={3}>Ürün bulunamadı</Typography></TableCell></TableRow>
              ) : products.map((p) => (
                <TableRow key={p.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/product/${p.slug || p.id}`)}>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <Avatar variant="rounded" src={p.thumbnail} sx={{ width: 40, height: 40 }} />
                      <Box>
                        <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 250 }}>{p.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{(p.categories as string[])?.[0]}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{p.store?.name || '-'}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={600}>
                      {(p.salePrice || p.price)?.toLocaleString('tr-TR')} ₺
                    </Typography>
                    {p.salePrice && p.salePrice < p.price && (
                      <Typography variant="caption" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                        {p.price?.toLocaleString('tr-TR')} ₺
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Chip label={p.stockQuantity ?? 0} size="small" color={p.stockQuantity > 0 ? 'default' : 'error'} />
                  </TableCell>
                  <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                    <Switch checked={p.isActive} size="small" onChange={() => handleStatusToggle(p.id, p.isActive)} />
                  </TableCell>
                  <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                    <Tooltip title={p.isFeatured ? 'Öne çıkarmadan kaldır' : 'Öne çıkar'}>
                      <IconButton size="small" color={p.isFeatured ? 'warning' : 'default'} onClick={() => handleFeaturedToggle(p.id, p.isFeatured)}>
                        {p.isFeatured ? <StarIcon fontSize="small" /> : <StarBorderIcon fontSize="small" />}
                      </IconButton>
                    </Tooltip>
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
