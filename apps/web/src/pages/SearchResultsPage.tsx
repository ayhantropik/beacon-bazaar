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
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Slider from '@mui/material/Slider';
import Button from '@mui/material/Button';
import Pagination from '@mui/material/Pagination';
import Collapse from '@mui/material/Collapse';
import FavoriteIcon from '@mui/icons-material/FavoriteBorder';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import StorefrontIcon from '@mui/icons-material/Storefront';
import VerifiedIcon from '@mui/icons-material/Verified';
import TuneIcon from '@mui/icons-material/Tune';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import SearchBar from '@components/molecules/SearchBar';
import apiClient from '@services/api/client';
import { useAppDispatch } from '@store/hooks';
import { addItem } from '@store/slices/cartSlice';

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
  { value: 'newest', label: 'En Yeni' },
  { value: 'price_asc', label: 'Fiyat: Düşükten Yükseğe' },
  { value: 'price_desc', label: 'Fiyat: Yüksekten Düşüğe' },
  { value: 'rating', label: 'En Yüksek Puan' },
];

const CATEGORIES = ['Elektronik', 'Giyim', 'Gıda', 'Kitap', 'Spor', 'Kozmetik', 'Aksesuar', 'Ev & Yaşam'];

export default function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const query = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category') || '';

  const [tab, setTab] = useState(0);
  const [products, setProducts] = useState<ProductResult[]>([]);
  const [stores, setStores] = useState<StoreResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest');
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [priceRange, setPriceRange] = useState<number[]>([0, 100000]);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [snackOpen, setSnackOpen] = useState(false);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 12 };
      if (query) params.q = query;
      if (selectedCategory) params.categories = selectedCategory;
      if (sortBy) params.sortBy = sortBy;
      if (priceRange[0] > 0) params.minPrice = priceRange[0];
      if (priceRange[1] < 100000) params.maxPrice = priceRange[1];

      const [prodRes, storeRes] = await Promise.all([
        apiClient.get('/products/search', { params }),
        apiClient.get('/stores/search', { params: { q: query, categories: selectedCategory, page: 1, limit: 6 } }),
      ]);

      const prodData = prodRes.data;
      setProducts(prodData?.data || []);
      setTotalPages(prodData?.pagination?.totalPages || 1);
      setStores(storeRes.data?.data || []);
    } catch (err) {
      console.log('Arama hatası', err);
    } finally {
      setLoading(false);
    }
  }, [query, selectedCategory, sortBy, priceRange, page]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const handleSearch = (newQuery: string) => {
    setSearchParams({ q: newQuery });
    setPage(1);
  };

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
      <Box mb={3}>
        <Box maxWidth={600} mb={2}>
          <SearchBar onSearch={handleSearch} placeholder="Ne aramıştınız?" />
        </Box>
        {(query || selectedCategory) && (
          <Typography variant="h5" fontWeight={700}>
            {query ? `"${query}" için sonuçlar` : `${selectedCategory} kategorisi`}
          </Typography>
        )}
      </Box>

      {/* Category Chips */}
      <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
        {CATEGORIES.map((cat) => (
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

      {/* Tabs & Controls */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label={`Ürünler (${products.length})`} />
          <Tab label={`Mağazalar (${stores.length})`} />
        </Tabs>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<TuneIcon />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filtrele
          </Button>
          {tab === 0 && (
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Sıralama</InputLabel>
              <Select value={sortBy} label="Sıralama" onChange={(e) => { setSortBy(e.target.value); setPage(1); }}>
                {SORT_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
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

      {/* Products Tab */}
      {tab === 0 && (
        <>
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
                        <Box sx={{ position: 'relative' }}>
                          <CardMedia
                            component="img"
                            height="180"
                            image={product.thumbnail || 'https://via.placeholder.com/300x180'}
                            alt={product.name}
                            sx={{ objectFit: 'cover' }}
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
                          <IconButton size="small" aria-label="favorilere ekle">
                            <FavoriteIcon fontSize="small" />
                          </IconButton>
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
        </>
      )}

      {/* Stores Tab */}
      {tab === 1 && (
        <Grid container spacing={2}>
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <Grid item xs={12} md={4} key={i}>
                  <Skeleton variant="rounded" height={140} />
                </Grid>
              ))
            : stores.length === 0 ? (
                <Grid item xs={12}>
                  <Box textAlign="center" py={6}>
                    <Typography variant="h6" color="text.secondary">
                      Mağaza bulunamadı
                    </Typography>
                  </Box>
                </Grid>
              )
            : stores.map((store) => (
                <Grid item xs={12} sm={6} md={4} key={store.id}>
                  <Card
                    sx={{
                      display: 'flex',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 },
                    }}
                    onClick={() => navigate(`/store/${store.slug}`)}
                  >
                    <CardMedia
                      component="img"
                      sx={{ width: 120, objectFit: 'cover' }}
                      image={store.coverImage || 'https://via.placeholder.com/120'}
                      alt={store.name}
                    />
                    <CardContent sx={{ flex: 1, py: 1.5 }}>
                      <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                        <Avatar src={store.logo} sx={{ width: 28, height: 28 }}>
                          <StorefrontIcon fontSize="small" />
                        </Avatar>
                        <Typography variant="subtitle2" fontWeight={600} noWrap>
                          {store.name}
                        </Typography>
                        {store.isVerified && <VerifiedIcon color="primary" sx={{ fontSize: 16 }} />}
                      </Box>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <Rating value={store.ratingAverage} precision={0.5} size="small" readOnly />
                        <Typography variant="caption" color="text.secondary">
                          ({store.ratingCount})
                        </Typography>
                      </Box>
                      <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.5}>
                        {store.categories?.slice(0, 2).map((cat: string) => (
                          <Chip key={cat} label={cat} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 22 }} />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
        </Grid>
      )}
      <Snackbar open={snackOpen} autoHideDuration={2000} onClose={() => setSnackOpen(false)}>
        <Alert onClose={() => setSnackOpen(false)} severity="success" variant="filled">
          Ürün sepete eklendi!
        </Alert>
      </Snackbar>
    </Box>
  );
}
