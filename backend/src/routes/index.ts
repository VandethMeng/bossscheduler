import { Router } from 'express';
import authRoutes from './auth.routes';
import appointmentRoutes from './appointment.routes';
import dashboardRoutes from './dashboard.routes';
import userRoutes from './user.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/users', userRoutes);

export default router;
