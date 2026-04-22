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
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Avatar from '@mui/material/Avatar';
import MenuIcon from '@mui/icons-material/Menu';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import MapIcon from '@mui/icons-material/Map';
import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';
import StorefrontIcon from '@mui/icons-material/Storefront';
import EventIcon from '@mui/icons-material/Event';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import Tooltip from '@mui/material/Tooltip';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@store/hooks';
import { logout } from '@store/slices/authSlice';
import { selectCartItemCount } from '@store/slices/cartSlice';
import SearchBar from '@components/molecules/SearchBar';

export default function Header() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const cartItemCount = useAppSelector(selectCartItemCount);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const user = useAppSelector((state) => state.auth.user);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);

  const handleLogout = async () => {
    setUserMenuAnchor(null);
    await dispatch(logout());
    navigate('/');
  };

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
            VeniVidiCoop
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

          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
            <IconButton onClick={() => navigate('/cart')}>
              <Badge badgeContent={cartItemCount} color="error">
                <ShoppingCartIcon />
              </Badge>
            </IconButton>
            <Tooltip title={
              isAuthenticated && user
                ? `${(user as any).name || ''} — ${(user as any).role === 'admin' ? 'Admin' : (user as any).role === 'store_owner' ? 'Mağaza Sahibi' : 'Müşteri'}`
                : 'Giriş Yap'
            }>
              <IconButton onClick={(e) => setUserMenuAnchor(e.currentTarget)}>
                {isAuthenticated && user ? (
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    badgeContent={
                      (user as any).role === 'admin' ? (
                        <AdminPanelSettingsIcon sx={{ fontSize: 14, color: '#fff', bgcolor: '#c0392b', borderRadius: '50%', p: '1px' }} />
                      ) : (user as any).role === 'store_owner' ? (
                        <StorefrontIcon sx={{ fontSize: 14, color: '#fff', bgcolor: '#e67e22', borderRadius: '50%', p: '1px' }} />
                      ) : null
                    }
                  >
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        fontSize: 14,
                        bgcolor: (user as any).role === 'admin'
                          ? '#c0392b'
                          : (user as any).role === 'store_owner'
                            ? '#e67e22'
                            : 'primary.main',
                        border: (user as any).role !== 'customer'
                          ? `2px solid ${(user as any).role === 'admin' ? '#c0392b' : '#e67e22'}`
                          : 'none',
                      }}
                    >
                      {(user as any).name?.[0]?.toUpperCase() || 'U'}
                    </Avatar>
                  </Badge>
                ) : (
                  <AccountCircleIcon />
                )}
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={userMenuAnchor}
              open={Boolean(userMenuAnchor)}
              onClose={() => setUserMenuAnchor(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              slotProps={{ paper: { sx: { minWidth: 200, mt: 1 } } }}
            >
              {isAuthenticated ? [
                <Box key="user-info" sx={{ px: 2, py: 1, borderBottom: '1px solid #eee' }}>
                  <Typography variant="subtitle2" fontWeight={700}>
                    {(user as any)?.name} {(user as any)?.surname}
                  </Typography>
                  <Typography variant="caption" sx={{
                    color: '#fff',
                    bgcolor: (user as any)?.role === 'admin' ? '#c0392b' : (user as any)?.role === 'store_owner' ? '#e67e22' : '#1a6b52',
                    px: 1, py: 0.25, borderRadius: 1, fontSize: 10, fontWeight: 600,
                  }}>
                    {(user as any)?.role === 'admin' ? 'Admin' : (user as any)?.role === 'store_owner' ? 'Mağaza Sahibi' : 'Müşteri'}
                  </Typography>
                </Box>,
                <MenuItem key="profile" onClick={() => { setUserMenuAnchor(null); navigate('/profile'); }}>
                  <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
                  <ListItemText>Profilim</ListItemText>
                </MenuItem>,
                <MenuItem key="orders" onClick={() => { setUserMenuAnchor(null); navigate('/orders'); }}>
                  <ListItemIcon><ReceiptIcon fontSize="small" /></ListItemIcon>
                  <ListItemText>Siparişlerim</ListItemText>
                </MenuItem>,
                ...((user as any)?.role === 'store_owner' ? [
                  <MenuItem key="dashboard" onClick={() => { setUserMenuAnchor(null); navigate('/dashboard'); }}>
                    <ListItemIcon><StorefrontIcon fontSize="small" sx={{ color: '#e67e22' }} /></ListItemIcon>
                    <ListItemText>Mağaza Paneli</ListItemText>
                  </MenuItem>,
                ] : []),
                ...((user as any)?.role === 'admin' ? [
                  <MenuItem key="admin" onClick={() => { setUserMenuAnchor(null); navigate('/admin'); }}>
                    <ListItemIcon><AdminPanelSettingsIcon fontSize="small" sx={{ color: '#c0392b' }} /></ListItemIcon>
                    <ListItemText>Admin Paneli</ListItemText>
                  </MenuItem>,
                ] : []),
                <Divider key="div" />,
                <MenuItem key="logout" onClick={handleLogout} sx={{ color: 'error.main' }}>
                  <ListItemIcon><LogoutIcon fontSize="small" color="error" /></ListItemIcon>
                  <ListItemText>Çıkış Yap</ListItemText>
                </MenuItem>,
              ] : [
                <MenuItem key="login" onClick={() => { setUserMenuAnchor(null); navigate('/login'); }}>
                  <ListItemIcon><LoginIcon fontSize="small" /></ListItemIcon>
                  <ListItemText>Giriş Yap</ListItemText>
                </MenuItem>,
                <MenuItem key="register" onClick={() => { setUserMenuAnchor(null); navigate('/register'); }}>
                  <ListItemIcon><PersonAddIcon fontSize="small" /></ListItemIcon>
                  <ListItemText>Kayıt Ol</ListItemText>
                </MenuItem>,
              ]}
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 280, pt: 2 }}>
          <Typography variant="h6" fontWeight={800} color="primary" sx={{ px: 2, mb: 2 }}>
            VeniVidiCoop
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
