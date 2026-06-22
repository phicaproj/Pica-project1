import { Request, Response } from 'express';
import asyncHandler from '../../service/shared/catchErrors';
import AppError from '../../service/shared/appError';
import { OK, CREATED, UNAUTHORIZED } from '../../service/shared/http';
import {
  subscribeSchema,
  createPlanSchema,
  updatePlanSchema,
  quotaCheckQuerySchema,
  type QuotaCheckResponse,
} from './subscription.types';
import {
  listPlansService,
  getMySubscriptionService,
  subscribeService,
  cancelSubscriptionService,
  adminListPlansService,
  adminCreatePlanService,
  adminUpdatePlanService,
  adminDeletePlanService,
  assertSubscriptionQuota,
  type SubscriptionQuotaKind,
} from './subscription.service';

// Map the wire-level enum (PHASE2A/PHASE2B_PILLAR/CONSULTATION — matches the
// Plan enum the FE already passes elsewhere) to the lowercase service kind
// the quota service expects. Keeping the wire upper-cased means we don't have
// to teach the FE about the service-internal lowercase naming.
const QUOTA_KIND_MAP: Record<'PHASE2A' | 'PHASE2B_PILLAR' | 'CONSULTATION', SubscriptionQuotaKind> = {
  PHASE2A: 'phase2a',
  PHASE2B_PILLAR: 'phase2b',
  CONSULTATION: 'consultation',
};

// Shared narrow type for the augmented Request. Mirrors what settings and
// payment controllers do — keeps these handlers decoupled from the global
// Express type augmentation while still being type-safe at the call site.
type AuthedRequest = Request & { user?: { id?: string } };

function requireUserId(req: Request): string {
  const userId = (req as AuthedRequest).user?.id;
  if (!userId) {
    throw new AppError('Authentication required', UNAUTHORIZED);
  }
  return userId;
}

// ──────────────────────────────────────────────────────────────────────────
// USER endpoints (mounted on /api/subscription)
// ──────────────────────────────────────────────────────────────────────────

export const listPlans = asyncHandler(async (_req: Request, res: Response) => {
  const result = await listPlansService();
  return res.status(OK).json(result);
});

export const getMySubscription = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const result = await getMySubscriptionService(userId);
  return res.status(OK).json(result);
});

export const subscribe = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const input = subscribeSchema.parse(req.body);
  const result = await subscribeService(userId, input.planId, {
    couponCode: input.couponCode,
    interval: input.interval,
  });
  return res.status(OK).json(result);
});

export const cancelSubscription = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const result = await cancelSubscriptionService(userId);
  return res.status(OK).json(result);
});

// Section R-2 — read-only quota probe. Replaces the wasteful initPayment call
// the FE used to make just to learn whether a paid checkout could be skipped.
// No DB writes; safe to call repeatedly. Returns false-on-no-sub so the caller
// can branch without checking for 404.
export const checkQuota = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const { kind } = quotaCheckQuerySchema.parse(req.query);
  const verdict = await assertSubscriptionQuota(userId, QUOTA_KIND_MAP[kind]);
  const payload: QuotaCheckResponse = {
    message: 'Quota check completed',
    hasQuota: verdict.hasQuota,
    kind,
  };
  return res.status(OK).json(payload);
});

// ──────────────────────────────────────────────────────────────────────────
// ADMIN endpoints (mounted on /api/admin/subscription-plans)
// ──────────────────────────────────────────────────────────────────────────

export const adminListPlans = asyncHandler(async (_req: Request, res: Response) => {
  const result = await adminListPlansService();
  return res.status(OK).json(result);
});

export const adminCreatePlan = asyncHandler(async (req: Request, res: Response) => {
  const input = createPlanSchema.parse(req.body);
  const result = await adminCreatePlanService(input);
  return res.status(CREATED).json(result);
});

export const adminUpdatePlan = asyncHandler(async (req: Request, res: Response) => {
  const input = updatePlanSchema.parse(req.body);
  const result = await adminUpdatePlanService(String(req.params.id), input);
  return res.status(OK).json(result);
});

export const adminDeletePlan = asyncHandler(async (req: Request, res: Response) => {
  const result = await adminDeletePlanService(String(req.params.id));
  return res.status(OK).json(result);
});
