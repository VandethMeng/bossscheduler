import { body, param, query } from 'express-validator';
import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { s3Service } from '../services/S3Service';
import { telegramService } from '../services/TelegramService';
import { AppointmentStatus } from '../models/Appointment';
import { MEETING_LOCATIONS } from '../constants/meetingLocations';
import { getTodayDateString } from '../utils/timezone';

const meetingDateNotInPast = (value: string) => {
  if (value < getTodayDateString()) {
    throw new Error('Meeting date must be today or a future date');
  }
  return true;
};

const statusValues: AppointmentStatus[] = [
  'Scheduled',
  'Completed',
  'Cancelled',
  'Postponed',
];

export const createAppointmentValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').optional().isString(),
  body('meetingDate')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Meeting date must be in YYYY-MM-DD format')
    .custom(meetingDateNotInPast),
  body('startTime')
    .matches(/^\d{2}:\d{2}$/)
    .withMessage('Start time must be in HH:MM format'),
  body('endTime')
    .matches(/^\d{2}:\d{2}$/)
    .withMessage('End time must be in HH:MM format'),
  body('location')
    .trim()
    .notEmpty()
    .withMessage('Location is required')
    .isIn([...MEETING_LOCATIONS])
    .withMessage(`Location must be one of: ${MEETING_LOCATIONS.join(', ')}`),
  body('organizer').optional().isString(),
  body('attendees').optional().isArray(),
  body('status')
    .optional()
    .isIn(statusValues)
    .withMessage(`Status must be one of: ${statusValues.join(', ')}`),
];

export const updateAppointmentValidation = [
  param('id').isUUID().withMessage('Invalid appointment ID'),
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('description').optional().isString(),
  body('meetingDate')
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Meeting date must be in YYYY-MM-DD format')
    .custom(meetingDateNotInPast),
  body('startTime')
    .optional()
    .matches(/^\d{2}:\d{2}$/)
    .withMessage('Start time must be in HH:MM format'),
  body('endTime')
    .optional()
    .matches(/^\d{2}:\d{2}$/)
    .withMessage('End time must be in HH:MM format'),
  body('location')
    .trim()
    .notEmpty()
    .withMessage('Location is required')
    .isIn([...MEETING_LOCATIONS])
    .withMessage(`Location must be one of: ${MEETING_LOCATIONS.join(', ')}`),
  body('organizer').optional().isString(),
  body('attendees').optional().isArray(),
  body('status')
    .optional()
    .isIn(statusValues)
    .withMessage(`Status must be one of: ${statusValues.join(', ')}`),
];

export const appointmentIdValidation = [
  param('id').isUUID().withMessage('Invalid appointment ID'),
];

export const appointmentFilterValidation = [
  query('search').optional().isString(),
  query('date')
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Date must be in YYYY-MM-DD format'),
  query('month')
    .optional()
    .matches(/^\d{4}-\d{2}$/)
    .withMessage('Month must be in YYYY-MM format'),
  query('status')
    .optional()
    .isIn(statusValues)
    .withMessage(`Status must be one of: ${statusValues.join(', ')}`),
];

export const getAppointments = asyncHandler(async (req: Request, res: Response) => {
  const { appointments } = await s3Service.completeExpiredAppointments();
  const filtered = s3Service.filterAppointments(appointments, {
    search: req.query.search as string | undefined,
    date: req.query.date as string | undefined,
    month: req.query.month as string | undefined,
    status: req.query.status as AppointmentStatus | undefined,
  });

  res.status(200).json({
    success: true,
    data: filtered,
    count: filtered.length,
  });
});

export const getAppointmentById = asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const { appointments } = await s3Service.completeExpiredAppointments();
  const appointment = appointments.find((apt) => apt.id === id);

  if (!appointment) {
    res.status(404).json({
      success: false,
      message: 'Appointment not found',
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: appointment,
  });
});

export const createAppointment = asyncHandler(async (req: Request, res: Response) => {
  const appointment = await s3Service.createAppointment(req.body);
  const appointments = await s3Service.getAppointments();

  await telegramService.notifyAppointmentCreated(appointment, appointments);

  res.status(201).json({
    success: true,
    data: appointment,
    message: 'Appointment created successfully',
  });
});

export const updateAppointment = asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const appointment = await s3Service.updateAppointment(id, req.body);
  const appointments = await s3Service.getAppointments();

  await telegramService.notifyAppointmentUpdated(appointment, appointments);

  res.status(200).json({
    success: true,
    data: appointment,
    message: 'Appointment updated successfully',
  });
});

export const deleteAppointment = asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const appointment = await s3Service.deleteAppointment(id, req.user!.role);

  await telegramService.notifyAppointmentDeleted(appointment);

  res.status(200).json({
    success: true,
    data: appointment,
    message: 'Appointment deleted successfully',
  });
});

export const uploadMeetingMinutes = asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);

  if (!req.file) {
    res.status(400).json({
      success: false,
      message: 'PDF file is required. Use form field name "file".',
    });
    return;
  }

  const appointment = await s3Service.uploadMeetingMinutes(
    id,
    req.file.buffer,
    req.file.originalname
  );

  res.status(200).json({
    success: true,
    data: appointment,
    message: 'Meeting minutes uploaded successfully',
  });
});

export const downloadMeetingMinutes = asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const appointment = await s3Service.getAppointmentById(id);

  if (!appointment.meetingMinutes?.s3Key) {
    res.status(404).json({
      success: false,
      message: 'No meeting minutes uploaded for this appointment',
    });
    return;
  }

  const buffer = await s3Service.getMeetingMinutesBuffer(
    appointment.meetingMinutes.s3Key
  );

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${appointment.meetingMinutes.fileName}"`
  );
  res.send(buffer);
});

export const deleteMeetingMinutes = asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const appointment = await s3Service.removeMeetingMinutes(id);

  res.status(200).json({
    success: true,
    data: appointment,
    message: 'Meeting minutes deleted successfully',
  });
});
