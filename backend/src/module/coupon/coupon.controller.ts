import { Request, Response } from 'express';
import asyncHandler from '../../service/shared/catchErrors';
import AppError from '../../service/shared/appError';
import { CREATED, OK, UNAUTHORIZED } from '../../service/shared/http';
import {
  couponIdParamSchema,
  createCouponSchema,
  listCouponsQuerySchema,
  updateCouponSchema,
  validateCouponSchema,
} from './coupon.types';
import {
  createCouponService,
  deleteCouponService,
  listCouponsService,
  updateCouponService,
  validateAndPriceCoupon,
} from './coupon.service';

// ── Admin (gated by authenticate + isAdmin at the route layer) ──────────────

export const createCoupon = asyncHandler(async (req: Request, res: Response) => {
  const input = createCouponSchema.parse(req.body);
  const result = await createCouponService(input);
  return res.status(CREATED).json(result);
});

export const listCoupons = asyncHandler(async (req: Request, res: Response) => {
  const query = listCouponsQuerySchema.parse(req.query);
  const result = await listCouponsService(query);
  return res.status(OK).json(result);
});

export const updateCoupon = asyncHandler(async (req: Request, res: Response) => {
  const { id } = couponIdParamSchema.parse(req.params);
  const input = updateCouponSchema.parse(req.body);
  const result = await updateCouponService(id, input);
  return res.status(OK).json(result);
});

export const deleteCoupon = asyncHandler(async (req: Request, res: Response) => {
  const { id } = couponIdParamSchema.parse(req.params);
  const result = await deleteCouponService(id);
  return res.status(OK).json(result);
});

// ── User-facing (authenticate) ──────────────────────────────────────────────

export const validateCoupon = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id || req.user?.role !== 'USER') {
    throw new AppError('Authentication required', UNAUTHORIZED);
  }
  const input = validateCouponSchema.parse(req.body);
  const pricing = await validateAndPriceCoupon(input.code, req.user.id, input.basePrice, {
    plan: input.plan,
    pillarId: input.pillarId,
  });
  return res.status(OK).json({ message: 'Coupon applied', pricing });
});
