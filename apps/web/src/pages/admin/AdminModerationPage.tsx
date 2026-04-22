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
import IconButton from '@mui/material/IconButton';
import Pagination from '@mui/material/Pagination';
import Skeleton from '@mui/material/Skeleton';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import DeleteIcon from '@mui/icons-material/Delete';
import StarIcon from '@mui/icons-material/Star';
import adminService from '@services/api/admin.service';

export default function AdminModerationPage() {
  const [tab, setTab] = useState(0);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' as 'success' | 'error' });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string; type: string }>({ open: false, id: '', type: '' });

  const fetchData = useCallback(() => {
    setLoading(true);
    const fn = tab === 0 ? adminService.getReviews : adminService.getQuestions;
    fn({ page, limit: 20 })
      .then((res) => { setData(res.data || []); setTotalPages(res.pagination?.totalPages || 1); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tab, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async () => {
    try {
      if (deleteDialog.type === 'review') {
        await adminService.deleteReview(deleteDialog.id);
      } else {
        await adminService.deleteQuestion(deleteDialog.id);
      }
      setSnack({ open: true, msg: 'Silindi', severity: 'success' });
      setDeleteDialog({ open: false, id: '', type: '' });
      fetchData();
    } catch {
      setSnack({ open: true, msg: 'Silinemedi', severity: 'error' });
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>İçerik Moderasyonu</Typography>

      <Tabs value={tab} onChange={(_, v) => { setTab(v); setPage(1); }} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Değerlendirmeler" />
        <Tab label="Sorular" />
      </Tabs>

      {loading ? (
        <Skeleton variant="rounded" height={400} />
      ) : tab === 0 ? (
        /* Reviews Table */
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Kullanıcı</TableCell>
                <TableCell>Mağaza</TableCell>
                <TableCell align="center">Puan</TableCell>
                <TableCell>Yorum</TableCell>
                <TableCell align="right">Tarih</TableCell>
                <TableCell align="center" sx={{ width: 60 }}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center"><Typography color="text.secondary" py={3}>Değerlendirme bulunamadı</Typography></TableCell></TableRow>
              ) : data.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell><Typography variant="body2">{r.userName}</Typography></TableCell>
                  <TableCell><Typography variant="body2">{r.storeName}</Typography></TableCell>
                  <TableCell align="center">
                    <Box display="flex" alignItems="center" justifyContent="center" gap={0.3}>
                      <StarIcon sx={{ fontSize: 16, color: '#f59e0b' }} />
                      <Typography variant="body2">{r.rating}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>{r.comment || '-'}</Typography>
                  </TableCell>
                  <TableCell align="right"><Typography variant="caption">{new Date(r.createdAt).toLocaleDateString('tr-TR')}</Typography></TableCell>
                  <TableCell align="center">
                    <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, id: r.id, type: 'review' })}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        /* Questions Table */
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Kullanıcı</TableCell>
                <TableCell>Soru</TableCell>
                <TableCell align="center">Tür</TableCell>
                <TableCell align="center">Cevaplandı</TableCell>
                <TableCell align="right">Tarih</TableCell>
                <TableCell align="center" sx={{ width: 60 }}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center"><Typography color="text.secondary" py={3}>Soru bulunamadı</Typography></TableCell></TableRow>
              ) : data.map((q) => (
                <TableRow key={q.id} hover>
                  <TableCell><Typography variant="body2">{q.userName}</Typography></TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>{q.content}</Typography>
                  </TableCell>
                  <TableCell align="center"><Chip label={q.listingType || '-'} size="small" /></TableCell>
                  <TableCell align="center">
                    <Chip label={q.isAnswered ? 'Evet' : 'Hayır'} color={q.isAnswered ? 'success' : 'default'} size="small" />
                  </TableCell>
                  <TableCell align="right"><Typography variant="caption">{new Date(q.createdAt).toLocaleDateString('tr-TR')}</Typography></TableCell>
                  <TableCell align="center">
                    <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, id: q.id, type: 'question' })}>
                      <DeleteIcon fontSize="small" />
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

      {/* Delete Confirmation */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, id: '', type: '' })}>
        <DialogTitle>Bu içeriği silmek istediğinize emin misiniz?</DialogTitle>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, id: '', type: '' })}>İptal</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>Sil</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={snack.severity} variant="filled">{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
