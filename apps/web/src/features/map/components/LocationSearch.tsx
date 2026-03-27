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
import { useDebounce } from '@hooks/useDebounce';
import { locationService } from '@services/api/location.service';
import type { GeoPoint } from '@beacon-bazaar/shared';

interface LocationSearchProps {
  onLocationSelect: (location: GeoPoint, name: string) => void;
}

interface SearchResult {
  id: string;
  name: string;
  address: string;
  location: GeoPoint;
}

export default function LocationSearch({ onLocationSelect }: LocationSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([]);
      return;
    }
    locationService.search(debouncedQuery).then((res) => {
      setResults(res.data);
      setIsOpen(true);
    });
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

  return (
    <Box ref={containerRef} sx={{ position: 'relative', width: '100%', maxWidth: 400 }}>
      <Paper sx={{ p: '2px 4px', display: 'flex', alignItems: 'center', borderRadius: 2 }}>
        <IconButton size="small" sx={{ p: '8px' }}>
          <SearchIcon />
        </IconButton>
        <InputBase
          sx={{ ml: 1, flex: 1 }}
          placeholder="Konum ara..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
        />
      </Paper>

      {isOpen && results.length > 0 && (
        <Paper
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            mt: 0.5,
            maxHeight: 300,
            overflow: 'auto',
            zIndex: 1000,
          }}
        >
          <List dense>
            {results.map((result) => (
              <ListItem
                key={result.id}
                onClick={() => {
                  onLocationSelect(result.location, result.name);
                  setQuery(result.name);
                  setIsOpen(false);
                }}
                sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
              >
                <ListItemIcon><LocationOnIcon color="action" /></ListItemIcon>
                <ListItemText primary={result.name} secondary={result.address} />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
}
