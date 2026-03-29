import React, { useEffect, useState } from 'react';
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
import FavoriteIcon from '@mui/icons-material/FavoriteBorder';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import StorefrontIcon from '@mui/icons-material/Storefront';
import VerifiedIcon from '@mui/icons-material/Verified';
import PhoneAndroid from '@mui/icons-material/PhoneAndroid';
import Checkroom from '@mui/icons-material/Checkroom';
import Restaurant from '@mui/icons-material/Restaurant';
import MenuBook from '@mui/icons-material/MenuBook';
import FitnessCenter from '@mui/icons-material/FitnessCenter';
import Spa from '@mui/icons-material/Spa';
import SearchBar from '@components/molecules/SearchBar';
import { useNavigate } from 'react-router-dom';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { useAppDispatch } from '@store/hooks';
import { setUserLocation } from '@store/slices/mapSlice';
import { addItem } from '@store/slices/cartSlice';
import apiClient from '@services/api/client';

interface StoreData {
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

interface ProductData {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  salePrice: number | null;
  currency: string;
  categories: string[];
  thumbnail: string;
  ratingAverage: number;
  ratingCount: number;
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Elektronik: PhoneAndroid,
  Giyim: Checkroom,
  'Gıda': Restaurant,
  Kitap: MenuBook,
  Spor: FitnessCenter,
  Kozmetik: Spa,
};

const CATEGORIES = [
  { name: 'Elektronik', color: '#2196F3' },
  { name: 'Giyim', color: '#E91E63' },
  { name: 'Gıda', color: '#4CAF50' },
  { name: 'Kitap', color: '#FF9800' },
  { name: 'Spor', color: '#9C27B0' },
  { name: 'Kozmetik', color: '#00BCD4' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [stores, setStores] = useState<StoreData[]>([]);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackOpen, setSnackOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [storesRes, productsRes] = await Promise.all([
          apiClient.get('/stores/search?limit=6'),
          apiClient.get('/products/featured'),
        ]);
        setStores(storesRes.data?.data || storesRes.data || []);
        setProducts(productsRes.data?.data || productsRes.data || []);
      } catch (err) {
        console.log('API bağlantısı bekleniyor...', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleSearch = (query: string) => {
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleLocationClick = () => {
    navigator.geolocation.getCurrentPosition((pos) => {
      dispatch(
        setUserLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }),
      );
      navigate('/map');
    });
  };

  return (
    <Box>
      {/* Hero */}
      <Box
        sx={{
          textAlign: 'center',
          py: { xs: 4, md: 8 },
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          borderRadius: 4,
          mb: 4,
          px: 2,
        }}
      >
        <Typography variant="h3" fontFamily="'Plus Jakarta Sans', sans-serif" fontWeight={800} gutterBottom>
          Yakınındaki Mağazaları Keşfet
        </Typography>
        <Typography variant="h6" color="text.secondary" mb={4}>
          Konum bazlı alışveriş deneyimi ile aradığın her şey bir adım uzağında
        </Typography>
        <Box maxWidth={600} mx="auto">
          <SearchBar onSearch={handleSearch} onLocationClick={handleLocationClick} placeholder="Ne aramıştınız?" />
        </Box>
      </Box>

      {/* Kategoriler */}
      <Typography variant="h5" fontWeight={700} mb={2}>
        Popüler Kategoriler
      </Typography>
      <Grid container spacing={2} mb={5}>
        {CATEGORIES.map((cat) => (
          <Grid item xs={4} sm={2} key={cat.name}>
            <Card
              sx={{
                textAlign: 'center',
                py: 2,
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: 3 },
              }}
              onClick={() => navigate(`/search?category=${cat.name}`)}
            >
              <Avatar sx={{ bgcolor: cat.color + '20', color: cat.color, mx: 'auto', width: 56, height: 56, mb: 1 }}>
                {React.createElement(CATEGORY_ICONS[cat.name])}
              </Avatar>
              <Typography variant="body2" fontWeight={600}>
                {cat.name}
              </Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Mağazalar */}
      <Typography variant="h5" fontWeight={700} mb={2}>
        Yakınındaki Mağazalar
      </Typography>
      <Grid container spacing={2} mb={5}>
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Grid item xs={12} md={4} key={i}>
                <Skeleton variant="rounded" height={140} />
              </Grid>
            ))
          : stores.slice(0, 6).map((store) => (
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
                      {store.categories.slice(0, 2).map((cat: string) => (
                        <Chip key={cat} label={cat} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 22 }} />
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
      </Grid>

      {/* Ürünler */}
      <Typography variant="h5" fontWeight={700} mb={2}>
        Öne Çıkan Ürünler
      </Typography>
      <Grid container spacing={2} mb={4}>
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Grid item xs={6} sm={3} key={i}>
                <Skeleton variant="rounded" height={280} />
              </Grid>
            ))
          : products.slice(0, 8).map((product) => {
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

      <Snackbar open={snackOpen} autoHideDuration={2000} onClose={() => setSnackOpen(false)}>
        <Alert onClose={() => setSnackOpen(false)} severity="success" variant="filled">
          Ürün sepete eklendi!
        </Alert>
      </Snackbar>
    </Box>
  );
}
