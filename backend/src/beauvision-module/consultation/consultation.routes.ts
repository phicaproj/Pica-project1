import { Router } from 'express';
import {
  getConsultationPlan,
  initializeConsultation,
  updateConsultationPlan,
  verifyConsultation,
} from './consultation.controller';
import { authenticate, hasPermission } from '../authentication/auth.middleware';
import { paymentInitLimiter } from '../../service/shared/rateLimiter';

const consultationRouter = Router();

// Public
consultationRouter.get('/plan', getConsultationPlan);
consultationRouter.post('/initialize', paymentInitLimiter, initializeConsultation);
consultationRouter.get('/verify/:reference', verifyConsultation);

// Admin
consultationRouter.patch(
  '/plan',
  authenticate,
  hasPermission('payments:write'),
  updateConsultationPlan
);

export default consultationRouter;
