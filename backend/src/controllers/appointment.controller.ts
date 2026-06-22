import { body, param, query } from 'express-validator';
import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { s3Service } from '../services/S3Service';
import { telegramService } from '../services/TelegramService';
import { AppointmentStatus } from '../models/Appointment';

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
    .withMessage('Meeting date must be in YYYY-MM-DD format'),
  body('startTime')
    .matches(/^\d{2}:\d{2}$/)
    .withMessage('Start time must be in HH:MM format'),
  body('endTime')
    .matches(/^\d{2}:\d{2}$/)
    .withMessage('End time must be in HH:MM format'),
  body('location').optional().isString(),
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
    .withMessage('Meeting date must be in YYYY-MM-DD format'),
  body('startTime')
    .optional()
    .matches(/^\d{2}:\d{2}$/)
    .withMessage('Start time must be in HH:MM format'),
  body('endTime')
    .optional()
    .matches(/^\d{2}:\d{2}$/)
    .withMessage('End time must be in HH:MM format'),
  body('location').optional().isString(),
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
  const appointments = await s3Service.getAppointments();
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
  const appointment = await s3Service.getAppointmentById(id);

  res.status(200).json({
    success: true,
    data: appointment,
  });
});

export const createAppointment = asyncHandler(async (req: Request, res: Response) => {
  const appointment = await s3Service.createAppointment(req.body);

  await telegramService.notifyAppointmentCreated(appointment);

  res.status(201).json({
    success: true,
    data: appointment,
    message: 'Appointment created successfully',
  });
});

export const updateAppointment = asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const appointment = await s3Service.updateAppointment(id, req.body);

  await telegramService.notifyAppointmentUpdated(appointment);

  res.status(200).json({
    success: true,
    data: appointment,
    message: 'Appointment updated successfully',
  });
});

export const deleteAppointment = asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const appointment = await s3Service.deleteAppointment(id);

  await telegramService.notifyAppointmentDeleted(appointment);

  res.status(200).json({
    success: true,
    data: appointment,
    message: 'Appointment deleted successfully',
  });
});
