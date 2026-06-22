import { Request, Response } from 'express';
import asyncHandler from '../../service/shared/catchErrors';
import AppError from '../../service/shared/appError';
import { CREATED, OK, UNAUTHORIZED } from '../../service/shared/http';
import {
  bookConsultationSchema,
  confirmBookingSchema,
  createConsultationTierSchema,
  listAdminBookingsQuerySchema,
  updateAdminNotesSchema,
  updateBookingStatusSchema,
  updateConsultationTierSchema,
} from './consultation.types';
import {
  adminConfirmBookingService,
  adminCreateTierService,
  adminDeleteTierService,
  adminGetClientHistoryService,
  adminListBookingsService,
  adminListTiersService,
  adminUpdateBookingNotesService,
  adminUpdateBookingStatusService,
  adminUpdateTierService,
  bookConsultationService,
  listMyCompletedResultsService,
  listMyConsultationsService,
  listMyPhase2ACreditsService,
  listTiersService,
} from './consultation.service';

type AuthedRequest = Request & { user?: { id?: string } };

function requireUserId(req: Request): string {
  const userId = (req as AuthedRequest).user?.id;
  if (!userId) {
    throw new AppError('Authentication required', UNAUTHORIZED);
  }
  return userId;
}

// ──────────────────────────────────────────────────────────────────────────
// USER endpoints
// ──────────────────────────────────────────────────────────────────────────

export const listTiers = asyncHandler(async (_req: Request, res: Response) => {
  const result = await listTiersService();
  return res.status(OK).json(result);
});

export const listMyCompletedResults = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const result = await listMyCompletedResultsService(userId);
    return res.status(OK).json(result);
  },
);

export const listMyConsultations = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const result = await listMyConsultationsService(userId);
    return res.status(OK).json(result);
  },
);

// Unconsumed, unexpired PICA 2A credits — backs the strategic-scan CTA banner
// that tells the user "your consultation credit covers this — no charge"
// before they hit Start.
export const listMyPhase2ACredits = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const result = await listMyPhase2ACreditsService(userId);
    return res.status(OK).json(result);
  },
);

export const bookConsultation = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const input = bookConsultationSchema.parse(req.body);
  const result = await bookConsultationService(userId, input);
  return res.status(CREATED).json(result);
});

// ──────────────────────────────────────────────────────────────────────────
// ADMIN endpoints (mounted from admin.routes.ts)
// ──────────────────────────────────────────────────────────────────────────

export const adminListTiers = asyncHandler(async (_req: Request, res: Response) => {
  const result = await adminListTiersService();
  return res.status(OK).json(result);
});

export const adminCreateTier = asyncHandler(async (req: Request, res: Response) => {
  const input = createConsultationTierSchema.parse(req.body);
  const result = await adminCreateTierService(input);
  return res.status(CREATED).json(result);
});

export const adminUpdateTier = asyncHandler(async (req: Request, res: Response) => {
  const input = updateConsultationTierSchema.parse(req.body);
  const result = await adminUpdateTierService(String(req.params.id), input);
  return res.status(OK).json(result);
});

export const adminDeleteTier = asyncHandler(async (req: Request, res: Response) => {
  const result = await adminDeleteTierService(String(req.params.id));
  return res.status(OK).json(result);
});

export const adminListBookings = asyncHandler(async (req: Request, res: Response) => {
  const query = listAdminBookingsQuerySchema.parse(req.query);
  const result = await adminListBookingsService(query);
  return res.status(OK).json(result);
});

export const adminConfirmBooking = asyncHandler(async (req: Request, res: Response) => {
  const input = confirmBookingSchema.parse(req.body);
  const result = await adminConfirmBookingService(String(req.params.id), input);
  return res.status(OK).json(result);
});

export const adminUpdateBookingStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const input = updateBookingStatusSchema.parse(req.body);
    const result = await adminUpdateBookingStatusService(String(req.params.id), input);
    return res.status(OK).json(result);
  },
);

// Save admin-authored notes against a booking. The acting admin's user id
// comes off the JWT (set by `authenticate` upstream on the admin router) so
// the FE never has to send it — the audit trail is authoritative.
export const adminUpdateBookingNotes = asyncHandler(
  async (req: Request, res: Response) => {
    const adminId = requireUserId(req);
    const input = updateAdminNotesSchema.parse(req.body);
    const result = await adminUpdateBookingNotesService(
      String(req.params.id),
      adminId,
      input,
    );
    return res.status(OK).json(result);
  },
);

// Pull the booking's user + their last 5 completed Phase 2A/2B results
// (with R2 PDF URLs) — backs the ClientHistoryModal on the admin inbox.
export const adminGetClientHistory = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await adminGetClientHistoryService(String(req.params.id));
    return res.status(OK).json(result);
  },
);
