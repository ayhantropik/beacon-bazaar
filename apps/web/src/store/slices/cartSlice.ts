import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { CartItem } from '@beacon-bazaar/shared';
import { login, register, logout, initAuth } from './authSlice';

interface CartState {
  items: CartItem[];
  isOpen: boolean;
}

/** Storage key includes userId so each user has their own cart */
function cartKey(userId?: string | null): string {
  return userId ? `cart_items_${userId}` : 'cart_items_guest';
}

function loadCartFromStorage(userId?: string | null): CartItem[] {
  try {
    const saved = localStorage.getItem(cartKey(userId));
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveCartToStorage(items: CartItem[], userId?: string | null) {
  localStorage.setItem(cartKey(userId), JSON.stringify(items));
}

/** Get current user id from localStorage token (jwt payload) */
function getCurrentUserId(): string | null {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub || null;
  } catch {
    return null;
  }
}

const initialState: CartState = {
  items: loadCartFromStorage(getCurrentUserId()),
  isOpen: false,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem: (state, action: PayloadAction<CartItem>) => {
      const existing = state.items.find(
        (item) =>
          item.productId === action.payload.productId &&
          item.variationId === action.payload.variationId,
      );
      if (existing) {
        existing.quantity += action.payload.quantity;
      } else {
        state.items.push(action.payload);
      }
      saveCartToStorage(state.items, getCurrentUserId());
    },
    removeItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
      saveCartToStorage(state.items, getCurrentUserId());
    },
    updateQuantity: (state, action: PayloadAction<{ id: string; quantity: number }>) => {
      const item = state.items.find((i) => i.id === action.payload.id);
      if (item) {
        item.quantity = Math.max(0, action.payload.quantity);
        if (item.quantity === 0) {
          state.items = state.items.filter((i) => i.id !== action.payload.id);
        }
      }
      saveCartToStorage(state.items, getCurrentUserId());
    },
    clearCart: (state) => {
      state.items = [];
      saveCartToStorage(state.items, getCurrentUserId());
    },
    toggleCart: (state) => {
      state.isOpen = !state.isOpen;
    },
  },
  extraReducers: (builder) => {
    // On login/register: load user's saved cart
    builder
      .addCase(login.fulfilled, (state) => {
        const userId = getCurrentUserId();
        state.items = loadCartFromStorage(userId);
      })
      .addCase(register.fulfilled, (state) => {
        const userId = getCurrentUserId();
        state.items = loadCartFromStorage(userId);
      })
      .addCase(initAuth.fulfilled, (state) => {
        const userId = getCurrentUserId();
        state.items = loadCartFromStorage(userId);
      })
      // On logout: clear cart from Redux (user's cart stays in localStorage for next login)
      .addCase(logout.fulfilled, (state) => {
        state.items = [];
      });
  },
});

export const { addItem, removeItem, updateQuantity, clearCart, toggleCart } = cartSlice.actions;

export const selectCartItems = (state: { cart: CartState }) => state.cart.items;
export const selectCartItemCount = (state: { cart: CartState }) =>
  state.cart.items.reduce((sum, item) => sum + item.quantity, 0);
export const selectCartTotal = (state: { cart: CartState }) =>
  state.cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

export default cartSlice.reducer;
