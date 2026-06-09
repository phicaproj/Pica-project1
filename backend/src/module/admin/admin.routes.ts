import express from 'express';
import { isAdmin, authenticate } from '../../service/middleware/authMiddleware';
import {
  listUsers,
  listUserPayments,
  listUserSessions,
  showSessionById,
  showUserById,
  updateUserStatus,
} from './admin.controller';
import {
  addOption,
  createQuestion,
  deleteOption,
  deleteQuestion,
  getAdminQuestion,
  listAdminPillars,
  listAdminQuestions,
  savePillarWeights,
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
import {
  exportReportExcel,
  getReportBreakdowns,
  getReportFunnel,
  getReportKpis,
  getReportProblemAreas,
  getReportSessions,
} from '../report/report.controller';
import { listPayments } from '../payment/payment.controller';
import {
  adminCheckPayment,
  adminPaymentDetail,
  adminPaymentStats,
  adminUpdatePaymentStatus,
} from '../payment/payment.admin.controller';
import {
  getScoringSettings,
  updateScoringSettings,
} from '../scoring/scoring.admin.controller';

const adminRouter = express.Router();

// Every admin route is gated by authenticate + isAdmin.
adminRouter.use(authenticate, isAdmin);

// Admin users list — backs the admin Users table.
adminRouter.get('/users', listUsers);
adminRouter.get('/users/:id', showUserById);
// Suspend / reactivate. DISABLED blocks login and kills live tokens on the
// next request (authenticate middleware re-checks status per request).
adminRouter.patch('/users/:id/status', updateUserStatus);
// Per-user paginated histories (5/page) for the user detail page.
adminRouter.get('/users/:id/sessions', listUserSessions);
adminRouter.get('/users/:id/payments', listUserPayments);
// Full session breakdown (score + answered questions) for the session modal.
adminRouter.get('/sessions/:id', showSessionById);

// Question bank — authoring lives in the question module; mounted here behind
// the admin gate. The pillar list is the admin variant (weight, isActive,
// question counts) — a superset of the public shape, so existing consumers
// keep working. Bulk weight save backs the scoring page's single Save button.
adminRouter.get('/pillars', listAdminPillars);
adminRouter.patch('/pillars/weights', savePillarWeights);

// Score interpretation — the RED/AMBER/GREEN band cutoffs + display copy.
// Singleton settings row; edits apply to future submissions only.
adminRouter.get('/scoring-settings', getScoringSettings);
adminRouter.patch('/scoring-settings', updateScoringSettings);
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

// Reports & Analytics. The report module owns the services; mounted here so
// every /reports/* endpoint inherits the admin JWT + role guard. All endpoints
// share the same optional filter query set (see report.types.ts).
adminRouter.get('/reports/kpis', getReportKpis);
adminRouter.get('/reports/funnel', getReportFunnel);
adminRouter.get('/reports/problem-areas', getReportProblemAreas);
adminRouter.get('/reports/breakdowns', getReportBreakdowns);
adminRouter.get('/reports/sessions', getReportSessions);
adminRouter.get('/reports/export', exportReportExcel);

// Payments. The payment module owns the controllers; mounted here behind the
// admin gate. /stats is registered before /:id so it isn't captured as an id.
adminRouter.get('/payments', listPayments);
adminRouter.get('/payments/stats', adminPaymentStats);
adminRouter.get('/payments/:id', adminPaymentDetail);
// "Check payment": settled rows answer from our records; PENDING rows are
// re-verified against Paystack (and entitlements granted if it turns out paid).
adminRouter.post('/payments/:id/check', adminCheckPayment);
// Manual status override with required audit reason.
adminRouter.patch('/payments/:id/status', adminUpdatePaymentStatus);

// Plan pricing. The payment module owns the service; admin routes own access.
adminRouter.get('/pricing', listPricing);
adminRouter.post('/pricing', createPricing);
adminRouter.patch('/pricing/:id', updatePricing);
adminRouter.delete('/pricing/:id', deletePricing);

export default adminRouter;
