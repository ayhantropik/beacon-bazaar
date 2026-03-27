import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { Store, StoreSearchParams, PaginatedResponse } from '@beacon-bazaar/shared';
import { storeService } from '@services/api/store.service';

interface StoreState {
  stores: Store[];
  selectedStore: Store | null;
  nearbyStores: Store[];
  searchParams: StoreSearchParams;
  pagination: { page: number; limit: number; total: number; totalPages: number };
  isLoading: boolean;
  error: string | null;
}

const initialState: StoreState = {
  stores: [],
  selectedStore: null,
  nearbyStores: [],
  searchParams: { page: 1, limit: 20 },
  pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  isLoading: false,
  error: null,
};

export const fetchStores = createAsyncThunk(
  'store/fetchStores',
  async (params: StoreSearchParams, { rejectWithValue }) => {
    try {
      return await storeService.search(params);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Mağazalar yüklenemedi';
      return rejectWithValue(message);
    }
  },
);

export const fetchNearbyStores = createAsyncThunk(
  'store/fetchNearby',
  async (
    params: { latitude: number; longitude: number; radius?: number },
    { rejectWithValue },
  ) => {
    try {
      const response = await storeService.getNearby(params);
      return response.data;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Yakındaki mağazalar yüklenemedi';
      return rejectWithValue(message);
    }
  },
);

export const fetchStoreById = createAsyncThunk(
  'store/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await storeService.getById(id);
      return response.data;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Mağaza bulunamadı';
      return rejectWithValue(message);
    }
  },
);

const storeSlice = createSlice({
  name: 'store',
  initialState,
  reducers: {
    setSearchParams: (state, action) => {
      state.searchParams = { ...state.searchParams, ...action.payload };
    },
    clearSelectedStore: (state) => {
      state.selectedStore = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStores.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchStores.fulfilled, (state, action) => {
        state.isLoading = false;
        const response = action.payload as PaginatedResponse<Store>;
        state.stores = response.data;
        state.pagination = response.pagination;
      })
      .addCase(fetchStores.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchNearbyStores.fulfilled, (state, action) => {
        state.nearbyStores = action.payload;
      })
      .addCase(fetchStoreById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedStore = action.payload;
      });
  },
});

export const { setSearchParams, clearSelectedStore } = storeSlice.actions;
export default storeSlice.reducer;
