import { useState, useEffect } from 'react';
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
import Checkbox from '@mui/material/Checkbox';
import Snackbar from '@mui/material/Snackbar';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import Input from '@components/atoms/Input';
import { TURKEY_CITIES, getDistricts } from '@utils/turkey-locations';
import { locationService } from '@services/api/location.service';
import { useAppSelector, useAppDispatch } from '@store/hooks';
import { selectCartItems, selectCartTotal, clearCart } from '@store/slices/cartSlice';
import apiClient from '@services/api/client';

const SAVED_ADDRESS_KEY = 'checkout_saved_address';
const SAVED_CARD_KEY = 'checkout_saved_card';

function getSavedAddress() {
  try { const d = localStorage.getItem(SAVED_ADDRESS_KEY); return d ? JSON.parse(d) : null; } catch { return null; }
}
function getSavedCard() {
  try { const d = localStorage.getItem(SAVED_CARD_KEY); return d ? JSON.parse(d) : null; } catch { return null; }
}

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
  const { isAuthenticated, isLoading: authLoading, user } = useAppSelector((s) => s.auth);
  const [activeStep, setActiveStep] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [saveAddress, setSaveAddress] = useState(true);
  const [saveCard, setSaveCard] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [snackMsg, setSnackMsg] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);

  const deliveryFee = subtotal >= 500 ? 0 : 39.90;
  const total = subtotal + deliveryFee;

  const savedAddr = getSavedAddress();
  const userName = user ? `${user.name || ''}${user.surname ? ' ' + user.surname : ''}`.trim() : '';
  const formik = useFormik({
    initialValues: {
      fullName: savedAddr?.fullName || userName || '',
      phone: savedAddr?.phone || (user as any)?.phone || '',
      city: savedAddr?.city || '',
      district: savedAddr?.district || '',
      address: savedAddr?.address || '',
      postalCode: savedAddr?.postalCode || '',
    },
    validationSchema: addressSchema,
    onSubmit: () => {
      if (saveAddress) {
        localStorage.setItem(SAVED_ADDRESS_KEY, JSON.stringify(formik.values));
        setSnackMsg('Adres bilgileri kaydedildi');
      }
      setActiveStep(1);
    },
  });

  // Kayıtlı kart bilgilerini yükle
  useEffect(() => {
    const saved = getSavedCard();
    if (saved) {
      setCardNumber(saved.cardNumber || '');
      setCardExpiry(saved.cardExpiry || '');
      setCardHolder(saved.cardHolder || '');
      setSaveCard(true);
    }
  }, []);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setSnackMsg('Tarayıcınız konum servisini desteklemiyor');
      /* snack shown via snackMsg */
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await locationService.reverseGeocode(pos.coords.latitude, pos.coords.longitude);
          const data: any = res.data || {};
          // Şehiri TURKEY_CITIES listesine en yakın şekilde eşleştir
          const city = TURKEY_CITIES.find(
            (c) => c.toLocaleLowerCase('tr') === (data.city || '').toLocaleLowerCase('tr'),
          ) || data.city || '';
          const districts = city ? getDistricts(city) : [];
          const district = districts.find(
            (d) => d.toLocaleLowerCase('tr') === (data.district || '').toLocaleLowerCase('tr'),
          ) || data.district || '';

          formik.setFieldValue('city', city);
          formik.setFieldValue('district', district);
          formik.setFieldValue('address', data.street || data.address || '');
          if (data.postalCode) formik.setFieldValue('postalCode', data.postalCode);

          setSnackMsg('Konum bilgileri dolduruldu');
          /* snack shown via snackMsg */
        } catch {
          setSnackMsg('Adres bilgileri alınamadı');
          /* snack shown via snackMsg */
        } finally {
          setLocationLoading(false);
        }
      },
      (err) => {
        setLocationLoading(false);
        setSnackMsg(
          err.code === 1 ? 'Konum izni reddedildi' : 'Konum alınamadı',
        );
        /* snack shown via snackMsg */
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

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
        billingAddress: formik.values,
        paymentMethod,
        paymentStatus: paymentMethod === 'cash_on_delivery' ? 'pending' : 'paid',
        subtotal,
        deliveryFee,
        total: total + (paymentMethod === 'cash_on_delivery' ? 10 : 0),
      });
      // Kart bilgilerini kaydet (CVV hariç — güvenlik)
      if (saveCard && (paymentMethod === 'credit_card' || paymentMethod === 'debit_card')) {
        localStorage.setItem(SAVED_CARD_KEY, JSON.stringify({
          cardNumber: cardNumber.replace(/\d(?=\d{4})/g, '*'),
          cardExpiry,
          cardHolder,
        }));
      }
      dispatch(clearCart());
      setActiveStep(2);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401) {
        setOrderError('Oturumunuzun süresi doldu. Sipariş adres bilgileriniz korunuyor — lütfen tekrar giriş yapın.');
        setTimeout(() => navigate('/login?returnTo=/checkout'), 1500);
      } else {
        const msg = err?.response?.data?.message || err?.message || 'Sipariş oluşturulamadı. Lütfen tekrar deneyin.';
        setOrderError(typeof msg === 'string' ? msg : 'Sipariş oluşturulamadı.');
      }
    } finally {
      setOrderLoading(false);
    }
  };

  if (items.length === 0 && activeStep !== 2) {
    navigate('/cart');
    return null;
  }

  if (authLoading) return null;

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
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight={600}>
                  Teslimat Adresi
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={locationLoading ? <CircularProgress size={16} /> : <MyLocationIcon />}
                  onClick={handleUseMyLocation}
                  disabled={locationLoading}
                  sx={{ borderRadius: 2, textTransform: 'none' }}
                >
                  {locationLoading ? 'Konum alınıyor...' : 'Mevcut Konumu Kullan'}
                </Button>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Input
                    name="fullName"
                    label="Ad Soyad"
                    value={formik.values.fullName}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    errorMessage={formik.touched.fullName ? formik.errors.fullName as string : undefined}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Input
                    name="phone"
                    label="Telefon"
                    value={formik.values.phone}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    errorMessage={formik.touched.phone ? formik.errors.phone as string : undefined}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Autocomplete
                    options={TURKEY_CITIES}
                    value={formik.values.city || null}
                    onChange={(_, v) => {
                      formik.setFieldValue('city', v || '');
                      formik.setFieldValue('district', '');
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Şehir"
                        name="city"
                        onBlur={formik.handleBlur}
                        error={formik.touched.city && !!formik.errors.city}
                        helperText={formik.touched.city ? (formik.errors.city as string) : undefined}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Autocomplete
                    options={formik.values.city ? getDistricts(formik.values.city) : []}
                    value={formik.values.district || null}
                    onChange={(_, v) => formik.setFieldValue('district', v || '')}
                    disabled={!formik.values.city}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="İlçe"
                        name="district"
                        placeholder={!formik.values.city ? 'Önce şehir seçin' : 'İlçe seç...'}
                        onBlur={formik.handleBlur}
                        error={formik.touched.district && !!formik.errors.district}
                        helperText={formik.touched.district ? (formik.errors.district as string) : undefined}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Input
                    name="address"
                    label="Açık Adres"
                    value={formik.values.address}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    errorMessage={formik.touched.address ? formik.errors.address as string : undefined}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Input
                    name="postalCode"
                    label="Posta Kodu"
                    value={formik.values.postalCode}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    errorMessage={formik.touched.postalCode ? formik.errors.postalCode as string : undefined}
                  />
                </Grid>
              </Grid>
              <Box display="flex" alignItems="center" justifyContent="space-between" mt={3}>
                <FormControlLabel
                  control={<Checkbox checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} size="small" />}
                  label={<Typography variant="body2">Bu adresi sonraki siparişler için kaydet</Typography>}
                />
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
                      <Input name="cardNumber" label="Kart Numarası" value={cardNumber} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCardNumber(e.target.value)} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Input name="expiry" label="Son Kullanma (AA/YY)" value={cardExpiry} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCardExpiry(e.target.value)} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Input name="cvv" label="CVV" value={cardCvv} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCardCvv(e.target.value)} />
                    </Grid>
                    <Grid item xs={12}>
                      <Input name="cardHolder" label="Kart Üzerindeki İsim" value={cardHolder} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCardHolder(e.target.value)} />
                    </Grid>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={<Checkbox checked={saveCard} onChange={(e) => setSaveCard(e.target.checked)} size="small" />}
                        label={<Typography variant="body2">Kart bilgilerimi sonraki alışverişler için hatırla</Typography>}
                      />
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
      <Snackbar open={!!snackMsg} autoHideDuration={3000} onClose={() => setSnackMsg('')} message={snackMsg} />
    </Box>
  );
}
