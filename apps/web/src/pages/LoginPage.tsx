import { useFormik } from 'formik';
import * as yup from 'yup';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import { useNavigate } from 'react-router-dom';
import Button from '@components/atoms/Button';
import Input from '@components/atoms/Input';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { login } from '@store/slices/authSlice';

const validationSchema = yup.object({
  email: yup.string().email('Geçerli bir e-posta girin').required('E-posta gerekli'),
  password: yup.string().min(6, 'En az 6 karakter').required('Şifre gerekli'),
});

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const formik = useFormik({
    initialValues: { email: '', password: '' },
    validationSchema,
    onSubmit: async (values) => {
      const result = await dispatch(login(values));
      if (login.fulfilled.match(result)) {
        navigate('/');
      }
    },
  });

  return (
    <Box component="form" onSubmit={formik.handleSubmit}>
      <Typography variant="h5" textAlign="center" mb={3} fontWeight={600}>
        Giriş Yap
      </Typography>

      {error && (
        <Typography color="error" textAlign="center" mb={2}>
          {error}
        </Typography>
      )}

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
        Giriş Yap
      </Button>

      <Typography textAlign="center">
        Hesabınız yok mu?{' '}
        <Link href="/register" underline="hover">
          Kayıt Ol
        </Link>
      </Typography>
    </Box>
  );
}
