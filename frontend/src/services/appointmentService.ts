import api from './api';
import {
  ApiResponse,
  Appointment,
  AppointmentFilters,
  CreateAppointmentInput,
  DashboardStats,
  UpdateAppointmentInput,
} from '../types';

export const appointmentService = {
  getAll: async (filters?: AppointmentFilters): Promise<Appointment[]> => {
    const response = await api.get<ApiResponse<Appointment[]>>('/appointments', {
      params: filters,
    });
    return response.data.data;
  },

  getById: async (id: string): Promise<Appointment> => {
    const response = await api.get<ApiResponse<Appointment>>(`/appointments/${id}`);
    return response.data.data;
  },

  create: async (data: CreateAppointmentInput): Promise<Appointment> => {
    const response = await api.post<ApiResponse<Appointment>>('/appointments', data);
    return response.data.data;
  },

  update: async (id: string, data: UpdateAppointmentInput): Promise<Appointment> => {
    const response = await api.put<ApiResponse<Appointment>>(
      `/appointments/${id}`,
      data
    );
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/appointments/${id}`);
  },

  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get<ApiResponse<DashboardStats>>('/dashboard/stats');
    return response.data.data;
  },
};
