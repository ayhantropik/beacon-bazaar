import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import apiClient from '@services/api/client';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Geçerli bir e-posta girin');
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      setSuccess(true);
    } catch {
      setSuccess(true); // güvenlik: e-posta var olsa da olmasa da aynı yanıt
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
              <Typography sx={{ fontSize: 64, mb: 1 }}>📧</Typography>
              <Typography variant="h5" fontWeight={800} gutterBottom>
                E-posta gönderildi
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {email} adresine şifre sıfırlama bağlantısı gönderdik. E-postanı
                kontrol et ve bağlantıya tıklayarak şifreni yenile.
              </Typography>
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={() => navigate('/login')}
                sx={{ background: '#1a6b52', '&:hover': { background: '#0e4a38' } }}
              >
                Girişe Dön
              </Button>
              <Box sx={{ mt: 2 }}>
                <Link to="#" onClick={() => setSuccess(false)} style={{ color: '#1a6b52', fontSize: 13 }}>
                  Farklı e-posta ile tekrar dene
                </Link>
              </Box>
            </Box>
          ) : (
            <Box>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography sx={{ fontSize: 56, mb: 1 }}>🔐</Typography>
                <Typography variant="h5" fontWeight={800}>
                  Şifremi Unuttum
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  E-posta adresini gir, sana şifre sıfırlama bağlantısı gönderelim.
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
                  label="E-posta"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  margin="normal"
                  required
                  autoFocus
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
                  {submitting ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Bağlantı Gönder'}
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
