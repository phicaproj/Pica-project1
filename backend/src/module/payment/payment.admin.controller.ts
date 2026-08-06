import { Request, Response } from 'express';
import asyncHandler from '../../service/shared/catchErrors';
import AppError from '../../service/shared/appError';
import { OK, UNAUTHORIZED } from '../../service/shared/http';
import { logAudit } from '../../service/shared/audit.service';
import { adminUpdateStatusSchema, paymentIdParams } from './payment.types';
import {
  adminCheckPaymentService,
  adminPaymentDetailService,
  adminPaymentStatsService,
  adminUpdatePaymentStatusService,
} from './payment.admin.service';

export const adminPaymentStats = asyncHandler(async (_req: Request, res: Response) => {
  const result = await adminPaymentStatsService();
  return res.status(OK).json(result);
});

export const adminPaymentDetail = asyncHandler(async (req: Request, res: Response) => {
  const { id } = paymentIdParams.parse(req.params);
  const result = await adminPaymentDetailService(id);
  return res.status(OK).json(result);
});

export const adminCheckPayment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = paymentIdParams.parse(req.params);
  const result = await adminCheckPaymentService(id);
  return res.status(OK).json(result);
});

export const adminUpdatePaymentStatus = asyncHandler(async (req: Request & { user?: { id?: string } }, res: Response) => {
  if (!req.user?.id) {
    throw new AppError('User not authenticated', UNAUTHORIZED);
  }
  const { id } = paymentIdParams.parse(req.params);
  const input = adminUpdateStatusSchema.parse(req.body);
  const result = await adminUpdatePaymentStatusService(id, req.user.id, input);
  
  await logAudit({
    adminId: req.user.id,
    action: 'UPDATE_STATUS',
    entityType: 'Payment',
    entityId: id,
    field: 'status',
    ipAddress: req.ip,
  });

  return res.status(OK).json(result);
});
