import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Alert,
  Button,
  Chip,
  Grid,
  Divider,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAppointments } from '../hooks/useAppointments';
import AppointmentForm from '../components/AppointmentForm';
import LoadingSpinner from '../components/LoadingSpinner';
import { Appointment, CreateAppointmentInput } from '../types';

const AppointmentFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const isEditMode = Boolean(id) && location.pathname.includes('/edit');
  const isViewMode = Boolean(id) && !isEditMode;

  const { getAppointment, createAppointment, updateAppointment } = useAppointments();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(id));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      setIsLoading(true);
      getAppointment(id)
        .then(setAppointment)
        .catch((err) =>
          setError(err instanceof Error ? err.message : 'Failed to load appointment')
        )
        .finally(() => setIsLoading(false));
    }
  }, [id, getAppointment]);

  const handleCreate = async (data: CreateAppointmentInput) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const created = await createAppointment(data);
      setSuccess('Appointment created successfully!');
      setTimeout(() => navigate(`/appointments/${created.id}`), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (data: CreateAppointmentInput) => {
    if (!id) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await updateAppointment(id, data);
      setSuccess('Appointment updated successfully!');
      setTimeout(() => navigate(`/appointments/${id}`), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const getTitle = () => {
    if (isViewMode) return 'View Appointment';
    if (isEditMode) return 'Edit Appointment';
    return 'New Appointment';
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/appointments')}
        >
          Back
        </Button>
        <Typography variant="h5" fontWeight={700}>
          {getTitle()}
        </Typography>
        {isViewMode && id && (
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/appointments/${id}/edit`)}
            sx={{ ml: 'auto' }}
          >
            Edit
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Paper sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2 }}>
        {isViewMode && appointment ? (
          <Box>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <Typography variant="h6" fontWeight={600}>
                {appointment.title}
              </Typography>
              <Chip label={appointment.status} color="primary" size="small" />
            </Box>
            <Divider sx={{ mb: 3 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Date
                </Typography>
                <Typography>{appointment.meetingDate}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Time
                </Typography>
                <Typography>
                  {appointment.startTime} - {appointment.endTime}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Location
                </Typography>
                <Typography>{appointment.location || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Organizer
                </Typography>
                <Typography>{appointment.organizer || '-'}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">
                  Description
                </Typography>
                <Typography>{appointment.description || '-'}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">
                  Attendees
                </Typography>
                <Typography>
                  {appointment.attendees.length > 0
                    ? appointment.attendees.join(', ')
                    : '-'}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        ) : (
          <AppointmentForm
            initialData={isEditMode ? appointment || undefined : undefined}
            onSubmit={isEditMode ? handleUpdate : handleCreate}
            isSubmitting={isSubmitting}
            submitLabel={isEditMode ? 'Update Appointment' : 'Create Appointment'}
          />
        )}
      </Paper>
    </Box>
  );
};

export default AppointmentFormPage;
