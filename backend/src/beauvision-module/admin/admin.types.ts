import z from 'zod';

export const CreateAdmin = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(60),
  email: z.email('Invalid email address').trim().toLowerCase(),
  password: z.string().min(6).max(24).optional(),
  role: z.enum(['OWNER', 'ADMIN']).default('ADMIN'),
});

export const LoginAdmin = z.object({
  email: z.email('Invalid email address').trim().toLowerCase(),
  password: z.string().min(6).max(24),
});

export const UpdateProfileSchema = z.object({
  name: z.string().min(3).max(60),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(6).max(24),
});

export const ForgotPasswordSchema = z.object({
  email: z.email().trim().toLowerCase(),
});

export const ResetPasswordSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(6).max(24),
});

export interface IBeauvisionAdminCreate extends z.infer<typeof CreateAdmin> {}
export interface IBeauvisionAdminLogin extends z.infer<typeof LoginAdmin> {}
