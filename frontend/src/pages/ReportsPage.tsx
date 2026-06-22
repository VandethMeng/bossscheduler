import { Box, Typography, Paper, Grid } from '@mui/material';
import { useEffect } from 'react';
import { useAppointments } from '../hooks/useAppointments';
import LoadingSpinner from '../components/LoadingSpinner';

const ReportsPage = () => {
  const { stats, fetchStats, isLoading } = useAppointments();

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (isLoading && !stats) {
    return <LoadingSpinner />;
  }

  const reportItems = [
    { label: 'Total Appointments', value: stats?.total ?? 0 },
    { label: 'Upcoming Meetings', value: stats?.upcoming ?? 0 },
    { label: "Today's Appointments", value: stats?.today ?? 0 },
    { label: 'Completed Meetings', value: stats?.completed ?? 0 },
    { label: 'Cancelled Meetings', value: stats?.cancelled ?? 0 },
    {
      label: 'Completion Rate',
      value: stats?.total
        ? `${Math.round(((stats.completed ?? 0) / stats.total) * 100)}%`
        : '0%',
    },
  ];

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>
        Reports
      </Typography>
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Grid container spacing={3}>
          {reportItems.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item.label}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {item.label}
                </Typography>
                <Typography variant="h4" fontWeight={700} mt={1}>
                  {item.value}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Box>
  );
};

export default ReportsPage;
