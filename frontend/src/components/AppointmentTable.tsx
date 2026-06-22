import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Typography,
  Box,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useNavigate } from 'react-router-dom';
import { Appointment, AppointmentStatus } from '../types';

interface AppointmentTableProps {
  appointments: Appointment[];
  onDelete: (appointment: Appointment) => void;
}

const statusColors: Record<
  AppointmentStatus,
  'default' | 'primary' | 'success' | 'error' | 'warning'
> = {
  Scheduled: 'primary',
  Completed: 'success',
  Cancelled: 'error',
  Postponed: 'warning',
};

const AppointmentTable = ({ appointments, onDelete }: AppointmentTableProps) => {
  const navigate = useNavigate();

  if (appointments.length === 0) {
    return (
      <Box textAlign="center" py={6}>
        <Typography color="text.secondary">No appointments found</Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 1 }}>
      <Table>
        <TableHead>
          <TableRow sx={{ bgcolor: 'grey.50' }}>
            <TableCell>Title</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Time</TableCell>
            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
              Location
            </TableCell>
            <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
              Organizer
            </TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {appointments.map((apt) => (
            <TableRow key={apt.id} hover>
              <TableCell>
                <Typography variant="body2" fontWeight={600}>
                  {apt.title}
                </Typography>
              </TableCell>
              <TableCell>{apt.meetingDate}</TableCell>
              <TableCell>
                {apt.startTime} - {apt.endTime}
              </TableCell>
              <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                {apt.location || '-'}
              </TableCell>
              <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                {apt.organizer || '-'}
              </TableCell>
              <TableCell>
                <Chip
                  label={apt.status}
                  size="small"
                  color={statusColors[apt.status]}
                />
              </TableCell>
              <TableCell align="right">
                <Tooltip title="View">
                  <IconButton
                    size="small"
                    onClick={() => navigate(`/appointments/${apt.id}`)}
                  >
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Edit">
                  <IconButton
                    size="small"
                    onClick={() => navigate(`/appointments/${apt.id}/edit`)}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => onDelete(apt)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default AppointmentTable;
