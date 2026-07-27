import z from 'zod';

// Registration now captures the baseline business profile at the front door
// (client UAT feedback): contact person name, staff size, sector, and years in
// operation are mandatory alongside the account basics. `country`/`state` stay
// optional (filled in later via /user/business). `annualRevenue` is
// intentionally absent: business size is staff-only now (see
// assessment.service.ts).
export const registerSchema = z.object({
  email: z.email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one special character, lowercase letter, uppercase letter, and number'
    ),
  // Contact person name — stored as firstName/lastName on the User.
  firstName: z
    .string()
    .trim()
    .min(1, 'Contact first name is required')
    .max(50, 'First name must be at most 50 characters long'),
  lastName: z
    .string()
    .trim()
    .min(1, 'Contact last name is required')
    .max(50, 'Last name must be at most 50 characters long'),
  businessName: z
    .string()
    .min(3, 'Business name must be at least 3 characters long')
    .max(100, 'Business name must be at most 100 characters long'),
  phone: z
    .string()
    .regex(/^\+?\d{10,15}$/, 'Phone number must be 10–15 digits, optionally starting with +'),
  // Staff size is a headcount: whole positive integer only (no decimals).
  staffSize: z
    .string()
    .trim()
    .regex(/^\d+$/, 'Staff size must be a whole number (no decimals)')
    .refine((v) => Number.parseInt(v, 10) >= 1, 'Staff size must be at least 1'),
  industry: z.string().trim().min(1, 'Sector is required'),
  operatingYears: z.string().trim().min(1, 'Years in operation is required'),
  country: z.string().trim().min(1).optional(),
  state: z.string().trim().min(1).optional(),
});

export const loginSchema = z.object({
  email: z.email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const verifyEmailSchema = z.object({
  email: z.email('Invalid email address'),
  code: z.string().regex(/^\d{6}$/, 'Code must be a 6-digit number'),
  otpToken: z.string().min(1, 'Verification token is required'),
});

export const resendVerificationSchema = z.object({
  email: z.email('Invalid email address'),
});

export const forgotPasswordSchema = z.object({
  email: z.email('Invalid email address'),
});

export const verifyResetOtpSchema = z.object({
  email: z.email('Invalid email address'),
  code: z.string().regex(/^\d{6}$/, 'Code must be a 6-digit number'),
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
  code: z.string().regex(/^\d{6}$/, 'Code must be a 6-digit number'),
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
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
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

// Registration always leaves the account unverified: it returns an OTP token
// (never access tokens) and the client must complete email verification before
// it can log in.
export type RegisterResponse = {
  message: string;
  requiresVerification: true;
  otpToken: string;
  email: string;
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
  // Account exists but hasn't verified its email yet: a fresh code is sent and
  // the client is bounced to the verification screen (hard gate).
  | {
      requiresVerification: true;
      otpToken: string;
      email: string;
    }
);

export type VerifyEmailResponse = {
  message: string;
  requiresOtp: false;
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};

export type ResendVerificationResponse = {
  message: string;
  otpToken: string;
  email: string;
};

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
