import apiClient from './client';

export interface MyStore {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  coverImage: string | null;
  categories: string[];
  ratingAverage: number;
  ratingCount: number;
  isVerified: boolean;
  followersCount: number;
  productsCount: number;
}

export interface DashboardStats {
  productsCount: number;
  followersCount: number;
  reviewsCount: number;
  ratingAverage: number;
}

export interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
}

export const sellerService = {
  myStore: () => apiClient.get('/stores/my-store'),
  dashboard: () => apiClient.get('/stores/my-store/dashboard'),
  myStoreProducts: (page = 1, limit = 50) =>
    apiClient.get('/stores/my-store/products', { params: { page, limit } }),
  updateStore: (data: Partial<MyStore>) =>
    apiClient.put('/stores/my-store', data),
  createStore: (data: any) => apiClient.post('/stores/create', data),

  // Orders for store
  myStoreOrders: (page = 1, limit = 20) =>
    apiClient.get('/orders/my-store', { params: { page, limit } }),
  myStoreOrderStats: () => apiClient.get('/orders/my-store/stats'),

  // Product CRUD
  createProduct: (data: any) => apiClient.post('/products', data),
  // Backend product update için ayrı endpoint yok (sadece create) — admin/seller henüz desteklemez
};

export default sellerService;
