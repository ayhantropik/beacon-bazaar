import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import StoreCard from '@components/molecules/StoreCard';
import type { Store, GeoPoint } from '@beacon-bazaar/shared';
import { haversineDistance } from '@features/map/utils/distance';

interface StoreListProps {
  stores: Store[];
  isLoading?: boolean;
  userLocation?: GeoPoint | null;
  onStoreClick?: (store: Store) => void;
  emptyMessage?: string;
}

export default function StoreList({
  stores,
  isLoading = false,
  userLocation,
  onStoreClick,
  emptyMessage = 'Mağaza bulunamadı',
}: StoreListProps) {
  if (isLoading) {
    return (
      <Stack spacing={2}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
        ))}
      </Stack>
    );
  }

  if (stores.length === 0) {
    return (
      <Box textAlign="center" py={8}>
        <Typography variant="h6" color="text.secondary">{emptyMessage}</Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={2}>
      {stores.map((store) => (
        <StoreCard
          key={store.id}
          store={store}
          distance={
            userLocation
              ? haversineDistance(userLocation, store.location)
              : undefined
          }
          onClick={onStoreClick}
        />
      ))}
    </Stack>
  );
}
