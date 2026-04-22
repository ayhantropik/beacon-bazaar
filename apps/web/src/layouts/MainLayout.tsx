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
import HomeIcon from '@mui/icons-material/Home';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import StorefrontIcon from '@mui/icons-material/Storefront';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import ApartmentIcon from '@mui/icons-material/Apartment';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import Badge from '@mui/material/Badge';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Tooltip from '@mui/material/Tooltip';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@store/hooks';
import { selectCartItemCount } from '@store/slices/cartSlice';
import { toggleMobileMenu } from '@store/slices/uiSlice';
import CategoryBar from '@components/organisms/CategoryBar/CategoryBar';
import FloatingCart from '@components/organisms/FloatingCart/FloatingCart';

export default function MainLayout() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const cartItemCount = useAppSelector(selectCartItemCount);
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const isStoreOwner = isAuthenticated && user?.role === 'store_owner';
  const isAdmin = isAuthenticated && user?.role === 'admin';

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

          <Box
            sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', flexShrink: 0 }}
            onClick={() => navigate('/')}
          >
            <Box component="img" src="/favicon.svg" sx={{ width: 32, height: 32 }} alt="VeniVidiCoop" />
            <Typography
              variant="h6"
              component="div"
              sx={{
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 800,
                letterSpacing: '-0.02em',
                display: { xs: 'none', sm: 'block' },
              }}
            >
              <Box component="span" sx={{ color: '#1a6b52' }}>Veni</Box>
              <Box component="span" sx={{ color: '#d4882e' }}>Vidi</Box>
              <Box component="span" sx={{ color: '#2c1810' }}>Coop</Box>
            </Typography>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          {/* Ayrıcalıklı Oto & Emlak butonları */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1, mr: 1 }}>
            <Chip
              icon={<DirectionsCarIcon sx={{ fontSize: 18, color: '#fff !important' }} />}
              label="Oto"
              onClick={() => navigate('/oto')}
              sx={{
                background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)',
                color: '#fff',
                fontWeight: 700,
                fontSize: 13,
                px: 0.5,
                height: 34,
                borderRadius: '8px',
                cursor: 'pointer',
                border: '1px solid rgba(255,255,255,0.15)',
                boxShadow: '0 2px 8px rgba(26,35,126,0.3)',
                transition: 'all 0.2s',
                '&:hover': {
                  background: 'linear-gradient(135deg, #283593 0%, #3949ab 100%)',
                  boxShadow: '0 4px 12px rgba(26,35,126,0.4)',
                  transform: 'translateY(-1px)',
                },
                '& .MuiChip-icon': { ml: '6px' },
              }}
            />
            <Chip
              icon={<ApartmentIcon sx={{ fontSize: 18, color: '#fff !important' }} />}
              label="Emlak"
              onClick={() => navigate('/emlak')}
              sx={{
                background: 'linear-gradient(135deg, #b71c1c 0%, #c62828 100%)',
                color: '#fff',
                fontWeight: 700,
                fontSize: 13,
                px: 0.5,
                height: 34,
                borderRadius: '8px',
                cursor: 'pointer',
                border: '1px solid rgba(255,255,255,0.15)',
                boxShadow: '0 2px 8px rgba(183,28,28,0.3)',
                transition: 'all 0.2s',
                '&:hover': {
                  background: 'linear-gradient(135deg, #c62828 0%, #d32f2f 100%)',
                  boxShadow: '0 4px 12px rgba(183,28,28,0.4)',
                  transform: 'translateY(-1px)',
                },
                '& .MuiChip-icon': { ml: '6px' },
              }}
            />
            <Chip
              icon={<RestaurantIcon sx={{ fontSize: 18, color: '#fff !important' }} />}
              label="Yemek"
              onClick={() => navigate('/yemek')}
              sx={{
                background: 'linear-gradient(135deg, #e65100 0%, #f57c00 100%)',
                color: '#fff',
                fontWeight: 700,
                fontSize: 13,
                px: 0.5,
                height: 34,
                borderRadius: '8px',
                cursor: 'pointer',
                border: '1px solid rgba(255,255,255,0.15)',
                boxShadow: '0 2px 8px rgba(230,81,0,0.3)',
                transition: 'all 0.2s',
                '&:hover': {
                  background: 'linear-gradient(135deg, #f57c00 0%, #ff9800 100%)',
                  boxShadow: '0 4px 12px rgba(230,81,0,0.4)',
                  transform: 'translateY(-1px)',
                },
                '& .MuiChip-icon': { ml: '6px' },
              }}
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <IconButton color="inherit" onClick={() => navigate('/')} aria-label="ana sayfa">
              <HomeIcon />
            </IconButton>
            {isStoreOwner && (
              <Tooltip title="Mağaza Paneli">
                <IconButton onClick={() => navigate('/dashboard')} aria-label="mağaza paneli"
                  sx={{ color: '#e67e22' }}>
                  <StorefrontIcon />
                </IconButton>
              </Tooltip>
            )}
            {isAdmin && (
              <Tooltip title="Admin Paneli">
                <IconButton onClick={() => navigate('/admin')} aria-label="admin paneli"
                  sx={{ color: '#c0392b' }}>
                  <AdminPanelSettingsIcon />
                </IconButton>
              </Tooltip>
            )}
            <IconButton color="inherit" onClick={() => navigate('/gift-picker')} aria-label="hediye seçici">
              <CardGiftcardIcon />
            </IconButton>
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
            <Tooltip title={
              isAuthenticated && user
                ? `${user.name || ''} — ${isAdmin ? 'Admin' : isStoreOwner ? 'Mağaza Sahibi' : 'Müşteri'}`
                : 'Giriş Yap'
            }>
              <IconButton
                onClick={() => navigate(isAuthenticated ? '/profile' : '/login')}
                aria-label="hesap"
              >
                {isAuthenticated && user ? (
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    badgeContent={
                      isAdmin ? (
                        <AdminPanelSettingsIcon sx={{ fontSize: 12, color: '#fff', bgcolor: '#c0392b', borderRadius: '50%', p: '2px' }} />
                      ) : isStoreOwner ? (
                        <StorefrontIcon sx={{ fontSize: 12, color: '#fff', bgcolor: '#e67e22', borderRadius: '50%', p: '2px' }} />
                      ) : null
                    }
                  >
                    <Avatar
                      sx={{
                        width: 28,
                        height: 28,
                        fontSize: 13,
                        fontWeight: 700,
                        bgcolor: isAdmin ? '#c0392b' : isStoreOwner ? '#e67e22' : '#1a6b52',
                      }}
                    >
                      {user.name?.[0]?.toUpperCase() || 'U'}
                    </Avatar>
                  </Badge>
                ) : (
                  <AccountCircleIcon />
                )}
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      <CategoryBar />

      <Container component="main" maxWidth="xl" sx={{ flexGrow: 1, py: 3 }}>
        <Outlet />
      </Container>

      <FloatingCart />

      <Box
        component="footer"
        sx={{
          py: 4,
          px: 3,
          mt: 'auto',
          background: 'linear-gradient(180deg, #faf8f5 0%, #f0ece6 100%)',
          borderTop: '1px solid rgba(44,24,16,0.08)',
          textAlign: 'center',
        }}
      >
        <Typography
          variant="body2"
          sx={{
            color: '#6b5b4e',
            fontFamily: "'DM Sans', sans-serif",
            letterSpacing: '0.02em',
          }}
        >
          &copy; 2026 VeniVidiCoop — Üreticiden tüketiciye, konum bazlı alışveriş
        </Typography>
      </Box>
    </Box>
  );
}
