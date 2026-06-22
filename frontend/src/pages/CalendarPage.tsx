import { useEffect, useMemo } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { EventClickArg } from '@fullcalendar/core';
import { useNavigate } from 'react-router-dom';
import { useAppointments } from '../hooks/useAppointments';
import LoadingSpinner from '../components/LoadingSpinner';
import { AppointmentStatus } from '../types';

const statusColors: Record<AppointmentStatus, string> = {
  Scheduled: '#1976d2',
  Completed: '#2e7d32',
  Cancelled: '#d32f2f',
  Postponed: '#ed6c02',
};

const CalendarPage = () => {
  const navigate = useNavigate();
  const { appointments, fetchAppointments, isLoading } = useAppointments();

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const events = useMemo(
    () =>
      appointments.map((apt) => ({
        id: apt.id,
        title: apt.title,
        start: `${apt.meetingDate}T${apt.startTime}`,
        end: `${apt.meetingDate}T${apt.endTime}`,
        backgroundColor: statusColors[apt.status],
        borderColor: statusColors[apt.status],
        extendedProps: { appointment: apt },
      })),
    [appointments]
  );

  const handleEventClick = (info: EventClickArg) => {
    navigate(`/appointments/${info.event.id}`);
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>
        Calendar
      </Typography>

      <Paper sx={{ p: { xs: 1, sm: 2 }, borderRadius: 2 }}>
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay',
            }}
            events={events}
            eventClick={handleEventClick}
            height="auto"
            slotMinTime="06:00:00"
            slotMaxTime="22:00:00"
            allDaySlot={false}
            nowIndicator
            eventDisplay="block"
          />
        )}
      </Paper>
    </Box>
  );
};

export default CalendarPage;
