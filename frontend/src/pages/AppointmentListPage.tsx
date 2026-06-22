import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Grid,
  MenuItem,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import { useAppointments } from '../hooks/useAppointments';
import AppointmentTable from '../components/AppointmentTable';
import ConfirmationDialog from '../components/ConfirmationDialog';
import LoadingSpinner from '../components/LoadingSpinner';
import { Appointment, AppointmentStatus } from '../types';

const statusOptions: (AppointmentStatus | '')[] = [
  '',
  'Scheduled',
  'Completed',
  'Cancelled',
  'Postponed',
];

const AppointmentListPage = () => {
  const navigate = useNavigate();
  const { appointments, fetchAppointments, deleteAppointment, isLoading, error } =
    useAppointments();

  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | ''>('');
  const [deleteTarget, setDeleteTarget] = useState<Appointment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchAppointments({
      search: search || undefined,
      date: dateFilter || undefined,
      month: monthFilter || undefined,
      status: statusFilter || undefined,
    });
  }, [search, dateFilter, monthFilter, statusFilter, fetchAppointments]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteAppointment(deleteTarget.id);
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
        flexWrap="wrap"
        gap={2}
      >
        <Typography variant="h5" fontWeight={700}>
          Appointments
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/appointments/new')}
        >
          New Appointment
        </Button>
      </Box>

      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            label="Search"
            fullWidth
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Title, location..."
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            label="Filter by Date"
            type="date"
            fullWidth
            size="small"
            InputLabelProps={{ shrink: true }}
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            label="Filter by Month"
            type="month"
            fullWidth
            size="small"
            InputLabelProps={{ shrink: true }}
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            select
            label="Filter by Status"
            fullWidth
            size="small"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as AppointmentStatus | '')
            }
          >
            <MenuItem value="">All</MenuItem>
            {statusOptions.slice(1).map((status) => (
              <MenuItem key={status} value={status}>
                {status}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <AppointmentTable
          appointments={appointments}
          onDelete={setDeleteTarget}
        />
      )}

      <ConfirmationDialog
        open={Boolean(deleteTarget)}
        title="Delete Appointment"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={isDeleting}
      />
    </Box>
  );
};

export default AppointmentListPage;
