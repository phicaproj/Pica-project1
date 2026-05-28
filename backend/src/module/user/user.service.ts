import prisma from '../../Config/db';
import AppError from '../../service/shared/appError';
import { NOT_FOUND, CONFLICT } from '../../service/shared/http';
import type { UpdateProfileInput, UpdateBusinessInfoInput } from './user.types';
import type { AuthUser } from '../auth/auth.types';
import { deleteObject } from '../../service/shared/storage.service';
import { R2_PUBLIC_BASE_URL } from '../../Config/env';

export async function updateProfileService(
  userId: string,
  data: UpdateProfileInput
): Promise<AuthUser> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true },
  });

  if (!user) {
    throw new AppError('User not found', NOT_FOUND);
  }

  // Handle email changes (check for uniqueness and reset verification)
  let isVerifiedUpdate = undefined;
  if (data.email) {
    const normalizedEmail = data.email.trim().toLowerCase();
    if (normalizedEmail !== user.email) {
      const emailTaken = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: { id: true },
      });
      if (emailTaken) {
        throw new AppError('An account with this email already exists', CONFLICT);
      }
      isVerifiedUpdate = false; // Reset verification status
    }
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      businessName: data.businessName,
      phone: data.phone,
      email: data.email ? data.email.trim().toLowerCase() : undefined,
      isVerified: isVerifiedUpdate,
    },
    select: {
      id: true,
      email: true,
      businessName: true,
      phone: true,
      avatarUrl: true,
      isVerified: true,
      role: true,
    },
  });

  return updated;
}

export async function updateBusinessInfoService(
  userId: string,
  data: UpdateBusinessInfoInput
): Promise<any> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) {
    throw new AppError('User not found', NOT_FOUND);
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      businessName: data.businessName,
      industry: data.industry,
      country: data.country,
      state: data.state,
      operatingYears: data.operatingYears,
      staffSize: data.staffSize,
      annualRevenue: data.annualRevenue,
    },
    select: {
      id: true,
      email: true,
      businessName: true,
      phone: true,
      avatarUrl: true,
      isVerified: true,
      role: true,
      businessSize: true,
      staffSize: true,
      industry: true,
      country: true,
      state: true,
      operatingYears: true,
      annualRevenue: true,
    },
  });

  return updated;
}

export async function verifyUserEmailService(userId: string): Promise<AuthUser> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) {
    throw new AppError('User not found', NOT_FOUND);
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { isVerified: true },
    select: {
      id: true,
      email: true,
      businessName: true,
      phone: true,
      avatarUrl: true,
      isVerified: true,
      role: true,
    },
  });

  return updated;
}

export async function updateAvatarUrlService(
  userId: string,
  avatarUrl: string
): Promise<AuthUser> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, avatarUrl: true },
  });

  if (!user) {
    throw new AppError('User not found', NOT_FOUND);
  }

  // Clean up existing avatar file from Cloudflare R2
  if (user.avatarUrl && R2_PUBLIC_BASE_URL) {
    const base = R2_PUBLIC_BASE_URL.replace(/\/+$/, '');
    if (user.avatarUrl.startsWith(base)) {
      const existingKey = user.avatarUrl.replace(base, '').replace(/^\/+/, '');
      try {
        await deleteObject(existingKey);
      } catch (err) {
        console.error('Failed to delete old avatar object from R2 storage:', err);
      }
    }
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { avatarUrl },
    select: {
      id: true,
      email: true,
      businessName: true,
      phone: true,
      avatarUrl: true,
      isVerified: true,
      role: true,
    },
  });

  return updated;
}
