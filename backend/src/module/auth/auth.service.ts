import bcrypt from 'bcrypt';
import prisma from '../../Config/db';
import AppError from '../../service/shared/appError';
import { BAD_REQUEST, CONFLICT, NOT_FOUND, UNAUTHORIZED } from '../../service/shared/http';
import {
  generateAccessToken,
  generateOtpToken,
  generatePasswordResetToken,
  generateRefreshToken,
  verifyOtpToken,
  verifyPasswordResetToken,
} from '../../service/shared/generateToken';
import {
  sendPasswordResetEmail,
  sendWelcomeEmail,
} from '../../service/shared/email.service';
import type {
  ForgotPasswordInput,
  ForgotPasswordResponse,
  LoginInput,
  LoginResponse,
  RegisterInput,
  RegisterResponse,
  ResetPasswordInput,
  ResetPasswordResponse,
  VerifyResetOtpInput,
  VerifyResetOtpResponse,
} from './auth.types';

const SALT_ROUNDS = 10;

export async function registerService(data: RegisterInput): Promise<RegisterResponse> {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
    select: { id: true },
  });

  if (existingUser) {
    throw new AppError('An account with this email already exists', CONFLICT);
  }

  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      businessName: data.businessName,
      phone: data.phone,
    },
    select: {
      id: true,
      email: true,
      businessName: true,
      phone: true,
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
    user,
  };
}

export async function loginService(data: LoginInput): Promise<LoginResponse> {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      businessName: true,
      phone: true,
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
