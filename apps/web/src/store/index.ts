import { configureStore } from '@reduxjs/toolkit';
import authReducer, { initAuth } from './slices/authSlice';
import cartReducer from './slices/cartSlice';
import productReducer from './slices/productSlice';
import storeReducer from './slices/storeSlice';
import mapReducer from './slices/mapSlice';
import uiReducer from './slices/uiSlice';
import favoriteReducer from './slices/favoriteSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    product: productReducer,
    store: storeReducer,
    map: mapReducer,
    ui: uiReducer,
    favorites: favoriteReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
  devTools: import.meta.env.DEV,
});

// Restore auth session from localStorage on app start
store.dispatch(initAuth());

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
