import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#2563eb',
      light: '#60a5fa',
      dark: '#1d4ed8',
    },
    secondary: {
      main: '#22c55e',
      light: '#4ade80',
      dark: '#15803d',
    },
    error: {
      main: '#ef4444',
    },
    warning: {
      main: '#f97316',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    h1: { fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", fontWeight: 800 },
    h2: { fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", fontWeight: 700 },
    h3: { fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", fontWeight: 700 },
    h4: { fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 10,
          padding: '8px 20px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'medium',
      },
    },
  },
});
