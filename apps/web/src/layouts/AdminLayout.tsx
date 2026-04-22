import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import StorefrontIcon from '@mui/icons-material/Storefront';
import InventoryIcon from '@mui/icons-material/Inventory';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import GavelIcon from '@mui/icons-material/Gavel';
import ShieldIcon from '@mui/icons-material/Shield';
import NotificationsIcon from '@mui/icons-material/Notifications';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import BuildIcon from '@mui/icons-material/Build';
import LogoutIcon from '@mui/icons-material/Logout';
import HomeIcon from '@mui/icons-material/Home';
import { useAppSelector, useAppDispatch } from '@store/hooks';
import { logout } from '@store/slices/authSlice';

const DRAWER_WIDTH = 260;

const menuItems = [
  { label: 'Genel Bakış', path: '/admin', icon: <DashboardIcon /> },
  { label: 'Kullanıcılar', path: '/admin/users', icon: <PeopleIcon /> },
  { label: 'Mağazalar', path: '/admin/stores', icon: <StorefrontIcon /> },
  { label: 'Profesyonel Hizmetler', path: '/admin/services', icon: <BuildIcon /> },
  { label: 'Ürünler', path: '/admin/products', icon: <InventoryIcon /> },
  { label: 'Siparişler', path: '/admin/orders', icon: <ShoppingCartIcon /> },
  { label: 'Açık Artırmalar', path: '/admin/auctions', icon: <GavelIcon /> },
  { label: 'Moderasyon', path: '/admin/moderation', icon: <ShieldIcon /> },
  { label: 'Aidat Yönetimi', path: '/admin/subscriptions', icon: <ReceiptLongIcon /> },
  { label: 'Bildirimler', path: '/admin/notifications', icon: <NotificationsIcon /> },
  { label: 'Raporlar', path: '/admin/reports', icon: <BarChartIcon /> },
  { label: 'Ayarlar', path: '/admin/settings', icon: <SettingsIcon /> },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Guard: admin değilse anasayfaya yönlendir
  if (!isAuthenticated || user?.role !== 'admin') {
    navigate('/');
    return null;
  }

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo */}
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ bgcolor: '#d32f2f', width: 36, height: 36, fontSize: 16, fontWeight: 800 }}>BB</Avatar>
        <Box>
          <Typography variant="subtitle1" fontWeight={800} color="primary" lineHeight={1.2}>
            VeniVidiCoop
          </Typography>
          <Typography variant="caption" color="text.secondary">Admin Panel</Typography>
        </Box>
      </Box>

      <Divider />

      {/* Menu */}
      <List sx={{ flex: 1, px: 1, py: 1 }}>
        {menuItems.map((item) => (
          <ListItemButton
            key={item.path}
            selected={isActive(item.path)}
            onClick={() => { navigate(item.path); setMobileOpen(false); }}
            sx={{
              borderRadius: 2,
              mb: 0.3,
              '&.Mui-selected': {
                bgcolor: 'primary.main',
                color: '#fff',
                '& .MuiListItemIcon-root': { color: '#fff' },
                '&:hover': { bgcolor: 'primary.dark' },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }} />
          </ListItemButton>
        ))}
      </List>

      <Divider />

      {/* Bottom actions */}
      <List sx={{ px: 1, py: 1 }}>
        <ListItemButton onClick={() => navigate('/')} sx={{ borderRadius: 2, mb: 0.3 }}>
          <ListItemIcon sx={{ minWidth: 40 }}><HomeIcon /></ListItemIcon>
          <ListItemText primary="Ana Sayfaya Dön" primaryTypographyProps={{ fontSize: 14 }} />
        </ListItemButton>
        <ListItemButton onClick={() => { dispatch(logout()); navigate('/login'); }} sx={{ borderRadius: 2, color: 'error.main' }}>
          <ListItemIcon sx={{ minWidth: 40, color: 'error.main' }}><LogoutIcon /></ListItemIcon>
          <ListItemText primary="Çıkış Yap" primaryTypographyProps={{ fontSize: 14 }} />
        </ListItemButton>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, borderRight: '1px solid #e0e0e0' },
        }}
        open
      >
        {drawerContent}
      </Drawer>

      {/* Main content */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', ml: { md: `${DRAWER_WIDTH}px` }, width: { xs: '100%', md: `calc(100% - ${DRAWER_WIDTH}px)` } }}>
        <AppBar position="sticky" color="default" elevation={1} sx={{ display: { md: 'none' } }}>
          <Toolbar>
            <IconButton edge="start" onClick={() => setMobileOpen(true)}>
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" fontWeight={700} color="primary" sx={{ flexGrow: 1 }}>
              Admin Panel
            </Typography>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 14 }}>
              {user?.name?.charAt(0) || 'A'}
            </Avatar>
          </Toolbar>
        </AppBar>

        {/* Top bar for desktop */}
        <Box sx={{
          display: { xs: 'none', md: 'flex' },
          alignItems: 'center',
          justifyContent: 'flex-end',
          px: 3,
          py: 1.5,
          bgcolor: '#fff',
          borderBottom: '1px solid #e0e0e0',
          gap: 1.5,
        }}>
          <Typography variant="body2" color="text.secondary">
            {user?.name} {user?.surname}
          </Typography>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 14 }}>
            {user?.name?.charAt(0) || 'A'}
          </Avatar>
        </Box>

        <Box sx={{ p: { xs: 2, md: 3 }, flexGrow: 1 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
