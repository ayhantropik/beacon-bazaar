/**
 * ─── StorePanel ──────────────────────────────────────────────
 *
 * Mağaza tıklandığında sağ tarafta açılan panel.
 * DB'den mağaza bilgilerini ve ürünlerini çeker.
 * Bulunamazsa sadece mağaza adını gösterir.
 */
import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Skeleton from '@mui/material/Skeleton';
import Divider from '@mui/material/Divider';
import CloseIcon from '@mui/icons-material/Close';
import StorefrontIcon from '@mui/icons-material/Storefront';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import apiClient from '@services/api/client';
import { useAppDispatch } from '@store/hooks';
import { addItem } from '@store/slices/cartSlice';

interface StorePanelProps {
  /** Tıklanan mağazanın adı */
  storeName: string;
  /** Mağaza kategorisi */
  storeType: string;
  /** Kapatma fonksiyonu */
  onClose: () => void;
}

interface Product {
  id: string;
  name: string;
  price: number;
  salePrice: number | null;
  thumbnail: string;
  slug: string;
}

export default function StorePanel({ storeName, storeType, onClose }: StorePanelProps) {
  const dispatch = useAppDispatch();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // DB'den mağaza ve ürünlerini çek
  useEffect(() => {
    setLoading(true);
    apiClient.get(`/stores/search?q=${encodeURIComponent(storeName)}&limit=1`)
      .then(async (res) => {
        const stores = res.data?.data || res.data || [];
        if (stores.length > 0) {
          const store = stores[0];
          // Mağazanın ürünlerini çek
          try {
            const pRes = await apiClient.get(`/stores/${store.id}/products?limit=20`);
            setProducts(pRes.data?.data || pRes.data || []);
          } catch { setProducts([]); }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [storeName]);

  return (
    <Paper
      elevation={6}
      sx={{
        position: 'absolute',
        top: 0, right: 0,
        width: { xs: '100%', sm: 360 },
        height: '100%',
        zIndex: 1001,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: { xs: 0, sm: '12px 0 0 12px' },
        overflow: 'hidden',
      }}
    >
      {/* Başlık */}
      <Box sx={{ p: 2, background: 'linear-gradient(135deg, #1a6b52, #0e4a38)', color: '#fff' }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box display="flex" gap={1.5} alignItems="center" flex={1}>
            <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <StorefrontIcon />
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>{storeName}</Typography>
              <Typography variant="caption" sx={{ opacity: 0.8, textTransform: 'capitalize' }}>{storeType}</Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={onClose} sx={{ color: '#fff' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      <Divider />

      {/* Ürün listesi */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 1 }}>
        <Typography variant="subtitle2" fontWeight={700} px={1} py={0.5}>
          Ürünler ({products.length})
        </Typography>

        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" height={80} sx={{ mb: 1, mx: 1 }} />
          ))
        ) : products.length === 0 ? (
          <Box textAlign="center" py={4}>
            <StorefrontIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Bu mağaza henüz ürün eklenmemiş
            </Typography>
          </Box>
        ) : (
          products.map((product) => {
            const hasDiscount = product.salePrice && product.salePrice < product.price;
            return (
              <Box
                key={product.id}
                sx={{
                  display: 'flex', gap: 1.5, p: 1, mx: 0.5, mb: 0.5,
                  borderRadius: 2, border: '1px solid', borderColor: 'divider',
                  cursor: 'pointer', transition: 'all 0.15s',
                  '&:hover': { borderColor: 'primary.light', bgcolor: 'rgba(26,107,82,0.03)' },
                }}
              >
                {/* Ürün görseli */}
                <Box
                  component="img"
                  src={product.thumbnail || 'https://via.placeholder.com/80'}
                  sx={{ width: 64, height: 64, borderRadius: 1.5, objectFit: 'cover', flexShrink: 0 }}
                />
                {/* Ürün bilgisi */}
                <Box flex={1} minWidth={0}>
                  <Typography variant="body2" fontWeight={600} noWrap sx={{ fontSize: '0.8rem' }}>
                    {product.name}
                  </Typography>
                  <Box display="flex" alignItems="baseline" gap={0.5} mt={0.3}>
                    <Typography variant="body2" color={hasDiscount ? 'error' : 'primary'} fontWeight={700}>
                      {(hasDiscount ? product.salePrice : product.price)?.toLocaleString('tr-TR')} ₺
                    </Typography>
                    {hasDiscount && (
                      <Typography variant="caption" sx={{ textDecoration: 'line-through', color: '#999' }}>
                        {product.price.toLocaleString('tr-TR')} ₺
                      </Typography>
                    )}
                  </Box>
                </Box>
                {/* Sepete ekle */}
                <IconButton
                  size="small" color="primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch(addItem({
                      id: product.id, productId: product.id, storeId: '',
                      name: product.name, thumbnail: product.thumbnail,
                      price: hasDiscount ? Number(product.salePrice) : Number(product.price),
                      quantity: 1,
                    }));
                  }}
                  sx={{ alignSelf: 'center' }}
                >
                  <AddShoppingCartIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Box>
            );
          })
        )}
      </Box>
    </Paper>
  );
}
