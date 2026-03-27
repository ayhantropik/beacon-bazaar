import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@components/atoms/Button';
import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="60vh"
      textAlign="center"
    >
      <Typography variant="h1" fontWeight={800} color="primary" mb={2}>
        404
      </Typography>
      <Typography variant="h5" mb={1}>
        Sayfa Bulunamadı
      </Typography>
      <Typography color="text.secondary" mb={4}>
        Aradığınız sayfa mevcut değil veya taşınmış olabilir.
      </Typography>
      <Button variant="contained" size="large" onClick={() => navigate('/')}>
        Ana Sayfaya Dön
      </Button>
    </Box>
  );
}
