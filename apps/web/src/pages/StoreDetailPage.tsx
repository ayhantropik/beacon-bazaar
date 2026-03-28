import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import StorefrontIcon from '@mui/icons-material/Storefront';
import VerifiedIcon from '@mui/icons-material/Verified';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PeopleIcon from '@mui/icons-material/People';
import InventoryIcon from '@mui/icons-material/Inventory';
import FavoriteIcon from '@mui/icons-material/FavoriteBorder';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import ShareIcon from '@mui/icons-material/Share';
import apiClient from '@services/api/client';

interface StoreDetail {
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
  address: string;
  contactInfo: Record<string, string>;
  openingHours: Record<string, string>;
}

interface ProductData {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice: number | null;
  currency: string;
  categories: string[];
  thumbnail: string;
  ratingAverage: number;
  ratingCount: number;
}

export default function StoreDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [store, setStore] = useState<StoreDetail | null>(null);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    async function fetchStore() {
      try {
        const res = await apiClient.get(`/stores/${slug}`);
        const data = res.data?.data || res.data;
        setStore(data);

        const prodRes = await apiClient.get(`/stores/${data.id}/products`);
        setProducts(prodRes.data?.data || prodRes.data || []);
      } catch (err) {
        console.log('Mağaza yüklenemedi', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStore();
  }, [slug]);

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rounded" height={250} sx={{ mb: 2 }} />
        <Skeleton variant="text" width={300} height={40} />
        <Skeleton variant="text" width={200} />
        <Grid container spacing={2} mt={2}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Grid item xs={6} sm={3} key={i}>
              <Skeleton variant="rounded" height={280} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (!store) {
    return (
      <Box textAlign="center" py={8}>
        <Typography variant="h5" color="text.secondary">
          Mağaza bulunamadı
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Cover */}
      <Box
        sx={{
          height: { xs: 180, md: 280 },
          borderRadius: 3,
          overflow: 'hidden',
          mb: -6,
          background: `url(${store.coverImage || 'https://via.placeholder.com/1200x300'}) center/cover`,
        }}
      />

      {/* Store Info */}
      <Box sx={{ px: { xs: 2, md: 4 }, position: 'relative' }}>
        <Box display="flex" alignItems="flex-end" gap={2} mb={2}>
          <Avatar
            src={store.logo}
            sx={{
              width: 96,
              height: 96,
              border: '4px solid white',
              boxShadow: 2,
              bgcolor: 'grey.200',
            }}
          >
            <StorefrontIcon sx={{ fontSize: 48 }} />
          </Avatar>
          <Box flex={1} pb={1}>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="h4" fontWeight={700}>
                {store.name}
              </Typography>
              {store.isVerified && <VerifiedIcon color="primary" />}
            </Box>
            <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
              <Box display="flex" alignItems="center" gap={0.5}>
                <Rating value={store.ratingAverage} precision={0.5} size="small" readOnly />
                <Typography variant="body2" color="text.secondary">
                  ({store.ratingCount} değerlendirme)
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={0.5}>
                <PeopleIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {store.followersCount} takipçi
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={0.5}>
                <InventoryIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {store.productsCount} ürün
                </Typography>
              </Box>
            </Box>
          </Box>
          <Box display="flex" gap={1}>
            <Button variant="contained" size="small">
              Takip Et
            </Button>
            <IconButton size="small">
              <ShareIcon />
            </IconButton>
          </Box>
        </Box>

        {store.address && (
          <Box display="flex" alignItems="center" gap={0.5} mb={1}>
            <LocationOnIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {store.address}
            </Typography>
          </Box>
        )}

        <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
          {store.categories?.map((cat: string) => (
            <Chip key={cat} label={cat} size="small" variant="outlined" />
          ))}
        </Box>

        {store.description && (
          <Typography variant="body2" color="text.secondary" mb={3}>
            {store.description}
          </Typography>
        )}
      </Box>

      {/* Tabs */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label={`Ürünler (${products.length})`} />
        <Tab label="Hakkında" />
      </Tabs>

      {/* Products Tab */}
      {tab === 0 && (
        <Grid container spacing={2}>
          {products.length === 0 ? (
            <Grid item xs={12}>
              <Typography textAlign="center" color="text.secondary" py={4}>
                Henüz ürün eklenmemiş
              </Typography>
            </Grid>
          ) : (
            products.map((product) => {
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
                      <IconButton size="small" color="primary" aria-label="sepete ekle" sx={{ ml: 'auto' }}>
                        <AddShoppingCartIcon fontSize="small" />
                      </IconButton>
                    </CardActions>
                  </Card>
                </Grid>
              );
            })
          )}
        </Grid>
      )}

      {/* About Tab */}
      {tab === 1 && (
        <Box>
          <Typography variant="h6" fontWeight={600} mb={1}>
            Mağaza Hakkında
          </Typography>
          <Typography variant="body1" mb={3}>
            {store.description || 'Açıklama bulunmuyor.'}
          </Typography>

          {store.address && (
            <Box mb={2}>
              <Typography variant="subtitle2" fontWeight={600} mb={0.5}>
                Adres
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {store.address}
              </Typography>
            </Box>
          )}

          {store.contactInfo && Object.keys(store.contactInfo).length > 0 && (
            <Box mb={2}>
              <Typography variant="subtitle2" fontWeight={600} mb={0.5}>
                İletişim
              </Typography>
              {Object.entries(store.contactInfo).map(([key, value]) => (
                <Typography key={key} variant="body2" color="text.secondary">
                  {key}: {value}
                </Typography>
              ))}
            </Box>
          )}

          {store.openingHours && Object.keys(store.openingHours).length > 0 && (
            <Box mb={2}>
              <Typography variant="subtitle2" fontWeight={600} mb={0.5}>
                Çalışma Saatleri
              </Typography>
              {Object.entries(store.openingHours).map(([day, hours]) => (
                <Typography key={day} variant="body2" color="text.secondary">
                  {day}: {hours}
                </Typography>
              ))}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
