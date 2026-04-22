import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
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
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import TextField from '@mui/material/TextField';
import Divider from '@mui/material/Divider';
import LinearProgress from '@mui/material/LinearProgress';
import Tooltip from '@mui/material/Tooltip';
import StorefrontIcon from '@mui/icons-material/Storefront';
import VerifiedIcon from '@mui/icons-material/Verified';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PeopleIcon from '@mui/icons-material/People';
import InventoryIcon from '@mui/icons-material/Inventory';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteFilledIcon from '@mui/icons-material/Favorite';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import TimelineIcon from '@mui/icons-material/Timeline';
import ShareIcon from '@mui/icons-material/Share';
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import apiClient from '@services/api/client';
import { storeService } from '@services/api/store.service';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { addItem } from '@store/slices/cartSlice';
import { toggleFavorite } from '@store/slices/favoriteSlice';
import Popover from '@mui/material/Popover';
import CircularProgress from '@mui/material/CircularProgress';

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
  address: string | Record<string, string>;
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

interface ReviewData {
  id: string;
  rating: number;
  descriptionAccuracy: number;
  returnEase: number;
  imageMatch: number;
  deliveryConsistency: number;
  qaSpeed: number;
  problemResolution: number;
  comment: string | null;
  createdAt: string;
  user: { id: string; name: string; surname: string; avatar: string | null };
}

const CRITERIA = [
  { key: 'descriptionAccuracy', label: 'Açıklama Doğruluğu' },
  { key: 'returnEase', label: 'İade Kolaylığı' },
  { key: 'imageMatch', label: 'Ürün-Görsel Uyumu' },
  { key: 'deliveryConsistency', label: 'Teslimat Tutarlılığı' },
  { key: 'qaSpeed', label: 'Soru-Cevap Hızı' },
  { key: 'problemResolution', label: 'Sorun Çözme Başarısı' },
] as const;

function formatAddress(addr: string | Record<string, string> | undefined): string {
  if (!addr) return '';
  if (typeof addr === 'string') return addr;
  return [addr.street, addr.district, addr.city].filter(Boolean).join(', ');
}

export default function StoreDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);
  const isLoggedIn = auth.isAuthenticated;
  const currentUserId = auth.user?.id;

  const [store, setStore] = useState<StoreDetail | null>(null);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const initialTab = searchParams.get('tab') === 'reviews' ? 2 : 0;
  const [tab, setTab] = useState(initialTab);
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState('');
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const favoriteIds = useAppSelector((state) => state.favorites.ids);
  const [priceAnchor, setPriceAnchor] = useState<{ el: HTMLElement; productId: string } | null>(null);
  const [priceHistory, setPriceHistory] = useState<Array<{ date: string; price: number; salePrice?: number }>>([]);
  const [priceLoading, setPriceLoading] = useState(false);

  // Review permission
  const [canReview, setCanReview] = useState(false);
  const [reviewPermReason, setReviewPermReason] = useState('');

  // Review form state — 6 criteria
  const [reviewCriteria, setReviewCriteria] = useState<Record<string, number | null>>({
    descriptionAccuracy: null, returnEase: null, imageMatch: null,
    deliveryConsistency: null, qaSpeed: null, problemResolution: null,
  });
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const allCriteriaFilled = CRITERIA.every((c) => reviewCriteria[c.key] !== null && reviewCriteria[c.key]! > 0);

  const productCategories = [...new Set(products.flatMap((p) => p.categories || []))];
  const filteredProducts = selectedCategory
    ? products.filter((p) => p.categories?.includes(selectedCategory))
    : products;

  const userHasReview = reviews.some((r) => r.user.id === currentUserId);

  useEffect(() => {
    async function fetchStore() {
      try {
        const res = await apiClient.get(`/stores/${slug}`);
        const data = res.data?.data || res.data;
        setStore(data);

        const prodRes = await apiClient.get(`/stores/${data.id}/products`);
        setProducts(prodRes.data?.data || prodRes.data || []);

        try {
          const revRes = await storeService.getReviews(data.id);
          setReviews(revRes.data || []);
          setReviewsTotal(revRes.pagination?.total || revRes.data?.length || 0);
        } catch { /* */ }

        if (isLoggedIn) {
          try {
            const followRes = await storeService.checkFollow(data.id);
            setFollowing(followRes.followed);
          } catch { /* */ }

          try {
            const canRes = await storeService.canReview(data.id);
            const d = canRes.data;
            setCanReview(d.canReview);
            if (d.alreadyReviewed) setReviewPermReason('Bu mağazayı zaten değerlendirdiniz.');
            else if (!d.hasDeliveredOrder) setReviewPermReason('Değerlendirme yapabilmek için bu mağazadan teslim alınmış bir siparişiniz olmalıdır.');
          } catch { /* */ }
        }
      } catch (err) {
        console.log('Mağaza yüklenemedi', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStore();
  }, [slug, isLoggedIn]);

  const handleToggleFollow = async () => {
    if (!store || !isLoggedIn) return;
    setFollowLoading(true);
    try {
      const res = await storeService.toggleFollow(store.id);
      setFollowing(res.followed);
      setStore((s) => s ? { ...s, followersCount: s.followersCount + (res.followed ? 1 : -1) } : s);
    } catch { /* */ }
    setFollowLoading(false);
  };

  const handleSubmitReview = async () => {
    if (!store || !allCriteriaFilled) return;
    setReviewSubmitting(true);
    try {
      await storeService.createReview(store.id, {
        descriptionAccuracy: reviewCriteria.descriptionAccuracy!,
        returnEase: reviewCriteria.returnEase!,
        imageMatch: reviewCriteria.imageMatch!,
        deliveryConsistency: reviewCriteria.deliveryConsistency!,
        qaSpeed: reviewCriteria.qaSpeed!,
        problemResolution: reviewCriteria.problemResolution!,
        comment: reviewComment.trim() || undefined,
      });
      const revRes = await storeService.getReviews(store.id);
      setReviews(revRes.data || []);
      setReviewsTotal(revRes.pagination?.total || revRes.data?.length || 0);
      setReviewCriteria({
        descriptionAccuracy: null, returnEase: null, imageMatch: null,
        deliveryConsistency: null, qaSpeed: null, problemResolution: null,
      });
      setReviewComment('');
      setCanReview(false);
      setSnackMsg('Değerlendirmeniz eklendi!');
      setSnackOpen(true);
      const storeRes = await apiClient.get(`/stores/${store.id}`);
      const updated = storeRes.data?.data || storeRes.data;
      setStore((s) => s ? { ...s, ratingAverage: updated.ratingAverage, ratingCount: updated.ratingCount } : s);
    } catch (err: any) {
      setSnackMsg(err.response?.data?.message || 'Değerlendirme eklenemedi');
      setSnackOpen(true);
    }
    setReviewSubmitting(false);
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!store) return;
    try {
      await storeService.deleteReview(store.id, reviewId);
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      setReviewsTotal((t) => t - 1);
      setSnackMsg('Değerlendirmeniz silindi');
      setSnackOpen(true);
      const storeRes = await apiClient.get(`/stores/${store.id}`);
      const updated = storeRes.data?.data || storeRes.data;
      setStore((s) => s ? { ...s, ratingAverage: updated.ratingAverage, ratingCount: updated.ratingCount } : s);
    } catch { /* */ }
  };

  // Ortalama kriter puanlarını hesapla
  const criteriaAverages = CRITERIA.map((c) => {
    const vals = reviews.map((r) => (r as any)[c.key]).filter((v) => v > 0);
    return { ...c, avg: vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0 };
  });

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
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 1, fontWeight: 600 }}>
        Geri
      </Button>

      {/* Cover */}
      <Box
        sx={{
          height: { xs: 180, md: 280 },
          borderRadius: 3,
          overflow: 'hidden',
          mb: -6,
          position: 'relative',
          background: `url(${store.coverImage || 'https://via.placeholder.com/1200x300'}) center/cover`,
        }}
      />

      {/* Store Info */}
      <Box sx={{ px: { xs: 2, md: 4 }, position: 'relative' }}>
        <Box display="flex" alignItems="flex-end" gap={2} mb={2}>
          <Avatar
            src={store.logo}
            sx={{ width: 96, height: 96, border: '4px solid white', boxShadow: 2, bgcolor: 'grey.200' }}
          >
            <StorefrontIcon sx={{ fontSize: 48 }} />
          </Avatar>
          <Box flex={1} pb={1}>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="h4" fontWeight={700}>{store.name}</Typography>
              {store.isVerified && <VerifiedIcon color="primary" />}
            </Box>
            <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
              <Box display="flex" alignItems="center" gap={0.5}>
                <Rating value={store.ratingAverage} precision={0.5} size="small" readOnly />
                <Typography variant="body2" color="text.secondary">({store.ratingCount} değerlendirme)</Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={0.5}>
                <PeopleIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">{store.followersCount} takipçi</Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={0.5}>
                <InventoryIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">{store.productsCount} ürün</Typography>
              </Box>
            </Box>
          </Box>
          <Box display="flex" gap={1}>
            <Button variant={following ? 'outlined' : 'contained'} size="small" onClick={handleToggleFollow} disabled={followLoading || !isLoggedIn}>
              {following ? 'Takip Ediliyor' : 'Takip Et'}
            </Button>
            <IconButton size="small"><ShareIcon /></IconButton>
          </Box>
        </Box>

        {formatAddress(store.address) && (
          <Box display="flex" alignItems="center" gap={0.5} mb={1}>
            <LocationOnIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">{formatAddress(store.address)}</Typography>
          </Box>
        )}

        <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
          {store.categories?.map((cat: string) => (
            <Chip key={cat} label={cat} size="small" variant="outlined" />
          ))}
        </Box>

        {store.description && (
          <Typography variant="body2" color="text.secondary" mb={3}>{store.description}</Typography>
        )}
      </Box>

      {/* Tabs */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label={`Ürünler (${products.length})`} />
        <Tab label="Hakkında" />
        <Tab label={`Değerlendirmeler (${reviewsTotal})`} />
      </Tabs>

      {/* Products Tab */}
      {tab === 0 && (
        <>
        {productCategories.length > 1 && (
          <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
            <Chip label="Tümü" color={selectedCategory === null ? 'primary' : 'default'} variant={selectedCategory === null ? 'filled' : 'outlined'} onClick={() => setSelectedCategory(null)} size="small" />
            {productCategories.map((cat) => (
              <Chip key={cat} label={cat} color={selectedCategory === cat ? 'primary' : 'default'} variant={selectedCategory === cat ? 'filled' : 'outlined'} onClick={() => setSelectedCategory(cat)} size="small" />
            ))}
          </Box>
        )}
        <Grid container spacing={2}>
          {filteredProducts.length === 0 ? (
            <Grid item xs={12}>
              <Typography textAlign="center" color="text.secondary" py={4}>Henüz ürün eklenmemiş</Typography>
            </Grid>
          ) : (
            filteredProducts.map((product) => {
              const hasDiscount = product.salePrice && product.salePrice < product.price;
              return (
                <Grid item xs={6} sm={4} md={3} key={product.id}>
                  <Card
                    sx={{ height: '100%', display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'all 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 } }}
                    onClick={() => navigate(`/product/${product.slug}`)}
                  >
                    <Box sx={{ position: 'relative', paddingTop: '100%', overflow: 'hidden' }}>
                      <CardMedia component="img" image={product.thumbnail || 'https://via.placeholder.com/300x300'} alt={product.name} sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                      {hasDiscount && (
                        <Chip label={`%${Math.round(((product.price - product.salePrice!) / product.price) * 100)}`} color="error" size="small" sx={{ position: 'absolute', top: 8, right: 8 }} />
                      )}
                    </Box>
                    <CardContent sx={{ flexGrow: 1, pb: 0 }}>
                      <Typography variant="caption" color="text.secondary">{product.categories?.[0]}</Typography>
                      <Typography variant="subtitle2" fontWeight={600} noWrap>{product.name}</Typography>
                      <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                        <Rating value={product.ratingAverage} precision={0.5} size="small" readOnly />
                        <Typography variant="caption" color="text.secondary">({product.ratingCount})</Typography>
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
                            if (isLoggedIn) dispatch(toggleFavorite(product.id));
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
                        size="small" color="primary" aria-label="sepete ekle" sx={{ ml: 'auto' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          const price = hasDiscount ? Number(product.salePrice) : Number(product.price);
                          dispatch(addItem({ id: product.id, productId: product.id, storeId: store?.id || '', name: product.name, thumbnail: product.thumbnail, price, quantity: 1 }));
                          setSnackMsg('Ürün sepete eklendi!');
                          setSnackOpen(true);
                        }}
                      >
                        <AddShoppingCartIcon fontSize="small" />
                      </IconButton>
                    </CardActions>
                  </Card>
                </Grid>
              );
            })
          )}
        </Grid>
        </>
      )}

      {/* About Tab */}
      {tab === 1 && (
        <Box>
          <Typography variant="h6" fontWeight={600} mb={1}>Mağaza Hakkında</Typography>
          <Typography variant="body1" mb={3}>{store.description || 'Açıklama bulunmuyor.'}</Typography>

          {formatAddress(store.address) && (
            <Box mb={2}>
              <Typography variant="subtitle2" fontWeight={600} mb={0.5}>Adres</Typography>
              <Typography variant="body2" color="text.secondary">{formatAddress(store.address)}</Typography>
            </Box>
          )}

          {store.contactInfo && Object.keys(store.contactInfo).length > 0 && (
            <Box mb={2}>
              <Typography variant="subtitle2" fontWeight={600} mb={0.5}>İletişim</Typography>
              {Object.entries(store.contactInfo).map(([key, value]) => (
                <Typography key={key} variant="body2" color="text.secondary">{key}: {value}</Typography>
              ))}
            </Box>
          )}

          {store.openingHours && Object.keys(store.openingHours).length > 0 && (
            <Box mb={2}>
              <Typography variant="subtitle2" fontWeight={600} mb={0.5}>Çalışma Saatleri</Typography>
              {Object.entries(store.openingHours).map(([day, hours]) => (
                <Typography key={day} variant="body2" color="text.secondary">{day}: {hours}</Typography>
              ))}
            </Box>
          )}
        </Box>
      )}

      {/* Reviews Tab */}
      {tab === 2 && (
        <Box>
          {/* Criteria Averages Summary */}
          {reviews.length > 0 && (
            <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="subtitle1" fontWeight={600} mb={1.5}>Puan Dağılımı</Typography>
              <Grid container spacing={1}>
                {criteriaAverages.map((c) => (
                  <Grid item xs={6} sm={4} key={c.key}>
                    <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                      <Typography variant="caption" color="text.secondary" sx={{ minWidth: 130 }}>{c.label}</Typography>
                      <Box flex={1}>
                        <LinearProgress
                          variant="determinate"
                          value={(c.avg / 5) * 100}
                          sx={{ height: 6, borderRadius: 3, bgcolor: 'grey.200', '& .MuiLinearProgress-bar': { borderRadius: 3 } }}
                        />
                      </Box>
                      <Typography variant="caption" fontWeight={700} sx={{ minWidth: 24, textAlign: 'right' }}>
                        {c.avg > 0 ? c.avg.toFixed(1) : '-'}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Review Form — 6 Criteria */}
          {isLoggedIn && canReview && !userHasReview && (
            <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="subtitle1" fontWeight={600} mb={2}>Mağazayı Değerlendirin</Typography>

              <Grid container spacing={1.5} mb={2}>
                {CRITERIA.map((c) => (
                  <Grid item xs={12} sm={6} key={c.key}>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Typography variant="body2" sx={{ minWidth: 160 }}>{c.label}</Typography>
                      <Rating
                        value={reviewCriteria[c.key]}
                        onChange={(_, v) => setReviewCriteria((prev) => ({ ...prev, [c.key]: v }))}
                        size="medium"
                      />
                    </Box>
                  </Grid>
                ))}
              </Grid>

              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="Deneyiminizi paylaşın (isteğe bağlı)"
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                inputProps={{ maxLength: 1000 }}
                sx={{ mb: 1 }}
              />
              <Button
                variant="contained"
                endIcon={<SendIcon />}
                onClick={handleSubmitReview}
                disabled={!allCriteriaFilled || reviewSubmitting}
              >
                Gönder
              </Button>
            </Box>
          )}

          {isLoggedIn && !canReview && !userHasReview && reviewPermReason && (
            <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">{reviewPermReason}</Typography>
            </Box>
          )}

          {!isLoggedIn && (
            <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Değerlendirme yazmak için giriş yapmanız gerekiyor.
              </Typography>
            </Box>
          )}

          {/* Reviews List */}
          {reviews.length === 0 ? (
            <Typography textAlign="center" color="text.secondary" py={4}>
              Henüz değerlendirme yapılmamış.
            </Typography>
          ) : (
            reviews.map((review) => (
              <Box key={review.id} sx={{ mb: 2 }}>
                <Box display="flex" alignItems="center" gap={1.5} mb={0.5}>
                  <Avatar src={review.user.avatar || undefined} sx={{ width: 36, height: 36 }}>
                    {review.user.name?.[0]}
                  </Avatar>
                  <Box flex={1}>
                    <Typography variant="subtitle2" fontWeight={600}>
                      {review.user.name} {review.user.surname}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Rating value={review.rating} size="small" readOnly />
                      <Typography variant="caption" color="text.secondary">
                        {new Date(review.createdAt).toLocaleDateString('tr-TR')}
                      </Typography>
                    </Box>
                  </Box>
                  {review.user.id === currentUserId && (
                    <IconButton size="small" color="error" onClick={() => handleDeleteReview(review.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>

                {/* Criteria bars for each review */}
                <Box sx={{ pl: 6, mb: 1 }}>
                  <Grid container spacing={0.5}>
                    {CRITERIA.map((c) => {
                      const val = (review as any)[c.key];
                      if (!val || val === 0) return null;
                      return (
                        <Grid item xs={6} key={c.key}>
                          <Tooltip title={`${c.label}: ${val}/5`}>
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <Typography variant="caption" color="text.secondary" sx={{ minWidth: 110, fontSize: 11 }}>{c.label}</Typography>
                              <Rating value={val} size="small" readOnly sx={{ fontSize: 14 }} />
                            </Box>
                          </Tooltip>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Box>

                {review.comment && (
                  <Typography variant="body2" color="text.secondary" sx={{ pl: 6 }}>
                    {review.comment}
                  </Typography>
                )}
                <Divider sx={{ mt: 2 }} />
              </Box>
            ))
          )}
        </Box>
      )}

      <Snackbar open={snackOpen} autoHideDuration={2000} onClose={() => setSnackOpen(false)}>
        <Alert onClose={() => setSnackOpen(false)} severity="success" variant="filled">
          {snackMsg}
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
