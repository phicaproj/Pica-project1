import { Router } from 'express';
import { authenticate } from '../../service/middleware/authMiddleware';
import {
  listPlans,
  getMySubscription,
  subscribe,
  cancelSubscription,
} from './subscription.controller';

// Public + auth-protected user routes. The plan catalogue is public so the
// landing page can show it; everything else requires a session.
const subscriptionRouter = Router();

subscriptionRouter.get('/plans', listPlans);

subscriptionRouter.get('/me', authenticate, getMySubscription);
subscriptionRouter.post('/subscribe', authenticate, subscribe);
subscriptionRouter.post('/cancel', authenticate, cancelSubscription);

// Admin tier CRUD is mounted from module/admin/admin.routes.ts under
// /api/admin/subscription-plans/* so it inherits the admin gate + the
// hasPermission('settings:*') guards.

export default subscriptionRouter;
