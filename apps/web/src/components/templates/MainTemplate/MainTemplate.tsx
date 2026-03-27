import { Outlet } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Header from '@components/organisms/Header';
import Footer from '@components/organisms/Footer';

interface MainTemplateProps {
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  noPadding?: boolean;
}

export default function MainTemplate({ maxWidth = 'xl', noPadding = false }: MainTemplateProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <Container
        component="main"
        maxWidth={maxWidth}
        sx={{ flexGrow: 1, py: noPadding ? 0 : 3, px: noPadding ? 0 : undefined }}
      >
        <Outlet />
      </Container>
      <Footer />
    </Box>
  );
}
