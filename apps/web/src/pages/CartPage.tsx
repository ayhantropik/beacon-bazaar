import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { removeItem, updateQuantity, clearCart, selectCartItems, selectCartTotal } from '@store/slices/cartSlice';

export default function CartPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const items = useAppSelector(selectCartItems);
  const total = useAppSelector(selectCartTotal);

  if (items.length === 0) {
    return (
      <Box textAlign="center" py={8}>
        <ShoppingCartIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h5" fontWeight={600} mb={1}>
          Sepetiniz boş
        </Typography>
        <Typography variant="body1" color="text.secondary" mb={3}>
          Alışverişe başlamak için ürünleri sepetinize ekleyin
        </Typography>
        <Button variant="contained" size="large" onClick={() => navigate('/')}>
          Alışverişe Başla
        </Button>
      </Box>
    );
  }

  const deliveryFee = total >= 500 ? 0 : 39.90;
  const grandTotal = total + deliveryFee;

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h5" fontWeight={700}>
          Sepetim ({items.length} ürün)
        </Typography>
        <Button variant="text" color="error" size="small" onClick={() => dispatch(clearCart())}>
          Sepeti Temizle
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Cart Items */}
        <Grid item xs={12} md={8}>
          {items.map((item) => (
            <Card key={item.id} sx={{ display: 'flex', mb: 2, p: 2, alignItems: 'center' }}>
              <CardMedia
                component="img"
                sx={{ width: 100, height: 100, borderRadius: 2, objectFit: 'cover', cursor: 'pointer' }}
                image={item.thumbnail || 'https://via.placeholder.com/100'}
                alt={item.name}
                onClick={() => navigate(`/product/${item.productId}`)}
              />
              <Box flex={1} ml={2}>
                <Typography
                  variant="subtitle1"
                  fontWeight={600}
                  sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
                  onClick={() => navigate(`/product/${item.productId}`)}
                >
                  {item.name}
                </Typography>
                {item.variationName && (
                  <Typography variant="caption" color="text.secondary">
                    {item.variationName}
                  </Typography>
                )}
                <Typography variant="h6" color="primary" fontWeight={700} mt={0.5}>
                  {item.price.toLocaleString('tr-TR')} ₺
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <Box display="flex" alignItems="center" border={1} borderColor="divider" borderRadius={2}>
                  <IconButton
                    size="small"
                    onClick={() => dispatch(updateQuantity({ id: item.id, quantity: item.quantity - 1 }))}
                  >
                    <RemoveIcon fontSize="small" />
                  </IconButton>
                  <Typography sx={{ px: 1.5, minWidth: 28, textAlign: 'center' }}>{item.quantity}</Typography>
                  <IconButton
                    size="small"
                    onClick={() => dispatch(updateQuantity({ id: item.id, quantity: item.quantity + 1 }))}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Box>
                <Typography variant="subtitle1" fontWeight={700} sx={{ minWidth: 80, textAlign: 'right' }}>
                  {(item.price * item.quantity).toLocaleString('tr-TR')} ₺
                </Typography>
                <IconButton color="error" onClick={() => dispatch(removeItem(item.id))}>
                  <DeleteOutlineIcon />
                </IconButton>
              </Box>
            </Card>
          ))}
        </Grid>

        {/* Order Summary */}
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3, position: 'sticky', top: 80 }}>
            <Typography variant="h6" fontWeight={700} mb={2}>
              Sipariş Özeti
            </Typography>

            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography color="text.secondary">Ara Toplam</Typography>
              <Typography fontWeight={600}>{total.toLocaleString('tr-TR')} ₺</Typography>
            </Box>

            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography color="text.secondary">Kargo</Typography>
              <Typography fontWeight={600} color={deliveryFee === 0 ? 'success.main' : 'text.primary'}>
                {deliveryFee === 0 ? 'Ücretsiz' : `${deliveryFee.toLocaleString('tr-TR')} ₺`}
              </Typography>
            </Box>

            {deliveryFee > 0 && (
              <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                500 ₺ ve üzeri alışverişlerde kargo ücretsiz!
              </Typography>
            )}

            <Divider sx={{ my: 2 }} />

            <Box display="flex" justifyContent="space-between" mb={3}>
              <Typography variant="h6" fontWeight={700}>Toplam</Typography>
              <Typography variant="h6" fontWeight={700} color="primary">
                {grandTotal.toLocaleString('tr-TR')} ₺
              </Typography>
            </Box>

            <Button
              variant="contained"
              fullWidth
              size="large"
              sx={{ py: 1.5 }}
              onClick={() => navigate('/checkout')}
            >
              Siparişi Tamamla
            </Button>

            <Button
              variant="text"
              fullWidth
              sx={{ mt: 1 }}
              onClick={() => navigate('/')}
            >
              Alışverişe Devam Et
            </Button>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
