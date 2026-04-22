import { useState, useEffect, useRef, useMemo } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import Divider from '@mui/material/Divider';
import CloseIcon from '@mui/icons-material/Close';
import StorefrontIcon from '@mui/icons-material/Storefront';
import VerifiedIcon from '@mui/icons-material/Verified';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import StarIcon from '@mui/icons-material/Star';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { useAppDispatch } from '@store/hooks';
import { addItem } from '@store/slices/cartSlice';
import apiClient from '@services/api/client';

interface StoreMapItem {
  id: string;
  name: string;
  slug: string;
  logo: string;
  categories: string[];
  ratingAverage: number;
  ratingCount: number;
  isVerified: boolean;
  contactInfo: Record<string, string>;
  address?: { street?: string; district?: string; city?: string; country?: string };
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  salePrice: number | null;
  thumbnail: string;
  categories: string[];
  stockQuantity: number;
  ratingAverage: number;
  ratingCount: number;
}

interface StoreProductsPanelProps {
  store: StoreMapItem;
  highlightProductId?: string | null;
  onClose: () => void;
}

export default function StoreProductsPanel({ store, highlightProductId, onClose }: StoreProductsPanelProps) {
  const dispatch = useAppDispatch();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);

  const highlightRef = useRef<HTMLDivElement>(null);
  const productCategories = [...new Set(products.flatMap((p) => p.categories || []))];
  const filteredProducts = useMemo(() => {
    const filtered = selectedCat
      ? products.filter((p) => p.categories?.includes(selectedCat))
      : [...products];
    // Highlighted product always first
    if (highlightProductId) {
      const idx = filtered.findIndex((p) => p.id === highlightProductId);
      if (idx > 0) {
        const [item] = filtered.splice(idx, 1);
        filtered.unshift(item);
      }
    }
    return filtered;
  }, [products, selectedCat, highlightProductId]);

  // Scroll to highlighted product
  useEffect(() => {
    if (highlightProductId && highlightRef.current && !loading) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [highlightProductId, loading, products]);

  useEffect(() => {
    setLoading(true);
    const fetchProducts = async () => {
      try {
        const res = await apiClient.get(`/stores/${store.id}/products?limit=50`);
        const data: Product[] = res.data?.data || res.data || [];

        // Seçilen ürün listede yoksa ayrıca çek ve başa ekle
        if (highlightProductId && !data.find(p => p.id === highlightProductId)) {
          try {
            const pRes = await apiClient.get(`/products/${highlightProductId}`);
            const pData = pRes.data?.data || pRes.data;
            if (pData) data.unshift(pData);
          } catch { /* ürün bulunamadı, devam et */ }
        }

        setProducts(data);
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [store.id, highlightProductId]);

  const handleAddToCart = (product: Product) => {
    dispatch(
      addItem({
        id: `cart-${product.id}-${Date.now()}`,
        productId: product.id,
        storeId: store.id,
        name: product.name,
        thumbnail: product.thumbnail || '',
        price: product.salePrice || product.price,
        quantity: 1,
      }),
    );
  };

  return (
    <Paper
      elevation={6}
      sx={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: { xs: '100%', sm: 380 },
        height: '100%',
        zIndex: 1001,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: { xs: 0, sm: '12px 0 0 12px' },
        overflow: 'hidden',
      }}
    >
      {/* Store header */}
      <Box
        sx={{
          p: 2,
          background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
          color: 'white',
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box display="flex" gap={1.5} alignItems="center" flex={1}>
            <Avatar src={store.logo} sx={{ width: 44, height: 44, border: '2px solid rgba(255,255,255,0.3)' }}>
              <StorefrontIcon />
            </Avatar>
            <Box flex={1}>
              <Box display="flex" alignItems="center" gap={0.5}>
                <Typography variant="subtitle1" fontWeight={700} noWrap>
                  {store.name}
                </Typography>
                {store.isVerified && <VerifiedIcon sx={{ fontSize: 16, color: '#93c5fd' }} />}
              </Box>
              <Box display="flex" alignItems="center" gap={0.5}>
                <StarIcon sx={{ fontSize: 14, color: '#fbbf24' }} />
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  {store.ratingAverage} ({store.ratingCount} değerlendirme)
                </Typography>
              </Box>
              {store.address && (store.address.street || store.address.district) && (
                <Box display="flex" alignItems="center" gap={0.3} mt={0.3}>
                  <LocationOnIcon sx={{ fontSize: 13, opacity: 0.7 }} />
                  <Typography variant="caption" sx={{ opacity: 0.75, fontSize: '0.7rem' }} noWrap>
                    {[store.address.street, store.address.district, store.address.city].filter(Boolean).join(', ')}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
          <IconButton
            size="small"
            onClick={onClose}
            sx={{
              color: 'white',
              bgcolor: 'rgba(255,255,255,0.2)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.35)' },
              width: 32,
              height: 32,
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        <Box display="flex" flexWrap="wrap" gap={0.5} mt={1}>
          {store.categories?.slice(0, 4).map((cat) => (
            <Chip
              key={cat}
              label={cat}
              size="small"
              sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', fontSize: 11, height: 22 }}
            />
          ))}
        </Box>
      </Box>

      {/* Products header + category filter */}
      <Box sx={{ px: 2, py: 1, bgcolor: 'grey.50' }}>
        <Typography variant="body2" fontWeight={600} color="text.secondary" mb={productCategories.length > 1 ? 0.5 : 0}>
          Ürünler {!loading && `(${filteredProducts.length})`}
        </Typography>
        {productCategories.length > 1 && (
          <Box display="flex" gap={0.5} flexWrap="wrap">
            <Chip label="Tümü" size="small" sx={{ height: 22, fontSize: 11 }}
              color={selectedCat === null ? 'primary' : 'default'}
              variant={selectedCat === null ? 'filled' : 'outlined'}
              onClick={() => setSelectedCat(null)} />
            {productCategories.map((cat) => (
              <Chip key={cat} label={cat} size="small" sx={{ height: 22, fontSize: 11 }}
                color={selectedCat === cat ? 'primary' : 'default'}
                variant={selectedCat === cat ? 'filled' : 'outlined'}
                onClick={() => setSelectedCat(cat)} />
            ))}
          </Box>
        )}
      </Box>
      <Divider />

      {/* Products list */}
      <Box sx={{ flex: 1, overflow: 'auto', px: 1.5, py: 1 }}>
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Box key={i} display="flex" gap={1.5} p={1} mb={1}>
              <Skeleton variant="rounded" width={72} height={72} />
              <Box flex={1}>
                <Skeleton width="80%" height={20} />
                <Skeleton width="50%" height={16} sx={{ mt: 0.5 }} />
                <Skeleton width="40%" height={20} sx={{ mt: 0.5 }} />
              </Box>
            </Box>
          ))
        ) : products.length === 0 ? (
          <Box textAlign="center" py={4}>
            <Typography variant="body2" color="text.secondary">
              Bu mağazada henüz ürün bulunmuyor.
            </Typography>
          </Box>
        ) : (
          filteredProducts.map((product) => (
            <Paper
              key={product.id}
              ref={highlightProductId === product.id ? highlightRef : undefined}
              variant="outlined"
              sx={{
                display: 'flex',
                gap: 1.5,
                p: 1.5,
                mb: 1,
                borderRadius: 2,
                transition: 'all 0.15s',
                ...(highlightProductId === product.id && {
                borderColor: 'primary.main',
                borderWidth: 2,
                bgcolor: '#e3f2fd',
                boxShadow: '0 0 0 3px rgba(37,99,235,0.25), 0 4px 12px rgba(37,99,235,0.15)',
                position: 'relative',
              }),
                '&:hover': { bgcolor: 'action.hover', borderColor: 'primary.main' },
              }}
            >
              {highlightProductId === product.id && (
                <Chip
                  label="Seçilen Ürün"
                  color="primary"
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: -10,
                    left: 12,
                    height: 20,
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                />
              )}
              <Box
                component="img"
                src={product.thumbnail}
                alt={product.name}
                sx={{
                  width: 72,
                  height: 72,
                  borderRadius: 1.5,
                  objectFit: 'cover',
                  flexShrink: 0,
                  bgcolor: 'grey.100',
                }}
                onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                  e.currentTarget.src = 'https://via.placeholder.com/72?text=Ürün';
                }}
              />
              <Box flex={1} minWidth={0}>
                <Typography variant="body2" fontWeight={600} noWrap>
                  {product.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.3 }}>
                  {product.description}
                </Typography>
                <Box display="flex" alignItems="center" justifyContent="space-between" mt={0.5}>
                  <Box>
                    {product.salePrice ? (
                      <>
                        <Typography
                          variant="caption"
                          sx={{ textDecoration: 'line-through', color: 'text.disabled', mr: 0.5 }}
                        >
                          {Number(product.price).toFixed(2)} ₺
                        </Typography>
                        <Typography variant="body2" fontWeight={700} color="error.main" component="span">
                          {Number(product.salePrice).toFixed(2)} ₺
                        </Typography>
                      </>
                    ) : (
                      <Typography variant="body2" fontWeight={700} color="primary.main">
                        {Number(product.price).toFixed(2)} ₺
                      </Typography>
                    )}
                  </Box>
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => handleAddToCart(product)}
                    sx={{
                      bgcolor: 'primary.main',
                      color: 'white',
                      width: 30,
                      height: 30,
                      '&:hover': { bgcolor: 'primary.dark' },
                    }}
                  >
                    <AddShoppingCartIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
              </Box>
            </Paper>
          ))
        )}
      </Box>
    </Paper>
  );
}
