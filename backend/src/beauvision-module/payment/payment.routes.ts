import { Router } from 'express';
import * as PaymentController from './payment.controller';
import { authenticate, hasPermission } from '../authentication/auth.middleware';

const router = Router();

router.post('/initialize', PaymentController.initializePayment);
router.get('/', authenticate, hasPermission('read'), PaymentController.getPayments);
router.get('/:reference', PaymentController.getPaymentByReference);
router.get('/:reference/verify', PaymentController.verifyPaymentManual);

export default router;
