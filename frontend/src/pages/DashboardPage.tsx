import { useEffect } from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemText } from '@mui/material';
import { useAppointments } from '../hooks/useAppointments';
import DashboardCards from '../components/DashboardCards';
import LoadingSpinner from '../components/LoadingSpinner';

const DashboardPage = () => {
  const { stats, appointments, fetchStats, fetchAppointments, isLoading } =
    useAppointments();

  useEffect(() => {
    fetchStats();
    fetchAppointments();
  }, [fetchStats, fetchAppointments]);

  const upcomingAppointments = appointments
    .filter((apt) => apt.status === 'Scheduled')
    .slice(0, 5);

  if (isLoading && !stats) {
    return <LoadingSpinner />;
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>
        Dashboard Overview
      </Typography>

      <DashboardCards stats={stats} />

      <Paper sx={{ mt: 4, p: 3, borderRadius: 2 }}>
        <Typography variant="h6" fontWeight={600} mb={2}>
          Upcoming Appointments
        </Typography>
        {upcomingAppointments.length === 0 ? (
          <Typography color="text.secondary">No upcoming appointments</Typography>
        ) : (
          <List disablePadding>
            {upcomingAppointments.map((apt) => (
              <ListItem key={apt.id} divider sx={{ px: 0 }}>
                <ListItemText
                  primary={apt.title}
                  secondary={`${apt.meetingDate} | ${apt.startTime} - ${apt.endTime} | ${apt.location || 'No location'}`}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
};

export default DashboardPage;
