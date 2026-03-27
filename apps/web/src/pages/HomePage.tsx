import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import SearchBar from '@components/molecules/SearchBar';
import { useNavigate } from 'react-router-dom';
import { useGeolocation } from '@hooks/useGeolocation';
import { useAppDispatch } from '@store/hooks';
import { setUserLocation } from '@store/slices/mapSlice';

export default function HomePage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { getLocation } = useGeolocation();

  const handleSearch = (query: string) => {
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleLocationClick = () => {
    getLocation();
    navigator.geolocation.getCurrentPosition((pos) => {
      dispatch(
        setUserLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }),
      );
      navigate('/map');
    });
  };

  return (
    <Box>
      <Box
        sx={{
          textAlign: 'center',
          py: { xs: 4, md: 8 },
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          borderRadius: 4,
          mb: 4,
          px: 2,
        }}
      >
        <Typography
          variant="h3"
          fontFamily="'Plus Jakarta Sans', sans-serif"
          fontWeight={800}
          gutterBottom
        >
          Yakınındaki Mağazaları Keşfet
        </Typography>
        <Typography variant="h6" color="text.secondary" mb={4}>
          Konum bazlı alışveriş deneyimi ile aradığın her şey bir adım uzağında
        </Typography>
        <Box maxWidth={600} mx="auto">
          <SearchBar
            onSearch={handleSearch}
            onLocationClick={handleLocationClick}
            placeholder="Ne aramıştınız?"
          />
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h5" fontWeight={600} mb={2}>
            Popüler Kategoriler
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="h5" fontWeight={600} mb={2}>
            Yakınındaki Mağazalar
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="h5" fontWeight={600} mb={2}>
            Öne Çıkan Ürünler
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );
}
