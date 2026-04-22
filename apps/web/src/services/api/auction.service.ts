import apiClient from './client';

export const auctionService = {
  getTodayAuctions: () => apiClient.get('/auction/today'),
  getAuctionItem: (id: string) => apiClient.get(`/auction/${id}`),
  placeBid: (data: { auctionItemId: string; bidPrice: number; bidQuantity: number }) =>
    apiClient.post('/auction/bid', data),
  getMyBids: (page = 1) => apiClient.get('/auction/my-bids', { params: { page } }),
  getPastAuctions: (page = 1) => apiClient.get('/auction/past', { params: { page } }),
};

export default auctionService;
