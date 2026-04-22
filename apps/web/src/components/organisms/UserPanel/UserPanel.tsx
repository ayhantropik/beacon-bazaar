import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import StarOutlineIcon from '@mui/icons-material/StarOutline';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import LoginIcon from '@mui/icons-material/Login';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@store/hooks';
import FavorilerSection from './FavorilerSection';
import MesajlarSection from './MesajlarSection';
import SoruCevapSection from './SoruCevapSection';

interface UserPanelProps {
  context: 'oto' | 'emlak';
  onClose?: () => void;
}

type Section = 'menu' | 'favoriler' | 'mesajlar' | 'soru-cevap';

const MENU_ITEMS = [
  { id: 'favoriler' as const, label: 'Favorilerim', icon: StarOutlineIcon, color: '#FF9800' },
  { id: 'mesajlar' as const, label: 'Mesajlar', icon: ChatBubbleOutlineIcon, color: '#2196F3' },
  { id: 'soru-cevap' as const, label: 'Soru & Cevap', icon: HelpOutlineIcon, color: '#4CAF50' },
];

export default function UserPanel({ context, onClose }: UserPanelProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const [activeSection, setActiveSection] = useState<Section>('menu');

  if (!isAuthenticated) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        {onClose && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
            <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
          </Box>
        )}
        <LoginIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" gutterBottom>Giriş Yapın</Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Favorilerinizi, mesajlarınızı ve sorularınızı görmek için giriş yapın.
        </Typography>
        <Button variant="contained" onClick={() => navigate('/login')}>Giriş Yap</Button>
      </Box>
    );
  }

  if (activeSection !== 'menu') {
    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, borderBottom: '1px solid #eee' }}>
          <IconButton size="small" onClick={() => setActiveSection('menu')}>
            <ArrowBackIcon fontSize="small" />
          </IconButton>
          <Typography variant="subtitle1" fontWeight={700}>
            {MENU_ITEMS.find((m) => m.id === activeSection)?.label}
          </Typography>
          {onClose && (
            <IconButton size="small" onClick={onClose} sx={{ ml: 'auto' }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
        {activeSection === 'favoriler' && <FavorilerSection context={context} />}
        {activeSection === 'mesajlar' && <MesajlarSection />}
        {activeSection === 'soru-cevap' && <SoruCevapSection />}
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, borderBottom: '1px solid #eee' }}>
        <Typography variant="subtitle1" fontWeight={700}>Hesabım</Typography>
        {onClose && <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>}
      </Box>
      <List disablePadding>
        {MENU_ITEMS.map((item, i) => (
          <Box key={item.id}>
            <ListItemButton onClick={() => setActiveSection(item.id)} sx={{ py: 2 }}>
              <ListItemIcon sx={{ minWidth: 44 }}>
                <item.icon sx={{ color: item.color, fontSize: 28 }} />
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{ fontWeight: 600, fontSize: '1rem' }}
              />
              <ChevronRightIcon sx={{ color: 'text.secondary' }} />
            </ListItemButton>
            {i < MENU_ITEMS.length - 1 && <Divider />}
          </Box>
        ))}
      </List>
    </Box>
  );
}
