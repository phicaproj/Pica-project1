import { Request, Response } from 'express';
import asyncHandler from '../../service/shared/catchErrors';
import AppError from '../../service/shared/appError';
import { OK, BAD_REQUEST, UNAUTHORIZED } from '../../service/shared/http';
import { updateProfileSchema, updateBusinessInfoSchema } from './user.types';
import {
  updateProfileService,
  updateBusinessInfoService,
  verifyUserEmailService,
  updateAvatarUrlService,
} from './user.service';
import { uploadAvatar as uploadToR2 } from '../../service/shared/storage.service';

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError('User not authenticated', UNAUTHORIZED);
  }
  const input = updateProfileSchema.parse(req.body);
  const result = await updateProfileService(req.user.id, input);
  return res.status(OK).json({
    message: 'Profile updated successfully',
    user: result,
  });
});

export const updateBusinessInfo = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError('User not authenticated', UNAUTHORIZED);
  }
  const input = updateBusinessInfoSchema.parse(req.body);
  const result = await updateBusinessInfoService(req.user.id, input);
  return res.status(OK).json({
    message: 'Business information updated successfully',
    user: result,
  });
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError('User not authenticated', UNAUTHORIZED);
  }
  const result = await verifyUserEmailService(req.user.id);
  return res.status(OK).json({
    message: 'Email verified successfully',
    user: result,
  });
});

export const uploadAvatar = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError('User not authenticated', UNAUTHORIZED);
  }
  if (!req.file) {
    throw new AppError('No avatar file provided in upload request', BAD_REQUEST);
  }

  // Generate an unguessable unique storage key
  const fileExt = req.file.originalname.split('.').pop() || 'png';
  const cleanOriginalName = req.file.originalname.replace(/[^a-zA-Z0-9]/g, '_');
  const key = `avatars/${req.user.id}-${Date.now()}-${cleanOriginalName}.${fileExt}`;

  // Call the storage convenience service to push directly to Cloudflare R2
  const uploadResult = await uploadToR2(key, req.file.buffer, req.file.mimetype);

  // Update the user database row
  const updatedUser = await updateAvatarUrlService(req.user.id, uploadResult.url);

  return res.status(OK).json({
    message: 'Avatar uploaded successfully',
    avatarUrl: uploadResult.url,
    user: updatedUser,
  });
});
