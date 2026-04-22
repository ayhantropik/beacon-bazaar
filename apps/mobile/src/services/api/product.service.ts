import type {
  ApiResponse,
  PaginatedResponse,
  Product,
  ProductSearchParams,
} from '@beacon-bazaar/shared';
import apiClient from './client';

export const productService = {
  search: (params: ProductSearchParams) =>
    apiClient
      .get<PaginatedResponse<Product>>('/products/search', { params })
      .then((res) => res.data),

  getById: (id: string) =>
    apiClient.get<ApiResponse<Product>>(`/products/${id}`).then((res) => res.data),

  getByStore: (storeId: string, params?: ProductSearchParams) =>
    apiClient
      .get<PaginatedResponse<Product>>(`/stores/${storeId}/products`, { params })
      .then((res) => res.data),

  getCategories: () =>
    apiClient.get<ApiResponse<string[]>>('/products/categories').then((res) => res.data),

  getFeatured: () =>
    apiClient.get<ApiResponse<Product[]>>('/products/featured').then((res) => res.data),

  getGiftSuggestions: (params: {
    age?: number;
    gender?: string;
    interests?: string[];
    occasion?: string;
    budget?: { min: number; max: number };
    relationship?: string;
    latitude?: number;
    longitude?: number;
  }) =>
    apiClient.post<ApiResponse<any>>('/products/gift-suggestions', params).then((res) => res.data),
};
