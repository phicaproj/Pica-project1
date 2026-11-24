import { Router } from 'express';
import * as FaqController from './faq.controller';
import { authenticate, hasPermission, hasAnyPermission } from '../authentication/auth.middleware';

/**
 * Public FAQ list (mounted at /api/beauvision/faqs).
 */
export const faqPublicRouter = Router();
faqPublicRouter.get('/', FaqController.getFaqs);

/**
 * Admin FAQ management (mounted at /api/beauvision/admin/faqs).
 */
export const faqAdminRouter = Router();
faqAdminRouter.get(
  '/',
  authenticate,
  hasAnyPermission('faqs:read', 'faqs:write'),
  FaqController.getFaqs
);
faqAdminRouter.post('/', authenticate, hasPermission('faqs:write'), FaqController.createFaq);
faqAdminRouter.patch('/:id', authenticate, hasPermission('faqs:write'), FaqController.updateFaq);
faqAdminRouter.delete(
  '/:id',
  authenticate,
  hasPermission('faqs:delete'),
  FaqController.deleteFaq
);
