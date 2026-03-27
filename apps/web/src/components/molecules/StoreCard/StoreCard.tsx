import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import Rating from '@mui/material/Rating';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import StorefrontIcon from '@mui/icons-material/Storefront';
import VerifiedIcon from '@mui/icons-material/Verified';
import type { Store } from '@beacon-bazaar/shared';

interface StoreCardProps {
  store: Store;
  distance?: number;
  onClick?: (store: Store) => void;
}

export default function StoreCard({ store, distance, onClick }: StoreCardProps) {
  return (
    <Card
      sx={{
        display: 'flex',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 3,
        },
      }}
      onClick={() => onClick?.(store)}
    >
      <CardMedia
        component="img"
        sx={{ width: 140, objectFit: 'cover' }}
        image={store.coverImage}
        alt={store.name}
      />
      <CardContent sx={{ flex: 1, py: 1.5 }}>
        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
          <Avatar src={store.logo} sx={{ width: 32, height: 32 }}>
            <StorefrontIcon fontSize="small" />
          </Avatar>
          <Typography variant="subtitle1" fontWeight={600} noWrap>
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
        <Box display="flex" flexWrap="wrap" gap={0.5} mt={1}>
          {store.categories.slice(0, 3).map((cat) => (
            <Chip key={cat} label={cat} size="small" variant="outlined" />
          ))}
        </Box>
        {distance !== undefined && (
          <Box display="flex" alignItems="center" gap={0.5} mt={1}>
            <LocationOnIcon fontSize="small" color="action" />
            <Typography variant="caption" color="text.secondary">
              {distance < 1
                ? `${Math.round(distance * 1000)} m`
                : `${distance.toFixed(1)} km`}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
