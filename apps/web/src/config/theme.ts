import { createTheme } from '@mui/material/styles';

// VeniVidiCoop — Organik Zanaat Estetiği
// Üretici-kooperatif-tüketici ekosistemini yansıtan sıcak, doğal palet
export const theme = createTheme({
  palette: {
    primary: {
      main: '#1a6b52',      // orman yeşili — doğal, güvenilir
      light: '#2d8f6f',
      dark: '#0e4a38',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#d4882e',      // bal/amber — zanaat, el emeği
      light: '#e6a24e',
      dark: '#b06d1a',
      contrastText: '#ffffff',
    },
    error: {
      main: '#c0392b',
    },
    warning: {
      main: '#e67e22',
    },
    success: {
      main: '#27ae60',
    },
    info: {
      main: '#2980b9',
    },
    background: {
      default: '#faf8f5',   // krem — kağıt dokusu hissi
      paper: '#ffffff',
    },
    text: {
      primary: '#2c1810',   // koyu kahve — sıcak, okunabilir
      secondary: '#6b5b4e', // orta kahve
    },
    divider: 'rgba(44, 24, 16, 0.08)',
  },
  typography: {
    fontFamily: "'DM Sans', 'Inter', system-ui, -apple-system, sans-serif",
    h1: {
      fontFamily: "'Playfair Display', Georgia, serif",
      fontWeight: 800,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontFamily: "'Playfair Display', Georgia, serif",
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h4: {
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      fontWeight: 700,
    },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 600, letterSpacing: '0.01em' },
    subtitle2: { fontWeight: 600 },
    body1: { lineHeight: 1.7 },
    body2: { lineHeight: 1.6 },
    button: { fontWeight: 600, letterSpacing: '0.02em' },
  },
  shape: {
    borderRadius: 14,
  },
  shadows: [
    'none',
    '0 1px 3px rgba(44,24,16,0.06), 0 1px 2px rgba(44,24,16,0.04)',  // 1
    '0 2px 6px rgba(44,24,16,0.06), 0 1px 3px rgba(44,24,16,0.04)',  // 2
    '0 4px 12px rgba(44,24,16,0.07), 0 2px 4px rgba(44,24,16,0.04)', // 3
    '0 8px 24px rgba(44,24,16,0.08), 0 2px 6px rgba(44,24,16,0.04)', // 4
    ...Array(20).fill('0 12px 32px rgba(44,24,16,0.1), 0 4px 8px rgba(44,24,16,0.05)'),
  ] as any,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(212,136,46,0.03) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(26,107,82,0.03) 0%, transparent 50%)',
        },
        '::selection': {
          backgroundColor: 'rgba(212,136,46,0.2)',
          color: '#2c1810',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 12,
          padding: '10px 24px',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        },
        contained: {
          boxShadow: '0 2px 8px rgba(44,24,16,0.12)',
          '&:hover': {
            boxShadow: '0 4px 16px rgba(44,24,16,0.16)',
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        outlined: {
          borderWidth: '1.5px',
          '&:hover': {
            borderWidth: '1.5px',
            transform: 'translateY(-1px)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: '1px solid rgba(44,24,16,0.06)',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            borderColor: 'rgba(44,24,16,0.12)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          borderRadius: 8,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'medium',
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(26,107,82,0.4)',
            },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          borderBottom: '1px solid rgba(44,24,16,0.06)',
        },
      },
    },
    MuiRating: {
      styleOverrides: {
        iconFilled: {
          color: '#d4882e',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#2c1810',
          borderRadius: 8,
          fontSize: '0.75rem',
          fontWeight: 500,
        },
      },
    },
  },
});
