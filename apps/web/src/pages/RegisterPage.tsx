import { useFormik } from 'formik';
import * as yup from 'yup';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import { useNavigate } from 'react-router-dom';
import Button from '@components/atoms/Button';
import Input from '@components/atoms/Input';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { register } from '@store/slices/authSlice';
import SocialLoginButtons from '@components/molecules/SocialLoginButtons';

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
  const navigate = useNavigate();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const formik = useFormik({
    initialValues: { name: '', surname: '', email: '', password: '', confirmPassword: '' },
    validationSchema,
    onSubmit: async ({ confirmPassword: _, ...values }) => {
      const result = await dispatch(register(values));
      if (register.fulfilled.match(result)) {
        navigate('/');
      }
    },
  });

  return (
    <Box component="form" onSubmit={formik.handleSubmit}>
      <Typography variant="h5" textAlign="center" mb={3} fontWeight={600}>
        Kayıt Ol
      </Typography>

      <SocialLoginButtons mode="register" position="top" />

      {error && (
        <Typography color="error" textAlign="center" mb={2}>
          {error}
        </Typography>
      )}

      <Box display="flex" gap={2} mb={2}>
        <Input
          name="name"
          label="Ad"
          value={formik.values.name}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          errorMessage={formik.touched.name ? formik.errors.name : undefined}
        />
        <Input
          name="surname"
          label="Soyad"
          value={formik.values.surname}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          errorMessage={formik.touched.surname ? formik.errors.surname : undefined}
        />
      </Box>

      <Input
        name="email"
        label="E-posta"
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
        sx={{ mb: 2 }}
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
      />

      <Button
        type="submit"
        variant="contained"
        fullWidth
        size="large"
        isLoading={isLoading}
        sx={{ mb: 2 }}
      >
        Kayıt Ol
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
