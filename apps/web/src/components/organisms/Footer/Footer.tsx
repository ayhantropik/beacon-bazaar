import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import Divider from '@mui/material/Divider';

export default function Footer() {
  return (
    <Box component="footer" sx={{ bgcolor: '#1e293b', color: 'white', pt: 6, pb: 3 }}>
      <Container maxWidth="xl">
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" fontFamily="'Plus Jakarta Sans'" fontWeight={800} gutterBottom>
              VeniVidiCoop
            </Typography>
            <Typography variant="body2" color="grey.400" maxWidth={300}>
              Konum bazlı alışveriş deneyimi ile yakınındaki mağazaları keşfet, ürünleri karşılaştır
              ve en iyi fırsatları yakala.
            </Typography>
          </Grid>

          <Grid item xs={6} md={2}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Keşfet
            </Typography>
            {['Mağazalar', 'Kategoriler', 'Kampanyalar', 'Harita'].map((item) => (
              <Typography key={item} variant="body2" color="grey.400" sx={{ mb: 0.5 }}>
                <Link href="#" color="inherit" underline="hover">{item}</Link>
              </Typography>
            ))}
          </Grid>

          <Grid item xs={6} md={2}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Hesabım
            </Typography>
            {['Siparişlerim', 'Favorilerim', 'Adreslerim', 'Randevularım'].map((item) => (
              <Typography key={item} variant="body2" color="grey.400" sx={{ mb: 0.5 }}>
                <Link href="#" color="inherit" underline="hover">{item}</Link>
              </Typography>
            ))}
          </Grid>

          <Grid item xs={6} md={2}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Yardım
            </Typography>
            {['SSS', 'İletişim', 'İade Politikası', 'Gizlilik'].map((item) => (
              <Typography key={item} variant="body2" color="grey.400" sx={{ mb: 0.5 }}>
                <Link href="#" color="inherit" underline="hover">{item}</Link>
              </Typography>
            ))}
          </Grid>

          <Grid item xs={6} md={2}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Mağaza Sahipleri
            </Typography>
            {['Mağaza Aç', 'VeniVidiCoop Kurulumu', 'Fiyatlandırma', 'Destek'].map((item) => (
              <Typography key={item} variant="body2" color="grey.400" sx={{ mb: 0.5 }}>
                <Link href="#" color="inherit" underline="hover">{item}</Link>
              </Typography>
            ))}
          </Grid>
        </Grid>

        <Divider sx={{ my: 3, borderColor: 'grey.800' }} />

        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          <Typography variant="body2" color="grey.500">
            &copy; 2026 VeniVidiCoop. Tüm hakları saklıdır.
          </Typography>
          <Box display="flex" gap={1}>
            {['KVKK', 'Kullanım Koşulları', 'Çerez Politikası'].map((item) => (
              <Link key={item} href="#" variant="body2" color="grey.500" underline="hover">
                {item}
              </Link>
            ))}
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
