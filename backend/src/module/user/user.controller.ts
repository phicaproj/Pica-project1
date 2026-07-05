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
import { uploadAvatar as uploadToR2, deleteObject } from '../../service/shared/storage.service';
import prisma from '../../Config/db';
import { R2_PUBLIC_BASE_URL } from '../../Config/env';

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id || req.user?.role !== 'USER') {
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
  if (!req.user?.id || req.user?.role !== 'USER') {
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
  if (!req.user?.id || req.user?.role !== 'USER') {
    throw new AppError('User not authenticated', UNAUTHORIZED);
  }
  const result = await verifyUserEmailService(req.user.id);
  return res.status(OK).json({
    message: 'Email verified successfully',
    user: result,
  });
});

function detectMimeTypeFromBuffer(buffer: Buffer): string | null {
  if (buffer.length < 4) return null;

  // Check PNG: 89 50 4E 47
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return 'image/png';
  }

  // Check JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  // Check WebP: RIFF ... WEBP
  if (
    buffer[0] === 0x52 && // R
    buffer[1] === 0x49 && // I
    buffer[2] === 0x46 && // F
    buffer[3] === 0x46 && // F
    buffer.length >= 12 &&
    buffer[8] === 0x57 && // W
    buffer[9] === 0x45 && // E
    buffer[10] === 0x42 && // B
    buffer[11] === 0x50 // P
  ) {
    return 'image/webp';
  }

  return null;
}

export const uploadAvatar = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id || req.user?.role !== 'USER') {
    throw new AppError('User not authenticated', UNAUTHORIZED);
  }
  if (!req.file) {
    throw new AppError('No avatar file provided in upload request', BAD_REQUEST);
  }

  // 1. Sniff binary magic-bytes for format validation
  const detectedMime = detectMimeTypeFromBuffer(req.file.buffer);
  if (!detectedMime) {
    throw new AppError('Invalid image format. Only JPEG, PNG, and WebP are allowed.', BAD_REQUEST);
  }

  // 2. Fetch current user to check for an existing avatarUrl
  const existingUser = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { avatarUrl: true },
  });

  // 3. If user already has an avatar, delete it first from R2 to save space
  if (existingUser?.avatarUrl && R2_PUBLIC_BASE_URL) {
    const base = R2_PUBLIC_BASE_URL.replace(/\/+$/, '');
    if (existingUser.avatarUrl.startsWith(base)) {
      const existingKey = existingUser.avatarUrl.replace(base, '').replace(/^\/+/, '');
      try {
        await deleteObject(existingKey);
      } catch (err) {
        console.error('Failed to delete old avatar object from R2 storage before uploading:', err);
      }
    }
  }

  // 4. Generate a clean storage key with server-asserted file extension
  const mimeToExt: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
  };
  const fileExt = mimeToExt[detectedMime];
  const key = `avatars/${req.user.id}-${Date.now()}.${fileExt}`;

  // Call the storage convenience service to push directly to Cloudflare R2
  const uploadResult = await uploadToR2(key, req.file.buffer, detectedMime);

  // Update the user database row
  const updatedUser = await updateAvatarUrlService(req.user.id, uploadResult.url);

  return res.status(OK).json({
    message: 'Avatar uploaded successfully',
    avatarUrl: uploadResult.url,
    user: updatedUser,
  });
});
