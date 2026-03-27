import type {
  ApiResponse,
  PaginatedResponse,
  Store,
  StoreSearchParams,
} from '@beacon-bazaar/shared';
import apiClient from './client';

export const storeService = {
  search: (params: StoreSearchParams) =>
    apiClient
      .get<PaginatedResponse<Store>>('/stores/search', { params })
      .then((res) => res.data),

  getById: (id: string) =>
    apiClient.get<ApiResponse<Store>>(`/stores/${id}`).then((res) => res.data),

  getNearby: (params: { latitude: number; longitude: number; radius?: number }) =>
    apiClient
      .get<ApiResponse<Store[]>>('/stores/nearby', { params })
      .then((res) => res.data),

  follow: (storeId: string) =>
    apiClient.post(`/stores/${storeId}/follow`).then((res) => res.data),

  unfollow: (storeId: string) =>
    apiClient.delete(`/stores/${storeId}/follow`).then((res) => res.data),

  getReviews: (storeId: string, page = 1) =>
    apiClient
      .get(`/stores/${storeId}/reviews`, { params: { page } })
      .then((res) => res.data),
};
