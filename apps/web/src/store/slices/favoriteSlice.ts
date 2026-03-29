import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '@services/api/client';

interface FavoriteState {
  ids: Record<string, boolean>;
  isLoading: boolean;
}

const initialState: FavoriteState = {
  ids: {},
  isLoading: false,
};

export const toggleFavorite = createAsyncThunk(
  'favorites/toggle',
  async (productId: string) => {
    const res = await apiClient.post(`/favorites/${productId}/toggle`);
    return { productId, isFavorite: res.data?.data?.isFavorite };
  },
);

export const checkFavorites = createAsyncThunk(
  'favorites/check',
  async (productIds: string[]) => {
    if (!productIds.length) return {};
    const res = await apiClient.get('/favorites/check', { params: { ids: productIds.join(',') } });
    return res.data?.data || {};
  },
);

const favoriteSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(toggleFavorite.fulfilled, (state, action) => {
        state.ids[action.payload.productId] = action.payload.isFavorite;
      })
      .addCase(checkFavorites.fulfilled, (state, action) => {
        Object.assign(state.ids, action.payload);
      });
  },
});

export const selectIsFavorite = (productId: string) => (state: { favorites: FavoriteState }) =>
  state.favorites.ids[productId] || false;

export default favoriteSlice.reducer;
