import apiClient from './client';

export const savedSearchService = {
  create: (data: { name: string; context: 'oto' | 'emlak'; filters: Record<string, any> }) =>
    apiClient.post('/saved-searches', data).then((r) => r.data),

  getAll: (context?: string) =>
    apiClient.get('/saved-searches', { params: context ? { context } : {} }).then((r) => r.data),

  remove: (id: string) =>
    apiClient.delete(`/saved-searches/${id}`).then((r) => r.data),
};
