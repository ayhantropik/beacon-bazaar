import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Slider from '@mui/material/Slider';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Rating from '@mui/material/Rating';
import Button from '@components/atoms/Button';

interface FilterPanelProps {
  categories: string[];
  selectedCategories: string[];
  priceRange: [number, number];
  maxPrice: number;
  minRating: number;
  onCategoriesChange: (categories: string[]) => void;
  onPriceChange: (range: [number, number]) => void;
  onRatingChange: (rating: number) => void;
  onClear: () => void;
}

export default function FilterPanel({
  categories,
  selectedCategories,
  priceRange,
  maxPrice,
  minRating,
  onCategoriesChange,
  onPriceChange,
  onRatingChange,
  onClear,
}: FilterPanelProps) {
  const [localPrice, setLocalPrice] = useState(priceRange);

  const handleCategoryToggle = (category: string) => {
    const updated = selectedCategories.includes(category)
      ? selectedCategories.filter((c) => c !== category)
      : [...selectedCategories, category];
    onCategoriesChange(updated);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" fontWeight={600}>Filtreler</Typography>
        <Button variant="text" size="small" onClick={onClear}>Temizle</Button>
      </Box>

      <Accordion defaultExpanded disableGutters elevation={0}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography fontWeight={500}>Kategoriler</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <FormGroup>
            {categories.map((cat) => (
              <FormControlLabel
                key={cat}
                control={
                  <Checkbox
                    checked={selectedCategories.includes(cat)}
                    onChange={() => handleCategoryToggle(cat)}
                    size="small"
                  />
                }
                label={<Typography variant="body2">{cat}</Typography>}
              />
            ))}
          </FormGroup>
        </AccordionDetails>
      </Accordion>

      <Accordion defaultExpanded disableGutters elevation={0}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography fontWeight={500}>Fiyat Aralığı</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Slider
            value={localPrice}
            onChange={(_, value) => setLocalPrice(value as [number, number])}
            onChangeCommitted={(_, value) => onPriceChange(value as [number, number])}
            valueLabelDisplay="auto"
            valueLabelFormat={(v) => `${v.toLocaleString('tr-TR')} TL`}
            min={0}
            max={maxPrice}
            sx={{ mt: 1 }}
          />
          <Box display="flex" justifyContent="space-between">
            <Typography variant="caption" color="text.secondary">
              {localPrice[0].toLocaleString('tr-TR')} TL
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {localPrice[1].toLocaleString('tr-TR')} TL
            </Typography>
          </Box>
        </AccordionDetails>
      </Accordion>

      <Accordion defaultExpanded disableGutters elevation={0}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography fontWeight={500}>Minimum Puan</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {[4, 3, 2, 1].map((rating) => (
            <Box
              key={rating}
              display="flex"
              alignItems="center"
              gap={1}
              sx={{
                cursor: 'pointer',
                py: 0.5,
                px: 1,
                borderRadius: 1,
                bgcolor: minRating === rating ? 'primary.50' : 'transparent',
                '&:hover': { bgcolor: 'action.hover' },
              }}
              onClick={() => onRatingChange(rating)}
            >
              <Rating value={rating} readOnly size="small" />
              <Typography variant="body2" color="text.secondary">ve üzeri</Typography>
            </Box>
          ))}
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}
