import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Rating from '@mui/material/Rating';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Skeleton from '@mui/material/Skeleton';
import Divider from '@mui/material/Divider';
import StorefrontIcon from '@mui/icons-material/Storefront';
import VerifiedIcon from '@mui/icons-material/Verified';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteFilledIcon from '@mui/icons-material/Favorite';
import ShareIcon from '@mui/icons-material/Share';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import SecurityIcon from '@mui/icons-material/Security';
import CachedIcon from '@mui/icons-material/Cached';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import apiClient from '@services/api/client';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { addItem } from '@store/slices/cartSlice';
import { toggleFavorite, selectIsFavorite } from '@store/slices/favoriteSlice';

interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  salePrice: number | null;
  currency: string;
  categories: string[];
  tags: string[];
  images: string[];
  thumbnail: string;
  attributes: Record<string, string>;
  variations: Array<Record<string, string>>;
  stockQuantity: number;
  ratingAverage: number;
  ratingCount: number;
  isFeatured: boolean;
  store?: {
    id: string;
    name: string;
    slug: string;
    logo: string;
    isVerified: boolean;
    ratingAverage: number;
  };
}

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [snackOpen, setSnackOpen] = useState(false);
  const isFavorite = useAppSelector(selectIsFavorite(slug || ''));
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await apiClient.get(`/products/${slug}`);
        setProduct(res.data?.data || res.data);
      } catch (err) {
        console.log('Ürün yüklenemedi', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [slug]);

  if (loading) {
    return (
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Skeleton variant="rounded" height={400} />
        </Grid>
        <Grid item xs={12} md={6}>
          <Skeleton variant="text" width={300} height={40} />
          <Skeleton variant="text" width={200} />
          <Skeleton variant="text" width={150} height={50} />
          <Skeleton variant="rounded" height={48} sx={{ mt: 2 }} />
        </Grid>
      </Grid>
    );
  }

  if (!product) {
    return (
      <Box textAlign="center" py={8}>
        <Typography variant="h5" color="text.secondary">
          Ürün bulunamadı
        </Typography>
      </Box>
    );
  }

  const hasDiscount = product.salePrice && product.salePrice < product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.salePrice!) / product.price) * 100)
    : 0;
  const images = product.images?.length ? product.images : [product.thumbnail || 'https://via.placeholder.com/600x400'];

  return (
    <Box>
      <Grid container spacing={4}>
        {/* Images */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, overflow: 'hidden', mb: 2 }}>
            <CardMedia
              component="img"
              image={images[selectedImage]}
              alt={product.name}
              sx={{ height: { xs: 300, md: 450 }, objectFit: 'cover' }}
            />
          </Card>
          {images.length > 1 && (
            <Box display="flex" gap={1} overflow="auto">
              {images.map((img, i) => (
                <Box
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  sx={{
                    width: 72,
                    height: 72,
                    borderRadius: 1.5,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: i === selectedImage ? '2px solid' : '2px solid transparent',
                    borderColor: i === selectedImage ? 'primary.main' : 'transparent',
                    opacity: i === selectedImage ? 1 : 0.6,
                    transition: 'all 0.2s',
                    flexShrink: 0,
                  }}
                >
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </Box>
              ))}
            </Box>
          )}
        </Grid>

        {/* Product Info */}
        <Grid item xs={12} md={6}>
          <Box display="flex" gap={1} flexWrap="wrap" mb={1}>
            {product.categories?.map((cat) => (
              <Chip key={cat} label={cat} size="small" variant="outlined" />
            ))}
            {product.isFeatured && <Chip label="Öne Çıkan" color="primary" size="small" />}
          </Box>

          <Typography variant="h4" fontWeight={700} mb={1}>
            {product.name}
          </Typography>

          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <Rating value={product.ratingAverage} precision={0.5} readOnly />
            <Typography variant="body2" color="text.secondary">
              ({product.ratingCount} değerlendirme)
            </Typography>
          </Box>

          {/* Price */}
          <Box display="flex" alignItems="baseline" gap={2} mb={1}>
            <Typography variant="h4" color="primary" fontWeight={800}>
              {(hasDiscount ? product.salePrice : product.price)?.toLocaleString('tr-TR')} ₺
            </Typography>
            {hasDiscount && (
              <>
                <Typography variant="h6" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                  {product.price.toLocaleString('tr-TR')} ₺
                </Typography>
                <Chip label={`%${discountPercent} indirim`} color="error" size="small" />
              </>
            )}
          </Box>

          {product.shortDescription && (
            <Typography variant="body1" color="text.secondary" mb={2}>
              {product.shortDescription}
            </Typography>
          )}

          {product.stockQuantity > 0 ? (
            <Typography variant="body2" color="success.main" fontWeight={600} mb={2}>
              Stokta {product.stockQuantity > 10 ? '' : `(${product.stockQuantity} adet kaldı)`}
            </Typography>
          ) : (
            <Typography variant="body2" color="error" fontWeight={600} mb={2}>
              Stokta yok
            </Typography>
          )}

          <Divider sx={{ my: 2 }} />

          {/* Quantity & Add to Cart */}
          <Box display="flex" alignItems="center" gap={2} mb={3}>
            <Box display="flex" alignItems="center" border={1} borderColor="divider" borderRadius={2}>
              <IconButton size="small" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
                <RemoveIcon />
              </IconButton>
              <Typography sx={{ px: 2, minWidth: 32, textAlign: 'center' }}>{quantity}</Typography>
              <IconButton size="small" onClick={() => setQuantity((q) => q + 1)}>
                <AddIcon />
              </IconButton>
            </Box>
            <Button
              variant="contained"
              size="large"
              startIcon={<AddShoppingCartIcon />}
              sx={{ flex: 1, py: 1.5 }}
              disabled={product.stockQuantity === 0}
              onClick={() => {
                const price = hasDiscount ? Number(product.salePrice) : Number(product.price);
                dispatch(addItem({
                  id: product.id,
                  productId: product.id,
                  storeId: product.store?.id || '',
                  name: product.name,
                  thumbnail: product.thumbnail || images[0],
                  price,
                  quantity,
                }));
                setSnackOpen(true);
              }}
            >
              Sepete Ekle
            </Button>
            <IconButton
              sx={{ border: 1, borderColor: isFavorite ? 'error.main' : 'divider' }}
              onClick={() => {
                if (isAuthenticated && product) dispatch(toggleFavorite(product.id));
                else navigate('/login');
              }}
            >
              {isFavorite ? <FavoriteFilledIcon color="error" /> : <FavoriteBorderIcon />}
            </IconButton>
            <IconButton sx={{ border: 1, borderColor: 'divider' }}>
              <ShareIcon />
            </IconButton>
          </Box>

          {/* Benefits */}
          <Box display="flex" gap={3} mb={3}>
            <Box display="flex" alignItems="center" gap={0.5}>
              <LocalShippingIcon fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                Ücretsiz kargo
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={0.5}>
              <SecurityIcon fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                Güvenli ödeme
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={0.5}>
              <CachedIcon fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                Kolay iade
              </Typography>
            </Box>
          </Box>

          {/* Store Info */}
          {product.store && (
            <Card
              sx={{
                display: 'flex',
                alignItems: 'center',
                p: 2,
                gap: 2,
                cursor: 'pointer',
                '&:hover': { boxShadow: 3 },
              }}
              onClick={() => navigate(`/store/${product.store!.slug}`)}
            >
              <Avatar src={product.store.logo} sx={{ width: 48, height: 48 }}>
                <StorefrontIcon />
              </Avatar>
              <Box flex={1}>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    {product.store.name}
                  </Typography>
                  {product.store.isVerified && <VerifiedIcon color="primary" sx={{ fontSize: 16 }} />}
                </Box>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <Rating value={product.store.ratingAverage} precision={0.5} size="small" readOnly />
                </Box>
              </Box>
              <Button variant="outlined" size="small">
                Mağazaya Git
              </Button>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Description */}
      {product.description && (
        <Box mt={4}>
          <Typography variant="h6" fontWeight={600} mb={2}>
            Ürün Açıklaması
          </Typography>
          <Typography variant="body1" color="text.secondary" whiteSpace="pre-line">
            {product.description}
          </Typography>
        </Box>
      )}

      {/* Attributes */}
      {product.attributes && Object.keys(product.attributes).length > 0 && (
        <Box mt={4}>
          <Typography variant="h6" fontWeight={600} mb={2}>
            Ürün Özellikleri
          </Typography>
          <Grid container spacing={1}>
            {Object.entries(product.attributes).map(([key, value]) => (
              <Grid item xs={6} sm={4} key={key}>
                <Box sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 1.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    {key}
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {value}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Tags */}
      {product.tags?.length > 0 && (
        <Box display="flex" gap={1} flexWrap="wrap" mt={3}>
          {product.tags.map((tag) => (
            <Chip key={tag} label={`#${tag}`} size="small" variant="outlined" />
          ))}
        </Box>
      )}

      <Snackbar open={snackOpen} autoHideDuration={3000} onClose={() => setSnackOpen(false)}>
        <Alert onClose={() => setSnackOpen(false)} severity="success" variant="filled">
          Ürün sepete eklendi!
        </Alert>
      </Snackbar>
    </Box>
  );
}
