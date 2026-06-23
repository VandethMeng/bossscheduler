export type AppointmentStatus = 'Scheduled' | 'Completed' | 'Cancelled' | 'Postponed';

export interface MeetingMinutes {
  fileName: string;
  s3Key: string;
  uploadedAt: string;
  fileSize: number;
}

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
  meetingMinutes?: MeetingMinutes;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppointmentInput {
  title: string;
  description?: string;
  meetingDate: string;
  startTime: string;
  endTime: string;
  location: string;
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
