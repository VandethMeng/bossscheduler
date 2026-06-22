export type AppointmentStatus = 'Scheduled' | 'Completed' | 'Cancelled' | 'Postponed';

export interface Appointment {
  id: string;
  title: string;
  description: string;
  meetingDate: string;
  startTime: string;
  endTime: string;
  location: string;
  organizer: string;
  attendees: string[];
  status: AppointmentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppointmentInput {
  title: string;
  description?: string;
  meetingDate: string;
  startTime: string;
  endTime: string;
  location?: string;
  organizer?: string;
  attendees?: string[];
  status?: AppointmentStatus;
}

export interface UpdateAppointmentInput {
  title?: string;
  description?: string;
  meetingDate?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  organizer?: string;
  attendees?: string[];
  status?: AppointmentStatus;
}

export interface AppointmentFilters {
  search?: string;
  date?: string;
  month?: string;
  status?: AppointmentStatus;
}
