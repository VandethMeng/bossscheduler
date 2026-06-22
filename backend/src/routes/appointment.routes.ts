import { Router } from 'express';
import {
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  createAppointmentValidation,
  updateAppointmentValidation,
  appointmentIdValidation,
  appointmentFilterValidation,
} from '../controllers/appointment.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();

router.use(authenticate);

router.get('/', validate(appointmentFilterValidation), getAppointments);
router.get('/:id', validate(appointmentIdValidation), getAppointmentById);
router.post('/', validate(createAppointmentValidation), createAppointment);
router.put('/:id', validate(updateAppointmentValidation), updateAppointment);
router.delete('/:id', validate(appointmentIdValidation), deleteAppointment);

export default router;
