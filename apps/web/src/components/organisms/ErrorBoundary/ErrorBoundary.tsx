import { Component, type ErrorInfo, type ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import RefreshIcon from '@mui/icons-material/Refresh';
import HomeIcon from '@mui/icons-material/Home';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            textAlign: 'center',
            px: 3,
            py: 6,
          }}
        >
          <ReportProblemIcon sx={{ fontSize: 64, color: '#efba40', mb: 2 }} />
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Bir hata oluştu
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={1} maxWidth={500}>
            Sayfada beklenmeyen bir sorun oluştu. Lütfen sayfayı yenileyin veya ana sayfaya dönün.
          </Typography>
          {process.env.NODE_ENV === 'development' && this.state.error && (
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
                {this.state.error.message}
                {'\n'}
                {this.state.error.stack}
              </Typography>
            </Box>
          )}
          <Box display="flex" gap={2} mt={2}>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={this.handleReload}
              sx={{ textTransform: 'none', borderRadius: 2 }}
            >
              Sayfayı Yenile
            </Button>
            <Button
              variant="outlined"
              startIcon={<HomeIcon />}
              onClick={this.handleGoHome}
              sx={{ textTransform: 'none', borderRadius: 2 }}
            >
              Ana Sayfaya Dön
            </Button>
          </Box>
        </Box>
      );
    }

    return this.props.children;
  }
}
