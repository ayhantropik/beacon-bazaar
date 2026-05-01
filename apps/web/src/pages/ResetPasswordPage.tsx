import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  IconButton,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import apiClient from '@services/api/client';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalı');
      return;
    }
    if (password !== confirm) {
      setError('Şifreler eşleşmiyor');
      return;
    }
    if (!token) {
      setError('Geçersiz bağlantı (token eksik)');
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post('/auth/reset-password', { token, newPassword: password });
      setSuccess(true);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Şifre sıfırlanamadı. Bağlantının süresi dolmuş olabilir.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg,#f0fdf4,#fff)',
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 460, width: '100%', borderRadius: 3, boxShadow: 4 }}>
        <CardContent sx={{ p: 4 }}>
          {success ? (
            <Box sx={{ textAlign: 'center' }}>
              <Typography sx={{ fontSize: 64, mb: 1 }}>✅</Typography>
              <Typography variant="h5" fontWeight={800} gutterBottom>
                Şifren Güncellendi
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Yeni şifrenle giriş yapabilirsin.
              </Typography>
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={() => navigate('/login')}
                sx={{ background: '#1a6b52', '&:hover': { background: '#0e4a38' } }}
              >
                Giriş Sayfasına Git
              </Button>
            </Box>
          ) : (
            <Box>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography sx={{ fontSize: 56, mb: 1 }}>🔐</Typography>
                <Typography variant="h5" fontWeight={800}>
                  Yeni Şifre Belirle
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Yeni şifreni gir ve hesabına tekrar erişim sağla.
                </Typography>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <Box component="form" onSubmit={onSubmit}>
                <TextField
                  fullWidth
                  label="Yeni Şifre"
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  margin="normal"
                  required
                  autoFocus
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPwd(!showPwd)} edge="end" size="small">
                          <Typography sx={{ fontSize: 20 }}>{showPwd ? '🙈' : '👁'}</Typography>
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  fullWidth
                  label="Şifre (Tekrar)"
                  type={showPwd ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  margin="normal"
                  required
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={submitting}
                  sx={{
                    mt: 3,
                    py: 1.5,
                    background: '#1a6b52',
                    '&:hover': { background: '#0e4a38' },
                  }}
                >
                  {submitting ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Şifremi Güncelle'}
                </Button>

                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Link to="/login" style={{ color: '#1a6b52', fontWeight: 600, textDecoration: 'none' }}>
                    Giriş Sayfasına Dön
                  </Link>
                </Box>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
