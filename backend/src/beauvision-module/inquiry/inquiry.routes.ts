import { Router } from 'express';
import * as InquiryController from './inquiry.controller';
import { authenticate, hasPermission } from '../authentication/auth.middleware';

const router = Router();

router.post('/', InquiryController.createInquiry);
router.get('/', authenticate, hasPermission('inquiries:read'), InquiryController.getInquiries);
router.patch('/:id/status', authenticate, hasPermission('inquiries:write'), InquiryController.updateInquiryStatus);

export default router;
