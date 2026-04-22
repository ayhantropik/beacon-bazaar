import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import apiClient from '@services/api/client';

export default function VerifyStorePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) { setStatus('error'); setMessage('Geçersiz bağlantı'); return; }
    apiClient.get(`/auth/verify-email?token=${token}`)
      .then(res => {
        const data = res.data;
        if (data.success) { setStatus('success'); setMessage(data.message); }
        else { setStatus('error'); setMessage(data.message); }
      })
      .catch(() => { setStatus('error'); setMessage('Onay işlemi başarısız oldu'); });
  }, [token]);

  return (
    <Box sx={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', px: 3 }}>
      {status === 'loading' && (
        <>
          <CircularProgress size={48} sx={{ mb: 2 }} />
          <Typography variant="h6" color="text.secondary">Hesap onaylanıyor...</Typography>
        </>
      )}
      {status === 'success' && (
        <>
          <CheckCircleIcon sx={{ fontSize: 64, color: '#1a6b52', mb: 2 }} />
          <Typography variant="h5" fontWeight={700} mb={1}>Hesabınız Onaylandı!</Typography>
          <Typography color="text.secondary" mb={3}>{message}</Typography>
          <Button variant="contained" onClick={() => navigate('/login')} sx={{ borderRadius: 2 }}>
            Giriş Yap
          </Button>
        </>
      )}
      {status === 'error' && (
        <>
          <ErrorIcon sx={{ fontSize: 64, color: '#c0392b', mb: 2 }} />
          <Typography variant="h5" fontWeight={700} mb={1}>Onay Başarısız</Typography>
          <Typography color="text.secondary" mb={3}>{message}</Typography>
          <Button variant="outlined" onClick={() => navigate('/')} sx={{ borderRadius: 2 }}>
            Ana Sayfaya Dön
          </Button>
        </>
      )}
    </Box>
  );
}
