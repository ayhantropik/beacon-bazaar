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
import { useNavigate, useSearchParams } from 'react-router-dom';
import Button from '@components/atoms/Button';
import Input from '@components/atoms/Input';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { login } from '@store/slices/authSlice';
import SocialLoginButtons from '@components/molecules/SocialLoginButtons';
import apiClient from '@services/api/client';

const validationSchema = yup.object({
  email: yup.string().email('Geçerli bir e-posta girin').required('E-posta gerekli'),
  password: yup.string().min(6, 'En az 6 karakter').required('Şifre gerekli'),
});

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const { isLoading, error } = useAppSelector((state) => state.auth);
  const [loginType, setLoginType] = useState<'customer' | 'store_owner'>('customer');
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState('');

  const isStore = loginType === 'store_owner';
  const isUnverified = error && error.includes('onaylanmamış');

  const formik = useFormik({
    initialValues: { email: '', password: '' },
    validationSchema,
    onSubmit: async (values) => {
      const result = await dispatch(login(values));
      if (login.fulfilled.match(result)) {
        const user = result.payload?.user;
        if (returnTo) {
          navigate(returnTo);
        } else if (user?.role === 'admin') {
          navigate('/admin');
        } else if (user?.role === 'store_owner') {
          navigate('/dashboard');
        } else {
          navigate('/');
        }
      }
    },
  });

  return (
    <Box component="form" onSubmit={formik.handleSubmit}>
      <Typography variant="h5" textAlign="center" mb={2} fontWeight={600}>
        Giriş Yap
      </Typography>

      {/* Login Type Selector */}
      <ToggleButtonGroup
        value={loginType}
        exclusive
        onChange={(_, v) => v && setLoginType(v)}
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
          Bireysel Giriş
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
          Mağaza Girişi
        </ToggleButton>
      </ToggleButtonGroup>

      {error && (
        <Alert
          severity={isUnverified ? 'warning' : 'error'}
          sx={{ mb: 2 }}
          action={isUnverified && (
            <Button
              size="small"
              variant="text"
              isLoading={resending}
              onClick={async () => {
                setResending(true);
                setResendMsg('');
                try {
                  const res = await apiClient.post('/auth/resend-verification', { email: formik.values.email });
                  setResendMsg(res.data.message);
                } catch { setResendMsg('Gönderilemedi'); }
                setResending(false);
              }}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Tekrar Gönder
            </Button>
          )}
        >
          {error}
        </Alert>
      )}
      {resendMsg && (
        <Alert severity="success" sx={{ mb: 2 }}>{resendMsg}</Alert>
      )}

      <Input
        name="email"
        label={isStore ? 'Kurumsal E-posta' : 'E-posta'}
        value={formik.values.email}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        errorMessage={formik.touched.email ? formik.errors.email : undefined}
        sx={{ mb: 2 }}
      />

      <Input
        name="password"
        label="Şifre"
        type="password"
        value={formik.values.password}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        errorMessage={formik.touched.password ? formik.errors.password : undefined}
        sx={{ mb: 3 }}
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
        {isStore ? 'Mağaza Girişi' : 'Giriş Yap'}
      </Button>

      {!isStore && <SocialLoginButtons mode="login" />}

      <Typography textAlign="center" mt={2}>
        Hesabınız yok mu?{' '}
        <Link href={isStore ? '/register?type=store' : '/register'} underline="hover">
          {isStore ? 'Kurumsal Kayıt Ol' : 'Kayıt Ol'}
        </Link>
      </Typography>
    </Box>
  );
}
