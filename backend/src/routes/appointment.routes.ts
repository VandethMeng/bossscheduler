import { Router } from 'express';
import {
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  uploadMeetingMinutes,
  downloadMeetingMinutes,
  deleteMeetingMinutes,
  createAppointmentValidation,
  updateAppointmentValidation,
  appointmentIdValidation,
  appointmentFilterValidation,
} from '../controllers/appointment.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { handleMeetingMinutesUpload } from '../middleware/upload.middleware';

const router = Router();

router.use(authenticate);

router.get('/', validate(appointmentFilterValidation), getAppointments);
router.post('/', validate(createAppointmentValidation), createAppointment);
router.get('/:id/meeting-minutes', validate(appointmentIdValidation), downloadMeetingMinutes);
router.post(
  '/:id/meeting-minutes',
  validate(appointmentIdValidation),
  handleMeetingMinutesUpload,
  uploadMeetingMinutes
);
router.delete(
  '/:id/meeting-minutes',
  validate(appointmentIdValidation),
  deleteMeetingMinutes
);
router.get('/:id', validate(appointmentIdValidation), getAppointmentById);
router.put('/:id', validate(updateAppointmentValidation), updateAppointment);
router.delete('/:id', validate(appointmentIdValidation), deleteAppointment);

export default router;
