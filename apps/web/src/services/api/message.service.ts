import apiClient from './client';

export const messageService = {
  getConversations: (page = 1) =>
    apiClient.get('/messages/conversations', { params: { page } }).then((r) => r.data),

  getMessages: (conversationId: string, page = 1) =>
    apiClient.get(`/messages/conversations/${conversationId}`, { params: { page, limit: 50 } }).then((r) => r.data),

  startConversation: (data: { sellerUserId: string; listingId?: string; listingType?: string; listingTitle?: string; message: string }) =>
    apiClient.post('/messages/conversations', data).then((r) => r.data),

  sendMessage: (conversationId: string, content: string) =>
    apiClient.post(`/messages/conversations/${conversationId}`, { content }).then((r) => r.data),

  markAsRead: (conversationId: string) =>
    apiClient.put(`/messages/conversations/${conversationId}/read`).then((r) => r.data),
};
