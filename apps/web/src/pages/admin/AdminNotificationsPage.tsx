import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Pagination from '@mui/material/Pagination';
import Divider from '@mui/material/Divider';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import SendIcon from '@mui/icons-material/Send';
import NotificationsIcon from '@mui/icons-material/Notifications';
import adminService from '@services/api/admin.service';

export default function AdminNotificationsPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState('system');
  const [sending, setSending] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' as 'success' | 'error' });

  // History
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [histPage, setHistPage] = useState(1);
  const [histTotalPages, setHistTotalPages] = useState(1);

  useEffect(() => {
    setHistoryLoading(true);
    adminService.getNotificationHistory({ page: histPage, limit: 20 })
      .then((res) => { setHistory(res.data || []); setHistTotalPages(res.pagination?.totalPages || 1); })
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, [histPage]);

  const handleBroadcast = async () => {
    if (!title.trim() || !body.trim()) return;
    setSending(true);
    try {
      const res = await adminService.broadcastNotification({ title, body, type });
      setSnack({ open: true, msg: res.message || 'Bildirim gönderildi', severity: 'success' });
      setTitle('');
      setBody('');
      setHistPage(1);
    } catch {
      setSnack({ open: true, msg: 'Bildirim gönderilemedi', severity: 'error' });
    }
    setSending(false);
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>Bildirim Yönetimi</Typography>

      {/* Broadcast Form */}
      <Card sx={{ borderRadius: 3, mb: 3, maxWidth: 700 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <NotificationsIcon color="primary" />
            <Typography variant="h6" fontWeight={600}>Toplu Bildirim Gönder</Typography>
          </Box>

          <TextField
            label="Başlık"
            fullWidth
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            label="İçerik"
            fullWidth
            multiline
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Tip</InputLabel>
            <Select value={type} label="Tip" onChange={(e) => setType(e.target.value)}>
              <MenuItem value="system">Sistem Bildirimi</MenuItem>
              <MenuItem value="promotion">Promosyon</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={sending ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
            onClick={handleBroadcast}
            disabled={sending || !title.trim() || !body.trim()}
          >
            {sending ? 'Gönderiliyor...' : 'Tüm Kullanıcılara Gönder'}
          </Button>
        </CardContent>
      </Card>

      {/* History */}
      <Typography variant="h6" fontWeight={600} mb={2}>Bildirim Geçmişi</Typography>
      <Divider sx={{ mb: 2 }} />

      {historyLoading ? (
        <Typography color="text.secondary">Yükleniyor...</Typography>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Başlık</TableCell>
                <TableCell>İçerik</TableCell>
                <TableCell align="center">Tip</TableCell>
                <TableCell align="right">Tarih</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {history.length === 0 ? (
                <TableRow><TableCell colSpan={4} align="center"><Typography color="text.secondary" py={3}>Bildirim geçmişi yok</Typography></TableCell></TableRow>
              ) : history.map((n) => (
                <TableRow key={n.id} hover>
                  <TableCell><Typography variant="body2" fontWeight={600}>{n.title}</Typography></TableCell>
                  <TableCell><Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>{n.body}</Typography></TableCell>
                  <TableCell align="center">
                    <Chip label={n.type === 'promotion' ? 'Promosyon' : 'Sistem'} size="small" color={n.type === 'promotion' ? 'warning' : 'info'} />
                  </TableCell>
                  <TableCell align="right"><Typography variant="caption">{new Date(n.createdAt).toLocaleDateString('tr-TR')}</Typography></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {histTotalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={2}>
          <Pagination count={histTotalPages} page={histPage} onChange={(_, v) => setHistPage(v)} color="primary" />
        </Box>
      )}

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={snack.severity} variant="filled">{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
