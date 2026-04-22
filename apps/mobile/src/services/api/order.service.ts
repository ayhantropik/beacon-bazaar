import type { ApiResponse, PaginatedResponse, Order, Cart } from '@beacon-bazaar/shared';
import apiClient from './client';

interface CheckoutRequest {
  shippingAddressId: string;
  billingAddressId: string;
  paymentMethod: string;
  couponCode?: string;
  notes?: string;
}

export const orderService = {
  getCart: () => apiClient.get<ApiResponse<Cart>>('/cart').then((res) => res.data),

  addToCart: (productId: string, quantity: number, variationId?: string) =>
    apiClient
      .post<ApiResponse<Cart>>('/cart/items', { productId, quantity, variationId })
      .then((res) => res.data),

  updateCartItem: (itemId: string, quantity: number) =>
    apiClient
      .put<ApiResponse<Cart>>(`/cart/items/${itemId}`, { quantity })
      .then((res) => res.data),

  removeCartItem: (itemId: string) =>
    apiClient.delete<ApiResponse<Cart>>(`/cart/items/${itemId}`).then((res) => res.data),

  applyCoupon: (code: string) =>
    apiClient.post<ApiResponse<Cart>>('/cart/coupon', { code }).then((res) => res.data),

  checkout: (data: CheckoutRequest) =>
    apiClient.post<ApiResponse<Order>>('/orders', data).then((res) => res.data),

  getOrders: (page = 1) =>
    apiClient
      .get<PaginatedResponse<Order>>('/orders', { params: { page } })
      .then((res) => res.data),

  getOrderById: (id: string) =>
    apiClient.get<ApiResponse<Order>>(`/orders/${id}`).then((res) => res.data),

  trackOrder: (id: string) =>
    apiClient
      .get<ApiResponse<{ status: string; updates: unknown[] }>>(`/orders/${id}/track`)
      .then((res) => res.data),
};
