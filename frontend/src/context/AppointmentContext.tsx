import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import {
  Appointment,
  AppointmentContextType,
  AppointmentFilters,
  CreateAppointmentInput,
  DashboardStats,
  UpdateAppointmentInput,
} from '../types';
import { appointmentService } from '../services/appointmentService';

const AppointmentContext = createContext<AppointmentContextType | undefined>(
  undefined
);

interface AppointmentProviderProps {
  children: ReactNode;
}

export const AppointmentProvider = ({ children }: AppointmentProviderProps) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = useCallback(async (filters?: AppointmentFilters) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await appointmentService.getAll(filters);
      setAppointments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch appointments');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const data = await appointmentService.getStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
    }
  }, []);

  const getAppointment = useCallback(async (id: string): Promise<Appointment> => {
    return appointmentService.getById(id);
  }, []);

  const createAppointment = useCallback(
    async (data: CreateAppointmentInput): Promise<Appointment> => {
      const created = await appointmentService.create(data);
      setAppointments((prev) => [...prev, created]);
      await fetchStats();
      return created;
    },
    [fetchStats]
  );

  const updateAppointment = useCallback(
    async (id: string, data: UpdateAppointmentInput): Promise<Appointment> => {
      const updated = await appointmentService.update(id, data);
      setAppointments((prev) =>
        prev.map((apt) => (apt.id === id ? updated : apt))
      );
      await fetchStats();
      return updated;
    },
    [fetchStats]
  );

  const deleteAppointment = useCallback(
    async (id: string): Promise<void> => {
      await appointmentService.delete(id);
      setAppointments((prev) => prev.filter((apt) => apt.id !== id));
      await fetchStats();
    },
    [fetchStats]
  );

  const value = useMemo<AppointmentContextType>(
    () => ({
      appointments,
      stats,
      isLoading,
      error,
      fetchAppointments,
      fetchStats,
      getAppointment,
      createAppointment,
      updateAppointment,
      deleteAppointment,
    }),
    [
      appointments,
      stats,
      isLoading,
      error,
      fetchAppointments,
      fetchStats,
      getAppointment,
      createAppointment,
      updateAppointment,
      deleteAppointment,
    ]
  );

  return (
    <AppointmentContext.Provider value={value}>
      {children}
    </AppointmentContext.Provider>
  );
};

export const useAppointmentContext = (): AppointmentContextType => {
  const context = useContext(AppointmentContext);
  if (!context) {
    throw new Error('useAppointmentContext must be used within AppointmentProvider');
  }
  return context;
};
