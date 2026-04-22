import { useState } from 'react';
import { useFormik } from 'formik';
import * as yup from 'yup';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import PersonIcon from '@mui/icons-material/Person';
import StorefrontIcon from '@mui/icons-material/Storefront';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import { useSearchParams } from 'react-router-dom';
import Button from '@components/atoms/Button';
import Input from '@components/atoms/Input';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { register } from '@store/slices/authSlice';
import SocialLoginButtons from '@components/molecules/SocialLoginButtons';
import apiClient from '@services/api/client';

const validationSchema = yup.object({
  name: yup.string().required('Ad gerekli'),
  surname: yup.string().required('Soyad gerekli'),
  email: yup.string().email('Geçerli bir e-posta girin').required('E-posta gerekli'),
  password: yup.string().min(6, 'En az 6 karakter').required('Şifre gerekli'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Şifreler eşleşmiyor')
    .required('Şifre tekrarı gerekli'),
});

export default function RegisterPage() {
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const { isLoading, error } = useAppSelector((state) => state.auth);
  const [verificationSent, setVerificationSent] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState('');
  const [accountType, setAccountType] = useState<'customer' | 'store_owner'>(
    searchParams.get('type') === 'store' ? 'store_owner' : 'customer',
  );

  const isStore = accountType === 'store_owner';

  const formik = useFormik({
    initialValues: { name: '', surname: '', email: '', password: '', confirmPassword: '' },
    validationSchema,
    onSubmit: async ({ confirmPassword: _, ...values }) => {
      const result = await dispatch(register({ ...values, role: accountType }));
      if (register.fulfilled.match(result)) {
        setRegisteredEmail(values.email);
        setVerificationSent(true);
      }
    },
  });

  const handleResend = async () => {
    setResending(true);
    setResendMsg('');
    try {
      const res = await apiClient.post('/auth/resend-verification', { email: registeredEmail });
      setResendMsg(res.data.message || 'Onay e-postası tekrar gönderildi.');
    } catch {
      setResendMsg('Gönderim başarısız oldu, lütfen tekrar deneyin.');
    }
    setResending(false);
  };

  // E-posta onay ekranı
  if (verificationSent) {
    return (
      <Box sx={{ textAlign: 'center', py: 4, px: 3 }}>
        <MarkEmailReadIcon sx={{ fontSize: 72, color: '#1a6b52', mb: 2 }} />
        <Typography variant="h5" fontWeight={700} mb={1}>
          E-posta Onayı Gerekli
        </Typography>
        <Typography color="text.secondary" mb={1}>
          <strong>{registeredEmail}</strong> adresine bir onay bağlantısı gönderdik.
        </Typography>
        <Typography color="text.secondary" mb={3}>
          Lütfen e-postanızı kontrol edin ve bağlantıya tıklayarak hesabınızı aktifleştirin.
        </Typography>

        <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
          E-posta gelmedi mi? Spam/gereksiz klasörünüzü kontrol edin veya tekrar gönderin.
        </Alert>

        {resendMsg && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {resendMsg}
          </Alert>
        )}

        <Button
          variant="outlined"
          onClick={handleResend}
          isLoading={resending}
          sx={{ mr: 2 }}
        >
          Tekrar Gönder
        </Button>
        <Button
          variant="text"
          onClick={() => setVerificationSent(false)}
        >
          Farklı e-posta ile kayıt ol
        </Button>
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={formik.handleSubmit}>
      <Typography variant="h5" textAlign="center" mb={2} fontWeight={600}>
        Kayıt Ol
      </Typography>

      {/* Account Type Selector */}
      <ToggleButtonGroup
        value={accountType}
        exclusive
        onChange={(_, v) => v && setAccountType(v)}
        fullWidth
        sx={{ mb: 3 }}
      >
        <ToggleButton
          value="customer"
          sx={{
            py: 1.5,
            textTransform: 'none',
            fontWeight: 600,
            '&.Mui-selected': { bgcolor: 'primary.main', color: '#fff', '&:hover': { bgcolor: 'primary.dark' } },
          }}
        >
          <PersonIcon sx={{ mr: 1 }} />
          Bireysel
        </ToggleButton>
        <ToggleButton
          value="store_owner"
          sx={{
            py: 1.5,
            textTransform: 'none',
            fontWeight: 600,
            '&.Mui-selected': { bgcolor: 'primary.main', color: '#fff', '&:hover': { bgcolor: 'primary.dark' } },
          }}
        >
          <StorefrontIcon sx={{ mr: 1 }} />
          Kurumsal / Mağaza
        </ToggleButton>
      </ToggleButtonGroup>

      {isStore && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Kurumsal hesap ile kayıt olduktan sonra mağaza bilgilerinizi girebileceksiniz.
        </Alert>
      )}

      {!isStore && <SocialLoginButtons mode="register" position="top" />}

      {error && (
        <Typography color="error" textAlign="center" mb={2}>
          {error}
        </Typography>
      )}

      <Box display="flex" gap={2} mb={2}>
        <Input
          name="name"
          label={isStore ? 'Yetkili Adı' : 'Ad'}
          value={formik.values.name}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          errorMessage={formik.touched.name ? formik.errors.name : undefined}
          autoComplete="given-name"
          inputProps={{ autoComplete: 'given-name' }}
        />
        <Input
          name="surname"
          label={isStore ? 'Yetkili Soyadı' : 'Soyad'}
          value={formik.values.surname}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          errorMessage={formik.touched.surname ? formik.errors.surname : undefined}
          autoComplete="family-name"
          inputProps={{ autoComplete: 'family-name' }}
        />
      </Box>

      <Input
        name="email"
        label={isStore ? 'Kurumsal E-posta' : 'E-posta'}
        value={formik.values.email}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        errorMessage={formik.touched.email ? formik.errors.email : undefined}
        sx={{ mb: 2 }}
        autoComplete="email"
        inputProps={{ autoComplete: 'email' }}
      />

      <Input
        name="password"
        label="Şifre"
        type="password"
        value={formik.values.password}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        errorMessage={formik.touched.password ? formik.errors.password : undefined}
        sx={{ mb: 2 }}
        autoComplete="new-password"
        inputProps={{ autoComplete: 'new-password' }}
      />

      <Input
        name="confirmPassword"
        label="Şifre Tekrarı"
        type="password"
        value={formik.values.confirmPassword}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        errorMessage={formik.touched.confirmPassword ? formik.errors.confirmPassword : undefined}
        sx={{ mb: 3 }}
        autoComplete="new-password"
        inputProps={{ autoComplete: 'new-password' }}
      />

      <Button
        type="submit"
        variant="contained"
        fullWidth
        size="large"
        isLoading={isLoading}
        sx={{
          mb: 2,
          ...(isStore && { bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }),
        }}
      >
        {isStore ? 'Kurumsal Kayıt Ol' : 'Kayıt Ol'}
      </Button>

      <Typography textAlign="center" mt={2}>
        Zaten hesabınız var mı?{' '}
        <Link href="/login" underline="hover">
          Giriş Yap
        </Link>
      </Typography>
    </Box>
  );
}
