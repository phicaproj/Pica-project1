import { Router } from 'express';
import * as CouponController from './coupon.controller';
import { authenticate, hasPermission, hasAnyPermission } from '../authentication/auth.middleware';

/**
 * Public/user-facing coupon routes (mounted at /api/beauvision/coupon).
 * Used by the checkout drawer to quote a discount before payment.
 */
export const couponPublicRouter = Router();

couponPublicRouter.post('/validate', CouponController.validateCoupon);

/**
 * Admin coupon management (mounted at /api/beauvision/admin/coupons).
 * Super admins (OWNER) always pass; payment-privileged admins need
 * `payments:write` to create/edit/toggle/delete and at least one of
 * `payments:read`/`payments:write` to list.
 */
export const couponAdminRouter = Router();

couponAdminRouter.get(
  '/',
  authenticate,
  hasAnyPermission('payments:read', 'payments:write'),
  CouponController.listCoupons
);
couponAdminRouter.get(
  '/:id',
  authenticate,
  hasAnyPermission('payments:read', 'payments:write'),
  CouponController.getCoupon
);
couponAdminRouter.post(
  '/',
  authenticate,
  hasPermission('payments:write'),
  CouponController.createCoupon
);
couponAdminRouter.patch(
  '/:id',
  authenticate,
  hasPermission('payments:write'),
  CouponController.updateCoupon
);
couponAdminRouter.delete(
  '/:id',
  authenticate,
  hasPermission('payments:write'),
  CouponController.deleteCoupon
);
