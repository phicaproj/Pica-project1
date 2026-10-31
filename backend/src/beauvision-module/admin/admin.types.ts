import z from 'zod';

export const BEAUVISION_PERMISSION_KEYS = ['read', 'write', 'delete'] as const;

export const BeauvisionPermissionSchema = z.enum(BEAUVISION_PERMISSION_KEYS);

export const BeauvisionAdminRoleSchema = z.enum(['OWNER', 'ADMIN']);

export const BeauvisionAdminStatusSchema = z.enum(['ACTIVE', 'DISABLED']);

export type BeauvisionPermission = z.infer<typeof BeauvisionPermissionSchema>;
export type BeauvisionAdminRole = z.infer<typeof BeauvisionAdminRoleSchema>;
export type BeauvisionAdminStatus = z.infer<typeof BeauvisionAdminStatusSchema>;

export const CreateAdmin = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(60),
  email: z.email('Invalid email address').trim().toLowerCase(),
  password: z.string().min(6).max(24).optional(),
  role: BeauvisionAdminRoleSchema.default('ADMIN'),
  permissions: z.array(BeauvisionPermissionSchema).default([]),
});

export const InviteAdmin = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(60).optional(),
  email: z.email('Invalid email address').trim().toLowerCase(),
  role: BeauvisionAdminRoleSchema.default('ADMIN'),
  permissions: z.array(BeauvisionPermissionSchema).default([]),
});

export const AcceptInvite = z.object({
  token: z.string('Invite token is required'),
  name: z.string().min(3, 'Name must be at least 3 characters').max(60).optional(),
  newPassword: z.string().min(6).max(24),
});

export const UpdateAdminAccess = z.object({
  role: BeauvisionAdminRoleSchema.optional(),
  permissions: z.array(BeauvisionPermissionSchema).optional(),
});

export const UpdateAdminStatus = z.object({
  status: BeauvisionAdminStatusSchema,
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
export interface IBeauvisionAdminInvite extends z.infer<typeof InviteAdmin> {}
export interface IBeauvisionAdminAcceptInvite extends z.infer<typeof AcceptInvite> {}
export interface IBeauvisionAdminAccessUpdate extends z.infer<typeof UpdateAdminAccess> {}
export interface IBeauvisionAdminStatusUpdate extends z.infer<typeof UpdateAdminStatus> {}

export const RefreshTokenSchema = z.object({
  refreshToken: z.string('Refresh token is required'),
});
