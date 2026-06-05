import bcrypt from 'bcrypt';
import { Phase, SessionStatus } from '@prisma/client';
import prisma from '../../Config/db';
import AppError from '../../service/shared/appError';
import {
  BAD_REQUEST,
  CONFLICT,
  FORBIDDEN,
  INTERNAL_SERVER_ERROR,
  NOT_FOUND,
  UNAUTHORIZED,
} from '../../service/shared/http';
import {
  generateAccessToken,
  generateOtpToken,
  generatePasswordResetToken,
  generateRefreshToken,
  hashOtpCode,
  otpCodeMatches,
  verifyOtpToken,
  verifyPasswordResetToken,
} from '../../service/shared/generateToken';
import {
  adminCodeEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
} from '../../service/shared/email.service';
import type {
  AdminLoginResponse,
  ForgotPasswordInput,
  ForgotPasswordResponse,
  LoginInput,
  LoginResponse,
  MeResponse,
  RegisterInput,
  RegisterResponse,
  ResetPasswordInput,
  ResetPasswordResponse,
  VerifyAdminOTPInput,
  VerifyAdminOTPResponse,
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
    const parts = phase1Session.location.split(',').map((p) => p.trim());
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
      firstName: true,
      lastName: true,
      businessName: true,
      phone: true,
      avatarUrl: true,
      isVerified: true,
      role: true,
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
      firstName: user.firstName,
      lastName: user.lastName,
      businessName: user.businessName,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      isVerified: user.isVerified,
      role: user.role,
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
      firstName: true,
      lastName: true,
      businessName: true,
      phone: true,
      avatarUrl: true,
      isVerified: true,
      role: true,
    },
  });

  if (!user || !user.passwordHash) {
    throw new AppError('Invalid email or password', UNAUTHORIZED);
  }

  const passwordMatches = await bcrypt.compare(data.password, user.passwordHash);

  if (!passwordMatches) {
    throw new AppError('Invalid email or password', UNAUTHORIZED);
  }

  if (user.role === 'ADMIN') {
    const code = generateOtpCode();
    const purpose = 'admin-login';
    const otpToken = generateOtpToken({
      email: user.email,
      codeHash: hashOtpCode({ email: user.email, code, purpose }),
      purpose,
    });

    try {
      const sent = await adminCodeEmail(user.email, code);
      if (!sent.success) {
        throw new Error(sent.error ?? 'Admin login code email failed');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error sending admin login code:', message);
      throw new AppError('Could not send admin login code. Please try again.', INTERNAL_SERVER_ERROR);
    }

    return {
      message: 'Admin login requires OTP verification',
      requiresOtp: true,
      otpToken,
      role: 'ADMIN',
      email: user.email,
    };
  }

  const tokenPayload = { id: user.id, role: user.role };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  return {
    message: 'Login successful',
    requiresOtp: false,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      businessName: user.businessName,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      isVerified: user.isVerified,
      role: user.role,
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
  const purpose = 'password-reset';
  const otpToken = generateOtpToken({
    email: user.email,
    codeHash: hashOtpCode({ email: user.email, code, purpose }),
    purpose,
  });

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

  if (payload.purpose !== 'password-reset') {
    throw new AppError('Invalid reset OTP token', BAD_REQUEST);
  }

  if (payload.email !== data.email.trim().toLowerCase()) {
    throw new AppError('OTP does not match the provided email', BAD_REQUEST);
  }

  if (!otpCodeMatches(payload, data.code)) {
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

export async function adminLoginService(data: LoginInput): Promise<AdminLoginResponse> {
  const normalizedEmail = data.email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      role: true,
    },
  });

  if (!user || !user.passwordHash) {
    throw new AppError('Invalid email or password', UNAUTHORIZED);
  }

  if (user.role !== 'ADMIN') {
    throw new AppError('Access denied: not an admin account', FORBIDDEN);
  }

  const passwordMatches = await bcrypt.compare(data.password, user.passwordHash);

  if (!passwordMatches) {
    throw new AppError('Invalid email or password', UNAUTHORIZED);
  }

  const code = generateOtpCode();
  const purpose = 'admin-login';
  const otpToken = generateOtpToken({
    email: user.email,
    codeHash: hashOtpCode({ email: user.email, code, purpose }),
    purpose,
  });

  try {
    const sent = await adminCodeEmail(user.email, code);
    if (!sent.success) {
      throw new Error(sent.error ?? 'Admin login code email failed');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error sending admin login code:', message);
    throw new AppError('Could not send admin login code. Please try again.', INTERNAL_SERVER_ERROR);
  }

  return {
    message: 'Admin login successful. Please verify OTP to receive access token.',
    requiresOtp: true,
    otpToken,
    role: user.role,
    email: user.email,
  };
}

export async function verifyAdminOTPService(
  data: VerifyAdminOTPInput
): Promise<VerifyAdminOTPResponse> {
  const payload = verifyOtpToken(data.loginToken);

  if (payload.purpose !== 'admin-login') {
    throw new AppError('Invalid admin login OTP token', BAD_REQUEST);
  }

  if (!otpCodeMatches(payload, data.code)) {
    throw new AppError('Invalid or expired OTP code', BAD_REQUEST);
  }

  const user = await prisma.user.findUnique({
    where: { email: payload.email },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      businessName: true,
      phone: true,
      avatarUrl: true,
      isVerified: true,
      role: true,
    },
  });

  if (!user) {
    throw new AppError('Account no longer exists', NOT_FOUND);
  }

  if (user.role !== 'ADMIN') {
    throw new AppError('Access denied: not an admin account', FORBIDDEN);
  }

  const tokenPayload = { id: user.id, role: user.role };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  return {
    message: 'OTP verified. Admin access granted.',
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      businessName: user.businessName,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      isVerified: user.isVerified,
      role: user.role,
    },
    accessToken,
    refreshToken,
  };
}

export async function meService(userId: string): Promise<MeResponse> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
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
      firstName: user.firstName,
      lastName: user.lastName,
      businessName: user.businessName,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      isVerified: user.isVerified,
      role: user.role,
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
