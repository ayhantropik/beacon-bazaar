import { Outlet, Navigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useAppSelector } from '@store/hooks';

export default function AuthLayout() {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        p: 2,
      }}
    >
      <Paper sx={{ p: 4, maxWidth: 480, width: '100%', borderRadius: 3 }}>
        <Typography
          variant="h4"
          textAlign="center"
          fontFamily="'Plus Jakarta Sans', sans-serif"
          fontWeight={800}
          color="primary"
          mb={3}
        >
          Beacon Bazaar
        </Typography>
        <Outlet />
      </Paper>
    </Box>
  );
}
