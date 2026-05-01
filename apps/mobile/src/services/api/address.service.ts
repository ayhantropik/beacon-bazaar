import apiClient from './client';

export interface Address {
  id: string;
  title: string;
  fullName: string;
  phone: string;
  city: string;
  district: string;
  street: string;
  zipCode?: string;
  isDefault: boolean;
}

export const addressService = {
  list: () => apiClient.get('/user/addresses'),
  create: (data: Partial<Address>) => apiClient.post('/user/addresses', data),
  update: (id: string, data: Partial<Address>) =>
    apiClient.put(`/user/addresses/${id}`, data),
  remove: (id: string) => apiClient.delete(`/user/addresses/${id}`),
};

export default addressService;
