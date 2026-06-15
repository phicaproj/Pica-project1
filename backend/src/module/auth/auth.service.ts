import bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { BusinessSize, Phase, SessionStatus, UserRole, UserStatus } from '@prisma/client';
import prisma from '../../Config/db';
import AppError from '../../service/shared/appError';
import { parseLocation } from '../../service/shared/location';
import { resolveAdminAccess } from '../../service/middleware/authMiddleware';
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
  verifyInviteToken,
  verifyOtpToken,
  verifyPasswordResetToken,
} from '../../service/shared/generateToken';
import {
  adminCodeEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
} from '../../service/shared/email.service';
import type {
  AcceptInviteInput,
  AcceptInviteResponse,
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

// Mirrors the staff-only classifier in assessment.service.ts so registerService
// can derive businessSize from the headcount the user types at signup. Kept
// local on purpose — it's two lines, and routing the call through assessment
// would couple auth to it for no other reason.
const SMALL_STAFF_THRESHOLD = 50;
function classifyStaffSizeForRegistration(staffSize: string): BusinessSize {
  const match = staffSize.match(/\d+/);
  if (!match) return BusinessSize.SMALL;
  const headcount = Number.parseInt(match[0], 10);
  return headcount > SMALL_STAFF_THRESHOLD ? BusinessSize.MEDIUM : BusinessSize.SMALL;
}

export async function registerService(data: RegisterInput): Promise<RegisterResponse> {
  const normalizedEmail = data.email.trim().toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });

  if (existingUser) {
    throw new AppError('An account with this email already exists', CONFLICT);
  }

  // Registration no longer requires a prior Phase 1 session. We still look
  // one up by email so we can pre-fill profile fields the user already gave
  // us during the free scan (and so businessSize is resolved automatically);
  // anything missing falls back to what the user typed at signup. The
  // dashboard prompts the user to finish their profile when businessSize is
  // still null — see meService.profileComplete.
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

  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

  // Resolve country/state from either the user's signup input (preferred when
  // present) or the Phase 1 session's free-text location.
  const fallbackLocation = phase1Session
    ? parseLocation(phase1Session.location)
    : { country: null as string | null, state: null as string | null };

  // Staff size dictates businessSize. If we have it from either source,
  // classify; otherwise leave businessSize null and let the dashboard nag.
  const resolvedStaffSize = data.staffSize ?? phase1Session?.staffSize ?? null;
  const resolvedBusinessSize = resolvedStaffSize
    ? classifyStaffSizeForRegistration(resolvedStaffSize)
    : (phase1Session?.businessSize ?? null);

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash,
      businessName: data.businessName,
      phone: data.phone,
      businessSize: resolvedBusinessSize,
      staffSize: resolvedStaffSize,
      industry: data.industry ?? phase1Session?.industry ?? null,
      country: data.country ?? fallbackLocation.country,
      state: data.state ?? fallbackLocation.state,
      operatingYears: data.operatingYears ?? phase1Session?.operatingYears ?? null,
      annualRevenue: phase1Session?.annualRevenue ?? null,
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
      status: true,
    },
  });

  if (!user || !user.passwordHash) {
    throw new AppError('Invalid email or password', UNAUTHORIZED);
  }

  const passwordMatches = await bcrypt.compare(data.password, user.passwordHash);

  if (!passwordMatches) {
    throw new AppError('Invalid email or password', UNAUTHORIZED);
  }

  // Checked AFTER the password so account standing is only revealed to
  // someone who actually holds the credentials.
  if (user.status === UserStatus.DISABLED) {
    throw new AppError('Your account has been suspended. Contact support.', FORBIDDEN);
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
      throw new AppError(
        'Could not send admin login code. Please try again.',
        INTERNAL_SERVER_ERROR
      );
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

// Cryptographically strong 5-digit OTP. Math.random() is predictable enough
// to be guessable from a few observed codes, which matters for admin login
// and password reset — randomInt uses the OS CSPRNG.
function generateOtpCode(): string {
  return randomInt(10000, 100000).toString();
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

// Activates an invited admin account. The account was created with
// passwordHash: null (see inviteAdminService), so login is impossible until
// this sets the invitee's own password. Re-using a spent invite link is
// rejected so a leaked link can't reset an already-active account.
export async function acceptInviteService(data: AcceptInviteInput): Promise<AcceptInviteResponse> {
  const payload = verifyInviteToken(data.token);

  if (payload.purpose !== 'admin-invite') {
    throw new AppError('Invalid invite link', BAD_REQUEST);
  }

  const user = await prisma.user.findUnique({
    where: { email: payload.email.trim().toLowerCase() },
    select: { id: true, role: true, passwordHash: true },
  });

  if (!user || user.role !== UserRole.ADMIN) {
    throw new AppError('This invitation is no longer valid', BAD_REQUEST);
  }

  if (user.passwordHash) {
    throw new AppError('This invitation has already been used. Please sign in instead.', CONFLICT);
  }

  const passwordHash = await bcrypt.hash(data.newPassword, SALT_ROUNDS);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, isVerified: true },
  });

  return {
    message: 'Account activated. You can now sign in.',
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
      status: true,
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

  if (user.status === UserStatus.DISABLED) {
    throw new AppError('Your account has been suspended. Contact support.', FORBIDDEN);
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
      status: true,
      permissions: true,
      department: true,
      adminRoleId: true,
      adminRole: {
        select: {
          name: true,
          permissions: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError('Account no longer exists', NOT_FOUND);
  }

  if (user.role !== 'ADMIN') {
    throw new AppError('Access denied: not an admin account', FORBIDDEN);
  }

  // Re-checked here because the account may have been suspended between
  // requesting the OTP and verifying it.
  if (user.status === UserStatus.DISABLED) {
    throw new AppError('Your account has been suspended. Contact support.', FORBIDDEN);
  }

  // Per-person permissions are the source of truth; the legacy adminRole is a
  // fallback. resolveAdminAccess centralizes the super-admin + fallback rules
  // shared with the auth middleware.
  const access = resolveAdminAccess(user);

  const tokenPayload = {
    id: user.id,
    role: user.role,
    adminRoleName: access.label,
    permissions: access.permissions,
  };
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
      adminRoleName: access.label ?? null,
      permissions: access.permissions,
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

  // Minimum required to unlock paid tests: businessSize must be resolved
  // (which means we have a staffSize from either lead capture or signup).
  // The FE uses this flag to show / hide the "Complete your profile" banner.
  const profileComplete = user.businessSize !== null;

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
      profileComplete,
    },
  };
}
