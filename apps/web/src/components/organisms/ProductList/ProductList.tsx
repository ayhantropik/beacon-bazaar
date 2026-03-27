import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Pagination from '@mui/material/Pagination';
import Skeleton from '@mui/material/Skeleton';
import ProductCard from '@components/molecules/ProductCard';
import type { Product } from '@beacon-bazaar/shared';

interface ProductListProps {
  products: Product[];
  isLoading?: boolean;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onAddToCart?: (product: Product) => void;
  onProductClick?: (product: Product) => void;
  emptyMessage?: string;
}

export default function ProductList({
  products,
  isLoading = false,
  page = 1,
  totalPages = 1,
  onPageChange,
  onAddToCart,
  onProductClick,
  emptyMessage = 'Ürün bulunamadı',
}: ProductListProps) {
  if (isLoading) {
    return (
      <Grid container spacing={3}>
        {Array.from({ length: 8 }).map((_, i) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
            <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
            <Skeleton width="80%" sx={{ mt: 1 }} />
            <Skeleton width="60%" />
            <Skeleton width="40%" />
          </Grid>
        ))}
      </Grid>
    );
  }

  if (products.length === 0) {
    return (
      <Box textAlign="center" py={8}>
        <Typography variant="h6" color="text.secondary">{emptyMessage}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Grid container spacing={3}>
        {products.map((product) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
            <ProductCard
              product={product}
              onAddToCart={onAddToCart}
              onClick={onProductClick}
            />
          </Grid>
        ))}
      </Grid>

      {totalPages > 1 && onPageChange && (
        <Box display="flex" justifyContent="center" mt={4}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, p) => onPageChange(p)}
            color="primary"
            size="large"
          />
        </Box>
      )}
    </Box>
  );
}
