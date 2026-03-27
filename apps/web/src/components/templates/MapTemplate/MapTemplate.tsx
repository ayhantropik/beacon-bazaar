import { Outlet } from 'react-router-dom';
import Box from '@mui/material/Box';
import Header from '@components/organisms/Header';

export default function MapTemplate() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Header />
      <Box component="main" sx={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
        <Outlet />
      </Box>
    </Box>
  );
}
