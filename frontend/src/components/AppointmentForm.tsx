import {
  Box,
  TextField,
  Button,
  Grid,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Appointment, AppointmentStatus, CreateAppointmentInput } from '../types';

const statusOptions: AppointmentStatus[] = [
  'Scheduled',
  'Completed',
  'Cancelled',
  'Postponed',
];

const schema = yup.object({
  title: yup.string().required('Title is required'),
  description: yup.string().default(''),
  meetingDate: yup
    .string()
    .required('Meeting date is required')
    .matches(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  startTime: yup
    .string()
    .required('Start time is required')
    .matches(/^\d{2}:\d{2}$/, 'Time must be HH:MM'),
  endTime: yup
    .string()
    .required('End time is required')
    .matches(/^\d{2}:\d{2}$/, 'Time must be HH:MM')
    .test('is-after-start', 'End time must be after start time', function (value) {
      const { startTime } = this.parent;
      if (!startTime || !value) return true;
      return value > startTime;
    }),
  location: yup.string().default(''),
  organizer: yup.string().default(''),
  attendees: yup.string().default(''),
  status: yup
    .string()
    .oneOf(statusOptions)
    .required('Status is required') as yup.Schema<AppointmentStatus>,
});

type FormData = yup.InferType<typeof schema>;

interface AppointmentFormProps {
  initialData?: Appointment;
  onSubmit: (data: CreateAppointmentInput) => Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
}

const AppointmentForm = ({
  initialData,
  onSubmit,
  isSubmitting = false,
  submitLabel = 'Save Appointment',
}: AppointmentFormProps) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      meetingDate: initialData?.meetingDate || '',
      startTime: initialData?.startTime || '',
      endTime: initialData?.endTime || '',
      location: initialData?.location || '',
      organizer: initialData?.organizer || '',
      attendees: initialData?.attendees?.join(', ') || '',
      status: initialData?.status || 'Scheduled',
    },
  });

  const handleFormSubmit = async (data: FormData) => {
    const payload: CreateAppointmentInput = {
      title: data.title,
      description: data.description,
      meetingDate: data.meetingDate,
      startTime: data.startTime,
      endTime: data.endTime,
      location: data.location,
      organizer: data.organizer,
      attendees: data.attendees
        ? data.attendees.split(',').map((a) => a.trim()).filter(Boolean)
        : [],
      status: data.status,
    };
    await onSubmit(payload);
  };

  return (
    <Box component="form" onSubmit={handleSubmit(handleFormSubmit)} noValidate>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Controller
            name="title"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Title"
                fullWidth
                required
                error={!!errors.title}
                helperText={errors.title?.message}
              />
            )}
          />
        </Grid>

        <Grid item xs={12}>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Description"
                fullWidth
                multiline
                rows={3}
                error={!!errors.description}
                helperText={errors.description?.message}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <Controller
            name="meetingDate"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Meeting Date"
                type="date"
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
                error={!!errors.meetingDate}
                helperText={errors.meetingDate?.message}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <Controller
            name="startTime"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Start Time"
                type="time"
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
                error={!!errors.startTime}
                helperText={errors.startTime?.message}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <Controller
            name="endTime"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="End Time"
                type="time"
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
                error={!!errors.endTime}
                helperText={errors.endTime?.message}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="location"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="Location" fullWidth />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="organizer"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="Organizer" fullWidth />
            )}
          />
        </Grid>

        <Grid item xs={12}>
          <Controller
            name="attendees"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Attendees (comma separated)"
                fullWidth
                placeholder="John Doe, Jane Smith"
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <TextField {...field} select label="Status" fullWidth required>
                {statusOptions.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
        </Grid>

        <Grid item xs={12}>
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : undefined}
          >
            {submitLabel}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AppointmentForm;
