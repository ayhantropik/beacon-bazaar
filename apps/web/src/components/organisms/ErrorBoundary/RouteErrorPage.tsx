import { useRouteError, isRouteErrorResponse } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import RefreshIcon from '@mui/icons-material/Refresh';
import HomeIcon from '@mui/icons-material/Home';

export default function RouteErrorPage() {
  const error = useRouteError();

  let title = 'Bir hata oluştu';
  let message = 'Sayfada beklenmeyen bir sorun oluştu.';
  let detail = '';

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      title = 'Sayfa bulunamadı';
      message = 'Aradığınız sayfa mevcut değil veya taşınmış olabilir.';
    } else {
      title = `Hata ${error.status}`;
      message = error.statusText || message;
    }
  } else if (error instanceof Error) {
    detail = error.message;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        textAlign: 'center',
        px: 3,
        py: 6,
        bgcolor: '#f8fafc',
      }}
    >
      <ReportProblemIcon sx={{ fontSize: 72, color: '#efba40', mb: 2 }} />
      <Typography variant="h4" fontWeight={700} gutterBottom>
        {title}
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={1} maxWidth={500}>
        {message}
      </Typography>
      {process.env.NODE_ENV === 'development' && detail && (
        <Box
          sx={{
            mt: 2,
            mb: 3,
            p: 2,
            bgcolor: '#fef2f2',
            borderRadius: 2,
            border: '1px solid #fecaca',
            maxWidth: 600,
            width: '100%',
            textAlign: 'left',
            overflow: 'auto',
            maxHeight: 200,
          }}
        >
          <Typography variant="caption" fontFamily="monospace" color="error" component="pre" sx={{ whiteSpace: 'pre-wrap', m: 0 }}>
            {detail}
          </Typography>
        </Box>
      )}
      <Box display="flex" gap={2} mt={3}>
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={() => window.location.reload()}
          sx={{ textTransform: 'none', borderRadius: 2 }}
        >
          Sayfayı Yenile
        </Button>
        <Button
          variant="outlined"
          startIcon={<HomeIcon />}
          onClick={() => (window.location.href = '/')}
          sx={{ textTransform: 'none', borderRadius: 2 }}
        >
          Ana Sayfaya Dön
        </Button>
      </Box>
    </Box>
  );
}
