import { body, param } from 'express-validator';
import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authService } from '../services/AuthService';
import { UserRole } from '../models/User';

const roleValues: UserRole[] = ['Admin', 'Assistant', 'Organizer'];

export const userIdValidation = [
  param('id').isUUID().withMessage('Invalid user ID'),
];

export const createUserValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('role')
    .isIn(roleValues)
    .withMessage(`Role must be one of: ${roleValues.join(', ')}`),
];

export const updateUserValidation = [
  param('id').isUUID().withMessage('Invalid user ID'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('password')
    .optional()
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('role')
    .optional()
    .isIn(roleValues)
    .withMessage(`Role must be one of: ${roleValues.join(', ')}`),
];

export const getUsers = asyncHandler(async (_req: Request, res: Response) => {
  const users = authService.getUsers();

  res.status(200).json({
    success: true,
    data: users,
    count: users.length,
  });
});

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.createUser(req.body);

  res.status(201).json({
    success: true,
    data: user,
    message: 'User created successfully',
  });
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const user = await authService.updateUser(id, req.body, req.user!.id);

  res.status(200).json({
    success: true,
    data: user,
    message: 'User updated successfully',
  });
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const user = await authService.deleteUser(id, req.user!.id);

  res.status(200).json({
    success: true,
    data: user,
    message: 'User deleted successfully',
  });
});
