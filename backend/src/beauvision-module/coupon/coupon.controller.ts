import { Request, Response } from 'express';
import { CREATED, OK } from '../../service/shared/http';
import catchErrors from '../../service/shared/catchErrors';
import { BeauvisionCouponService } from './coupon.service';
import {
  CouponIdParamSchema,
  CreateCouponSchema,
  ListCouponsQuerySchema,
  UpdateCouponSchema,
  ValidateCouponSchema,
} from './coupon.types';

export const createCoupon = catchErrors(async (req: Request, res: Response) => {
  const input = CreateCouponSchema.parse(req.body);
  const coupon = await BeauvisionCouponService.createCoupon(input);
  res.status(CREATED).json({
    status: true,
    message: 'Coupon created successfully',
    data: coupon,
  });
});

export const listCoupons = catchErrors(async (req: Request, res: Response) => {
  const query = ListCouponsQuerySchema.parse(req.query);
  const coupons = await BeauvisionCouponService.listCoupons(query);
  res.status(OK).json({
    status: true,
    message: 'Coupons retrieved successfully',
    data: coupons,
  });
});

export const getCoupon = catchErrors(async (req: Request, res: Response) => {
  const { id } = CouponIdParamSchema.parse(req.params);
  const coupon = await BeauvisionCouponService.getCouponById(id);
  res.status(OK).json({
    status: true,
    message: 'Coupon retrieved successfully',
    data: coupon,
  });
});

export const updateCoupon = catchErrors(async (req: Request, res: Response) => {
  const { id } = CouponIdParamSchema.parse(req.params);
  const input = UpdateCouponSchema.parse(req.body);
  const coupon = await BeauvisionCouponService.updateCoupon(id, input);
  res.status(OK).json({
    status: true,
    message: 'Coupon updated successfully',
    data: coupon,
  });
});

export const deleteCoupon = catchErrors(async (req: Request, res: Response) => {
  const { id } = CouponIdParamSchema.parse(req.params);
  const result = await BeauvisionCouponService.deleteCoupon(id);
  res.status(OK).json({
    status: true,
    message: result.message,
  });
});

export const validateCoupon = catchErrors(async (req: Request, res: Response) => {
  const input = ValidateCouponSchema.parse(req.body);
  const pricing = await BeauvisionCouponService.validateAndPrice(input.code, input.basePrice);
  res.status(OK).json({
    status: true,
    message: 'Coupon applied',
    data: pricing,
  });
});
