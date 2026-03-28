import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as yup from 'yup';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import Alert from '@mui/material/Alert';
import Input from '@components/atoms/Input';
import { useAppSelector, useAppDispatch } from '@store/hooks';
import { selectCartItems, selectCartTotal, clearCart } from '@store/slices/cartSlice';
import apiClient from '@services/api/client';

const STEPS = ['Adres Bilgileri', 'Ödeme', 'Onay'];

const addressSchema = yup.object({
  fullName: yup.string().required('Ad soyad gerekli'),
  phone: yup.string().required('Telefon gerekli').min(10, 'Geçerli bir telefon girin'),
  city: yup.string().required('Şehir gerekli'),
  district: yup.string().required('İlçe gerekli'),
  address: yup.string().required('Adres gerekli').min(10, 'Detaylı adres girin'),
  postalCode: yup.string().required('Posta kodu gerekli'),
});

export default function CheckoutPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectCartItems);
  const subtotal = useAppSelector(selectCartTotal);
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const [activeStep, setActiveStep] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState('');

  const deliveryFee = subtotal >= 500 ? 0 : 39.90;
  const total = subtotal + deliveryFee;

  const formik = useFormik({
    initialValues: {
      fullName: '',
      phone: '',
      city: '',
      district: '',
      address: '',
      postalCode: '',
    },
    validationSchema: addressSchema,
    onSubmit: () => {
      setActiveStep(1);
    },
  });

  const handlePlaceOrder = async () => {
    setOrderLoading(true);
    setOrderError('');
    try {
      await apiClient.post('/orders', {
        items: items.map((item) => ({
          productId: item.productId,
          storeId: item.storeId,
          name: item.name,
          thumbnail: item.thumbnail,
          price: item.price,
          quantity: item.quantity,
          variationId: item.variationId,
        })),
        shippingAddress: formik.values,
        paymentMethod,
        subtotal,
        deliveryFee,
        total,
      });
      dispatch(clearCart());
      setActiveStep(2);
    } catch {
      setOrderError('Sipariş oluşturulamadı. Lütfen tekrar deneyin.');
    } finally {
      setOrderLoading(false);
    }
  };

  if (items.length === 0 && activeStep !== 2) {
    navigate('/cart');
    return null;
  }

  if (!isAuthenticated) {
    return (
      <Box textAlign="center" py={8}>
        <Typography variant="h5" fontWeight={600} mb={2}>
          Sipariş vermek için giriş yapın
        </Typography>
        <Button variant="contained" size="large" onClick={() => navigate('/login')}>
          Giriş Yap
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>
        Siparişi Tamamla
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          {/* Step 0: Address */}
          {activeStep === 0 && (
            <Card sx={{ p: 3 }} component="form" onSubmit={formik.handleSubmit}>
              <Typography variant="h6" fontWeight={600} mb={2}>
                Teslimat Adresi
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Input
                    name="fullName"
                    label="Ad Soyad"
                    value={formik.values.fullName}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    errorMessage={formik.touched.fullName ? formik.errors.fullName : undefined}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Input
                    name="phone"
                    label="Telefon"
                    value={formik.values.phone}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    errorMessage={formik.touched.phone ? formik.errors.phone : undefined}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Input
                    name="city"
                    label="Şehir"
                    value={formik.values.city}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    errorMessage={formik.touched.city ? formik.errors.city : undefined}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Input
                    name="district"
                    label="İlçe"
                    value={formik.values.district}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    errorMessage={formik.touched.district ? formik.errors.district : undefined}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Input
                    name="address"
                    label="Açık Adres"
                    value={formik.values.address}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    errorMessage={formik.touched.address ? formik.errors.address : undefined}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Input
                    name="postalCode"
                    label="Posta Kodu"
                    value={formik.values.postalCode}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    errorMessage={formik.touched.postalCode ? formik.errors.postalCode : undefined}
                  />
                </Grid>
              </Grid>
              <Box display="flex" justifyContent="flex-end" mt={3}>
                <Button variant="contained" type="submit" size="large">
                  Ödemeye Geç
                </Button>
              </Box>
            </Card>
          )}

          {/* Step 1: Payment */}
          {activeStep === 1 && (
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} mb={2}>
                Ödeme Yöntemi
              </Typography>

              {orderError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {orderError}
                </Alert>
              )}

              <FormControl>
                <FormLabel>Ödeme Seçenekleri</FormLabel>
                <RadioGroup value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <FormControlLabel
                    value="credit_card"
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography fontWeight={600}>Kredi Kartı</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Visa, Mastercard, Troy
                        </Typography>
                      </Box>
                    }
                  />
                  <FormControlLabel
                    value="debit_card"
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography fontWeight={600}>Banka Kartı</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Banka/debit kartı ile ödeme
                        </Typography>
                      </Box>
                    }
                  />
                  <FormControlLabel
                    value="bank_transfer"
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography fontWeight={600}>Havale / EFT</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Banka havalesi ile ödeme
                        </Typography>
                      </Box>
                    }
                  />
                  <FormControlLabel
                    value="cash_on_delivery"
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography fontWeight={600}>Kapıda Ödeme</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Teslimat sırasında nakit veya kart ile ödeme (+10 ₺)
                        </Typography>
                      </Box>
                    }
                  />
                </RadioGroup>
              </FormControl>

              {(paymentMethod === 'credit_card' || paymentMethod === 'debit_card') && (
                <Box mt={3}>
                  <Typography variant="subtitle2" fontWeight={600} mb={1}>
                    Kart Bilgileri
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Input name="cardNumber" label="Kart Numarası" />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Input name="expiry" label="Son Kullanma (AA/YY)" />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Input name="cvv" label="CVV" />
                    </Grid>
                    <Grid item xs={12}>
                      <Input name="cardHolder" label="Kart Üzerindeki İsim" />
                    </Grid>
                  </Grid>
                </Box>
              )}

              <Box display="flex" justifyContent="space-between" mt={3}>
                <Button variant="outlined" onClick={() => setActiveStep(0)}>
                  Geri
                </Button>
                <Button variant="contained" size="large" onClick={handlePlaceOrder} disabled={orderLoading}>
                  {orderLoading ? 'İşleniyor...' : 'Siparişi Onayla'}
                </Button>
              </Box>
            </Card>
          )}

          {/* Step 2: Confirmation */}
          {activeStep === 2 && (
            <Card sx={{ p: 4, textAlign: 'center' }}>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  bgcolor: 'success.light',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                  fontSize: 40,
                }}
              >
                ✓
              </Box>
              <Typography variant="h5" fontWeight={700} mb={1}>
                Siparişiniz Alındı!
              </Typography>
              <Typography color="text.secondary" mb={3}>
                Siparişiniz başarıyla oluşturuldu. Sipariş durumunuzu takip edebilirsiniz.
              </Typography>
              <Box display="flex" gap={2} justifyContent="center">
                <Button variant="contained" onClick={() => navigate('/orders')}>
                  Siparişlerim
                </Button>
                <Button variant="outlined" onClick={() => navigate('/')}>
                  Alışverişe Devam Et
                </Button>
              </Box>
            </Card>
          )}
        </Grid>

        {/* Order Summary Sidebar */}
        {activeStep < 2 && (
          <Grid item xs={12} md={4}>
            <Card sx={{ p: 3, position: 'sticky', top: 80 }}>
              <Typography variant="h6" fontWeight={700} mb={2}>
                Sipariş Özeti
              </Typography>
              {items.map((item) => (
                <Box key={item.id} display="flex" gap={1.5} mb={1.5}>
                  <Box
                    component="img"
                    src={item.thumbnail || 'https://via.placeholder.com/48'}
                    sx={{ width: 48, height: 48, borderRadius: 1, objectFit: 'cover' }}
                  />
                  <Box flex={1}>
                    <Typography variant="body2" fontWeight={600} noWrap>
                      {item.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.quantity} adet
                    </Typography>
                  </Box>
                  <Typography variant="body2" fontWeight={600}>
                    {(item.price * item.quantity).toLocaleString('tr-TR')} ₺
                  </Typography>
                </Box>
              ))}
              <Divider sx={{ my: 2 }} />
              <Box display="flex" justifyContent="space-between" mb={0.5}>
                <Typography variant="body2" color="text.secondary">Ara Toplam</Typography>
                <Typography variant="body2">{subtotal.toLocaleString('tr-TR')} ₺</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={0.5}>
                <Typography variant="body2" color="text.secondary">Kargo</Typography>
                <Typography variant="body2" color={deliveryFee === 0 ? 'success.main' : 'text.primary'}>
                  {deliveryFee === 0 ? 'Ücretsiz' : `${deliveryFee.toLocaleString('tr-TR')} ₺`}
                </Typography>
              </Box>
              {paymentMethod === 'cash_on_delivery' && (
                <Box display="flex" justifyContent="space-between" mb={0.5}>
                  <Typography variant="body2" color="text.secondary">Kapıda Ödeme</Typography>
                  <Typography variant="body2">10,00 ₺</Typography>
                </Box>
              )}
              <Divider sx={{ my: 1.5 }} />
              <Box display="flex" justifyContent="space-between">
                <Typography variant="subtitle1" fontWeight={700}>Toplam</Typography>
                <Typography variant="subtitle1" fontWeight={700} color="primary">
                  {(total + (paymentMethod === 'cash_on_delivery' ? 10 : 0)).toLocaleString('tr-TR')} ₺
                </Typography>
              </Box>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
