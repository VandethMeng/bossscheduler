import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { dashboardService } from '../services/DashboardService';

export const getDashboardStats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await dashboardService.getStats();

  res.status(200).json({
    success: true,
    data: stats,
  });
});
