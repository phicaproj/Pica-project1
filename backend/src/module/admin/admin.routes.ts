import express from 'express';
import { isAdmin, authenticate } from '../../service/middleware/authMiddleware';
import { listUsers, showUserById } from './admin.controller';
import { getAllPillars } from '../question/question.controller';
import {
  addOption,
  createQuestion,
  deleteOption,
  deleteQuestion,
  getAdminQuestion,
  listAdminQuestions,
  updateOption,
  updateQuestion,
} from '../question/question.admin.controller';
import {
  createCoupon,
  deleteCoupon,
  listCoupons,
  updateCoupon,
} from '../coupon/coupon.controller';
import {
  createPricing,
  deletePricing,
  listPricing,
  updatePricing,
} from '../payment/pricing.controller';

const adminRouter = express.Router();

// Every admin route is gated by authenticate + isAdmin.
adminRouter.use(authenticate, isAdmin);

// Admin users list — backs the admin Users table.
adminRouter.get('/users', listUsers);
adminRouter.get('/users/:id', showUserById);

// Question bank — authoring lives in the question module; mounted here behind
// the admin gate. Pillars reuse the existing question-module list service.
adminRouter.get('/pillars', getAllPillars);
adminRouter.get('/questions', listAdminQuestions);
adminRouter.post('/questions', createQuestion);
adminRouter.get('/questions/:id', getAdminQuestion);
adminRouter.patch('/questions/:id', updateQuestion);
adminRouter.delete('/questions/:id', deleteQuestion);
adminRouter.post('/questions/:id/options', addOption);
adminRouter.patch('/options/:id', updateOption);
adminRouter.delete('/options/:id', deleteOption);

// Per-user coupons / discounts.
adminRouter.get('/coupons', listCoupons);
adminRouter.post('/coupons', createCoupon);
adminRouter.patch('/coupons/:id', updateCoupon);
adminRouter.delete('/coupons/:id', deleteCoupon);

// Plan pricing. The payment module owns the service; admin routes own access.
adminRouter.get('/pricing', listPricing);
adminRouter.post('/pricing', createPricing);
adminRouter.patch('/pricing/:id', updatePricing);
adminRouter.delete('/pricing/:id', deletePricing);

export default adminRouter;
