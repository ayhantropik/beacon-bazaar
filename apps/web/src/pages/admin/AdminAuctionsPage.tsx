import { useEffect, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import Pagination from '@mui/material/Pagination';
import Skeleton from '@mui/material/Skeleton';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import GavelIcon from '@mui/icons-material/Gavel';
import VisibilityIcon from '@mui/icons-material/Visibility';
import adminService from '@services/api/admin.service';

const statusMap: Record<string, { label: string; color: 'success' | 'warning' | 'error' | 'default' }> = {
  active: { label: 'Aktif', color: 'success' },
  ended: { label: 'Sona Erdi', color: 'default' },
  cancelled: { label: 'İptal', color: 'error' },
};

export default function AdminAuctionsPage() {
  const [tab, setTab] = useState(0);
  const [auctions, setAuctions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' as 'success' | 'error' });

  // Bids dialog
  const [bidsDialog, setBidsDialog] = useState<{ open: boolean; bids: any[]; title: string }>({ open: false, bids: [], title: '' });

  const statusFilter = tab === 0 ? 'active' : tab === 1 ? 'ended' : undefined;

  const fetchAuctions = useCallback(() => {
    setLoading(true);
    const params: Record<string, any> = { page, limit: 20 };
    if (statusFilter) params.status = statusFilter;
    adminService.getAuctions(params)
      .then((res) => { setAuctions(res.data || []); setTotalPages(res.pagination?.totalPages || 1); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, statusFilter]);

  useEffect(() => { fetchAuctions(); }, [fetchAuctions]);

  const viewBids = async (auctionId: string, productName: string) => {
    try {
      const res = await adminService.getAuction(auctionId);
      setBidsDialog({ open: true, bids: res.bids || [], title: productName });
    } catch {
      setSnack({ open: true, msg: 'Teklifler yüklenemedi', severity: 'error' });
    }
  };

  const handleEndAuction = async (id: string) => {
    try {
      await adminService.updateAuctionStatus(id, 'ended');
      setSnack({ open: true, msg: 'Açık artırma sonlandırıldı', severity: 'success' });
      fetchAuctions();
    } catch {
      setSnack({ open: true, msg: 'İşlem başarısız', severity: 'error' });
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>Açık Artırma Yönetimi</Typography>

      <Tabs value={tab} onChange={(_, v) => { setTab(v); setPage(1); }} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Aktif" />
        <Tab label="Geçmiş" />
        <Tab label="Tümü" />
      </Tabs>

      {loading ? (
        <Skeleton variant="rounded" height={400} />
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Ürün</TableCell>
                <TableCell>Kategori</TableCell>
                <TableCell align="right">Başlangıç</TableCell>
                <TableCell align="right">Güncel En Yüksek</TableCell>
                <TableCell align="center">Teklifler</TableCell>
                <TableCell align="center">Durum</TableCell>
                <TableCell align="center">Tarih</TableCell>
                <TableCell align="center" sx={{ width: 120 }}>İşlem</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {auctions.length === 0 ? (
                <TableRow><TableCell colSpan={8} align="center"><Typography color="text.secondary" py={3}>Açık artırma bulunamadı</Typography></TableCell></TableRow>
              ) : auctions.map((a) => {
                const st = statusMap[a.status] || { label: a.status, color: 'default' as const };
                return (
                  <TableRow key={a.id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Avatar variant="rounded" src={a.product?.thumbnail} sx={{ width: 40, height: 40 }}>
                          <GavelIcon />
                        </Avatar>
                        <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 200 }}>
                          {a.product?.name || 'Ürün'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell><Typography variant="body2">{a.category || '-'}</Typography></TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">{Number(a.startingPrice).toLocaleString('tr-TR')} ₺</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={700} color="primary.main">
                        {a.currentHighestBid ? `${Number(a.currentHighestBid).toLocaleString('tr-TR')} ₺` : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={a.totalBids || 0} size="small" />
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={st.label} color={st.color} size="small" />
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="caption">{a.auctionDate}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" onClick={() => viewBids(a.id, a.product?.name || 'Ürün')}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                      {a.status === 'active' && (
                        <Button size="small" color="error" onClick={() => handleEndAuction(a.id)}>Bitir</Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={2}>
          <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" />
        </Box>
      )}

      {/* Bids Dialog */}
      <Dialog open={bidsDialog.open} onClose={() => setBidsDialog({ open: false, bids: [], title: '' })} maxWidth="sm" fullWidth>
        <DialogTitle>Teklifler — {bidsDialog.title}</DialogTitle>
        <DialogContent>
          {bidsDialog.bids.length === 0 ? (
            <Typography color="text.secondary" py={2}>Henüz teklif yok</Typography>
          ) : (
            <List dense>
              {bidsDialog.bids.map((b: any, i: number) => (
                <ListItem key={b.id || i} divider>
                  <ListItemText
                    primary={`${b.userName} — ${Number(b.bidPrice).toLocaleString('tr-TR')} ₺ × ${b.bidQuantity} adet`}
                    secondary={`${new Date(b.createdAt).toLocaleString('tr-TR')} · ${b.status}`}
                  />
                  <Chip label={b.status} size="small" color={b.status === 'active' ? 'warning' : 'default'} />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={snack.severity} variant="filled">{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
