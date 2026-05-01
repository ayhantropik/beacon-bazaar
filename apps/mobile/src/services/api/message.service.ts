import apiClient from './client';

export interface ConversationItem {
  id: string;
  listingId?: string;
  listingType?: string;
  listingTitle?: string;
  lastMessage: string | null;
  lastMessageAt: string;
  unreadCount: number;
  otherUser: {
    id: string;
    name?: string;
    surname?: string;
    avatar?: string;
  };
  createdAt: string;
}

export interface MessageItem {
  id: string;
  content: string;
  isRead: boolean;
  isMine: boolean;
  sender: { id: string; name?: string; avatar?: string };
  createdAt: string;
}

export const messageService = {
  list: (page = 1, limit = 20) =>
    apiClient.get('/messages/conversations', { params: { page, limit } }),
  messages: (conversationId: string, page = 1, limit = 50) =>
    apiClient.get(`/messages/conversations/${conversationId}`, {
      params: { page, limit },
    }),
  start: (data: {
    sellerUserId: string;
    listingId?: string;
    listingType?: string;
    listingTitle?: string;
    message: string;
  }) => apiClient.post('/messages/conversations', data),
  send: (conversationId: string, content: string) =>
    apiClient.post(`/messages/conversations/${conversationId}`, { content }),
  markRead: (conversationId: string) =>
    apiClient.put(`/messages/conversations/${conversationId}/read`),
};

export default messageService;
