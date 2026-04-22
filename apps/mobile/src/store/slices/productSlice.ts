import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { Product, ProductSearchParams, PaginatedResponse } from '@beacon-bazaar/shared';
import { productService } from '../../services/api/product.service';

interface ProductState {
  items: Product[];
  selectedProduct: Product | null;
  searchParams: ProductSearchParams;
  pagination: { page: number; limit: number; total: number; totalPages: number };
  isLoading: boolean;
  error: string | null;
}

const initialState: ProductState = {
  items: [],
  selectedProduct: null,
  searchParams: { page: 1, limit: 20 },
  pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  isLoading: false,
  error: null,
};

export const fetchProducts = createAsyncThunk(
  'product/fetchProducts',
  async (params: ProductSearchParams, { rejectWithValue }) => {
    try {
      return await productService.search(params);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Ürünler yüklenemedi';
      return rejectWithValue(message);
    }
  },
);

export const fetchProductById = createAsyncThunk(
  'product/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await productService.getById(id);
      return response.data;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Ürün bulunamadı';
      return rejectWithValue(message);
    }
  },
);

const productSlice = createSlice({
  name: 'product',
  initialState,
  reducers: {
    setSearchParams: (state, action) => {
      state.searchParams = { ...state.searchParams, ...action.payload };
    },
    clearSelectedProduct: (state) => {
      state.selectedProduct = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        const response = action.payload as PaginatedResponse<Product>;
        state.items = response.data;
        state.pagination = response.pagination;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchProductById.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedProduct = action.payload;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setSearchParams, clearSelectedProduct } = productSlice.actions;
export default productSlice.reducer;
