import { Request, Response } from 'express';
import asyncHandler from '../../service/shared/catchErrors';
import AppError from '../../service/shared/appError';
import { OK, CREATED, UNAUTHORIZED } from '../../service/shared/http';
import {
  subscribeSchema,
  createPlanSchema,
  updatePlanSchema,
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
} from './subscription.service';

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
  });
  return res.status(OK).json(result);
});

export const cancelSubscription = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const result = await cancelSubscriptionService(userId);
  return res.status(OK).json(result);
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
