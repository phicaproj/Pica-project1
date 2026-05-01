import { Request, Response } from 'express';
import asyncHandler from '../../service/shared/catchErrors';
import { CREATED, OK } from '../../service/shared/http';
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verifyResetOtpSchema,
} from './auth.types';
import {
  forgotPasswordService,
  loginService,
  registerService,
  resetPasswordService,
  verifyResetOtpService,
} from './auth.service';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const request = registerSchema.parse(req.body);
  const result = await registerService(request);

  return res.status(CREATED).json(result);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const request = loginSchema.parse(req.body);
  const result = await loginService(request);

  return res.status(OK).json(result);
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const request = forgotPasswordSchema.parse(req.body);
  const result = await forgotPasswordService(request);

  return res.status(OK).json(result);
});

export const verifyResetOtp = asyncHandler(async (req: Request, res: Response) => {
  const request = verifyResetOtpSchema.parse(req.body);
  const result = await verifyResetOtpService(request);

  return res.status(OK).json(result);
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const request = resetPasswordSchema.parse(req.body);
  const result = await resetPasswordService(request);

  return res.status(OK).json(result);
});
