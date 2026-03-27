import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import FavoriteIcon from '@mui/icons-material/FavoriteBorder';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Rating from '@mui/material/Rating';
import type { Product } from '@beacon-bazaar/shared';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  onFavorite?: (product: Product) => void;
  onClick?: (product: Product) => void;
}

export default function ProductCard({
  product,
  onAddToCart,
  onFavorite,
  onClick,
}: ProductCardProps) {
  const hasDiscount = product.salePrice && product.salePrice < product.price;

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
      }}
      onClick={() => onClick?.(product)}
    >
      <Box sx={{ position: 'relative' }}>
        <CardMedia
          component="img"
          height="200"
          image={product.thumbnail}
          alt={product.name}
          sx={{ objectFit: 'cover' }}
        />
        {hasDiscount && (
          <Chip
            label={`%${Math.round(((product.price - product.salePrice!) / product.price) * 100)} İndirim`}
            color="error"
            size="small"
            sx={{ position: 'absolute', top: 8, right: 8 }}
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
      <CardActions disableSpacing>
        <IconButton
          aria-label="favorilere ekle"
          onClick={(e) => {
            e.stopPropagation();
            onFavorite?.(product);
          }}
        >
          <FavoriteIcon />
        </IconButton>
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
    </Card>
  );
}
