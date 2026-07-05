import { Appointment, AppointmentStatus } from '../models/Appointment';
import { getTodayDateString, getZonedDateTimeMs } from '../utils/timezone';
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
    const { appointments } = await s3Service.completeExpiredAppointments();
    const today = getTodayDateString();
    const now = Date.now();

    const upcoming = appointments.filter((apt) => {
      const meetingStartMs = getZonedDateTimeMs(apt.meetingDate, apt.startTime);
      return meetingStartMs > now && apt.status === 'Scheduled';
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
