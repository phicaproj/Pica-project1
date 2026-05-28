import { Router, raw } from 'express';
import { authenticate, isAdmin } from '../../service/middleware/authMiddleware';
import {
  handlePaymentWebhook,
  initPayment,
  listPayments,
  verifyPayment,
  myPaymentsHistory,
} from './payment.controller';

const paymentRouter = Router();

paymentRouter.post('/webhook', raw({ type: 'application/json' }), handlePaymentWebhook);

// Auth-protected user endpoints
paymentRouter.post('/init', authenticate, initPayment);
paymentRouter.get('/verify/:reference', authenticate, verifyPayment);
paymentRouter.get('/history', authenticate, myPaymentsHistory);

// Admin transactions list
paymentRouter.get('/admin', authenticate, isAdmin, listPayments);

export default paymentRouter;
