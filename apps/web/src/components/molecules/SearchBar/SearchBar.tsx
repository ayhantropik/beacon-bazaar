import { useState, useRef, useEffect, type FormEvent } from 'react';
import Paper from '@mui/material/Paper';
import InputBase from '@mui/material/InputBase';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import SearchIcon from '@mui/icons-material/Search';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import HistoryIcon from '@mui/icons-material/History';
import CloseIcon from '@mui/icons-material/Close';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import Divider from '@mui/material/Divider';
import { useSearchHistory } from '@hooks/useSearchHistory';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onLocationClick?: () => void;
  placeholder?: string;
  defaultValue?: string;
}

export default function SearchBar({
  onSearch,
  onLocationClick,
  placeholder = 'Ürün, mağaza veya kategori ara...',
  defaultValue = '',
}: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue);
  const [showHistory, setShowHistory] = useState(false);
  const { history, add, remove, clear } = useSearchHistory();
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      add(query.trim());
      onSearch(query.trim());
      setShowHistory(false);
    }
  };

  const handleHistoryClick = (item: string) => {
    setQuery(item);
    add(item);
    onSearch(item);
    setShowHistory(false);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowHistory(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <Box ref={containerRef} sx={{ position: 'relative', width: '100%' }}>
      <Paper
        component="form"
        onSubmit={handleSubmit}
        sx={{
          p: '2px 4px',
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          borderRadius: 3,
          boxShadow: 2,
        }}
      >
        <IconButton type="submit" sx={{ p: '10px' }} aria-label="search">
          <SearchIcon />
        </IconButton>
        <InputBase
          sx={{ ml: 1, flex: 1 }}
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => history.length > 0 && setShowHistory(true)}
          inputProps={{ 'aria-label': placeholder }}
        />
        {query && (
          <IconButton
            size="small"
            onClick={() => setQuery('')}
            sx={{ p: '6px', color: 'text.secondary' }}
            aria-label="aramayı temizle"
          >
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        )}
        {onLocationClick && (
          <>
            <Divider sx={{ height: 28, m: 0.5 }} orientation="vertical" />
            <IconButton
              color="primary"
              sx={{ p: '10px' }}
              aria-label="konumum"
              onClick={onLocationClick}
            >
              <MyLocationIcon />
            </IconButton>
          </>
        )}
      </Paper>

      {showHistory && history.length > 0 && (
        <Paper
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            mt: 0.5,
            zIndex: 1300,
            boxShadow: 4,
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1.5, py: 0.5, bgcolor: 'grey.50' }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              Son Aramalar
            </Typography>
            <IconButton size="small" onClick={clear} sx={{ fontSize: 12 }}>
              <DeleteSweepIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
          <List dense disablePadding>
            {history.map((item) => (
              <ListItem
                key={item}
                sx={{
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' },
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  pr: 1,
                }}
                onClick={() => handleHistoryClick(item)}
                secondaryAction={
                  <IconButton
                    edge="end"
                    size="small"
                    onClick={(e) => { e.stopPropagation(); remove(item); }}
                  >
                    <CloseIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                }
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <HistoryIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                </ListItemIcon>
                <ListItemText
                  primary={<Typography variant="body2">{item}</Typography>}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
}
