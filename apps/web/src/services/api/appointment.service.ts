import type {
  ApiResponse,
  PaginatedResponse,
  Appointment,
  AppointmentCreateRequest,
  TimeSlot,
} from '@beacon-bazaar/shared';
import apiClient from './client';

export const appointmentService = {
  getAvailableSlots: (storeId: string, date: string) =>
    apiClient
      .get<ApiResponse<TimeSlot[]>>(`/appointments/slots`, {
        params: { storeId, date },
      })
      .then((res) => res.data),

  create: (data: AppointmentCreateRequest) =>
    apiClient
      .post<ApiResponse<Appointment>>('/appointments', data)
      .then((res) => res.data),

  getMyAppointments: (page = 1) =>
    apiClient
      .get<PaginatedResponse<Appointment>>('/appointments', { params: { page } })
      .then((res) => res.data),

  getById: (id: string) =>
    apiClient
      .get<ApiResponse<Appointment>>(`/appointments/${id}`)
      .then((res) => res.data),

  cancel: (id: string) =>
    apiClient
      .put<ApiResponse<Appointment>>(`/appointments/${id}/cancel`)
      .then((res) => res.data),
};
