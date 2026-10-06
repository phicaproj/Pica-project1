import { Request, Response } from 'express';
import { AdminService } from './admin.service';
import { CREATED, OK, UNAUTHORIZED } from '../../service/shared/http';
import catchErrors from '../../service/shared/catchErrors';
import AppError from '../../service/shared/appError';
import {
  CreateAdmin,
  LoginAdmin,
  UpdateProfileSchema,
  ChangePasswordSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  RefreshTokenSchema,
} from './admin.types';

export const createAdmin = catchErrors(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError('User not authenticated', UNAUTHORIZED);
  }
  const admin = await AdminService.createAdmin(CreateAdmin.parse(req.body), req.user.role);
  res.status(CREATED).json({
    status: true,
    message: 'Admin created successfully',
    data: admin,
  });
});

export const loginAdmin = catchErrors(async (req: Request, res: Response) => {
  const body = LoginAdmin.parse(req.body);
  const result = await AdminService.loginAdmin(body);
  res.status(OK).json({
    status: true,
    message: 'Login successful',
    data: result,
  });
});

export const getAdmins = catchErrors(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError('User not authenticated', UNAUTHORIZED);
  }
  const admins = await AdminService.getAllAdmins();
  res.status(OK).json({
    status: true,
    message: 'Admins retrieved successfully',
    data: admins,
  });
});

export const deleteAdmin = catchErrors(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError('User not authenticated', UNAUTHORIZED);
  }

  const id = req.params.id as string;
  const result = await AdminService.deleteAdmin(id, req.user.role as string);
  res.status(OK).json({
    status: true,
    message: result.message,
  });
});

export const getProfile = catchErrors(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError('User not authenticated', UNAUTHORIZED);
  }
  const profile = await AdminService.getProfile(req.user.id);
  res.status(OK).json({
    status: true,
    message: 'Profile retrieved successfully',
    data: profile,
  });
});

export const updateProfile = catchErrors(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError('User not authenticated', UNAUTHORIZED);
  }
  const { name } = UpdateProfileSchema.parse(req.body);
  const profile = await AdminService.updateProfile(req.user.id, name);
  res.status(OK).json({
    status: true,
    message: 'Profile updated successfully',
    data: profile,
  });
});

export const changePassword = catchErrors(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError('User not authenticated', UNAUTHORIZED);
  }
  const { currentPassword, newPassword } = ChangePasswordSchema.parse(req.body);
  const result = await AdminService.changePassword(req.user.id, currentPassword, newPassword);
  res.status(OK).json({
    status: true,
    message: result.message,
  });
});

export const forgotPassword = catchErrors(async (req: Request, res: Response) => {
  const { email } = ForgotPasswordSchema.parse(req.body);
  const result = await AdminService.forgotPassword(email);
  res.status(OK).json({
    status: true,
    message: result.message,
  });
});

export const resetPassword = catchErrors(async (req: Request, res: Response) => {
  const { token, newPassword } = ResetPasswordSchema.parse(req.body);
  const result = await AdminService.resetPassword(token, newPassword);
  res.status(OK).json({
    status: true,
    message: result.message,
  });
});

export const refreshAdminToken = catchErrors(async (req: Request, res: Response) => {
  const { refreshToken } = RefreshTokenSchema.parse(req.body);
  const result = await AdminService.refreshAdminToken(refreshToken);
  res.status(OK).json({
    status: true,
    message: 'Token refreshed successfully',
    data: result,
  });
});
