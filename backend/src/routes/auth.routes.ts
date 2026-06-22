import { Router } from 'express';
import { login, loginValidation } from '../controllers/auth.controller';
import { validate } from '../middleware/validation.middleware';

const router = Router();

router.post('/login', validate(loginValidation), login);

export default router;
