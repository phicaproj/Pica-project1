import { Router } from 'express';
import * as PaymentController from './payment.controller';

const router = Router();

router.post('/initialize', PaymentController.initializePayment);
router.get('/', PaymentController.getPayments);
router.get('/:reference', PaymentController.getPaymentByReference);

export default router;
