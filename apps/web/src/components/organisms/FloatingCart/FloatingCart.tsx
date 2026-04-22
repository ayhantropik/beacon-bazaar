import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import Divider from '@mui/material/Divider';
import Slide from '@mui/material/Slide';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { useAppSelector, useAppDispatch } from '@store/hooks';
import {
  selectCartItems,
  selectCartItemCount,
  selectCartTotal,
  removeItem,
  updateQuantity,
} from '@store/slices/cartSlice';

export default function FloatingCart() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectCartItems);
  const itemCount = useAppSelector(selectCartItemCount);
  const total = useAppSelector(selectCartTotal);
  const [open, setOpen] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Draggable state
  const [topPercent, setTopPercent] = useState(50);
  const dragging = useRef(false);
  const dragStartY = useRef(0);
  const dragStartTop = useRef(50);
  const hasMoved = useRef(false);
  const cartRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    dragging.current = true;
    hasMoved.current = false;
    dragStartY.current = e.clientY;
    dragStartTop.current = topPercent;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [topPercent]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dy = e.clientY - dragStartY.current;
    if (Math.abs(dy) > 4) hasMoved.current = true;
    const vh = window.innerHeight;
    const newTop = Math.max(10, Math.min(90, dragStartTop.current + (dy / vh) * 100));
    setTopPercent(newTop);
  }, []);

  const handlePointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  // Carousel: cycle through items every 2.5s
  useEffect(() => {
    if (open || items.length === 0) return;
    intervalRef.current = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % items.length);
    }, 2500);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [open, items.length]);

  if (items.length === 0) return null;

  const currentItem = items[slideIndex % items.length];

  return (
    <>
      {/* Floating Cart Button — always visible when cart has items */}
      {!open && (
        <Box
          ref={cartRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onClick={() => { if (!hasMoved.current) setOpen(true); }}
          sx={{
            position: 'fixed',
            right: 0,
            top: `${topPercent}%`,
            transform: 'translateY(-50%)',
            zIndex: 1200,
            cursor: dragging.current ? 'grabbing' : 'grab',
            touchAction: 'none',
            userSelect: 'none',
            bgcolor: '#99ff66',
            borderRadius: '12px 0 0 12px',
            px: 1.2,
            py: 1.5,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 0.5,
            boxShadow: '-2px 2px 12px rgba(0,0,0,0.15)',
            transition: 'all 0.2s',
            '&:hover': { px: 1.8, boxShadow: '-4px 4px 20px rgba(0,0,0,0.2)' },
            overflow: 'hidden',
          }}
        >
          <Badge badgeContent={itemCount} color="error" sx={{ '& .MuiBadge-badge': { fontSize: 11, minWidth: 18, height: 18 } }}>
            <ShoppingCartIcon sx={{ color: '#1a1a1a', fontSize: 22 }} />
          </Badge>
          <Typography sx={{ color: '#1a1a1a', fontSize: 11, fontWeight: 700, lineHeight: 1.1, textAlign: 'center' }}>
            {total.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺
          </Typography>
          {/* Product slideshow */}
          <Box
            sx={{
              width: 48,
              height: 48,
              mt: 0.5,
              position: 'relative',
              borderRadius: 1.5,
              overflow: 'hidden',
              border: '2px solid rgba(255,255,255,0.4)',
            }}
          >
            {items.map((item, i) => (
              <Box
                key={item.id}
                sx={{
                  position: 'absolute',
                  inset: 0,
                  opacity: i === slideIndex % items.length ? 1 : 0,
                  transition: 'opacity 0.5s ease-in-out',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: '#fff',
                }}
              >
                <img
                  src={item.thumbnail || 'https://via.placeholder.com/48'}
                  alt={item.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </Box>
            ))}
          </Box>
          <Typography
            sx={{
              color: '#1a1a1a',
              fontSize: 8,
              fontWeight: 600,
              lineHeight: 1.1,
              textAlign: 'center',
              maxWidth: 56,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {currentItem?.name}
          </Typography>
        </Box>
      )}

      {/* Slide-in Cart Panel */}
      <Slide direction="left" in={open} mountOnEnter unmountOnExit>
        <Box
          sx={{
            position: 'fixed',
            right: 0,
            top: 0,
            bottom: 0,
            width: { xs: '100%', sm: 360 },
            bgcolor: 'background.paper',
            zIndex: 1300,
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
          }}
        >
          {/* Header */}
          <Box
            sx={{
              bgcolor: '#99ff66',
              color: '#fff',
              px: 2,
              py: 1.5,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <ShoppingCartIcon />
            <Typography variant="subtitle1" fontWeight={700} flex={1}>
              Ara toplam
            </Typography>
            <Typography variant="h6" fontWeight={800}>
              {total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
            </Typography>
            <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: '#fff', ml: 0.5 }}>
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Free Shipping Banner */}
          <Box sx={{ bgcolor: '#e8f5e9', px: 2, py: 0.8, display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocalShippingIcon sx={{ color: '#2e7d32', fontSize: 18 }} />
            <Typography variant="caption" sx={{ color: '#2e7d32', fontWeight: 600 }}>
              {total >= 500 ? 'Ücretsiz kargo!' : `${(500 - total).toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺ daha ekleyin, kargo ücretsiz!`}
            </Typography>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ px: 2, py: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={() => { setOpen(false); navigate('/checkout'); }}
              sx={{
                bgcolor: '#99ff66',
                fontWeight: 700,
                borderRadius: 6,
                '&:hover': { bgcolor: '#d4a230' },
              }}
            >
              Ödemeye Geç ({items.length})
            </Button>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => { setOpen(false); navigate('/cart'); }}
              sx={{ borderRadius: 6, fontWeight: 600 }}
            >
              Sepete git
            </Button>
          </Box>

          <Divider />

          {/* Items List */}
          <Box sx={{ flex: 1, overflow: 'auto', px: 2, py: 1 }}>
            {items.map((item) => (
              <Box key={item.id} sx={{ py: 1.5, display: 'flex', gap: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Avatar
                  variant="rounded"
                  src={item.thumbnail}
                  sx={{ width: 72, height: 72, bgcolor: 'grey.100' }}
                />
                <Box flex={1} minWidth={0}>
                  <Typography variant="body2" fontWeight={600} noWrap>
                    {item.name}
                  </Typography>
                  <Typography variant="subtitle2" fontWeight={700} color="text.primary" mt={0.5}>
                    {(item.price * item.quantity).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                  </Typography>

                  {/* Quantity Controls */}
                  <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                      }}
                    >
                      <IconButton
                        size="small"
                        onClick={() =>
                          dispatch(updateQuantity({ id: item.id, quantity: item.quantity - 1 }))
                        }
                        sx={{ p: 0.3 }}
                      >
                        <RemoveIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                      <Typography variant="body2" sx={{ px: 1, minWidth: 20, textAlign: 'center', fontWeight: 600 }}>
                        {item.quantity}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() =>
                          dispatch(updateQuantity({ id: item.id, quantity: item.quantity + 1 }))
                        }
                        sx={{ p: 0.3 }}
                      >
                        <AddIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>

                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => dispatch(removeItem(item.id))}
                      sx={{ ml: 'auto' }}
                    >
                      <DeleteIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>

          {/* Total Summary Footer */}
          <Box sx={{ borderTop: '2px solid', borderColor: 'divider', px: 2, py: 1.5, bgcolor: 'grey.50' }}>
            <Box display="flex" justifyContent="space-between" mb={0.5}>
              <Typography variant="body2" color="text.secondary">Ürün Toplamı ({itemCount} ürün)</Typography>
              <Typography variant="body2">{total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" mb={0.5}>
              <Typography variant="body2" color="text.secondary">Kargo</Typography>
              <Typography variant="body2" sx={{ color: total >= 500 ? '#2e7d32' : undefined }}>
                {total >= 500 ? 'Ücretsiz' : '39,90 ₺'}
              </Typography>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Box display="flex" justifyContent="space-between">
              <Typography variant="subtitle1" fontWeight={700}>Toplam</Typography>
              <Typography variant="subtitle1" fontWeight={800} color="#efba40">
                {(total + (total >= 500 ? 0 : 39.9)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
              </Typography>
            </Box>
          </Box>
        </Box>
      </Slide>

      {/* Backdrop */}
      {open && (
        <Box
          onClick={() => setOpen(false)}
          sx={{
            position: 'fixed',
            inset: 0,
            bgcolor: 'rgba(0,0,0,0.3)',
            zIndex: 1299,
          }}
        />
      )}
    </>
  );
}
