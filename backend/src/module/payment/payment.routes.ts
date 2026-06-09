import { Router, raw } from 'express';
import { authenticate } from '../../service/middleware/authMiddleware';
import {
  handlePaymentWebhook,
  initPayment,
  verifyPayment,
  myPaymentsHistory,
} from './payment.controller';
import { getPublicPricing } from './pricing.controller';

const paymentRouter = Router();

paymentRouter.post('/webhook', raw({ type: 'application/json' }), handlePaymentWebhook);

// Public pricing for landing pages and checkout display.
paymentRouter.get('/pricing', getPublicPricing);

// Auth-protected user endpoints
paymentRouter.post('/init', authenticate, initPayment);
paymentRouter.get('/verify/:reference', authenticate, verifyPayment);
paymentRouter.get('/history', authenticate, myPaymentsHistory);

// Admin payment endpoints live in module/admin/admin.routes.ts under
// /api/admin/payments/* — the payment module only owns the controllers.

export default paymentRouter;
