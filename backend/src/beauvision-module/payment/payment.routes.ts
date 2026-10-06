import { Router } from 'express';
import * as PaymentController from './payment.controller';

const router = Router();

router.post('/initialize', PaymentController.initializePayment);
router.get('/', PaymentController.getPayments);
router.get('/:reference', PaymentController.getPaymentByReference);
router.get('/:reference/verify', PaymentController.verifyPaymentManual);

export default router;
