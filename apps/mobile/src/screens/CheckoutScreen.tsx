import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  RadioButton,
  Card,
  Divider,
  HelperText,
  ActivityIndicator,
} from 'react-native-paper';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import type { RootStackScreenProps } from '../navigation/types';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { clearCart } from '../store/slices/cartSlice';
import StepIndicator from '../components/StepIndicator';
import apiClient from '../services/api/client';

const PRIMARY = '#1a6b52';
const SECONDARY = '#d4882e';
const ERROR = '#c0392b';

type Props = RootStackScreenProps<'Checkout'>;

const addressSchema = Yup.object({
  fullName: Yup.string().required('Ad soyad zorunludur'),
  phone: Yup.string()
    .matches(/^[0-9]{10,11}$/, 'Geçerli bir telefon numarası girin')
    .required('Telefon zorunludur'),
  city: Yup.string().required('Şehir zorunludur'),
  district: Yup.string().required('İlçe zorunludur'),
  address: Yup.string().min(10, 'Adres en az 10 karakter olmalıdır').required('Adres zorunludur'),
  postalCode: Yup.string().matches(/^[0-9]{5}$/, 'Geçerli bir posta kodu girin').required('Posta kodu zorunludur'),
});

type PaymentMethod = 'credit_card' | 'debit_card' | 'bank_transfer' | 'cash_on_delivery';

export default function CheckoutScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const items = useAppSelector((s) => s.cart.items);
  const [step, setStep] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('credit_card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const deliveryFee = subtotal > 200 ? 0 : 29.9;
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
      setStep(1);
    },
  });

  const handlePlaceOrder = async () => {
    setIsSubmitting(true);
    try {
      const res = await apiClient.post('/orders', {
        items: items.map((item) => ({
          productId: item.productId,
          variationId: item.variationId,
          quantity: item.quantity,
        })),
        shippingAddress: {
          fullName: formik.values.fullName,
          phone: formik.values.phone,
          city: formik.values.city,
          district: formik.values.district,
          address: formik.values.address,
          postalCode: formik.values.postalCode,
        },
        paymentMethod,
      });
      setOrderId(res.data?.data?.id || res.data?.id || 'unknown');
      dispatch(clearCart());
      setStep(2);
    } catch (err: any) {
      Alert.alert('Hata', err?.response?.data?.message || 'Sipariş oluşturulamadı');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isCardPayment = paymentMethod === 'credit_card' || paymentMethod === 'debit_card';

  const renderAddressStep = () => (
    <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      <Text variant="titleMedium" style={styles.stepTitle}>Teslimat Adresi</Text>

      <TextInput
        label="Ad Soyad"
        value={formik.values.fullName}
        onChangeText={formik.handleChange('fullName')}
        onBlur={formik.handleBlur('fullName')}
        mode="outlined"
        style={styles.input}
        error={!!(formik.touched.fullName && formik.errors.fullName)}
      />
      {formik.touched.fullName && formik.errors.fullName && (
        <HelperText type="error">{formik.errors.fullName}</HelperText>
      )}

      <TextInput
        label="Telefon"
        value={formik.values.phone}
        onChangeText={formik.handleChange('phone')}
        onBlur={formik.handleBlur('phone')}
        keyboardType="phone-pad"
        mode="outlined"
        style={styles.input}
        error={!!(formik.touched.phone && formik.errors.phone)}
      />
      {formik.touched.phone && formik.errors.phone && (
        <HelperText type="error">{formik.errors.phone}</HelperText>
      )}

      <TextInput
        label="Şehir"
        value={formik.values.city}
        onChangeText={formik.handleChange('city')}
        onBlur={formik.handleBlur('city')}
        mode="outlined"
        style={styles.input}
        error={!!(formik.touched.city && formik.errors.city)}
      />
      {formik.touched.city && formik.errors.city && (
        <HelperText type="error">{formik.errors.city}</HelperText>
      )}

      <TextInput
        label="İlçe"
        value={formik.values.district}
        onChangeText={formik.handleChange('district')}
        onBlur={formik.handleBlur('district')}
        mode="outlined"
        style={styles.input}
        error={!!(formik.touched.district && formik.errors.district)}
      />
      {formik.touched.district && formik.errors.district && (
        <HelperText type="error">{formik.errors.district}</HelperText>
      )}

      <TextInput
        label="Adres"
        value={formik.values.address}
        onChangeText={formik.handleChange('address')}
        onBlur={formik.handleBlur('address')}
        mode="outlined"
        multiline
        numberOfLines={3}
        style={styles.input}
        error={!!(formik.touched.address && formik.errors.address)}
      />
      {formik.touched.address && formik.errors.address && (
        <HelperText type="error">{formik.errors.address}</HelperText>
      )}

      <TextInput
        label="Posta Kodu"
        value={formik.values.postalCode}
        onChangeText={formik.handleChange('postalCode')}
        onBlur={formik.handleBlur('postalCode')}
        keyboardType="number-pad"
        mode="outlined"
        style={styles.input}
        error={!!(formik.touched.postalCode && formik.errors.postalCode)}
      />
      {formik.touched.postalCode && formik.errors.postalCode && (
        <HelperText type="error">{formik.errors.postalCode}</HelperText>
      )}

      <Button
        mode="contained"
        onPress={() => formik.handleSubmit()}
        style={styles.button}
        contentStyle={styles.buttonContent}
        buttonColor={PRIMARY}
      >
        Devam
      </Button>
    </ScrollView>
  );

  const renderPaymentStep = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <Text variant="titleMedium" style={styles.stepTitle}>Ödeme Yöntemi</Text>

      <RadioButton.Group
        onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
        value={paymentMethod}
      >
        <RadioButton.Item label="Kredi Kartı" value="credit_card" />
        <RadioButton.Item label="Banka Kartı" value="debit_card" />
        <RadioButton.Item label="Havale/EFT" value="bank_transfer" />
        <RadioButton.Item label="Kapıda Ödeme" value="cash_on_delivery" />
      </RadioButton.Group>

      {isCardPayment && (
        <Card style={styles.cardForm}>
          <Card.Content>
            <TextInput
              label="Kart Numarası"
              value={cardNumber}
              onChangeText={setCardNumber}
              keyboardType="number-pad"
              maxLength={19}
              mode="outlined"
              style={styles.input}
            />
            <View style={styles.cardRow}>
              <TextInput
                label="Son Kullanma"
                value={cardExpiry}
                onChangeText={setCardExpiry}
                placeholder="AA/YY"
                maxLength={5}
                mode="outlined"
                style={[styles.input, styles.halfInput]}
              />
              <TextInput
                label="CVV"
                value={cardCvv}
                onChangeText={setCardCvv}
                keyboardType="number-pad"
                maxLength={4}
                secureTextEntry
                mode="outlined"
                style={[styles.input, styles.halfInput]}
              />
            </View>
          </Card.Content>
        </Card>
      )}

      <Divider style={styles.divider} />

      <Text variant="titleMedium" style={styles.stepTitle}>Sipariş Özeti</Text>
      <Card style={styles.summaryCard}>
        <Card.Content>
          {items.map((item) => (
            <View key={item.id} style={styles.summaryRow}>
              <Text style={styles.summaryItemName} numberOfLines={1}>
                {item.name} x{item.quantity}
              </Text>
              <Text style={styles.summaryItemPrice}>
                {(item.price * item.quantity).toLocaleString('tr-TR')} ₺
              </Text>
            </View>
          ))}
          <Divider style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text>Ara Toplam</Text>
            <Text>{subtotal.toLocaleString('tr-TR')} ₺</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>Kargo</Text>
            <Text>{deliveryFee === 0 ? 'Ücretsiz' : `${deliveryFee.toLocaleString('tr-TR')} ₺`}</Text>
          </View>
          <Divider style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text variant="titleMedium" style={{ fontWeight: '700' }}>Toplam</Text>
            <Text variant="titleMedium" style={styles.totalPrice}>
              {total.toLocaleString('tr-TR')} ₺
            </Text>
          </View>
        </Card.Content>
      </Card>

      <View style={styles.paymentButtons}>
        <Button
          mode="outlined"
          onPress={() => setStep(0)}
          style={styles.backButton}
          textColor={PRIMARY}
        >
          Geri
        </Button>
        <Button
          mode="contained"
          onPress={handlePlaceOrder}
          loading={isSubmitting}
          disabled={isSubmitting}
          style={styles.confirmButton}
          contentStyle={styles.buttonContent}
          buttonColor={PRIMARY}
        >
          Siparişi Onayla
        </Button>
      </View>
    </ScrollView>
  );

  const renderConfirmationStep = () => (
    <View style={styles.confirmationContainer}>
      <Icon name="check-circle" size={80} color={PRIMARY} />
      <Text variant="headlineSmall" style={styles.confirmTitle}>
        Siparişiniz Alındı!
      </Text>
      <Text variant="bodyMedium" style={styles.confirmSubtitle}>
        Sipariş numaranız: {orderId}
      </Text>
      <Text variant="bodySmall" style={styles.confirmInfo}>
        Siparişinizin durumunu Siparişlerim sayfasından takip edebilirsiniz.
      </Text>

      <Button
        mode="contained"
        onPress={() => navigation.navigate('Orders')}
        style={styles.confirmBtn}
        contentStyle={styles.buttonContent}
        buttonColor={PRIMARY}
      >
        Siparişlerimi Görüntüle
      </Button>
      <Button
        mode="outlined"
        onPress={() => navigation.navigate('Main', { screen: 'Home' })}
        style={styles.confirmBtn}
        textColor={PRIMARY}
      >
        Ana Sayfaya Dön
      </Button>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StepIndicator
        steps={['Adres', 'Ödeme', 'Onay']}
        currentStep={step}
      />
      {step === 0 && renderAddressStep()}
      {step === 1 && renderPaymentStep()}
      {step === 2 && renderConfirmationStep()}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { padding: 16, paddingBottom: 32 },
  stepTitle: { fontWeight: '600', marginBottom: 12, color: '#333' },
  input: { marginBottom: 4 },
  button: { marginTop: 16, borderRadius: 8 },
  buttonContent: { paddingVertical: 8 },
  cardForm: { marginTop: 12, marginBottom: 8, backgroundColor: '#fafafa' },
  cardRow: { flexDirection: 'row', gap: 12 },
  halfInput: { flex: 1 },
  divider: { marginVertical: 16 },
  summaryCard: { backgroundColor: '#fafafa' },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  summaryItemName: { flex: 1, marginRight: 8, color: '#555' },
  summaryItemPrice: { fontWeight: '600' },
  summaryDivider: { marginVertical: 8 },
  totalPrice: { fontWeight: '700', color: PRIMARY },
  paymentButtons: { flexDirection: 'row', gap: 12, marginTop: 20 },
  backButton: { flex: 1, borderColor: PRIMARY },
  confirmButton: { flex: 2, borderRadius: 8 },
  confirmationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  confirmTitle: { fontWeight: '700', marginTop: 20, marginBottom: 8 },
  confirmSubtitle: { color: '#666', marginBottom: 4 },
  confirmInfo: { color: '#999', textAlign: 'center', marginBottom: 32 },
  confirmBtn: { width: '100%', marginBottom: 12, borderRadius: 8 },
});
