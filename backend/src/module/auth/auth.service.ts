import bcrypt from 'bcrypt';
import { Phase, SessionStatus } from '@prisma/client';
import prisma from '../../Config/db';
import AppError from '../../service/shared/appError';
import {
  BAD_REQUEST,
  CONFLICT,
  FORBIDDEN,
  NOT_FOUND,
  UNAUTHORIZED,
} from '../../service/shared/http';
import {
  generateAccessToken,
  generateOtpToken,
  generatePasswordResetToken,
  generateRefreshToken,
  verifyOtpToken,
  verifyPasswordResetToken,
} from '../../service/shared/generateToken';
import { sendPasswordResetEmail, sendWelcomeEmail } from '../../service/shared/email.service';
import type {
  ForgotPasswordInput,
  ForgotPasswordResponse,
  LoginInput,
  LoginResponse,
  MeResponse,
  RegisterInput,
  RegisterResponse,
  ResetPasswordInput,
  ResetPasswordResponse,
  VerifyResetOtpInput,
  VerifyResetOtpResponse,
} from './auth.types';

const SALT_ROUNDS = 10;

export async function registerService(data: RegisterInput): Promise<RegisterResponse> {
  const normalizedEmail = data.email.trim().toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });

  if (existingUser) {
    throw new AppError('An account with this email already exists', CONFLICT);
  }

  // Gate: registration is only allowed for users who have completed (or progressed past)
  // a Phase 1 assessment under this email. We snapshot the Phase 1 lead data onto the User
  // so Phase 2A can read businessSize directly from req.user.
  const phase1Session = await prisma.assessmentSession.findFirst({
    where: {
      leadEmail: normalizedEmail,
      phase: Phase.PHASE1,
      status: {
        in: [SessionStatus.COMPLETED, SessionStatus.PAID, SessionStatus.REPORT_GENERATED],
      },
    },
    select: {
      id: true,
      businessSize: true,
      staffSize: true,
      industry: true,
      location: true,
      operatingYears: true,
      annualRevenue: true,
    },
  });

  if (!phase1Session) {
    throw new AppError(
      'You must take the free Phase 1 scan before creating an account. Please complete the free assessment first.',
      FORBIDDEN
    );
  }

  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

  let country: string | null = null;
  let state: string | null = null;
  if (phase1Session.location) {
    const parts = phase1Session.location.split(',').map(p => p.trim());
    if (parts.length > 1) {
      country = parts[parts.length - 1];
      state = parts.slice(0, parts.length - 1).join(', ');
    } else {
      country = parts[0];
    }
  }

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash,
      businessName: data.businessName,
      phone: data.phone,
      businessSize: phase1Session.businessSize,
      staffSize: phase1Session.staffSize,
      industry: phase1Session.industry,
      country,
      state,
      operatingYears: phase1Session.operatingYears,
      annualRevenue: phase1Session.annualRevenue,
    },
    select: {
      id: true,
      email: true,
      businessName: true,
      phone: true,
      avatarUrl: true,
      isVerified: true,
    },
  });

  await prisma.assessmentSession.updateMany({
    where: { leadEmail: user.email },
    data: { userId: user.id },
  });

  try {
    await sendWelcomeEmail(user.email, user.businessName ?? user.email);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error sending welcome email:', message);
  }

  return {
    message: 'Registration successful',
    user: {
      id: user.id,
      email: user.email,
      businessName: user.businessName,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      isVerified: user.isVerified,
    },
  };
}

export async function loginService(data: LoginInput): Promise<LoginResponse> {
  const normalizedEmail = data.email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      businessName: true,
      phone: true,
      avatarUrl: true,
      isVerified: true,
    },
  });

  if (!user || !user.passwordHash) {
    throw new AppError('Invalid email or password', UNAUTHORIZED);
  }

  const passwordMatches = await bcrypt.compare(data.password, user.passwordHash);

  if (!passwordMatches) {
    throw new AppError('Invalid email or password', UNAUTHORIZED);
  }

  const tokenPayload = { id: user.id, role: 'User' as const };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  return {
    message: 'Login successful',
    user: {
      id: user.id,
      email: user.email,
      businessName: user.businessName,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      isVerified: user.isVerified,
    },
    accessToken,
    refreshToken,
  };
}

function generateOtpCode(): string {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

export async function forgotPasswordService(
  data: ForgotPasswordInput
): Promise<ForgotPasswordResponse> {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
    select: { id: true, email: true },
  });

  if (!user) {
    throw new AppError('No account found with this email', NOT_FOUND);
  }

  const code = generateOtpCode();
  const otpToken = generateOtpToken({ email: user.email, code });

  try {
    await sendPasswordResetEmail(user.email, code);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error sending password reset email:', message);
  }

  return {
    message: 'Password reset code sent. Check your email.',
    otpToken,
  };
}

export async function verifyResetOtpService(
  data: VerifyResetOtpInput
): Promise<VerifyResetOtpResponse> {
  const payload = verifyOtpToken(data.otpToken);

  if (payload.email !== data.email) {
    throw new AppError('OTP does not match the provided email', BAD_REQUEST);
  }

  if (payload.code !== data.code) {
    throw new AppError('Invalid or expired reset code', BAD_REQUEST);
  }

  const passwordToken = generatePasswordResetToken({
    email: data.email,
    purpose: 'password-reset',
  });

  return {
    message: 'Reset code verified. You can now set a new password.',
    passwordToken,
  };
}

export async function resetPasswordService(
  data: ResetPasswordInput
): Promise<ResetPasswordResponse> {
  const payload = verifyPasswordResetToken(data.passwordToken);

  if (payload.purpose !== 'password-reset') {
    throw new AppError('Invalid password reset token', BAD_REQUEST);
  }

  const user = await prisma.user.findUnique({
    where: { email: payload.email },
    select: { id: true },
  });

  if (!user) {
    throw new AppError('Account no longer exists', NOT_FOUND);
  }

  const passwordHash = await bcrypt.hash(data.newPassword, SALT_ROUNDS);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  return {
    message: 'Password reset successfully',
  };
}

export async function meService(userId: string): Promise<MeResponse> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      businessName: true,
      phone: true,
      avatarUrl: true,
      isVerified: true,
      businessSize: true,
      staffSize: true,
      industry: true,
      country: true,
      state: true,
      operatingYears: true,
      annualRevenue: true,
    },
  });

  if (!user) {
    throw new AppError('User not found', NOT_FOUND);
  }

  // Per-result paywall: "has the user paid for anything?" is now derived
  // from SessionResult.isPaid rather than a user-level flag.
  const paidResultCount = await prisma.sessionResult.count({
    where: {
      isPaid: true,
      session: { userId: user.id, phase: 'PHASE2A' },
    },
  });

  return {
    message: 'User fetched successfully',
    user: {
      id: user.id,
      email: user.email,
      businessName: user.businessName,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      isVerified: user.isVerified,
      businessSize: user.businessSize,
      hasAnyPaidPhase2AResult: paidResultCount > 0,
      staffSize: user.staffSize,
      industry: user.industry,
      country: user.country,
      state: user.state,
      operatingYears: user.operatingYears,
      annualRevenue: user.annualRevenue,
    },
  };
}
