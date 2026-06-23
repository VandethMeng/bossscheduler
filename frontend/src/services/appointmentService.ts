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

  uploadMeetingMinutes: async (id: string, file: File): Promise<Appointment> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<ApiResponse<Appointment>>(
      `/appointments/${id}/meeting-minutes`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return response.data.data;
  },

  downloadMeetingMinutes: async (id: string, fileName: string): Promise<void> => {
    const response = await api.get(`/appointments/${id}/meeting-minutes`, {
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(
      new Blob([response.data], { type: 'application/pdf' })
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  deleteMeetingMinutes: async (id: string): Promise<Appointment> => {
    const response = await api.delete<ApiResponse<Appointment>>(
      `/appointments/${id}/meeting-minutes`
    );
    return response.data.data;
  },

  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get<ApiResponse<DashboardStats>>('/dashboard/stats');
    return response.data.data;
  },
};
