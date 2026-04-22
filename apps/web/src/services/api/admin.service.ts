import apiClient from './client';

const adminService = {
  // Dashboard
  getDashboard: () => apiClient.get('/admin/dashboard').then((r) => r.data),

  // Users
  getUsers: (params?: Record<string, any>) => apiClient.get('/admin/users', { params }).then((r) => r.data),
  getUser: (id: string) => apiClient.get(`/admin/users/${id}`).then((r) => r.data),
  updateUserRole: (id: string, role: string) => apiClient.patch(`/admin/users/${id}/role`, { role }).then((r) => r.data),
  updateUserStatus: (id: string, isActive: boolean) => apiClient.patch(`/admin/users/${id}/status`, { isActive }).then((r) => r.data),
  deleteUser: (id: string) => apiClient.delete(`/admin/users/${id}`).then((r) => r.data),

  // Stores
  getStores: (params?: Record<string, any>) => apiClient.get('/admin/stores', { params }).then((r) => r.data),
  getStore: (id: string) => apiClient.get(`/admin/stores/${id}`).then((r) => r.data),
  createStore: (data: Record<string, any>) => apiClient.post('/admin/stores', data).then((r) => r.data),
  verifyStore: (id: string, isActive: boolean) => apiClient.patch(`/admin/stores/${id}/verify`, { isActive }).then((r) => r.data),
  updateStoreStatus: (id: string, isActive: boolean) => apiClient.patch(`/admin/stores/${id}/status`, { isActive }).then((r) => r.data),

  // Products
  getProducts: (params?: Record<string, any>) => apiClient.get('/admin/products', { params }).then((r) => r.data),
  getProduct: (id: string) => apiClient.get(`/admin/products/${id}`).then((r) => r.data),
  updateProductStatus: (id: string, isActive: boolean) => apiClient.patch(`/admin/products/${id}/status`, { isActive }).then((r) => r.data),
  updateProductFeatured: (id: string, isFeatured: boolean) => apiClient.patch(`/admin/products/${id}/featured`, { isFeatured }).then((r) => r.data),

  // Orders
  getOrders: (params?: Record<string, any>) => apiClient.get('/admin/orders', { params }).then((r) => r.data),
  getOrder: (id: string) => apiClient.get(`/admin/orders/${id}`).then((r) => r.data),
  updateOrderStatus: (id: string, status: string) => apiClient.patch(`/admin/orders/${id}/status`, { status }).then((r) => r.data),

  // Auctions
  getAuctions: (params?: Record<string, any>) => apiClient.get('/admin/auctions', { params }).then((r) => r.data),
  getAuction: (id: string) => apiClient.get(`/admin/auctions/${id}`).then((r) => r.data),
  updateAuctionStatus: (id: string, status: string) => apiClient.patch(`/admin/auctions/${id}/status`, { status }).then((r) => r.data),

  // Moderation
  getReviews: (params?: Record<string, any>) => apiClient.get('/admin/moderation/reviews', { params }).then((r) => r.data),
  deleteReview: (id: string) => apiClient.delete(`/admin/moderation/reviews/${id}`).then((r) => r.data),
  getQuestions: (params?: Record<string, any>) => apiClient.get('/admin/moderation/questions', { params }).then((r) => r.data),
  deleteQuestion: (id: string) => apiClient.delete(`/admin/moderation/questions/${id}`).then((r) => r.data),

  // Notifications
  broadcastNotification: (data: { title: string; body: string; type: string }) =>
    apiClient.post('/admin/notifications/broadcast', data).then((r) => r.data),
  getNotificationHistory: (params?: Record<string, any>) =>
    apiClient.get('/admin/notifications/history', { params }).then((r) => r.data),

  // Settings & Categories
  getSettings: () => apiClient.get('/admin/settings').then((r) => r.data),
  updateSetting: (key: string, value: any) => apiClient.patch('/admin/settings', { key, value }).then((r) => r.data),
  getCategories: () => apiClient.get('/admin/categories').then((r) => r.data),
  updateCategories: (categories: string[]) => apiClient.patch('/admin/categories', { categories }).then((r) => r.data),
  getSubcategories: () => apiClient.get('/admin/subcategories').then((r) => r.data),
  updateSubcategories: (subcategories: Record<string, { title: string; items: string[] }[]>) =>
    apiClient.patch('/admin/subcategories', { subcategories }).then((r) => r.data),

  // Subscriptions / Aidat
  getSubscriptions: (params?: Record<string, any>) => apiClient.get('/admin/subscriptions', { params }).then((r) => r.data),
  getSubscriptionStats: () => apiClient.get('/admin/subscriptions/stats').then((r) => r.data),
  updateSubscription: (storeId: string, data: any) => apiClient.patch(`/admin/subscriptions/${storeId}`, data).then((r) => r.data),
  recordPayment: (storeId: string, months?: number) => apiClient.post(`/admin/subscriptions/${storeId}/payment`, { months: months || 1 }).then((r) => r.data),
  sendReminder: (storeId: string) => apiClient.post(`/admin/subscriptions/${storeId}/reminder`).then((r) => r.data),
  suspendOverdue: (graceDays?: number) => apiClient.post('/admin/subscriptions/suspend-overdue', { graceDays }).then((r) => r.data),
  initAllSubscriptions: () => apiClient.post('/admin/subscriptions/init-all').then((r) => r.data),

  // Professional Services
  getServiceProviders: (params?: Record<string, any>) => apiClient.get('/admin/services', { params }).then((r) => r.data),
  getServiceProviderStats: () => apiClient.get('/admin/services/stats').then((r) => r.data),

  // Reports
  getSalesReport: (params?: Record<string, any>) => apiClient.get('/admin/reports/sales', { params }).then((r) => r.data),
  getUserGrowthReport: (params?: Record<string, any>) => apiClient.get('/admin/reports/users', { params }).then((r) => r.data),
  getStorePerformanceReport: (params?: Record<string, any>) => apiClient.get('/admin/reports/stores', { params }).then((r) => r.data),
  exportData: (type: string) =>
    apiClient.get('/admin/reports/export', { params: { type }, responseType: 'blob' }).then((r) => r.data),
};

export default adminService;
