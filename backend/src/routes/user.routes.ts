import { Router } from 'express';
import {
  createUser,
  createUserValidation,
  deleteUser,
  getUsers,
  updateUser,
  updateUserValidation,
  userIdValidation,
} from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();

router.use(authenticate);
router.use(authorize('Admin'));

router.get('/', getUsers);
router.post('/', validate(createUserValidation), createUser);
router.put('/:id', validate(updateUserValidation), updateUser);
router.delete('/:id', validate(userIdValidation), deleteUser);

export default router;
