import { Router } from 'express';
import { authenticate } from '../../service/middleware/authMiddleware';
import {
  bookConsultation,
  listMyCompletedResults,
  listMyConsultations,
  listTiers,
} from './consultation.controller';

// Public + auth-protected user routes. The tier catalogue is public so the
// landing page can show pricing; the rest require a session.
const consultationRouter = Router();

consultationRouter.get('/tiers', listTiers);

consultationRouter.get('/me', authenticate, listMyConsultations);
consultationRouter.get('/me/results', authenticate, listMyCompletedResults);
consultationRouter.post('/book', authenticate, bookConsultation);

// Admin endpoints are mounted from module/admin/admin.routes.ts under
// /api/admin/consultation-{tiers,bookings}/* so they inherit the admin gate
// + the consultations:* permission guards.

export default consultationRouter;
