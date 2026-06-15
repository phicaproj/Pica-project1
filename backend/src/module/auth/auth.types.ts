import z from 'zod';

// Registration no longer requires a prior Phase 1 scan. The mandatory fields
// stay the same (email + password + businessName + phone); profile fields are
// accepted optionally so a user who skipped the free scan can supply them at
// signup. Whatever the user leaves blank can be filled in later via
// /user/business — the dashboard prompts when profileComplete is false.
// `annualRevenue` is intentionally absent: business size is staff-only now
// (see assessment.service.ts).
export const registerSchema = z.object({
  email: z.email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one special character, lowercase letter, uppercase letter, and number'
    ),
  businessName: z
    .string()
    .min(3, 'Business name must be at least 3 characters long')
    .max(100, 'Business name must be at most 100 characters long'),
  phone: z
    .string()
    .regex(/^\+?\d{10,15}$/, 'Phone number must be 10–15 digits, optionally starting with +'),
  staffSize: z.string().trim().min(1).optional(),
  industry: z.string().trim().min(1).optional(),
  country: z.string().trim().min(1).optional(),
  state: z.string().trim().min(1).optional(),
  operatingYears: z.string().trim().min(1).optional(),
});

export const loginSchema = z.object({
  email: z.email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.email('Invalid email address'),
});

export const verifyResetOtpSchema = z.object({
  email: z.email('Invalid email address'),
  code: z.string().regex(/^\d{5}$/, 'Code must be a 5-digit number'),
  otpToken: z.string().min(1, 'OTP token is required'),
});

export const resetPasswordSchema = z.object({
  passwordToken: z.string().min(1, 'Password token is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one special character, lowercase letter, uppercase letter, and number'
    ),
});

export const verifyAdminOTPSchema = z.object({
  loginToken: z.string().min(1, 'Login token is required'),
  code: z.string().regex(/^\d{5}$/, 'Code must be a 5-digit number'),
});

export const acceptInviteSchema = z.object({
  token: z.string().min(1, 'Invite token is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one special character, lowercase letter, uppercase letter, and number'
    ),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type VerifyResetOtpInput = z.infer<typeof verifyResetOtpSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type VerifyAdminOTPInput = z.infer<typeof verifyAdminOTPSchema>;
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;
export type AuthUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  businessName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  isVerified: boolean;
  role: string;
  adminRoleName?: string | null;
  permissions?: string[];
};

export type RegisterResponse = {
  message: string;
  user: AuthUser;
};

export type LoginResponse = {
  message: string;
} & (
  | {
      requiresOtp: false;
      user: AuthUser;
      accessToken: string;
      refreshToken: string;
    }
  | {
      requiresOtp: true;
      otpToken: string;
      role: 'ADMIN';
      email: string;
    }
);

export type ForgotPasswordResponse = {
  message: string;
  otpToken: string;
};

export type VerifyResetOtpResponse = {
  message: string;
  passwordToken: string;
};

export type ResetPasswordResponse = {
  message: string;
};

export type AcceptInviteResponse = {
  message: string;
};

export type AdminLoginResponse = {
  message: string;
  requiresOtp: true;
  otpToken: string;
  role: 'ADMIN';
  email: string;
};

export type VerifyAdminOTPResponse = {
  message: string;
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};

export type MeUser = AuthUser & {
  businessSize: 'SMALL' | 'MEDIUM' | null;
  hasAnyPaidPhase2AResult: boolean;
  staffSize: string | null;
  industry: string | null;
  country: string | null;
  state: string | null;
  operatingYears: string | null;
  annualRevenue: string | null;
  // True once the user has supplied enough profile data to unlock paid tests
  // (Phase 2A / 2B). Today the only hard requirement is `businessSize`, which
  // is derived from staffSize at lead capture or at signup; everything else is
  // surfaced to the FE so it can render a profile-completion banner.
  profileComplete: boolean;
};

export type MeResponse = {
  message: string;
  user: MeUser;
};
