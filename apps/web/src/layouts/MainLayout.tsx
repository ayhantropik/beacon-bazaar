import { Outlet } from 'react-router-dom';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import MapIcon from '@mui/icons-material/Map';
import Badge from '@mui/material/Badge';
import Container from '@mui/material/Container';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@store/hooks';
import { selectCartItemCount } from '@store/slices/cartSlice';
import { toggleMobileMenu } from '@store/slices/uiSlice';
import SearchBar from '@components/molecules/SearchBar';

export default function MainLayout() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const cartItemCount = useAppSelector(selectCartItemCount);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  const handleSearch = (query: string) => {
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="sticky" color="default" elevation={1}>
        <Toolbar sx={{ gap: 1 }}>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={() => dispatch(toggleMobileMenu())}
            sx={{ display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography
            variant="h6"
            component="div"
            fontFamily="'Plus Jakarta Sans', sans-serif"
            fontWeight={800}
            color="primary"
            sx={{ cursor: 'pointer', flexShrink: 0 }}
            onClick={() => navigate('/')}
          >
            Beacon Bazaar
          </Typography>

          <Box sx={{ flexGrow: 1, maxWidth: 600, mx: 2, display: { xs: 'none', sm: 'block' } }}>
            <SearchBar onSearch={handleSearch} />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <IconButton color="inherit" onClick={() => navigate('/map')} aria-label="harita">
              <MapIcon />
            </IconButton>
            <IconButton
              color="inherit"
              onClick={() => navigate('/cart')}
              aria-label="sepet"
            >
              <Badge badgeContent={cartItemCount} color="error">
                <ShoppingCartIcon />
              </Badge>
            </IconButton>
            <IconButton
              color="inherit"
              onClick={() => navigate(isAuthenticated ? '/profile' : '/login')}
              aria-label="hesap"
            >
              <AccountCircleIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Container component="main" maxWidth="xl" sx={{ flexGrow: 1, py: 3 }}>
        <Outlet />
      </Container>

      <Box
        component="footer"
        sx={{ py: 3, px: 2, mt: 'auto', backgroundColor: 'grey.100', textAlign: 'center' }}
      >
        <Typography variant="body2" color="text.secondary">
          &copy; 2026 Beacon Bazaar. Tüm hakları saklıdır.
        </Typography>
      </Box>
    </Box>
  );
}
