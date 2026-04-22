import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Rating from '@mui/material/Rating';
import IconButton from '@mui/material/IconButton';
import Skeleton from '@mui/material/Skeleton';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Slider from '@mui/material/Slider';
import Button from '@mui/material/Button';
import Pagination from '@mui/material/Pagination';
import Collapse from '@mui/material/Collapse';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteFilledIcon from '@mui/icons-material/Favorite';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import TimelineIcon from '@mui/icons-material/Timeline';
import StorefrontIcon from '@mui/icons-material/Storefront';
import VerifiedIcon from '@mui/icons-material/Verified';
import TuneIcon from '@mui/icons-material/Tune';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import apiClient from '@services/api/client';
import { productService } from '@services/api/product.service';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { setUserLocation } from '@store/slices/mapSlice';
import { addItem } from '@store/slices/cartSlice';
import { toggleFavorite } from '@store/slices/favoriteSlice';
import Popover from '@mui/material/Popover';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';

interface ProductResult {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice: number | null;
  categories: string[];
  thumbnail: string;
  ratingAverage: number;
  ratingCount: number;
}

interface StoreResult {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo: string;
  coverImage: string;
  categories: string[];
  ratingAverage: number;
  ratingCount: number;
  isVerified: boolean;
  followersCount: number;
  productsCount: number;
}

const SORT_OPTIONS = [
  { value: 'rating', label: 'Popülerlik' },
  { value: 'newest', label: 'En Yeni' },
  { value: 'price_asc', label: 'Fiyat: Düşükten Yükseğe' },
  { value: 'price_desc', label: 'Fiyat: Yüksekten Düşüğe' },
  { value: 'popular', label: 'Çok Satanlar' },
  { value: 'discount', label: 'Flaş Ürünler (İndirimli)' },
];

const FALLBACK_CATEGORIES = [
  'Kadın', 'Erkek', 'Anne & Çocuk', 'Ev & Yaşam', 'Süpermarket',
  'Kozmetik', 'Ayakkabı & Çanta', 'Elektronik', 'Saat & Aksesuar',
  'Spor & Outdoor', 'Kitap & Kırtasiye', 'Hediyelik', 'Oyuncak & Hobi',
];

export default function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const userLocation = useAppSelector((state) => state.map.userLocation);
  const query = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category') || '';

  const [products, setProducts] = useState<ProductResult[]>([]);
  const [stores, setStores] = useState<StoreResult[]>([]);
  const [loading, setLoading] = useState(true);
  const sortByParam = searchParams.get('sortBy') || '';
  const [sortBy, setSortBy] = useState(sortByParam || 'rating');
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [priceRange, setPriceRange] = useState<number[]>([0, 100000]);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [snackOpen, setSnackOpen] = useState(false);
  const [fuzzyMatch, setFuzzyMatch] = useState(false);
  const favoriteIds = useAppSelector((state) => state.favorites.ids);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const [priceAnchor, setPriceAnchor] = useState<{ el: HTMLElement; productId: string } | null>(null);
  const [priceHistory, setPriceHistory] = useState<Array<{ date: string; price: number; salePrice?: number }>>([]);
  const [priceLoading, setPriceLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>(FALLBACK_CATEGORIES);

  useEffect(() => {
    productService.getCategories().then((res: any) => { if (res?.data?.length) setCategories(res.data); }).catch(() => {});
  }, []);

  // URL category değiştiğinde state'i güncelle
  useEffect(() => {
    setSelectedCategory(categoryParam);
    setPage(1);
  }, [categoryParam]);

  // Kullanıcı konumunu al
  useEffect(() => {
    if (userLocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => dispatch(setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude })),
      () => {},
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 20, sortBy };
      if (query) params.q = query;
      if (selectedCategory) params.categories = selectedCategory;
      if (priceRange[0] > 0) params.minPrice = priceRange[0];
      if (priceRange[1] < 100000) params.maxPrice = priceRange[1];

      const prodRes = await apiClient.get('/products/search', { params });
      const prodData = prodRes.data;
      const productList = prodData?.data || [];
      setProducts(productList);
      setTotalPages(prodData?.pagination?.totalPages || 1);
      setFuzzyMatch(!!prodData?.fuzzyMatch);

      // Ürünlerin ait olduğu mağazaları topla
      const storeIds = [...new Set(productList.map((p: any) => p.storeId).filter(Boolean))] as string[];

      if (storeIds.length > 0 && userLocation) {
        // Konum varsa: bu ürünü satan en yakın mağazaları getir
        const nearbyRes = await apiClient.get('/stores/nearby', {
          params: {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            radius: 100,
            storeIds: storeIds.join(','),
          },
        });
        setStores(nearbyRes.data?.data || []);
      } else if (storeIds.length > 0) {
        // Konum yoksa: ürünlerin mağazalarını normal getir
        const storeRes = await apiClient.get('/stores/search', { params: { q: query, page: 1, limit: 20, sortBy: 'rating' } });
        setStores(storeRes.data?.data || []);
      } else {
        setStores([]);
      }
    } catch (err) {
      console.log('Arama hatası', err);
    } finally {
      setLoading(false);
    }
  }, [query, selectedCategory, sortBy, priceRange, page, userLocation]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const handleCategoryClick = (cat: string) => {
    const next = selectedCategory === cat ? '' : cat;
    setSelectedCategory(next);
    setPage(1);
    if (next) {
      searchParams.set('category', next);
    } else {
      searchParams.delete('category');
    }
    setSearchParams(searchParams);
  };

  return (
    <Box>
      {/* Search Header */}
      <Box mb={3} display="flex" alignItems="center" gap={1}>
        <IconButton
          onClick={() => navigate('/')}
          sx={{
            bgcolor: '#f5f5f5',
            '&:hover': { bgcolor: '#e0e0e0' },
          }}
        >
          <ArrowBackIcon />
        </IconButton>
        {(query || selectedCategory || sortByParam) && (
          <Typography variant="h5" fontWeight={700}>
            {query ? `"${query}" için sonuçlar` : sortByParam === 'discount' ? 'Flaş Ürünler' : sortByParam === 'popular' ? 'Çok Satanlar' : selectedCategory ? `${selectedCategory} kategorisi` : ''}
          </Typography>
        )}
      </Box>

      {/* Favori Mağazalar - Horizontal Scrolling Strip */}
      {stores.length > 0 && (
        <Box mb={3}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
            <Box display="flex" alignItems="center" gap={1}>
              {userLocation && <LocationOnIcon color="primary" sx={{ fontSize: 20 }} />}
              <Typography variant="h6" fontWeight={700}>
                {userLocation ? 'Bu Ürünü Satan En Yakın Mağazalar' : 'Bu Ürünü Satan Mağazalar'}
              </Typography>
            </Box>
            <Button
              size="small"
              endIcon={<ArrowForwardIosIcon sx={{ fontSize: '12px !important' }} />}
              onClick={() => navigate('/stores')}
              sx={{ textTransform: 'none' }}
            >
              Tümünü Gör
            </Button>
          </Box>
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              overflowX: 'auto',
              pb: 1.5,
              scrollSnapType: 'x mandatory',
              '&::-webkit-scrollbar': { height: 4 },
              '&::-webkit-scrollbar-thumb': { bgcolor: 'grey.300', borderRadius: 2 },
            }}
          >
            {stores.map((store) => (
              <Card
                key={store.id}
                sx={{
                  minWidth: 200,
                  maxWidth: 220,
                  flexShrink: 0,
                  scrollSnapAlign: 'start',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 },
                }}
                onClick={() => navigate(`/store/${store.slug}`)}
              >
                <Box sx={{ position: 'relative', height: 80, overflow: 'hidden' }}>
                  <CardMedia
                    component="img"
                    height="80"
                    image={store.coverImage || 'https://via.placeholder.com/220x80'}
                    alt={store.name}
                    sx={{ objectFit: 'cover' }}
                  />
                  <Avatar
                    src={store.logo}
                    sx={{
                      width: 40,
                      height: 40,
                      position: 'absolute',
                      bottom: -16,
                      left: 12,
                      border: '2px solid white',
                      bgcolor: 'white',
                    }}
                  >
                    <StorefrontIcon fontSize="small" />
                  </Avatar>
                </Box>
                <CardContent sx={{ pt: 2.5, pb: '12px !important' }}>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <Typography variant="subtitle2" fontWeight={600} noWrap>
                      {store.name}
                    </Typography>
                    {store.isVerified && <VerifiedIcon color="primary" sx={{ fontSize: 14 }} />}
                  </Box>
                  <Box display="flex" alignItems="center" gap={0.5} mt={0.3}>
                    <Rating value={store.ratingAverage} precision={0.5} size="small" readOnly />
                    <Typography variant="caption" color="text.secondary">
                      ({store.ratingCount})
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {store.productsCount} ürün
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>
      )}

      {/* Category Chips */}
      <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
        {categories.map((cat) => (
          <Chip
            key={cat}
            label={cat}
            onClick={() => handleCategoryClick(cat)}
            color={selectedCategory === cat ? 'primary' : 'default'}
            variant={selectedCategory === cat ? 'filled' : 'outlined'}
            sx={{ cursor: 'pointer' }}
          />
        ))}
      </Box>

      {/* Fuzzy match bilgilendirmesi */}
      {fuzzyMatch && !loading && products.length > 0 && (
        <Alert severity="info" sx={{ mb: 2 }} onClose={() => setFuzzyMatch(false)}>
          <Typography variant="body2">
            <strong>"{query}"</strong> için tam eşleşme bulunamadı. Benzer sonuçlar gösteriliyor.
          </Typography>
        </Alert>
      )}

      {/* Controls */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="body2" color="text.secondary">
          {!loading && `${products.length > 0 ? `${products.length}+ ürün listeleniyor` : 'Sonuç bulunamadı'}`}
        </Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<TuneIcon />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filtrele
          </Button>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Sıralama</InputLabel>
            <Select value={sortBy} label="Sıralama" onChange={(e) => { setSortBy(e.target.value); setPage(1); }}>
              {SORT_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Filters Panel */}
      <Collapse in={showFilters}>
        <Box sx={{ p: 2, mb: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
          <Typography variant="subtitle2" fontWeight={600} mb={1}>
            Fiyat Aralığı
          </Typography>
          <Box px={2}>
            <Slider
              value={priceRange}
              onChange={(_, v) => setPriceRange(v as number[])}
              onChangeCommitted={() => setPage(1)}
              valueLabelDisplay="auto"
              min={0}
              max={100000}
              step={500}
              valueLabelFormat={(v) => `${v.toLocaleString('tr-TR')} ₺`}
            />
            <Box display="flex" justifyContent="space-between">
              <Typography variant="caption">{priceRange[0].toLocaleString('tr-TR')} ₺</Typography>
              <Typography variant="caption">{priceRange[1].toLocaleString('tr-TR')} ₺</Typography>
            </Box>
          </Box>
        </Box>
      </Collapse>

      {/* Products Grid */}
      <Grid container spacing={2}>
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <Grid item xs={6} sm={4} md={3} key={i}>
                <Skeleton variant="rounded" height={280} />
              </Grid>
            ))
          : products.length === 0 ? (
              <Grid item xs={12}>
                <Box textAlign="center" py={6}>
                  <Typography variant="h6" color="text.secondary">
                    Sonuç bulunamadı
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Farklı anahtar kelimeler veya filtreler deneyin
                  </Typography>
                </Box>
              </Grid>
            )
          : products.map((product) => {
              const hasDiscount = product.salePrice && product.salePrice < product.price;
              return (
                <Grid item xs={6} sm={4} md={3} key={product.id}>
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
                      {hasDiscount && (
                        <Chip
                          label={`%${Math.round(((product.price - product.salePrice!) / product.price) * 100)}`}
                          color="error"
                          size="small"
                          sx={{ position: 'absolute', top: 8, right: 8 }}
                        />
                      )}
                    </Box>
                    <CardContent sx={{ flexGrow: 1, pb: 0 }}>
                      <Typography variant="caption" color="text.secondary">
                        {product.categories?.[0]}
                      </Typography>
                      <Typography variant="subtitle2" fontWeight={600} noWrap>
                        {product.name}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                        <Rating value={product.ratingAverage} precision={0.5} size="small" readOnly />
                        <Typography variant="caption" color="text.secondary">
                          ({product.ratingCount})
                        </Typography>
                      </Box>
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
                      <Tooltip title={favoriteIds[product.id] ? 'Favorilerden çıkar' : 'Favorilere ekle'}>
                        <IconButton
                          size="small"
                          aria-label="favorilere ekle"
                          color={favoriteIds[product.id] ? 'error' : 'default'}
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            if (isAuthenticated) dispatch(toggleFavorite(product.id));
                            else navigate('/login');
                          }}
                        >
                          {favoriteIds[product.id] ? <FavoriteFilledIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Fiyat geçmişi">
                        <IconButton
                          size="small"
                          aria-label="fiyat geçmişi"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setPriceAnchor({ el: e.currentTarget, productId: product.id });
                            setPriceLoading(true);
                            apiClient.get(`/products/${product.id}/price-history`)
                              .then((res) => { const d = res.data?.data || res.data || []; setPriceHistory(Array.isArray(d) ? d : []); })
                              .catch(() => setPriceHistory([]))
                              .finally(() => setPriceLoading(false));
                          }}
                        >
                          <TimelineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <IconButton
                        size="small"
                        color="primary"
                        aria-label="sepete ekle"
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

      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={4}>
          <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" />
        </Box>
      )}

      <Snackbar open={snackOpen} autoHideDuration={2000} onClose={() => setSnackOpen(false)}>
        <Alert onClose={() => setSnackOpen(false)} severity="success" variant="filled">
          Ürün sepete eklendi!
        </Alert>
      </Snackbar>

      {/* Fiyat Geçmişi Popover */}
      <Popover
        open={Boolean(priceAnchor)}
        anchorEl={priceAnchor?.el}
        onClose={(e: any) => { e?.stopPropagation?.(); setPriceAnchor(null); }}
        onClick={(e) => e.stopPropagation()}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        slotProps={{ paper: { sx: { p: 2, minWidth: 220, maxWidth: 300, borderRadius: 2 } } }}
      >
        <Typography variant="subtitle2" fontWeight={700} gutterBottom>Fiyat Geçmişi</Typography>
        {priceLoading ? (
          <Box display="flex" justifyContent="center" py={2}><CircularProgress size={24} /></Box>
        ) : priceHistory.length === 0 ? (
          <Typography variant="body2" color="text.secondary">Kayıtlı fiyat geçmişi yok.</Typography>
        ) : (
          <Box>
            {priceHistory.slice(0, 8).map((entry, i) => (
              <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary">{new Date(entry.date).toLocaleDateString('tr-TR')}</Typography>
                <Typography variant="caption" fontWeight={600}>{(entry.salePrice || entry.price).toLocaleString('tr-TR')} ₺</Typography>
              </Box>
            ))}
          </Box>
        )}
      </Popover>
    </Box>
  );
}
