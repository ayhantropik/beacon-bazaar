import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Rating from '@mui/material/Rating';
import Chip from '@mui/material/Chip';
import CloseIcon from '@mui/icons-material/Close';
import DirectionsIcon from '@mui/icons-material/Directions';
import PhoneIcon from '@mui/icons-material/Phone';
import StorefrontIcon from '@mui/icons-material/Storefront';
import VerifiedIcon from '@mui/icons-material/Verified';
import Button from '@components/atoms/Button';
import type { Store } from '@beacon-bazaar/shared';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface StoreInfoPanelProps {
  store: Store;
  onClose: () => void;
}

export default function StoreInfoPanel({ store, onClose }: StoreInfoPanelProps) {
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        style={{ position: 'absolute', bottom: 16, left: 16, right: 16 }}
      >
        <Paper elevation={4} sx={{ p: 2, borderRadius: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box display="flex" gap={1.5} alignItems="center" flex={1}>
              <Avatar src={store.logo} sx={{ width: 48, height: 48 }}>
                <StorefrontIcon />
              </Avatar>
              <Box flex={1}>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {store.name}
                  </Typography>
                  {store.isVerified && <VerifiedIcon color="primary" fontSize="small" />}
                </Box>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <Rating value={store.rating.average} precision={0.5} size="small" readOnly />
                  <Typography variant="caption" color="text.secondary">
                    ({store.rating.count})
                  </Typography>
                </Box>
              </Box>
            </Box>
            <IconButton size="small" onClick={onClose}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          <Box display="flex" flexWrap="wrap" gap={0.5} mt={1} mb={1.5}>
            {store.categories.slice(0, 4).map((cat) => (
              <Chip key={cat} label={cat} size="small" variant="outlined" />
            ))}
          </Box>

          <Box display="flex" gap={1}>
            <Button
              variant="contained"
              size="small"
              fullWidth
              onClick={() => navigate(`/store/${store.slug}`)}
            >
              Mağazaya Git
            </Button>
            <IconButton color="primary" size="small">
              <DirectionsIcon />
            </IconButton>
            {store.contactInfo.phone && (
              <IconButton color="primary" size="small" href={`tel:${store.contactInfo.phone}`}>
                <PhoneIcon />
              </IconButton>
            )}
          </Box>
        </Paper>
      </motion.div>
    </AnimatePresence>
  );
}
