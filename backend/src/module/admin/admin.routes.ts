import express from 'express';
import { isAdmin, authenticate, hasPermission } from '../../service/middleware/authMiddleware';
import {
  listUsers,
  listUserPayments,
  listUserSessions,
  showSessionById,
  showUserById,
  updateUserStatus,
  listRoles,
  createRole,
  updateRole,
  deleteRole,
  assignRoleToAdmin,
  inviteAdmin,
  updateAdminAccess,
  getMyProfile,
  updateMyProfile,
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
import { createCoupon, deleteCoupon, listCoupons, updateCoupon } from '../coupon/coupon.controller';
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
import { getScoringSettings, updateScoringSettings } from '../scoring/scoring.admin.controller';
import { getAppSettings, updateAppSettings } from '../settings/settings.controller';
import {
  adminListPlans,
  adminCreatePlan,
  adminUpdatePlan,
  adminDeletePlan,
} from '../subscription/subscription.controller';
import {
  adminListTiers as adminListConsultationTiers,
  adminCreateTier as adminCreateConsultationTier,
  adminUpdateTier as adminUpdateConsultationTier,
  adminDeleteTier as adminDeleteConsultationTier,
  adminListBookings as adminListConsultationBookings,
  adminConfirmBooking as adminConfirmConsultationBooking,
  adminUpdateBookingStatus as adminUpdateConsultationBookingStatus,
  adminUpdateBookingNotes as adminUpdateConsultationBookingNotes,
  adminGetClientHistory as adminGetConsultationClientHistory,
} from '../consultation/consultation.controller';

const adminRouter = express.Router();

// Every admin route is gated by authenticate + isAdmin.
adminRouter.use(authenticate, isAdmin);

// Admin self-service profile (personal info). No extra permission gate beyond
// authenticate + isAdmin — an admin always manages their own profile. Declared
// before the parameterized /users/:id routes so "me" is never captured as an id.
adminRouter.get('/me', getMyProfile);
adminRouter.patch('/me', updateMyProfile);

// Admin roles and permissions routes
adminRouter.get('/roles', hasPermission('settings:read'), listRoles);
adminRouter.post('/roles', hasPermission('settings:write'), createRole);
adminRouter.patch('/roles/:id', hasPermission('settings:write'), updateRole);
adminRouter.delete('/roles/:id', hasPermission('settings:write'), deleteRole);
adminRouter.patch('/users/:id/role', hasPermission('users:write'), assignRoleToAdmin);
// Edit an existing admin's per-person access (department + granular permissions).
adminRouter.patch('/users/:id/access', hasPermission('users:write'), updateAdminAccess);
// Onboard a new admin: creates an ADMIN account with no password and emails a
// 24h tokenized activation link. Gated like other user-modifying actions.
adminRouter.post('/invite', hasPermission('users:write'), inviteAdmin);

// Admin users list — backs the admin Users table.
adminRouter.get('/users', hasPermission('users:read'), listUsers);
adminRouter.get('/users/:id', hasPermission('users:read'), showUserById);
// Suspend / reactivate. DISABLED blocks login and kills live tokens on the
// next request (authenticate middleware re-checks status per request).
adminRouter.patch('/users/:id/status', hasPermission('users:write'), updateUserStatus);
// Per-user paginated histories (5/page) for the user detail page.
adminRouter.get('/users/:id/sessions', hasPermission('users:read'), listUserSessions);
adminRouter.get('/users/:id/payments', hasPermission('users:read'), listUserPayments);
// Full session breakdown (score + answered questions) for the session modal.
adminRouter.get('/sessions/:id', hasPermission('users:read'), showSessionById);

// Question bank — authoring lives in the question module; mounted here behind
// the admin gate. The pillar list is the admin variant (weight, isActive,
// question counts) — a superset of the public shape, so existing consumers
// keep working. Bulk weight save backs the scoring page's single Save button.
adminRouter.get('/pillars', hasPermission('questions:read'), listAdminPillars);
adminRouter.patch('/pillars/weights', hasPermission('questions:write'), savePillarWeights);

// Score interpretation — the RED/AMBER/GREEN band cutoffs + display copy.
// Singleton settings row; edits apply to future submissions only.
adminRouter.get('/scoring-settings', hasPermission('scoring:read'), getScoringSettings);
adminRouter.patch('/scoring-settings', hasPermission('scoring:write'), updateScoringSettings);

// App-wide settings — USD→NGN rate, storefront toggles, and the Phase 2B
// bundle discount. Singleton row, admin-editable. Gated under the payments
// bucket (ledger:*) since this is payment/pricing config and the editor UI
// now lives in the /admin/subscription "App Settings" tab.
adminRouter.get('/app-settings', hasPermission('ledger:read'), getAppSettings);
adminRouter.patch('/app-settings', hasPermission('ledger:write'), updateAppSettings);
adminRouter.get('/questions', hasPermission('questions:read'), listAdminQuestions);
adminRouter.post('/questions', hasPermission('questions:write'), createQuestion);
adminRouter.get('/questions/:id', hasPermission('questions:read'), getAdminQuestion);
adminRouter.patch('/questions/:id', hasPermission('questions:write'), updateQuestion);
adminRouter.delete('/questions/:id', hasPermission('questions:write'), deleteQuestion);
adminRouter.post('/questions/:id/options', hasPermission('questions:write'), addOption);
adminRouter.patch('/options/:id', hasPermission('questions:write'), updateOption);
adminRouter.delete('/options/:id', hasPermission('questions:write'), deleteOption);

// Per-user coupons / discounts.
adminRouter.get('/coupons', hasPermission('coupons:read'), listCoupons);
adminRouter.post('/coupons', hasPermission('coupons:write'), createCoupon);
adminRouter.patch('/coupons/:id', hasPermission('coupons:write'), updateCoupon);
adminRouter.delete('/coupons/:id', hasPermission('coupons:write'), deleteCoupon);

// Reports & Analytics. The report module owns the services; mounted here so
// every /reports/* endpoint inherits the admin JWT + role guard. All endpoints
// share the same optional filter query set (see report.types.ts).
adminRouter.get('/reports/kpis', hasPermission('analytics:read'), getReportKpis);
adminRouter.get('/reports/funnel', hasPermission('analytics:read'), getReportFunnel);
adminRouter.get('/reports/problem-areas', hasPermission('analytics:read'), getReportProblemAreas);
adminRouter.get('/reports/breakdowns', hasPermission('analytics:read'), getReportBreakdowns);
adminRouter.get('/reports/sessions', hasPermission('analytics:read'), getReportSessions);
adminRouter.get('/reports/export', hasPermission('analytics:read'), exportReportExcel);

// Payments. The payment module owns the controllers; mounted here behind the
// admin gate. /stats is registered before /:id so it isn't captured as an id.
adminRouter.get('/payments', hasPermission('ledger:read'), listPayments);
adminRouter.get('/payments/stats', hasPermission('ledger:read'), adminPaymentStats);
adminRouter.get('/payments/:id', hasPermission('ledger:read'), adminPaymentDetail);
// "Check payment": settled rows answer from our records; PENDING rows are
// re-verified against Paystack (and entitlements granted if it turns out paid).
adminRouter.post('/payments/:id/check', hasPermission('ledger:write'), adminCheckPayment);
// Manual status override with required audit reason.
adminRouter.patch('/payments/:id/status', hasPermission('ledger:write'), adminUpdatePaymentStatus);

// Plan pricing. The payment module owns the service; admin routes own access.
adminRouter.get('/pricing', hasPermission('ledger:read'), listPricing);
adminRouter.post('/pricing', hasPermission('ledger:write'), createPricing);
adminRouter.patch('/pricing/:id', hasPermission('ledger:write'), updatePricing);
adminRouter.delete('/pricing/:id', hasPermission('ledger:write'), deletePricing);

// Subscription tier CRUD. Owned by the subscription module; mounted here
// behind the admin gate. Uses the ledger permission bucket because tiers map
// directly to recurring revenue; an admin who can edit one-off pricing can
// edit subscription pricing too.
adminRouter.get('/subscription-plans', hasPermission('ledger:read'), adminListPlans);
adminRouter.post('/subscription-plans', hasPermission('ledger:write'), adminCreatePlan);
adminRouter.patch('/subscription-plans/:id', hasPermission('ledger:write'), adminUpdatePlan);
adminRouter.delete('/subscription-plans/:id', hasPermission('ledger:write'), adminDeletePlan);

// Consultation tier CRUD + booking management. Tiers share the ledger
// permission bucket (same shape as subscription/pricing). Booking management
// uses a separate 'consultations:*' bucket — operations staff might need
// to confirm bookings without seeing revenue, and vice versa.
adminRouter.get('/consultation-tiers', hasPermission('ledger:read'), adminListConsultationTiers);
adminRouter.post('/consultation-tiers', hasPermission('ledger:write'), adminCreateConsultationTier);
adminRouter.patch('/consultation-tiers/:id', hasPermission('ledger:write'), adminUpdateConsultationTier);
adminRouter.delete('/consultation-tiers/:id', hasPermission('ledger:write'), adminDeleteConsultationTier);

adminRouter.get('/consultation-bookings', hasPermission('consultations:read'), adminListConsultationBookings);
adminRouter.patch(
  '/consultation-bookings/:id/confirm',
  hasPermission('consultations:write'),
  adminConfirmConsultationBooking,
);
adminRouter.patch(
  '/consultation-bookings/:id/status',
  hasPermission('consultations:write'),
  adminUpdateConsultationBookingStatus,
);

// Admin Consultation Notes feature — view a booking's user + their recent
// assessment history, and save free-form admin feedback against the booking.
// Both routes reuse the existing consultations:* permission pair; no new
// permission keys were added.
adminRouter.get(
  '/consultation-bookings/:id/client-history',
  hasPermission('consultations:read'),
  adminGetConsultationClientHistory,
);
adminRouter.patch(
  '/consultation-bookings/:id/notes',
  hasPermission('consultations:write'),
  adminUpdateConsultationBookingNotes,
);

export default adminRouter;
