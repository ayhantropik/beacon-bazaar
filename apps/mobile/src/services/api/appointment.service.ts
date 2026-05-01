import apiClient from './client';

export interface Slot {
  start: string;
  end: string;
  isAvailable: boolean;
}

export interface Appointment {
  id: string;
  storeId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  service?: string;
  notes?: string;
  createdAt: string;
  store?: {
    name?: string;
    slug?: string;
    logo?: string;
  };
}

export const appointmentService = {
  slots: (storeId: string, date: string) =>
    apiClient.get('/appointments/slots', { params: { storeId, date } }),
  create: (data: {
    storeId: string;
    date: string;
    startTime: string;
    endTime: string;
    service?: string;
    notes?: string;
  }) => apiClient.post('/appointments', data),
  myList: (page = 1) => apiClient.get('/appointments', { params: { page } }),
  cancel: (id: string) => apiClient.put(`/appointments/${id}/cancel`),
};

export default appointmentService;
