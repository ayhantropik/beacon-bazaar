import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import Rating from '@mui/material/Rating';
import DeleteIcon from '@mui/icons-material/Delete';
import StorefrontIcon from '@mui/icons-material/Storefront';
import SearchIcon from '@mui/icons-material/Search';
import StarOutlineIcon from '@mui/icons-material/StarOutline';
import apiClient from '@services/api/client';
import { savedSearchService } from '@services/api/saved-search.service';

interface FavorilerSectionProps {
  context: 'oto' | 'emlak';
}

export default function FavorilerSection({ context }: FavorilerSectionProps) {
  const [tab, setTab] = useState(0);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [savedSearches, setSavedSearches] = useState<any[]>([]);
  const [followedStores, setFollowedStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [tab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (tab === 0) {
        const res = await apiClient.get('/favorites?limit=20');
        setFavorites(res.data?.data || []);
      } else if (tab === 1) {
        const res = await savedSearchService.getAll(context);
        setSavedSearches(res.data || []);
      } else {
        const res = await apiClient.get('/stores/my-follows?limit=20');
        setFollowedStores(res.data?.data || []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleDeleteSearch = async (id: string) => {
    try {
      await savedSearchService.remove(id);
      setSavedSearches((prev) => prev.filter((s) => s.id !== id));
    } catch { /* ignore */ }
  };

  const handleUnfollow = async (storeId: string) => {
    try {
      await apiClient.post(`/stores/${storeId}/follow`);
      setFollowedStores((prev) => prev.filter((s) => s.id !== storeId));
    } catch { /* ignore */ }
  };

  const handleRemoveFavorite = async (productId: string) => {
    try {
      await apiClient.post(`/favorites/${productId}/toggle`);
      setFavorites((prev) => prev.filter((f) => f.id !== productId));
    } catch { /* ignore */ }
  };

  const renderSkeleton = () => (
    <Box sx={{ p: 2 }}>
      {[1, 2, 3].map((i) => <Skeleton key={i} height={60} sx={{ mb: 1 }} />)}
    </Box>
  );

  const renderEmpty = (text: string) => (
    <Box sx={{ p: 4, textAlign: 'center' }}>
      <StarOutlineIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
      <Typography variant="body2" color="text.secondary">{text}</Typography>
    </Box>
  );

  return (
    <Box>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth" sx={{ borderBottom: '1px solid #eee' }}>
        <Tab label="İlanlarım" sx={{ fontSize: '0.75rem', minHeight: 42 }} />
        <Tab label="Aramalarım" sx={{ fontSize: '0.75rem', minHeight: 42 }} />
        <Tab label="Satıcılarım" sx={{ fontSize: '0.75rem', minHeight: 42 }} />
      </Tabs>

      {loading ? renderSkeleton() : (
        <>
          {/* Favori İlanlar */}
          {tab === 0 && (
            favorites.length === 0 ? renderEmpty('Henüz favori ilanınız yok') : (
              <List disablePadding>
                {favorites.map((product) => (
                  <ListItemButton key={product.id} sx={{ py: 1.5 }}>
                    <ListItemIcon sx={{ minWidth: 56 }}>
                      <Avatar
                        variant="rounded"
                        src={product.thumbnail}
                        sx={{ width: 48, height: 48 }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={product.name}
                      secondary={`${(product.salePrice || product.price)?.toLocaleString('tr-TR')} ₺`}
                      primaryTypographyProps={{ fontWeight: 600, fontSize: '0.85rem', noWrap: true }}
                      secondaryTypographyProps={{ color: 'primary', fontWeight: 700 }}
                    />
                    <ListItemSecondaryAction>
                      <IconButton size="small" onClick={() => handleRemoveFavorite(product.id)}>
                        <DeleteIcon fontSize="small" color="error" />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItemButton>
                ))}
              </List>
            )
          )}

          {/* Favori Aramalar */}
          {tab === 1 && (
            savedSearches.length === 0 ? renderEmpty('Henüz kayıtlı aramanız yok') : (
              <List disablePadding>
                {savedSearches.map((search) => (
                  <ListItemButton key={search.id} sx={{ py: 1.5 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <SearchIcon color="action" />
                    </ListItemIcon>
                    <ListItemText
                      primary={search.name}
                      secondary={
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                          {Object.entries(search.filters || {}).slice(0, 3).map(([key, val]) => (
                            <Chip key={key} label={`${val}`} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 20 }} />
                          ))}
                        </Box>
                      }
                      primaryTypographyProps={{ fontWeight: 600, fontSize: '0.85rem' }}
                    />
                    <ListItemSecondaryAction>
                      <IconButton size="small" onClick={() => handleDeleteSearch(search.id)}>
                        <DeleteIcon fontSize="small" color="error" />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItemButton>
                ))}
              </List>
            )
          )}

          {/* Favori Satıcılar */}
          {tab === 2 && (
            followedStores.length === 0 ? renderEmpty('Henüz takip ettiğiniz satıcı yok') : (
              <List disablePadding>
                {followedStores.map((store) => (
                  <ListItemButton key={store.id} sx={{ py: 1.5 }}>
                    <ListItemIcon sx={{ minWidth: 48 }}>
                      <Avatar src={store.logo} sx={{ width: 40, height: 40 }}>
                        <StorefrontIcon />
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={store.name}
                      secondary={
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <Rating value={store.ratingAverage || 0} size="small" readOnly sx={{ fontSize: '0.75rem' }} />
                          <Typography variant="caption" color="text.secondary">({store.ratingCount || 0})</Typography>
                        </Box>
                      }
                      primaryTypographyProps={{ fontWeight: 600, fontSize: '0.85rem' }}
                    />
                    <ListItemSecondaryAction>
                      <IconButton size="small" onClick={() => handleUnfollow(store.id)}>
                        <DeleteIcon fontSize="small" color="error" />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItemButton>
                ))}
              </List>
            )
          )}
        </>
      )}
    </Box>
  );
}
