import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import MuiButton from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import { authService } from '@services/api/auth.service';

const GOOGLE_SVG = (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const APPLE_SVG = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
  </svg>
);

const FACEBOOK_SVG = (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2" />
  </svg>
);

interface SocialLoginButtonsProps {
  mode: 'login' | 'register';
  position?: 'top' | 'bottom';
}

export default function SocialLoginButtons({ mode, position = 'bottom' }: SocialLoginButtonsProps) {
  const label = mode === 'login' ? 'ile giriş yap' : 'ile kayıt ol';
  const navigate = useNavigate();
  const [, setLoading] = useState<string | null>(null);

  const handleSocialLogin = async (provider: string) => {
    setLoading(provider);
    try {
      // Demo: Simulate OAuth flow by using a mock email
      // In production: Replace with real OAuth popup (Google Identity Services, Apple Sign-In, Facebook SDK)
      const demoEmail = `${provider}.user.${Date.now()}@demo.beaconbazaar.com`;
      const response = await authService.socialLogin(provider, {
        email: demoEmail,
        name: provider.charAt(0).toUpperCase() + provider.slice(1),
        surname: 'User',
      });

      if (response.data?.tokens) {
        localStorage.setItem('access_token', response.data.tokens.accessToken);
        localStorage.setItem('refresh_token', response.data.tokens.refreshToken);
        navigate('/');
        window.location.reload();
      }
    } catch (err) {
      console.error(`${provider} login failed:`, err);
    } finally {
      setLoading(null);
    }
  };

  const dividerText = position === 'top' ? 'veya e-posta ile' : 'veya';

  return (
    <Box>
      {position === 'top' && (
        <Box display="flex" flexDirection="column" gap={1.5} mb={1}>
          <MuiButton
            variant="outlined"
            fullWidth
            startIcon={GOOGLE_SVG}
            onClick={() => handleSocialLogin('google')}
            sx={{
              borderColor: '#dadce0',
              color: '#3c4043',
              textTransform: 'none',
              fontWeight: 500,
              py: 1.2,
              '&:hover': { borderColor: '#d2e3fc', backgroundColor: '#f8f9fa' },
            }}
          >
            Google {label}
          </MuiButton>

          <MuiButton
            variant="outlined"
            fullWidth
            startIcon={APPLE_SVG}
            onClick={() => handleSocialLogin('apple')}
            sx={{
              borderColor: '#000',
              color: '#000',
              textTransform: 'none',
              fontWeight: 500,
              py: 1.2,
              '&:hover': { backgroundColor: '#f5f5f5', borderColor: '#000' },
            }}
          >
            Apple {label}
          </MuiButton>

          <MuiButton
            variant="outlined"
            fullWidth
            startIcon={FACEBOOK_SVG}
            onClick={() => handleSocialLogin('facebook')}
            sx={{
              borderColor: '#1877F2',
              color: '#1877F2',
              textTransform: 'none',
              fontWeight: 500,
              py: 1.2,
              '&:hover': { backgroundColor: '#f0f2f5', borderColor: '#1877F2' },
            }}
          >
            Facebook {label}
          </MuiButton>
        </Box>
      )}

      <Divider sx={{ my: 2.5 }}>
        <Typography variant="body2" color="text.secondary">
          {dividerText}
        </Typography>
      </Divider>

      {position === 'bottom' && (
        <Box display="flex" flexDirection="column" gap={1.5}>
          <MuiButton
            variant="outlined"
            fullWidth
            startIcon={GOOGLE_SVG}
            onClick={() => handleSocialLogin('google')}
            sx={{
              borderColor: '#dadce0',
              color: '#3c4043',
              textTransform: 'none',
              fontWeight: 500,
              py: 1.2,
              '&:hover': { borderColor: '#d2e3fc', backgroundColor: '#f8f9fa' },
            }}
          >
            Google {label}
          </MuiButton>

          <MuiButton
            variant="outlined"
            fullWidth
            startIcon={APPLE_SVG}
            onClick={() => handleSocialLogin('apple')}
            sx={{
              borderColor: '#000',
              color: '#000',
              textTransform: 'none',
              fontWeight: 500,
              py: 1.2,
              '&:hover': { backgroundColor: '#f5f5f5', borderColor: '#000' },
            }}
          >
            Apple {label}
          </MuiButton>

          <MuiButton
            variant="outlined"
            fullWidth
            startIcon={FACEBOOK_SVG}
            onClick={() => handleSocialLogin('facebook')}
            sx={{
              borderColor: '#1877F2',
              color: '#1877F2',
              textTransform: 'none',
              fontWeight: 500,
              py: 1.2,
              '&:hover': { backgroundColor: '#f0f2f5', borderColor: '#1877F2' },
            }}
          >
            Facebook {label}
          </MuiButton>
        </Box>
      )}
    </Box>
  );
}
