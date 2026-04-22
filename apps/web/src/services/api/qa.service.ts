import apiClient from './client';

export const qaService = {
  askQuestion: (data: { listingId: string; listingType: 'oto' | 'emlak'; listingTitle?: string; sellerUserId: string; content: string }) =>
    apiClient.post('/qa/questions', data).then((r) => r.data),

  getMyQuestions: (page = 1) =>
    apiClient.get('/qa/questions/mine', { params: { page } }).then((r) => r.data),

  getSellerQuestions: (page = 1) =>
    apiClient.get('/qa/questions/seller', { params: { page } }).then((r) => r.data),

  answerQuestion: (questionId: string, content: string) =>
    apiClient.post(`/qa/questions/${questionId}/answer`, { content }).then((r) => r.data),

  getListingQuestions: (listingId: string, page = 1) =>
    apiClient.get(`/qa/listings/${listingId}/questions`, { params: { page } }).then((r) => r.data),
};
