import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authReducer from './slices/authSlice';
import cartReducer from './slices/cartSlice';
import mapReducer from './slices/mapSlice';
import beaconReducer from './slices/beaconSlice';
import uiReducer from './slices/uiSlice';
import storeReducer from './slices/storeSlice';
import productReducer from './slices/productSlice';
import favoriteReducer from './slices/favoriteSlice';

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'cart', 'favorites'],
};

const rootReducer = combineReducers({
  auth: authReducer,
  cart: cartReducer,
  map: mapReducer,
  beacon: beaconReducer,
  ui: uiReducer,
  store: storeReducer,
  product: productReducer,
  favorites: favoriteReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
