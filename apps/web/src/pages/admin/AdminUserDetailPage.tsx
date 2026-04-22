import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Divider from '@mui/material/Divider';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import adminService from '@services/api/admin.service';

const roleLabels: Record<string, string> = { customer: 'Müşteri', store_owner: 'Mağaza Sahibi', admin: 'Admin' };

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' as 'success' | 'error' });
  const [roleDialog, setRoleDialog] = useState(false);
  const [newRole, setNewRole] = useState('');

  useEffect(() => {
    if (!id) return;
    adminService.getUser(id)
      .then((res) => { setUser(res.data); setNewRole(res.data?.role || ''); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleRoleChange = async () => {
    if (!id) return;
    try {
      await adminService.updateUserRole(id, newRole);
      setUser((u: any) => ({ ...u, role: newRole }));
      setSnack({ open: true, msg: 'Rol güncellendi', severity: 'success' });
      setRoleDialog(false);
    } catch {
      setSnack({ open: true, msg: 'Rol güncellenemedi', severity: 'error' });
    }
  };

  const handleStatusToggle = async () => {
    if (!id || !user) return;
    try {
      await adminService.updateUserStatus(id, !user.isActive);
      setUser((u: any) => ({ ...u, isActive: !u.isActive }));
      setSnack({ open: true, msg: user.isActive ? 'Kullanıcı deaktif edildi' : 'Kullanıcı aktifleştirildi', severity: 'success' });
    } catch {
      setSnack({ open: true, msg: 'İşlem başarısız', severity: 'error' });
    }
  };

  if (loading) return <Box><Skeleton variant="rounded" height={200} /><Skeleton variant="rounded" height={200} sx={{ mt: 2 }} /></Box>;
  if (!user) return <Typography color="error">Kullanıcı bulunamadı</Typography>;

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/admin/users')} sx={{ mb: 2 }}>Geri</Button>

      <Card sx={{ borderRadius: 3, mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
            <Avatar src={user.avatar} sx={{ width: 72, height: 72, bgcolor: '#0099cc' }}>
              <PersonIcon sx={{ fontSize: 36 }} />
            </Avatar>
            <Box flex={1} minWidth={200}>
              <Typography variant="h5" fontWeight={700}>{user.name} {user.surname}</Typography>
              <Typography variant="body2" color="text.secondary">{user.email}</Typography>
              {user.phone && <Typography variant="body2" color="text.secondary">{user.phone}</Typography>}
              <Box display="flex" gap={1} mt={1}>
                <Chip label={roleLabels[user.role] || user.role} color={user.role === 'admin' ? 'error' : user.role === 'store_owner' ? 'primary' : 'default'} size="small" />
                <Chip label={user.isActive ? 'Aktif' : 'Pasif'} color={user.isActive ? 'success' : 'default'} size="small" />
              </Box>
            </Box>
            <Box display="flex" gap={1}>
              <Button variant="outlined" onClick={() => setRoleDialog(true)}>Rol Değiştir</Button>
              <Button variant="outlined" color={user.isActive ? 'error' : 'success'} onClick={handleStatusToggle}>
                {user.isActive ? 'Deaktif Et' : 'Aktifleştir'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>Detaylar</Typography>
              <Divider sx={{ mb: 2 }} />
              {[
                { label: 'ID', value: user.id },
                { label: 'Kayıt Tarihi', value: new Date(user.createdAt).toLocaleString('tr-TR') },
                { label: 'Son Güncelleme', value: user.updatedAt ? new Date(user.updatedAt).toLocaleString('tr-TR') : '-' },
                { label: 'Sipariş Sayısı', value: user.ordersCount || 0 },
              ].map((item) => (
                <Box key={item.label} display="flex" justifyContent="space-between" py={0.5}>
                  <Typography variant="body2" color="text.secondary">{item.label}</Typography>
                  <Typography variant="body2" fontWeight={500}>{item.value}</Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Role Dialog */}
      <Dialog open={roleDialog} onClose={() => setRoleDialog(false)}>
        <DialogTitle>Kullanıcı Rolünü Değiştir</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>Yeni Rol</InputLabel>
            <Select value={newRole} label="Yeni Rol" onChange={(e) => setNewRole(e.target.value)}>
              <MenuItem value="customer">Müşteri</MenuItem>
              <MenuItem value="store_owner">Mağaza Sahibi</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoleDialog(false)}>İptal</Button>
          <Button variant="contained" onClick={handleRoleChange} disabled={newRole === user.role}>Güncelle</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={snack.severity} variant="filled">{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
