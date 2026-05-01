import z from 'zod';

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
    .regex(
      /^\+?\d{10,15}$/,
      'Phone number must be 10–15 digits, optionally starting with +'
    ),
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
  code: z
    .string()
    .regex(/^\d{5}$/, 'Code must be a 5-digit number'),
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

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type VerifyResetOtpInput = z.infer<typeof verifyResetOtpSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export type AuthUser = {
  id: string;
  email: string;
  businessName: string | null;
  phone: string | null;
  isVerified: boolean;
};

export type RegisterResponse = {
  message: string;
  user: AuthUser;
};

export type LoginResponse = {
  message: string;
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
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
