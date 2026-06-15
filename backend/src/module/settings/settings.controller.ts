import { Request, Response } from 'express';
import asyncHandler from '../../service/shared/catchErrors';
import AppError from '../../service/shared/appError';
import { OK, UNAUTHORIZED } from '../../service/shared/http';
import { updateAppSettingsSchema } from './settings.types';
import { getAppSettingsService, updateAppSettingsService } from './settings.service';

export const getAppSettings = asyncHandler(async (_req: Request, res: Response) => {
  const result = await getAppSettingsService();
  return res.status(OK).json(result);
});

export const updateAppSettings = asyncHandler(async (req: Request, res: Response) => {
  const input = updateAppSettingsSchema.parse(req.body);
  // authenticate + isAdmin run upstream, so user is always populated here.
  // The cast keeps this controller decoupled from the augmented Request type
  // (admin uses the same shape: { id, role, ... } on req.user).
  const userId = (req as Request & { user?: { id?: string } }).user?.id;
  if (!userId) {
    throw new AppError('Authentication required', UNAUTHORIZED);
  }

  const result = await updateAppSettingsService(input, userId);
  return res.status(OK).json(result);
});
