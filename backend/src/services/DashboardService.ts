import { Appointment, AppointmentStatus } from '../models/Appointment';
import { s3Service } from './S3Service';

export interface DashboardStats {
  total: number;
  upcoming: number;
  today: number;
  completed: number;
  cancelled: number;
}

export class DashboardService {
  async getStats(): Promise<DashboardStats> {
    const appointments = await s3Service.getAppointments();
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();

    const upcoming = appointments.filter((apt) => {
      const meetingDateTime = new Date(`${apt.meetingDate}T${apt.startTime}`);
      return meetingDateTime > now && apt.status === 'Scheduled';
    }).length;

    const todayCount = appointments.filter(
      (apt) => apt.meetingDate === today
    ).length;

    const completed = appointments.filter(
      (apt) => apt.status === 'Completed'
    ).length;

    const cancelled = appointments.filter(
      (apt) => apt.status === 'Cancelled'
    ).length;

    return {
      total: appointments.length,
      upcoming,
      today: todayCount,
      completed,
      cancelled,
    };
  }
}

export const dashboardService = new DashboardService();

export { Appointment, AppointmentStatus };
