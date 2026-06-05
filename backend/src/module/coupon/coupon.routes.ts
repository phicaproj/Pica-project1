import { Router } from 'express';
import { authenticate } from '../../service/middleware/authMiddleware';
import { validateCoupon } from './coupon.controller';

const couponRouter = Router();

// User-facing: apply a coupon to a base price at checkout.
couponRouter.post('/validate', authenticate, validateCoupon);

export default couponRouter;
