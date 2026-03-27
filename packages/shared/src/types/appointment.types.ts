export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';

export interface TimeSlot {
  start: string;
  end: string;
  isAvailable: boolean;
}

export interface Appointment {
  id: string;
  userId: string;
  storeId: string;
  serviceId?: string;
  productId?: string;
  date: string;
  timeSlot: TimeSlot;
  duration: number;
  status: AppointmentStatus;
  notes?: string;
  meetingLink?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentCreateRequest {
  storeId: string;
  serviceId?: string;
  productId?: string;
  date: string;
  timeSlot: { start: string; end: string };
  notes?: string;
}
