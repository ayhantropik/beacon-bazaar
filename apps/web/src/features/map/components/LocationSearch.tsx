import { useState, useEffect, useRef } from 'react';
import Paper from '@mui/material/Paper';
import InputBase from '@mui/material/InputBase';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SearchIcon from '@mui/icons-material/Search';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import { useDebounce } from '@hooks/useDebounce';
import { locationService } from '@services/api/location.service';
import type { GeoPoint } from '@beacon-bazaar/shared';

interface LocationSearchProps {
  onLocationSelect: (location: GeoPoint, name: string) => void;
}

interface SearchResult {
  latitude: number;
  longitude: number;
  displayName: string;
  address: string;
  type: string;
}

export default function LocationSearch({ onLocationSelect }: LocationSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 400);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    setLoading(true);
    locationService
      .search(debouncedQuery)
      .then((res) => {
        const data = res.data || [];
        setResults(data);
        setIsOpen(data.length > 0);
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [debouncedQuery]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (result: SearchResult) => {
    onLocationSelect(
      { latitude: result.latitude, longitude: result.longitude },
      result.displayName,
    );
    setQuery(result.displayName.split(',')[0]);
    setIsOpen(false);
  };

  return (
    <Box ref={containerRef} sx={{ position: 'relative', width: '100%', maxWidth: 360 }}>
      <Paper
        sx={{
          p: '2px 4px',
          display: 'flex',
          alignItems: 'center',
          borderRadius: 2,
          boxShadow: 3,
        }}
      >
        <IconButton size="small" sx={{ p: '8px' }}>
          <SearchIcon />
        </IconButton>
        <InputBase
          sx={{ ml: 1, flex: 1, fontSize: 14 }}
          placeholder="Cadde, mahalle veya yer ara..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
        />
        {loading && <CircularProgress size={18} sx={{ mr: 1 }} />}
      </Paper>

      {isOpen && results.length > 0 && (
        <Paper
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            mt: 0.5,
            maxHeight: 320,
            overflow: 'auto',
            zIndex: 1000,
            boxShadow: 4,
          }}
        >
          <List dense disablePadding>
            {results.map((result, idx) => {
              const parts = result.displayName.split(',');
              const primary = parts[0]?.trim();
              const secondary = parts.slice(1, 3).join(',').trim();
              return (
                <ListItem
                  key={idx}
                  onClick={() => handleSelect(result)}
                  sx={{
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' },
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <LocationOnIcon color="error" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={<Typography variant="body2" fontWeight={500}>{primary}</Typography>}
                    secondary={<Typography variant="caption" color="text.secondary">{secondary}</Typography>}
                  />
                </ListItem>
              );
            })}
          </List>
        </Paper>
      )}
    </Box>
  );
}
