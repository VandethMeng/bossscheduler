export type AppointmentStatus = 'Scheduled' | 'Completed' | 'Cancelled' | 'Postponed';

export type UserRole = 'Admin' | 'Assistant' | 'Organizer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt?: string;
}

export interface CreateUserInput {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

export interface UpdateUserInput {
  email?: string;
  password?: string;
  name?: string;
  role?: UserRole;
}

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

export interface UpdateAppointmentInput extends Partial<CreateAppointmentInput> {}

export interface AppointmentFilters {
  search?: string;
  date?: string;
  month?: string;
  status?: AppointmentStatus;
}

export interface DashboardStats {
  total: number;
  upcoming: number;
  today: number;
  completed: number;
  cancelled: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  count?: number;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export interface AppointmentContextType {
  appointments: Appointment[];
  stats: DashboardStats | null;
  isLoading: boolean;
  error: string | null;
  fetchAppointments: (filters?: AppointmentFilters) => Promise<void>;
  fetchStats: () => Promise<void>;
  getAppointment: (id: string) => Promise<Appointment>;
  createAppointment: (data: CreateAppointmentInput) => Promise<Appointment>;
  updateAppointment: (id: string, data: UpdateAppointmentInput) => Promise<Appointment>;
  deleteAppointment: (id: string) => Promise<void>;
}
