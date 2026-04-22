import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Switch from '@mui/material/Switch';
import Pagination from '@mui/material/Pagination';
import Skeleton from '@mui/material/Skeleton';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Tooltip from '@mui/material/Tooltip';
import PeopleIcon from '@mui/icons-material/People';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import VisibilityIcon from '@mui/icons-material/Visibility';
import adminService from '@services/api/admin.service';

const roleLabels: Record<string, string> = { customer: 'Müşteri', store_owner: 'Mağaza Sahibi', admin: 'Admin' };
const roleColors: Record<string, 'default' | 'primary' | 'error'> = { customer: 'default', store_owner: 'primary', admin: 'error' };

const formatCurrency = (v: number) => v.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' ₺';

export default function AdminUsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState(0);
  const tabRoles = ['', 'customer', 'admin'];
  const roleFilter = tabRoles[tab];
  const [statusFilter, setStatusFilter] = useState('');
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' as 'success' | 'error' });

  const [roleDialog, setRoleDialog] = useState<{ open: boolean; userId: string; currentRole: string }>({ open: false, userId: '', currentRole: '' });
  const [newRole, setNewRole] = useState('');

  const fetchUsers = useCallback(() => {
    setLoading(true);
    const params: Record<string, any> = { page, limit: 20 };
    if (search) params.search = search;
    if (roleFilter) params.role = roleFilter;
    if (statusFilter) params.status = statusFilter;
    adminService.getUsers(params)
      .then((res: any) => { setUsers(res.data || []); setTotalPages(res.pagination?.totalPages || 1); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, search, roleFilter, statusFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleStatusToggle = async (userId: string, currentActive: boolean) => {
    try {
      await adminService.updateUserStatus(userId, !currentActive);
      setSnack({ open: true, msg: !currentActive ? 'Kullanıcı aktifleştirildi' : 'Kullanıcı deaktif edildi', severity: 'success' });
      fetchUsers();
    } catch {
      setSnack({ open: true, msg: 'İşlem başarısız', severity: 'error' });
    }
  };

  const handleRoleChange = async () => {
    try {
      await adminService.updateUserRole(roleDialog.userId, newRole);
      setSnack({ open: true, msg: 'Rol güncellendi', severity: 'success' });
      setRoleDialog({ open: false, userId: '', currentRole: '' });
      fetchUsers();
    } catch {
      setSnack({ open: true, msg: 'Rol güncellenemedi', severity: 'error' });
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={2}>Kullanıcı Yönetimi</Typography>

      <Tabs
        value={tab}
        onChange={(_, v) => { setTab(v); setPage(1); }}
        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Tümü" />
        <Tab icon={<PeopleIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Müşteriler" />
        <Tab icon={<AdminPanelSettingsIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Adminler" />
      </Tabs>

      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        <TextField
          size="small"
          placeholder="İsim, email ara..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          sx={{ minWidth: 250 }}
        />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Durum</InputLabel>
          <Select value={statusFilter} label="Durum" onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <MenuItem value="">Tümü</MenuItem>
            <MenuItem value="active">Aktif</MenuItem>
            <MenuItem value="inactive">Pasif</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {loading ? (
        <Skeleton variant="rounded" height={400} />
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Kullanıcı</TableCell>
                <TableCell>Email</TableCell>
                <TableCell align="center">Rol</TableCell>
                <TableCell align="center">Sipariş</TableCell>
                <TableCell align="center">Harcama</TableCell>
                <TableCell align="center">Durum</TableCell>
                <TableCell align="right">Kayıt Tarihi</TableCell>
                <TableCell align="center" sx={{ width: 60 }}>İşlem</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.length === 0 ? (
                <TableRow><TableCell colSpan={8} align="center"><Typography color="text.secondary" py={3}>Kullanıcı bulunamadı</Typography></TableCell></TableRow>
              ) : users.map((u) => (
                <TableRow key={u.id} hover>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <Avatar src={u.avatar} sx={{ width: 36, height: 36 }}>{(u.name || '?')[0]}</Avatar>
                      <Typography variant="body2" fontWeight={600}>{u.name} {u.surname}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell><Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</Typography></TableCell>
                  <TableCell align="center">
                    <Chip
                      label={roleLabels[u.role] || u.role}
                      color={roleColors[u.role] || 'default'}
                      size="small"
                      onClick={() => { setRoleDialog({ open: true, userId: u.id, currentRole: u.role }); setNewRole(u.role); }}
                      sx={{ cursor: 'pointer' }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Toplam sipariş sayısı">
                      <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                        <ShoppingCartIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
                        <Typography variant="body2" fontWeight={600}>{u.ordersCount || 0}</Typography>
                      </Box>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" fontWeight={500} color={u.totalSpent > 0 ? 'success.main' : 'text.secondary'}>
                      {u.totalSpent > 0 ? formatCurrency(u.totalSpent) : '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Switch checked={u.isActive} size="small" onChange={() => handleStatusToggle(u.id, u.isActive)} />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="caption">{new Date(u.createdAt).toLocaleDateString('tr-TR')}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" onClick={() => navigate(`/admin/users/${u.id}`)}>
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={2}>
          <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" />
        </Box>
      )}

      <Dialog open={roleDialog.open} onClose={() => setRoleDialog({ open: false, userId: '', currentRole: '' })}>
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
          <Button onClick={() => setRoleDialog({ open: false, userId: '', currentRole: '' })}>İptal</Button>
          <Button variant="contained" onClick={handleRoleChange} disabled={newRole === roleDialog.currentRole}>Güncelle</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={snack.severity} variant="filled">{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
