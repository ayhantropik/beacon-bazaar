import { useState } from 'react';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import TimelineIcon from '@mui/icons-material/Timeline';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Rating from '@mui/material/Rating';
import Popover from '@mui/material/Popover';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import type { Product } from '@beacon-bazaar/shared';
import { useAppSelector, useAppDispatch } from '@store/hooks';
import { selectIsFavorite, toggleFavorite } from '@store/slices/favoriteSlice';
import apiClient from '@services/api/client';

interface PriceHistoryEntry {
  date: string;
  price: number;
  salePrice?: number;
}

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  onClick?: (product: Product) => void;
}

export default function ProductCard({
  product,
  onAddToCart,
  onClick,
}: ProductCardProps) {
  const dispatch = useAppDispatch();
  const isFavorite = useAppSelector(selectIsFavorite(product.id));
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const hasDiscount = product.salePrice && product.salePrice < product.price;

  // Price history popover state
  const [priceAnchor, setPriceAnchor] = useState<HTMLElement | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceHistoryEntry[]>([]);
  const [priceLoading, setPriceLoading] = useState(false);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (isAuthenticated) {
      dispatch(toggleFavorite(product.id));
    }
  };

  const handlePriceHistoryClick = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    e.preventDefault();
    setPriceAnchor(e.currentTarget);
    setPriceLoading(true);
    apiClient.get(`/products/${product.id}/price-history`)
      .then((res) => {
        const data = res.data?.data || res.data || [];
        setPriceHistory(Array.isArray(data) ? data : []);
      })
      .catch(() => setPriceHistory([]))
      .finally(() => setPriceLoading(false));
  };

  const currentPrice = hasDiscount ? Number(product.salePrice) : Number(product.price);

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 25px rgba(0,0,0,0.12)',
        },
        '&:hover .product-card-img': {
          transform: 'scale(1.08)',
        },
      }}
      onClick={() => onClick?.(product)}
    >
      <Box sx={{ position: 'relative', overflow: 'hidden', borderRadius: '4px 4px 0 0' }}>
        <CardMedia
          className="product-card-img"
          component="img"
          height="200"
          image={product.thumbnail}
          alt={product.name}
          sx={{
            objectFit: 'cover',
            transition: 'transform 0.4s ease',
          }}
        />
        {hasDiscount && (
          <Chip
            label={`%${Math.round(((product.price - product.salePrice!) / product.price) * 100)}`}
            color="error"
            size="small"
            sx={{ position: 'absolute', top: 8, right: 8, fontWeight: 700 }}
          />
        )}
      </Box>
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography gutterBottom variant="body2" color="text.secondary" noWrap>
          {product.categories[0]}
        </Typography>
        <Typography variant="subtitle1" component="h3" noWrap fontWeight={600}>
          {product.name}
        </Typography>
        <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
          <Rating value={product.rating.average} precision={0.5} size="small" readOnly />
          <Typography variant="caption" color="text.secondary">
            ({product.rating.count})
          </Typography>
        </Box>
        <Box display="flex" alignItems="baseline" gap={1} mt={1}>
          <Typography variant="h6" color="primary" fontWeight={700}>
            {(hasDiscount ? product.salePrice : product.price)?.toLocaleString('tr-TR')} {product.currency}
          </Typography>
          {hasDiscount && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ textDecoration: 'line-through' }}
            >
              {product.price.toLocaleString('tr-TR')}
            </Typography>
          )}
        </Box>
      </CardContent>
      <CardActions disableSpacing sx={{ pt: 0 }}>
        <Tooltip title={isFavorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}>
          <IconButton
            aria-label="favorilere ekle"
            onClick={handleFavoriteClick}
            color={isFavorite ? 'error' : 'default'}
          >
            {isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
          </IconButton>
        </Tooltip>
        <Tooltip title="Fiyat geçmişi">
          <IconButton
            aria-label="fiyat geçmişi"
            onClick={handlePriceHistoryClick}
            size="small"
            sx={{ color: 'text.secondary' }}
          >
            <TimelineIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <IconButton
          aria-label="sepete ekle"
          color="primary"
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart?.(product);
          }}
          sx={{ marginLeft: 'auto' }}
        >
          <AddShoppingCartIcon />
        </IconButton>
      </CardActions>

      {/* Fiyat Geçmişi Popover */}
      <Popover
        open={Boolean(priceAnchor)}
        anchorEl={priceAnchor}
        onClose={(e: any) => { e?.stopPropagation?.(); setPriceAnchor(null); }}
        onClick={(e) => e.stopPropagation()}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        slotProps={{ paper: { sx: { p: 2, minWidth: 220, maxWidth: 300, borderRadius: 2 } } }}
      >
        <Typography variant="subtitle2" fontWeight={700} gutterBottom>
          Fiyat Geçmişi
        </Typography>
        {priceLoading ? (
          <Box display="flex" justifyContent="center" py={2}><CircularProgress size={24} /></Box>
        ) : priceHistory.length === 0 ? (
          <Box>
            <Typography variant="body2" color="text.secondary" mb={1}>
              Kayıtlı fiyat geçmişi yok.
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" fontWeight={600}>Güncel Fiyat</Typography>
              <Typography variant="caption" fontWeight={700} color="primary.main">
                {currentPrice.toLocaleString('tr-TR')} ₺
              </Typography>
            </Box>
          </Box>
        ) : (
          <Box>
            {priceHistory.slice(0, 8).map((entry, i) => {
              const entryPrice = entry.salePrice || entry.price;
              const isLower = entryPrice < currentPrice;
              const isHigher = entryPrice > currentPrice;
              return (
                <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(entry.date).toLocaleDateString('tr-TR')}
                  </Typography>
                  <Typography variant="caption" fontWeight={600} color={isLower ? 'success.main' : isHigher ? 'error.main' : 'text.primary'}>
                    {entryPrice.toLocaleString('tr-TR')} ₺
                    {isLower ? ' ↓' : isHigher ? ' ↑' : ''}
                  </Typography>
                </Box>
              );
            })}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, mt: 0.5 }}>
              <Typography variant="caption" fontWeight={700}>Şu an</Typography>
              <Typography variant="caption" fontWeight={700} color="primary.main">
                {currentPrice.toLocaleString('tr-TR')} ₺
              </Typography>
            </Box>
          </Box>
        )}
      </Popover>
    </Card>
  );
}
