import { useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';
import Divider from '@mui/material/Divider';
import MenuIcon from '@mui/icons-material/Menu';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import MapIcon from '@mui/icons-material/Map';
import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';
import StorefrontIcon from '@mui/icons-material/Storefront';
import EventIcon from '@mui/icons-material/Event';
import ReceiptIcon from '@mui/icons-material/Receipt';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@store/hooks';
import { selectCartItemCount } from '@store/slices/cartSlice';
import SearchBar from '@components/molecules/SearchBar';

export default function Header() {
  const navigate = useNavigate();
  const cartItemCount = useAppSelector(selectCartItemCount);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const menuItems = [
    { label: 'Ana Sayfa', icon: <HomeIcon />, path: '/' },
    { label: 'Harita', icon: <MapIcon />, path: '/map' },
    { label: 'Ara', icon: <SearchIcon />, path: '/search' },
    { label: 'Mağazalar', icon: <StorefrontIcon />, path: '/stores' },
    { label: 'Randevularım', icon: <EventIcon />, path: '/appointments' },
    { label: 'Siparişlerim', icon: <ReceiptIcon />, path: '/orders' },
  ];

  return (
    <>
      <AppBar position="sticky" color="default" elevation={1} sx={{ bgcolor: 'white' }}>
        <Toolbar sx={{ gap: 1 }}>
          <IconButton
            edge="start"
            onClick={() => setDrawerOpen(true)}
            sx={{ display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography
            variant="h6"
            fontFamily="'Plus Jakarta Sans', sans-serif"
            fontWeight={800}
            color="primary"
            sx={{ cursor: 'pointer', flexShrink: 0 }}
            onClick={() => navigate('/')}
          >
            Beacon Bazaar
          </Typography>

          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2, ml: 3, alignItems: 'center' }}>
            {menuItems.slice(0, 4).map((item) => (
              <Typography
                key={item.path}
                variant="body2"
                sx={{
                  cursor: 'pointer',
                  fontWeight: 500,
                  color: 'text.secondary',
                  '&:hover': { color: 'primary.main' },
                }}
                onClick={() => navigate(item.path)}
              >
                {item.label}
              </Typography>
            ))}
          </Box>

          <Box sx={{ flexGrow: 1, maxWidth: 500, mx: 2, display: { xs: 'none', sm: 'block' } }}>
            <SearchBar onSearch={(q) => navigate(`/search?q=${encodeURIComponent(q)}`)} />
          </Box>

          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton onClick={() => navigate('/cart')}>
              <Badge badgeContent={cartItemCount} color="error">
                <ShoppingCartIcon />
              </Badge>
            </IconButton>
            <IconButton onClick={() => navigate(isAuthenticated ? '/profile' : '/login')}>
              <AccountCircleIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 280, pt: 2 }}>
          <Typography variant="h6" fontWeight={800} color="primary" sx={{ px: 2, mb: 2 }}>
            Beacon Bazaar
          </Typography>
          <Divider />
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.path} disablePadding>
                <ListItemButton
                  onClick={() => {
                    navigate(item.path);
                    setDrawerOpen(false);
                  }}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
    </>
  );
}
