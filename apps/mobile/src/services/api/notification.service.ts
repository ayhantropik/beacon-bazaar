import apiClient from './client';

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
}

export const notificationService = {
  list: (page = 1, limit = 50) =>
    apiClient.get('/notifications', { params: { page, limit } }),
  unreadCount: () => apiClient.get('/notifications/unread-count'),
  markRead: (id: string) => apiClient.put(`/notifications/${id}/read`),
  markAllRead: () => apiClient.put('/notifications/read-all'),
  registerDevice: (token: string, platform: 'ios' | 'android' | 'web', device?: Record<string, string>) =>
    apiClient.post('/notifications/register-device', { token, platform, device }),
  unregisterDevice: (token: string) =>
    apiClient.delete('/notifications/register-device', { data: { token } }),
};

export default notificationService;
