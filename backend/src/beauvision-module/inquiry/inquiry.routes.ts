import { Router } from 'express';
import * as InquiryController from './inquiry.controller';
import { authenticate } from '../authentication/auth.middleware';

const router = Router();

router.post('/', InquiryController.createInquiry);
router.get('/', authenticate, InquiryController.getInquiries);
router.patch('/:id/status', authenticate, InquiryController.updateInquiryStatus);

export default router;
